"use client";
import { Soon } from "@/components/Soon";
import { useLang } from "@/lib/store";

export default function Negocio() {
  const en = useLang() === "en";
  return (
    <Soon
      back="/inicio"
      title="Mi Negocio"
      what={en
        ? "Write down what you sell each day, what it costs you, and see your business health light: green, yellow or red. With price suggestions and a button to pay yourself a salary."
        : "Anota lo que vendes cada día, lo que te cuesta, y mira el semáforo de tu negocio: verde, amarillo o rojo. Con sugerencias de precio y un botón para pagarte un sueldo."}
    />
  );
}
