<?php
require_once __DIR__ . '/config.php';

requireAuth();

$method = getMethod();
$id     = isset($_GET['id']) ? (int) $_GET['id'] : null;
$pdo    = getDB();

// ── Sanitize & cast incoming car data ──────────────────────────────
function sanitizeCar(array $body): array
{
    $nullableInt   = fn($v) => ($v !== '' && $v !== null) ? (int)   $v : null;
    $nullableFloat = fn($v) => ($v !== '' && $v !== null) ? (float) $v : null;
    $nullableStr   = fn($v) => ($v !== '' && $v !== null) ? trim((string) $v) : null;

    $allowedStatuses       = ['available', 'reserved', 'sold', 'hidden'];
    $allowedFuelTypes      = ['electric', 'hybrid', 'petrol', 'diesel'];
    $allowedTransmissions  = ['automatic', 'manual'];

    $status       = $body['status']       ?? 'available';
    $fuelType     = $body['fuel_type']    ?? 'electric';
    $transmission = $body['transmission'] ?? 'automatic';

    return [
        'brand'                       => trim($body['brand']   ?? ''),
        'model'                       => trim($body['model']   ?? ''),
        'version'                     => $nullableStr($body['version']   ?? null),
        'year'                        => (int)   ($body['year']          ?? 0),
        'price'                       => (float) ($body['price']         ?? 0),
        'mileage'                     => (int)   ($body['mileage']       ?? 0),
        'fuel_type'                   => in_array($fuelType,     $allowedFuelTypes,     true) ? $fuelType     : 'electric',
        'transmission'                => in_array($transmission, $allowedTransmissions, true) ? $transmission : 'automatic',
        'power'                       => $nullableInt($body['power']            ?? null),
        'battery_capacity'            => $nullableFloat($body['battery_capacity'] ?? null),
        'battery_health'              => $nullableInt($body['battery_health']   ?? null),
        'electric_range'              => $nullableInt($body['electric_range']   ?? null),
        'drive_type'                  => $nullableStr($body['drive_type']       ?? null),
        'exterior_color'              => $nullableStr($body['exterior_color']   ?? null),
        'interior_color'              => $nullableStr($body['interior_color']   ?? null),
        'location'                    => $nullableStr($body['location']         ?? null),
        'status'                      => in_array($status, $allowedStatuses, true) ? $status : 'available',
        'warranty_available'          => (int) (bool) ($body['warranty_available']          ?? false),
        'warranty_term'               => $nullableStr($body['warranty_term']               ?? null),
        'financing_available'         => (int) (bool) ($body['financing_available']         ?? false),
        'trade_in_available'          => (int) (bool) ($body['trade_in_available']          ?? false),
        'service_history_available'   => (int) (bool) ($body['service_history_available']   ?? false),
        'delivery_available_portugal' => (int) (bool) ($body['delivery_available_portugal'] ?? false),
        'short_description'           => $nullableStr($body['short_description'] ?? null),
        'full_description'            => $nullableStr($body['full_description']  ?? null),
        'equipment'                   => $nullableStr($body['equipment']         ?? null),
        'features'                    => json_encode(array_values((array) ($body['features'] ?? [])), JSON_UNESCAPED_UNICODE),
        'gallery'                     => json_encode(array_values((array) ($body['gallery']  ?? [])), JSON_UNESCAPED_UNICODE),
        'main_image'                  => $nullableStr($body['main_image']        ?? null),
        'meta_title'                  => $nullableStr($body['meta_title']        ?? null),
        'meta_description'            => $nullableStr($body['meta_description']  ?? null),
    ];
}

// ── GET — list all cars or fetch one by ID ─────────────────────────
if ($method === 'GET') {
    if ($id !== null) {
        $stmt = $pdo->prepare('SELECT * FROM cars WHERE id = ? LIMIT 1');
        $stmt->execute([$id]);
        $car = $stmt->fetch();
        if ($car === false) {
            jsonResponse(['error' => 'Car not found'], 404);
        }
        jsonResponse(decodeCar($car));
    }

    $stmt = $pdo->query('SELECT * FROM cars ORDER BY created_at DESC');
    $cars = $stmt->fetchAll();
    jsonResponse(array_map('decodeCar', $cars));
}

// ── POST — create new car ──────────────────────────────────────────
if ($method === 'POST') {
    $body = getBody();
    $data = sanitizeCar($body);

    if (trim($data['brand']) === '') {
        jsonResponse(['error' => 'Brand is required'], 422);
    }
    if (trim($data['model']) === '') {
        jsonResponse(['error' => 'Model is required'], 422);
    }
    if ($data['year'] < 1980 || $data['year'] > (int) date('Y') + 1) {
        jsonResponse(['error' => 'Invalid year'], 422);
    }
    if ($data['price'] <= 0) {
        jsonResponse(['error' => 'Price must be greater than 0'], 422);
    }

    $cols         = implode(', ', array_keys($data));
    $placeholders = ':' . implode(', :', array_keys($data));
    $stmt = $pdo->prepare("INSERT INTO cars ($cols) VALUES ($placeholders)");
    $stmt->execute($data);

    $newId = (int) $pdo->lastInsertId();
    jsonResponse(['id' => $newId, 'ok' => true], 201);
}

// ── PUT — replace all fields of an existing car ────────────────────
if ($method === 'PUT') {
    if ($id === null) {
        jsonResponse(['error' => 'ID is required'], 400);
    }

    $body = getBody();
    $data = sanitizeCar($body);

    $sets = implode(', ', array_map(fn($k) => "$k = :$k", array_keys($data)));
    $data['id'] = $id;

    $stmt = $pdo->prepare("UPDATE cars SET $sets, updated_at = NOW() WHERE id = :id");
    $stmt->execute($data);

    if ($stmt->rowCount() === 0) {
        // Check if car actually exists
        $check = $pdo->prepare('SELECT id FROM cars WHERE id = ? LIMIT 1');
        $check->execute([$id]);
        if ($check->fetch() === false) {
            jsonResponse(['error' => 'Car not found'], 404);
        }
    }

    jsonResponse(['ok' => true]);
}

// ── PATCH — update only specific fields (e.g. quick status change) ─
if ($method === 'PATCH') {
    if ($id === null) {
        jsonResponse(['error' => 'ID is required'], 400);
    }

    $body          = getBody();
    $allowedFields = ['status', 'main_image'];
    $sets          = [];
    $params        = ['id' => $id];

    foreach ($allowedFields as $field) {
        if (array_key_exists($field, $body)) {
            $sets[]        = "$field = :$field";
            $params[$field] = $body[$field];
        }
    }

    if (empty($sets)) {
        jsonResponse(['error' => 'No updatable fields provided'], 400);
    }

    $stmt = $pdo->prepare('UPDATE cars SET ' . implode(', ', $sets) . ', updated_at = NOW() WHERE id = :id');
    $stmt->execute($params);

    jsonResponse(['ok' => true]);
}

// ── DELETE — remove a car ──────────────────────────────────────────
if ($method === 'DELETE') {
    if ($id === null) {
        jsonResponse(['error' => 'ID is required'], 400);
    }

    $stmt = $pdo->prepare('DELETE FROM cars WHERE id = ?');
    $stmt->execute([$id]);

    if ($stmt->rowCount() === 0) {
        jsonResponse(['error' => 'Car not found'], 404);
    }

    jsonResponse(['ok' => true]);
}

jsonResponse(['error' => 'Method not allowed'], 405);
