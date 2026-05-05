<?php
/**
 * POST /api/upload.php
 * Uploads a car image. Requires auth.
 * Field name: "image" (multipart/form-data)
 * Upload to: public_html/api/upload.php
 */

require_once __DIR__ . '/config.php';
require_once __DIR__ . '/db.php';
require_once __DIR__ . '/auth.php';

requireAuth();

if (getMethod() !== 'POST') {
    jsonError('Method not allowed', 405);
}

// ── Validate uploaded file ─────────────────────────────────────────
$uploadErrors = [
    UPLOAD_ERR_INI_SIZE   => 'File exceeds server upload limit',
    UPLOAD_ERR_FORM_SIZE  => 'File exceeds form upload limit',
    UPLOAD_ERR_PARTIAL    => 'File was only partially uploaded',
    UPLOAD_ERR_NO_FILE    => 'No file was uploaded',
    UPLOAD_ERR_NO_TMP_DIR => 'Missing temporary upload directory',
    UPLOAD_ERR_CANT_WRITE => 'Failed to write file to disk',
    UPLOAD_ERR_EXTENSION  => 'Upload stopped by a PHP extension',
];

if (empty($_FILES['image']) || $_FILES['image']['error'] !== UPLOAD_ERR_OK) {
    $code = $_FILES['image']['error'] ?? UPLOAD_ERR_NO_FILE;
    jsonError($uploadErrors[$code] ?? 'Unknown upload error', 400);
}

$file = $_FILES['image'];

// ── Check MIME type via finfo (not just extension) ─────────────────
$finfo    = new finfo(FILEINFO_MIME_TYPE);
$mimeType = $finfo->file($file['tmp_name']);

$allowedMimes = [
    'image/jpeg' => 'jpg',
    'image/jpg'  => 'jpg',
    'image/png'  => 'png',
    'image/webp' => 'webp',
];

if (!array_key_exists($mimeType, $allowedMimes)) {
    jsonError('Only JPEG, PNG, and WebP images are allowed', 400);
}

// ── Check file size ────────────────────────────────────────────────
if ($file['size'] > UPLOAD_MAX_BYTES) {
    $maxMb = UPLOAD_MAX_BYTES / 1024 / 1024;
    jsonError("File is too large — maximum is {$maxMb} MB", 400);
}

// ── Ensure upload directory exists ────────────────────────────────
if (!is_dir(UPLOAD_DIR)) {
    if (!mkdir(UPLOAD_DIR, 0755, true)) {
        jsonError('Failed to create upload directory', 500);
    }
}

if (!is_writable(UPLOAD_DIR)) {
    jsonError('Upload directory is not writable — check folder permissions (755)', 500);
}

// ── Move file to uploads/ ─────────────────────────────────────────
$ext      = $allowedMimes[$mimeType];
$filename = 'car_' . uniqid('', true) . '.' . $ext;
$destPath = UPLOAD_DIR . $filename;

if (!move_uploaded_file($file['tmp_name'], $destPath)) {
    jsonError('Failed to save uploaded file', 500);
}

$url = UPLOAD_URL_BASE . $filename;

jsonOk(['url' => $url, 'filename' => $filename]);
