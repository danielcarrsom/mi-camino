// Security questions for recovering a forgotten PIN. Answers are checked on
// the server, ignoring accents, capitals and spaces.
import type { Label } from "./catalog";

export const RECOVERY_QUESTIONS: { id: string; label: Label; example: Label }[] = [
  { id: "pueblo", label: { es: "¿En qué pueblo o ciudad naciste?", en: "What town or city were you born in?" }, example: { es: "Ej. Atlixco", en: "e.g. Atlixco" } },
  { id: "mama", label: { es: "¿Cómo se llama tu mamá?", en: "What is your mother's first name?" }, example: { es: "Ej. Guadalupe", en: "e.g. Guadalupe" } },
  { id: "mascota", label: { es: "¿Cómo se llamaba tu primera mascota?", en: "What was your first pet's name?" }, example: { es: "Ej. Firulais", en: "e.g. Firulais" } },
  { id: "comida", label: { es: "¿Cuál es tu comida favorita?", en: "What is your favorite food?" }, example: { es: "Ej. Mole poblano", en: "e.g. Mole poblano" } },
  { id: "escuela", label: { es: "¿Cómo se llamaba tu primera escuela?", en: "What was your first school called?" }, example: { es: "Ej. Benito Juárez", en: "e.g. Benito Juárez" } },
  { id: "apodo", label: { es: "¿Cuál era tu apodo de niño?", en: "What was your childhood nickname?" }, example: { es: "Ej. Chuy", en: "e.g. Chuy" } },
];
export const recoveryQuestion = (id: string) => RECOVERY_QUESTIONS.find((q) => q.id === id) ?? RECOVERY_QUESTIONS[0];
