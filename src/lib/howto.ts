// "¿Cómo se usa?": three or four short steps for each screen, in plain words.
type Steps = { es: string[]; en: string[] };

export const HOWTO: Record<string, Steps> = {
  "/casita": {
    es: ["Arriba ves cuánto ganas, cuánto gastas y cuánto te queda.", "Toca el botón + para anotar lo que ganaste o gastaste.", "En “Te falta pagar” toca “Ya lo pagué” cuando pagues la renta o la luz.", "Abajo ves tus metas y lo último que anotaste."],
    en: ["At the top you see what you earn, spend and have left.", "Tap the + button to add what you earned or spent.", "In “Still to pay”, tap “I paid it” when you pay rent or light.", "Below are your goals and your latest entries."],
  },
  "/casita/anotar": {
    es: ["Toca si ganaste o gastaste.", "Toca “Mi salario” u “Otro dinero”, o dime cuánto con el micrófono.", "También puedes escribirlo o tomarle foto a tu recibo.", "Revisa lo que entendimos y toca Guardar."],
    en: ["Tap whether you earned or spent.", "Tap “My salary” or “Other money”, or tell me with the microphone.", "You can also type it or take a photo of your receipt.", "Check what we understood and tap Save."],
  },
  "/casita/dinero": {
    es: ["Arriba eliges ver tu dinero del mes o de la semana.", "En “Tus pagos de este mes” toca “Ya lo pagué” cuando pagues cada cosa.", "Las barras te dicen en qué se va tu dinero.", "Toca el lápiz ✏️ para cambiar algo que anotaste."],
    en: ["At the top choose to see your month or your week.", "In “Your payments this month”, tap “I paid it” when you pay each one.", "The bars show where your money goes.", "Tap the pencil ✏️ to change something you added."],
  },
  "/casita/metas": {
    es: ["Toca “Nueva meta” y elige para qué quieres ahorrar.", "Escribe cuánto necesitas y cuánto apartarás; te sugerimos una cantidad.", "Cada vez que apartes dinero, toca “Aparté dinero” y se pone un ladrillo.", "Toca “Compartir con mi familia” para mandar tu certificado."],
    en: ["Tap “New goal” and choose what you're saving for.", "Type how much you need and how much you'll set aside; we suggest an amount.", "Each time you save, tap “I saved money” and a brick goes up.", "Tap “Share with my family” to send your certificate."],
  },
  "/casita/tanda": {
    es: ["Toca “Nueva tanda” y escribe cuánto pone cada quien y cuántas personas son.", "Elige qué número te toca.", "Cada vuelta, toca “Ya pagué”.", "Cuando te toque, toca “Ya me tocó” y elige si va a una meta."],
    en: ["Tap “New tanda” and type how much each person puts in and how many people.", "Choose your turn number.", "Each round, tap “I paid”.", "When it's your turn, tap “I got it” and choose if it goes to a goal."],
  },
  "/casita/enviar": {
    es: ["Toca a qué país envías.", "Escribe cuántos dólares envías: te decimos cuánto le llega a tu familia.", "Si te ofrecieron otro precio, escribe la comisión y el tipo de cambio para compararlo.", "Toca “Anotar este envío” para guardarlo en tus gastos."],
    en: ["Tap the country you send to.", "Type how many dollars you send: we show how much your family gets.", "If you got another offer, type the fee and rate to compare.", "Tap “Add this transfer” to save it in your expenses."],
  },
  "/casita/documentos": {
    es: ["Toca “Tomar foto”, “Subir foto” o “Subir documento”.", "Si tiene varias páginas, agrega todas.", "Toca “Explícame este papel”.", "Lee o escucha qué es, qué hacer y si parece estafa."],
    en: ["Tap “Take a photo”, “Upload a photo” or “Upload a document”.", "If it has several pages, add them all.", "Tap “Explain this paper”.", "Read or listen to what it is, what to do and if it looks like a scam."],
  },
  "/aprender": {
    es: ["Arriba eliges: Juegos, Lecciones o ¿Quién me ayuda?", "En los juegos, toca la respuesta y ganas estrellas.", "En las lecciones, toca “Escuchar” para que te la lea.", "En “¿Quién me ayuda?” toca “Llamar” para hablar con alguien gratis."],
    en: ["At the top choose: Games, Lessons or Who can help?", "In games, tap an answer to win stars.", "In lessons, tap “Listen” to hear it.", "In “Who can help?”, tap “Call” to talk to someone for free."],
  },
  "/negocio": {
    es: ["El semáforo te dice cómo va tu negocio: verde, amarillo o rojo.", "Toca “Vendí” o “Gasté” para anotar.", "Ponte un sueldo y toca “Ya me pagué” cada vez que te pagues.", "Abajo tienes sugerencias para que te vaya mejor."],
    en: ["The traffic light shows how your business is doing: green, yellow or red.", "Tap “I sold” or “I spent” to add.", "Set a salary and tap “I paid myself” each time.", "Below are suggestions to do better."],
  },
  "/negocio/anotar": {
    es: ["Dilo con el micrófono o escríbelo como lo dirías: “vendí 40 tamales a 3 dólares”.", "O toca + en cada producto que vendiste.", "Elige de dónde vino o en qué fue.", "Toca Guardar."],
    en: ["Say it with the microphone or type it: “sold 40 tamales at 3 dollars”.", "Or tap + on each product you sold.", "Choose where it came from or what it was for.", "Tap Save."],
  },
  "/negocio/dinero": {
    es: ["“Ventas y gastos”: todo lo que anotaste y tus gastos fijos.", "“Mis costos”: cuánto ganas por pieza y tu inventario.", "“A futuro”: prueba qué pasa si vendes más o gastas menos.", "Toca el lápiz ✏️ para cambiar algo."],
    en: ["“Sales and costs”: everything you added and your fixed costs.", "“My costs”: what you earn per piece and your inventory.", "“Looking ahead”: see what happens if you sell more or spend less.", "Tap the pencil ✏️ to change something."],
  },
  "/negocio/metas": {
    es: ["Elige una idea de meta o crea la tuya.", "Te sugerimos cuánto necesitas y cuánto apartar cada semana.", "Toca “Aparté dinero” cada vez que guardes.", "Abajo hay sugerencias para tu negocio."],
    en: ["Pick a goal idea or create your own.", "We suggest how much you need and how much to set aside each week.", "Tap “I saved money” each time you save.", "Below are suggestions for your business."],
  },
  "/negocio/aprender": {
    es: ["Juega para aprender a poner precios y separar tu dinero.", "Escucha lecciones cortas para tu negocio.", "En “¿Quién me ayuda?” encuentras ayuda gratis para permisos y préstamos."],
    en: ["Play to learn pricing and keeping money apart.", "Listen to short lessons for your business.", "In “Who can help?” find free help with permits and loans."],
  },
};

export function howtoFor(path: string): Steps | null {
  if (HOWTO[path]) return HOWTO[path];
  // goal detail pages and similar
  const parent = Object.keys(HOWTO).filter((k) => path.startsWith(k + "/")).sort((a, b) => b.length - a.length)[0];
  return parent ? HOWTO[parent] : null;
}
