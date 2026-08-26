</main>
<?php if (!empty($extraScripts) && is_array($extraScripts)): ?>
<?php foreach ($extraScripts as $script): ?>
<script src="<?= h($script) ?>"></script>
<?php endforeach; ?>
<?php endif; ?>
</body>
</html>
