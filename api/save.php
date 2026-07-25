<?php
/**
 * BAVARIA Hausbau GmbH – Standalone Server Storage API
 * Handles instant saving of inline edits into assets/data/projects.json on IONOS / Webhosting servers.
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['status' => 'error', 'message' => 'Nur POST Requests erlaubt.']);
    exit();
}

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
    // If file does not exist, attempt to create it
    $dir = dirname($dataFile);
    if (!is_dir($dir)) {
        @mkdir($dir, 0777, true);
    }
    @file_put_contents($dataFile, json_encode(['projects' => []]));
}

// Attempt to ensure write permissions
@chmod($dataFile, 0666);
@chmod(dirname($dataFile), 0777);

$jsonContent = file_get_contents($dataFile);
$data = json_decode($jsonContent, true);

if (!$data) {
    $data = ['projects' => []];
}

if (!isset($data['projects']) || !is_array($data['projects'])) {
    $data['projects'] = [];
}

// Find existing project or create entry
$foundIndex = -1;
foreach ($data['projects'] as $index => $project) {
    if (isset($project['id']) && $project['id'] === $projectId) {
        $foundIndex = $index;
        break;
    }
}

if ($foundIndex >= 0) {
    foreach ($fields as $key => $value) {
        $data['projects'][$foundIndex][$key] = $value;
    }
} else {
    $newProject = array_merge(['id' => $projectId], $fields);
    $data['projects'][] = $newProject;
}

// Save back to JSON file
$encoded = json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
$bytesWritten = @file_put_contents($dataFile, $encoded);

if ($bytesWritten !== false) {
    echo json_encode([
        'status' => 'success',
        'message' => 'Erfolgreich auf dem Server gespeichert!',
        'projectId' => $projectId,
        'savedFields' => $fields
    ]);
} else {
    echo json_encode([
        'status' => 'error',
        'message' => 'Schreibrechte fehlen auf assets/data/projects.json. Bitte Ordnerrechte im FTP freigeben.'
    ]);
}
