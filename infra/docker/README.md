# infra/docker

Dockerfile сервисов лежат рядом с кодом (`apps/*/Dockerfile`). Оркестрация — корневой
[`docker-compose.yml`](../../docker-compose.yml).

Эта папка — под вспомогательные конфиги инфраструктуры прода (reverse-proxy/Caddy, отдельные
compose-оверлеи), которые появятся при деплое. См. [`docs/deploy.md`](../../docs/deploy.md).
