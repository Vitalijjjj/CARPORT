<?php
require_once __DIR__ . '/config.php';

requireAuth();

if (getMethod() !== 'POST') {
    jsonResponse(['error' => 'Method not allowed'], 405);
}

// ── Validate uploaded file ─────────────────────────────────────────
if (empty($_FILES['image']) || $_FILES['image']['error'] !== UPLOAD_ERR_OK) {
    $uploadErrors = [
        UPLOAD_ERR_INI_SIZE   => 'File exceeds server upload limit',
        UPLOAD_ERR_FORM_SIZE  => 'File exceeds form upload limit',
        UPLOAD_ERR_PARTIAL    => 'File was only partially uploaded',
        UPLOAD_ERR_NO_FILE    => 'No file was uploaded',
        UPLOAD_ERR_NO_TMP_DIR => 'Missing temporary upload directory',
        UPLOAD_ERR_CANT_WRITE => 'Failed to write file to disk',
        UPLOAD_ERR_EXTENSION  => 'Upload stopped by PHP extension',
    ];
    $errCode = $_FILES['image']['error'] ?? UPLOAD_ERR_NO_FILE;
    $errMsg  = $uploadErrors[$errCode] ?? 'Unknown upload error';
    jsonResponse(['error' => $errMsg], 400);
}

$file = $_FILES['image'];

// ── Check MIME type via finfo (not just extension) ─────────────────
$finfo    = new finfo(FILEINFO_MIME_TYPE);
$mimeType = $finfo->file($file['tmp_name']);

$allowedMimes = [
    'image/jpeg' => 'jpg',
    'image/png'  => 'png',
    'image/webp' => 'webp',
];

if (!isset($allowedMimes[$mimeType])) {
    jsonResponse(['error' => 'Only JPEG, PNG, and WebP images are allowed'], 400);
}

// ── Check file size ────────────────────────────────────────────────
if ($file['size'] > UPLOAD_MAX_BYTES) {
    $maxMb = UPLOAD_MAX_BYTES / 1024 / 1024;
    jsonResponse(['error' => "File is too large — maximum allowed is {$maxMb} MB"], 400);
}

// ── Ensure upload directory exists and is writable ─────────────────
if (!is_dir(UPLOAD_DIR)) {
    if (!mkdir(UPLOAD_DIR, 0755, true)) {
        jsonResponse(['error' => 'Failed to create upload directory'], 500);
    }
}

if (!is_writable(UPLOAD_DIR)) {
    jsonResponse(['error' => 'Upload directory is not writable'], 500);
}

// ── Generate a unique filename and move the file ───────────────────
$extension = $allowedMimes[$mimeType];
$filename  = 'car_' . uniqid('', true) . '.' . $extension;
$destPath  = UPLOAD_DIR . $filename;

if (!move_uploaded_file($file['tmp_name'], $destPath)) {
    jsonResponse(['error' => 'Failed to save uploaded file'], 500);
}

$url = UPLOAD_URL_BASE . $filename;
jsonResponse(['url' => $url, 'filename' => $filename]);
