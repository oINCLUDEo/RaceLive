import { redirect } from "next/navigation";

// Стримы теперь скомбинированы с таймингом на странице «Эфир».
export default function StreamsPage() {
  redirect("/live#streams");
}
