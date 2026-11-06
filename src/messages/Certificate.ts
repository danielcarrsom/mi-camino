// Texts for src/components/Certificate.tsx. Spanish and English; another language can be added to any message
// (for example `mix: "…"` for Mixteco) and is used when present.
import type { Msg } from "@/lib/i18n";

const TXT = {
  certificadoDeAhorro: { es: "CERTIFICADO DE AHORRO", en: "SAVINGS CERTIFICATE" },
  alguienEspecial: { es: "Alguien especial", en: "Someone special" },
  estaAhorrandoPara: { es: "está ahorrando para", en: "is saving for" },
  ahorrandoDesde: { es: "Ahorrando desde", en: "Saving since" },
  pocoAPocoVamosLlegando: { es: "Poco a poco, vamos llegando 💪", en: "Little by little, we're getting there 💪" },
  hechoConMiCamino: { es: "Hecho con Mi Camino", en: "Made with Mi Camino" },
  comparteloConTuFamilia: { es: "Compártelo con tu familia", en: "Share with your family" },
  certificadoDeAhorro2: { es: "Certificado de ahorro", en: "Savings certificate" },
  compartir: { es: "Compartir", en: "Share" },
  enviarPorWhatsapp: { es: "Enviar por WhatsApp", en: "Send by WhatsApp" },
  guardarLaImagen: { es: "Guardar la imagen", en: "Save the picture" },
  soloMuestraTuNombreTu: { es: "Solo muestra tu nombre, tu meta y cuánto llevas.", en: "It only shows your first name, your goal and your progress." },
  estoyAhorrandoParaConMi: { es: "¡Estoy ahorrando para \"{0}\" con Mi Camino! Ya llevo {1}% 💪", en: "I'm saving for \"{0}\" with Mi Camino: {1}% done! 💪" },
} satisfies Record<string, Msg>;

export default TXT;
