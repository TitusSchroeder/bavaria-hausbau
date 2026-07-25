<?php
/**
 * BAVARIA Hausbau GmbH – Server Media Library API
 * Returns list of all available images in assets/images/ in JSON format for the grid view.
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

$imagesDir = __DIR__ . '/../assets/images/';
$allowedExtensions = ['jpg', 'jpeg', 'png', 'webp', 'svg'];
$images = [];

if (is_dir($imagesDir)) {
    $files = scandir($imagesDir);
    foreach ($files as $file) {
        if ($file === '.' || $file === '..') continue;
        $ext = strtolower(pathinfo($file, PATHINFO_EXTENSION));
        if (in_array($ext, $allowedExtensions)) {
            $filePath = $imagesDir . $file;
            $images[] = [
                'name' => $file,
                'path' => 'assets/images/' . $file,
                'size' => filesize($filePath),
                'mtime' => filemtime($filePath)
            ];
        }
    }
}

// Sort by newest modified time
usort($images, function($a, $b) {
    return $b['mtime'] - $a['mtime'];
});

echo json_encode([
    'status' => 'success',
    'count' => count($images),
    'images' => $images
]);
