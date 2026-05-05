<?php
/**
 * POST /api/quiz.php
 * Creates a lead from the quiz widget. source = 'quiz'.
 * No auth required.
 * Upload to: public_html/api/quiz.php
 */

require_once __DIR__ . '/config.php';
require_once __DIR__ . '/db.php';

if (getMethod() !== 'POST') {
    jsonError('Method not allowed', 405);
}

$body = getBody();

$name         = trim($body['name']    ?? '');
$phone        = trim($body['phone']   ?? '');
$email        = trim($body['email']   ?? '');
$message      = trim($body['message'] ?? '');
$quizAnswers  = $body['answers']      ?? $body['quiz_answers'] ?? null;

if ($name === '' && $phone === '' && $email === '') {
    jsonError('At least name, phone, or email is required');
}

$answersJson = $quizAnswers !== null
    ? json_encode($quizAnswers, JSON_UNESCAPED_UNICODE)
    : null;

$pdo = getDB();

// Check if leads table has quiz_answers column
try {
    $pdo->prepare(
        'INSERT INTO leads (name, phone, email, message, source, quiz_answers)
         VALUES (:name, :phone, :email, :message, :source, :quiz_answers)'
    )->execute([
        ':name'         => $name        ?: null,
        ':phone'        => $phone       ?: null,
        ':email'        => $email       ?: null,
        ':message'      => $message     ?: null,
        ':source'       => 'quiz',
        ':quiz_answers' => $answersJson,
    ]);
} catch (PDOException $e) {
    // Fallback if quiz_answers column does not exist yet
    $pdo->prepare(
        'INSERT INTO leads (name, phone, email, message, source)
         VALUES (:name, :phone, :email, :message, :source)'
    )->execute([
        ':name'    => $name    ?: null,
        ':phone'   => $phone   ?: null,
        ':email'   => $email   ?: null,
        ':message' => $message ?: null,
        ':source'  => 'quiz',
    ]);
}

jsonOk(['message' => 'Quiz submitted successfully. We will be in touch soon!']);
