// Базовый URL сайта для метаданных/sitemap/OG. На сервере читаем SITE_URL из .env.
export const SITE_URL = (process.env.SITE_URL ?? "https://tensory.ulya.space").replace(/\/$/, "");
export const SITE_NAME = "race.live";
export const SITE_TAGLINE = "Смотрим Формулу вместе";
export const SITE_DESCRIPTION =
  "Формула-1 на русском: расписание по вашему времени, результаты гонок, зачёт пилотов и команд, живой тайминг и рейс-контроль.";
