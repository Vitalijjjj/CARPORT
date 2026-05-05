<?php
/**
 * CARRAI API — Config & Helpers
 * Upload to: public_html/api/config.php
 */

// ── CORS ──────────────────────────────────────────────────────────
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// ── Database ───────────────────────────────────────────────────────
define('DB_HOST', '127.0.0.1');
define('DB_NAME', 'u152543125_carrai_db');
define('DB_USER', 'u152543125_carrai_user');
define('DB_PASS', '');          // ← fill in before uploading

// ── Auth ───────────────────────────────────────────────────────────
define('JWT_SECRET', 'change-this-to-a-50-char-random-string-before-deploy');
define('TOKEN_TTL',  86400 * 30); // 30 days

// ── Uploads ────────────────────────────────────────────────────────
// api/ is inside public_html/api/, so ../uploads/ = public_html/uploads/
define('UPLOAD_DIR',      __DIR__ . '/../uploads/');
define('UPLOAD_URL_BASE', '/uploads/');
define('UPLOAD_MAX_BYTES', 10 * 1024 * 1024); // 10 MB

// ── JSON helpers ───────────────────────────────────────────────────

function jsonOk(array $data = [], int $code = 200): void
{
    http_response_code($code);
    echo json_encode(
        array_merge(['success' => true], $data),
        JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES
    );
    exit;
}

function jsonError(string $message, int $code = 400): void
{
    http_response_code($code);
    echo json_encode(
        ['success' => false, 'message' => $message],
        JSON_UNESCAPED_UNICODE
    );
    exit;
}

function getBody(): array
{
    $raw = file_get_contents('php://input');
    return json_decode($raw, true) ?? [];
}

function getMethod(): string
{
    return strtoupper($_SERVER['REQUEST_METHOD']);
}
