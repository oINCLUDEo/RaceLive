# packages/contracts — единый источник правды типов (ADR-006)

Заглушка механики автогенерации. В MVP типы фронта заведены вручную в
[`apps/web/lib/api.ts`](../../apps/web/lib/api.ts) и соответствуют Pydantic-моделям в
[`apps/api/app/schemas.py`](../../apps/api/app/schemas.py).

С Фазы 2: FastAPI отдаёт OpenAPI (`/openapi.json`) → генерация TypeScript-типов сюда
(напр. `openapi-typescript`) в CI. Руками типы не синхронизируются — иначе разъедутся.
