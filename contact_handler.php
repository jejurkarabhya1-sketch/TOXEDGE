
<?php
// Turn on error logging (no display)
error_reporting(E_ALL);
ini_set("display_errors", 0);
ini_set("log_errors", 1);
ini_set("error_log", __DIR__ . "/contact_errors.log");

// Allow only POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    exit("Method Not Allowed");
}

// ADMIN EMAIL (YOUR EMAIL)
$adminEmail = "toxedgesolutions@gmail.com";

// USER INPUT
$fullname     = trim($_POST["fullname"] ?? "");
$email        = trim($_POST["email"] ?? "");
$organization = trim($_POST["organization"] ?? "");
$country      = trim($_POST["country"] ?? "");
$message      = trim($_POST["message"] ?? "");

// VALIDATION
$errors = [];

if (strlen($fullname) < 2)         $errors[] = "Full name is too short.";
if (!filter_var($email, FILTER_VALIDATE_EMAIL))
                                   $errors[] = "Invalid email address.";
if (strlen($message) < 10)         $errors[] = "Message is too short.";

if (!empty($errors)) {
    echo json_encode(["success" => false, "errors" => $errors]);
    exit;
}

// SANITIZE
$fullname     = htmlspecialchars($fullname);
$organization = htmlspecialchars($organization);
$country      = htmlspecialchars($country);
$message      = nl2br(htmlspecialchars($message));

// GoDaddy SMTP Settings (Production)
// Note: GoDaddy recommends using mail() function directly without explicit SMTP config
$fromEmail = "no-reply@toxedge.com"; // CHANGE THIS to your actual domain email

// For GoDaddy, use mail() function which routes through their server
// Optional: If you need explicit SMTP, use these settings:
// ini_set("SMTP", "relay-hosting.secureserver.net");
// ini_set("smtp_port", "25");

// Or use authenticated SMTP (more reliable):
// Host: secure.emailsrvr.com
// Port: 465 (SSL) or 587 (TLS)
// Note: Requires additional PHP Mail library configuration

// --------------------------------------
// ADMIN EMAIL (you receive the inquiry)
// --------------------------------------
$adminSubject = "New Contact Message - $fullname";

$adminHeaders  = "MIME-Version: 1.0\r\n";
$adminHeaders .= "Content-type: text/html; charset=UTF-8\r\n";
$adminHeaders .= "From: TOXEDGE <$fromEmail>\r\n";
$adminHeaders .= "Reply-To: $email\r\n";   // safe

$adminBody = "
<h2>New Contact Form Submission</h2>
<p><strong>Name:</strong> $fullname</p>
<p><strong>Email:</strong> $email</p>
<p><strong>Organization:</strong> $organization</p>
<p><strong>Country:</strong> $country</p>
<p><strong>Message:</strong><br>$message</p>
<p><strong>Date:</strong> ".date("d-M-Y H:i A")."</p>
";

$adminSent = mail($adminEmail, $adminSubject, $adminBody, $adminHeaders);

// --------------------------------------
// USER EMAIL (auto‑reply)
// --------------------------------------
$userSubject = "Thank You for Contacting TOXEDGE";

$userHeaders  = "MIME-Version: 1.0\r\n";
$userHeaders .= "Content-type: text/html; charset=UTF-8\r\n";
$userHeaders .= "From: TOXEDGE <$fromEmail>\r\n";
$userHeaders .= "Reply-To: $fromEmail\r\n";

$userBody = "
<h2>Thank You, $fullname</h2>
<p>We received your message and will get back to you within 24–48 hours.</p>
<p><strong>Your submitted details:</strong></p>
<p><strong>Name:</strong> $fullname<br>
<strong>Email:</strong> $email<br>
<strong>Organization:</strong> $organization<br>
<strong>Country:</strong> $country</p>
<p>If you need urgent help, email: toxedgesolutions@gmail.com</p>
";

$userSent = mail($email, $userSubject, $userBody, $userHeaders);

// Log results for debugging
$logMessage = "[" . date("Y-m-d H:i:s") . "] Admin email sent: " . ($adminSent ? "YES" : "NO") . " | User email sent: " . ($userSent ? "YES" : "NO") . " | From: $fromEmail | To: $adminEmail\n";
file_put_contents(__DIR__ . "/contact_log.txt", $logMessage, FILE_APPEND);

// Success response
if ($adminSent) {
    echo json_encode(["success" => true, "message" => "✅ Message sent successfully! We'll respond within 24-48 hours."]);
} else {
    // Log the specific error
    $errorLog = "Admin email failed - Check GoDaddy email settings. From: $fromEmail should be a valid cPanel email address.\n";
    file_put_contents(__DIR__ . "/contact_errors.log", $errorLog, FILE_APPEND);
    echo json_encode(["success" => false, "message" => "⚠️ Email failed. Ensure 'support@toxedge.com' is created in GoDaddy cPanel."]);
}
exit;
?>
