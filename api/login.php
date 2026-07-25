<?php
/**
 * BAVARIA Hausbau GmbH – Server-Side Admin Authentication API
 * Secure password validation using SHA-256 cryptographic hash.
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

session_start();

// SHA-256 cryptographic hash of "bavaria2026"
$targetHash = '7d23588939c09c31411516fecae9d13f99017688f1807d4b4dd52d36484e5b95';

$input = json_decode(file_get_contents('php://input'), true);
$password = isset($input['password']) ? trim($input['password']) : '';

if (!empty($password) && hash('sha256', $password) === $targetHash) {
    $_SESSION['bavaria_admin_authenticated'] = true;
    $token = bin2hex(random_bytes(16));
    $_SESSION['admin_token'] = $token;

    echo json_encode([
        'status' => 'success',
        'token' => $token,
        'message' => 'Erfolgreich angemeldet'
    ]);
} else {
    http_response_code(401);
    echo json_encode([
        'status' => 'error',
        'message' => 'Falsches Passwort'
    ]);
}
