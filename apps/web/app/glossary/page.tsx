import type { ReactNode } from "react";

export const metadata = {
  title: "Словарь",
  description:
    "Термины автогонок по-русски: статусы протокола (DNF, DNS, DSQ), сессии уик-энда, шины, флаги, тайминг и гоночный сленг.",
};

type Item = { badge?: { text: string; color: string }; term: string; desc: string };
type Section = { title: string; note?: string; items: Item[] };

// Функциональные цвета берём из дизайн-токенов — «цвет живёт только в данных».
const SECTIONS: Section[] = [
  {
    title: "Статусы в протоколе",
    note: "Как в официальной трансляции. Наведи на статус в таблицах сайта — покажет причину по-русски.",
    items: [
      { term: "Финиш", desc: "Пилот прошёл всю дистанцию и классифицирован." },
      { term: "+1 круг", desc: "Отстал на круг и более, но классифицирован — попадает в протокол." },
      { badge: { text: "DNF", color: "var(--mute)" }, term: "Did Not Finish — сход", desc: "Не завершил гонку: авария, поломка, столкновение. Классификационная позиция может остаться (напр. P16)." },
      { badge: { text: "DNS", color: "var(--mute)" }, term: "Did Not Start — не стартовал", desc: "Не вышел на старт (поломка на прогревочном круге, снятие)." },
      { badge: { text: "DSQ", color: "var(--red)" }, term: "Disqualified — дисквалификация", desc: "Результат аннулирован за нарушение регламента (перевес, тех. несоответствие)." },
      { badge: { text: "NC", color: "var(--mute)" }, term: "Not Classified — не классифицирован", desc: "Проехал слишком мало кругов (менее 90% дистанции лидера)." },
      { badge: { text: "DNQ", color: "var(--mute)" }, term: "Did Not Qualify — не квалифицировался", desc: "Не показал время для допуска к гонке (историческое)." },
    ],
  },
  {
    title: "Сессии уик-энда",
    items: [
      { term: "Практика (FP1–FP3)", desc: "Свободные заезды: настройка машины, работа с резиной. На очки не влияют." },
      { term: "Квалификация (Q1 · Q2 · Q3)", desc: "Определяет стартовую решётку. После Q1 и Q2 отсеиваются по 5 машин; за поул борются в Q3." },
      { term: "Спринт", desc: "Короткая гонка (обычно в субботу). Очки — первой восьмёрке." },
      { term: "Спринт-квалификация", desc: "Отдельная квалификация, задаёт решётку спринта." },
      { term: "Гонка", desc: "Основное событие уик-энда. Очки — первой десятке (25 за победу)." },
    ],
  },
  {
    title: "Шины",
    note: "Маркировка Pirelli. В таблице тайминга буква шины окрашена в её цвет.",
    items: [
      { badge: { text: "S", color: "var(--red)" }, term: "Soft — мягкие", desc: "Максимальное сцепление и скорость, но быстрый износ." },
      { badge: { text: "M", color: "var(--yellow)" }, term: "Medium — средние", desc: "Баланс скорости и ресурса." },
      { badge: { text: "H", color: "var(--bone)" }, term: "Hard — жёсткие", desc: "Медленнее, зато служат дольше — под длинные отрезки." },
      { badge: { text: "I", color: "var(--green)" }, term: "Intermediate — промежуточные", desc: "Слабый дождь и мокрая, подсыхающая трасса." },
      { badge: { text: "W", color: "var(--blue)" }, term: "Wet — дождевые", desc: "Сильный дождь и стоячая вода." },
    ],
  },
  {
    title: "Тайминг и цвета",
    note: "Пять функциональных цветов встречаются только в данных.",
    items: [
      { badge: { text: "●", color: "var(--purple)" }, term: "Фиолетовый", desc: "Быстрейший круг или сектор всей сессии." },
      { badge: { text: "●", color: "var(--green)" }, term: "Зелёный", desc: "Личный лучший результат пилота." },
      { badge: { text: "●", color: "var(--yellow)" }, term: "Жёлтый", desc: "Медленнее личного лучшего." },
      { term: "Интервал (gap)", desc: "Отставание от идущего впереди или от лидера, в секундах." },
      { term: "Стинт", desc: "Отрезок дистанции на одном комплекте шин — от пит-стопа до пит-стопа." },
      { term: "Круг лидера", desc: "Эталон, по которому считают отставание «на круг»." },
    ],
  },
  {
    title: "Флаги и режимы",
    items: [
      { badge: { text: "▮", color: "var(--yellow)" }, term: "Жёлтый флаг", desc: "Опасность на трассе. Обгонять нельзя, сбрось скорость." },
      { badge: { text: "▮▮", color: "var(--yellow)" }, term: "Двойной жёлтый", desc: "Серьёзная опасность, будь готов остановиться." },
      { badge: { text: "▮", color: "var(--red)" }, term: "Красный флаг", desc: "Сессия остановлена, все едут в боксы." },
      { badge: { text: "▮", color: "var(--blue)" }, term: "Синий флаг", desc: "Пропусти лидера — тебя обгоняют на круг." },
      { term: "Клетчатый флаг", desc: "Финиш сессии." },
      { term: "SC / VSC", desc: "Сейфти-кар и виртуальный сейфти-кар: нейтрализация с ограничением скорости." },
    ],
  },
  {
    title: "Гоночные термины",
    items: [
      { term: "Поул (pole)", desc: "Первое место на старте по итогам квалификации." },
      { term: "Подиум", desc: "Первая тройка — места на пьедестале." },
      { term: "Пит-стоп", desc: "Остановка в боксах: смена шин, ремонт, штраф." },
      { term: "Пит-лейн", desc: "Служебная дорога боксов с ограничением скорости." },
      { term: "DRS", desc: "Подвижное заднее крыло: снижает сопротивление в зонах обгона." },
      { term: "Undercut / Overcut", desc: "Ранний пит-стоп ради опережения соперника — или, наоборот, поздний." },
      { term: "Парк-ферме", desc: "Закрытый режим: после квалы машину почти нельзя дорабатывать." },
      { term: "Грид", desc: "Стартовое поле, расстановка машин перед гонкой." },
    ],
  },
];

function Badge({ text, color }: { text: string; color: string }) {
  return (
    <span
      className="tabular inline-flex h-[22px] min-w-[26px] items-center justify-center rounded-md px-1.5 text-[11px] font-semibold"
      style={{ background: color === "var(--bone)" ? "var(--surface-2)" : `color-mix(in srgb, ${color} 16%, transparent)`, color }}
    >
      {text}
    </span>
  );
}

function Row({ item, last }: { item: Item; last: boolean }): ReactNode {
  return (
    <div className={`flex gap-3 px-5 py-3.5 ${last ? "" : "border-b border-line"}`}>
      <div className="flex w-[30px] shrink-0 justify-center pt-0.5">
        {item.badge && <Badge text={item.badge.text} color={item.badge.color} />}
      </div>
      <div className="min-w-0">
        <div className="font-display text-sm font-semibold">{item.term}</div>
        <div className="mt-0.5 text-sm leading-relaxed text-mute">{item.desc}</div>
      </div>
    </div>
  );
}

export default function GlossaryPage() {
  return (
    <div className="flex flex-col gap-6">
      {/* ШАПКА */}
      <section className="glow-panel overflow-hidden rounded-[24px] p-8 shadow-[var(--soft)]">
        <div className="text-xs uppercase tracking-[0.16em] text-mute">справочник</div>
        <h1 className="mt-2 font-display text-4xl font-semibold">Словарь терминов</h1>
        <p className="mt-3 max-w-[560px] text-mute">
          Язык автогонок по-русски: что значат статусы в протоколе, цвета в таблице тайминга,
          шины, флаги и гоночный сленг. Аббревиатуры на сайте кликабельны наведением — тултип
          покажет расшифровку.
        </p>
      </section>

      {/* СЕКЦИИ */}
      <div className="grid gap-5 lg:grid-cols-2">
        {SECTIONS.map((s) => (
          <section key={s.title} className="card-soft overflow-hidden">
            <div className="border-b border-line px-5 py-3">
              <div className="text-xs uppercase tracking-wide text-mute">{s.title}</div>
              {s.note && <div className="mt-1 text-[12px] leading-snug text-mute/80">{s.note}</div>}
            </div>
            {s.items.map((item, i) => (
              <Row key={item.term} item={item} last={i === s.items.length - 1} />
            ))}
          </section>
        ))}
      </div>

      <p className="text-xs text-mute">
        Термины и определения — редакция race.live. Уточнения и дополнения приветствуются.
      </p>
    </div>
  );
}
