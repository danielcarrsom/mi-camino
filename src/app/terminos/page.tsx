"use client";
// Términos y condiciones / Terms of use. Plain language first, then the details.
import Link from "next/link";
import { LegalPage, type LegalDoc } from "@/components/LegalPage";
import { LEGAL } from "@/lib/legal";

const mail = <a className="font-bold text-clay underline" href={`mailto:${LEGAL.email}`}>{LEGAL.email}</a>;
const privEs = <Link className="font-bold text-clay underline" href="/privacidad">Aviso de privacidad</Link>;
const privEn = <Link className="font-bold text-clay underline" href="/privacidad">Privacy notice</Link>;
const List = ({ items }: { items: React.ReactNode[] }) => <ul className="list-disc space-y-1.5 pl-6">{items.map((x, i) => <li key={i}>{x}</li>)}</ul>;

const es: LegalDoc = {
  title: "Términos y condiciones",
  summaryTitle: "Lo importante, en pocas palabras",
  summary: [
    "Mi Camino es gratis y está en beta: puede tener errores, y las funciones pueden cambiar o desaparecer.",
    "Es una herramienta para aprender y organizar tu dinero. No es un banco ni da asesoría financiera, de impuestos, legal ni migratoria.",
    "Los impuestos y el tipo de cambio que ves son aproximados. Para decisiones importantes, consulta a un profesional.",
    "La inteligencia artificial puede equivocarse: revisa lo que anota antes de guardarlo.",
    "Cuida tu clave y no la compartas.",
  ],
  sections: [
    {
      title: "Qué es Mi Camino",
      body: (
        <>
          <p>Mi Camino es una herramienta gratuita de educación financiera para anotar lo que ganas y gastas, ahorrar para tus metas, llevar tu tanda y entender tu negocio. La crea y opera {LEGAL.owner} ({LEGAL.city}). Al usarla aceptas estos términos y el {privEs}.</p>
          <p>Mi Camino no es un servicio oficial del Gobierno de México, de la Secretaría de Relaciones Exteriores ni de ningún Consulado.</p>
        </>
      ),
    },
    {
      title: "Versión beta",
      body: <p>Mi Camino está en versión beta, es decir, en prueba. Puede tener errores, puede dejar de funcionar por ratos, y podemos cambiar, agregar o quitar funciones. Te avisaremos dentro de la app de los cambios importantes. Te recomendamos no depender solo de Mi Camino para llevar cuentas importantes.</p>,
    },
    {
      title: "No es asesoría profesional",
      body: (
        <List items={[
          "Los impuestos son un cálculo aproximado con las tasas públicas del año, para una persona con un solo trabajo. Tu talón de pago, tu recibo de nómina o tu declaración tienen la cantidad real. Para ayuda con impuestos, busca ayuda gratuita (por ejemplo VITA en Estados Unidos o el SAT en México) o a un contador.",
          "El tipo de cambio y la comparación para enviar dinero son aproximados. Confirma siempre con la empresa antes de enviar.",
          "“Explicar un papel” te ayuda a entender un documento y a detectar señales de estafa, pero no es asesoría legal ni garantiza que algo sea o no una estafa. Para temas legales o migratorios, habla con un abogado o una organización autorizada.",
          "Las sugerencias para tus metas y tu negocio son ideas generales, no recomendaciones de inversión.",
        ]} />
      ),
    },
    {
      title: "Mi Camino no maneja tu dinero",
      body: <p>Mi Camino no es un banco, no guarda ni mueve dinero, no hace pagos y no da préstamos. Lo que anotas son solo notas para ti.</p>,
    },
    {
      title: "Tu cuenta",
      body: (
        <List items={[
          "Debes tener 13 años o más. Si tienes entre 13 y 17, necesitas permiso de tu mamá, papá o tutor.",
          "Usa tu propio número de teléfono y una clave que solo tú sepas. No la compartas con nadie: Mi Camino nunca te la va a pedir por mensaje o llamada.",
          "Eres responsable de lo que anotas en tu cuenta.",
          "Si crees que alguien entró a tu cuenta, cambia tu clave en Mi perfil y escríbenos.",
        ]} />
      ),
    },
    {
      title: "Uso permitido",
      body: (
        <>
          <p>No puedes:</p>
          <List items={[
            "Intentar entrar a cuentas de otras personas, adivinar claves o saltarte las protecciones de la app.",
            "Usar programas automáticos para mandar muchas peticiones o abusar de la inteligencia artificial o de la voz.",
            "Subir contenido ilegal, o documentos de otras personas sin su permiso.",
            "Usar Mi Camino para engañar o estafar a alguien.",
          ]} />
          <p>Podemos limitar el uso o suspender cuentas que hagan esto, para proteger a todos.</p>
        </>
      ),
    },
    {
      title: "Inteligencia artificial",
      body: <p>Algunas funciones usan inteligencia artificial para entender lo que dices, escribes o fotografías. Puede equivocarse: por eso siempre te mostramos lo que entendió antes de guardarlo. Revísalo y corrígelo si hace falta.</p>,
    },
    {
      title: "Tus datos y nuestro contenido",
      body: (
        <>
          <p>Lo que anotas es tuyo. Puedes descargarlo o borrarlo cuando quieras desde Mi perfil. Cómo usamos tus datos está en el {privEs}.</p>
          <p>El diseño, los textos, los juegos y los dibujos de Mi Camino son del proyecto. Los enlaces a otras organizaciones son de ellas, y no somos responsables de su contenido.</p>
        </>
      ),
    },
    {
      title: "Responsabilidad",
      body: <p>Mi Camino se ofrece gratis y “tal como está”, en versión beta. Hacemos nuestro mejor esfuerzo para que funcione bien y los cálculos sean correctos, pero, en la medida que la ley lo permita, no somos responsables de pérdidas o decisiones tomadas con base en la información de la app. Nada de esto quita los derechos que te dan las leyes de protección al consumidor de tu país.</p>,
    },
    {
      title: "Terminar",
      body: <p>Puedes dejar de usar Mi Camino y borrar tu cuenta cuando quieras. Si el proyecto termina, te avisaremos con anticipación para que puedas descargar tus datos.</p>,
    },
    {
      title: "Cambios a estos términos",
      body: <p>Podemos cambiar estos términos, sobre todo mientras estamos en beta. Si el cambio es importante, te lo diremos en la app y te pediremos aceptarlo otra vez.</p>,
    },
    {
      title: "Ley aplicable y contacto",
      body: <p>Estos términos se rigen por las leyes del Estado de Nueva York, Estados Unidos, sin quitarte los derechos que te den las leyes del lugar donde vives. Para cualquier duda o queja, escríbenos a {mail}.</p>,
    },
  ],
};

const en: LegalDoc = {
  title: "Terms of use",
  summaryTitle: "The short version",
  summary: [
    "Mi Camino is free and in beta: it may have mistakes, and features may change or go away.",
    "It’s a tool to learn about and organize your money. It is not a bank and does not give financial, tax, legal or immigration advice.",
    "The taxes and exchange rates you see are estimates. For important decisions, talk to a professional.",
    "Artificial intelligence can make mistakes: check what it writes down before saving.",
    "Keep your PIN safe and don’t share it.",
  ],
  sections: [
    {
      title: "What Mi Camino is",
      body: (
        <>
          <p>Mi Camino is a free financial education tool to write down what you earn and spend, save for goals, keep track of your tanda and understand your business. It is created and run by {LEGAL.owner} (New York, NY, United States). By using it you accept these terms and the {privEn}.</p>
          <p>Mi Camino is not an official service of the Government of Mexico, the Ministry of Foreign Affairs or any Consulate.</p>
        </>
      ),
    },
    {
      title: "Beta version",
      body: <p>Mi Camino is in beta, meaning it’s being tested. It may have mistakes, may stop working at times, and we may change, add or remove features. We’ll tell you about important changes inside the app. We recommend not relying only on Mi Camino for important records.</p>,
    },
    {
      title: "Not professional advice",
      body: (
        <List items={[
          "Taxes are an estimate using the year’s public rates, for a person with one job. Your paystub, payslip or tax return has the real amount. For help, look for free tax help (for example VITA in the US or the SAT in Mexico) or an accountant.",
          "Exchange rates and the money-transfer comparison are estimates. Always confirm with the company before sending.",
          "“Explain a paper” helps you understand a document and spot signs of a scam, but it is not legal advice and can’t guarantee whether something is a scam. For legal or immigration matters, talk to a lawyer or an authorized organization.",
          "Suggestions for your goals and business are general ideas, not investment recommendations.",
        ]} />
      ),
    },
    {
      title: "Mi Camino doesn’t handle your money",
      body: <p>Mi Camino is not a bank. It doesn’t hold or move money, make payments or give loans. What you write down is just notes for you.</p>,
    },
    {
      title: "Your account",
      body: (
        <List items={[
          "You must be 13 or older. If you are 13 to 17, you need permission from your mother, father or guardian.",
          "Use your own phone number and a PIN only you know. Don’t share it: Mi Camino will never ask for it by text or call.",
          "You are responsible for what you write down in your account.",
          "If you think someone got into your account, change your PIN in My profile and write to us.",
        ]} />
      ),
    },
    {
      title: "Allowed use",
      body: (
        <>
          <p>You may not:</p>
          <List items={[
            "Try to get into other people’s accounts, guess PINs or get around the app’s protections.",
            "Use automated programs to send many requests or abuse the artificial intelligence or voice features.",
            "Upload illegal content, or other people’s documents without their permission.",
            "Use Mi Camino to deceive or scam anyone.",
          ]} />
          <p>We may limit use or suspend accounts that do this, to protect everyone.</p>
        </>
      ),
    },
    {
      title: "Artificial intelligence",
      body: <p>Some features use artificial intelligence to understand what you say, type or photograph. It can make mistakes, which is why we always show you what it understood before saving. Check it and fix it if needed.</p>,
    },
    {
      title: "Your data and our content",
      body: (
        <>
          <p>What you write down is yours. You can download or delete it any time from My profile. How we use your data is in the {privEn}.</p>
          <p>Mi Camino’s design, texts, games and drawings belong to the project. Links to other organizations belong to them, and we aren’t responsible for their content.</p>
        </>
      ),
    },
    {
      title: "Responsibility",
      body: <p>Mi Camino is offered free and “as is”, in beta. We do our best for it to work well and for the calculations to be right, but, as far as the law allows, we are not responsible for losses or decisions made based on information in the app. None of this takes away rights you have under the consumer protection laws of your country.</p>,
    },
    {
      title: "Ending",
      body: <p>You can stop using Mi Camino and delete your account at any time. If the project ends, we’ll let you know in advance so you can download your data.</p>,
    },
    {
      title: "Changes to these terms",
      body: <p>We may change these terms, especially while in beta. If a change is important, we’ll tell you in the app and ask you to accept it again.</p>,
    },
    {
      title: "Governing law and contact",
      body: <p>These terms are governed by the laws of the State of New York, United States, without taking away rights given to you by the laws where you live. For any question or complaint, write to {mail}.</p>,
    },
  ],
};

export default function Terminos() {
  return <LegalPage es={es} en={en} />;
}
