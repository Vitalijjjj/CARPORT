<?php
/**
 * GET /api/health.php
 * Returns API and DB status.
 * Upload to: public_html/api/health.php
 */

require_once __DIR__ . '/config.php';
require_once __DIR__ . '/db.php';

if (getMethod() !== 'GET') {
    jsonError('Method not allowed', 405);
}

$dbStatus = 'disconnected';

try {
    $pdo = getDB();
    $pdo->query('SELECT 1');
    $dbStatus = 'connected';
} catch (Exception $e) {
    $dbStatus = 'error: ' . $e->getMessage();
}

jsonOk([
    'message' => 'API is working',
    'db'      => $dbStatus,
    'time'    => date('Y-m-d H:i:s'),
]);
