# Telegram bot entry point
#   - Connects as a bot user via Telethon
#   - Fetches recent chat history (if admin)
#   - Listens for incoming messages and processes them
#   - Serves HTTP endpoints for outbound messages
import asyncio
import signal

from telethon import TelegramClient

from integrations.telegram import config
from integrations.telegram.history import fetch_history
from integrations.telegram.listener import setup_listener
from integrations.telegram.http_server import start_http_server


async def main() -> None:
    client = TelegramClient(
        session="bot_session",
        api_id=config.API_ID,
        api_hash=config.API_HASH,
    )
    await client.start(bot_token=config.BOT_TOKEN)

    chat = await client.get_entity(int(config.TARGET_CHAT))
    print(f"Connected to: {chat.title if hasattr(chat, 'title') else chat.id}")

    try:
        await fetch_history(client, chat, limit=50)
    except Exception as e:
        print(f"Skipping history (bot not admin?): {e}")

    await setup_listener(client)
    site = await start_http_server(client)

    stop_event = asyncio.Event()

    def _shutdown():
        stop_event.set()

    loop = asyncio.get_running_loop()
    for sig in (signal.SIGTERM, signal.SIGINT):
        try:
            loop.add_signal_handler(sig, _shutdown)
        except NotImplementedError:
            pass

    await stop_event.wait()
    print("Shutting down...")
    await site.stop()
    await client.disconnect()


if __name__ == "__main__":
    asyncio.run(main())
