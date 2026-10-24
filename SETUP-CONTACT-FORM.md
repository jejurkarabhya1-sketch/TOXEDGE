## 📧 TOXEDGE Contact Form Setup Guide - GoDaddy

### Problem
Contact form submissions are failing. The PHP handler needs proper GoDaddy email configuration.

---

## ✅ Step 1: Create Email Address in GoDaddy cPanel

1. **Log in to GoDaddy cPanel** (usually at `cPanel.yourdomainname.com` or through GoDaddy dashboard)
2. Go to **Email Accounts** (or Email section)
3. Click **Create** → Create a new email address:
   - **Email:** `support@yourdomain.com` (or `info@yourdomain.com`, `noreply@yourdomain.com`)
   - **Password:** Set a strong password (you won't need it to send, but keep it for reference)
4. **Save and note the exact email address**

**Example:** If your domain is `toxedge.com`:
- Create: `support@toxedge.com`

---

## ✅ Step 2: Update PHP Configuration

Edit `contact_handler.php` and find this section (around line 44):

```php
$fromEmail = "support@toxedge.com"; // CHANGE THIS to your actual domain email
$adminEmail = "toxedgesolutions@gmail.com"; // CHANGE THIS to where you want to receive inquiries
```

**Update these two variables:**
- `$fromEmail` → Use the email you just created (e.g., `support@toxedge.com`)
- `$adminEmail` → Your personal email where you want to receive contact inquiries (e.g., `your-email@gmail.com`)

**Save the file**

---

## ✅ Step 3: Upload Files to GoDaddy

Upload these files to your domain root:
- `contact_handler.php` (updated)
- `contact.html` (no changes needed)

---

## ✅ Step 4: Test the Contact Form

1. Go to your website's **Contact page**
2. Fill out the form:
   - Full Name: `Test User`
   - Email: `your-email@gmail.com`
   - Organization: `Test`
   - Country: `USA`
   - Message: `This is a test message`
3. Click **Send**

### Expected Results:
- ✅ You should see: "✓ Message Sent Successfully!"
- ✅ Email arrives at your `$adminEmail` address
- ✅ Visitor gets an auto-reply email from `support@yourdomain.com`

---

## 🔧 Troubleshooting

### Email Still Not Sending?

**Check error logs:**
1. Via FTP, download these files from your domain root:
   - `contact_errors.log`
   - `contact_log.txt`
2. Open and check for error messages

**Common Issues:**

| Issue | Solution |
|-------|----------|
| `From: no-reply@yourdomain.com` | Create that email in cPanel or change to existing one |
| `Mail function disabled` | Contact GoDaddy support (rare) |
| Email goes to spam | Add SPF/DKIM records (see Step 5) |
| `DNS/Mail relay error` | Ensure GoDaddy email account is created first |

---

## ✅ Step 5 (Optional): Add SPF Record to Prevent Spam

This is optional but recommended to prevent emails going to spam:

1. Log into GoDaddy DNS management
2. Add SPF Record:
   - **Name:** `@`
   - **Type:** `TXT`
   - **Value:** `v=spf1 include:godaddy.com ~all`
3. Save and wait 24 hours for propagation

---

## 📝 What Happens When Someone Submits the Form

1. User fills contact form ✍️
2. JavaScript sends data to `contact_handler.php` 📤
3. PHP validates the data ✅
4. **Email 1:** Admin email sent to `$adminEmail` (you receive the inquiry)
5. **Email 2:** Auto-reply sent to visitor's email
6. Response JSON returned to frontend ↩️
7. User sees success message ✓

---

## 🆘 Still Not Working?

Contact GoDaddy Support and provide:
- Account name/email
- Domain name
- Error from `contact_log.txt` file
- They can verify SMTP relay and email routing settings

---

**Setup Time:** 5 minutes  
**Testing Time:** 2-3 minutes  
**Status:** Once updated, contact form will work globally ✅
