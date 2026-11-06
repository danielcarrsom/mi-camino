"use client";
// Aviso de privacidad / Privacy notice. Plain-language summary first, then the full notice.
// Keep it true to what the code does: if data handling changes, update this page
// and LEGAL.version in src/lib/legal.ts (people will be asked to accept it again).
import { LegalPage, type LegalDoc } from "@/components/LegalPage";

const ext = (href: string, label: string) => <a className="font-bold text-clay underline" href={href} target="_blank" rel="noopener noreferrer">{label}</a>;
const List = ({ items }: { items: React.ReactNode[] }) => <ul className="list-disc space-y-1.5 pl-6">{items.map((x, i) => <li key={i}>{x}</li>)}</ul>;
const Table = ({ rows }: { rows: [string, string][] }) => (
  <div className="overflow-hidden rounded-2xl border border-sand">
    <table className="w-full text-left text-base">
      <tbody>{rows.map(([a, b], i) => <tr key={i} className="border-b border-sand last:border-0 align-top"><th className="w-2/5 bg-cream px-3 py-2 font-bold">{a}</th><td className="px-3 py-2">{b}</td></tr>)}</tbody>
    </table>
  </div>
);

const es: LegalDoc = {
  title: "Aviso de privacidad",
  summaryTitle: "Lo importante, en pocas palabras",
  summary: [
    "Mi Camino está en versión beta (de prueba): puede tener errores y este aviso puede cambiar.",
    "Nunca te pedimos estatus migratorio, número de Seguro Social, ITIN, CURP, RFC, ni números de cuenta o tarjeta.",
    "Guardamos lo que tú anotas para que lo veas en cualquier teléfono. Solo lo usamos para darte el servicio.",
    "No vendemos ni rentamos tus datos, no hay anuncios y no te rastreamos en otras páginas.",
    "Las fotos, papeles y grabaciones de voz se usan para darte la respuesta y no las guardamos.",
    "Puedes descargar tus datos o borrar tu cuenta cuando quieras, desde Mi perfil.",
  ],
  sections: [
    {
      title: "Qué es Mi Camino",
      body: (
        <>
          <p>Mi Camino es un proyecto independiente en versión beta. Este aviso explica qué datos usamos, para qué, con quién los compartimos y cómo puedes controlarlos. Aplica a la app web de Mi Camino y a sus funciones.</p>
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
            "Tu clave de 6 números. Nunca la guardamos tal cual: solo guardamos versiones cifradas que no se pueden regresar a tu clave.",
            "Dónde vives (México o el estado de Estados Unidos, y si vives en la Ciudad de Nueva York) y si haces tus impuestos con tu esposo(a). Lo usamos solo para calcular impuestos y mostrar tu dinero en dólares o pesos.",
            "Lo que anotas: tu salario, gastos, pagos fijos, metas, ahorros, tandas, y si tienes negocio, tus ventas, costos, productos e inventario.",
            "Tu pregunta de seguridad. La respuesta se guarda cifrada.",
            "La foto de perfil que eliges (un dibujo de un animal; no una foto tuya) y tus preferencias, como letra grande o lectura en voz alta.",
            "La fecha en que aceptaste este aviso y los términos.",
          ]} />
          <p><b>Los que se generan al usar la app:</b></p>
          <List items={[
            "La fecha de cada intento de entrar o de recuperar tu clave, y la dirección de internet (IP) de los intentos de entrar, para proteger tu cuenta de quien quiera adivinar tu clave.",
            "Un código cifrado hecho a partir de tu dirección IP, para limitar cuántas veces se usan la inteligencia artificial y la voz. No guardamos la IP misma para esto.",
            "Registros técnicos normales que guardan por poco tiempo nuestros proveedores de alojamiento (como la dirección IP y el tipo de navegador), para operar y proteger el servicio.",
          ]} />
          <p><b>Lo que nunca te pedimos:</b> estatus migratorio, número de Seguro Social o ITIN, CURP, RFC, pasaporte, ni números de cuentas de banco o tarjetas. No usamos tu ubicación, tus contactos ni tus fotos fuera de las que tú eliges subir.</p>
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
            "Calcular cuánto te queda, tus impuestos aproximados, tus metas, tu tanda y cómo va tu negocio, y darte sugerencias.",
            "Entender lo que dices, escribes o fotografías, explicarte documentos y leerte la pantalla en voz alta.",
            "Ayudarte a recuperar tu clave, proteger tu cuenta y evitar abusos de la app.",
            "Cumplir con la ley cuando nos obligue.",
          ]} />
          <p><b>Para mejorar Mi Camino</b> (opcional): contar cuántas personas usan la app y en qué idiomas, siempre en números totales que no dicen quién eres. Esos totales se pueden compartir con organizaciones aliadas para mostrar el impacto del proyecto.</p>
          <p>No usamos tus datos para publicidad, no los vendemos, no los compartimos para anuncios dirigidos y no hacemos perfiles para ofrecerte productos o decidir si te dan un crédito. Las sugerencias de la app se calculan de forma automática, pero no toman decisiones por ti ni tienen efectos legales.</p>
        </>
      ),
    },
    {
      title: "Fotos, papeles y voz",
      body: (
        <>
          <p>Cuando tomas foto de un recibo, subes un papel para que te lo expliquemos o hablas para anotar, ese contenido se manda a un proveedor que lo procesa y nos regresa la respuesta (por ejemplo, las cantidades). <b>Mi Camino no guarda las fotos, los papeles ni las grabaciones</b>; solo guarda lo que tú confirmas.</p>
          <p>Los papeles pueden traer datos sensibles (de salud, de identidad o de otras personas). Sube solo lo necesario y tapa los números que no hagan falta. Le pedimos a la inteligencia artificial que nunca repita números de identificación o de cuentas completos.</p>
          <p>Si tu navegador usa su propio dictado o su propia voz (por ejemplo Chrome o Safari), la empresa de tu navegador procesa ese audio según sus propias reglas.</p>
        </>
      ),
    },
    {
      title: "Con quién compartimos tus datos",
      body: (
        <>
          <p>Solo con las empresas que necesitamos para que la app funcione (encargados), que procesan los datos por nuestra cuenta y solo para eso:</p>
          <List items={[
            <>Supabase: guarda tu cuenta y tus datos en la nube (servidores en Estados Unidos). {ext("https://supabase.com/privacy", "Su política")}</>,
            <>Vercel: aloja la página de Mi Camino (Estados Unidos). {ext("https://vercel.com/legal/privacy-policy", "Su política")}</>,
            <>Anthropic (Claude): entiende lo que escribes o dices, lee fotos de recibos y explica papeles. Según sus condiciones comerciales, no usa este contenido para entrenar sus modelos. {ext("https://www.anthropic.com/legal/privacy", "Su política")}</>,
            <>ElevenLabs: convierte el texto en voz y, si está activado, tu voz en texto. {ext("https://elevenlabs.io/privacy-policy", "Su política")}</>,
          ]} />
          <p>Para el tipo de cambio consultamos fuentes públicas (Coinbase y ExchangeRate-API) sin mandar ningún dato tuyo.</p>
          <p><b>Autoridades:</b> solo entregaríamos datos si una ley o una orden válida de un juez o autoridad competente nos obliga. Revisaríamos que la petición sea válida, entregaríamos lo mínimo necesario y, cuando la ley lo permita, te avisaríamos. Como no pedimos estatus migratorio, no lo tenemos.</p>
          <p><b>Si el proyecto cambia de manos:</b> si Mi Camino pasa a una organización o empresa que lo continúe, tus datos pasarían con él bajo este mismo aviso, y te avisaríamos antes.</p>
          <p><b>Transferencia internacional:</b> tus datos se guardan en Estados Unidos. Si vives en México, al aceptar este aviso aceptas que se guarden y procesen allá con las protecciones que aquí se explican.</p>
        </>
      ),
    },
    {
      title: "Dónde se guardan y por cuánto tiempo",
      body: (
        <Table rows={[
          ["Tu cuenta y lo que anotas", "Mientras tengas tu cuenta. Al borrarla, se borra de la nube de inmediato."],
          ["En tu teléfono o computadora", "Hasta que borres tu cuenta en ese aparato o borres los datos del navegador."],
          ["Intentos de entrar o recuperar tu clave", "Se borran solos después de 30 días (se revisa cada día)."],
          ["Códigos para limitar el uso de la IA", "Se borran solos después de 1 día (se revisa cada día)."],
          ["Fotos, papeles y grabaciones", "No se guardan; se usan solo para darte la respuesta."],
          ["Copias de seguridad del proveedor", "Pueden conservar datos borrados hasta que se reemplacen en su ciclo normal."],
        ]} />
      ),
    },
    {
      title: "Almacenamiento en tu aparato",
      body: <p>Mi Camino guarda tu información en el almacenamiento del navegador de tu aparato para funcionar sin internet y mantener tu sesión. No usamos cookies de publicidad ni de rastreo, ni herramientas que te sigan en otras páginas.</p>,
    },
    {
      title: "Cómo los protegemos",
      body: (
        <>
          <List items={[
            "Todo viaja cifrado (HTTPS), y nuestros proveedores cifran los datos guardados en sus servidores.",
            "Cada persona solo puede ver sus propios datos: la base de datos lo revisa en cada consulta.",
            "Tu clave nunca se guarda tal cual. Después de 5 intentos equivocados, tu cuenta se bloquea 15 minutos.",
            "Las llaves secretas de la app solo existen en el servidor, y ponemos límites para que nadie abuse de la app.",
            "Revisamos el código y las dependencias de forma periódica para encontrar y corregir fallas de seguridad.",
          ]} />
          <p><b>Importante:</b> en el navegador, tus datos se quedan guardados en ese aparato y la app pide tu clave para verlos, pero no están cifrados dentro del aparato. No uses Mi Camino en computadoras públicas, y si alguien más usa tu teléfono, sal de tu cuenta.</p>
          <p>Ningún sistema es 100% seguro. Si ocurriera un incidente que afecte tus datos, te avisaremos dentro de la app sin demora injustificada, con lo que pasó y lo que puedes hacer, y cumpliremos con los avisos que exija la ley.</p>
        </>
      ),
    },
    {
      title: "Tus derechos",
      body: (
        <>
          <p>Puedes, en cualquier momento y sin costo:</p>
          <List items={[
            <><b>Ver y llevarte tus datos:</b> en Mi perfil, toca “Descargar mis datos”.</>,
            <><b>Corregirlos:</b> cambia cualquier cosa directamente en la app.</>,
            <><b>Borrarlos:</b> en Mi perfil, toca “Borrar mi cuenta”.</>,
            <><b>Retirar tu consentimiento u oponerte a un uso:</b> borra tu cuenta; dejamos de usar tus datos en ese momento.</>,
          ]} />
          <p>Estos son tus derechos de acceso, rectificación, cancelación y oposición (ARCO) en México, y los derechos parecidos que te dan las leyes de privacidad de algunos estados de Estados Unidos (saber qué datos tenemos, corregirlos, borrarlos y no ser vendidos). No te trataremos diferente por usar tus derechos. Como no vendemos datos ni hacemos publicidad dirigida, no hay nada de qué excluirte.</p>
          <p>Si crees que no respetamos tus derechos, puedes acudir a la autoridad de protección de datos o de protección al consumidor de tu país.</p>
        </>
      ),
    },
    {
      title: "Menores de edad",
      body: <p>Mi Camino es para personas de 13 años o más. Si tienes entre 13 y 17 años, usa la app con permiso de tu mamá, papá o tutor. No es para menores de 13 años y no recolectamos a sabiendas datos de ellos; si sabemos que una cuenta es de un menor de 13, la borramos.</p>,
    },
    {
      title: "Enlaces a otras páginas",
      body: <p>Mi Camino tiene enlaces y teléfonos de organizaciones y dependencias. Cuando las usas, ellas tratan tus datos según sus propias reglas, no según este aviso.</p>,
    },
    {
      title: "Cambios a este aviso",
      body: <p>Como Mi Camino está en beta, este aviso puede cambiar. La fecha de arriba dice cuándo se cambió por última vez. Si el cambio es importante, te lo diremos dentro de la app y te pediremos aceptarlo otra vez antes de seguir usándola. Si hay diferencias entre la versión en español y en inglés, vale la versión en español.</p>,
    },
  ],
};

const en: LegalDoc = {
  title: "Privacy notice",
  summaryTitle: "The short version",
  summary: [
    "Mi Camino is in beta (a test version): it may have mistakes and this notice may change.",
    "We never ask for immigration status, Social Security number, ITIN, CURP, RFC, or bank account or card numbers.",
    "We save what you write down so you can see it on any phone. We only use it to provide the service.",
    "We don’t sell or rent your data, there are no ads, and we don’t track you on other websites.",
    "Photos, papers and voice recordings are used to give you an answer and are not kept.",
    "You can download your data or delete your account any time, from My profile.",
  ],
  sections: [
    {
      title: "What Mi Camino is",
      body: (
        <>
          <p>Mi Camino is an independent project in beta. This notice explains what data we use, what for, who we share it with and how you can control it. It applies to the Mi Camino web app and its features.</p>
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
            "Your 6-digit PIN. We never store it as is: only scrambled versions that can’t be turned back into your PIN.",
            "Where you live (Mexico or your US state, and whether you live in New York City) and whether you file taxes with your spouse. Used only to estimate taxes and show your money in dollars or pesos.",
            "What you write down: pay, expenses, fixed payments, goals, savings, tandas and, if you have a business, your sales, costs, products and inventory.",
            "Your security question. The answer is stored scrambled.",
            "The profile picture you pick (a drawing of an animal, not a photo of you) and your settings, like big letters or reading aloud.",
            "The date you accepted this notice and the terms.",
          ]} />
          <p><b>What is created as you use the app:</b></p>
          <List items={[
            "The date of each attempt to sign in or recover your PIN, and the internet address (IP) of sign-in attempts, to protect your account from people trying to guess your PIN.",
            "A scrambled code made from your IP address, to limit how often the artificial intelligence and voice features are used. The IP itself isn’t stored for this.",
            "Normal technical logs kept for a short time by our hosting providers (such as IP address and browser type), to run and protect the service.",
          ]} />
          <p><b>What we never ask for:</b> immigration status, Social Security number or ITIN, CURP, RFC, passport, or bank account or card numbers. We don’t use your location, contacts or photos other than the ones you choose to upload.</p>
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
            "Work out what you have left, your estimated taxes, your goals, your tanda and how your business is doing, and give you suggestions.",
            "Understand what you say, type or photograph, explain documents and read the screen aloud.",
            "Help you recover your PIN, protect your account and prevent abuse of the app.",
            "Comply with the law when it requires us to.",
          ]} />
          <p><b>To improve Mi Camino</b> (optional): counting how many people use the app and in which languages, always as totals that don’t say who you are. These totals may be shared with partner organizations to show the project’s impact.</p>
          <p>We don’t use your data for advertising, don’t sell it, don’t share it for targeted ads, and don’t build profiles to offer you products or decide whether you get credit. The app’s suggestions are calculated automatically, but they don’t make decisions for you and have no legal effects.</p>
        </>
      ),
    },
    {
      title: "Photos, papers and voice",
      body: (
        <>
          <p>When you photograph a receipt, upload a paper to be explained or speak to add something, that content is sent to a provider that processes it and sends back the answer (for example, the amounts). <b>Mi Camino does not keep the photos, papers or recordings</b>; it only saves what you confirm.</p>
          <p>Papers may contain sensitive data (about health, identity or other people). Upload only what’s needed and cover numbers that aren’t. We instruct the AI never to repeat full ID or account numbers.</p>
          <p>If your browser uses its own dictation or voice (for example Chrome or Safari), your browser’s company processes that audio under its own rules.</p>
        </>
      ),
    },
    {
      title: "Who we share your data with",
      body: (
        <>
          <p>Only with the companies we need for the app to work (processors), which handle data on our behalf and only for that:</p>
          <List items={[
            <>Supabase: stores your account and data in the cloud (servers in the United States). {ext("https://supabase.com/privacy", "Their policy")}</>,
            <>Vercel: hosts the Mi Camino website (United States). {ext("https://vercel.com/legal/privacy-policy", "Their policy")}</>,
            <>Anthropic (Claude): understands what you type or say, reads receipt photos and explains papers. Under its commercial terms, it does not use this content to train its models. {ext("https://www.anthropic.com/legal/privacy", "Their policy")}</>,
            <>ElevenLabs: turns text into voice and, if enabled, your voice into text. {ext("https://elevenlabs.io/privacy-policy", "Their policy")}</>,
          ]} />
          <p>For exchange rates we check public sources (Coinbase and ExchangeRate-API) without sending any of your data.</p>
          <p><b>Authorities:</b> we would only give data if a law or a valid order from a judge or competent authority requires it. We would check that the request is valid, give only the minimum needed and, when the law allows, tell you. Since we don’t ask for immigration status, we don’t have it.</p>
          <p><b>If the project changes hands:</b> if Mi Camino passes to an organization or company that continues it, your data would go with it under this same notice, and we’d tell you first.</p>
          <p><b>International transfer:</b> your data is stored in the United States. If you live in Mexico, by accepting this notice you agree to it being stored and processed there with the protections explained here.</p>
        </>
      ),
    },
    {
      title: "Where it’s stored and for how long",
      body: (
        <Table rows={[
          ["Your account and what you write down", "While you have your account. Deleting it removes it from the cloud right away."],
          ["On your phone or computer", "Until you delete your account on that device or clear the browser’s data."],
          ["Attempts to sign in or recover your PIN", "Deleted automatically after 30 days (checked daily)."],
          ["Codes used to limit AI use", "Deleted automatically after 1 day (checked daily)."],
          ["Photos, papers and recordings", "Not kept; used only to give you the answer."],
          ["Provider backups", "May keep deleted data until replaced in their normal cycle."],
        ]} />
      ),
    },
    {
      title: "Storage on your device",
      body: <p>Mi Camino saves your information in your browser’s storage so it works without internet and keeps you signed in. We don’t use advertising or tracking cookies, or tools that follow you on other websites.</p>,
    },
    {
      title: "How we protect it",
      body: (
        <>
          <List items={[
            "Everything travels encrypted (HTTPS), and our providers encrypt the data stored on their servers.",
            "Each person can only see their own data: the database checks this on every request.",
            "Your PIN is never stored as is. After 5 wrong tries, your account is locked for 15 minutes.",
            "The app’s secret keys only exist on the server, and we set limits so nobody can abuse the app.",
            "We review the code and its dependencies regularly to find and fix security problems.",
          ]} />
          <p><b>Important:</b> in the browser, your data stays saved on that device and the app asks for your PIN to see it, but it isn’t encrypted on the device. Don’t use Mi Camino on public computers, and sign out if someone else uses your phone.</p>
          <p>No system is 100% secure. If an incident ever affects your data, we’ll tell you inside the app without undue delay, explaining what happened and what you can do, and we’ll give any notices the law requires.</p>
        </>
      ),
    },
    {
      title: "Your rights",
      body: (
        <>
          <p>At any time and at no cost, you can:</p>
          <List items={[
            <><b>See and take your data:</b> in My profile, tap “Download my data”.</>,
            <><b>Correct it:</b> change anything directly in the app.</>,
            <><b>Delete it:</b> in My profile, tap “Delete my account”.</>,
            <><b>Withdraw consent or object to a use:</b> delete your account; we stop using your data right away.</>,
          ]} />
          <p>These are your access, correction, deletion and objection (ARCO) rights in Mexico, and the similar rights that the privacy laws of some US states give you (to know what data we have, correct it, delete it and not have it sold). We won’t treat you differently for using your rights. Since we don’t sell data or do targeted advertising, there is nothing to opt out of.</p>
          <p>If you believe we haven’t respected your rights, you can go to the data protection or consumer protection authority in your country.</p>
        </>
      ),
    },
    {
      title: "Minors",
      body: <p>Mi Camino is for people 13 and older. If you are 13 to 17, use the app with permission from your mother, father or guardian. It is not for children under 13 and we don’t knowingly collect their data; if we learn an account belongs to a child under 13, we delete it.</p>,
    },
    {
      title: "Links to other websites",
      body: <p>Mi Camino has links and phone numbers for organizations and agencies. When you use them, they handle your data under their own rules, not this notice.</p>,
    },
    {
      title: "Changes to this notice",
      body: <p>Because Mi Camino is in beta, this notice may change. The date at the top shows when it last changed. If a change is important, we’ll tell you inside the app and ask you to accept it again before you continue. If the Spanish and English versions differ, the Spanish version prevails.</p>,
    },
  ],
};

export default function Privacidad() {
  return <LegalPage es={es} en={en} />;
}
