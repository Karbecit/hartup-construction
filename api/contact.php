<?php

declare(strict_types=1);

require_once dirname(__DIR__) . '/includes/bootstrap.php';
require_once dirname(__DIR__) . '/includes/turnstile.php';
require_once dirname(__DIR__) . '/includes/mailer.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    json_response(['success' => false, 'message' => 'Method not allowed.'], 405);
}

if (!is_configured()) {
    json_response(['success' => false, 'message' => 'Contact form is not configured yet. Please try again later.'], 503);
}

if (rate_limit_exceeded('contact_form', 5, 3600)) {
    json_response(['success' => false, 'message' => 'Too many enquiries sent. Please try again in an hour or call us directly.'], 429);
}

$input = json_decode((string) file_get_contents('php://input'), true);
if (!is_array($input)) {
    $input = $_POST;
}

$csrf = isset($input['csrf_token']) ? (string) $input['csrf_token'] : '';
if (!verify_csrf($csrf)) {
    json_response(['success' => false, 'message' => 'Security check failed. Please refresh the page and try again.'], 403);
}

$honeypot = isset($input['website']) ? trim((string) $input['website']) : '';
if ($honeypot !== '') {
    json_response(['success' => true, 'message' => 'Thank you — your enquiry has been sent.']);
}

$name = sanitize_text((string) ($input['name'] ?? ''), 120);
$email = sanitize_text((string) ($input['email'] ?? ''), 190);
$phone = sanitize_phone((string) ($input['phone'] ?? ''));
$service = sanitize_text((string) ($input['service'] ?? ''), 120);
$message = sanitize_text((string) ($input['message'] ?? ''), 4000);
$turnstile = (string) ($input['cf-turnstile-response'] ?? '');

if ($name === '' || $email === '' || $service === '' || $message === '') {
    json_response(['success' => false, 'message' => 'Please fill in all required fields.'], 422);
}

if (!validate_email($email)) {
    json_response(['success' => false, 'message' => 'Please enter a valid email address.'], 422);
}

if (!verify_turnstile($turnstile)) {
    json_response(['success' => false, 'message' => 'Please complete the human verification check.'], 422);
}

try {
    send_enquiry_email($name, $email, $service, $message, $phone);
} catch (Throwable $exception) {
    error_log('Contact form mail error: ' . $exception->getMessage());
    json_response(['success' => false, 'message' => 'We could not send your enquiry right now. Please email or call us directly.'], 500);
}

json_response([
    'success' => true,
    'message' => 'Thank you — your enquiry has been sent. We will get back to you soon.',
]);
