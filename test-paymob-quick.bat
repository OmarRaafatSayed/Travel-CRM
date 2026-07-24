@echo off
echo Testing Paymob integration...

echo.
echo 1. Testing payment initialization...
curl -X POST "https://aankczhczfabgojpsfth.supabase.co/functions/v1/paymob-init" ^
  -H "Content-Type: application/json" ^
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFhbmtjemhjemZhYmdvanBzZnRoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY3MzY5OTYsImV4cCI6MjA3MjMxMjk5Nn0.3L9MxkuMTBsI_-OEvz1MDtjzoTYMIi4SFEvwkghGH0I" ^
  -d "{\"tierId\":\"pro\",\"users\":5,\"customer\":{\"name\":\"Test User\",\"email\":\"test@example.com\",\"phone\":\"+201234567890\"}}"

echo.
echo.
echo 2. Testing webhook endpoint...
curl -X POST "https://aankczhczfabgojpsfth.supabase.co/functions/v1/paymob-webhook" ^
  -H "Content-Type: application/json" ^
  -H "X-Paymob-Signature: test-signature" ^
  -d "{\"type\":\"TRANSACTION\",\"obj\":{\"id\":123456,\"success\":true,\"is_capture\":true,\"pending\":false,\"order\":{\"id\":789012}}}"

echo.
echo Test complete!
pause