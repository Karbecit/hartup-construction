(function () {
  'use strict';

  var config = window.NanaLeeThemes || {};
  var csrfToken = config.csrfToken || '';
  var originalId = config.originalId || 'original';

  var state = {
    original: null,
    fontTypes: {},
    colorGroups: {},
    fontCatalog: [],
    targets: {},
    typographyFields: {},
    savedThemes: [],
    activeThemeId: originalId,
    currentThemeId: originalId,
    draft: null,
    editingSaved: false,
    selectedTarget: null
  };

  var loadedGoogleFonts = {};

  function ready(fn) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', fn);
    } else {
      fn();
    }
  }

  function $(id) {
    return document.getElementById(id);
  }

  function showStatus(message, type) {
    var el = $('themes-status');
    if (!el) return;
    el.textContent = message;
    el.className = 'admin-alert admin-alert--' + (type === 'error' ? 'error' : 'success');
    el.hidden = false;
    window.setTimeout(function () {
      el.hidden = true;
    }, 5000);
  }

  function api(action, payload) {
    return fetch('/admin/themes.php', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest'
      },
      body: JSON.stringify(Object.assign({ action: action, csrf_token: csrfToken }, payload || {}))
    }).then(function (res) {
      return res.json().then(function (data) {
        if (!res.ok && !data.message) {
          throw new Error('Request failed.');
        }
        return data;
      });
    });
  }

  function cloneTheme(theme) {
    return JSON.parse(JSON.stringify(theme));
  }

  function fontSample(typeKey) {
    var demo = config.demoContent || {};
    var samples = {
      display: demo.fontDisplay || demo.heroHeading || demo.siteName || 'Sample heading',
      subheading: demo.fontSubheading || demo.servicesHeading || 'Sample subheading',
      body: demo.fontBody || demo.heroLead || 'Sample body text.',
      nav: demo.fontNav || 'What we do · About',
      button: demo.fontButton || demo.navCta || 'Get in Touch'
    };
    return samples[typeKey] || 'Sample text';
  }

  function ensureGoogleFont(family) {
    if (!family || loadedGoogleFonts[family]) return;
    loadedGoogleFonts[family] = true;
    var link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css2?family=' + encodeURIComponent(family).replace(/%20/g, '+') + ':wght@400;500;600;700&display=swap';
    document.head.appendChild(link);
  }

  function loadGoogleFontsForTheme(theme) {
    Object.keys(theme.fonts || {}).forEach(function (key) {
      var font = theme.fonts[key];
      if (font && font.source === 'google') {
        ensureGoogleFont(font.family);
      }
    });
    (state.fontCatalog || []).forEach(function (entry) {
      if (entry.source === 'google') {
        ensureGoogleFont(entry.family);
      }
    });
  }

  function cssVarName(key) {
    return '--preview-' + key.replace(/_/g, '-');
  }

  function typographyVarName(role, field) {
    return '--preview-type-' + role.replace(/_/g, '-') + '-' + field.replace(/_/g, '-');
  }

  function applyPreview(theme) {
    var preview = $('theme-preview');
    if (!preview || !theme) return;

    Object.keys(theme.colors || {}).forEach(function (key) {
      preview.style.setProperty(cssVarName(key), theme.colors[key]);
    });

    Object.keys(theme.fonts || {}).forEach(function (key) {
      var font = theme.fonts[key];
      if (!font) return;
      var stack = font.source === 'google'
        ? '"' + font.family + '", sans-serif'
        : font.family + ', sans-serif';
      preview.style.setProperty('--preview-font-' + key.replace(/_/g, '-'), stack);
    });

    Object.keys(theme.typography || {}).forEach(function (role) {
      var values = theme.typography[role];
      if (!values) return;
      Object.keys(values).forEach(function (field) {
        preview.style.setProperty(typographyVarName(role, field), values[field]);
      });
    });
  }

  function readDraftFromControls() {
    var draft = cloneTheme(state.draft);
    draft.name = draft.name || 'Untitled theme';

    document.querySelectorAll('.theme-font-picker[data-type]').forEach(function (picker) {
      var typeKey = picker.getAttribute('data-type');
      var selected = picker.querySelector('.theme-font-option.is-selected');
      if (selected && typeKey) {
        draft.fonts[typeKey] = {
          family: selected.getAttribute('data-family'),
          source: selected.getAttribute('data-source')
        };
      }
    });

    document.querySelectorAll('.theme-color-input[data-color]').forEach(function (control) {
      var colorKey = control.getAttribute('data-color');
      var textInput = control.querySelector('input[type="text"]');
      var colorInput = control.querySelector('input[type="color"]');
      if (textInput && colorKey) {
        draft.colors[colorKey] = textInput.value.trim();
      } else if (colorInput && colorKey) {
        draft.colors[colorKey] = colorInput.value;
      }
    });

    document.querySelectorAll('.theme-type-input[data-role][data-field]').forEach(function (input) {
      var role = input.getAttribute('data-role');
      var field = input.getAttribute('data-field');
      if (!role || !field) return;
      if (!draft.typography[role]) {
        draft.typography[role] = {};
      }
      draft.typography[role][field] = input.value.trim();
    });

    return draft;
  }

  function syncDraftFromControls() {
    state.draft = readDraftFromControls();
    loadGoogleFontsForTheme(state.draft);
    applyPreview(state.draft);
  }

  function buildFontControl(typeKey, label) {
    var block = document.createElement('div');
    block.className = 'theme-control';

    var title = document.createElement('span');
    title.textContent = label || state.fontTypes[typeKey] || 'Font';
    block.appendChild(title);

    var picker = document.createElement('div');
    picker.className = 'theme-font-picker';
    picker.setAttribute('data-type', typeKey);

    var current = (state.draft.fonts || {})[typeKey] || {};

    state.fontCatalog.forEach(function (entry) {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'theme-font-option';
      btn.setAttribute('data-family', entry.family);
      btn.setAttribute('data-source', entry.source);

      if (current.family === entry.family) {
        btn.classList.add('is-selected');
      }

      var meta = document.createElement('span');
      meta.className = 'theme-font-option__meta';

      var name = document.createElement('span');
      name.className = 'theme-font-option__name';
      name.textContent = entry.family + (entry.source === 'google' ? ' · Google Font' : ' · Web-safe');

      var sample = document.createElement('span');
      sample.className = 'theme-font-option__sample';
      sample.textContent = fontSample(typeKey);
      sample.style.fontFamily = entry.source === 'google'
        ? '"' + entry.family + '", ' + entry.category
        : entry.family + ', ' + entry.category;

      meta.appendChild(name);
      meta.appendChild(sample);
      btn.appendChild(meta);

      btn.addEventListener('click', function () {
        picker.querySelectorAll('.theme-font-option').forEach(function (option) {
          option.classList.remove('is-selected');
        });
        btn.classList.add('is-selected');
        if (entry.source === 'google') {
          ensureGoogleFont(entry.family);
        }
        syncDraftFromControls();
      });

      picker.appendChild(btn);
    });

    block.appendChild(picker);
    return block;
  }

  function buildColorControl(colorKey, label) {
    var value = (state.draft.colors || {})[colorKey] || '';
    var control = document.createElement('label');
    control.className = 'theme-control theme-color-input';
    control.setAttribute('data-color', colorKey);

    var labelEl = document.createElement('span');
    labelEl.textContent = label || colorKey;
    control.appendChild(labelEl);

    var row = document.createElement('div');
    row.className = 'theme-color-input__row';

    var isHex = /^#[0-9a-fA-F]{6}$/.test(value);
    var textInput = document.createElement('input');
    textInput.type = 'text';
    textInput.value = value;
    textInput.setAttribute('aria-label', label || colorKey);

    if (isHex) {
      var colorInput = document.createElement('input');
      colorInput.type = 'color';
      colorInput.value = value;
      colorInput.title = 'Pick colour';
      colorInput.addEventListener('input', function () {
        textInput.value = colorInput.value;
        syncDraftFromControls();
      });
      row.appendChild(colorInput);
    }

    textInput.addEventListener('input', function () {
      var picker = row.querySelector('input[type="color"]');
      if (/^#[0-9a-fA-F]{6}$/.test(textInput.value.trim()) && picker) {
        picker.value = textInput.value.trim();
      }
      syncDraftFromControls();
    });

    row.appendChild(textInput);
    control.appendChild(row);
    return control;
  }

  function buildTypographyControl(role, fields) {
    var wrap = document.createElement('div');
    wrap.className = 'theme-type-group';

    fields.forEach(function (field) {
      var value = ((state.draft.typography || {})[role] || {})[field] || '';
      var control = document.createElement('label');
      control.className = 'theme-control theme-type-input-wrap';

      var label = document.createElement('span');
      label.textContent = state.typographyFields[field] || field;
      control.appendChild(label);

      var input = document.createElement('input');
      input.type = 'text';
      input.className = 'theme-type-input';
      input.setAttribute('data-role', role);
      input.setAttribute('data-field', field);
      input.value = value;
      input.addEventListener('input', syncDraftFromControls);
      control.appendChild(input);

      wrap.appendChild(control);
    });

    return wrap;
  }

  function updateSelectionHighlight() {
    var preview = $('theme-preview');
    if (!preview) return;

    preview.querySelectorAll('[data-theme-target]').forEach(function (el) {
      el.classList.remove('is-theme-selected');
    });

    if (!state.selectedTarget) return;

    preview.querySelectorAll('[data-theme-target="' + state.selectedTarget + '"]').forEach(function (el) {
      el.classList.add('is-theme-selected');
    });
  }

  function showPanelForTarget(targetId) {
    var empty = $('theme-panel-empty');
    var editor = $('theme-panel-editor');
    var target = state.targets[targetId];

    if (!target) {
      state.selectedTarget = null;
      if (empty) empty.hidden = false;
      if (editor) editor.hidden = true;
      updateSelectionHighlight();
      return;
    }

    state.selectedTarget = targetId;
    if (empty) empty.hidden = true;
    if (editor) editor.hidden = false;

    $('theme-panel-title').textContent = target.label;
    $('theme-panel-hint').textContent = target.hint || '';

    var container = $('theme-context-controls');
    container.innerHTML = '';

    (target.settings || []).forEach(function (setting) {
      if (setting.kind === 'font') {
        container.appendChild(buildFontControl(setting.key, setting.label));
      } else if (setting.kind === 'color') {
        container.appendChild(buildColorControl(setting.key, setting.label));
      } else if (setting.kind === 'type') {
        container.appendChild(buildTypographyControl(setting.key, setting.fields || []));
      }
    });

    updateSelectionHighlight();
  }

  function bindPreviewSelection() {
    var preview = $('theme-preview');
    if (!preview) return;

    preview.addEventListener('click', function (event) {
      var el = event.target.closest('[data-theme-target]');
      if (!el || !preview.contains(el)) return;
      event.preventDefault();
      event.stopPropagation();
      showPanelForTarget(el.getAttribute('data-theme-target'));
    });
  }

  function populateThemeSelect() {
    var select = $('theme-select');
    if (!select) return;
    select.innerHTML = '';

    var originalOption = document.createElement('option');
    originalOption.value = originalId;
    originalOption.textContent = 'Original (protected)';
    select.appendChild(originalOption);

    state.savedThemes.forEach(function (theme) {
      var option = document.createElement('option');
      option.value = theme.id;
      option.textContent = theme.name;
      select.appendChild(option);
    });

    select.value = state.currentThemeId;
  }

  function updateActiveLabel() {
    var label = $('theme-active-label');
    if (!label) return;
    if (state.activeThemeId === originalId) {
      label.textContent = 'Original';
      return;
    }
    var active = state.savedThemes.find(function (theme) {
      return theme.id === state.activeThemeId;
    });
    label.textContent = active ? active.name : 'Original';
  }

  function updateDeleteButton() {
    var btn = $('theme-delete-btn');
    if (!btn) return;
    btn.hidden = state.currentThemeId === originalId;
  }

  function findThemeByName(name, excludeId) {
    var needle = (name || '').trim().toLowerCase();
    if (!needle) return null;
    return state.savedThemes.find(function (theme) {
      if (excludeId && theme.id === excludeId) return false;
      return (theme.name || '').trim().toLowerCase() === needle;
    }) || null;
  }

  function themePayloadFromDraft(name) {
    return {
      name: name || state.draft.name,
      fonts: state.draft.fonts,
      colors: state.draft.colors,
      typography: state.draft.typography
    };
  }

  function updateSaveButtons() {
    var saveBtn = $('theme-save-btn');
    if (saveBtn) {
      saveBtn.hidden = !(state.editingSaved && state.currentThemeId !== originalId);
    }
  }

  function loadThemeIntoEditor(themeId) {
    var theme;
    if (themeId === originalId) {
      theme = cloneTheme(state.original);
      theme.id = originalId;
      theme.name = 'Original';
      state.editingSaved = false;
    } else {
      theme = state.savedThemes.find(function (item) {
        return item.id === themeId;
      });
      if (!theme) {
        showStatus('Theme not found.', 'error');
        return;
      }
      theme = cloneTheme(theme);
      state.editingSaved = true;
    }

    state.currentThemeId = themeId;
    state.draft = theme;
    populateThemeSelect();
    loadGoogleFontsForTheme(theme);
    applyPreview(theme);
    updateDeleteButton();
    updateSaveButtons();

    if (state.selectedTarget && state.targets[state.selectedTarget]) {
      showPanelForTarget(state.selectedTarget);
    } else {
      showPanelForTarget(null);
    }
  }

  function refreshFromServer() {
    return api('list').then(function (data) {
      if (!data.success) {
        throw new Error(data.message || 'Could not load themes.');
      }
      state.original = data.original;
      state.fontTypes = data.font_types;
      state.colorGroups = data.color_groups;
      state.fontCatalog = data.font_catalog;
      state.targets = data.targets || {};
      state.typographyFields = data.typography_fields || {};
      state.savedThemes = data.saved_themes || [];
      state.activeThemeId = data.active_theme_id || originalId;
      updateActiveLabel();
    });
  }

  function bindEvents() {
    $('theme-load-btn').addEventListener('click', function () {
      var id = $('theme-select').value;
      loadThemeIntoEditor(id);
      showStatus('Theme loaded into editor.', 'success');
    });

    $('theme-apply-btn').addEventListener('click', function () {
      var applyId = $('theme-select').value;
      if (applyId !== originalId && applyId !== state.currentThemeId) {
        loadThemeIntoEditor(applyId);
      } else {
        syncDraftFromControls();
      }

      api('apply', { id: applyId }).then(function (data) {
        if (!data.success) {
          throw new Error(data.message || 'Could not apply theme.');
        }
        state.activeThemeId = applyId;
        updateActiveLabel();
        showStatus(data.message, 'success');
      }).catch(function (err) {
        showStatus(err.message || 'Could not apply theme.', 'error');
      });
    });

    $('theme-save-btn').addEventListener('click', function () {
      if (!state.editingSaved || state.currentThemeId === originalId) {
        showStatus('Load a saved theme to update it, or use Save As to create a new one.', 'error');
        return;
      }

      syncDraftFromControls();
      api('save', Object.assign({ id: state.currentThemeId }, themePayloadFromDraft())).then(function (data) {
        if (!data.success) {
          throw new Error(data.message || 'Could not save theme.');
        }
        return refreshFromServer().then(function () {
          loadThemeIntoEditor(data.theme.id);
          showStatus(data.message, 'success');
        });
      }).catch(function (err) {
        showStatus(err.message || 'Could not save theme.', 'error');
      });
    });

    $('theme-save-as-btn').addEventListener('click', function () {
      syncDraftFromControls();
      var nameInput = $('theme-save-name');
      nameInput.value = '';
      $('theme-save-modal').hidden = false;
      nameInput.focus();
    });

    $('theme-save-confirm').addEventListener('click', function () {
      syncDraftFromControls();
      var name = $('theme-save-name').value.trim();
      if (!name) {
        showStatus('Enter a theme name.', 'error');
        return;
      }
      if (name.toLowerCase() === 'original') {
        showStatus('Original is a reserved name.', 'error');
        return;
      }

      var duplicate = findThemeByName(name);
      var overwriteId = null;
      if (duplicate) {
        var replace = window.confirm(
          'A theme named "' + duplicate.name + '" already exists. Replace it with the current settings?'
        );
        if (!replace) {
          return;
        }
        overwriteId = duplicate.id;
      }

      var payload = themePayloadFromDraft(name);
      if (overwriteId) {
        payload.overwrite_id = overwriteId;
      }

      api('save_as', payload).then(function (data) {
        if (!data.success) {
          if (data.duplicate_id && !overwriteId) {
            var retry = window.confirm(
              'A theme named "' + (data.duplicate_name || name) + '" already exists. Replace it with the current settings?'
            );
            if (retry) {
              return api('save_as', Object.assign({}, payload, { overwrite_id: data.duplicate_id }));
            }
            return null;
          }
          throw new Error(data.message || 'Could not save theme.');
        }
        return data;
      }).then(function (data) {
        if (!data || !data.success) {
          return;
        }
        $('theme-save-modal').hidden = true;
        return refreshFromServer().then(function () {
          loadThemeIntoEditor(data.theme.id);
          showStatus(data.message, 'success');
        });
      }).catch(function (err) {
        showStatus(err.message || 'Could not save theme.', 'error');
      });
    });

    $('theme-delete-btn').addEventListener('click', function () {
      if (state.currentThemeId === originalId) return;
      if (!window.confirm('Delete this saved theme?')) return;

      api('delete', { id: state.currentThemeId }).then(function (data) {
        if (!data.success) {
          throw new Error(data.message || 'Could not delete theme.');
        }
        return refreshFromServer().then(function () {
          loadThemeIntoEditor(originalId);
          showStatus(data.message, 'success');
        });
      }).catch(function (err) {
        showStatus(err.message || 'Could not delete theme.', 'error');
      });
    });

    document.querySelectorAll('[data-close-modal]').forEach(function (el) {
      el.addEventListener('click', function () {
        $('theme-save-modal').hidden = true;
      });
    });

    $('theme-select').addEventListener('change', function () {
      loadThemeIntoEditor($('theme-select').value);
    });
  }

  ready(function () {
    refreshFromServer()
      .then(function () {
        bindPreviewSelection();
        loadThemeIntoEditor(state.activeThemeId);
        bindEvents();
      })
      .catch(function (err) {
        showStatus(err.message || 'Could not load themes.', 'error');
      });
  });
})();
