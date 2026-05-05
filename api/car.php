<?php
/**
 * GET    /api/car.php?slug=...   — public car detail with images
 * PUT    /api/car.php?id=...     — update car (protected)
 * DELETE /api/car.php?id=...     — hide or delete car (protected)
 *                                   add &action=delete to hard-delete
 * Upload to: public_html/api/car.php
 */

require_once __DIR__ . '/config.php';
require_once __DIR__ . '/db.php';
require_once __DIR__ . '/auth.php';
require_once __DIR__ . '/car_helpers.php';

$method = getMethod();
$pdo    = getDB();
$slug   = $_GET['slug'] ?? null;
$id     = isset($_GET['id']) ? (int) $_GET['id'] : null;

// ── GET by slug — public ───────────────────────────────────────────
if ($method === 'GET') {
    if (!$slug) {
        jsonError('slug parameter is required');
    }

    $stmt = $pdo->prepare(
        "SELECT * FROM cars WHERE slug = ? AND status NOT IN ('hidden', 'sold') LIMIT 1"
    );
    $stmt->execute([$slug]);
    $car = $stmt->fetch();

    if ($car === false) {
        jsonError('Car not found', 404);
    }

    $car = decodeCar($car);

    // Attach images from car_images table
    $imgStmt = $pdo->prepare(
        'SELECT id, url, is_main, sort_order FROM car_images
         WHERE car_id = ? ORDER BY is_main DESC, sort_order ASC, id ASC'
    );
    $imgStmt->execute([$car['id']]);
    $images = $imgStmt->fetchAll();

    foreach ($images as &$img) {
        $img['id']      = (int)  $img['id'];
        $img['is_main'] = (bool) $img['is_main'];
        $img['sort_order'] = (int) $img['sort_order'];
    }
    unset($img);

    $car['images'] = $images;

    jsonOk(['car' => $car]);
}

// ── PUT — update car (protected) ──────────────────────────────────
if ($method === 'PUT') {
    requireAuth();

    if (!$id) {
        jsonError('id parameter is required');
    }

    $body = getBody();
    $data = buildCarData($body);

    // Rebuild slug if brand/model/year changed
    if (!empty($body['brand']) && !empty($body['model']) && !empty($body['year'])) {
        // Only regenerate slug if brand/model/year actually changed
        $check = $pdo->prepare('SELECT brand, model, year, slug FROM cars WHERE id = ? LIMIT 1');
        $check->execute([$id]);
        $existing = $check->fetch();

        if ($existing) {
            $brandChanged = strtolower($existing['brand']) !== strtolower($body['brand'] ?? '');
            $modelChanged = strtolower($existing['model']) !== strtolower($body['model'] ?? '');
            $yearChanged  = (int)$existing['year'] !== (int)($body['year'] ?? 0);

            if ($brandChanged || $modelChanged || $yearChanged) {
                $data['slug'] = generateSlug($body);
            }
        }
    }

    $sets = implode(', ', array_map(fn($k) => "$k = :$k", array_keys($data)));
    $data['id'] = $id;

    $stmt = $pdo->prepare("UPDATE cars SET $sets, updated_at = NOW() WHERE id = :id");
    $stmt->execute($data);

    if ($stmt->rowCount() === 0) {
        $exists = $pdo->prepare('SELECT id FROM cars WHERE id = ? LIMIT 1');
        $exists->execute([$id]);
        if ($exists->fetch() === false) {
            jsonError('Car not found', 404);
        }
    }

    jsonOk(['message' => 'Car updated']);
}

// ── DELETE — hide or hard-delete (protected) ───────────────────────
if ($method === 'DELETE') {
    requireAuth();

    if (!$id) {
        jsonError('id parameter is required');
    }

    $action = $_GET['action'] ?? 'hide';

    if ($action === 'delete') {
        // Remove images from car_images table first
        $pdo->prepare('DELETE FROM car_images WHERE car_id = ?')->execute([$id]);

        $stmt = $pdo->prepare('DELETE FROM cars WHERE id = ?');
        $stmt->execute([$id]);

        if ($stmt->rowCount() === 0) {
            jsonError('Car not found', 404);
        }

        jsonOk(['message' => 'Car permanently deleted']);
    } else {
        // Soft-delete: set status to hidden
        $stmt = $pdo->prepare(
            "UPDATE cars SET status = 'hidden', updated_at = NOW() WHERE id = ?"
        );
        $stmt->execute([$id]);

        if ($stmt->rowCount() === 0) {
            $exists = $pdo->prepare('SELECT id FROM cars WHERE id = ? LIMIT 1');
            $exists->execute([$id]);
            if ($exists->fetch() === false) {
                jsonError('Car not found', 404);
            }
        }

        jsonOk(['message' => 'Car hidden']);
    }
}

jsonError('Method not allowed', 405);
