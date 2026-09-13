# Project Formula (рабочее название)

Портал живого тайминга, результатов и телеметрии автогонок с русской локализацией.
Название и домен пока не выбраны — см. [docs/decisions.md](docs/decisions.md).

## Что это

Монорепозиторий продукта. Полное описание — в [`docs/`](docs/):

| Документ | О чём |
|---|---|
| [docs/architecture.md](docs/architecture.md) | Общая архитектура, компоненты, потоки данных |
| [docs/decisions.md](docs/decisions.md) | Журнал решений (ADR): что и почему выбрано, включая все обсуждения |
| [docs/phases.md](docs/phases.md) | Фазы разработки и критерии готовности каждой |
| [docs/stack-review.md](docs/stack-review.md) | Критический разбор стека и принятые оговорки |
| [docs/video-strategy.md](docs/video-strategy.md) | Стратегия по видео: embed → VOD → live |
| [docs/data-model.md](docs/data-model.md) | Модель данных |
| [docs/design-system.md](docs/design-system.md) | Дизайн-система «Оксид» |

## Статус

**Фаза 1 (Расписание) — MVP в разработке.** Остальные фазы описаны, но ещё не реализованы.

## Быстрый старт (Docker)

Требуется Docker + Docker Compose.

```bash
cp .env.example .env
docker compose up --build
```

После сборки:

- Сайт: http://localhost:3000
- API: http://localhost:8000 (документация: http://localhost:8000/docs)
- Проверка здоровья: http://localhost:8000/api/health

При первом запросе расписания API один раз сходит к провайдеру (Jolpica, бесплатный, без ключа), закэширует сезон в Postgres и дальше отдаёт из базы.

Подробнее о деплое на VPS — в [docs/deploy.md](docs/deploy.md).

## Структура

```
/apps
  /web        Next.js — публичный сайт (Фаза 1: расписание)
  /api        FastAPI — REST, слой провайдеров, кэш
  /ingest     Python-воркеры live/post-session (заглушка, Фаза 3)
  /events     доменные события → каналы доставки (заглушка, Фаза 3)
  /admin      панель модерации (заглушка, Фаза 5)
/packages
  /contracts  общие типы (источник правды для web и api)
  /ui         дизайн-токены и компоненты (частично, наполняется по фазам)
/infra
  /docker     вспомогательные Dockerfile и конфиги
  /migrations миграции БД (Alembic, вводится в Фазе 2)
  /centrifugo конфиг realtime-слоя (Фаза 3)
/docs         вся проектная документация
```
