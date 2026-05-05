<?php
/**
 * Token generation / verification / auth guard.
 * Upload to: public_html/api/auth.php
 * This file is an internal helper — not a public endpoint.
 */

require_once __DIR__ . '/config.php';

// ── Generate a signed token ────────────────────────────────────────
function generateToken(int $userId): string
{
    $payload   = base64_encode(json_encode([
        'uid' => $userId,
        'iat' => time(),
        'exp' => time() + TOKEN_TTL,
    ]));
    $signature = hash_hmac('sha256', $payload, JWT_SECRET);
    return $payload . '.' . $signature;
}

// ── Verify a token — returns payload array or null ─────────────────
function verifyToken(string $token): ?array
{
    $parts = explode('.', $token, 2);
    if (count($parts) !== 2) {
        return null;
    }

    [$payload, $signature] = $parts;

    $expected = hash_hmac('sha256', $payload, JWT_SECRET);
    if (!hash_equals($expected, $signature)) {
        return null;
    }

    $data = json_decode(base64_decode($payload), true);
    if (!is_array($data) || empty($data['exp']) || $data['exp'] < time()) {
        return null;
    }

    return $data;
}

// ── Require auth — aborts with 401 if invalid ─────────────────────
function requireAuth(): array
{
    $header = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
    if (strncmp($header, 'Bearer ', 7) !== 0) {
        jsonError('Unauthorized — missing token', 401);
    }
    $token = substr($header, 7);
    $data  = verifyToken($token);
    if ($data === null) {
        jsonError('Invalid or expired token', 401);
    }
    return $data;
}

// ── Optional auth — returns null if no token present ──────────────
function getAuthOptional(): ?array
{
    $header = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
    if (strncmp($header, 'Bearer ', 7) !== 0) {
        return null;
    }
    return verifyToken(substr($header, 7));
}
