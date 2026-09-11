<?php

declare(strict_types=1);

require_once dirname(__DIR__) . '/includes/auth.php';

require_admin();

$pageTitle = 'User manual';
$showNav = true;
require __DIR__ . '/includes/header.php';
?>

<div class="admin-card help-doc">
  <div class="help-doc__header">
    <div>
      <h1>Website user manual</h1>
      <p class="admin-lead">How to update the Hartup Construction website. No technical knowledge needed.</p>
    </div>
    <button type="button" class="admin-btn admin-btn--ghost" onclick="window.print()">Print</button>
  </div>

  <nav class="help-toc" aria-label="Manual contents">
    <p><strong>On this page</strong></p>
    <ol>
      <li><a href="#sign-in">Sign in</a></li>
      <li><a href="#around">Finding your way around</a></li>
      <li><a href="#saving">Saving and seeing your changes</a></li>
      <li><a href="#pages">Pages</a></li>
      <li><a href="#sections">Editing sections</a></li>
      <li><a href="#photos">Photos</a></li>
      <li><a href="#services">Services</a></li>
      <li><a href="#designs">House designs</a></li>
      <li><a href="#themes">Themes</a></li>
      <li><a href="#settings">Settings you might use</a></li>
      <li><a href="#enquiries">Website enquiries</a></li>
      <li><a href="#troubleshooting">Troubleshooting</a></li>
    </ol>
  </nav>

  <h2 id="sign-in">1. Sign in</h2>
  <ol>
    <li>Go to <a href="/admin/login.php">the admin login</a> (bookmark: <code>hartupconstruction.com.au/admin/</code>).</li>
    <li>Enter your <strong>username</strong> and <strong>password</strong>.</li>
    <li>Click <strong>Sign in</strong>.</li>
  </ol>
  <p>You will land on the Dashboard. From there you can open Pages, Services, Themes, Settings, this manual, or the public website.</p>
  <p><strong>If you forget your password</strong></p>
  <ol>
    <li>On the login screen, click <strong>Forgot password?</strong></li>
    <li>The next screen shows the <strong>Send enquiries to</strong> address (the same inbox as website contact form messages). A reset link will be sent there.</li>
    <li>Click <strong>Send reset link</strong>.</li>
    <li>Open that email (check junk mail too). The link expires after one hour.</li>
    <li>Choose a new password (at least 10 characters) and confirm it.</li>
  </ol>

  <h2 id="around">2. Finding your way around</h2>
  <p>The bar at the top is always there once you are signed in.</p>
  <ul>
    <li><strong>Hartup Admin</strong> or <strong>Dashboard</strong> — home screen of the admin</li>
    <li><strong>Pages</strong> — Home, About, Contact, Terms</li>
    <li><strong>Services</strong> — New Builds, Kitchens, Bathrooms, and other service pages</li>
    <li><strong>Themes</strong> — colours and fonts (use with care)</li>
    <li><strong>Settings</strong> — login, enquiry email, and technical email settings</li>
    <li><strong>View site</strong> — opens the public website in a new tab</li>
    <li><strong>Help</strong> — this user manual</li>
    <li><strong>Log out</strong> — signs you out</li>
  </ul>

  <h2 id="saving">3. Saving and seeing your changes</h2>
  <ul>
    <li>The <strong>Save changes</strong> button (top right on an editor) stays grey until you change something. Click it when you are ready. Wait until it says the page is saved.</li>
    <li><strong>Save as you go.</strong> If you leave the page without saving, those edits are lost.</li>
    <li>Saving stores your work. The <strong>public website</strong> is updated when the site is next <strong>published</strong>. If <strong>View site</strong> still shows old wording, ask your web contact (KarBec) to publish.</li>
  </ul>

  <h2 id="pages">4. Pages (Home, About, Contact, Terms)</h2>
  <ol>
    <li>Click <strong>Pages</strong>.</li>
    <li>Click the page you want (for example <strong>Contact Us</strong>).</li>
    <li>Edit the header and sections.</li>
    <li>Click <strong>Save changes</strong>.</li>
  </ol>
  <p><strong>Home</strong> has a large hero: a <strong>tagline</strong> and a <strong>background image</strong>. You can add extra photos so the hero cycles as a slideshow.</p>
  <p><strong>About, Contact, and Terms</strong> have a smaller header: <strong>Eyebrow</strong> (short line above the title), <strong>Heading</strong>, and <strong>Lead</strong> (the intro paragraph).</p>
  <p>On those pages you can also tick <strong>Show in main menu</strong> and <strong>Enable page on site</strong> (turn the page on or off).</p>
  <p>On <strong>Terms and Conditions</strong>, use <strong>Upload PDF</strong> for a downloadable file, or <strong>Clear</strong> to remove it. Visitors see the download button after the site is published with that file.</p>

  <h2 id="sections">5. Editing sections</h2>
  <p>Every page is built from <strong>sections</strong> stacked down the page.</p>
  <p><strong>To add a section:</strong> under <strong>Add a section</strong>, choose a type, click <strong>Add section</strong>, fill it in, then save.</p>
  <p><strong>To rearrange:</strong> drag the <strong>⋮⋮</strong> handle. Click ▸ / ▾ to collapse or expand a section while you work.</p>
  <table class="help-table">
    <thead>
      <tr><th>Type</th><th>Use it for</th></tr>
    </thead>
    <tbody>
      <tr><td>Image &amp; text</td><td>A photo beside a heading, paragraphs, and optional bullets. Image can sit left or right.</td></tr>
      <tr><td>Text only</td><td>Heading and body with no image.</td></tr>
      <tr><td>Image only (full width)</td><td>A wide photo. Add overlay text and drag it into place on the picture.</td></tr>
      <tr><td>Services / category tiles</td><td>Cards that link to service pages (New Builds, Kitchens, and so on).</td></tr>
      <tr><td>Custom layout</td><td>Boxes you can drag and resize. Click a box to edit it.</td></tr>
      <tr><td>Design showcase</td><td>House designs with photos, sizes, price-from, floor plan, and optional video.</td></tr>
    </tbody>
  </table>

  <h2 id="photos">6. Photos</h2>
  <ol>
    <li>Click <strong>Choose image</strong>.</li>
    <li>Upload a new image or pick one already in the library.</li>
    <li>If a crop window opens, drag the photo and zoom so the important part sits in the frame. The shaded area is hidden on the website.</li>
  </ol>
  <p>Use a clear, well-lit photo. After you change an image, click <strong>Save changes</strong>.</p>

  <h2 id="services">7. Services</h2>
  <ol>
    <li>Click <strong>Services</strong>.</li>
    <li>Click the service you want (for example New Builds or Kitchens).</li>
  </ol>
  <p>At the top, <strong>Service details</strong> includes the title, menu name, web address, short description, and whether it shows in the menu. <strong>Menu parent</strong> nests a page under another (for example bedrooms under New Builds). Choose <strong>Top level</strong> for a main menu item.</p>
  <p>Then add and edit <strong>sections</strong> the same way as Pages.</p>
  <p>To add a new service, type a title under <strong>Add service / category</strong> and click <strong>Add</strong>.</p>
  <p><strong>Menu order:</strong> on the Services screen, drag the <strong>⋮⋮</strong> handles in <strong>Main menu order</strong> to change left-to-right order. Sub-pages stay under their parent.</p>

  <h2 id="designs">8. House designs</h2>
  <p>On a page with a <strong>Design showcase</strong> section (usually New Builds):</p>
  <ol>
    <li>Expand the design you want, or click <strong>Add design</strong>.</li>
    <li>Enter the name, description, size, bedrooms, bathrooms, and price-from.</li>
    <li>Choose images and crop if asked. Optionally add a floor plan PDF and a video link.</li>
    <li>Save that design if you see a per-design <strong>Save</strong>, then click <strong>Save changes</strong> for the whole page.</li>
  </ol>

  <h2 id="themes">9. Themes</h2>
  <p><strong>Themes</strong> changes colours and fonts by clicking parts of a preview. <strong>Original</strong> is the Hartup look and cannot be overwritten.</p>
  <ul>
    <li>Click something in the preview, then adjust colour or font on the left.</li>
    <li><strong>Save As</strong> stores a named copy.</li>
    <li><strong>Apply to site</strong> makes that theme the active one.</li>
  </ul>
  <p>If you are unsure, leave Themes alone or ask your web contact before applying a new look.</p>

  <h2 id="settings">10. Settings you might use</h2>
  <p>Each block on <strong>Settings</strong> has its own <strong>Save</strong> button — you do not save the whole page at once.</p>
  <p><strong>Admin login</strong> — change username or password (leave password blank to keep the current one). Click <strong>Save login</strong>.</p>
  <p><strong>Site</strong> — the public website address. Click <strong>Save site</strong>.</p>
  <p><strong>Website enquiries</strong> — <strong>Send enquiries to</strong> is where contact form messages <em>and</em> forgot-password emails go. Click <strong>Save enquiries</strong>.</p>
  <p><strong>Email delivery (SMTP)</strong> and <strong>Spam protection</strong> are locked. Red warning text reminds you not to change them unless you are sure. If you have been asked to edit them, click <strong>Enable editing</strong>, then that section’s Save button. The wrong values will stop enquiry emails, password resets, or the contact form.</p>

  <h2 id="enquiries">11. Website enquiries</h2>
  <p>Visitors send messages from the Contact page. Those emails go to <strong>Send enquiries to</strong>. You cannot read old enquiries inside the admin — check the office inbox (and junk folder).</p>
  <p>Enquiries currently go to <code><?= h((string) config('mail_to')) ?></code>.</p>

  <h2 id="troubleshooting">12. Troubleshooting</h2>
  <table class="help-table">
    <thead>
      <tr><th>Problem</th><th>What to try</th></tr>
    </thead>
    <tbody>
      <tr><td>Cannot sign in</td><td>Check caps lock. Use <strong>Forgot password?</strong> After several failed attempts, wait 15 minutes.</td></tr>
      <tr><td>Save button will not click</td><td>Make a change first. If it stays grey, refresh — unsaved work will be lost.</td></tr>
      <tr><td>“Security token expired”</td><td>Refresh the page, then try again.</td></tr>
      <tr><td>Photo looks cropped wrongly</td><td>Choose the image again and drag / zoom in the crop window.</td></tr>
      <tr><td>View site looks unchanged</td><td>Save again, then ask your web contact to publish the site.</td></tr>
      <tr><td>Contact emails not arriving</td><td>Check junk. Confirm <strong>Send enquiries to</strong> in Settings. Ask your web contact if it still fails.</td></tr>
    </tbody>
  </table>

  <h2>Good habits</h2>
  <ul>
    <li>Log out when you finish, especially on a shared computer.</li>
    <li>Do not share the admin password.</li>
    <li>If something looks broken, tell your web contact what you clicked and which page you were on.</li>
  </ul>
</div>

<?php require __DIR__ . '/includes/footer.php'; ?>
