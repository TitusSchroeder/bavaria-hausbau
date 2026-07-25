<?php
/**
 * BAVARIA Hausbau GmbH – Flat-File JSON Storage API
 * Receives inline editing data from agency-admin.js and updates assets/data/projects.json safely.
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['status' => 'error', 'message' => 'Nur POST Requests erlaubt.']);
    exit();
}

// Read raw JSON body
$rawInput = file_get_contents('php://input');
$inputData = json_decode($rawInput, true);

if (!$inputData || !isset($inputData['projectId'])) {
    echo json_encode(['status' => 'error', 'message' => 'Ungültige Daten übergeben.']);
    exit();
}

$projectId = $inputData['projectId'];
$fields = isset($inputData['fields']) ? $inputData['fields'] : [];

$dataFile = __DIR__ . '/../assets/data/projects.json';

if (!file_exists($dataFile)) {
    echo json_encode(['status' => 'error', 'message' => 'projects.json nicht gefunden.']);
    exit();
}

$jsonContent = file_get_contents($dataFile);
$data = json_decode($jsonContent, true);

if (!$data || !isset($data['projects'])) {
    echo json_encode(['status' => 'error', 'message' => 'projects.json Struktur ungültig.']);
    exit();
}

// Find and update project in array
$updated = false;
foreach ($data['projects'] as &$project) {
    if ($project['id'] === $projectId) {
        foreach ($fields as $key => $value) {
            $project[$key] = $value;
        }
        $updated = true;
        break;
    }
}

if ($updated) {
    file_put_contents($dataFile, json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
    echo json_encode(['status' => 'success', 'message' => 'Projektdaten erfolgreich auf dem Server gespeichert!']);
} else {
    echo json_encode(['status' => 'error', 'message' => 'Projekt ID nicht gefunden: ' . $projectId]);
}
