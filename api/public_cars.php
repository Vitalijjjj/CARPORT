<?php
require_once __DIR__ . '/config.php';

// Public read-only endpoint — no authentication required.
// Returns only cars that are not hidden or sold.

if (getMethod() !== 'GET') {
    jsonResponse(['error' => 'Method not allowed'], 405);
}

$id  = isset($_GET['id']) ? (int) $_GET['id'] : null;
$pdo = getDB();

if ($id !== null) {
    $stmt = $pdo->prepare(
        "SELECT * FROM cars WHERE id = ? AND status NOT IN ('hidden', 'sold') LIMIT 1"
    );
    $stmt->execute([$id]);
    $car = $stmt->fetch();
    if ($car === false) {
        jsonResponse(['error' => 'Not found'], 404);
    }
    jsonResponse(decodeCar($car));
}

$stmt = $pdo->query(
    "SELECT * FROM cars WHERE status NOT IN ('hidden', 'sold') ORDER BY created_at DESC"
);
$cars = $stmt->fetchAll();
jsonResponse(array_map('decodeCar', $cars));
