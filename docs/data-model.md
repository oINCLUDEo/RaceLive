# Модель данных

Полная целевая схема. В MVP реализована подсхема расписания (`seasons`, `circuits`, `meetings`,
`sessions`) — см. `apps/api/app/models.py`. Остальное вводится по фазам.

`name_ru` / `message_ru` живут в схеме БД, а не в переводах на фронте — это ядро ценности
(особенно сообщения рейс-контроля: «расследование инцидента», «пятисекундный штраф»).

```sql
-- справочники
seasons(id, year)
circuits(id, key, name_ru, name_en, country, length_m, turns, layout_svg)
teams(id, key, name_ru, color_hex, season_id)
drivers(id, number, code, name_ru, name_en, team_id, season_id)

-- события
meetings(id, season_id, circuit_id, name_ru, starts_at, ends_at, round)
sessions(id, meeting_id, type, name_ru, starts_at, ends_at, status,
         provider_key, is_final)
  -- type: practice | qualifying | sprint_qualifying | sprint | race

-- результаты (Фаза 2)
session_results(session_id, driver_id, position, laps, time_ms, gap_ms,
                status, points, grid_position)
laps(session_id, driver_id, lap_number, lap_time_ms, s1_ms, s2_ms, s3_ms,
     is_pit_out, is_deleted, compound, tyre_age, personal_best, session_best)
pit_stops(session_id, driver_id, lap_number, duration_ms, total_ms)
stints(session_id, driver_id, stint_number, compound, lap_start, lap_end)
race_control(session_id, ts, category, flag, scope, driver_id,
             message_en, message_ru)

-- телеметрия — hypertable TimescaleDB (Фаза 4)
car_data(ts, session_id, driver_id, speed, rpm, gear, throttle, brake, drs)
positions(ts, session_id, driver_id, x, y, z)

-- пользователи (хранение в РФ; Фаза 3)
users(id, email, display_name, avatar_url, created_at, last_seen_at)
user_prefs(user_id, timezone, locale, favourite_driver_id, favourite_team_id,
           notify_before_min)
user_notification_settings(user_id, event_type, via_toast, via_center, via_push)
user_stats(user_id, level, xp, sessions_watched, minutes_watched,
           messages_sent, predictions_correct)
notifications(id, user_id, event_type, payload, created_at, read_at)

-- стримы (Фаза 6)
casters(id, display_name, avatar_url, contact, agreement_signed_at, is_blocked)
streams(id, caster_id, platform, external_id, title, is_active,
        starts_at, session_id)

-- чат (Фаза 5)
chat_messages(id, channel, user_id, body, created_at, deleted_at, deleted_by)
chat_bans(user_id, channel, until, reason, moderator_id)
```

## Идемпотентность (Фаза 3)

Телеметрия и live-данные приходят повторно после обрыва. Естественный ключ
`(session_id, driver_id, ts)`, вставка через `ON CONFLICT DO NOTHING`.

## Кэш исторических данных

Финальная сессия тянется один раз, метится `is_final=true` и больше не запрашивается у
провайдера. В MVP расписание сезона кэшируется с TTL (`SCHEDULE_TTL_HOURS`).
