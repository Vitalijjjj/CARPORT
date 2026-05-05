<?php
/**
 * TURBOEAGLE Admin API — Config & Helpers
 *
 * Deployment instructions:
 *   1. Run `npm run build` — uploads everything from dist/ to public_html/
 *   2. Upload this api/ folder to public_html/api/
 *   3. Upload public/.htaccess to public_html/.htaccess
 *   4. Run setup.sql in Hostinger phpMyAdmin
 *   5. Run seed.php once to create the admin user, then delete it
 *   6. Fill in DB credentials below
 */

// ── CORS — allow the frontend to call the API ──────────────────────
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// ── Database credentials — set these before deploying ─────────────
define('DB_HOST', 'localhost');
define('DB_NAME', 'your_database_name');   // e.g. u123456789_turboeagle
define('DB_USER', 'your_database_user');   // e.g. u123456789_admin
define('DB_PASS', 'your_database_password');

// Secret used to sign auth tokens — must be long and random
define('JWT_SECRET', 'change-this-to-a-long-random-secret-min-32-chars');

// Upload directory (relative to api/ going up to public_html/uploads/cars/)
define('UPLOAD_DIR', __DIR__ . '/../uploads/cars/');
define('UPLOAD_URL_BASE', '/uploads/cars/');

// Maximum allowed upload size in bytes (10 MB)
define('UPLOAD_MAX_BYTES', 10 * 1024 * 1024);

// ── Database connection (singleton per request) ────────────────────
function getDB(): PDO
{
    static $pdo = null;
    if ($pdo !== null) {
        return $pdo;
    }
    try {
        $dsn = sprintf('mysql:host=%s;dbname=%s;charset=utf8mb4', DB_HOST, DB_NAME);
        $pdo = new PDO($dsn, DB_USER, DB_PASS, [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES   => false,
        ]);
        return $pdo;
    } catch (PDOException $e) {
        jsonResponse(['error' => 'Database connection failed'], 500);
    }
}

// ── Token: generate & verify ───────────────────────────────────────
function generateToken(int $adminId): string
{
    $payload = base64_encode(json_encode([
        'uid' => $adminId,
        'iat' => time(),
        'exp' => time() + 86400 * 30, // 30 days
    ]));
    $signature = hash_hmac('sha256', $payload, JWT_SECRET);
    return $payload . '.' . $signature;
}

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

function requireAuth(): array
{
    $header = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
    if (substr($header, 0, 7) !== 'Bearer ') {
        jsonResponse(['error' => 'Unauthorized — missing token'], 401);
    }
    $token = substr($header, 7);
    $data  = verifyToken($token);
    if ($data === null) {
        jsonResponse(['error' => 'Invalid or expired token'], 401);
    }
    return $data;
}

// ── Response helpers ───────────────────────────────────────────────
function jsonResponse(array $data, int $code = 200): void
{
    http_response_code($code);
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit();
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

// ── Decode JSON columns + cast types before sending to client ──────
function decodeCar(array $car): array
{
    $car['features'] = json_decode($car['features'] ?? '[]', true) ?? [];
    $car['gallery']  = json_decode($car['gallery']  ?? '[]', true) ?? [];
    $car['id']                = (int)   $car['id'];
    $car['year']              = (int)   $car['year'];
    $car['price']             = (float) $car['price'];
    $car['mileage']           = (int)   $car['mileage'];
    $car['power']             = $car['power']            !== null ? (int)   $car['power']            : null;
    $car['battery_health']    = $car['battery_health']   !== null ? (int)   $car['battery_health']   : null;
    $car['electric_range']    = $car['electric_range']   !== null ? (int)   $car['electric_range']   : null;
    $car['battery_capacity']  = $car['battery_capacity'] !== null ? (float) $car['battery_capacity'] : null;
    $car['warranty_available']          = (bool) $car['warranty_available'];
    $car['financing_available']         = (bool) $car['financing_available'];
    $car['trade_in_available']          = (bool) $car['trade_in_available'];
    $car['service_history_available']   = (bool) $car['service_history_available'];
    $car['delivery_available_portugal'] = (bool) $car['delivery_available_portugal'];
    return $car;
}
