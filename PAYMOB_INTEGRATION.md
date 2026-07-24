# Paymob Integration for Sky CRM

Complete production-ready Paymob payment integration with Supabase Edge Functions.

## Setup Instructions

### 1. Set Environment Variables

```bash
# Set Paymob credentials
supabase secrets set PAYMOB_API_KEY="ZXlKaGJHY2lPaUpJVXpVeE1pSXNJblI1Y0NJNklrcFhWQ0o5LmV5SmpiR0Z6Y3lJNklrMWxjbU5vWVc1MElpd2ljSEp2Wm1sc1pWOXdheUk2TVRBNE56ZzROU3dpYm1GdFpTSTZJbWx1YVhScFlXd2lmUS5EX0Z0ZE16Zm4yZkh3V2VkOHp3NElxdkVkYTdxU0pqWFIxYkpMeVpWQnhiTGVQcTRreEtuUExiNU9CMkRqVC1BeTFNcGI1R2hJYUY4bndmcEFSbjdSdw=="
supabase secrets set PAYMOB_INTEGRATION_ID="5350388"
supabase secrets set PAYMOB_IFRAME_ID="967138"
supabase secrets set PAYMOB_HMAC_SECRET="F996BDCE897BAD27851C68BE1CECA0C2"

# Set Supabase credentials
supabase secrets set SUPABASE_URL="https://aankczhczfabgojpsfth.supabase.co"
supabase secrets set SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFhbmtjemhjemZhYmdvanBzZnRoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjczNjk5NiwiZXhwIjoyMDcyMzEyOTk2fQ.d04ERQ1IXOrmcFFOFSCsMy6hnEQd6zpCoRpCvTeLm2A"

# Optional: Set exchange rate for USD to EGP conversion
supabase secrets set EXCHANGE_RATE_USD_TO_EGP="50"
```

### 2. Run Database Migration

```bash
supabase db push
```

### 3. Deploy Edge Functions

```bash
supabase functions deploy paymob-init
supabase functions deploy paymob-webhook
```

## API Endpoints

### Payment Initialization
**POST** `/functions/v1/paymob-init`

**Request Body:**
```json
{
  "organization_id": "uuid",
  "user_id": "uuid", 
  "planKey": "small|medium|large",
  "users_count": 5,
  "billing": {
    "first_name": "Ahmed",
    "last_name": "Hassan",
    "email": "ahmed@example.com",
    "phone": "+201234567890",
    "city": "Cairo",
    "country": "Egypt"
  }
}
```

**Response:**
```json
{
  "paymentKey": "payment_token_here",
  "iframeId": "967138",
  "orderId": 12345,
  "iframeUrl": "https://accept.paymob.com/api/acceptance/iframes/967138?payment_token=..."
}
```

### Webhook Handler
**POST** `/functions/v1/paymob-webhook`

Automatically processes Paymob webhook notifications and updates payment/subscription status.

## Frontend Usage

```typescript
import { createSubscriptionPayment, openPaymobIframe } from '@/lib/paymob-client';

// Initialize payment
const paymentData = await createSubscriptionPayment(
  'small',
  5,
  {
    first_name: 'Ahmed',
    last_name: 'Hassan', 
    email: 'ahmed@example.com',
    phone: '+201234567890',
    city: 'Cairo',
    country: 'Egypt'
  },
  organizationId,
  userId
);

// Open payment iframe
openPaymobIframe(paymentData.iframeUrl);
```

## Testing

### Test Payment Initialization

```bash
curl -X POST "https://aankczhczfabgojpsfth.supabase.co/functions/v1/paymob-init" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -d '{
    "organization_id": "123e4567-e89b-12d3-a456-426614174000",
    "user_id": "123e4567-e89b-12d3-a456-426614174001", 
    "planKey": "small",
    "users_count": 3,
    "billing": {
      "first_name": "Ahmed",
      "last_name": "Hassan",
      "email": "ahmed@test.com",
      "phone": "+201234567890",
      "city": "Cairo",
      "country": "Egypt"
    }
  }'
```

### Test Webhook with HMAC

Generate HMAC signature:
```bash
# Using Node.js
node -e "
const crypto = require('crypto');
const secret = 'F996BDCE897BAD27851C68BE1CECA0C2';
const payload = '{\"type\":\"TRANSACTION\",\"obj\":{\"id\":123,\"success\":true,\"is_capture\":true,\"pending\":false,\"order\":{\"id\":456}}}';
const signature = crypto.createHmac('sha512', secret).update(payload).digest('hex');
console.log('X-Paymob-Signature:', signature);
"
```

Send webhook:
```bash
curl -X POST "https://aankczhczfabgojpsfth.supabase.co/functions/v1/paymob-webhook" \
  -H "Content-Type: application/json" \
  -H "X-Paymob-Signature: GENERATED_SIGNATURE_HERE" \
  -d '{
    "type": "TRANSACTION",
    "obj": {
      "id": 123,
      "success": true,
      "is_capture": true,
      "pending": false,
      "order": {
        "id": 456
      }
    }
  }'
```

## Database Schema

### Tables Created:
- `payments` - Payment transaction records
- `subscriptions` - Active subscription status
- `subscription_plans` - Plan pricing configuration

### Key Features:
- Row Level Security (RLS) enabled
- Proper indexing for performance
- Service role access for Edge Functions
- Organization-based access control

## Security Features

- ✅ HMAC signature verification for webhooks
- ✅ Constant-time signature comparison
- ✅ Environment variable protection for secrets
- ✅ Service role key isolation (server-side only)
- ✅ RLS policies for data access control
- ✅ Input validation and sanitization

## Error Handling

- Retry logic with exponential backoff (300ms, 600ms, 1200ms)
- Comprehensive error logging
- Graceful fallbacks for pricing
- Proper HTTP status codes
- Transaction rollback on failures

## Production Checklist

- [ ] Set all environment variables via `supabase secrets set`
- [ ] Deploy Edge Functions to production
- [ ] Run database migrations
- [ ] Test payment flow end-to-end
- [ ] Verify webhook signature validation
- [ ] Monitor logs for errors
- [ ] Set up alerting for failed payments

## Monitoring

Monitor the following:
- Payment success/failure rates
- Webhook processing times
- Database connection health
- Edge Function performance
- HMAC verification failures

## Support

For issues:
1. Check Supabase Edge Function logs
2. Verify environment variables are set
3. Test webhook HMAC signature generation
4. Validate database permissions
5. Check Paymob dashboard for transaction status