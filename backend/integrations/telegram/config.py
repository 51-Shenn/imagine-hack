# Environment config — all secrets loaded from .env file
import os
from dotenv import load_dotenv

load_dotenv()

API_ID = int(os.environ["API_ID"])
API_HASH = os.environ["API_HASH"]
BOT_TOKEN = os.environ["BOT_TOKEN"]
TARGET_CHAT = os.environ["TARGET_CHAT"]
GEMINI_API_KEY = os.environ["GEMINI_API_KEY"]

HTTP_PORT = int(os.environ.get("HTTP_PORT", "8765"))
HTTP_AUTH_TOKEN = os.environ.get("HTTP_AUTH_TOKEN", "")

SUPABASE_URL = os.environ.get("SUPABASE_URL", "")
SUPABASE_SERVICE_KEY = os.environ.get("SUPABASE_SERVICE_KEY", "")

NEXTJS_WEBHOOK_URL = os.environ.get("NEXTJS_WEBHOOK_URL", "http://localhost:3000")
NEXTJS_WEBHOOK_TOKEN = os.environ.get("HTTP_AUTH_TOKEN", "")
