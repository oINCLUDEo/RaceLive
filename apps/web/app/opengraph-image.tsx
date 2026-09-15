import { OG_SIZE, ogImage } from "@/lib/og";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const size = OG_SIZE;
export const contentType = "image/png";
export const alt = "race.live — Формула-1 на русском";

export default async function Image() {
  return ogImage({
    eyebrow: "Формула-1 на русском",
    title: "Смотрим Формулу вместе",
    subtitle: "Расписание · результаты · живой тайминг",
  });
}
