"use client";
import { Soon } from "@/components/Soon";
import { useLang } from "@/lib/store";

export default function Documentos() {
  const en = useLang() === "en";
  return (
    <Soon
      title={en ? "Explain a paper" : "Explicar un papel"}
      what={en
        ? "Take a photo of a letter, contract or bill and we'll explain it in simple words. If it looks like a scam, we'll warn you and show you who can help."
        : "Toma una foto de una carta, contrato o factura y te la explicamos con palabras sencillas. Si parece estafa, te avisamos y te decimos quién te puede ayudar."}
    />
  );
}
