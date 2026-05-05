<?php
/**
 * Creates the initial admin user.
 *
 * !! DELETE THIS FILE after running it !!
 *
 * Usage via CLI:   php api/seed.php
 * Usage via URL:   https://yourdomain.com/api/seed.php?key=YOUR_SEED_KEY
 *
 * Change SEED_KEY to something secret before uploading.
 */

define('SEED_KEY', 'change-this-seed-key-before-uploading');

// Protect browser access with a secret key
if (PHP_SAPI !== 'cli') {
    $providedKey = $_GET['key'] ?? '';
    if ($providedKey !== SEED_KEY) {
        http_response_code(403);
        echo 'Forbidden — provide ?key=SEED_KEY';
        exit();
    }
}

require_once __DIR__ . '/config.php';

// ── Admin credentials to create ────────────────────────────────────
$adminEmail    = 'admin@turboeagle.pt'; // change to your email
$adminPassword = 'ChangeThisPassword1!'; // change to a strong password
$adminName     = 'Admin';

$hash = password_hash($adminPassword, PASSWORD_BCRYPT, ['cost' => 12]);
$pdo  = getDB();

$stmt = $pdo->prepare(
    'INSERT INTO admins (email, password_hash, name)
     VALUES (?, ?, ?)
     ON DUPLICATE KEY UPDATE password_hash = VALUES(password_hash), name = VALUES(name)'
);
$stmt->execute([$adminEmail, $hash, $adminName]);

$message = "Admin user created successfully.\nEmail: $adminEmail\nPassword: $adminPassword\n\n!! DELETE THIS FILE NOW !!";

if (PHP_SAPI === 'cli') {
    echo $message . "\n";
} else {
    header('Content-Type: text/plain');
    echo $message;
}
