@echo off
echo Setting up Paymob integration...

echo.
echo Installing Supabase CLI globally...
npm install -g supabase

echo.
echo Initializing Supabase project...
supabase login
supabase init

echo.
echo 1. Setting Supabase secrets...
supabase secrets set PAYMOB_API_KEY="ZXlKaGJHY2lPaUpJVXpVeE1pSXNJblI1Y0NJNklrcFhWQ0o5LmV5SmpiR0Z6Y3lJNklrMWxjbU5vWVc1MElpd2ljSEp2Wm1sc1pWOXdheUk2TVRBNE56ZzROU3dpYm1GdFpTSTZJbWx1YVhScFlXd2lmUS5EX0Z0ZE16Zm4yZkh3V2VkOHp3NElxdkVkYTdxU0pqWFIxYkpMeVpWQnhiTGVQcTRreEtuUExiNU9CMkRqVC1BeTFNcGI1R2hJYUY4bndmcEFSbjdSdw=="
supabase secrets set PAYMOB_INTEGRATION_ID="5350388"
supabase secrets set PAYMOB_IFRAME_ID="967138"
supabase secrets set PAYMOB_HMAC_SECRET="F996BDCE897BAD27851C68BE1CECA0C2"
supabase secrets set SUPABASE_URL="https://aankczhczfabgojpsfth.supabase.co"
supabase secrets set SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFhbmtjemhjemZhYmdvanBzZnRoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjczNjk5NiwiZXhwIjoyMDcyMzEyOTk2fQ.d04ERQ1IXOrmcFFOFSCsMy6hnEQd6zpCoRpCvTeLm2A"
supabase secrets set EXCHANGE_RATE_USD_TO_EGP="50"

echo.
echo 2. Running database migration...
supabase db push

echo.
echo 3. Deploying Edge Functions...
supabase functions deploy paymob-init
supabase functions deploy paymob-webhook

echo.
echo 4. Setup complete!
echo.
echo Next steps:
echo - Copy the function URLs from Supabase Dashboard
echo - Add webhook URL to Paymob Dashboard
echo - Test the integration using the provided curl commands
echo.
pause