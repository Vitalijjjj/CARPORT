<?php
/**
 * Creates the first admin user in admin_users table.
 *
 * !! DELETE THIS FILE immediately after running it !!
 *
 * Usage via browser: https://yourdomain.com/api/seed.php?key=SEED_KEY_CHANGE_ME
 * Usage via CLI:     php seed.php
 *
 * Change SEED_KEY below before uploading.
 */

define('SEED_KEY', 'SEED_KEY_CHANGE_ME'); // ← change this!

// Protect from unauthorized browser access
if (PHP_SAPI !== 'cli') {
    $provided = $_GET['key'] ?? '';
    if ($provided !== SEED_KEY) {
        http_response_code(403);
        header('Content-Type: text/plain');
        echo 'Forbidden — pass ?key=SEED_KEY_CHANGE_ME';
        exit;
    }
}

require_once __DIR__ . '/config.php';
require_once __DIR__ . '/db.php';

$email    = 'admin@carrai.pt';
$password = 'ChangeThisPassword1!';
$name     = 'Admin';
$hash     = password_hash($password, PASSWORD_BCRYPT, ['cost' => 12]);
$pdo      = getDB();

// Check if admin already exists
$stmt = $pdo->prepare('SELECT id FROM admin_users WHERE email = ? LIMIT 1');
$stmt->execute([$email]);

if ($stmt->fetch()) {
    $msg = "Admin already exists — nothing changed.\nEmail: $email\n\n!! DELETE THIS FILE NOW !!";
} else {
    $pdo->prepare('INSERT INTO admin_users (name, email, password_hash) VALUES (?, ?, ?)')
        ->execute([$name, $email, $hash]);
    $msg = "Admin created successfully!\nEmail: $email\nPassword: $password\n\n!! DELETE THIS FILE NOW !!";
}

if (PHP_SAPI === 'cli') {
    echo $msg . "\n";
} else {
    header('Content-Type: text/plain; charset=utf-8');
    echo $msg;
}
