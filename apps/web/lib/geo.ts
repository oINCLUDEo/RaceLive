// Грубая, но приватная эвристика «зритель не из России» — по часовому поясу браузера,
// без IP и сторонних сервисов. Нужна только чтобы сразу предложить площадку, которая
// открывается за рубежом (Rutube часто просит «выключить VPN»).
const RU_TZ = new Set([
  "Europe/Moscow", "Europe/Kaliningrad", "Europe/Samara", "Europe/Volgograd", "Europe/Saratov",
  "Europe/Ulyanovsk", "Europe/Astrakhan", "Europe/Kirov", "Europe/Simferopol",
  "Asia/Yekaterinburg", "Asia/Omsk", "Asia/Novosibirsk", "Asia/Barnaul", "Asia/Tomsk",
  "Asia/Novokuznetsk", "Asia/Krasnoyarsk", "Asia/Irkutsk", "Asia/Chita", "Asia/Yakutsk",
  "Asia/Khandyga", "Asia/Vladivostok", "Asia/Ust-Nera", "Asia/Magadan", "Asia/Sakhalin",
  "Asia/Srednekolymsk", "Asia/Kamchatka", "Asia/Anadyr",
]);

export function looksAbroad(): boolean {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    return !!tz && !RU_TZ.has(tz);
  } catch {
    return false;
  }
}
