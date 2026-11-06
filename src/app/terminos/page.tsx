"use client";
// Términos y condiciones / Terms of use. Plain-language summary first, then the full terms.
// The Spanish version prevails if the two versions differ (section "General terms").
// If what the app does changes, update these texts and LEGAL.version in src/lib/legal.ts.
import Link from "next/link";
import { LegalPage, type LegalDoc } from "@/components/LegalPage";

const privEs = <Link className="font-bold text-clay underline" href="/privacidad">Aviso de privacidad</Link>;
const privEn = <Link className="font-bold text-clay underline" href="/privacidad">Privacy notice</Link>;
const List = ({ items }: { items: React.ReactNode[] }) => <ul className="list-disc space-y-1.5 pl-6">{items.map((x, i) => <li key={i}>{x}</li>)}</ul>;

const es: LegalDoc = {
  title: "Términos y condiciones",
  summaryTitle: "Lo importante, en pocas palabras",
  summary: [
    "Mi Camino es gratis y está en beta: puede tener errores, fallar por ratos y cambiar.",
    "Es una herramienta para aprender y organizar tu dinero. No es un banco, no maneja tu dinero y no da asesoría financiera, de impuestos, legal ni migratoria.",
    "Los impuestos, el tipo de cambio y las sugerencias son aproximados. Tú decides qué hacer; para decisiones importantes, consulta a un profesional.",
    "La inteligencia artificial puede equivocarse: revisa siempre lo que anota antes de guardarlo.",
    "Cuida tu clave. Si usas la app para dañar a otros o romper la ley, podemos cerrar tu cuenta.",
    "Nada en estos términos te quita los derechos que la ley te da como consumidor.",
  ],
  sections: [
    {
      title: "Qué es Mi Camino y quién puede usarlo",
      body: (
        <>
          <p>Mi Camino (“la app”) es una herramienta gratuita de educación financiera para anotar lo que ganas y gastas, ahorrar para tus metas, llevar tu tanda y entender tu negocio. Es un proyecto independiente en versión beta. En estos términos, “nosotros” se refiere al proyecto Mi Camino y a las personas que lo crean, mantienen y colaboran con él.</p>
          <p>Al crear una cuenta o usar la app, aceptas estos términos y el {privEs}. Si no estás de acuerdo, no uses la app.</p>
          <p>Debes tener 13 años o más. Si tienes entre 13 y 17 años, necesitas el permiso de tu mamá, papá o tutor, y esa persona acepta estos términos por ti y es responsable de cómo usas la app. Mi Camino no es para menores de 13 años.</p>
          <p>Mi Camino no es un servicio oficial del Gobierno de México, de la Secretaría de Relaciones Exteriores ni de ningún Consulado, ni de ningún gobierno de Estados Unidos, salvo que la app lo diga expresamente.</p>
        </>
      ),
    },
    {
      title: "Versión beta y disponibilidad",
      body: <p>Mi Camino está en prueba. Puede tener errores, puede dejar de funcionar por ratos, y podemos cambiar, agregar, limitar o quitar funciones en cualquier momento. Puede haber pérdida de información por fallas técnicas: te recomendamos descargar tus datos de vez en cuando (Mi perfil → Descargar mis datos) y no depender solo de Mi Camino para registros importantes. Te avisaremos dentro de la app de los cambios importantes.</p>,
    },
    {
      title: "No es asesoría profesional",
      body: (
        <>
          <p>Todo lo que muestra Mi Camino es información general y educativa. No es asesoría financiera, de inversión, de crédito, de impuestos, contable, legal ni migratoria, y usar la app no crea ninguna relación de asesor, abogado, contador o representante contigo.</p>
          <List items={[
            "Los impuestos son un cálculo aproximado con tasas públicas del año, para una persona con un solo trabajo y sin créditos ni deducciones especiales. Las leyes cambian. Tu talón de pago, tu recibo de nómina o tu declaración tienen la cantidad real.",
            "El tipo de cambio, las comisiones y la comparación para enviar dinero son aproximados y pueden cambiar en cualquier momento. Confirma siempre con la empresa antes de enviar.",
            "“Explicar un papel” te ayuda a entender un documento y a detectar señales de estafa, pero puede equivocarse y no garantiza que algo sea o no una estafa. No sustituye a un abogado.",
            "Las sugerencias para tus metas, tu ahorro y tu negocio son ideas generales que no conocen toda tu situación.",
          ]} />
          <p>Tú eres responsable de las decisiones que tomes. Antes de una decisión importante (firmar un contrato, pedir un préstamo, declarar impuestos, hacer un trámite migratorio), consulta a un profesional autorizado.</p>
        </>
      ),
    },
    {
      title: "Mi Camino no maneja tu dinero",
      body: <p>Mi Camino no es un banco, una casa de cambio, un transmisor de dinero ni un prestamista. No guarda, recibe, envía ni mueve dinero, no hace pagos, no da préstamos y no administra tandas: lo que anotas son solo notas para ti. Las empresas, programas y organizaciones que mencionamos (por ejemplo, para enviar dinero o pedir ayuda) son de terceros; no las controlamos, no respondemos por sus servicios y mencionarlas no significa que las recomendemos ni que tengamos una relación con ellas.</p>,
    },
    {
      title: "Inteligencia artificial",
      body: <p>Algunas funciones usan inteligencia artificial para entender lo que dices, escribes o fotografías y para explicar documentos. Sus respuestas pueden ser incompletas o incorrectas. Por eso siempre te mostramos lo que entendió antes de guardarlo: revísalo y corrígelo. No uses las respuestas de la inteligencia artificial como única base para una decisión importante.</p>,
    },
    {
      title: "Tu cuenta y tu clave",
      body: (
        <List items={[
          "Usa tu propio número de teléfono y da información verdadera.",
          "Tu clave es solo tuya. No la compartas: Mi Camino nunca te la va a pedir por mensaje, llamada o correo. Eres responsable de lo que pase en tu cuenta si compartes tu clave o dejas tu sesión abierta en un aparato que usan otras personas.",
          "Si crees que alguien entró a tu cuenta, cambia tu clave en Mi perfil de inmediato.",
          "Eres responsable de lo que anotas y de los documentos que subes. Solo sube documentos tuyos o que tengas permiso de compartir, y tapa números de cuenta o identificación que no sean necesarios.",
        ]} />
      ),
    },
    {
      title: "Uso permitido",
      body: (
        <>
          <p>Puedes usar Mi Camino para tu uso personal, familiar o para tu pequeño negocio. No puedes:</p>
          <List items={[
            "Intentar entrar a cuentas de otras personas, adivinar claves o saltarte, probar o dañar las protecciones de la app.",
            "Copiar, descompilar o extraer el código o los datos de la app de forma automática, salvo lo que la ley permita.",
            "Usar programas automáticos para mandar muchas peticiones, sobrecargar la app o abusar de la inteligencia artificial o de la voz.",
            "Subir virus, contenido ilegal, o datos o documentos de otras personas sin su permiso.",
            "Hacerte pasar por otra persona o usar Mi Camino para engañar, estafar, acosar o dañar a alguien.",
            "Revender o presentar Mi Camino como un servicio tuyo.",
          ]} />
          <p>Si encuentras una falla de seguridad, repórtala de forma privada y no la aproveches.</p>
        </>
      ),
    },
    {
      title: "Tus datos y nuestro contenido",
      body: (
        <>
          <p>Lo que anotas es tuyo. Nos das permiso de guardarlo y procesarlo solo para darte el servicio, como se explica en el {privEs}. Puedes descargarlo o borrarlo cuando quieras desde Mi perfil.</p>
          <p>La app, su código, diseño, textos, juegos, lecciones y dibujos son del proyecto Mi Camino o de sus autores. Te damos un permiso personal, gratuito, no exclusivo y revocable para usarla según estos términos; no te transferimos ningún otro derecho. Si nos das sugerencias o ideas, podemos usarlas libremente para mejorar la app, sin obligación de pagarte.</p>
        </>
      ),
    },
    {
      title: "Sin garantías",
      body: <p>En la medida máxima que permita la ley, Mi Camino se ofrece gratis, “tal como está” y “según esté disponible”, sin garantías de ningún tipo, ni expresas ni implícitas, incluyendo garantías de que funcione sin interrupciones o sin errores, de que los cálculos sean exactos, o de que sirva para un fin en particular. Esto no limita las garantías que la ley de tu país no permite excluir.</p>,
    },
    {
      title: "Límite de responsabilidad",
      body: (
        <>
          <p>En la medida máxima que permita la ley, ni el proyecto Mi Camino ni las personas que lo crean, mantienen o colaboran con él serán responsables de:</p>
          <List items={[
            "daños indirectos, incidentales, especiales o consecuentes, ni de ganancias, ahorros o datos perdidos;",
            "decisiones que tomes con base en la información, los cálculos o las sugerencias de la app;",
            "lo que hagan o dejen de hacer bancos, empresas de envío, organizaciones, autoridades u otras personas, incluidas las tandas en las que participes;",
            "fallas de internet, de tu aparato o de los proveedores de servicios, o accesos a tu cuenta causados por compartir tu clave.",
          ]} />
          <p>Como Mi Camino es gratis, en la medida que la ley lo permita, la responsabilidad total por cualquier reclamo relacionado con la app no será mayor a 50 dólares de Estados Unidos (o su equivalente en pesos mexicanos).</p>
          <p>Nada de esto limita la responsabilidad que por ley no se puede limitar, como la que surja de dolo, mala fe o negligencia grave, ni los derechos que te dan las leyes de protección al consumidor de tu país.</p>
        </>
      ),
    },
    {
      title: "Indemnización",
      body: <p>Si usas Mi Camino violando estos términos o la ley, o subes contenido que no tienes derecho a compartir, y por eso alguien hace un reclamo contra el proyecto o contra las personas que lo crean, mantienen o colaboran con él, aceptas responder por ese reclamo y cubrir los daños y gastos razonables que cause, en la medida que la ley lo permita.</p>,
    },
    {
      title: "Suspensión y terminación",
      body: <p>Puedes dejar de usar Mi Camino y borrar tu cuenta cuando quieras. Podemos limitar, suspender o cerrar una cuenta que viole estos términos, ponga en riesgo a otras personas o a la app, o cuando la ley lo exija. Si decidimos terminar el proyecto, te avisaremos con anticipación razonable dentro de la app para que puedas descargar tus datos. Las secciones sobre contenido, sin garantías, límite de responsabilidad, indemnización y ley aplicable siguen vigentes después de que termines de usar la app.</p>,
    },
    {
      title: "No es para emergencias",
      body: <p>Mi Camino no es un servicio de emergencias. Si estás en peligro, llama al 911 (en Estados Unidos y en México).</p>,
    },
    {
      title: "Cambios a estos términos",
      body: <p>Podemos cambiar estos términos, sobre todo mientras la app está en beta. La fecha de arriba dice cuándo cambiaron por última vez. Si el cambio es importante, te lo diremos dentro de la app y te pediremos aceptarlo otra vez antes de seguir usándola. Si no estás de acuerdo con los cambios, puedes dejar de usar la app y borrar tu cuenta.</p>,
    },
    {
      title: "Ley aplicable y quejas",
      body: (
        <>
          <p>Estos términos se rigen por las leyes del Estado de Nueva York, Estados Unidos, sin aplicar sus reglas de conflicto de leyes. Si tenemos un desacuerdo, primero intentaremos resolverlo de buena fe. Cualquier disputa se resolverá en los tribunales competentes del condado de Nueva York, salvo que la ley del lugar donde vives te dé derecho a presentarla allí.</p>
          <p>Nada de esto te quita los derechos que te dan las leyes de tu país, ni tu derecho a acudir a las autoridades de protección al consumidor (por ejemplo, Profeco o Condusef en México, o la Fiscalía General de tu estado en Estados Unidos).</p>
        </>
      ),
    },
    {
      title: "Disposiciones generales",
      body: (
        <List items={[
          "Estos términos y el Aviso de privacidad son el acuerdo completo entre tú y Mi Camino sobre el uso de la app.",
          "Si una parte de estos términos no fuera válida, el resto sigue vigente, y esa parte se aplicará en la mayor medida que la ley permita.",
          "Si no exigimos alguna parte de estos términos en un momento, no significa que renunciemos a ella.",
          "Podemos transferir estos términos a una organización o empresa que continúe el proyecto; tus derechos seguirán siendo los mismos. Tú no puedes transferir tu cuenta a otra persona.",
          "No somos responsables por retrasos o fallas causados por situaciones fuera de nuestro control razonable (por ejemplo, desastres, cortes de internet o fallas de proveedores).",
          "Estos términos están en español y en inglés. Si hay diferencias, vale la versión en español.",
          "Aceptas estos términos de forma electrónica, al marcar la casilla al crear tu cuenta o al aceptar una nueva versión dentro de la app.",
        ]} />
      ),
    },
  ],
};

const en: LegalDoc = {
  title: "Terms of use",
  summaryTitle: "The short version",
  summary: [
    "Mi Camino is free and in beta: it may have mistakes, stop working at times, and change.",
    "It's a tool to learn about and organize your money. It isn't a bank, doesn't handle your money, and doesn't give financial, tax, legal or immigration advice.",
    "Taxes, exchange rates and suggestions are estimates. You decide what to do; for important decisions, talk to a professional.",
    "Artificial intelligence can make mistakes: always check what it writes down before saving.",
    "Keep your PIN safe. If you use the app to harm others or break the law, we can close your account.",
    "Nothing in these terms takes away the rights the law gives you as a consumer.",
  ],
  sections: [
    {
      title: "What Mi Camino is and who can use it",
      body: (
        <>
          <p>Mi Camino (“the app”) is a free financial education tool to write down what you earn and spend, save for goals, keep track of your tanda and understand your business. It is an independent project in beta. In these terms, “we” means the Mi Camino project and the people who create, maintain and contribute to it.</p>
          <p>By creating an account or using the app, you accept these terms and the {privEn}. If you don’t agree, don’t use the app.</p>
          <p>You must be 13 or older. If you are 13 to 17, you need permission from your mother, father or guardian, who accepts these terms for you and is responsible for how you use the app. Mi Camino is not for children under 13.</p>
          <p>Mi Camino is not an official service of the Government of Mexico, the Ministry of Foreign Affairs, any Consulate, or any US government, unless the app expressly says so.</p>
        </>
      ),
    },
    {
      title: "Beta version and availability",
      body: <p>Mi Camino is being tested. It may have mistakes, may stop working at times, and we may change, add, limit or remove features at any time. Information may be lost because of technical failures: we recommend downloading your data from time to time (My profile → Download my data) and not relying only on Mi Camino for important records. We’ll tell you about important changes inside the app.</p>,
    },
    {
      title: "Not professional advice",
      body: (
        <>
          <p>Everything Mi Camino shows is general, educational information. It is not financial, investment, credit, tax, accounting, legal or immigration advice, and using the app doesn’t create any adviser, lawyer, accountant or representative relationship with you.</p>
          <List items={[
            "Taxes are an estimate using the year’s public rates, for a person with one job and no special credits or deductions. Laws change. Your paystub, payslip or tax return has the real amount.",
            "Exchange rates, fees and the money-transfer comparison are estimates and may change at any time. Always confirm with the company before sending.",
            "“Explain a paper” helps you understand a document and spot signs of a scam, but it can be wrong and can’t guarantee whether something is a scam. It doesn’t replace a lawyer.",
            "Suggestions for your goals, savings and business are general ideas that don’t know your whole situation.",
          ]} />
          <p>You are responsible for the decisions you make. Before an important decision (signing a contract, taking a loan, filing taxes, an immigration matter), talk to a licensed professional.</p>
        </>
      ),
    },
    {
      title: "Mi Camino doesn’t handle your money",
      body: <p>Mi Camino is not a bank, currency exchange, money transmitter or lender. It doesn’t hold, receive, send or move money, make payments, give loans or run tandas: what you write down is just notes for you. The companies, programs and organizations we mention (for example, to send money or get help) are third parties; we don’t control them, aren’t responsible for their services, and mentioning them isn’t an endorsement or a sign of any relationship with them.</p>,
    },
    {
      title: "Artificial intelligence",
      body: <p>Some features use artificial intelligence to understand what you say, type or photograph and to explain documents. Its answers may be incomplete or wrong. That’s why we always show you what it understood before saving: check it and fix it. Don’t use AI answers as the only basis for an important decision.</p>,
    },
    {
      title: "Your account and PIN",
      body: (
        <List items={[
          "Use your own phone number and give true information.",
          "Your PIN is yours alone. Don’t share it: Mi Camino will never ask for it by text, call or email. You are responsible for what happens in your account if you share your PIN or leave yourself signed in on a device others use.",
          "If you think someone got into your account, change your PIN in My profile right away.",
          "You are responsible for what you write down and the documents you upload. Only upload your own documents or ones you have permission to share, and cover account or ID numbers that aren’t needed.",
        ]} />
      ),
    },
    {
      title: "Allowed use",
      body: (
        <>
          <p>You may use Mi Camino for personal or family use, or for your small business. You may not:</p>
          <List items={[
            "Try to get into other people’s accounts, guess PINs, or get around, probe or damage the app’s protections.",
            "Copy, decompile or automatically extract the app’s code or data, except as the law allows.",
            "Use automated programs to send many requests, overload the app or abuse the artificial intelligence or voice features.",
            "Upload viruses, illegal content, or other people’s data or documents without their permission.",
            "Impersonate someone or use Mi Camino to deceive, scam, harass or harm anyone.",
            "Resell Mi Camino or present it as your own service.",
          ]} />
          <p>If you find a security problem, report it privately and don’t take advantage of it.</p>
        </>
      ),
    },
    {
      title: "Your data and our content",
      body: (
        <>
          <p>What you write down is yours. You allow us to store and process it only to provide the service, as explained in the {privEn}. You can download or delete it any time from My profile.</p>
          <p>The app, its code, design, texts, games, lessons and drawings belong to the Mi Camino project or their authors. We give you a personal, free, non-exclusive, revocable permission to use it under these terms; no other rights are transferred to you. If you give us suggestions or ideas, we may use them freely to improve the app, with no obligation to pay you.</p>
        </>
      ),
    },
    {
      title: "No warranties",
      body: <p>To the fullest extent the law allows, Mi Camino is offered free, “as is” and “as available”, without warranties of any kind, express or implied, including that it will work without interruptions or errors, that calculations are exact, or that it fits a particular purpose. This doesn’t limit warranties that the law of your country doesn’t allow to be excluded.</p>,
    },
    {
      title: "Limitation of liability",
      body: (
        <>
          <p>To the fullest extent the law allows, neither the Mi Camino project nor the people who create, maintain or contribute to it will be responsible for:</p>
          <List items={[
            "indirect, incidental, special or consequential damages, or lost profits, savings or data;",
            "decisions you make based on the app’s information, calculations or suggestions;",
            "what banks, transfer companies, organizations, authorities or other people do or fail to do, including tandas you take part in;",
            "failures of the internet, your device or service providers, or access to your account caused by sharing your PIN.",
          ]} />
          <p>Because Mi Camino is free, to the extent the law allows, total liability for any claim related to the app will not exceed 50 US dollars (or the equivalent in Mexican pesos).</p>
          <p>None of this limits liability that the law doesn’t allow to be limited, such as for fraud, bad faith or gross negligence, or the rights you have under the consumer protection laws of your country.</p>
        </>
      ),
    },
    {
      title: "Indemnity",
      body: <p>If you use Mi Camino in violation of these terms or the law, or upload content you have no right to share, and because of that someone makes a claim against the project or the people who create, maintain or contribute to it, you agree to answer for that claim and cover the reasonable damages and costs it causes, to the extent the law allows.</p>,
    },
    {
      title: "Suspension and ending",
      body: <p>You can stop using Mi Camino and delete your account at any time. We may limit, suspend or close an account that violates these terms, puts other people or the app at risk, or when the law requires it. If we decide to end the project, we’ll give reasonable notice inside the app so you can download your data. The sections on content, no warranties, limitation of liability, indemnity and governing law continue after you stop using the app.</p>,
    },
    {
      title: "Not for emergencies",
      body: <p>Mi Camino is not an emergency service. If you are in danger, call 911 (in the United States and in Mexico).</p>,
    },
    {
      title: "Changes to these terms",
      body: <p>We may change these terms, especially while the app is in beta. The date at the top shows when they last changed. If a change is important, we’ll tell you in the app and ask you to accept it again before you continue. If you don’t agree with the changes, you can stop using the app and delete your account.</p>,
    },
    {
      title: "Governing law and complaints",
      body: (
        <>
          <p>These terms are governed by the laws of the State of New York, United States, without applying its conflict-of-law rules. If we disagree, we’ll first try to resolve it in good faith. Any dispute will be resolved in the competent courts of New York County, unless the law where you live gives you the right to bring it there.</p>
          <p>None of this takes away the rights the laws of your country give you, or your right to go to consumer protection authorities (for example, Profeco or Condusef in Mexico, or your state Attorney General in the United States).</p>
        </>
      ),
    },
    {
      title: "General terms",
      body: (
        <List items={[
          "These terms and the Privacy notice are the whole agreement between you and Mi Camino about using the app.",
          "If part of these terms isn’t valid, the rest still applies, and that part will apply to the greatest extent the law allows.",
          "If we don’t enforce part of these terms at some point, that doesn’t mean we give it up.",
          "We may transfer these terms to an organization or company that continues the project; your rights stay the same. You can’t transfer your account to someone else.",
          "We aren’t responsible for delays or failures caused by situations outside our reasonable control (for example, disasters, internet outages or provider failures).",
          "These terms are in Spanish and English. If they differ, the Spanish version prevails.",
          "You accept these terms electronically, by checking the box when you create your account or by accepting a new version inside the app.",
        ]} />
      ),
    },
  ],
};

export default function Terminos() {
  return <LegalPage es={es} en={en} />;
}
