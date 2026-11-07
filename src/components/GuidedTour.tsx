"use client";
// The guided tour: after creating an account, the app walks the person through
// every part, on the real screens, one step at a time. Each step lights up the
// part being explained and can be read aloud. The app can be used once the tour
// is finished (the example account can skip it for demos).
import { useResetOn } from "@/lib/hooks";
import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Check, Volume2, VolumeX } from "lucide-react";
import { DEMO_PHONE, useLang, useMe, useStore } from "@/lib/store";
import { speak, stopSpeaking } from "@/lib/voice";
import { playGoal } from "@/lib/sound";
import { ListenButton, cx } from "./ui";

type Step = { path?: string; targets?: string[]; title: [string, string]; text: [string, string]; setup?: "welcome"; when?: "biz" | "nobiz" };

const STEPS: Step[] = [
  { path: "/casita", setup: "welcome", title: ["¡Te damos la bienvenida a Mi Camino!", "Welcome to Mi Camino!"], text: ["Te voy a enseñar a usarlo en unos 3 minutos: primero Mi Casita, el dinero de tu casa, y luego Mi Negocio. Solo toca el botón “Siguiente” cuando termines de leer.", "I'll show you how to use it in about 3 minutes: first Mi Casita, your home money, then Mi Negocio. Just tap “Next” when you're done reading."] },
  { path: "/casita", targets: ['[data-tour="resumen"]'], title: ["Tu resumen", "Your summary"], text: ["Aquí ves de un vistazo cuánto dinero te queda esta semana, después de tus gastos.", "Here you see at a glance how much money you have left this week, after expenses."] },
  { path: "/casita", targets: ['[data-tour="anotar"]'], title: ["El botón más importante", "The most important button"], text: ["Con este botón + anotas todo: lo que ganas y lo que gastas. Puedes hablar, escribir o tomarle foto a tu recibo.", "With this + button you add everything: what you earn and what you spend. You can talk, type or take a photo of your receipt."] },
  { path: "/casita/anotar?tipo=gane", targets: ['[data-tour="salario"]'], title: ["Tu salario", "Your salary"], text: ["Aquí anotas cuánto te pagan en tu trabajo. Es lo primero que vas a hacer cuando terminemos.", "Here you add how much you get paid at work. It's the first thing you'll do when we finish."] },
  { path: "/casita/dinero", targets: ['[data-tour="pagos"]'], title: ["Tus pagos del mes", "Your monthly payments"], text: ["Aquí ves tu renta, luz y teléfono. Cuando pagues uno, toca “Ya lo pagué” y te decimos cuánto te falta.", "Here you see rent, light and phone. When you pay one, tap “I paid it” and we'll show what's left."] },
  { path: "/casita/metas", targets: ["main h1"], title: ["Tus metas", "Your goals"], text: ["Aquí ahorras para tus sueños: tu casa, emergencias o un viaje. Cada vez que apartas dinero, se pone un ladrillo.", "Here you save for your dreams: a home, emergencies or a trip. Each time you save, a brick goes up."] },
  { path: "/casita/tanda", targets: ["main h1"], title: ["Tu tanda", "Your tanda"], text: ["Si estás en una tanda, aquí llevas la cuenta de cuándo pagas y cuándo te toca.", "If you're in a tanda, here you keep track of when you pay and when it's your turn."] },
  { path: "/casita/enviar", targets: ['[data-tour="enviar"]'], title: ["Enviar dinero", "Send money"], text: ["Escribe cuántos dólares se mandan desde Estados Unidos y te decimos cuánto le llega a la familia. También puedes comparar precios.", "Type how many dollars you send and we'll show how much your family gets. You can also compare prices."] },
  { path: "/casita/documentos", targets: ["main h1"], title: ["Explicar un papel", "Explain a paper"], text: ["¿Te llegó una carta o factura que no entiendes? Aquí te ayudamos a saber qué es y si parece estafa.", "Got a letter or bill you don't understand? Here we help you know what it is and if it looks like a scam."] },
  { path: "/aprender", targets: ['[data-tour="aprender"]'], title: ["Aprender", "Learn"], text: ["Juegos, lecciones que puedes escuchar, y teléfonos de lugares que te ayudan gratis.", "Games, lessons you can listen to, and phone numbers of places that help you for free."] },
  { path: "/casita", targets: ['[data-tour="modulos"]', '[data-tour="menu"]'], title: ["Ahora, Mi Negocio", "Now, My Business"], text: ["Aquí cambias entre “Mi Casita” y “Mi Negocio”. En el celular, está dentro de “Menú”. Vamos a ver Mi Negocio.", "Here you switch between “Mi Casita” and “My Business”. On a phone, it's inside “Menu”. Let's look at My Business."] },
  // ----- Mi Negocio, when there's no business yet -----
  { when: "nobiz", path: "/negocio", targets: ['[data-tour="setup"]'], title: ["Registra tu negocio", "Register your business"], text: ["Si vendes algo o tienes un trabajo por tu cuenta, aquí escribes el nombre de tu negocio y qué haces. Lo llevas aparte del dinero de tu casa.", "If you sell something or work for yourself, write your business name and what you do here. It's kept apart from your home money."] },
  { when: "nobiz", path: "/negocio", title: ["Lo que podrás hacer", "What you'll be able to do"], text: ["Anotar tus ventas y gastos hablando, ver un semáforo de cómo va tu negocio, calcular cuánto ganas por cada cosa que vendes, llevar tu inventario, ponerte un sueldo y ahorrar para crecer.", "Add sales and costs by talking, see a traffic light of how your business is doing, work out what you earn on each item, track inventory, pay yourself and save to grow."] },
  // ----- Mi Negocio, with a business -----
  { when: "biz", path: "/negocio", targets: ['[data-tour="semaforo"]'], title: ["El semáforo de tu negocio", "Your business traffic light"], text: ["Verde, amarillo o rojo: te dice cómo va tu negocio en los últimos 30 días, y por qué, con palabras sencillas.", "Green, yellow or red: it tells you how your business did in the last 30 days, and why, in plain words."] },
  { when: "biz", path: "/negocio", targets: ['[data-tour="vendi"]'], title: ["Anota ventas y gastos", "Add sales and costs"], text: ["Toca “Vendí” o “Gasté”. Puedes decirlo con tu voz, por ejemplo: “vendí 40 tamales a 3 dólares”.", "Tap “I sold” or “I spent”. You can say it out loud, for example: “I sold 40 tamales at 3 dollars”."] },
  { when: "biz", path: "/negocio", targets: ['[data-tour="sueldo"]'], title: ["Tu sueldo", "Your salary"], text: ["Ponte un sueldo fijo, como si fueras tu propio empleado. Cada vez que te pagues, toca “Ya me pagué” y pasa a Mi Casita.", "Set yourself a fixed salary, as if you were your own employee. Each time you pay yourself, tap “I paid myself” and it moves to Mi Casita."] },
  { when: "biz", path: "/negocio/dinero?tab=costos", targets: ['[data-tour="costos"]'], title: ["Tus costos e inventario", "Your costs and inventory"], text: ["Aquí ves cuánto te cuesta cada cosa que vendes y cuánto le ganas. Más abajo está tu inventario: para cuántos días te alcanza y cuánto comprar.", "Here you see what each item costs you and what you earn on it. Further down is your inventory: how many days it lasts and how much to buy."] },
  { when: "biz", path: "/negocio/dinero?tab=futuro", targets: ['[data-tour="futuro"]'], title: ["¿Y si…?", "What if…?"], text: ["Prueba qué pasaría si vendes más, cobras un poco más o gastas menos, y mira cuánto ganarías en un mes o en un año.", "Try what would happen if you sell more, charge a bit more or spend less, and see what you'd earn in a month or a year."] },
  { when: "biz", path: "/negocio/metas", targets: ["main h1"], title: ["Metas y sugerencias", "Goals and suggestions"], text: ["Ahorra para equipo nuevo, mercancía o tu propio local. Te sugerimos cuánto apartar, y abajo hay consejos hechos para tu negocio.", "Save for new equipment, stock or your own place. We suggest how much to set aside, and below are tips made for your business."] },
  { when: "biz", path: "/negocio/aprender", targets: ['[data-tour="aprender"]'], title: ["Aprender para tu negocio", "Learn for your business"], text: ["Juegos y lecciones para poner buenos precios, y lugares que te ayudan gratis con permisos y préstamos.", "Games and lessons on good prices, and places that help you for free with permits and loans."] },
  { path: "/casita", targets: ['[data-tour="perfil"]', '[data-tour="perfil-phone"]'], title: ["Tu perfil", "Your profile"], text: ["Toca tu foto para elegir un animal de México, cambiar tu nombre, tu clave o dónde vives. Dónde vives decide tus impuestos y si tu dinero se ve en dólares o pesos.", "Tap your picture to pick an animal from Mexico, change your name, PIN or where you live. Where you live decides your taxes and whether money shows in dollars or pesos."] },
  { path: "/casita", targets: ['[data-tour="como"]', '[data-tour="escuchar"]'], title: ["Siempre hay ayuda", "Help is always here"], text: ["En cada pantalla, toca “¿Cómo se usa?” para ver los pasos, o la bocina para que te lo lea en voz alta.", "On every screen, tap “How does this work?” to see the steps, or the speaker to hear it aloud."] },
  { path: "/casita", title: ["¡Listo! Ya sabes usar Mi Camino", "Done! You know how to use Mi Camino"], text: ["Ahora empieza con tu primer paso: anota tu salario. Te esperan tus primeros pasos en la pantalla de inicio.", "Now start with your first step: add your salary. Your first steps are waiting on the home screen."] },
];

/** True when the element can't be scrolled into place (bottom bar, sidebar, sticky headers). */
function pinned(el: Element) {
  for (let n: Element | null = el; n && n !== document.body; n = n.parentElement) {
    const p = getComputedStyle(n).position;
    if (p === "fixed" || p === "sticky") return true;
  }
  return false;
}

type Box = { top: number; left: number; width: number; height: number };

function visible(el: Element) {
  const r = el.getBoundingClientRect();
  const st = getComputedStyle(el);
  return r.width > 0 && r.height > 0 && st.visibility !== "hidden" && st.display !== "none";
}

export function GuidedTour() {
  const lang = useLang();
  const en = lang === "en";
  const me = useMe();
  const router = useRouter();
  const path = usePathname();
  const voiceOn = useStore((s) => s.voiceOn);
  const setVoiceOn = useStore((s) => s.setVoiceOn);
  const textBig = useStore((s) => s.textBig);
  const setTextBig = useStore((s) => s.setTextBig);
  const setTouring = useStore((s) => s.setTouring);
  const updateProfile = useStore((s) => s.updateProfile);
  const current = useStore((s) => s.current);
  const [steps] = useState(() => STEPS.filter((st) => !st.when || (st.when === "biz") === !!me?.business));
  const [i, setI] = useState(0);
  const [rect, setRect] = useState<Box | null>(null);
  const [cardOnTop, setCardOnTop] = useState(false);
  const targetRef = useRef<Element | null>(null);
  const cardRef = useRef<HTMLDivElement | null>(null);
  const step = steps[i];
  const L = (p: [string, string]) => (en ? p[1] : p[0]);
  const name = me?.profile.name.split(" ")[0];

  useEffect(() => { setTouring(true); return () => setTouring(false); }, [setTouring]);

  // Go to the step's screen
  useEffect(() => {
    if (!step.path) return;
    const want = step.path.split("?")[0];
    if (path !== want || step.path.includes("?")) router.push(step.path);
  }, [i]); // eslint-disable-line react-hooks/exhaustive-deps

  // Find and light up the part being explained.
  // The card and the lit-up part never cover each other: the card sits at the bottom
  // and the part is scrolled into the free space above it; parts that can't scroll
  // (the bottom bar, the sidebar) get the card on the opposite side. Parts taller than
  // the free space are lit from their top down to the card.
  const layout = useCallback(() => {
    const el = targetRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const vh = window.innerHeight;
    const header = window.innerWidth < 768 ? 72 : 16;
    const cardH = cardRef.current?.offsetHeight ?? 320;
    const onTop = (pinned(el) && r.top + r.height / 2 > vh / 2) || (!pinned(el) && r.top > vh - cardH - 64);
    const freeTop = onTop ? cardH + 24 : header;
    const freeBottom = onTop ? vh - 8 : vh - cardH - 24;
    const top = Math.max(r.top, freeTop);
    const bottom = Math.min(r.bottom, freeBottom);
    setCardOnTop(onTop);
    setRect({ top, left: r.left, width: r.width, height: Math.max(bottom - top, Math.min(r.height, 56)) });
  }, []);

  useResetOn(i, () => setRect(null));
  useEffect(() => {
    targetRef.current = null;
    if (!step.targets) return;
    let tries = 0, stop = false;
    const find = () => {
      if (stop) return;
      for (const sel of step.targets!) {
        const el = Array.from(document.querySelectorAll(sel)).find(visible);
        if (el) {
          targetRef.current = el;
          if (!pinned(el)) {
            // Put the part in the free space above the card: centered if it fits, else from its top
            const r = el.getBoundingClientRect();
            const header = window.innerWidth < 768 ? 72 : 16;
            const free = window.innerHeight - (cardRef.current?.offsetHeight ?? 320) - 24 - header;
            const want = header + Math.max(12, (free - r.height) / 2);
            window.scrollBy({ top: r.top - want, behavior: "instant" as ScrollBehavior });
          }
          setTimeout(() => !stop && layout(), 60);
          return;
        }
      }
      if (tries++ < 30) setTimeout(find, 150);
    };
    setTimeout(find, 250);
    return () => { stop = true; };
  }, [i, path]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    window.addEventListener("resize", layout);
    window.addEventListener("scroll", layout, true);
    return () => { window.removeEventListener("resize", layout); window.removeEventListener("scroll", layout, true); };
  }, [layout]);

  const sayStep = useCallback(() => {
    const t = step.setup === "welcome" ? `${L(step.title)}${name ? `, ${name}` : ""}. ${L(step.text)}` : `${L(step.title)}. ${L(step.text)}`;
    speak(t, lang);
  }, [i, lang, name]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!voiceOn) return;
    const id = setTimeout(sayStep, 500);
    return () => clearTimeout(id);
  }, [i, voiceOn, sayStep]);

  const finish = () => {
    stopSpeaking();
    playGoal();
    updateProfile({ tourDone: true });
    setTouring(false);
    router.push("/casita");
  };
  const next = () => (i < steps.length - 1 ? setI(i + 1) : finish());
  const back = () => i > 0 && setI(i - 1);

  const pad = 8;
  const isDemo = current === DEMO_PHONE;

  return (
    <div className="fixed inset-0 z-[80]" role="dialog" aria-modal="true" aria-label={en ? "Guided tour" : "Recorrido guiado"}>
      {/* dim everything except the lit-up part */}
      {rect ? (
        <div
          className="pointer-events-none fixed rounded-3xl ring-4 ring-sun transition-all duration-300"
          style={{ top: rect.top - pad, left: rect.left - pad, width: rect.width + pad * 2, height: rect.height + pad * 2, boxShadow: "0 0 0 9999px rgba(20,28,25,0.72)" }}
        />
      ) : (
        <div className="fixed inset-0 bg-[rgba(20,28,25,0.72)]" />
      )}
      {/* block taps on the app while touring */}
      <div className="fixed inset-0" />

      <div className={cx("fixed inset-x-0 mx-auto w-full max-w-xl px-3", rect && cardOnTop ? "top-3" : "bottom-3")}>
        <div ref={cardRef} className="max-h-[62dvh] overflow-y-auto rounded-[2rem] bg-paper p-4 shadow-2xl sm:p-5 md:p-6">
          <div className="flex items-center justify-between gap-3">
            <p className="text-base font-extrabold text-clay">{en ? `Step ${i + 1} of ${steps.length}` : `Paso ${i + 1} de ${steps.length}`}</p>
            <ListenButton compact text={step.setup === "welcome" ? `${L(step.title)}. ${L(step.text)}` : `${L(step.title)}. ${L(step.text)}`} />
          </div>
          <div className="mt-2 flex gap-1" aria-hidden>
            {steps.map((_, k) => <span key={k} className={cx("h-2 flex-1 rounded-full", k <= i ? "bg-clay" : "bg-sand")} />)}
          </div>
          <h2 className="mt-2 text-[1.4rem] leading-tight font-semibold sm:mt-3 sm:text-[1.6rem]">{L(step.title)}{step.setup === "welcome" && name ? <><br />{name} 👋</> : null}</h2>
          <p className="mt-1.5 text-lg leading-snug sm:mt-2 sm:text-xl">{L(step.text)}</p>

          {step.setup === "welcome" && (
            <div className="mt-4 space-y-3">
              <p className="text-lg font-bold">{en ? "Should I read things aloud to you?" : "¿Quieres que te lea en voz alta?"}</p>
              <div className="grid grid-cols-2 gap-2">
                <button onClick={() => { setVoiceOn(true); setTimeout(sayStep, 50); }} aria-pressed={voiceOn} className={cx("flex min-h-14 items-center justify-center gap-2 rounded-2xl border-2 text-lg font-bold", voiceOn ? "border-leaf bg-leaf text-paper" : "border-sand")}><Volume2 size={22} /> {en ? "Yes" : "Sí"}</button>
                <button onClick={() => { stopSpeaking(); setVoiceOn(false); }} aria-pressed={!voiceOn} className={cx("flex min-h-14 items-center justify-center gap-2 rounded-2xl border-2 text-lg font-bold", !voiceOn ? "border-ink bg-ink text-paper" : "border-sand")}><VolumeX size={22} /> {en ? "No, I'll read" : "No, yo leo"}</button>
              </div>
              <p className="text-lg font-bold">{en ? "How do you see the letters best?" : "¿Cómo ves mejor las letras?"}</p>
              <div className="grid grid-cols-2 gap-2">
                <button onClick={() => setTextBig(false)} aria-pressed={!textBig} className={cx("min-h-14 rounded-2xl border-2 text-lg font-bold", !textBig ? "border-ink bg-ink text-paper" : "border-sand")}>{en ? "Normal" : "Normal"}</button>
                <button onClick={() => setTextBig(true)} aria-pressed={textBig} className={cx("min-h-14 rounded-2xl border-2 text-2xl font-extrabold", textBig ? "border-ink bg-ink text-paper" : "border-sand")}>{en ? "Bigger" : "Más grande"}</button>
              </div>
            </div>
          )}

          <div className="mt-4 flex gap-3 sm:mt-5">
            {i > 0 && (
              <button onClick={back} className="flex min-h-14 items-center justify-center gap-2 rounded-2xl border-2 border-sand px-5 text-lg font-bold"><ArrowLeft size={22} /> {en ? "Back" : "Atrás"}</button>
            )}
            <button onClick={next} className="flex min-h-14 flex-1 items-center justify-center gap-2 rounded-2xl bg-clay text-xl font-extrabold text-paper shadow-[0_4px_0_#8f3a20] active:translate-y-0.5">
              {i < steps.length - 1 ? <>{en ? "Next" : "Siguiente"} <ArrowRight size={24} /></> : <><Check size={24} /> {en ? "Start using Mi Camino" : "Empezar a usar Mi Camino"}</>}
            </button>
          </div>
          {isDemo && i < steps.length - 1 && (
            <button onClick={finish} className="mt-2 w-full text-center text-sm font-bold text-muted underline underline-offset-4">{en ? "Skip tour (example account only)" : "Saltar recorrido (solo en la cuenta de ejemplo)"}</button>
          )}
        </div>
      </div>
    </div>
  );
}
