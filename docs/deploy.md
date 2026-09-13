# Деплой

## Локально / на VPS через Docker Compose

```bash
git clone <repo> formula && cd formula
cp .env.example .env
# отредактируй .env: как минимум POSTGRES_PASSWORD
docker compose up --build -d
docker compose logs -f api   # смотреть логи
```

Порты по умолчанию: web `3000`, api `8000`, postgres `5432`, redis `6379`.

Проверка:
- http://SERVER_IP:3000 — сайт
- http://SERVER_IP:8000/api/health — `{"status":"ok"}`
- http://SERVER_IP:8000/docs — Swagger

Остановить: `docker compose down` (данные Postgres сохраняются в volume `pgdata`;
`docker compose down -v` удалит и данные).

## Прод: что изменить относительно dev-compose

1. **Postgres — на отдельный узел** (ADR-003), ≥16 ГБ RAM. В `.env` указать внешний
   `DATABASE_URL`, убрать сервис `postgres` из compose на узле приложения.
2. **Reverse-proxy + TLS.** Поставить Caddy/Nginx перед web и api, выдать сертификаты
   (домен уже есть). Не выставлять 8000/5432/6379 наружу — только 443 на прокси.
3. **Секреты** — не в `.env` в репозитории; использовать секреты хостинга или `.env` вне git.
4. **Бэкапы Postgres** — `pg_dump` по расписанию.
5. **Мониторинг** — Sentry (ошибки), Uptime Kuma (доступность). Prometheus/Grafana — с Фазы 3.

## Домен

Название/домен ещё не выбраны. До выбора можно поднять на личном домене/поддомене заказчика
(есть в наличии): направить A-запись на IP VPS, прокси терминирует TLS. Сменить домен позже —
это правка конфига прокси и `NEXT_PUBLIC_API_URL`, не переезд.

## Дальнейшие сервисы (по фазам)

- Фаза 3: `centrifugo`, `ingest`, `events` добавляются в compose; ingest желательно на узле
  вне РФ (ПДн там не обрабатываются).
- Kubernetes — только когда упрётся; на старте Compose достаточно (профиль нагрузки предсказуем).
