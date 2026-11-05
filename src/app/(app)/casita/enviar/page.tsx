"use client";
import { Soon } from "@/components/Soon";
import { useLang } from "@/lib/store";

export default function Enviar() {
  const en = useLang() === "en";
  return (
    <Soon
      title={en ? "Send money" : "Enviar dinero"}
      what={en
        ? "See how many pesos your family receives after fees and the exchange rate, and safe options like the Finabien card."
        : "Mira cuántos pesos le llegan a tu familia después de comisiones y tipo de cambio, y opciones seguras como la Tarjeta Finabien."}
    />
  );
}
