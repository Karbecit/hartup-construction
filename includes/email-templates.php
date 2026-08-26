<?php

declare(strict_types=1);

require_once __DIR__ . '/bootstrap.php';

function email_brand_name(): string
{
    return 'Site Template';
}

function email_logo_url(): string
{
    return site_url('assets/images/logo.svg');
}

function email_escape(?string $value): string
{
    return htmlspecialchars($value ?? '', ENT_QUOTES, 'UTF-8');
}

function email_brand_html(): string
{
    return '<span style="letter-spacing:0;word-spacing:normal;white-space:normal;">'
        . email_escape(email_brand_name()) . '</span>';
}

function email_eyebrow(string $text): string
{
    return '<p style="margin:0 0 8px;font-size:12px;color:#c4776a;font-weight:600;">'
        . '<span style="letter-spacing:0.08em;text-transform:uppercase;">' . email_escape($text) . '</span>'
        . '</p>';
}

function email_field_line(string $label, string $valueHtml): string
{
    return '<p style="margin:0 0 10px;font-size:15px;line-height:1.6;color:#2c2419;letter-spacing:0;word-spacing:normal;">'
        . '<strong style="color:#2c2419;">' . email_escape($label) . ':</strong> '
        . $valueHtml
        . '</p>';
}

function email_button(string $url, string $label): string
{
    $safeUrl = email_escape($url);
    $safeLabel = email_escape($label);
    // Match .btn.btn-primary from styles.css
    $rose = '#c4776a';
    $text = '#ffffff';
    $fontFamily = "'DM Sans',Arial,Helvetica,sans-serif";
    $fontSize = '15px';
    $fontWeight = '600';
    $padding = '14px 28px';
    $borderRadius = '999px';
    $borderWidth = '2px';

    return '<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:28px 0 0;">'
        . '<tr><td align="center">'
        . '<table role="presentation" cellspacing="0" cellpadding="0" border="0" style="border-collapse:separate;">'
        . '<tr><td align="center" bgcolor="' . $rose . '" style="background-color:' . $rose . ';border:' . $borderWidth . ' solid ' . $rose . ';border-radius:' . $borderRadius . ';mso-padding-alt:' . $padding . ';">'
        . '<!--[if mso]>'
        . '<v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="' . $safeUrl . '" style="height:50px;v-text-anchor:middle;width:240px;" arcsize="50%" strokecolor="' . $rose . '" strokeweight="' . $borderWidth . '" fillcolor="' . $rose . '">'
        . '<w:anchorlock/>'
        . '<center style="color:' . $text . ';font-family:' . $fontFamily . ';font-size:' . $fontSize . ';font-weight:' . $fontWeight . ';">' . $safeLabel . '</center>'
        . '</v:roundrect>'
        . '<![endif]-->'
        . '<!--[if !mso]><!-->'
        . '<a href="' . $safeUrl . '" target="_blank" style="display:inline-block;padding:' . $padding . ';font-family:' . $fontFamily . ';font-size:' . $fontSize . ';font-weight:' . $fontWeight . ';line-height:1.2;color:' . $text . ';text-decoration:none;background-color:' . $rose . ';border:' . $borderWidth . ' solid ' . $rose . ';border-radius:' . $borderRadius . ';white-space:nowrap;mso-hide:all;">'
        . $safeLabel
        . '</a>'
        . '<!--<![endif]-->'
        . '</td></tr></table>'
        . '</td></tr></table>';
}

function render_email_layout(string $innerHtml, string $preheader = ''): string
{
    $brand = email_brand_html();
    $site = email_escape(site_url());
    $logo = email_escape(email_logo_url());
    $preheaderHtml = $preheader !== ''
        ? '<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;mso-hide:all;">'
            . email_escape($preheader) . '</div>'
        : '';

    return '<!DOCTYPE html>'
        . '<html lang="en-AU" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">'
        . '<head>'
        . '<meta charset="UTF-8">'
        . '<meta name="viewport" content="width=device-width, initial-scale=1.0">'
        . '<meta http-equiv="X-UA-Compatible" content="IE=edge">'
        . '<title>' . email_escape(email_brand_name()) . '</title>'
        . '<!--[if mso]>'
        . '<noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript>'
        . '<![endif]-->'
        . '</head>'
        . '<body style="margin:0;padding:0;background:#faf7f2;font-family:Arial,Helvetica,sans-serif;color:#2c2419;letter-spacing:0;word-spacing:normal;">'
        . $preheaderHtml
        . '<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#faf7f2;padding:32px 16px;">'
        . '<tr><td align="center">'
        . '<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:560px;background:#fffdf9;border-radius:16px;overflow:hidden;">'
        . '<tr><td style="padding:28px 32px 12px;text-align:center;background:#fffdf9;">'
        . '<a href="' . $site . '" style="text-decoration:none;">'
        . '<img src="' . $logo . '" alt="' . email_escape(email_brand_name()) . '" width="200" style="display:block;margin:0 auto;max-width:200px;height:auto;border:0;">'
        . '</a></td></tr>'
        . '<tr><td style="padding:8px 32px 28px;letter-spacing:0;word-spacing:normal;">' . $innerHtml . '</td></tr>'
        . '<tr><td style="padding:18px 32px;background:#f5f0ea;border-top:1px solid #e8e0d8;text-align:center;font-size:13px;line-height:1.5;color:#5c5348;letter-spacing:0;word-spacing:normal;">'
        . $brand . ' · Riverland, South Australia<br>'
        . '<a href="' . $site . '" style="color:#a85f53;text-decoration:none;">' . $site . '</a>'
        . '</td></tr>'
        . '</table>'
        . '</td></tr>'
        . '</table>'
        . '</body></html>';
}

function build_enquiry_notification_html(string $name, string $email, string $phone, string $service, string $message): string
{
    $safeName = email_escape($name);
    $safeEmail = email_escape($email);
    $safePhone = email_escape($phone);
    $safeService = email_escape($service);
    $safeMessage = nl2br(email_escape($message));
    $sentAt = email_escape(gmdate('j F Y, g:i a') . ' UTC');

    $details = email_field_line('Name', $safeName)
        . email_field_line('Email', '<a href="mailto:' . $safeEmail . '" style="color:#a85f53;text-decoration:none;">' . $safeEmail . '</a>');
    if ($phone !== '') {
        $phoneHref = preg_replace('/[^\d+]/', '', $phone) ?? '';
        $phoneValue = $phoneHref !== ''
            ? '<a href="tel:' . email_escape($phoneHref) . '" style="color:#a85f53;text-decoration:none;">' . $safePhone . '</a>'
            : $safePhone;
        $details .= email_field_line('Mobile', $phoneValue);
    }
    $details .= email_field_line('Service', $safeService);

    $inner = email_eyebrow('New website enquiry')
        . '<h1 style="margin:0 0 20px;font-family:Georgia,\'Times New Roman\',serif;font-size:28px;line-height:1.2;font-weight:600;color:#2c2419;letter-spacing:0;">'
        . $safeService . '</h1>'
        . '<div style="margin:0 0 20px;padding:16px 18px;background:#faf7f2;border-radius:12px;border:1px solid #e8e0d8;">'
        . $details
        . '</div>'
        . '<p style="margin:0 0 8px;font-size:14px;font-weight:600;color:#2c2419;">Message</p>'
        . '<div style="padding:16px 18px;background:#ffffff;border:1px solid #e8e0d8;border-radius:12px;font-size:15px;line-height:1.7;color:#2c2419;">'
        . $safeMessage . '</div>'
        . '<p style="margin:20px 0 0;font-size:12px;color:#5c5348;">Sent ' . $sentAt . '</p>';

    return render_email_layout($inner, 'New enquiry from ' . $name . ' about ' . $service);
}

function build_enquiry_notification_text(string $name, string $email, string $phone, string $service, string $message): string
{
    $lines = [
        'New enquiry from ' . parse_url(site_url(), PHP_URL_HOST),
        '',
        'Name: ' . $name,
        'Email: ' . $email,
    ];
    if ($phone !== '') {
        $lines[] = 'Mobile: ' . $phone;
    }
    $lines[] = 'Service: ' . $service;
    $lines[] = '';
    $lines[] = 'Message:';
    $lines[] = $message;
    $lines[] = '';
    $lines[] = '---';
    $lines[] = 'Sent: ' . gmdate('Y-m-d H:i:s') . ' UTC';
    $lines[] = 'IP: ' . client_ip();

    return implode("\n", $lines);
}

function build_enquiry_autoreply_html(string $name, string $service): string
{
    $safeName = email_escape($name);
    $safeService = email_escape($service);
    $contactEmail = email_escape((string) config('mail_to', 'hello@example.com'));
    $site = site_url();

    $inner = email_eyebrow('Thank you')
        . '<h1 style="margin:0 0 16px;font-family:Georgia,\'Times New Roman\',serif;font-size:28px;line-height:1.2;font-weight:600;color:#2c2419;letter-spacing:0;">'
        . 'Thanks for getting in touch, ' . $safeName . '</h1>'
        . '<p style="margin:0 0 16px;font-size:16px;line-height:1.7;color:#2c2419;letter-spacing:0;word-spacing:normal;">'
        . 'We have received your enquiry about <strong style="color:#2c2419;">' . $safeService . '</strong> and will get back to you shortly.'
        . '</p>'
        . '<p style="margin:0 0 16px;font-size:16px;line-height:1.7;color:#2c2419;letter-spacing:0;word-spacing:normal;">'
        . 'If your request is urgent, you can reply to this email or contact us directly at '
        . '<a href="mailto:' . $contactEmail . '" style="color:#a85f53;text-decoration:none;">' . $contactEmail . '</a>.'
        . '</p>'
        . '<p style="margin:0 0 0;font-size:16px;line-height:1.7;color:#2c2419;letter-spacing:0;word-spacing:normal;">'
        . 'With thanks,<br>' . email_brand_html()
        . '</p>'
        . email_button($site, 'Visit our website');

    return render_email_layout($inner, 'Thanks for contacting ' . email_brand_name());
}

function build_enquiry_autoreply_text(string $name, string $service): string
{
    $contactEmail = (string) config('mail_to', 'hello@example.com');

    return implode("\n", [
        'Hi ' . $name . ',',
        '',
        'Thank you for getting in touch with ' . email_brand_name() . '.',
        '',
        'We have received your enquiry about "' . $service . '" and will get back to you shortly.',
        '',
        'If your request is urgent, you can reply to this email or contact us directly at ' . $contactEmail . '.',
        '',
        'With thanks,',
        email_brand_name(),
        site_url(),
    ]);
}
