import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const configExample = path.join(root, 'config', 'config.example.php');
const configPath = path.join(root, 'config', 'config.php');
const siteExample = path.join(root, 'content', 'site.json.example');
const sitePath = path.join(root, 'content', 'site.json');

function copyIfMissing(source, target, label) {
  if (fs.existsSync(target)) {
    console.log(`OK  ${label} already exists`);
    return;
  }
  if (!fs.existsSync(source)) {
    console.warn(`Skip ${label}: missing ${path.relative(root, source)}`);
    return;
  }
  fs.copyFileSync(source, target);
  console.log(`Created ${path.relative(root, target)}`);
}

copyIfMissing(configExample, configPath, 'CMS config');
copyIfMissing(siteExample, sitePath, 'CMS content');

console.log('\nNext steps:');
console.log('  npm run cms:dev   → admin at http://localhost:8090/admin/');
console.log('  npm run dev       → site at http://localhost:4321/');
console.log('Visit /admin/setup.php on first run if admin login is not configured yet.');
