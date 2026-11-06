"use client";
// Aviso de privacidad / Privacy notice. Plain language first, then the details.
// Keep it true to what the code does: if data handling changes, update this
// page and LEGAL.version in src/lib/legal.ts.
import { LegalPage, type LegalDoc } from "@/components/LegalPage";

const ext = (href: string, label: string) => <a className="font-bold text-clay underline" href={href} target="_blank" rel="noopener noreferrer">{label}</a>;
const List = ({ items }: { items: React.ReactNode[] }) => <ul className="list-disc space-y-1.5 pl-6">{items.map((x, i) => <li key={i}>{x}</li>)}</ul>;

const es: LegalDoc = {
  title: "Aviso de privacidad",
  summaryTitle: "Lo importante, en pocas palabras",
  summary: [
    "Mi Camino está en versión beta (de prueba): puede tener errores y puede cambiar.",
    "Nunca te pedimos estatus migratorio, número de Seguro Social, ITIN, ni números de cuenta o tarjeta.",
    "Guardamos lo que tú anotas (tu dinero, metas, tanda y negocio) para que lo veas en cualquier teléfono.",
    "No vendemos ni rentamos tus datos, y no hay anuncios.",
    "Las fotos, papeles y grabaciones de voz se usan para darte la respuesta y no las guardamos.",
    "Puedes descargar tus datos o borrar tu cuenta cuando quieras, desde Mi perfil.",
  ],
  sections: [
    {
      title: "Qué es Mi Camino",
      body: (
        <>
          <p>Mi Camino es un proyecto independiente en versión beta.</p>
          <p>Mi Camino <b>no es</b> un servicio oficial del Gobierno de México, de la Secretaría de Relaciones Exteriores ni de ningún Consulado, y no es un banco.</p>
        </>
      ),
    },
    {
      title: "Qué datos usamos",
      body: (
        <>
          <p><b>Los que tú nos das:</b></p>
          <List items={[
            "Tu nombre o apodo, tu número de teléfono y tu idioma.",
            "Tu clave de 6 números. Nunca la guardamos tal cual: solo guardamos una versión cifrada que no se puede regresar a tu clave.",
            "Dónde vives (México o el estado de Estados Unidos, y si vives en la Ciudad de Nueva York) y si haces tus impuestos con tu esposo(a). Lo usamos solo para calcular impuestos y mostrar tu dinero en dólares o pesos.",
            "Lo que anotas: tu salario, gastos, pagos fijos, metas, ahorros, tandas, y si tienes negocio, tus ventas, costos, productos e inventario.",
            "Tu pregunta de seguridad. La respuesta se guarda cifrada.",
            "La foto de perfil que eliges (un dibujo de un animal; no una foto tuya).",
          ]} />
          <p><b>Los que se generan al usar la app:</b> la fecha de cada intento de entrar o de recuperar tu clave, y la dirección de internet (IP) de los intentos de entrar, para proteger tu cuenta de quien quiera adivinar tu clave. Nuestros proveedores de alojamiento también guardan por poco tiempo registros técnicos normales (como la dirección IP) para operar y proteger el servicio.</p>
          <p><b>Lo que nunca te pedimos:</b> estatus migratorio, número de Seguro Social o ITIN, CURP, RFC, pasaporte, ni números de cuentas de banco o tarjetas. Si alguno aparece en un papel o foto que subes, no lo guardamos.</p>
          <p>Tus datos de dinero son datos patrimoniales. Al crear tu cuenta y marcar que aceptas este aviso, nos das tu consentimiento expreso para usarlos como aquí se explica.</p>
        </>
      ),
    },
    {
      title: "Para qué los usamos",
      body: (
        <>
          <p><b>Para darte el servicio</b> (sin esto la app no funciona):</p>
          <List items={[
            "Crear tu cuenta y dejarte entrar con tu teléfono y tu clave.",
            "Guardar lo que anotas en tu teléfono y en la nube, para que no se pierda si cambias de teléfono.",
            "Calcular cuánto te queda, tus impuestos aproximados, tus metas, tu tanda y cómo va tu negocio.",
            "Entender lo que dices, escribes o fotografías, y leerte la pantalla en voz alta.",
            "Ayudarte a recuperar tu clave y proteger tu cuenta.",
          ]} />
          <p><b>Para mejorar Mi Camino</b> (opcional): contar cuántas personas usan la app y en qué idiomas, siempre en números totales que no dicen quién eres. Esos totales se pueden compartir con organizaciones aliadas para mostrar el impacto del proyecto.</p>
          <p>No usamos tus datos para publicidad, no los vendemos y no hacemos perfiles para ofrecerte productos.</p>
        </>
      ),
    },
    {
      title: "Fotos, papeles y voz",
      body: (
        <>
          <p>Cuando tomas foto de un recibo, subes un papel para que te lo expliquemos o hablas para anotar, ese contenido se manda a un proveedor que lo procesa y nos regresa la respuesta (por ejemplo, las cantidades). <b>Mi Camino no guarda las fotos, los papeles ni las grabaciones</b>; solo guarda las cantidades que tú confirmas.</p>
          <p>Si tu navegador usa su propio dictado o su propia voz (por ejemplo Chrome o Safari), la empresa de tu navegador procesa ese audio según sus propias reglas.</p>
        </>
      ),
    },
    {
      title: "Con quién compartimos tus datos",
      body: (
        <>
          <p>Solo con las empresas que necesitamos para que la app funcione, y solo para eso:</p>
          <List items={[
            <>Supabase: guarda tu cuenta y tus datos en la nube (servidores en Estados Unidos). {ext("https://supabase.com/privacy", "Su política")}</>,
            <>Vercel: aloja la página de Mi Camino (Estados Unidos). {ext("https://vercel.com/legal/privacy-policy", "Su política")}</>,
            <>Anthropic (Claude): entiende lo que escribes o dices, lee fotos de recibos y explica papeles. Según sus condiciones comerciales, no usa este contenido para entrenar sus modelos. {ext("https://www.anthropic.com/legal/privacy", "Su política")}</>,
            <>ElevenLabs: convierte el texto en voz y, si está activado, tu voz en texto. {ext("https://elevenlabs.io/privacy-policy", "Su política")}</>,
          ]} />
          <p>Para el tipo de cambio consultamos fuentes públicas (Coinbase y ExchangeRate-API) sin mandar ningún dato tuyo.</p>
          <p>Solo entregaríamos datos a una autoridad si una ley o una orden judicial válida nos obliga, y en ese caso entregaríamos lo mínimo necesario. Como no pedimos estatus migratorio, no lo tenemos.</p>
          <p>Tus datos se guardan en Estados Unidos. Si vives en México, al aceptar este aviso aceptas que se guarden allá.</p>
        </>
      ),
    },
    {
      title: "Dónde se guardan y por cuánto tiempo",
      body: (
        <>
          <List items={[
            "En tu teléfono o computadora (en el navegador), para que la app funcione aunque no tengas internet.",
            "En la nube (Supabase), mientras tengas tu cuenta.",
            "Los registros de intentos de entrar o recuperar tu clave se borran solos después de 30 días.",
            "Cuando borras tu cuenta, borramos tus datos de la nube de inmediato. Pueden quedar en las copias de seguridad automáticas del proveedor hasta que se reemplacen en su ciclo normal.",
          ]} />
        </>
      ),
    },
    {
      title: "Cómo los protegemos",
      body: (
        <>
          <List items={[
            "Todo viaja cifrado (HTTPS).",
            "Cada persona solo puede ver sus propios datos: la base de datos lo revisa en cada consulta.",
            "Tu clave nunca se guarda tal cual, y después de 5 intentos equivocados tu cuenta se bloquea 15 minutos.",
            "Ponemos límites para que nadie abuse de la app.",
          ]} />
          <p><b>Importante:</b> en el navegador, tus datos se quedan guardados en ese aparato y la app pide tu clave para verlos, pero no están cifrados dentro del aparato. No uses Mi Camino en computadoras públicas, y si alguien más usa tu teléfono, sal de tu cuenta.</p>
          <p>Ningún sistema es 100% seguro. Si pasara algo que afecte tus datos, te avisaremos en la app tan pronto como podamos.</p>
        </>
      ),
    },
    {
      title: "Tus derechos",
      body: (
        <>
          <p>Puedes, en cualquier momento:</p>
          <List items={[
            <><b>Ver y llevarte tus datos:</b> en Mi perfil, toca “Descargar mis datos”.</>,
            <><b>Corregirlos:</b> cambia cualquier cosa directamente en la app.</>,
            <><b>Borrarlos:</b> en Mi perfil, toca “Borrar mi cuenta”.</>,
            <><b>Retirar tu consentimiento:</b> borra tu cuenta; dejamos de usar tus datos en ese momento.</>,
          ]} />
          <p>Estos son tus derechos de acceso, rectificación, cancelación y oposición (ARCO) en México, y derechos parecidos que te dan las leyes de Estados Unidos.</p>
        </>
      ),
    },
    {
      title: "Menores de edad",
      body: <p>Mi Camino es para personas de 13 años o más. Si tienes entre 13 y 17 años, usa la app con permiso de tu mamá, papá o tutor. No es para menores de 13 años; si sabemos que una cuenta es de un menor de 13, la borramos.</p>,
    },
    {
      title: "Cambios a este aviso",
      body: <p>Como Mi Camino está en beta, este aviso puede cambiar. Si el cambio es importante, te lo diremos dentro de la app y te pediremos aceptarlo otra vez. La fecha de arriba dice cuándo se cambió por última vez.</p>,
    },
  ],
};

const en: LegalDoc = {
  title: "Privacy notice",
  summaryTitle: "The short version",
  summary: [
    "Mi Camino is in beta (a test version): it may have mistakes and it may change.",
    "We never ask for immigration status, Social Security number, ITIN, or bank account or card numbers.",
    "We save what you write down (your money, goals, tanda and business) so you can see it on any phone.",
    "We don’t sell or rent your data, and there are no ads.",
    "Photos, papers and voice recordings are used to give you an answer and are not kept.",
    "You can download your data or delete your account any time, from My profile.",
  ],
  sections: [
    {
      title: "What Mi Camino is",
      body: (
        <>
          <p>Mi Camino is an independent project in beta.</p>
          <p>Mi Camino is <b>not</b> an official service of the Government of Mexico, the Ministry of Foreign Affairs or any Consulate, and it is not a bank.</p>
        </>
      ),
    },
    {
      title: "What data we use",
      body: (
        <>
          <p><b>What you give us:</b></p>
          <List items={[
            "Your name or nickname, phone number and language.",
            "Your 6-digit PIN. We never store it as is: only a scrambled version that can’t be turned back into your PIN.",
            "Where you live (Mexico or your US state, and whether you live in New York City) and whether you file taxes with your spouse. Used only to estimate taxes and to show your money in dollars or pesos.",
            "What you write down: pay, expenses, fixed payments, goals, savings, tandas and, if you have a business, your sales, costs, products and inventory.",
            "Your security question. The answer is stored scrambled.",
            "The profile picture you pick (a drawing of an animal, not a photo of you).",
          ]} />
          <p><b>What is created as you use the app:</b> the date of each attempt to sign in or recover your PIN, and the internet address (IP) of sign-in attempts, to protect your account from people trying to guess your PIN. Our hosting providers also keep normal technical logs (such as IP addresses) for a short time to run and protect the service.</p>
          <p><b>What we never ask for:</b> immigration status, Social Security number or ITIN, CURP, RFC, passport, or bank account or card numbers. If one appears on a paper or photo you upload, we don’t keep it.</p>
          <p>Your money information is financial data. By creating your account and checking that you accept this notice, you give us your express consent to use it as explained here.</p>
        </>
      ),
    },
    {
      title: "What we use it for",
      body: (
        <>
          <p><b>To provide the service</b> (the app can’t work without this):</p>
          <List items={[
            "Create your account and let you sign in with your phone and PIN.",
            "Save what you write down on your phone and in the cloud, so it isn’t lost if you change phones.",
            "Work out what you have left, your estimated taxes, your goals, your tanda and how your business is doing.",
            "Understand what you say, type or photograph, and read the screen aloud.",
            "Help you recover your PIN and protect your account.",
          ]} />
          <p><b>To improve Mi Camino</b> (optional): counting how many people use the app and in which languages, always as totals that don’t say who you are. These totals may be shared with partner organizations to show the project’s impact.</p>
          <p>We don’t use your data for advertising, we don’t sell it, and we don’t build profiles to offer you products.</p>
        </>
      ),
    },
    {
      title: "Photos, papers and voice",
      body: (
        <>
          <p>When you photograph a receipt, upload a paper to be explained or speak to add something, that content is sent to a provider that processes it and sends back the answer (for example, the amounts). <b>Mi Camino does not keep the photos, papers or recordings</b>; it only saves the amounts you confirm.</p>
          <p>If your browser uses its own dictation or voice (for example Chrome or Safari), your browser’s company processes that audio under its own rules.</p>
        </>
      ),
    },
    {
      title: "Who we share your data with",
      body: (
        <>
          <p>Only with the companies we need for the app to work, and only for that:</p>
          <List items={[
            <>Supabase: stores your account and data in the cloud (servers in the United States). {ext("https://supabase.com/privacy", "Their policy")}</>,
            <>Vercel: hosts the Mi Camino website (United States). {ext("https://vercel.com/legal/privacy-policy", "Their policy")}</>,
            <>Anthropic (Claude): understands what you type or say, reads receipt photos and explains papers. Under its commercial terms, it does not use this content to train its models. {ext("https://www.anthropic.com/legal/privacy", "Their policy")}</>,
            <>ElevenLabs: turns text into voice and, if enabled, your voice into text. {ext("https://elevenlabs.io/privacy-policy", "Their policy")}</>,
          ]} />
          <p>For exchange rates we check public sources (Coinbase and ExchangeRate-API) without sending any of your data.</p>
          <p>We would only give data to an authority if a law or a valid court order requires it, and then only the minimum needed. Since we don’t ask for immigration status, we don’t have it.</p>
          <p>Your data is stored in the United States. If you live in Mexico, by accepting this notice you agree to it being stored there.</p>
        </>
      ),
    },
    {
      title: "Where it’s stored and for how long",
      body: (
        <List items={[
          "On your phone or computer (in the browser), so the app works without internet.",
          "In the cloud (Supabase), for as long as you have an account.",
          "Records of attempts to sign in or recover your PIN delete themselves after 30 days.",
          "When you delete your account, we delete your data from the cloud right away. It may remain in the provider’s automatic backups until they are replaced in their normal cycle.",
        ]} />
      ),
    },
    {
      title: "How we protect it",
      body: (
        <>
          <List items={[
            "Everything travels encrypted (HTTPS).",
            "Each person can only see their own data: the database checks this on every request.",
            "Your PIN is never stored as is, and after 5 wrong tries your account is locked for 15 minutes.",
            "We set limits so nobody can abuse the app.",
          ]} />
          <p><b>Important:</b> in the browser, your data stays saved on that device and the app asks for your PIN to see it, but it isn’t encrypted on the device. Don’t use Mi Camino on public computers, and sign out if someone else uses your phone.</p>
          <p>No system is 100% secure. If something ever affects your data, we’ll tell you in the app as soon as we can.</p>
        </>
      ),
    },
    {
      title: "Your rights",
      body: (
        <>
          <p>At any time you can:</p>
          <List items={[
            <><b>See and take your data:</b> in My profile, tap “Download my data”.</>,
            <><b>Correct it:</b> change anything directly in the app.</>,
            <><b>Delete it:</b> in My profile, tap “Delete my account”.</>,
            <><b>Withdraw your consent:</b> delete your account; we stop using your data right away.</>,
          ]} />
          <p>These are your access, correction, deletion and objection (ARCO) rights in Mexico, and similar rights under US laws.</p>
        </>
      ),
    },
    {
      title: "Minors",
      body: <p>Mi Camino is for people 13 and older. If you are 13 to 17, use the app with permission from your mother, father or guardian. It is not for children under 13; if we learn an account belongs to a child under 13, we delete it.</p>,
    },
    {
      title: "Changes to this notice",
      body: <p>Because Mi Camino is in beta, this notice may change. If a change is important, we’ll tell you inside the app and ask you to accept it again. The date at the top shows when it last changed.</p>,
    },
  ],
};

export default function Privacidad() {
  return <LegalPage es={es} en={en} />;
}
