// "Aprender" for Mi Negocio: games, lessons and help made for small businesses.
import type { Game, Lesson, NeedItem, Question, Resource } from "./learn";
import type { Label } from "./catalog";

const two = (prompt: Label, icon: string, aRight: boolean, a: Label, b: Label, why: Label, ia = "check", ib = "x"): Question => ({
  prompt, icon, why,
  choices: [
    { label: a, icon: ia, correct: aRight },
    { label: b, icon: ib, correct: !aRight },
  ],
});

const BUSINESS: Label = { es: "Del negocio", en: "Business" };
const HOME: Label = { es: "De la casa", en: "Home" };
const homeOrBiz = (prompt: Label, icon: string, biz: boolean, why: Label) => two(prompt, icon, biz, BUSINESS, HOME, why, "store", "house");

export const BIZ_GAMES: Game[] = [
  {
    id: "biz_separa",
    title: { es: "¿Del negocio o de la casa?", en: "Business or home?" },
    sub: { es: "Aprende a separar tu dinero", en: "Learn to keep money apart" },
    icon: "store",
    color: "#316a42",
    questions: [
      homeOrBiz({ es: "Comprar masa y carne para los tamales", en: "Buying dough and meat for the tamales" }, "shopping-cart", true, { es: "Es lo que usas para vender: es del negocio.", en: "You use it to sell: it's a business cost." }),
      homeOrBiz({ es: "Pagar la renta de tu departamento", en: "Paying rent for your apartment" }, "key-round", false, { es: "Tu casa no es el negocio. Págala con tu sueldo.", en: "Your home isn't the business. Pay it with your salary." }),
      homeOrBiz({ es: "Gasolina para entregar pedidos", en: "Gas to deliver orders" }, "fuel", true, { es: "Sirve para vender: es del negocio.", en: "It helps you sell: it's a business cost." }),
      homeOrBiz({ es: "Los útiles de la escuela de tus hijos", en: "Your kids' school supplies" }, "graduation-cap", false, { es: "Es de tu familia: sale de tu sueldo, no de la caja del negocio.", en: "It's for your family: it comes from your salary, not the register." }),
      homeOrBiz({ es: "El permiso para vender en la calle", en: "Your street vending permit" }, "file-text", true, { es: "Sin permiso no hay negocio: es un gasto fijo del negocio.", en: "No permit, no business: it's a fixed business cost." }),
      homeOrBiz({ es: "Una hielera nueva para tus bebidas", en: "A new cooler for your drinks" }, "package", true, { es: "Es equipo del negocio.", en: "It's business equipment." }),
    ],
  },
  {
    id: "biz_precio",
    title: { es: "¿Le gano o le pierdo?", en: "Profit or loss?" },
    sub: { es: "Practica poner buenos precios", en: "Practice setting good prices" },
    icon: "coins",
    color: "#e0a33a",
    questions: [
      {
        prompt: { es: "Hacer un tamal te cuesta $1.20. Si lo vendes a $1.50, ¿cuánto ganas por tamal?", en: "A tamale costs you $1.20. If you sell it for $1.50, how much do you earn each?" },
        icon: "coins",
        choices: [
          { label: { es: "$1.50", en: "$1.50" }, correct: false },
          { label: { es: "$0.30", en: "$0.30" }, correct: true },
          { label: { es: "$2.70", en: "$2.70" }, correct: false },
        ],
        why: { es: "Ganancia = precio − costo: $1.50 − $1.20 = 30 centavos. Es muy poquito: súbele el precio.", en: "Profit = price − cost: $1.50 − $1.20 = 30 cents. That's very little: raise the price." },
      },
      {
        prompt: { es: "Gastaste $60 en ingredientes y te salieron 30 tortas. ¿Cuánto te cuesta cada una?", en: "You spent $60 on ingredients and made 30 tortas. What does each one cost you?" },
        icon: "utensils",
        choices: [
          { label: { es: "$2", en: "$2" }, correct: true },
          { label: { es: "$30", en: "$30" }, correct: false },
          { label: { es: "$0.50", en: "$0.50" }, correct: false },
        ],
        why: { es: "$60 ÷ 30 = $2 por torta. Así sabes tu costo y puedes poner un buen precio.", en: "$60 ÷ 30 = $2 each. Now you know your cost and can set a good price." },
      },
      {
        prompt: { es: "Pagas $300 de renta al mes y cada producto te deja $3. ¿Cuántos necesitas vender para pagar la renta?", en: "Rent is $300 a month and each item leaves you $3. How many do you need to sell to cover rent?" },
        icon: "key-round",
        choices: [
          { label: { es: "10", en: "10" }, correct: false },
          { label: { es: "100", en: "100" }, correct: true },
          { label: { es: "300", en: "300" }, correct: false },
        ],
        why: { es: "$300 ÷ $3 = 100. Después de esos 100, lo demás ya es ganancia.", en: "$300 ÷ $3 = 100. After those 100, the rest is profit." },
      },
      {
        prompt: { es: "Tu proveedor subió el precio de la carne. ¿Qué haces?", en: "Your supplier raised the price of meat. What do you do?" },
        icon: "shopping-cart",
        choices: [
          { label: { es: "Vuelvo a calcular mi costo y ajusto el precio", en: "Recalculate my cost and adjust the price" }, correct: true },
          { label: { es: "Dejo todo igual", en: "Leave everything the same" }, correct: false },
        ],
        why: { es: "Si tus costos suben y tu precio no, ganas menos sin darte cuenta. Revisa tus costos seguido.", en: "If costs go up and your price doesn't, you earn less without noticing. Check your costs often." },
      },
    ],
  },
  {
    id: "biz_decide",
    title: { es: "¿Buena idea para mi negocio?", en: "Good idea for my business?" },
    sub: { es: "Decisiones de todos los días", en: "Everyday decisions" },
    icon: "lightbulb",
    color: "#b34a2a",
    questions: [
      two({ es: "Pagarte un sueldo fijo cada semana, aunque sea chiquito", en: "Pay yourself a fixed salary every week, even if small" }, "hand-coins", true, { es: "Buena idea", en: "Good idea" }, { es: "Mala idea", en: "Bad idea" }, { es: "Así tu familia tiene un ingreso estable y sabes cuánto deja el negocio.", en: "Your family gets steady income and you know what the business really makes." }),
      two({ es: "Fiarle a todos sin anotar quién te debe", en: "Give credit to everyone without writing down who owes you" }, "users", false, { es: "Buena idea", en: "Good idea" }, { es: "Mala idea", en: "Bad idea" }, { es: "Si fías, anota nombre, cantidad y fecha. Lo que no se anota se pierde.", en: "If you give credit, write down name, amount and date. What isn't written down gets lost." }),
      two({ es: "Comprar al mayoreo antes de diciembre", en: "Buying in bulk before December" }, "package", true, { es: "Buena idea", en: "Good idea" }, { es: "Mala idea", en: "Bad idea" }, { es: "En temporada alta vendes más. Comprar antes y al mayoreo te sale más barato.", en: "You sell more in the busy season. Buying early and in bulk is cheaper." }),
      two({ es: "Usar el dinero de la caja para la fiesta de la familia", en: "Using the register money for a family party" }, "gift", false, { es: "Buena idea", en: "Good idea" }, { es: "Mala idea", en: "Bad idea" }, { es: "La caja es para el negocio. Para la familia, usa tu sueldo.", en: "The register is for the business. For family, use your salary." }),
      two({ es: "Pedir un préstamo con interés muy alto para surtir", en: "Taking a very high-interest loan to buy stock" }, "credit-card", false, { es: "Buena idea", en: "Good idea" }, { es: "Mala idea", en: "Bad idea" }, { es: "Busca préstamos para negocios pequeños con interés justo. Pregunta en los centros gratis de la ciudad.", en: "Look for fair small-business loans. Ask at the city's free centers." }),
    ],
  },
];

export const BIZ_LESSONS: Lesson[] = [
  {
    id: "biz_costos",
    title: { es: "¿Cuánto te cuesta lo que vendes?", en: "What does what you sell cost you?" },
    icon: "coins",
    minutes: 2,
    body: {
      es: [
        "Para saber si ganas, primero necesitas saber cuánto te cuesta hacer o comprar cada cosa que vendes.",
        "Piensa en una tanda: suma todo lo que gastaste (ingredientes, materiales, empaques) y divídelo entre cuántas piezas te salieron. Ese es tu costo por pieza.",
        "Tu precio debe ser más alto que tu costo, y además dejarte para pagar renta, permisos y tu sueldo. Una buena guía: que te queden por lo menos 40 centavos de cada dólar que cobras.",
      ],
      en: [
        "To know if you're earning, first know what it costs you to make or buy each thing you sell.",
        "Think of one batch: add up everything you spent (ingredients, materials, packaging) and divide by how many pieces you made. That's your cost per piece.",
        "Your price must be above your cost and also leave money for rent, permits and your salary. A good guide: keep at least 40 cents of every dollar you charge.",
      ],
    },
    keys: { es: ["Costo = todo lo que gastaste ÷ piezas", "Precio más alto que el costo", "Que te queden 40¢ de cada dólar"], en: ["Cost = all you spent ÷ pieces", "Price above cost", "Keep 40¢ of every dollar"] },
    link: { href: "/negocio/dinero?tab=costos", label: { es: "Calcular mis costos", en: "Calculate my costs" } },
  },
  {
    id: "biz_sueldo",
    title: { es: "Págate un sueldo", en: "Pay yourself a salary" },
    icon: "hand-coins",
    minutes: 2,
    body: {
      es: [
        "Muchos dueños sacan dinero de la caja cuando lo necesitan. Así nunca saben si el negocio de verdad deja ganancia.",
        "Mejor: decide un sueldo fijo para ti, cada semana o cada quincena, y págatelo siempre el mismo día. Lo demás se queda en el negocio para surtir, para emergencias y para crecer.",
        "En Mi Camino puedes poner tu sueldo para que se repita y confirmar cada vez que te pagas.",
      ],
      en: [
        "Many owners take money from the register whenever they need it. That way they never know if the business really makes a profit.",
        "Better: decide a fixed salary for yourself, weekly or every two weeks, and always pay it the same day. The rest stays in the business for stock, emergencies and growth.",
        "In Mi Camino you can set your salary to repeat and confirm each time you pay yourself.",
      ],
    },
    keys: { es: ["Un sueldo fijo, el mismo día", "Lo demás se queda en el negocio", "No saques de la caja a cada rato"], en: ["A fixed salary, same day", "The rest stays in the business", "Don't dip into the register"] },
    link: { href: "/negocio?sueldo=1", label: { es: "Poner mi sueldo", en: "Set my salary" } },
  },
  {
    id: "biz_fiado",
    title: { es: "Fiado y cobranza sin pleitos", en: "Credit and collecting, without fights" },
    icon: "users",
    minutes: 2,
    body: {
      es: [
        "Fiar ayuda a vender, pero el dinero que te deben no lo puedes usar para surtir.",
        "Anota siempre quién te debe, cuánto y desde cuándo. Pon un límite: por ejemplo, no fiar más de una semana ni más de cierta cantidad.",
        "Cobra con amabilidad y a tiempo. Si alguien no paga, no le vuelvas a fiar hasta que se ponga al corriente.",
      ],
      en: [
        "Giving credit helps you sell, but money you're owed can't buy stock.",
        "Always write down who owes you, how much and since when. Set a limit: for example, no more than a week or a certain amount.",
        "Collect kindly and on time. If someone doesn't pay, don't give them credit again until they catch up.",
      ],
    },
    keys: { es: ["Anota quién te debe", "Pon un límite", "Cobra a tiempo"], en: ["Write down who owes you", "Set a limit", "Collect on time"] },
  },
  {
    id: "biz_temporada",
    title: { es: "Prepárate para la temporada alta", en: "Get ready for the busy season" },
    icon: "gift",
    minutes: 2,
    body: {
      es: [
        "Hay meses en que vendes más: diciembre, Día de las Madres, fiestas patrias, regreso a clases.",
        "Mira en Mi dinero cuáles fueron tus mejores semanas. Compra tu mercancía con tiempo y al mayoreo, y avisa a tus clientes para que te hagan encargos.",
        "Lo que ganes de más en temporada alta, guarda una parte para los meses flojos.",
      ],
      en: [
        "Some months you sell more: December, Mother's Day, national holidays, back to school.",
        "Look in My money for your best weeks. Buy stock early and in bulk, and tell customers to order ahead.",
        "Of what you earn extra in the busy season, save part for the slow months.",
      ],
    },
    keys: { es: ["Conoce tus meses buenos", "Compra con tiempo", "Guarda para los meses flojos"], en: ["Know your good months", "Buy early", "Save for slow months"] },
    link: { href: "/negocio/dinero?tab=costos", label: { es: "Ver mi inventario", en: "See my inventory" } },
  },
  {
    id: "biz_formal",
    places: ["us"],
    title: { es: "Permisos, impuestos y tu negocio", en: "Permits, taxes and your business" },
    icon: "file-text",
    minutes: 3,
    body: {
      es: [
        "Tener tus permisos en regla te evita multas y te deja vender tranquilo. Cada tipo de negocio necesita permisos distintos.",
        "Aunque tu negocio sea pequeño, lo que ganas puede tener que declararse en tus impuestos. Muchas personas lo hacen con un ITIN.",
        "No tienes que saberlo todo: la ciudad tiene centros gratis que te orientan sobre permisos, préstamos y cursos. Busca ayuda antes de pagarle a alguien que te prometa arreglarlo todo.",
      ],
      en: [
        "Having your permits in order avoids fines and lets you sell in peace. Each type of business needs different permits.",
        "Even if your business is small, what you earn may need to be reported on your taxes. Many people do this with an ITIN.",
        "You don't need to know it all: the city has free centers that guide you on permits, loans and courses. Get help before paying someone who promises to fix everything.",
      ],
    },
    keys: { es: ["Permisos en regla", "Tus ganancias van en tus impuestos", "Pide ayuda gratis primero"], en: ["Permits in order", "Profits go on your taxes", "Get free help first"] },
  },
  {
    id: "biz_prestamo",
    title: { es: "Antes de pedir un préstamo", en: "Before you take a loan" },
    icon: "landmark",
    minutes: 2,
    body: {
      es: [
        "Un préstamo puede ayudarte a crecer, pero solo si tu negocio ya deja ganancia para pagarlo.",
        "Pregunta siempre: ¿cuánto pago cada semana?, ¿cuánto pago en total?, ¿qué pasa si me atraso? Si no te lo explican claro, no firmes.",
        "Hay organizaciones que dan préstamos pequeños a emprendedores sin historial de crédito. Compara antes de decidir.",
      ],
      en: [
        "A loan can help you grow, but only if your business already makes enough profit to pay it.",
        "Always ask: how much do I pay each week? How much in total? What if I'm late? If they don't explain clearly, don't sign.",
        "Some organizations give small loans to entrepreneurs with no credit history. Compare before you decide.",
      ],
    },
    keys: { es: ["Primero que el negocio deje ganancia", "Pregunta el total a pagar", "Compara opciones"], en: ["First, profit", "Ask the total cost", "Compare options"] },
  },
  {
    id: "biz_formal_mx",
    places: ["mx"],
    title: { es: "Tu negocio en regla en México", en: "Your business in order in Mexico" },
    icon: "file-text",
    minutes: 3,
    body: {
      es: [
        "Darte de alta en el SAT te deja dar facturas, vender a empresas y pedir préstamos más fácil.",
        "Si vendes poco, el RESICO es un régimen sencillo: pagas del 1% al 2.5% de lo que cobras cada mes. Necesitas tu RFC y tu e.firma.",
        "Si contratas a alguien, regístralo en el IMSS. Y revisa con tu municipio qué licencia necesitas para vender. Pide orientación gratis antes de pagarle a un gestor.",
      ],
      en: [
        "Registering with the SAT lets you issue invoices, sell to companies and get loans more easily.",
        "If you sell little, RESICO is a simple regime: you pay 1% to 2.5% of what you charge each month. You need your RFC and e.firma.",
        "If you hire someone, register them with IMSS. And check with your municipality which license you need to sell. Get free guidance before paying a middleman.",
      ],
    },
    keys: { es: ["Alta en el SAT", "RESICO: del 1% al 2.5%", "Registra a tus trabajadores en el IMSS"], en: ["Register with the SAT", "RESICO: 1% to 2.5%", "Register workers with IMSS"] },
  },
];

export const BIZ_NEEDS: NeedItem[] = [
  { id: "todos", label: { es: "Todo", en: "All" }, icon: "star" },
  { id: "empezar", label: { es: "Empezar o crecer", en: "Start or grow" }, icon: "sprout" },
  { id: "permisos", label: { es: "Permisos", en: "Permits" }, icon: "file-text" },
  { id: "prestamos", label: { es: "Préstamos", en: "Loans" }, icon: "landmark" },
  { id: "asesoria", label: { es: "Asesoría gratis", en: "Free advice" }, icon: "users" },
  { id: "impuestos", label: { es: "Impuestos", en: "Taxes" }, icon: "scale" },
];

export const BIZ_RESOURCES: Resource[] = [
  {
    id: "sbs", icon: "store", free: true,
    places: ["nyc"],
    name: { es: "Servicios para Pequeños Negocios de NYC (SBS)", en: "NYC Small Business Services (SBS)" },
    what: { es: "La ciudad te ayuda gratis: cómo abrir tu negocio, permisos, ayuda legal gratis, cursos y cómo conseguir financiamiento. Pide atención en español.", en: "Free help from the city: opening your business, permits, free legal help, courses and financing. Ask for help in Spanish." },
    needs: ["empezar", "permisos", "prestamos", "asesoria"],
    phone: { tel: "+18887274692", show: "888-SBS-4NYC (888-727-4692)" },
    web: { href: "https://www.nyc.gov/site/sbs/businesses/contact.page", show: "nyc.gov/sbs" },
  },
  {
    id: "bizexpress", icon: "file-text", free: true,
    places: ["nyc"],
    name: { es: "NYC Business Express", en: "NYC Business Express" },
    what: { es: "Página de la ciudad para saber qué permisos y licencias necesita tu tipo de negocio.", en: "City website to find which permits and licenses your type of business needs." },
    needs: ["permisos", "empezar"],
    web: { href: "https://nyc-business.nyc.gov/nycbusiness/", show: "nyc-business.nyc.gov" },
  },
  {
    id: "score", icon: "users", free: true,
    places: ["nyc"],
    name: { es: "SCORE Nueva York (mentores)", en: "SCORE New York City (mentors)" },
    what: { es: "Mentores voluntarios con experiencia en negocios te asesoran gratis, uno a uno.", en: "Volunteer mentors with business experience advise you for free, one-on-one." },
    needs: ["asesoria", "empezar"],
    web: { href: "https://www.score.org/newyorkcity", show: "score.org/newyorkcity" },
  },
  {
    id: "svp", icon: "shopping-cart", free: true,
    places: ["nyc"],
    name: { es: "Street Vendor Project (vendedores ambulantes)", en: "Street Vendor Project (street vendors)" },
    what: { es: "Organización de vendedores ambulantes de Nueva York: te orienta sobre permisos, multas y tus derechos para vender en la calle.", en: "New York street vendors' organization: guidance on permits, tickets and your rights to sell on the street." },
    needs: ["permisos", "asesoria"],
    web: { href: "https://svp.urbanjustice.org", show: "svp.urbanjustice.org" },
  },
  {
    id: "grameen", icon: "landmark", free: false,
    places: ["us"],
    name: { es: "Grameen America (préstamos pequeños)", en: "Grameen America (small loans)" },
    what: { es: "Préstamos pequeños para emprendedoras en grupo, sin necesitar historial de crédito. Primer préstamo de $500 a $2,500, a pagar cada semana. Tiene interés.", en: "Small group loans for entrepreneurs, no credit history needed. First loan $500 to $2,500, paid weekly. It has interest." },
    needs: ["prestamos"],
    web: { href: "https://grameenamerica.org/request-a-loan", show: "grameenamerica.org" },
    note: { es: "Compara el interés antes de firmar.", en: "Compare the interest before signing." },
  },
  {
    id: "taxprep_biz", icon: "scale", free: true,
    places: ["nyc"],
    name: { es: "Preparación de impuestos gratis (NYC Free Tax Prep)", en: "NYC Free Tax Prep" },
    what: { es: "Te ayudan gratis con tus impuestos si ganas hasta $68,000 al año (o $97,000 con dependientes). Pregunta si pueden incluir lo de tu negocio.", en: "Free tax help if you earn up to $68,000 a year ($97,000 with dependents). Ask if they can include your business." },
    needs: ["impuestos"],
    phone: { tel: "311", show: "311" },
    web: { href: "https://nyc.gov/TaxPrep", show: "nyc.gov/TaxPrep" },
  },
  {
    id: "consulado_biz", icon: "building-2", free: true,
    places: ["nyc", "ny"],
    name: { es: "Consulado General de México en Nueva York", en: "Consulate General of Mexico in New York" },
    what: { es: "Orientación para mexicanos y conexión con programas para emprendedores.", en: "Guidance for Mexicans and connections to entrepreneur programs." },
    needs: ["asesoria", "empezar"],
    phone: { tel: "+12122176400", show: "(212) 217-6400" },
    web: { href: "https://consulmex.sre.gob.mx/nuevayork/", show: "consulmex.sre.gob.mx/nuevayork" },
  },
  // ----- Anywhere in the US -----
  {
    id: "sba", icon: "store", free: true, places: ["usother"],
    name: { es: "Administración de Pequeños Negocios (SBA)", en: "Small Business Administration (SBA)" },
    what: { es: "La agencia federal para pequeños negocios: cómo empezar, centros de ayuda gratis cerca de ti y préstamos respaldados por el gobierno. Tiene información en español.", en: "The federal agency for small businesses: how to start, free help centers near you and government-backed loans. Information in Spanish." },
    needs: ["empezar", "prestamos", "asesoria", "permisos"],
    web: { href: "https://www.sba.gov/es", show: "sba.gov/es" },
  },
  {
    id: "score_us", icon: "users", free: true, places: ["usother"],
    name: { es: "SCORE (mentores gratis)", en: "SCORE (free mentors)" },
    what: { es: "Mentores voluntarios con experiencia en negocios te asesoran gratis, uno a uno, en todo el país.", en: "Volunteer mentors with business experience advise you for free, one-on-one, nationwide." },
    needs: ["asesoria", "empezar"],
    web: { href: "https://www.score.org", show: "score.org" },
  },
  {
    id: "vita_biz", icon: "scale", free: true, places: ["usother"],
    name: { es: "Ayuda gratis con impuestos (VITA del IRS)", en: "Free tax help (IRS VITA)" },
    what: { es: "Voluntarios certificados te ayudan gratis con tus impuestos. Pregunta si pueden incluir lo de tu negocio.", en: "Certified volunteers help with your taxes for free. Ask whether they can include your business." },
    needs: ["impuestos"],
    phone: { tel: "+18009069887", show: "1-800-906-9887" },
    web: { href: "https://www.irs.gov/vita", show: "irs.gov/vita" },
  },
  // ----- México -----
  {
    id: "sat_resico", icon: "scale", free: true, places: ["mx"],
    name: { es: "SAT: régimen RESICO", en: "SAT: RESICO tax regime" },
    what: { es: "Si trabajas por tu cuenta y vendes poco, el RESICO te deja pagar del 1% al 2.5% de lo que cobras. Te orientan gratis para darte de alta, sacar tu RFC y hacer facturas.", en: "If you work for yourself and sell little, RESICO lets you pay 1% to 2.5% of what you charge. Free guidance to register, get your RFC and issue invoices." },
    needs: ["impuestos", "permisos", "empezar"],
    phone: { tel: "+525562722728", show: "MarcaSAT 55 627 22 728" },
    web: { href: "https://www.sat.gob.mx", show: "sat.gob.mx" },
  },
  {
    id: "nafin", icon: "landmark", free: true, places: ["mx"],
    name: { es: "Nacional Financiera (Nafin)", en: "Nacional Financiera (Nafin)" },
    what: { es: "Banco del gobierno para negocios: programas de crédito a través de bancos e intermediarios, y cursos gratis para emprendedores.", en: "Government development bank for businesses: credit programs through banks and lenders, and free courses for entrepreneurs." },
    needs: ["prestamos", "asesoria", "empezar"],
    web: { href: "https://www.nafin.com", show: "nafin.com" },
  },
  {
    id: "imss_patron", icon: "users", free: true, places: ["mx"],
    name: { es: "IMSS: si contratas a alguien", en: "IMSS: if you hire someone" },
    what: { es: "Si tienes trabajadores, regístralos en el IMSS. Te orientan gratis sobre cómo darlos de alta y cuánto pagar.", en: "If you have workers, register them with IMSS. Free guidance on how to register them and what to pay." },
    needs: ["permisos", "asesoria"],
    phone: { tel: "+528006232323", show: "800 623 2323" },
    web: { href: "https://www.imss.gob.mx", show: "imss.gob.mx" },
  },
  {
    id: "condusef_biz", icon: "shield-alert", free: true, places: ["mx"],
    name: { es: "Condusef: antes de pedir un préstamo", en: "Condusef: before taking a loan" },
    what: { es: "Revisa que la financiera esté registrada y compara el costo total (CAT) antes de firmar. También recibe quejas.", en: "Check that the lender is registered and compare the total cost (CAT) before signing. They also take complaints." },
    needs: ["prestamos"],
    phone: { tel: "+525553400999", show: "55 5340 0999" },
    web: { href: "https://www.condusef.gob.mx", show: "condusef.gob.mx" },
  },
];
