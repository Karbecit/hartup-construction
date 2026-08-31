<?php

declare(strict_types=1);

require_once __DIR__ . '/bootstrap.php';
require_once __DIR__ . '/email-templates.php';

class SmtpMailer
{
    public function __construct(
        private string $host,
        private int $port,
        private string $username,
        private string $password,
        private string $encryption = 'tls'
    ) {
    }

    public function send(
        string $to,
        string $subject,
        string $textBody,
        string $replyTo = '',
        string $from = '',
        string $fromName = '',
        ?string $htmlBody = null
    ): void {
        $socket = $this->connect();
        $this->expect($socket, 220);
        $ehlo = $this->ehloHost();
        $this->command($socket, 'EHLO ' . $ehlo, 250);

        if ($this->encryption === 'tls') {
            $this->command($socket, 'STARTTLS', 220);
            if (!stream_socket_enable_crypto($socket, true, $this->cryptoMethod())) {
                throw new RuntimeException('Unable to enable TLS for SMTP connection.');
            }
            $this->command($socket, 'EHLO ' . $ehlo, 250);
        }

        $this->command($socket, 'AUTH LOGIN', 334);
        $this->command($socket, base64_encode($this->username), 334);
        $this->command($socket, base64_encode($this->password), 235);

        $fromAddress = $from !== '' ? $from : '';
        if (!filter_var($fromAddress, FILTER_VALIDATE_EMAIL)) {
            throw new RuntimeException('A verified From email address is required. Do not use the SMTP username as MAIL FROM.');
        }
        if (!filter_var($to, FILTER_VALIDATE_EMAIL)) {
            throw new RuntimeException('A valid recipient email address is required.');
        }
        $fromHeader = $fromName !== '' ? $this->encodeHeaderName($fromName) . ' <' . $fromAddress . '>' : $fromAddress;

        $this->command($socket, 'MAIL FROM:<' . $fromAddress . '>', 250);
        $this->command($socket, 'RCPT TO:<' . $to . '>', 250);
        $this->command($socket, 'DATA', 354);

        $headers = [
            'Date: ' . date('r'),
            'Message-ID: <' . bin2hex(random_bytes(16)) . '@' . $ehlo . '>',
            'From: ' . $fromHeader,
            'To: <' . $to . '>',
            'Subject: ' . $this->encodeSubject($subject),
            'MIME-Version: 1.0',
        ];

        if ($replyTo !== '') {
            $headers[] = 'Reply-To: <' . $replyTo . '>';
        }

        if ($htmlBody !== null && $htmlBody !== '') {
            $boundary = 'nl_' . bin2hex(random_bytes(12));
            $headers[] = 'Content-Type: multipart/alternative; boundary="' . $boundary . '"';
            $plainPart = $this->normalizeBody($textBody);
            $htmlPart = chunk_split(base64_encode($this->normalizeBody($htmlBody)), 76, "\r\n");
            $body = '--' . $boundary . "\r\n"
                . "Content-Type: text/plain; charset=UTF-8\r\n"
                . "Content-Transfer-Encoding: 8bit\r\n\r\n"
                . $plainPart . "\r\n\r\n"
                . '--' . $boundary . "\r\n"
                . "Content-Type: text/html; charset=UTF-8\r\n"
                . "Content-Transfer-Encoding: base64\r\n\r\n"
                . $htmlPart . "\r\n"
                . '--' . $boundary . '--';
        } else {
            $headers[] = 'Content-Type: text/plain; charset=UTF-8';
            $headers[] = 'Content-Transfer-Encoding: 8bit';
            $body = $this->normalizeBody($textBody);
        }

        $message = implode("\r\n", $headers) . "\r\n\r\n" . $this->dotStuff($body) . "\r\n.";
        fwrite($socket, $message . "\r\n");
        $this->expect($socket, 250);
        $this->command($socket, 'QUIT', 221);
        fclose($socket);
    }

    private function connect()
    {
        $remote = $this->encryption === 'ssl'
            ? 'ssl://' . $this->host . ':' . $this->port
            : $this->host . ':' . $this->port;

        $context = stream_context_create([
            'ssl' => [
                'crypto_method' => $this->cryptoMethod(),
                'verify_peer' => true,
                'verify_peer_name' => true,
            ],
        ]);

        $socket = @stream_socket_client($remote, $errno, $errstr, 20, STREAM_CLIENT_CONNECT, $context);
        if (!$socket) {
            throw new RuntimeException('SMTP connection failed: ' . $errstr);
        }
        stream_set_timeout($socket, 20);
        return $socket;
    }

    private function ehloHost(): string
    {
        $host = (string) (parse_url(site_url(), PHP_URL_HOST) ?: '');
        if ($host === '' || $host === 'localhost' || str_starts_with($host, '127.') || $host === '::1') {
            $host = (string) ($_SERVER['SERVER_NAME'] ?? $_SERVER['HTTP_HOST'] ?? '');
            $host = (string) (parse_url('https://' . $host, PHP_URL_HOST) ?: $host);
        }
        $host = preg_replace('/[^a-zA-Z0-9.-]/', '', $host) ?? '';
        if ($host === '' || $host === 'localhost') {
            return 'hartupconstruction.com.au';
        }

        return $host;
    }

    private function cryptoMethod(): int
    {
        $method = STREAM_CRYPTO_METHOD_TLSv1_2_CLIENT;
        if (defined('STREAM_CRYPTO_METHOD_TLSv1_3_CLIENT')) {
            $method |= STREAM_CRYPTO_METHOD_TLSv1_3_CLIENT;
        }

        return $method;
    }

    private function dotStuff(string $body): string
    {
        return preg_replace('/^\./m', '..', $body) ?? $body;
    }

    private function command($socket, string $command, int $expectedCode): void
    {
        fwrite($socket, $command . "\r\n");
        $this->expect($socket, $expectedCode);
    }

    private function expect($socket, int $expectedCode): void
    {
        $response = '';
        while (($line = fgets($socket, 515)) !== false) {
            $response .= $line;
            if (isset($line[3]) && $line[3] === ' ') {
                break;
            }
        }

        $code = (int) substr($response, 0, 3);
        if ($code !== $expectedCode) {
            throw new RuntimeException('Unexpected SMTP response (' . $expectedCode . ' expected): ' . trim($response));
        }
    }

    private function encodeSubject(string $subject): string
    {
        return '=?UTF-8?B?' . base64_encode($subject) . '?=';
    }

    private function encodeHeaderName(string $name): string
    {
        if (preg_match('/[^\x20-\x7E]/', $name)) {
            return '=?UTF-8?B?' . base64_encode($name) . '?=';
        }

        return '"' . str_replace(['\\', '"'], ['\\\\', '\\"'], $name) . '"';
    }

    private function normalizeBody(string $body): string
    {
        return preg_replace("/\r\n|\r|\n/", "\r\n", $body) ?? $body;
    }
}

function create_smtp_mailer(): SmtpMailer
{
    return new SmtpMailer(
        (string) config('smtp_host'),
        (int) config('smtp_port', 587),
        (string) config('smtp_username'),
        (string) config('smtp_password'),
        (string) config('smtp_encryption', 'tls')
    );
}

function send_enquiry_email(
    string $name,
    string $email,
    string $service,
    string $message,
    string $phone = '',
    string $location = ''
): void {
    $mailer = create_smtp_mailer();
    $to = (string) config('mail_to', 'hello@example.com');
    $from = (string) config('mail_from', $to);
    $fromName = (string) config('mail_from_name', email_brand_name());
    $brandName = email_brand_name();

    $notificationHtml = build_enquiry_notification_html($name, $email, $phone, $service, $message, $location);
    $notificationText = build_enquiry_notification_text($name, $email, $phone, $service, $message, $location);
    $mailer->send(
        $to,
        'Website enquiry: ' . $service,
        $notificationText,
        $email,
        $from,
        $fromName,
        $notificationHtml
    );

    try {
        $autoReplyHtml = build_enquiry_autoreply_html($name, $service);
        $autoReplyText = build_enquiry_autoreply_text($name, $service);
        $mailer->send(
            $email,
            'Thank you for contacting ' . $brandName,
            $autoReplyText,
            $to,
            $from,
            $brandName,
            $autoReplyHtml
        );
    } catch (Throwable $exception) {
        error_log('Enquiry auto-reply failed: ' . $exception->getMessage());
    }
}

function send_admin_password_reset_email(string $resetUrl): void
{
    $to = admin_recovery_email();
    if (!validate_email($to)) {
        throw new RuntimeException('Admin recovery email is not configured.');
    }

    $mailer = create_smtp_mailer();
    $from = (string) config('mail_from', $to);
    $fromName = (string) config('mail_from_name', email_brand_name());
    $brandName = email_brand_name();

    $mailer->send(
        $to,
        'Reset your ' . $brandName . ' admin password',
        build_admin_password_reset_text($resetUrl),
        '',
        $from,
        $fromName,
        build_admin_password_reset_html($resetUrl)
    );
}
