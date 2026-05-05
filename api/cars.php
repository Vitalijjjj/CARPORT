<?php
/**
 * GET  /api/cars.php           — public list (available/reserved)
 * GET  /api/cars.php?admin=1   — full list with auth (includes hidden/sold)
 * POST /api/cars.php           — create car (protected)
 * Upload to: public_html/api/cars.php
 */

require_once __DIR__ . '/config.php';
require_once __DIR__ . '/db.php';
require_once __DIR__ . '/auth.php';
require_once __DIR__ . '/car_helpers.php';

$method = getMethod();
$pdo    = getDB();

// ── GET — car list ─────────────────────────────────────────────────
if ($method === 'GET') {
    $isAdmin = false;

    // Admin mode: requires valid token
    if (!empty($_GET['admin'])) {
        $auth    = getAuthOptional();
        $isAdmin = $auth !== null;
    }

    if ($isAdmin) {
        $stmt = $pdo->query(
            'SELECT * FROM cars ORDER BY created_at DESC'
        );
    } else {
        $stmt = $pdo->query(
            "SELECT * FROM cars WHERE status NOT IN ('hidden', 'sold') ORDER BY created_at DESC"
        );
    }

    $cars = $stmt->fetchAll();
    foreach ($cars as &$car) {
        $car = decodeCar($car);
    }
    unset($car);

    jsonOk(['cars' => $cars]);
}

// ── POST — create car (protected) ─────────────────────────────────
if ($method === 'POST') {
    requireAuth();

    $body = getBody();

    if (empty(trim($body['brand'] ?? ''))) {
        jsonError('Brand is required');
    }
    if (empty(trim($body['model'] ?? ''))) {
        jsonError('Model is required');
    }
    if (empty($body['year']) || (int)$body['year'] < 1980) {
        jsonError('Valid year is required');
    }
    if (empty($body['price']) || (float)$body['price'] <= 0) {
        jsonError('Price must be greater than 0');
    }

    $slug = generateSlug($body);
    $data = buildCarData($body);
    $data['slug'] = $slug;

    $cols  = implode(', ', array_keys($data));
    $marks = ':' . implode(', :', array_keys($data));

    $pdo->prepare("INSERT INTO cars ($cols) VALUES ($marks)")->execute($data);

    $id = (int) $pdo->lastInsertId();
    jsonOk(['id' => $id, 'slug' => $slug], 201);
}

jsonError('Method not allowed', 405);
