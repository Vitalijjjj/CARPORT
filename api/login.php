<?php
/**
 * POST /api/login.php
 * Authenticates an admin user and returns a token.
 * Upload to: public_html/api/login.php
 */

require_once __DIR__ . '/config.php';
require_once __DIR__ . '/db.php';
require_once __DIR__ . '/auth.php';

if (getMethod() !== 'POST') {
    jsonError('Method not allowed', 405);
}

$body     = getBody();
$email    = trim($body['email']    ?? '');
$password = trim($body['password'] ?? '');

if ($email === '' || $password === '') {
    jsonError('Email and password are required');
}

$pdo  = getDB();
$stmt = $pdo->prepare(
    'SELECT id, name, email, password_hash FROM admin_users WHERE email = ? LIMIT 1'
);
$stmt->execute([$email]);
$user = $stmt->fetch();

if ($user === false || !password_verify($password, $user['password_hash'])) {
    jsonError('Invalid credentials', 401);
}

$token = generateToken((int) $user['id']);

jsonOk([
    'token' => $token,
    'user'  => [
        'id'    => (int) $user['id'],
        'name'  => $user['name'],
        'email' => $user['email'],
    ],
]);
