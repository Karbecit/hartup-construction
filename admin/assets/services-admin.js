(function () {
  'use strict';

  const config = window.HartupServicesAdmin || {};
  const list = document.getElementById('menu-sort-list');
  const status = document.getElementById('menu-order-status');
  if (!list) return;

  let dragged = null;

  list.querySelectorAll('.menu-sort-item').forEach(function (item) {
    item.addEventListener('dragstart', function () {
      dragged = item;
      item.classList.add('is-dragging');
    });
    item.addEventListener('dragend', function () {
      item.classList.remove('is-dragging');
      dragged = null;
      saveOrder();
    });
    item.addEventListener('dragover', function (event) {
      event.preventDefault();
      if (!dragged || dragged === item) return;
      const rect = item.getBoundingClientRect();
      const after = event.clientX > rect.left + rect.width / 2;
      if (after) item.after(dragged);
      else item.before(dragged);
    });
  });

  function saveOrder() {
    const order = Array.from(list.querySelectorAll('.menu-sort-item')).map(function (item) {
      return item.dataset.slug;
    });

    if (status) status.textContent = 'Saving menu order…';

    fetch('/admin/services.php', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
      },
      body: JSON.stringify({
        action: 'save_menu_order',
        csrf_token: config.csrfToken,
        order: order,
      }),
    })
      .then(function (response) {
        return response.json();
      })
      .then(function (result) {
        if (!result.success) throw new Error('Save failed');
        if (status) status.textContent = 'Menu order saved';
        window.setTimeout(function () {
          if (status) status.textContent = '';
        }, 2000);
      })
      .catch(function () {
        if (status) status.textContent = 'Could not save menu order';
      });
  }
})();
