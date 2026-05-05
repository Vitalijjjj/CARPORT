<?php
require_once __DIR__ . '/config.php';

$method = getMethod();

// ── POST /api/auth.php — login ─────────────────────────────────────
if ($method === 'POST') {
    $body     = getBody();
    $email    = trim($body['email'] ?? '');
    $password = $body['password'] ?? '';

    if ($email === '' || $password === '') {
        jsonResponse(['error' => 'Email and password are required'], 400);
    }

    $pdo  = getDB();
    $stmt = $pdo->prepare('SELECT id, email, name, password_hash FROM admins WHERE email = ? LIMIT 1');
    $stmt->execute([$email]);
    $admin = $stmt->fetch();

    if ($admin === false || !password_verify($password, $admin['password_hash'])) {
        jsonResponse(['error' => 'Invalid email or password'], 401);
    }

    $token = generateToken((int) $admin['id']);

    jsonResponse([
        'token' => $token,
        'admin' => [
            'id'    => (int) $admin['id'],
            'email' => $admin['email'],
            'name'  => $admin['name'],
        ],
    ]);
}

// ── DELETE /api/auth.php — logout (client removes token, we just confirm) ──
if ($method === 'DELETE') {
    // No server-side state to clear — token is stateless
    jsonResponse(['ok' => true]);
}

jsonResponse(['error' => 'Method not allowed'], 405);
