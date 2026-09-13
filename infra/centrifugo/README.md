# infra/centrifugo — realtime-слой (Фаза 3)

Заглушка. Config Centrifugo добавляется в Фазе 3 и подключается в docker-compose.

Каналы: `timing:{session}`, `telemetry:{session}:{driver}` (по подписке),
`racecontrol:{session}`, `chat:*`, `notify:user:{id}`, `notify:global`.
JWT-авторизация, presence, history, Redis-engine для масштабирования.
