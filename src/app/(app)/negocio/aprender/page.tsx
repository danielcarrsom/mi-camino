"use client";
import { LearnHub } from "@/components/LearnHub";
import { BIZ_GAMES, BIZ_LESSONS, BIZ_NEEDS, BIZ_RESOURCES } from "@/lib/learnBiz";

export default function AprenderNegocio() {
  return (
    <LearnHub
      c={{
        title: ["Aprender para mi negocio", "Learn for my business"],
        sub: ["Precios, costos, sueldo, permisos y préstamos", "Prices, costs, salary, permits and loans"],
        say: [
          "Aquí aprendes a llevar mejor tu negocio: poner buenos precios, separar el dinero, pagarte un sueldo, y dónde pedir ayuda gratis para permisos y préstamos.",
          "Here you learn to run your business better: good prices, keeping money apart, paying yourself, and where to get free help with permits and loans.",
        ],
        games: BIZ_GAMES, lessons: BIZ_LESSONS, needs: BIZ_NEEDS, resources: BIZ_RESOURCES,
        soon: {
          title: ["Pronto: aliados del Consulado para negocios", "Coming soon: Consulate business partners"],
          text: ["Organizaciones que trabajan con el Consulado de México para apoyar a emprendedores.", "Organizations that work with the Mexican Consulate to support entrepreneurs."],
        },
      }}
    />
  );
}
