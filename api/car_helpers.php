<?php
/**
 * Shared helpers for cars.php and car.php.
 * Internal file — not a public endpoint.
 * Upload to: public_html/api/car_helpers.php
 */

require_once __DIR__ . '/config.php';
require_once __DIR__ . '/db.php';

// ── Decode DB row types for JSON output ────────────────────────────
function decodeCar(array $car): array
{
    $car['features']  = json_decode($car['features']  ?? '[]', true) ?? [];
    $car['id']        = (int)   $car['id'];
    $car['year']      = (int)   $car['year'];
    $car['price']     = (float) $car['price'];
    $car['mileage']   = (int)   $car['mileage'];
    $car['power']     = $car['power']            !== null ? (int)   $car['power']            : null;
    $car['battery_health']    = $car['battery_health']   !== null ? (int)   $car['battery_health']   : null;
    $car['electric_range']    = $car['electric_range']   !== null ? (int)   $car['electric_range']   : null;
    $car['battery_capacity']  = $car['battery_capacity'] !== null ? (float) $car['battery_capacity'] : null;
    $car['warranty_available']          = (bool) ($car['warranty_available']          ?? false);
    $car['financing_available']         = (bool) ($car['financing_available']         ?? false);
    $car['trade_in_available']          = (bool) ($car['trade_in_available']          ?? false);
    $car['service_history_available']   = (bool) ($car['service_history_available']   ?? false);
    $car['delivery_available_portugal'] = (bool) ($car['delivery_available_portugal'] ?? false);
    return $car;
}

// ── Build a sanitized data array from request body ─────────────────
function buildCarData(array $body): array
{
    $nullableInt   = fn($v) => ($v !== '' && $v !== null) ? (int)   $v : null;
    $nullableFloat = fn($v) => ($v !== '' && $v !== null) ? (float) $v : null;
    $nullableStr   = fn($v) => ($v !== '' && $v !== null) ? trim((string) $v) : null;

    $allowedStatuses      = ['available', 'reserved', 'sold', 'hidden'];
    $allowedFuelTypes     = ['electric', 'hybrid', 'petrol', 'diesel'];
    $allowedTransmissions = ['automatic', 'manual'];

    $status       = in_array($body['status']       ?? '', $allowedStatuses,      true) ? $body['status']       : 'available';
    $fuelType     = in_array($body['fuel_type']    ?? '', $allowedFuelTypes,     true) ? $body['fuel_type']    : 'electric';
    $transmission = in_array($body['transmission'] ?? '', $allowedTransmissions, true) ? $body['transmission'] : 'automatic';

    return [
        'brand'                       => trim($body['brand']  ?? ''),
        'model'                       => trim($body['model']  ?? ''),
        'version'                     => $nullableStr($body['version']            ?? null),
        'year'                        => (int)   ($body['year']                  ?? 0),
        'price'                       => (float) ($body['price']                 ?? 0),
        'mileage'                     => (int)   ($body['mileage']               ?? 0),
        'fuel_type'                   => $fuelType,
        'transmission'                => $transmission,
        'power'                       => $nullableInt($body['power']             ?? null),
        'battery_capacity'            => $nullableFloat($body['battery_capacity'] ?? null),
        'battery_health'              => $nullableInt($body['battery_health']    ?? null),
        'electric_range'              => $nullableInt($body['electric_range']    ?? null),
        'drive_type'                  => $nullableStr($body['drive_type']        ?? null),
        'exterior_color'              => $nullableStr($body['exterior_color']    ?? null),
        'interior_color'              => $nullableStr($body['interior_color']    ?? null),
        'location'                    => $nullableStr($body['location']          ?? null),
        'status'                      => $status,
        'warranty_available'          => (int)(bool)($body['warranty_available']          ?? false),
        'warranty_term'               => $nullableStr($body['warranty_term']              ?? null),
        'financing_available'         => (int)(bool)($body['financing_available']         ?? false),
        'trade_in_available'          => (int)(bool)($body['trade_in_available']          ?? false),
        'service_history_available'   => (int)(bool)($body['service_history_available']   ?? false),
        'delivery_available_portugal' => (int)(bool)($body['delivery_available_portugal'] ?? false),
        'short_description'           => $nullableStr($body['short_description']  ?? null),
        'full_description'            => $nullableStr($body['full_description']   ?? null),
        'equipment'                   => $nullableStr($body['equipment']          ?? null),
        'features'                    => json_encode(
            array_values((array)($body['features'] ?? [])),
            JSON_UNESCAPED_UNICODE
        ),
        'main_image'                  => $nullableStr($body['main_image']         ?? null),
        'meta_title'                  => $nullableStr($body['meta_title']         ?? null),
        'meta_description'            => $nullableStr($body['meta_description']   ?? null),
    ];
}

// ── Generate a unique slug from brand + model + year ───────────────
function generateSlug(array $body): string
{
    $raw  = ($body['brand'] ?? '') . ' ' . ($body['model'] ?? '') . ' ' . ($body['year'] ?? '');
    $base = strtolower(trim($raw));
    $base = preg_replace('/[^a-z0-9]+/', '-', $base);
    $base = trim($base, '-');

    $pdo  = getDB();
    $slug = $base;
    $n    = 1;

    while (true) {
        $stmt = $pdo->prepare('SELECT id FROM cars WHERE slug = ? LIMIT 1');
        $stmt->execute([$slug]);
        if ($stmt->fetch() === false) {
            break;
        }
        $slug = $base . '-' . (++$n);
    }

    return $slug;
}
