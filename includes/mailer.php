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
        $ehlo = parse_url(site_url(), PHP_URL_HOST) ?: 'localhost';
        $this->command($socket, 'EHLO ' . $ehlo, 250);

        if ($this->encryption === 'tls') {
            $this->command($socket, 'STARTTLS', 220);
            if (!stream_socket_enable_crypto($socket, true, STREAM_CRYPTO_METHOD_TLS_CLIENT)) {
                throw new RuntimeException('Unable to enable TLS for SMTP connection.');
            }
            $this->command($socket, 'EHLO ' . $ehlo, 250);
        }

        $this->command($socket, 'AUTH LOGIN', 334);
        $this->command($socket, base64_encode($this->username), 334);
        $this->command($socket, base64_encode($this->password), 235);

        $fromAddress = $from !== '' ? $from : $this->username;
        $fromHeader = $fromName !== '' ? $this->encodeHeaderName($fromName) . ' <' . $fromAddress . '>' : $fromAddress;

        $this->command($socket, 'MAIL FROM:<' . $fromAddress . '>', 250);
        $this->command($socket, 'RCPT TO:<' . $to . '>', 250);
        $this->command($socket, 'DATA', 354);

        $headers = [
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

        $message = implode("\r\n", $headers) . "\r\n\r\n" . $body . "\r\n.";
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

        $socket = @stream_socket_client($remote, $errno, $errstr, 20, STREAM_CLIENT_CONNECT);
        if (!$socket) {
            throw new RuntimeException('SMTP connection failed: ' . $errstr);
        }
        stream_set_timeout($socket, 20);
        return $socket;
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

function send_enquiry_email(string $name, string $email, string $service, string $message, string $phone = ''): void
{
    $mailer = create_smtp_mailer();
    $to = (string) config('mail_to', 'hello@example.com');
    $from = (string) config('mail_from', $to);
    $fromName = (string) config('mail_from_name', email_brand_name());
    $brandName = email_brand_name();

    $notificationHtml = build_enquiry_notification_html($name, $email, $phone, $service, $message);
    $notificationText = build_enquiry_notification_text($name, $email, $phone, $service, $message);
    $mailer->send(
        $to,
        'Website enquiry: ' . $service,
        $notificationText,
        $email,
        $from,
        $fromName,
        $notificationHtml
    );

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
}
