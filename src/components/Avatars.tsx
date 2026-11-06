"use client";
// Profile pictures: animals that live only in México, drawn for Mi Camino.
import type { ReactNode } from "react";
import type { Lang } from "@/lib/i18n";

type Species = { id: string; es: string; en: string; factEs: string; factEn: string; art: ReactNode };

const ink = "#2b2622";

export const AVATARS: Species[] = [
  {
    id: "ajolote", es: "Ajolote", en: "Axolotl",
    factEs: "Solo vive en los canales de Xochimilco, en la Ciudad de México. ¡Le vuelven a crecer las patas!",
    factEn: "It only lives in the canals of Xochimilco, in Mexico City. It can grow its legs back!",
    art: (
      <>
        <rect width="100" height="100" fill="#cfe9e4" />
        <path d="M0 84 Q25 78 50 84 T100 84 V100 H0Z" fill="#a9d6cf" />
        <ellipse cx="50" cy="80" rx="22" ry="14" fill="#f2a3b6" />
        <g stroke="#e0607f" strokeWidth="5" strokeLinecap="round" fill="none">
          <path d="M28 42 Q19 34 14 28" /><path d="M26 50 Q16 49 9 48" /><path d="M28 58 Q19 63 14 69" />
          <path d="M72 42 Q81 34 86 28" /><path d="M74 50 Q84 49 91 48" /><path d="M72 58 Q81 63 86 69" />
        </g>
        <g fill="#e0607f">
          <circle cx="14" cy="28" r="3.5" /><circle cx="9" cy="48" r="3.5" /><circle cx="14" cy="69" r="3.5" />
          <circle cx="86" cy="28" r="3.5" /><circle cx="91" cy="48" r="3.5" /><circle cx="86" cy="69" r="3.5" />
        </g>
        <ellipse cx="50" cy="51" rx="26" ry="20" fill="#f7b6c6" />
        <circle cx="39" cy="48" r="3.6" fill={ink} /><circle cx="61" cy="48" r="3.6" fill={ink} />
        <circle cx="40.2" cy="46.8" r="1.1" fill="#fff" /><circle cx="62.2" cy="46.8" r="1.1" fill="#fff" />
        <circle cx="33" cy="57" r="3.2" fill="#f08aa4" opacity=".7" /><circle cx="67" cy="57" r="3.2" fill="#f08aa4" opacity=".7" />
        <path d="M41 58 Q50 65 59 58" stroke="#b9475f" strokeWidth="2.4" strokeLinecap="round" fill="none" />
      </>
    ),
  },
  {
    id: "vaquita", es: "Vaquita marina", en: "Vaquita porpoise",
    factEs: "La marsopa más pequeña del mundo. Solo vive en el norte del Golfo de California.",
    factEn: "The smallest porpoise in the world. It only lives in the northern Gulf of California.",
    art: (
      <>
        <rect width="100" height="100" fill="#cfe2f2" />
        <path d="M0 30 Q12 26 24 30 T48 30 T72 30 T100 30" stroke="#b5d0e8" strokeWidth="3" fill="none" />
        <path d="M0 88 Q12 84 24 88 T48 88 T72 88 T100 88" stroke="#b5d0e8" strokeWidth="3" fill="none" />
        <path d="M76 54 L92 42 Q90 55 94 66 Z" fill="#7d8b96" />
        <path d="M46 42 Q52 32 60 31 Q57 37 60 42 Z" fill="#7d8b96" />
        <ellipse cx="46" cy="56" rx="34" ry="17" fill="#909eaa" />
        <ellipse cx="44" cy="63" rx="27" ry="9" fill="#dbe3e9" />
        <path d="M40 64 Q46 74 54 74 Q50 67 50 62 Z" fill="#7d8b96" />
        <ellipse cx="25" cy="52" rx="6.5" ry="5.5" fill="#2f3a44" />
        <circle cx="25.5" cy="51.5" r="2" fill="#fff" /><circle cx="25.8" cy="51.8" r="1" fill={ink} />
        <path d="M13 58 Q19 63 28 61" stroke="#2f3a44" strokeWidth="3.2" strokeLinecap="round" fill="none" />
      </>
    ),
  },
  {
    id: "teporingo", es: "Teporingo", en: "Volcano rabbit",
    factEs: "El conejo de los volcanes: vive en las faldas del Popocatépetl y el Iztaccíhuatl.",
    factEn: "The volcano rabbit: it lives on the slopes of Popocatépetl and Iztaccíhuatl.",
    art: (
      <>
        <rect width="100" height="100" fill="#f3e6c4" />
        <path d="M0 78 L28 46 L40 56 L58 30 L100 74 V100 H0Z" fill="#cdb98a" />
        <path d="M52 37 L58 30 L65 38 L61 36 L58 39 L55 36Z" fill="#fff" />
        <path d="M0 86 Q30 76 60 84 T100 82 V100 H0Z" fill="#9fae6a" />
        <ellipse cx="50" cy="74" rx="22" ry="16" fill="#76563a" />
        <ellipse cx="41" cy="38" rx="5.5" ry="8" fill="#76563a" /><ellipse cx="59" cy="38" rx="5.5" ry="8" fill="#76563a" />
        <ellipse cx="41" cy="39" rx="2.8" ry="5" fill="#c99a78" /><ellipse cx="59" cy="39" rx="2.8" ry="5" fill="#c99a78" />
        <circle cx="50" cy="54" r="16" fill="#8a6a4a" />
        <circle cx="44" cy="52" r="2.8" fill={ink} /><circle cx="56" cy="52" r="2.8" fill={ink} />
        <circle cx="44.8" cy="51.2" r=".9" fill="#fff" /><circle cx="56.8" cy="51.2" r=".9" fill="#fff" />
        <path d="M48 58 L52 58 L50 60.5Z" fill="#3a2a1f" />
        <g stroke="#3a2a1f" strokeWidth="1" strokeLinecap="round"><path d="M45 60 L35 59" /><path d="M45 61.5 L36 63" /><path d="M55 60 L65 59" /><path d="M55 61.5 L64 63" /></g>
      </>
    ),
  },
  {
    id: "perrito", es: "Perrito llanero mexicano", en: "Mexican prairie dog",
    factEs: "Vive en los pastizales de Coahuila, Nuevo León, San Luis Potosí y Zacatecas.",
    factEn: "It lives in the grasslands of Coahuila, Nuevo León, San Luis Potosí and Zacatecas.",
    art: (
      <>
        <rect width="100" height="100" fill="#f6e7bf" />
        <circle cx="80" cy="20" r="9" fill="#f2c14e" />
        <ellipse cx="50" cy="96" rx="44" ry="14" fill="#b98b55" />
        <ellipse cx="50" cy="66" rx="17" ry="24" fill="#c49a62" />
        <ellipse cx="50" cy="71" rx="10" ry="16" fill="#e7cc9f" />
        <circle cx="39" cy="29" r="3.8" fill="#a97f4c" /><circle cx="61" cy="29" r="3.8" fill="#a97f4c" />
        <circle cx="50" cy="39" r="13.5" fill="#c49a62" />
        <ellipse cx="50" cy="44" rx="7" ry="5" fill="#e7cc9f" />
        <circle cx="44.5" cy="37" r="2.4" fill={ink} /><circle cx="55.5" cy="37" r="2.4" fill={ink} />
        <circle cx="45.2" cy="36.3" r=".8" fill="#fff" /><circle cx="56.2" cy="36.3" r=".8" fill="#fff" />
        <ellipse cx="50" cy="42" rx="2" ry="1.4" fill="#3a2a1f" />
        <path d="M48 45 Q50 46.5 52 45" stroke="#3a2a1f" strokeWidth="1" fill="none" />
        <ellipse cx="44" cy="57" rx="3.6" ry="2.6" fill="#a97f4c" /><ellipse cx="56" cy="57" rx="3.6" ry="2.6" fill="#a97f4c" />
      </>
    ),
  },
  {
    id: "loro", es: "Loro tamaulipeco", en: "Red-crowned parrot",
    factEs: "Loro de corona roja que solo vive en el noreste de México.",
    factEn: "A red-crowned parrot that only lives in northeastern Mexico.",
    art: (
      <>
        <rect width="100" height="100" fill="#fde5bd" />
        <path d="M0 92 Q50 80 100 92 V100 H0Z" fill="#8a6a46" />
        <ellipse cx="55" cy="68" rx="22" ry="26" fill="#3d9a4a" />
        <path d="M62 50 Q80 60 76 90 Q66 80 60 70 Z" fill="#2c7a38" />
        <path d="M76 82 Q78 88 74 92 L70 84Z" fill="#d8352a" />
        <circle cx="49" cy="42" r="17" fill="#4fb35a" />
        <path d="M33 37 Q36 24 50 25 Q44 30 42 38 Z" fill="#d8352a" />
        <path d="M58 30 Q66 34 66 42 Q61 37 56 36 Z" fill="#6b8fd6" />
        <circle cx="45" cy="40" r="5" fill="#fff4cc" />
        <circle cx="45" cy="40" r="2.6" fill={ink} /><circle cx="45.8" cy="39.2" r=".8" fill="#fff" />
        <path d="M35 43 Q24 44 26 54 Q30 53 34 50 Q33 47 35 43Z" fill="#ead9a8" />
        <path d="M30 51 Q33 52 34 50" stroke="#b9a777" strokeWidth="1" fill="none" />
      </>
    ),
  },
  {
    id: "tortuga", es: "Tortuga de Cuatro Ciénegas", en: "Coahuilan box turtle",
    factEs: "Una tortuga de agua que solo vive en las pozas de Cuatro Ciénegas, Coahuila.",
    factEn: "A water turtle that only lives in the pools of Cuatro Ciénegas, Coahuila.",
    art: (
      <>
        <rect width="100" height="100" fill="#cfe7d2" />
        <path d="M0 84 Q25 78 50 84 T100 84 V100 H0Z" fill="#a8d1b1" />
        <ellipse cx="34" cy="76" rx="5" ry="6" fill="#5c5b33" /><ellipse cx="70" cy="76" rx="5" ry="6" fill="#5c5b33" />
        <path d="M80 66 L90 70 L80 71Z" fill="#5c5b33" />
        <circle cx="21" cy="60" r="9.5" fill="#6d6c3c" />
        <circle cx="18" cy="58" r="2.3" fill={ink} /><circle cx="18.6" cy="57.4" r=".8" fill="#fff" />
        <path d="M13 63 Q16 65 20 64" stroke="#3d3c20" strokeWidth="1.2" fill="none" strokeLinecap="round" />
        <ellipse cx="52" cy="69" rx="30" ry="7" fill="#3c4424" />
        <path d="M24 68 Q26 42 52 39 Q78 42 80 68 Z" fill="#4f5a2e" />
        <g stroke="#7a8a48" strokeWidth="1.6" fill="none" strokeLinejoin="round">
          <path d="M44 48 L52 44 L60 48 L60 58 L52 62 L44 58 Z" />
          <path d="M44 48 L34 52 M60 48 L70 52 M44 58 L32 63 M60 58 L72 63 M52 44 L52 40 M52 62 L52 68" />
        </g>
      </>
    ),
  },
  {
    id: "murcielago", es: "Murciélago pescador", en: "Fish-eating bat",
    factEs: "Pesca con las patas de noche en las islas del Golfo de California.",
    factEn: "It fishes with its feet at night on the islands of the Gulf of California.",
    art: (
      <>
        <rect width="100" height="100" fill="#2d3b5c" />
        <circle cx="76" cy="24" r="11" fill="#f4e4a6" />
        <g fill="#f4e4a6"><circle cx="20" cy="18" r="1.2" /><circle cx="34" cy="10" r="1" /><circle cx="12" cy="34" r="1" /><circle cx="88" cy="48" r="1" /></g>
        <path d="M0 86 Q25 80 50 86 T100 86 V100 H0Z" fill="#3e5a86" />
        <path d="M44 50 Q30 36 10 44 Q17 49 15 56 Q23 53 26 59 Q33 54 36 61 Q42 56 46 60Z" fill="#5d4535" />
        <path d="M56 50 Q70 36 90 44 Q83 49 85 56 Q77 53 74 59 Q67 54 64 61 Q58 56 54 60Z" fill="#5d4535" />
        <ellipse cx="50" cy="56" rx="8.5" ry="12" fill="#8a6a52" />
        <path d="M44.5 39 L43 29 L49 36Z" fill="#8a6a52" /><path d="M55.5 39 L57 29 L51 36Z" fill="#8a6a52" />
        <circle cx="50" cy="42" r="7.5" fill="#9a785e" />
        <circle cx="47" cy="41" r="1.6" fill="#fff" /><circle cx="53" cy="41" r="1.6" fill="#fff" />
        <circle cx="47.3" cy="41.3" r=".8" fill={ink} /><circle cx="53.3" cy="41.3" r=".8" fill={ink} />
        <g stroke="#8a6a52" strokeWidth="2" strokeLinecap="round"><path d="M47 67 L45 75" /><path d="M53 67 L55 75" /></g>
        <ellipse cx="50" cy="80" rx="7" ry="3" fill="#c8d6e6" /><path d="M56 80 L61 77 L61 83Z" fill="#c8d6e6" />
      </>
    ),
  },
  {
    id: "garrobo", es: "Garrobo", en: "Spiny-tailed iguana",
    factEs: "Iguana de cola espinosa que solo vive en el occidente y el sur de México.",
    factEn: "A spiny-tailed iguana that only lives in western and southern Mexico.",
    art: (
      <>
        <rect width="100" height="100" fill="#f7dcac" />
        <circle cx="80" cy="22" r="10" fill="#f0a64a" />
        <ellipse cx="50" cy="86" rx="46" ry="12" fill="#c49a6c" />
        <path d="M66 66 Q86 62 92 72 Q95 79 88 79 Q86 72 66 72 Z" fill="#45453a" />
        <g stroke="#c9b48a" strokeWidth="2"><path d="M74 64.5 L75 71.5" /><path d="M81 64.5 L82 72" /><path d="M87 67 L88 74" /></g>
        <ellipse cx="47" cy="67" rx="22" ry="9" fill="#4d4d3e" />
        <path d="M32 60 L35 55 L38 59 L41 54 L44 58 L47 53 L50 58 L53 54 L56 59 L59 55 L62 60" fill="#4d4d3e" stroke="#4d4d3e" strokeWidth="1.5" strokeLinejoin="round" />
        <g stroke="#c9b48a" strokeWidth="2.2"><path d="M42 59.5 L41 75" /><path d="M52 59.5 L52 75.5" /></g>
        <path d="M34 72 L30 80 M60 72 L64 80" stroke="#3d3d30" strokeWidth="4" strokeLinecap="round" />
        <ellipse cx="22" cy="60" rx="12" ry="8" fill="#56563f" />
        <circle cx="19" cy="57.5" r="2.4" fill="#e9d79a" /><circle cx="19" cy="57.5" r="1.2" fill={ink} />
        <path d="M11 63 Q18 65 26 63" stroke="#2f2f25" strokeWidth="1.2" fill="none" strokeLinecap="round" />
      </>
    ),
  },
];

export const avatarById = (id?: string) => AVATARS.find((a) => a.id === id);

/** The person's picture: their animal, or the first letter of their name. */
export function Avatar({ id, name, size = 48, className }: { id?: string; name?: string; size?: number; className?: string }) {
  const a = avatarById(id);
  if (!a) {
    return (
      <span className={className} style={{ width: size, height: size, display: "inline-flex", alignItems: "center", justifyContent: "center", borderRadius: "9999px", background: "#c0563a", color: "#fffaf2", fontWeight: 800, fontSize: size * 0.45, flexShrink: 0 }} aria-hidden>
        {(name?.trim()[0] ?? "?").toUpperCase()}
      </span>
    );
  }
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} className={className} style={{ borderRadius: "9999px", flexShrink: 0 }} role="img" aria-label={a.es}>
      <defs><clipPath id={`av-${a.id}-${size}`}><circle cx="50" cy="50" r="50" /></clipPath></defs>
      <g clipPath={`url(#av-${a.id}-${size})`}>{a.art}</g>
    </svg>
  );
}

export const avatarName = (a: Species, lang: Lang) => (lang === "en" ? a.en : a.es);
export const avatarFact = (a: Species, lang: Lang) => (lang === "en" ? a.factEn : a.factEs);
