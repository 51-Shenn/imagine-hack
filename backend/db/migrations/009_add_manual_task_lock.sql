-- Preserve tasks explicitly created in the LOCKED Kanban column until an
-- operator moves them to READY. Dependency-driven locks continue to unlock
-- automatically when their prerequisites complete.
alter table tasks add column if not exists manual_lock boolean not null default false;
