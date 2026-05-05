<?php
/**
 * POST /api/leads.php
 * Creates a contact lead from the public site.
 * No auth required.
 * Upload to: public_html/api/leads.php
 */

require_once __DIR__ . '/config.php';
require_once __DIR__ . '/db.php';

if (getMethod() !== 'POST') {
    jsonError('Method not allowed', 405);
}

$body = getBody();

$name    = trim($body['name']    ?? '');
$phone   = trim($body['phone']   ?? '');
$email   = trim($body['email']   ?? '');
$message = trim($body['message'] ?? '');
$carId   = isset($body['car_id'])   ? (int) $body['car_id']   : null;
$carSlug = trim($body['car_slug']  ?? '') ?: null;
$source  = trim($body['source']   ?? 'form');

if ($name === '' && $phone === '' && $email === '') {
    jsonError('At least name, phone, or email is required');
}

$pdo = getDB();

$pdo->prepare(
    'INSERT INTO leads (name, phone, email, message, source, car_id, car_slug)
     VALUES (:name, :phone, :email, :message, :source, :car_id, :car_slug)'
)->execute([
    ':name'     => $name     ?: null,
    ':phone'    => $phone    ?: null,
    ':email'    => $email    ?: null,
    ':message'  => $message  ?: null,
    ':source'   => $source,
    ':car_id'   => $carId,
    ':car_slug' => $carSlug,
]);

jsonOk(['message' => 'Thank you! We will contact you soon.']);
