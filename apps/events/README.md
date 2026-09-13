# apps/events — доменные события → каналы доставки (Фаза 3)

Заглушка. Реализуется в Фазе 3.

Ingest публикует доменное событие → `events` решает, кого касается → шлёт в каналы Centrifugo
(`notify:user:{id}`, `notify:global`) и уровни подачи (тост / центр / Web Push).

- Каналы доставки абстрактны: `ToastChannel`, `CenterChannel`, `PushChannel`. `TelegramChannel`
  добавляется позже одним классом (архитектурно место оставлено).
- Дедупликация по `(user_id, event_id)` в Redis, TTL сутки.
- Типы событий: `session.starting_soon/started/finished/results_ready`, `race_control.*`,
  `driver.pit_stop/retired/fastest_lap`, `system.announcement`.
