// Форматирование в локальном часовом поясе пользователя (клиент).
const dateFmt = new Intl.DateTimeFormat("ru-RU", {
  weekday: "short",
  day: "numeric",
  month: "long",
});

const timeFmt = new Intl.DateTimeFormat("ru-RU", {
  hour: "2-digit",
  minute: "2-digit",
});

export function formatDate(iso: string): string {
  return dateFmt.format(new Date(iso));
}

export function formatTime(iso: string): string {
  return timeFmt.format(new Date(iso));
}

export function formatDateTime(iso: string): string {
  return `${dateFmt.format(new Date(iso))}, ${timeFmt.format(new Date(iso))}`;
}

const SESSION_LABEL: Record<string, string> = {
  practice: "Практика",
  qualifying: "Квалификация",
  sprint_qualifying: "Спринт-квалификация",
  sprint: "Спринт",
  race: "Гонка",
};

export function sessionLabel(type: string, nameRu: string | null, nameEn: string): string {
  return nameRu ?? SESSION_LABEL[type] ?? nameEn;
}

// Сход/не финишировал: у сошедшего пилота есть классификационная позиция (напр. P16),
// поэтому определяем DNF по статусу, а не по позиции. Классифицированы: "Finished"
// и "+N Lap(s)".
export function isDnf(status: string): boolean {
  const s = status || "";
  if (s === "Finished") return false;
  if (/^\+\d+\s+Lap/.test(s)) return false;
  return true;
}

const STATUS_RU: Record<string, string> = {
  Retired: "Сход",
  Accident: "Авария",
  Collision: "Столкновение",
  "Collision damage": "Повреждение",
  Engine: "Мотор",
  Gearbox: "КПП",
  Transmission: "Трансмиссия",
  Hydraulics: "Гидравлика",
  Electrical: "Электрика",
  Brakes: "Тормоза",
  Suspension: "Подвеска",
  "Power Unit": "Силовая установка",
  Overheating: "Перегрев",
  Puncture: "Прокол",
  "Fuel system": "Топливо",
  Disqualified: "Дисквал.",
  "Did not start": "Не стартовал",
  "Did not qualify": "Не квалиф.",
  Withdrew: "Снялся",
};

// Человекочитаемый статус финиша по-русски.
export function statusRu(status: string): string {
  if (status === "Finished") return "Финиш";
  const m = /^\+(\d+)\s+Lap/.exec(status);
  if (m) return `+${m[1]} круг`;
  return STATUS_RU[status] ?? "Сход";
}

// Часовой пояс устройства пользователя: IANA-имя и краткая метка со смещением (напр. "GMT+4").
export function userTimeZone(): { iana: string; label: string } {
  let iana = "UTC";
  try {
    iana = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  } catch {
    /* keep UTC */
  }
  const label =
    new Intl.DateTimeFormat("ru-RU", { timeZoneName: "short" })
      .formatToParts(new Date())
      .find((p) => p.type === "timeZoneName")?.value ?? "";
  return { iana, label };
}
