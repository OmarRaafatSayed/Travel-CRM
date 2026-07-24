# Paymob Integration with Supabase Edge Functions

## Production-Ready Implementation

### Environment Variables
```env
# Paymob Configuration
PAYMOB_API_KEY=your_paymob_api_key
PAYMOB_INTEGRATION_ID=your_integration_id
PAYMOB_IFRAME_ID=your_iframe_id
PAYMOB_HMAC_SECRET=your_hmac_secret

# Supabase Configuration
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### Deployment Commands
```bash
# Deploy Edge Functions
supabase functions deploy paymob-init
supabase functions deploy paymob-webhook

# Set environment variables
supabase secrets set PAYMOB_API_KEY=your_key
supabase secrets set PAYMOB_INTEGRATION_ID=your_id
supabase secrets set PAYMOB_IFRAME_ID=your_iframe_id
supabase secrets set PAYMOB_HMAC_SECRET=your_secret
```

### Frontend Usage
```typescript
import { paymobClient } from '@/lib/paymob-client';

// Initialize payment
const result = await paymobClient.createSubscriptionPayment(
  'medium', // subscriptionId
  10,       // users
  {
    name: 'John Doe',
    email: 'john@example.com',
    phone: '+201234567890'
  }
);

if (result.success) {
  // Open payment iframe
  const iframe = document.createElement('iframe');
  iframe.src = result.iframeUrl;
  iframe.width = '600';
  iframe.height = '800';
  document.body.appendChild(iframe);
}
```

### Webhook Configuration
Set webhook URL in Paymob dashboard:
```
https://your-project.supabase.co/functions/v1/paymob-webhook
```

### Database Schema
The system uses existing `subscription_tiers` table and creates a new `payments` table for transaction tracking.

### Security Features
- HMAC signature verification for webhooks
- Retry logic with exponential backoff
- Proper error handling and logging
- CORS headers for frontend integration

### Testing
Use Paymob sandbox environment with test cards:
- Success: 4987654321098769
- Failure: 4000000000000002

This implementation is production-ready and follows Supabase Edge Functions best practices.