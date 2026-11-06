"use client";
// The guided tour: after creating an account, the app walks the person through
// every part, on the real screens, one step at a time. Each step lights up the
// part being explained and can be read aloud. The app can be used once the tour
// is finished (the example account can skip it for demos).
import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Check, Volume2, VolumeX } from "lucide-react";
import { DEMO_PHONE, useLang, useMe, useStore } from "@/lib/store";
import { speak, stopSpeaking } from "@/lib/voice";
import { playGoal } from "@/lib/sound";
import { ListenButton, cx } from "./ui";

type Step = { path?: string; targets?: string[]; title: [string, string]; text: [string, string]; setup?: "welcome" };

const STEPS: Step[] = [
  { path: "/casita", setup: "welcome", title: ["¡Te damos la bienvenida a Mi Camino!", "Welcome to Mi Camino!"], text: ["Te voy a enseñar a usarlo en unos 2 minutos. Solo toca el botón “Siguiente” cuando termines de leer.", "I'll show you how to use it in about 2 minutes. Just tap “Next” when you're done reading."] },
  { path: "/casita", targets: ['[data-tour="resumen"]'], title: ["Tu resumen", "Your summary"], text: ["Aquí ves de un vistazo cuánto dinero te queda esta semana, después de tus gastos.", "Here you see at a glance how much money you have left this week, after expenses."] },
  { path: "/casita", targets: ['[data-tour="anotar"]'], title: ["El botón más importante", "The most important button"], text: ["Con este botón + anotas todo: lo que ganas y lo que gastas. Puedes hablar, escribir o tomarle foto a tu recibo.", "With this + button you add everything: what you earn and what you spend. You can talk, type or take a photo of your receipt."] },
  { path: "/casita/anotar?tipo=gane", targets: ['[data-tour="salario"]'], title: ["Tu salario", "Your salary"], text: ["Aquí anotas cuánto te pagan en tu trabajo. Es lo primero que vas a hacer cuando terminemos.", "Here you add how much you get paid at work. It's the first thing you'll do when we finish."] },
  { path: "/casita/dinero", targets: ['[data-tour="pagos"]'], title: ["Tus pagos del mes", "Your monthly payments"], text: ["Aquí ves tu renta, luz y teléfono. Cuando pagues uno, toca “Ya lo pagué” y te decimos cuánto te falta.", "Here you see rent, light and phone. When you pay one, tap “I paid it” and we'll show what's left."] },
  { path: "/casita/metas", targets: ["main h1"], title: ["Tus metas", "Your goals"], text: ["Aquí ahorras para tus sueños: tu casa, emergencias o un viaje. Cada vez que apartas dinero, se pone un ladrillo.", "Here you save for your dreams: a home, emergencies or a trip. Each time you save, a brick goes up."] },
  { path: "/casita/tanda", targets: ["main h1"], title: ["Tu tanda", "Your tanda"], text: ["Si estás en una tanda, aquí llevas la cuenta de cuándo pagas y cuándo te toca.", "If you're in a tanda, here you keep track of when you pay and when it's your turn."] },
  { path: "/casita/enviar", targets: ['[data-tour="enviar"]'], title: ["Enviar dinero", "Send money"], text: ["Escribe cuántos dólares mandas y te decimos cuánto le llega a tu familia. También puedes comparar precios.", "Type how many dollars you send and we'll show how much your family gets. You can also compare prices."] },
  { path: "/casita/documentos", targets: ["main h1"], title: ["Explicar un papel", "Explain a paper"], text: ["¿Te llegó una carta o factura que no entiendes? Aquí te ayudamos a saber qué es y si parece estafa.", "Got a letter or bill you don't understand? Here we help you know what it is and if it looks like a scam."] },
  { path: "/aprender", targets: ['[data-tour="aprender"]'], title: ["Aprender", "Learn"], text: ["Juegos, lecciones que puedes escuchar, y teléfonos de lugares que te ayudan gratis.", "Games, lessons you can listen to, and phone numbers of places that help you for free."] },
  { path: "/casita", targets: ['[data-tour="modulos"]', '[data-tour="menu"]'], title: ["¿Tienes un negocio?", "Do you have a business?"], text: ["Aquí cambias a “Mi Negocio” para llevar tus ventas y gastos aparte. En el celular, está dentro de “Menú”, junto con todo lo demás.", "Here you switch to “My Business” to keep sales and costs apart. On a phone, it's inside “Menu”, with everything else."] },
  { path: "/casita", targets: ['[data-tour="como"]', '[data-tour="escuchar"]'], title: ["Siempre hay ayuda", "Help is always here"], text: ["En cada pantalla, toca “¿Cómo se usa?” para ver los pasos, o la bocina para que te lo lea en voz alta.", "On every screen, tap “How does this work?” to see the steps, or the speaker to hear it aloud."] },
  { path: "/casita", title: ["¡Listo! Ya sabes usar Mi Camino", "Done! You know how to use Mi Camino"], text: ["Ahora empieza con tu primer paso: anota tu salario. Te esperan tus primeros pasos en la pantalla de inicio.", "Now start with your first step: add your salary. Your first steps are waiting on the home screen."] },
];

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
  const [i, setI] = useState(0);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const targetRef = useRef<Element | null>(null);
  const step = STEPS[i];
  const L = (p: [string, string]) => (en ? p[1] : p[0]);
  const name = me?.profile.name.split(" ")[0];

  useEffect(() => { setTouring(true); return () => setTouring(false); }, [setTouring]);

  // Go to the step's screen
  useEffect(() => {
    if (!step.path) return;
    const want = step.path.split("?")[0];
    if (path !== want) router.push(step.path);
  }, [i]); // eslint-disable-line react-hooks/exhaustive-deps

  // Find and light up the part being explained
  useEffect(() => {
    setRect(null); targetRef.current = null;
    if (!step.targets) return;
    let tries = 0, stop = false;
    const find = () => {
      if (stop) return;
      for (const sel of step.targets!) {
        const el = Array.from(document.querySelectorAll(sel)).find(visible);
        if (el) {
          targetRef.current = el;
          const tall = el.getBoundingClientRect().height > window.innerHeight * 0.45;
          el.scrollIntoView({ block: tall ? "start" : "center", behavior: "instant" as ScrollBehavior });
          if (tall) window.scrollBy({ top: -90, behavior: "instant" as ScrollBehavior });
          setTimeout(() => !stop && setRect(el.getBoundingClientRect()), 60);
          return;
        }
      }
      if (tries++ < 30) setTimeout(find, 150);
    };
    setTimeout(find, 250);
    return () => { stop = true; };
  }, [i, path]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const update = () => { if (targetRef.current) setRect(targetRef.current.getBoundingClientRect()); };
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    return () => { window.removeEventListener("resize", update); window.removeEventListener("scroll", update, true); };
  }, []);

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
  const next = () => (i < STEPS.length - 1 ? setI(i + 1) : finish());
  const back = () => i > 0 && setI(i - 1);

  // Where the card goes: away from the lit-up part
  const pad = 10;
  const below = rect ? Math.max(0, rect.top) + Math.min(rect.height, window.innerHeight) / 2 < window.innerHeight / 2 || rect.height > window.innerHeight * 0.45 : true;
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

      <div className={cx("fixed inset-x-0 mx-auto w-full max-w-xl px-3", rect && !below ? "top-3" : "bottom-3")}>
        <div className="rounded-[2rem] bg-paper p-5 shadow-2xl md:p-6">
          <div className="flex items-center justify-between gap-3">
            <p className="text-base font-extrabold text-clay">{en ? `Step ${i + 1} of ${STEPS.length}` : `Paso ${i + 1} de ${STEPS.length}`}</p>
            <ListenButton compact text={step.setup === "welcome" ? `${L(step.title)}. ${L(step.text)}` : `${L(step.title)}. ${L(step.text)}`} />
          </div>
          <div className="mt-2 flex gap-1" aria-hidden>
            {STEPS.map((_, k) => <span key={k} className={cx("h-2 flex-1 rounded-full", k <= i ? "bg-clay" : "bg-sand")} />)}
          </div>
          <h2 className="mt-3 text-[1.6rem] leading-tight font-semibold">{L(step.title)}{step.setup === "welcome" && name ? <><br />{name} 👋</> : null}</h2>
          <p className="mt-2 text-xl leading-snug">{L(step.text)}</p>

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

          <div className="mt-5 flex gap-3">
            {i > 0 && (
              <button onClick={back} className="flex min-h-16 items-center justify-center gap-2 rounded-2xl border-2 border-sand px-5 text-lg font-bold"><ArrowLeft size={22} /> {en ? "Back" : "Atrás"}</button>
            )}
            <button onClick={next} className="flex min-h-16 flex-1 items-center justify-center gap-2 rounded-2xl bg-clay text-xl font-extrabold text-paper shadow-[0_4px_0_#8f3a20] active:translate-y-0.5">
              {i < STEPS.length - 1 ? <>{en ? "Next" : "Siguiente"} <ArrowRight size={24} /></> : <><Check size={24} /> {en ? "Start using Mi Camino" : "Empezar a usar Mi Camino"}</>}
            </button>
          </div>
          {isDemo && i < STEPS.length - 1 && (
            <button onClick={finish} className="mt-3 w-full text-center text-base font-bold text-muted underline underline-offset-4">{en ? "Skip tour (example account only)" : "Saltar recorrido (solo en la cuenta de ejemplo)"}</button>
          )}
        </div>
      </div>
    </div>
  );
}
