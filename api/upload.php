<?php
/**
 * BAVARIA Hausbau GmbH – Image Upload & Cropped Image Handler API
 * Receives file uploads or base64 cropped canvas data and saves them in assets/images/.
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

$targetDir = __DIR__ . '/../assets/images/';
if (!is_dir($targetDir)) {
    @mkdir($targetDir, 0777, true);
}

@chmod($targetDir, 0777);

// Case 1: Base64 cropped image data sent in JSON body
$rawInput = file_get_contents('php://input');
$inputData = json_decode($rawInput, true);

if ($inputData && isset($inputData['imageData'])) {
    $imageData = $inputData['imageData'];
    if (preg_match('/^data:image\/(\w+);base64,/', $imageData, $type)) {
        $data = substr($imageData, strpos($imageData, ',') + 1);
        $ext = strtolower($type[1]); // e.g. png, jpeg, webp
        if (!in_array($ext, ['jpg', 'jpeg', 'png', 'webp'])) {
            $ext = 'png';
        }
        $data = base64_decode($data);
        if ($data === false) {
            echo json_encode(['status' => 'error', 'message' => 'Base64 Dekodierungsfehler.']);
            exit();
        }

        $filename = 'crop_' . time() . '_' . rand(100, 999) . '.' . $ext;
        $targetFile = $targetDir . $filename;

        if (file_put_contents($targetFile, $data)) {
            @chmod($targetFile, 0666);
            echo json_encode([
                'status' => 'success',
                'message' => 'Zugeschnittenes Bild erfolgreich gespeichert!',
                'path' => 'assets/images/' . $filename,
                'filename' => $filename
            ]);
            exit();
        } else {
            echo json_encode(['status' => 'error', 'message' => 'Fehler beim Speichern in assets/images/.']);
            exit();
        }
    }
}

// Case 2: Multipart File Upload
if (isset($_FILES['image'])) {
    $file = $_FILES['image'];
    $allowed = ['jpg', 'jpeg', 'png', 'webp', 'svg'];
    $ext = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));

    if (!in_array($ext, $allowed)) {
        echo json_encode(['status' => 'error', 'message' => 'Dateityp nicht erlaubt. Nur JPG, PNG, WEBP, SVG.']);
        exit();
    }

    if ($file['size'] > 15 * 1024 * 1024) {
        echo json_encode(['status' => 'error', 'message' => 'Datei zu groß (Max 15MB).']);
        exit();
    }

    $safeName = preg_replace('/[^a-zA-Z0-9_-]/', '', pathinfo($file['name'], PATHINFO_FILENAME));
    $filename = 'upload_' . time() . '_' . $safeName . '.' . $ext;
    $targetFile = $targetDir . $filename;

    if (move_uploaded_file($file['tmp_name'], $targetFile)) {
        @chmod($targetFile, 0666);
        echo json_encode([
            'status' => 'success',
            'message' => 'Bild erfolgreich hochgeladen!',
            'path' => 'assets/images/' . $filename,
            'filename' => $filename
        ]);
        exit();
    } else {
        echo json_encode(['status' => 'error', 'message' => 'Fehler beim Verschieben der Datei.']);
        exit();
    }
}

echo json_encode(['status' => 'error', 'message' => 'Keine Bilddaten empfangen.']);
