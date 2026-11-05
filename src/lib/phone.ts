// Phone numbers from the US and Mexico.
// The account key is digits only: US numbers keep their 10 digits (as before),
// Mexican numbers are stored as 52 + 10 digits, so the two never collide.

export type PhoneCountry = "us" | "mx";

export const PHONE_COUNTRIES: { id: PhoneCountry; flag: string; code: string; es: string; en: string; placeholder: string }[] = [
  { id: "us", flag: "🇺🇸", code: "+1", es: "Estados Unidos", en: "United States", placeholder: "(718) 555 0123" },
  { id: "mx", flag: "🇲🇽", code: "+52", es: "México", en: "Mexico", placeholder: "55 1234 5678" },
];

/** Turns whatever the person typed into an account key, or null if it isn't a full number yet. */
export function phoneKey(input: string, country: PhoneCountry): string | null {
  const d = input.replace(/\D/g, "");
  const n = nationalNumber(d, country);
  if (!n) return null;
  return n.country === "mx" ? "52" + n.national : n.national;
}

/** The country a typed number really belongs to, when it carries its own prefix (+52…, +1…). */
export function detectCountry(input: string, fallback: PhoneCountry): PhoneCountry {
  const d = input.replace(/\D/g, "");
  return nationalNumber(d, fallback)?.country ?? fallback;
}

function nationalNumber(d: string, country: PhoneCountry): { country: PhoneCountry; national: string } | null {
  // with an international prefix
  if (d.length === 12 && d.startsWith("52")) return { country: "mx", national: d.slice(2) };
  if (d.length === 13 && d.startsWith("521")) return { country: "mx", national: d.slice(3) }; // old mobile "+52 1"
  if (d.length === 14 && d.startsWith("011")) return nationalNumber(d.slice(3), country); // dialing out of the US
  // 11 digits starting with 1: "+1" for the US, or the old "1" before Mexican mobiles
  if (d.length === 11 && d.startsWith("1")) return { country: country === "mx" ? "mx" : "us", national: d.slice(1) };
  // old Mexican mobile prefixes 044 / 045
  if (d.length === 13 && (d.startsWith("044") || d.startsWith("045"))) return { country: "mx", national: d.slice(3) };
  if (d.length === 10) return { country, national: d };
  return null;
}

/** How a saved key reads on screen. */
export function formatPhoneKey(key: string): string {
  if (key.length === 12 && key.startsWith("52")) { const n = key.slice(2); return `+52 ${n.slice(0, 2)} ${n.slice(2, 6)} ${n.slice(6)}`; }
  if (key.length === 10) return `(${key.slice(0, 3)}) ${key.slice(3, 6)}-${key.slice(6)}`;
  return key;
}

/** The same 10 digits read as the other country: numbers saved before people
 *  picked the right country still work. */
export function altPhoneKey(key: string): string | null {
  if (key === "0000000000") return null;
  if (key.length === 12 && key.startsWith("52")) return key.slice(2);
  if (key.length === 10) return "52" + key;
  return null;
}
