"use client";
import { LearnHub } from "@/components/LearnHub";
import { GAMES, LESSONS, NEEDS, RESOURCES } from "@/lib/learn";

export default function Aprender() {
  return (
    <LearnHub
      c={{
        title: ["Aprender", "Learn"],
        sub: ["Juega, escucha y encuentra ayuda de confianza", "Play, listen and find trusted help"],
        say: [
          "Aquí aprendes de dinero jugando y escuchando lecciones cortas. Y si necesitas ayuda de una persona, aquí están los lugares de confianza, casi todos gratis.",
          "Here you learn about money by playing and listening to short lessons. And if you need help from a person, here are trusted places, almost all free.",
        ],
        games: GAMES, lessons: LESSONS, needs: NEEDS, resources: RESOURCES,
      }}
    />
  );
}
