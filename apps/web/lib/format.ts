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
