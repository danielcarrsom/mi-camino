"use client";
import { Soon } from "@/components/Soon";
import { useLang } from "@/lib/store";

export default function Aprender() {
  const en = useLang() === "en";
  return (
    <Soon
      title={en ? "Learn" : "Aprender"}
      what={en
        ? "Short games and audio lessons about saving, credit, banks and avoiding scams, plus trusted places to get help."
        : "Juegos cortos y lecciones en audio sobre ahorro, crédito, bancos y cómo evitar fraudes, con lugares de confianza para pedir ayuda."}
    />
  );
}
