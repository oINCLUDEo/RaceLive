# infra/migrations — миграции БД

В MVP схема создаётся на старте API (`Base.metadata.create_all`, см.
[`apps/api/app/main.py`](../../apps/api/app/main.py)).

С Фазы 2 вводится **Alembic**: схема результатов/телеметрии стабилизируется, `create_all`
заменяется версионируемыми миграциями. TimescaleDB-гипертаблицы (`car_data`, `positions`)
создаются миграцией с `create_hypertable(...)`.
