# apps/ingest — воркеры сбора данных (Фаза 3)

Заглушка. Реализуется в Фазе 3 ([../../docs/phases.md](../../docs/phases.md)).

Python + asyncio, три роли:
- **scheduler** — раз в сутки календарь; за 30 мин до сессии поднимает live-воркер, через
  15 мин после — post-session.
- **live** — поток провайдера (OpenF1) → нормализация → Redis (hot state) + батчи в Postgres
  → дельты в Centrifugo.
- **post-session** — добивка пропусков, производные метрики (pandas, вне request-path — ADR-005),
  метка `is_final`.

Обязательно: идемпотентность (`ON CONFLICT DO NOTHING` по `(session_id, driver_id, ts)`),
буфер реплея (снапшот из Redis), деградация при обрыве источника. Фоновые задачи — ARQ (ADR-004).
