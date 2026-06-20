import json
import urllib.request
import urllib.error

from integrations.notifications import Notifier
from integrations.supabase.client import get_supabase_client


class TelegramNotifier(Notifier):
    def __init__(self, bot_http_url: str, auth_token: str) -> None:
        self.bot_url = bot_http_url.rstrip("/")
        self.auth_token = auth_token

    def _send_http(self, endpoint: str, body: dict) -> None:
        url = f"{self.bot_url}{endpoint}"
        data = json.dumps(body).encode()
        req = urllib.request.Request(
            url,
            data=data,
            headers={
                "Content-Type": "application/json",
                "X-Auth-Token": self.auth_token,
            },
            method="POST",
        )
        try:
            urllib.request.urlopen(req, timeout=10)
        except urllib.error.HTTPError as e:
            print(f"TelegramNotifier HTTP error {e.code}: {e.read().decode()}")

    def _get_recipients_by_role(self, role: str) -> list[int]:
        client = get_supabase_client()
        rows = (
            client.table("telegram_recipients")
            .select("chat_id")
            .eq("role", role)
            .eq("is_active", True)
            .execute()
        )
        return [r["chat_id"] for r in rows.data]

    def _get_chat_id(self, recipient: str) -> int | None:
        client = get_supabase_client()
        rows = (
            client.table("telegram_recipients")
            .select("chat_id")
            .eq("role", recipient)
            .eq("is_active", True)
            .limit(1)
            .execute()
        )
        if rows.data:
            return rows.data[0]["chat_id"]
        return None

    def alert(self, role: str, payload: str) -> None:
        chat_ids = self._get_recipients_by_role(role)
        for chat_id in chat_ids:
            self._send_http("/send", {"chat_id": chat_id, "text": payload})

    def notify(self, recipient: str, message: str) -> None:
        chat_id = self._get_chat_id(recipient)
        if chat_id:
            self._send_http("/send", {"chat_id": chat_id, "text": message})
