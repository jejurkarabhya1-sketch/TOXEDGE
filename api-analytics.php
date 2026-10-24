<?php
/**
 * TOXEDGE Analytics Backend (PHP)
 * Works on GoDaddy shared hosting
 */

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json');

// Handle CORS preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit(json_encode(['status' => 'ok']));
}

$analyticsFile = dirname(__FILE__) . '/analytics_data.json';

// Initialize analytics data
function initAnalytics() {
    return [
        'uniqueVisitors' => 0,
        'totalViews' => 0,
        'pageViews' => [],
        'sectionViews' => [],
        'avgSessionTime' => 0,
        'bounceRate' => 0,
        'totalSessions' => 0,
        'visitorSessions' => [],
        'lastUpdated' => date('c')
    ];
}

// Load analytics from file
function loadAnalytics() {
    global $analyticsFile;
    if (file_exists($analyticsFile)) {
        $content = file_get_contents($analyticsFile);
        $data = json_decode($content, true);
        return $data ?: initAnalytics();
    }
    return initAnalytics();
}

// Save analytics to file
function saveAnalytics($data) {
    global $analyticsFile;
    return file_put_contents($analyticsFile, json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES));
}

// Handle POST: Track visitor data
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!$input) {
        http_response_code(400);
        echo json_encode(['status' => 'error', 'message' => 'Invalid JSON']);
        exit;
    }
    
    $analytics = loadAnalytics();
    
    // Track page view
    $page = $input['page'] ?? 'unknown';
    if (!isset($analytics['pageViews'][$page])) {
        $analytics['pageViews'][$page] = 0;
    }
    $analytics['pageViews'][$page] += intval($input['pageViewCount'] ?? 1);
    $analytics['totalViews'] = array_sum($analytics['pageViews']);
    
    // Track section views
    if (isset($input['sectionViews']) && is_array($input['sectionViews'])) {
        foreach ($input['sectionViews'] as $section => $count) {
            if (!isset($analytics['sectionViews'][$section])) {
                $analytics['sectionViews'][$section] = 0;
            }
            $analytics['sectionViews'][$section] += intval($count);
        }
    }
    
    // Track unique visitors
    $sessionId = $input['sessionId'] ?? null;
    if ($sessionId && !in_array($sessionId, $analytics['visitorSessions'])) {
        $analytics['visitorSessions'][] = $sessionId;
        $analytics['uniqueVisitors'] = count($analytics['visitorSessions']);
    }
    
    // Update session metrics
    $sessionTime = intval($input['sessionTime'] ?? 0);
    if ($sessionTime > 0) {
        $prev_avg = intval($analytics['avgSessionTime']);
        $total = intval($analytics['totalSessions']);
        $analytics['avgSessionTime'] = intval(($prev_avg * $total + $sessionTime) / ($total + 1));
        $analytics['totalSessions']++;
    }
    
    // Update bounce rate
    if (isset($input['bounceRate'])) {
        $analytics['bounceRate'] = floatval($input['bounceRate']);
    }
    
    $analytics['lastUpdated'] = date('c');
    
    // Save and respond
    if (saveAnalytics($analytics)) {
        http_response_code(200);
        echo json_encode(['status' => 'success']);
    } else {
        http_response_code(500);
        echo json_encode(['status' => 'error', 'message' => 'Failed to save analytics']);
    }
    exit;
}

// Handle GET: Fetch analytics data
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $analytics = loadAnalytics();
    http_response_code(200);
    echo json_encode($analytics);
    exit;
}

http_response_code(405);
echo json_encode(['status' => 'error', 'message' => 'Method not allowed']);
?>
