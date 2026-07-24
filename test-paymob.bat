@echo off
echo Testing Paymob Integration...

echo.
echo 1. Testing payment initialization...
echo Replace FUNCTION_URL with your actual Supabase function URL
echo.

set PAYMOB_INIT_URL=https://aankczhczfabgojpsfth.supabase.co/functions/v1/paymob-init
set ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFhbmtjemhjemZhYmdvanBzZnRoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY3MzY5OTYsImV4cCI6MjA3MjMxMjk5Nn0.YhBjyvOKkiaviQBdJ6VBSvQNyQl_5nVjEQJjQQJjQQI

curl -X POST "%PAYMOB_INIT_URL%" ^
  -H "Content-Type: application/json" ^
  -H "Authorization: Bearer %ANON_KEY%" ^
  -d "{\"organization_id\":\"123e4567-e89b-12d3-a456-426614174000\",\"user_id\":\"123e4567-e89b-12d3-a456-426614174001\",\"planKey\":\"small\",\"users_count\":3,\"billing\":{\"first_name\":\"Ahmed\",\"last_name\":\"Hassan\",\"email\":\"ahmed@test.com\",\"phone\":\"+201234567890\",\"city\":\"Cairo\",\"country\":\"Egypt\"}}"

echo.
echo 2. Generate HMAC signature for webhook testing...
echo.

node -e "const crypto = require('crypto'); const secret = 'F996BDCE897BAD27851C68BE1CECA0C2'; const payload = '{\"type\":\"TRANSACTION\",\"obj\":{\"id\":123,\"success\":true,\"is_capture\":true,\"pending\":false,\"order\":{\"id\":456}}}'; const signature = crypto.createHmac('sha512', secret).update(payload).digest('hex'); console.log('X-Paymob-Signature:', signature);"

echo.
echo 3. Test webhook (replace WEBHOOK_URL and SIGNATURE)...
echo.

set WEBHOOK_URL=https://aankczhczfabgojpsfth.supabase.co/functions/v1/paymob-webhook
set SIGNATURE=REPLACE_WITH_GENERATED_SIGNATURE

curl -X POST "%WEBHOOK_URL%" ^
  -H "Content-Type: application/json" ^
  -H "X-Paymob-Signature: %SIGNATURE%" ^
  -d "{\"type\":\"TRANSACTION\",\"obj\":{\"id\":123,\"success\":true,\"is_capture\":true,\"pending\":false,\"order\":{\"id\":456}}}"

echo.
echo Testing complete!
pause