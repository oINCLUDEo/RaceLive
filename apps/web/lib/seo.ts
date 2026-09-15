// Базовый URL сайта для метаданных/sitemap/OG. На сервере читаем SITE_URL из .env.
export const SITE_URL = (process.env.SITE_URL ?? "https://tensory.ulya.space").replace(/\/$/, "");
export const SITE_NAME = "race.live";
export const SITE_TAGLINE = "Смотрим Формулу вместе";
export const SITE_DESCRIPTION =
  "Расписание, результаты и живой тайминг Формулы-1 на русском: этапы по вашему времени, зачёт пилотов и команд, рейс-контроль и статистика гонок.";
