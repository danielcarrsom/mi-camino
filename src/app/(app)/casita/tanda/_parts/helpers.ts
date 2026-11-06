// Small helpers shared by the tanda screens.
import type { Tanda } from "@/lib/types";
import { tx, type Lang } from "@/lib/i18n";
import TXT from "@/messages/casita-tanda";

export const L = (lang: Lang, es: string, en: string) => (lang === "en" ? en : es);

export const everyWord = (lang: Lang, e: Tanda["every"]) =>
  e === "week" ? tx(lang, TXT.cadaSemana) : e === "2weeks" ? tx(lang, TXT.cada2Semanas) : tx(lang, TXT.cadaMes);

export const dateWord = (lang: Lang, d: Date) => d.toLocaleDateString(lang === "en" ? "en-US" : "es-MX", { day: "numeric", month: "long" });

export const personName = (lang: Lang, t: Tanda, i: number) =>
  i === t.myTurn - 1 ? tx(lang, TXT.tu) : t.names[i]?.trim() || `${tx(lang, TXT.persona)} ${i + 1}`;
