Yes

دليل تثبيت Evolution API مع WhatsApp Integration
المتطلبات الأساسية
Windows مع Docker Desktop مثبت
Git مثبت
Node.js مثبت
مشروع React/Vite موجود مع Supabase
الخطوة 1 — تثبيت Docker Desktop
تأكد إن Docker و Docker Compose شغالين:

docker --version
docker compose version
المفروض تشوف:

Docker version 29.x.x
Docker Compose version v5.x.x
الخطوة 2 — Clone الـ Evolution API
cd C:\Users\YOUR_NAME\Downloads\coding
git clone https://github.com/EvolutionAPI/evolution-api.git evolution-api
cd evolution-api
الخطوة 3 — إنشاء ملف .env
أنشئ ملف .env في مجلد evolution-api بالمحتوى ده:

# SERVER
SERVER_NAME=evolution
SERVER_TYPE=http
SERVER_PORT=8080
SERVER_URL=http://localhost:8080
SERVER_DISABLE_DOCS=false
SERVER_DISABLE_MANAGER=false

# CORS
CORS_ORIGIN=http://localhost:4001
CORS_METHODS=POST,GET,PUT,DELETE
CORS_CREDENTIALS=true

# POSTGRES CONTAINER CREDENTIALS
POSTGRES_DATABASE=evolution_db
POSTGRES_USERNAME=evolution_user
POSTGRES_PASSWORD=evolution_pass123

# DATABASE
DATABASE_PROVIDER=postgresql
DATABASE_CONNECTION_URI=postgresql://evolution_user:evolution_pass123@evolution-postgres:5432/evolution_db?schema=evolution_api
DATABASE_CONNECTION_CLIENT_NAME=evolution
DATABASE_SAVE_DATA_INSTANCE=true
DATABASE_SAVE_DATA_NEW_MESSAGE=true
DATABASE_SAVE_MESSAGE_UPDATE=true
DATABASE_SAVE_DATA_CONTACTS=true
DATABASE_SAVE_DATA_CHATS=true
DATABASE_SAVE_DATA_HISTORIC=true
DATABASE_SAVE_DATA_LABELS=true
DATABASE_SAVE_IS_ON_WHATSAPP=true
DATABASE_SAVE_IS_ON_WHATSAPP_DAYS=7
DATABASE_DELETE_MESSAGE=false

# REDIS
CACHE_REDIS_ENABLED=true
CACHE_REDIS_URI=redis://evolution-redis:6379
CACHE_REDIS_PREFIX_KEY=evolution-cache
CACHE_REDIS_TTL=604800
CACHE_REDIS_SAVE_INSTANCES=true
CACHE_LOCAL_ENABLED=true
CACHE_LOCAL_TTL=86400

# AUTHENTICATION — غير القيمة دي لأي string سري
AUTHENTICATION_API_KEY=evo-super-secret-api-key-2024
AUTHENTICATION_EXPOSE_IN_FETCH_INSTANCES=false

# LOGS
LOG_LEVEL=ERROR,WARN,DEBUG,INFO,LOG,VERBOSE,DARK,WEBHOOKS,WEBSOCKET
LOG_COLOR=true
LOG_BAILEYS=error

# INSTANCES
DEL_INSTANCE=false
DEL_TEMP_INSTANCES=true
LANGUAGE=en

# WEBHOOK
WEBHOOK_GLOBAL_ENABLED=false
WEBSOCKET_ENABLED=true
WEBSOCKET_GLOBAL_EVENTS=true

# INTEGRATIONS (all off by default)
RABBITMQ_ENABLED=false
NATS_ENABLED=false
SQS_ENABLED=false
PUSHER_ENABLED=false
TYPEBOT_ENABLED=false
CHATWOOT_ENABLED=false
OPENAI_ENABLED=false
DIFY_ENABLED=false
N8N_ENABLED=false
EVOAI_ENABLED=false
FLOWISE_ENABLED=false
S3_ENABLED=false
PROMETHEUS_METRICS=false
PROVIDER_ENABLED=false

# WHATSAPP
WA_BUSINESS_TOKEN_WEBHOOK=evolution
WA_BUSINESS_URL=https://graph.facebook.com
WA_BUSINESS_VERSION=v18.0
WA_BUSINESS_LANGUAGE=en
CONFIG_SESSION_PHONE_CLIENT=Evolution API
CONFIG_SESSION_PHONE_NAME=Chrome
QRCODE_LIMIT=30
QRCODE_COLOR=#198754
TELEMETRY_ENABLED=true
EVENT_EMITTER_MAX_LISTENERS=50
الخطوة 4 — تعديل docker-compose.yaml
استبدل محتوى docker-compose.yaml بالآتي (بيحذف الـ dokploy-network الخارجي ويضيف healthcheck):

version: "3.8"

services:
  api:
    container_name: evolution_api
    image: evoapicloud/evolution-api:latest
    restart: always
    depends_on:
      evolution-postgres:
        condition: service_healthy
      redis:
        condition: service_started
    ports:
      - "8080:8080"
    volumes:
      - evolution_instances:/evolution/instances
    networks:
      - evolution-net
    env_file:
      - .env

  redis:
    container_name: evolution_redis
    image: redis:latest
    restart: always
    command: redis-server --port 6379 --appendonly yes
    volumes:
      - evolution_redis:/data
    networks:
      evolution-net:
        aliases:
          - evolution-redis
    expose:
      - "6379"

  evolution-postgres:
    container_name: evolution_postgres
    image: postgres:15
    restart: always
    environment:
      - POSTGRES_DB=${POSTGRES_DATABASE}
      - POSTGRES_USER=${POSTGRES_USERNAME}
      - POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      evolution-net:
        aliases:
          - evolution-postgres
    expose:
      - "5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U evolution_user -d evolution_db"]
      interval: 5s
      timeout: 5s
      retries: 10

volumes:
  evolution_instances:
  evolution_redis:
  postgres_data:

networks:
  evolution-net:
    name: evolution-net
    driver: bridge
الخطوة 5 — تشغيل الـ Containers
cd C:\Users\YOUR_NAME\Downloads\coding\evolution-api
docker compose pull
docker compose up -d
انتظر 20 ثانية ثم تحقق:

docker compose ps
المفروض تشوف الـ 3 containers بحالة Up:

evolution_api       Up    0.0.0.0:8080->8080/tcp
evolution_postgres  Up (healthy)
evolution_redis     Up
الخطوة 6 — التحقق من تشغيل الـ API
curl http://localhost:8080
أو في PowerShell:

Invoke-RestMethod -Uri "http://localhost:8080" -Method GET
الرد المتوقع:

{
  "status": 200,
  "message": "Welcome to the Evolution API, it is working!",
  "version": "2.3.7"
}
الخطوة 7 — ربط WhatsApp (QR Code)
1. إنشاء Instance:

$body = '{"instanceName":"booking-bot","integration":"WHATSAPP-BAILEYS","qrcode":true}'
Invoke-RestMethod -Uri "http://localhost:8080/instance/create" `
  -Headers @{"apikey"="evo-super-secret-api-key-2024";"Content-Type"="application/json"} `
  -Method POST -Body $body
2. افتح الـ Manager UI:

http://localhost:8080/manager
3. اسكن الـ QR Code:

افتح WhatsApp على تليفونك
روح ⋮ → Linked Devices → Link a Device
اسكن الـ QR من الـ Manager
4. تحقق من الاتصال:

Invoke-RestMethod -Uri "http://localhost:8080/instance/fetchInstances" `
  -Headers @{"apikey"="evo-super-secret-api-key-2024"} -Method GET | ConvertTo-Json
لازم تشوف "connectionStatus": "open"

الخطوة 8 — ربط الـ API بالمشروع (Vite Proxy)
في vite.config.ts أضف الـ proxy عشان تحل مشكلة CORS:

server: {
  host: "localhost",
  port: 4000,
  open: true,
  proxy: {
    "/evo-api": {
      target: "http://localhost:8080",
      changeOrigin: true,
      rewrite: (path) => path.replace(/^\/evo-api/, ""),
    },
  },
},
الخطوة 9 — إضافة WhatsApp للـ Auth في React
في AuthPage.tsx أضف دالة الإرسال:

const sendWhatsAppWelcome = async (phone: string, name: string) => {
  try {
    let normalized = phone.replace(/\s+/g, "").replace(/[^0-9]/g, "");
    if (normalized.startsWith("0")) normalized = "2" + normalized;
    if (!normalized.startsWith("20")) normalized = "20" + normalized;

    await fetch("/evo-api/message/sendText/booking-bot", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: "evo-super-secret-api-key-2024",
      },
      body: JSON.stringify({
        number: normalized,
        text: `مرحباً ${name}! 👋\nتم تسجيل دخولك بنجاح.\nنتمنى لك تجربة رائعة! 🚀`,
      }),
    });
  } catch (err) {
    console.warn("WhatsApp notification skipped:", err);
  }
};
واستدعاها بعد الـ sign-in الناجح.

الخطوة 10 — إصلاح Supabase Database Trigger
في Supabase SQL Editor شغّل:

-- 1. Fix trigger to save phone
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public' AS $$
BEGIN
    INSERT INTO public.profiles (user_id, first_name, last_name, email, phone, role)
    VALUES (
        NEW.id,
        NEW.raw_user_meta_data ->> 'first_name',
        NEW.raw_user_meta_data ->> 'last_name',
        NEW.email,
        NEW.raw_user_meta_data ->> 'phone',
        'sales'
    )
    ON CONFLICT (user_id) DO NOTHING;
    RETURN NEW;
END;
$$;

-- 2. Create profiles for existing users
INSERT INTO public.profiles (user_id, first_name, last_name, email, phone, role)
SELECT 
  u.id,
  u.raw_user_meta_data ->> 'first_name',
  u.raw_user_meta_data ->> 'last_name',
  u.email,
  u.raw_user_meta_data ->> 'phone',
  'sales'
FROM auth.users u
LEFT JOIN public.profiles p ON p.user_id = u.id
WHERE p.user_id IS NULL
ON CONFLICT (user_id) DO NOTHING;
إعادة التشغيل بعد Reboot
cd C:\Users\YOUR_NAME\Downloads\coding\evolution-api
docker compose up -d
ملخص Connection Details
الـ Item	القيمة
Base URL	http://localhost:8080
Global API Key	evo-super-secret-api-key-2024
Manager UI	http://localhost:8080/manager
API Docs	http://localhost:8080/docs
Vite Proxy Path	/evo-api/...
Endpoint إرسال رسالة نصية
POST /evo-api/message/sendText/{instanceName}
apikey: evo-super-secret-api-key-2024
Content-Type: application/json

{
  "number": "201012345678",
  "text": "نص الرسالة هنا"
}
تنبيه مهم: لا تفتح WhatsApp على نفس التليفون المرتبط وهو شغال في Evolution API — ده بيسبب device_removed disconnect.