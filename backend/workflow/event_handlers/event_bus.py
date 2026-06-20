# backend/workflow/event_handlers/event_bus.py

import asyncio
import threading
from supabase import Client
from backend.workflow.event_handlers.dispatcher import FieldOpsDispatcher


class SupabaseEventBus:
    """
    Coordinates real-time Postgres mutations with the running
    FieldOpsDispatcher and SyncFieldDAG engine.

    Single-direction: Supabase → DAG Engine.
    Writes back via sync_to_supabase() with idempotency guard.
    """

    def __init__(self, dispatcher: FieldOpsDispatcher, sb_client: Client):
        self.dispatcher = dispatcher
        self.sb = sb_client

    def handle_db_change(self, payload: dict) -> None:
        record = payload.get("new")
        if not record:
            return

        task_id = record.get("id")
        db_state = record.get("state")

        if not task_id or not db_state:
            return

        task = self.dispatcher.engine.tasks.get(task_id)
        if not task:
            return

        current_memory_state = task["state"]
        if current_memory_state == db_state:
            return

        print(f"[EventBus] External change: {task_id} {current_memory_state} → {db_state}")

        try:
            events = self.dispatcher.engine.update_task_state(
                task_id,
                db_state,
                f"SyncField Event Bus: Synchronized from Supabase"
            )
            if events:
                self.dispatcher.engine.sync_to_supabase(events, self.sb)
        except Exception as e:
            print(f"[EventBus] Error processing {task_id}: {e}")


class RealtimeEventBusListener:
    """
    Subscribes to Supabase Realtime WebSocket CDC streams and routes
    payloads into the active Event Bus router.

    Uses the async Supabase client because realtime-py only supports async.
    """

    def __init__(self, bus: SupabaseEventBus, async_sb=None):
        self.bus = bus
        self.async_sb = async_sb
        self.channel = None

    def _on_postgres_change(self, payload: dict) -> None:
        self.bus.handle_db_change(payload)

    async def start(self) -> None:
        self.channel = self.async_sb.channel("tasks_realtime_sync")
        self.channel.on(
            "postgres_changes",
            {"event": "UPDATE", "schema": "public", "table": "tasks"},
            self._on_postgres_change,
        )
        await self.channel.subscribe()
        print("[EventBus] Subscribed to Supabase Realtime on table 'tasks'")

    def start_sync(self) -> None:
        loop = asyncio.new_event_loop()
        t = threading.Thread(target=loop.run_forever, daemon=True)
        t.start()
        asyncio.run_coroutine_threadsafe(self.start(), loop)

    async def stop(self) -> None:
        if self.channel:
            await self.async_sb.remove_channel(self.channel)
            self.channel = None
            print("[EventBus] Unsubscribed from Realtime")
