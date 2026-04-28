/** Full site copy (ES primary + EN). Access arrays via dictionaries[locale].… or useLocale().t for dot paths to strings only. */

export type Locale = "es" | "en";

export const dictionaries = {
  es: messagesEs(),
  en: messagesEn(),
} as const;

/* eslint-disable max-len */

function messagesEs() {
  return {
    nav: {
      home: "Inicio",
      about: "About",
      services: "Servicios",
      team: "Team",
      blog: "Blog",
      contact: "Contacto",
    },
    breadcrumbAria: "Migas de pan",
    breadcrumbHome: "Home",
    breadcrumbs: {
      "privacy-policy": "Política de privacidad",
      herramientas: "Herramientas",
      qr: "QR",
      paleta: "Paleta",
      "aspect-ratio": "Relación de aspecto",
    },
    footer: {
      taglineHeading: "hablemos.",
      taglineBody:
        "Transformamos ideas en productos digitales que convierten. Desde una landing puntual hasta una arquitectura completa de marca + sitio + operación.",
      navServicios: "SERVICIOS",
      navProceso: "PROCESO",
      navEquipo: "EQUIPO",
      navContacto: "CONTACTO",
      navBlog: "BLOG",
      ctaStart: "empezar proyecto +",
      rights: "LAS GIRLS+ · TODOS LOS DERECHOS RESERVADOS",
      privacy: "Privacidad",
      terms: "Términos",
    },
    lang: {
      es: "ES",
      en: "EN",
      label: "Idioma",
    },
    menu: {
      menu: "Menú",
      close: "Cerrar",
      ariaOpen: "Abrir menú",
      ariaClose: "Cerrar menú",
      emptyItems: "Sin items",
      socialsTitle: "Socials",
      goTo: "Ir a {label}",
    },
    marquee: {
      sr: "LAS GIRLS+ · BRANDING · TECH · ESTRATEGIA · PRODUCTO",
      items: [
        "LAS GIRLS+",
        "CUMBIA VISUAL",
        "MATE Y CODIGO",
        "ACOMPAÑAMIENTO",
        "PRODUCTOS REALES",
        "TECH Y RITMO",
      ],
    },
    hero: {
      line1a: "SOLUCIONES DIGITALES",
      line1b: "QUE",
      rotating: ["FUNCIONAN", "VENDEN", "ESCALAN"],
      accent: "Mandale cumbia visual",
      body: `Las girls 💖🧉 somos software, brand y product factory;
junto a nuestro team diseñamos, construimos y lanzamos productos digitales completos
de la idea a algo que funciona—: branding, UX/UI, desarrollo, sistemas y contenido, todo conectado.
No somos una agencia más: nos metemos con vos en el proceso y te acompañamos para convertir tu idea en algo real.`,
      ctaPrimary: "HABLEMOS DE TU IDEA",
      ctaSecondary: "VER CÓMO TRABAJAMOS",
    },
    ideaImpact: {
      kicker: "02 - Idea Ready Impact",
      curved: "TU IDEA LISTA HOY ✦ ",
      title: "TU IDEA",
      subtitle: "Lista hoy",
      ribbon: "SIN VUELTAS",
      line1: "No necesitas meses y meses de reuniones.",
      line2: "Si ya tenés marca, textos e imágenes, lo bajamos a tierra rápido y con criterio.",
    },
    methodology: {
      eyebrow: "03 - Procesos",
      title: "TRABAJAR CON NOSOTRAS",
      subtitle: "Es así de simple.",
      card1Title: "DIAGNÓSTICO Y\nPRIMERA MEET",
      card2Title: "DEFINIMOS QUÉ\nVA PRIMERO",
      card3Title: "ROADMAP Y\nCONSTRUCCIÓN",
      block1: `Arrancamos con una conversación real.
Queremos entender tu idea, qué querés hacer, a dónde querés llegar y en qué punto estás hoy.

No hace falta que lo tengas todo claro.
Tambien queremos escuchar tus inquietudes, tus preocupaciones, tus dudas.
Porque no existen preguntas tontas.

Este ida y vuelta es clave para poder armar una propuesta bien pensada, alineada a vos, a tus tiempos y a tu presupuesto.

Desde el día uno no estás solo:
nos metemos con vos en el proceso y te acompañamos de punta a punta.`,
      block2: `Una vez que entendimos todo, bajamos a tierra.
Separamos lo urgente de lo importante,
ordenamos ideas y armamos un camino lógico para avanzar.

Desarmamos el proyecto en partes:
qué va primero, qué puede esperar y qué realmente mueve el resultado.

La idea es que podamos trabajar juntas de forma clara, sin caos, sin sobrecarga y adaptadas a tus tiempos.

Si llegaste a las girls, no es casualidad.
Ahora hay que hacerlo bien.`,
      block3: `Con todo definido, armamos un plan a medida.

Trabajamos por etapas, con foco en avanzar, validar y ajustar sobre la marcha.
Nada de procesos rígidos que no se adaptan.

Diseño, desarrollo, contenido, sistemas:
todo conectado para que lo que estamos construyendo funcione de verdad.

Te acompañamos en cada decisión, en cada entrega y en cada paso hasta que eso que imaginaste se convierte en algo real.`,
    },
    servicesDisclaimer:
      "No trabajamos con paquetes rígidos. Cada proyecto combina servicios según su etapa, objetivo y presupuesto.",
    featuredCombos: [
      "Idea + validación",
      "Branding + landing",
      "Rediseño + estrategia + contenido",
      "App + sistema administrativo",
      "Redes + identidad + pauta",
      "Web + base de datos + automatizaciones",
    ],
    why: ["Acompañamiento real desde cero"],
    servicesGrid: {
      intro:
        "Estos son algunos de los trabajos que realizamos junto a nuestra red de aliados estratégicos. Según el proyecto, formamos el equipo necesario para diseñar, desarrollar y lanzar productos reales.",
      editorialGeneral:
        "No trabajamos solo ejecutando lo que nos piden. Muchas veces llegan ideas que parecen claras, pero primero hay que ordenar, priorizar y llevarlas a un sistema construible de verdad.",
      editorialReality:
        "No todo lo que parece simple de construir, lo es. Bajamos a tierra tiempos, costos y decisiones técnicas para evitar inversiones prematuras.",
      editorialAccompany:
        "Acompañamos desde el punto en el que estás. No necesitás saber programar ni tener todo definido para transformar una idea en producto real.",
      erroresComunes: [
        "Pensar que una app es el primer paso",
        "Querer resolver todo de una vez",
        "Copiar estructuras que no aplican",
        "No definir qué validar primero",
      ],
      eyebrowArchive: ["archivo", "servicios", "red de aliadas"],
      mainTitleLines: ["LO QUE", "PODEMOS", "CONSTRUIR"],
      kickerPrincipal: "archivo 01 / principal",
      kickerNetwork: "network / design / dev / launch",
      kickerFeatured: "combinación destacada",
      footerEdit: ["las girls edit.", "service dossier"],
      kickerService03: "servicio / 03",
      labelResuelve: "resuelve",
      labelEjemplos: "ejemplos",
      kickerArchivo04: "archivo 04",
      kickerCierre: "cierre / 06",
      footerEditorial: ["las girls editorial system", "issue 2026"],
    },
    cards: [
      {
        title: "Branding e identidad",
        microcopy: "Marcas claras, memorables y coherentes.",
        description:
          "Construimos o refinamos tu identidad para que tu marca sea reconocible, consistente y funcional en todos los canales.",
        solves:
          "Confusión de posicionamiento, estética inconsistente y baja recordación.",
        examples: "Rebrand, sistema visual, tono verbal, lineamientos de marca.",
      },
      {
        title: "Diseño y desarrollo web",
        microcopy: "Sitios con dirección estética y foco en conversión.",
        description:
          "Diseñamos y desarrollamos sitios rápidos, claros y escalables, con arquitectura de contenido y experiencia pensada para tu negocio.",
        solves:
          "Webs desactualizadas, lentas o que no convierten consultas.",
        examples: "Sitio institucional, landing de validación, web comercial con CMS.",
      },
      {
        title: "Desarrollo de apps",
        microcopy: "Producto digital con visión de negocio.",
        description:
          "Acompañamos desde definición funcional hasta implementación de aplicaciones con backend, admin y datos.",
        solves:
          "Procesos manuales, ideas de app sin validación o sin roadmap técnico.",
        examples: "MVP, app interna, app cliente + panel administrativo.",
      },
      {
        title: "Social media & contenido",
        microcopy: "Presencia sostenida con narrativa de marca.",
        description:
          "Definimos estrategia de contenido, calendarización, piezas y lineamientos para comunicar con claridad y consistencia.",
        solves: "",
        examples: "Estrategia mensual, guiones, contenidos de lanzamiento.",
      },
      {
        title: "Marketing digital, pauta y SEO",
        microcopy: "Visibilidad medible con intención.",
        description:
          "Conectamos posicionamiento, performance y optimización para atraer tráfico relevante y generar oportunidades concretas.",
        solves:
          "Dependencia de recomendaciones, baja captación, resultados poco trazables.",
        examples: "Google/Meta Ads, SEO on-page, optimización de embudos.",
      },
      {
        title: "Asesoría estratégica y dirección creativa",
        microcopy: "Criterio para decidir y ejecutar.",
        description:
          "Cuando hay muchas ideas y poco orden, bajamos todo a un plan accionable. Te ayudamos a priorizar sin perder visión.",
        solves:
          "Bloqueo estratégico, decisiones reactivas y ejecución dispersa.",
        examples:
          "Discovery, roadmap, auditoría de presencia digital, dirección integral.",
      },
    ],
    team: {
      eyebrow01: "01 — Equipo extendido",
      h2: "Nosotras somos la cara de Las Girls+ pero hay más",
      leadIn:
        "Trabajamos con una red real de especialistas en desarrollo, diseño y producto.",
      vosHablas: "Vos hablás con nosotras. ",
      armamosEquipo: "Nosotras armamos el equipo.",
      eyebrow02: "02 — Cómo funciona",
      sistemaP1Line1a: "No somos una dupla aislada ni una agencia inflada.",
      sistemaP1Line1bHighlight:
        "Somos el punto de entrada a un sistema de trabajo flexible.",
      sistemaP2:
        "Cada proyecto es distinto, por eso no forzamos estructuras fijas: definimos qué necesitás y sumamos los perfiles correctos en el momento justo.",
      specialistRosterEyebrow: "/ red de especialistas",
      equipoCrece:
        "El equipo crece o se ajusta según el alcance:",
      tags: [
        "DESARROLLO",
        "DISEÑO",
        "PRODUCTO",
        "AUTOMATIZACIONES",
        "AI",
        "CONTENIDO",
      ],
      modeloNetwork: "Network model",
      onDemand: "∞ on-demand",
      eyebrow03: "03 — La promesa",
      quoteVerb: "conversación",
      quoteRest:
        ",\n              pero detrás hay un equipo completo trabajando para que funcione.",
      quotePrefix: 'Tenés una sola ',
      profileAvailable: "Disponible",
      profileContact: "Ver perfil",
    },
    lanyard: {
      eyebrow: "04 — Tu pase de entrada",
      h2Prefix: "VIP Acceso ",
      h2Accent: "Total",
      body: "Tu tarjeta Las Girls+ no es decorativa. Es el acceso directo a un equipo que se arma a tu medida.",
      hint: "↓ Tirá del la tarjeta y mira la magia.",
      edition: "Las Girls+ / Pass · Edición 2026",
    },
    contactSection: {
      kicker: "05 — Hablemos",
      h2a: "Hablemos de tu idea",
      h2period: ".",
      accent: "Primera consulta sin costo.",
      footerLine: "/ Las Girls+ · Hablemos / 2026",
      reply: "↘ Te respondemos en 24/48hs",
      titlePlaceholder: "",
    },
    contactPage: {
      title: "Contanos en qué etapa está tu proyecto.",
      subtitle:
        "Si todavía no sabés qué servicio necesitás, también está perfecto. Te ayudamos a definir el mejor camino.",
      waValue: "Escribinos",
    },
    contactForm: {
      formEyebrow: "/ Formulario de contacto",
      tabActive: "↓ activo",
      tabInactive: "→ usar",
      tab01Title: "WhatsApp",
      tab01Sub: "Quiero que me contacten por WhatsApp.",
      tab02Title: "Email",
      tab02Sub: "Quiero que me contacten por email.",
      requestReceived: "Solicitud recibida",
      waSuccessTitleTe: "Te escribimos en breve",
      waSuccessBody:
        "Te vamos a escribir por WhatsApp para entender bien tu proyecto y acompañarte desde esta etapa.",
      btnClose: "Cerrar",
      btnAnother: "Enviar otro número",
      labelName: "Nombre",
      phName: "Ej. María González",
      labelWhatsapp: "WhatsApp",
      btnSendWa: "Enviar solicitud",
      btnSending: "Enviando...",
      sendingEmail: "Enviando...",
      btnSendEmail: "Enviar consulta",
      fullNameLabel: "Nombre completo",
      emailLabel: "Email",
      inquiryLabel: "Tipo de consulta",
      inquiryPlaceholder: "Seleccioná tipo de consulta",
      phoneLabel: "Teléfono",
      msgLabel: "Mensaje",
      msgPlaceholder:
        "Contanos tu idea, en qué etapa estás y qué necesitás.",
      phFullName: "Nombre y apellido",
      phEmail: "nombre@ejemplo.com",
      phPhone: "+54 9 ...",
      recvBadge: "✓ Recibido",
      inquiries: {
        general: "Consulta general",
        quote: "Quiero cotizar un servicio",
        strategy: "Necesito ayuda para definir qué hacer",
        branding: "Branding",
        web: "Sitio web",
        app: "App",
        socials: "Redes / contenido",
        marketing: "Marketing / pauta / SEO",
        other: "Otro",
      },
      errorSend:
        "No pudimos enviar tu consulta ahora. Probá nuevamente en unos minutos o escribinos por WhatsApp.",
      thankYou:
        "Gracias por escribirnos. Vamos a revisar tu consulta y responderte lo antes posible. Si tu idea todavía está verde, no pasa nada: también acompañamos esa etapa.",
      errorWa:
        "No pudimos guardar tu solicitud. Probá de nuevo en un momento.",
      whatsappInternalNote: "Solicita contacto inicial por WhatsApp.",
    },
    toolsTeaser: {
      bandLabel: "✦ Herramientas gratuitas",
      meta: "Sin registro · Gratis",
      verTodas1: "Ver",
      verTodas2: "todas",
      linkTools: "Herramientas",
      usarGratis: "Usar gratis",
    },
    tools: {
      hubTitle: "Herramientas",
      qr: {
        name: "Generador de QR",
        desc: "Crea códigos QR personalizados al instante.",
        detail: "URLs, textos, emails, contactos. Descargá en PNG.",
      },
      paleta: {
        name: "Generador de paleta",
        desc: "Genera escalas y combinaciones de color desde un HEX base.",
        detail: "Tints, shades, complementarios y análogos. Exportá PNG hasta 1000×1000.",
      },
      aspect: {
        name: "Relaciones de aspecto",
        desc: "Consultá tamaños y proporciones optimizadas para redes sociales.",
        detail:
          "Instagram, TikTok, YouTube, LinkedIn y más. Con calculadora.",
      },
      hubEyebrow: "✦ Utilidades digitales",
      hubAccent: "gratuitas.",
      hubIntro:
        "Utilidades simples para resolver cosas rápido. Sin registro. Misma lógica que en melonoriaga.com, adaptadas acá.",
      hubCountSuffix: "herramientas",
      hubUseBtn: "Usar herramienta",
      hubFooterLead: "¿Necesitás otra utilidad? Escribinos.",
      hubFooterContact: "Contactar ✦",
      toolTagFree: "GRATIS",
      qrPageTitle1: "Generador",
      qrPageAccent: "de QR.",
      qrAttributionFooter: "Qr gratis en lasgirlsplus.com",
      qrIntro:
        "Personalizá colores, tamaño hasta 1000×1000 px y fondo transparente para PNG.",
      qrIntroAttribution:
        " La imagen descargada incluye la leyenda «{line}» debajo del código. Para PNG sin esa línea, abrí esta página con ",
      qrIntroNoAttribution: " Modo sin leyenda en el PNG (freeQr).",
      qrTypeLegend: "Tipo de contenido",
      qrLabelContent: "Contenido",
      qrLabelSolidBg: "Fondo sólido",
      qrLabelTransparentQr: "QR + fondo transparente (un clic)",
      qrTransparentAlphaHelp: "El PNG lleva canal alpha: solo se ven los módulos del QR en el color que elijas.",
      qrCheckboxTransparent: "Fondo transparente en el PNG (alpha)",
      qrLabelQrColor: "Color del QR",
      qrLabelQrHex: "HEX del QR",
      qrLabelBgSolid: "Fondo (si no es transparente)",
      qrLabelSize: "Tamaño — {size}×{size} px",
      qrDownloadPng: "Descargar PNG",
      qrCopyPayload: "Copiar payload",
      qrCopied: "✓ Copiado",
      qrEmptyPrompt: "Ingresá contenido para generar el código.",
      qrAriaFgHex: "Color del QR en hexadecimal",
      qrTransparentBgLabel: "Transparente",
      qrFreeQrParamHint: "?freeQr=true",
      presetClassic: "Clásico",
      presetBeige: "Beige",
      presetPink: "Rosa",
      presetBlack: "Negro",
      presetIndigo: "Índigo",
      transpWhite: "Blanco",
      transpBlack: "Negro",
      transpPink: "Rosa",
      transpHintDark: "Para pegar sobre fondos oscuros",
      transpHintLight: "Sobre claros o estampas",
      transpHintBrand: "Marca Las Girls+",
      typeUrl: "URL",
      typeText: "Texto",
      typeEmail: "Email",
      typePhone: "Teléfono",
      phUrl: "https://ejemplo.com",
      phText: "Cualquier texto…",
      phEmail: "hola@ejemplo.com",
      phPhone: "+54 9 11 0000 0000",
      paletteMetaTitle: "Generador de paletas de color · Las Girls+",
      paletteMetaDesc:
        "Generá paletas armoniosas a partir de un hex. Colores extra, exportar PNG hasta 1000×1000, fondo transparente o sólido.",
      paletteTitle1: "Generador",
      paletteTitleAccent: "de paleta.",
      paletteIntro:
        "HEX base, colores extra, tints/shades y armonías. Exportá una grilla PNG hasta 1000×1000 con fondo sólido o transparente.",
      paletteBaseColour: "Color base",
      paletteExamplesLabel: "Ejemplos:",
      paletteCustomColours: "Colores custom (incluidos en la exportación)",
      paletteCustomHint: "",
      paletteHexField: "HEX",
      paletteAddBtn: "Agregar",
      paletteExportLegend: "Exportar imagen (PNG)",
      paletteExportWidth: "Ancho (100–1000)",
      paletteExportHeight: "Alto (100–1000)",
      paletteExportTransparentBg: "Fondo transparente",
      paletteExportSolidBgColour: "Color de fondo (si no es transparente)",
      paletteDownloadSamples: "Descargar PNG ({count} muestras)",
      paletteSwatchSection: "Base",
      paletteTints: "Tints — claro → base",
      paletteShades: "Shades — base → oscuro",
      paletteExtraCustom: "Tus colores extra",
      paletteHarmonies: "Armonías",
      harmComp: "Complementario",
      harmAnalogous: "Análogos",
      harmTriadic: "Triádicos",
      paletteLegendBaseMark: "BASE",
      paletteTip:
        "Clic en una muestra copia el HEX. La grilla exportada incluye tints, base, shades, armonías y tus colores custom.",
      aspectMetaTitle: "Calculadora de aspect ratio · Las Girls+",
      aspectMetaDesc:
        "Resoluciones exactas para 16:9, 4:3, TikTok, YouTube y más.",
      aspectTitle1: "Relaciones",
      aspectTitleAccent: "de aspecto.",
      aspectIntroMicro: "Tamaños para redes. Clic en una card para fijar el ratio en la calculadora.",
      aspectCalcHeading: "Calculadora",
      aspectRatioActive: "Ratio activo:",
      aspectModeWide: "Ingreso ancho",
      aspectModeTall: "Ingreso alto",
      aspectLabelWidePx: "Ancho (px)",
      aspectLabelTallPx: "Alto (px)",
      calcLabelHeight: "ALTO",
      calcLabelWidth: "ANCHO",
      calcResultHeading: "Resultado:",
      calcPlaceholderEg: "ej. 1200",
      aspectPlatformLabel: "Plataforma",
      aspectFormatsHeading: "{platform} — formatos ({count})",
      aspectFooterTip:
        "Clic en las dimensiones de una card las copia. Clic en la card activa el ratio en la calculadora.",
      copySwatchAria: "Copiar {hex}",
      calcComputedSuffix: "(calculado)",
      calcCustomHint: "(personalizado)",
    },
    teamPage: {
      metadataTitle: "Equipo",
      metadataDescription:
        "Conocé a Jean, Mel y la red de especialistas que acompaña cada proyecto.",
      badge: "equipo",
      headline: "Team",
      intro:
        "Jean y Mel son la cara visible de Las Girls+. Según cada desafío, sumamos una red de especialistas en desarrollo, diseño, branding, social media, contenido y audiovisual.",
      extendedEyebrow: "01 — Crew extendido",
      extendedLead:
        "Somos la cara de Las Girls+: hay mucho más detrás del día a día.",
      extendedBody1:
        "Movilizamos especialistas senior en desarrollo, diseño, estrategia, operación de producto, branding social y contenido.",
      extendedBody2: "Vos hablás con nosotras. Nosotras armamos el roster y coordinamos cada frente.",
      extendedBody3:
        "Jean marca la línea estratégica y creativa para identidades vivas — charlas internacionales, MADFA en Madrid y un rol activo junto a colegios y comunidades.",
      extendedBody4:
        "Mel baja esa visión a producto digital concreto: full‑stack, performance y claridad hasta el deploy — código hecho para vender.",
      profileCta: "Ver perfil",
    },
    teamEditorial: {
      specialties: "Especialidades",
      statYears: "años de experiencia",
      statBrands: "marcas",
      statTeam: "en el equipo",
      aboutVertical: "Sobre",
      bioEyebrow: "Bio",
      quoteEmDash: "— ·",
      whatDoes: "Qué hace",
      nextStepEyebrow: "¿Siguiente paso?",
      ctaTitleLine: "Empezá tu",
      ctaTitleAccent: "proyecto.",
      ctaBody:
        "Escribinos y armamos el equipo ideal para tu objetivo. Si {name} es quien mejor se adapta a lo que necesitás, avanzamos por ahí.",
      ctaContact: "Contactar al equipo",
      ctaHome: "Volver al inicio",
      alsoTeam: "También en el equipo",
    },
    vip: {
      codeUnavailable: "Código no disponible.",
      noConnection: "Sin conexión. Intentá de nuevo.",
      privacyRequired: "Aceptá el uso de tus datos para continuar.",
      successCoord:
        "Pronto nos vamos a contactar para coordinar tu descuento y armar el presupuesto según lo que nos contaste.",
      leadInWithCode:
        "Ingresá tu código VIP. Si es válido, te pedimos tus datos y un resumen del proyecto para presupuestar.",
      codeLabel: "Código",
      validating: "Validando…",
      validateBtn: "Validar código",
      codePrefix: "Código:",
      phoneLabel: "Teléfono / WhatsApp",
      projectQuestion: "¿Qué querés hacer con Las Girls+?",
      projectPlaceholder:
        "Contanos brevemente el proyecto, plazos y cualquier referencia útil.",
      privacyPrefix: "Acepto que Las Girls+ use estos datos para contactarme según la",
      privacyLink: "política de privacidad",
      successDiscount:
        "Pronto te vamos a contactar para darte tu descuento VIP y los próximos pasos.",
      leadDiscount:
        "Dejános tus datos. Te registramos como lead que quiere un código de descuento; el equipo te escribe cuando esté",
    },
    fab: { ariaBack: "Volver al hero" },
    aboutPage: {
      tag: "about",
      title: "Estrategia, criterio y ejecución con personalidad.",
      description:
        "Las Girls+ acompaña proyectos en distintas escalas con una lógica flexible: diagnóstico, roadmap y ejecución por frentes de trabajo según necesidad real.",
      principles: [
        "No imponemos un proceso lineal para todos.",
        "Tomamos decisiones con base estratégica, no por tendencia.",
        "Diseño y tecnología trabajan juntas desde el inicio.",
        "Cada entrega busca impacto real en negocio y comunicación.",
      ],
    },
    servicesPage: {
      h1: "Servicios",
      intro:
        "No vendemos paquetes rígidos. Combinamos frentes de trabajo según la etapa real de tu proyecto.",
      cta: "Consultar servicio",
    },
  } as const;
}

function messagesEn() {
  return {
    nav: {
      home: "Home",
      about: "About",
      services: "Services",
      team: "Team",
      blog: "Blog",
      contact: "Contact",
    },
    breadcrumbAria: "Breadcrumb",
    breadcrumbHome: "Home",
    breadcrumbs: {
      "privacy-policy": "Privacy Policy",
      herramientas: "Tools",
      qr: "QR",
      paleta: "Palette",
      "aspect-ratio": "Aspect ratio",
    },
    footer: {
      taglineHeading: "let’s talk.",
      taglineBody:
        "We turn ideas into digital products that convert—from a focused landing page to a full stack of brand + site + operations.",
      navServicios: "SERVICES",
      navProceso: "PROCESS",
      navEquipo: "TEAM",
      navContacto: "CONTACT",
      navBlog: "BLOG",
      ctaStart: "start a project +",
      rights: "LAS GIRLS+ · ALL RIGHTS RESERVED",
      privacy: "Privacy",
      terms: "Terms",
    },
    lang: {
      es: "ES",
      en: "EN",
      label: "Language",
    },
    menu: {
      menu: "Menu",
      close: "Close",
      ariaOpen: "Open menu",
      ariaClose: "Close menu",
      emptyItems: "No items",
      socialsTitle: "Socials",
      goTo: "Go to {label}",
    },
    marquee: {
      sr: "LAS GIRLS+ · BRANDING · TECH · STRATEGY · PRODUCT",
      items: [
        "LAS GIRLS+",
        "VISUAL VIBE",
        "MATTE & CODE",
        "PARTNERSHIP",
        "REAL PRODUCTS",
        "TECH WITH RHYTHM",
      ],
    },
    hero: {
      line1a: "DIGITAL SOLUTIONS",
      line1b: "THAT",
      rotating: ["WORK", "SELL", "SCALE"],
      accent: "Bring the visual groove",
      body: `We’re Las Girls 💖—software, brand, and product factory;
with our crew we design, build, and ship full digital products
from spark to shipped—brand, UX/UI, dev, systems, content, all wired together.
We’re not just another agency: we get in the ring with you and help turn ideas into reality.`,
      ctaPrimary: "LET’S TALK ABOUT YOUR IDEA",
      ctaSecondary: "SEE HOW WE WORK",
    },
    ideaImpact: {
      kicker: "02 - Idea Ready Impact",
      curved: "YOUR IDEA READY TODAY ✦ ",
      title: "YOUR IDEA",
      subtitle: "Ready today",
      ribbon: "NO BS",
      line1: "You don’t need months of endless meetings.",
      line2:
        "If you already have brand, copy, and assets, we ship fast—with taste and judgement.",
    },
    methodology: {
      eyebrow: "03 — Process",
      title: "WORKING WITH US",
      subtitle: "It’s really that straightforward.",
      card1Title: "DIAGNOSIS +\nFIRST CALL",
      card2Title: "WE DEFINE WHAT\nCOMES FIRST",
      card3Title: "ROADMAP +\nBUILD",
      block1: `We start with a real conversation.
We want to understand your vision, goals, constraints, and where you are today.

You don’t need every detail nailed.
We listen to doubts, friction, blind spots—no question is “wrong.”

That back-and-forth lets us tailor a grounded proposal—for your timing and budget.

From day one you’re not alone:
we plug into your process and stay with you end to end.`,
      block2: `Once we align, we get concrete.
Split urgent vs. important,
organize priorities, map a sane path forward.

Chunk the roadmap:
what ships first, what can wait, what actually moves outcomes.

Together we iterate with clarity—no chaotic thrash—cadence that fits how you work.

If you landed with us—it’s intentional.
Now we build it properly.`,
      block3: `With scope clear, we build a roadmap that fits how you operate.

Structured phases aimed at momentum, validation, iterations.
No brittle process that ignores reality.

Design, engineering, content, systems—woven so what we ship behaves in the wild.

Guidance at each milestone until what you envisioned exists in the real world.`,
    },
    servicesDisclaimer:
      "Rigid packages aren’t our thing—each initiative blends scope, goals, budget, timing.",
    featuredCombos: [
      "Idea + validation",
      "Brand + landing",
      "Refresh + strategy + content",
      "App + admin stack",
      "Social + identity + ads",
      "Site + DB + automation",
    ],
    why: ["Real strategic partnership from scratch"],
    servicesGrid: {
      intro:
        "These are snapshots of collaborations with our allied crew—whatever the mission, we assemble the right teammates to ship real products.",
      editorialGeneral:
        "Execution-only isn’t the default—we untangle ambiguous ideas until there’s something buildable—not deck theatre.",
      editorialReality:
        "Not everything that looks quick to build truly is—we surface timelines, budgets, risks so bets stay intentional.",
      editorialAccompany:
        "We meet teams where they are—no jargon gatekeeping—we help ideas graduate into tangible product.",
      erroresComunes: [
        "Assuming code is automatically step one",
        "Trying to solve everything at once",
        "Copy/pasting workflows that aren’t yours",
        "Skipping the first validation target",
      ],
      eyebrowArchive: ["archive", "services", "allied network"],
      mainTitleLines: ["WHAT WE", "CAN BUILD", "TOGETHER"],
      kickerPrincipal: "folder 01 / primary",
      kickerNetwork: "network / design / dev / launch",
      kickerFeatured: "highlighted combo",
      footerEdit: ["las girls edit.", "service dossier"],
      kickerService03: "service / 03",
      labelResuelve: "solves",
      labelEjemplos: "examples",
      kickerArchivo04: "folder 04",
      kickerCierre: "finale / 06",
      footerEditorial: ["las girls editorial system", "issue 2026"],
    },
    cards: [
      {
        title: "Branding & identity",
        microcopy: "Distinct, cohesive, repeatable brand systems.",
        description:
          "We forge or sharpen identity so positioning feels unmistakable across surfaces.",
        solves:
          "Muddy positioning, fractured visuals, low recall.",
        examples: "Rebrand, visual framework, tonal guardrails.",
      },
      {
        title: "Product design & web dev",
        microcopy: "Beautiful surfaces tuned for conversion loops.",
        description:
          "We craft fast, purposeful sites with architectures designed around your funnel.",
        solves:
          "Tired UX, leaky performance, stagnant leads.",
        examples: "Institutional flagship, landing tests, commerce builds.",
      },
      {
        title: "Native & web apps",
        microcopy: "Product thinking stitched to business reality.",
        description:
          "From functional definition through backend-ready apps with admin dashboards.",
        solves:
          "Manual ops, half-baked roadmaps, unvalidated MVP scope.",
        examples: "MVP rollout, ops tooling, client + ops consoles.",
      },
      {
        title: "Social & content rhythm",
        microcopy: "Steady presence with articulated narrative.",
        description:
          "Content strategy, planning, creative guardrails to stay consistent.",
        solves: "",
        examples: "Monthly playbook, launches, scripted campaigns.",
      },
      {
        title: "Performance marketing & SEO",
        microcopy: "Signal-rich visibility—not vanity metrics.",
        description:
          "We align acquisition, optimisation, optimisation loops for qualified demand.",
        solves:
          "Random referrals-only growth, leaky funnels.",
        examples: "Google/Meta buys, onsite SEO tuning, funnel cleanup.",
      },
      {
        title: "Consulting & creative direction",
        microcopy: "Decisions you can defend.",
        description:
          "When ideas pile up, we distill a battle-ready roadmap while protecting vision.",
        solves:
          "Strategic paralysis, reactive pivots.",
        examples: "Discoveries, roadmaps, audits, integrated direction.",
      },
    ],
    team: {
      eyebrow01: "01 — Extended crew",
      h2: "We’re the face of Las Girls+—and there’s more behind",
      leadIn:
        "We mobilise seasoned specialists spanning dev, design, strategy, product ops.",
      vosHablas: "You talk with us.",
      armamosEquipo: "We architect the roster.",
      eyebrow02: "02 — How it works",
      sistemaP1Line1a:
        "We’re neither isolated duo nor inflated agency fluff.",
      sistemaP1Line1bHighlight:
        "We’re your flexible entry ramp into networked delivery.",
      sistemaP2:
        "Projects differ—rather than cramming templated squads we wire the talents you truly need.",
      specialistRosterEyebrow: "/ specialist network",
      equipoCrece: "Talent flexes according to ambition:",
      tags: ["ENGINEERING", "DESIGN", "PRODUCT", "AUTOMATIONS", "AI", "CONTENT"],
      modeloNetwork: "Network model",
      onDemand: "∞ on-demand",
      eyebrow03: "03 — The promise",
      quoteVerb: "conversation",
      quoteRest:
        ",\n              while a multidisciplinary crew keeps momentum behind you.",
      quotePrefix: "You have a single ",
      profileAvailable: "Available",
      profileContact: "View profile",
    },
    lanyard: {
      eyebrow: "04 — VIP access pass",
      h2Prefix: "VIP Total ",
      h2Accent: "Access",
      body: "Your Las Girls+ credential isn’t decor—it’s literal access to a squad tailored to what you ship.",
      hint: "↓ Pull the badge—watch what happens.",
      edition: "Las Girls+ Pass · Edition 2026",
    },
    contactSection: {
      kicker: "05 — Let’s chat",
      h2a: "Let’s talk about your idea",
      h2period: ".",
      accent: "First consult complementary.",
      footerLine: "/ Las Girls+ · Conversation / 2026",
      reply: "↘ We reply within 24–48h",
      titlePlaceholder: "",
    },
    contactPage: {
      title: "Tell us what stage your project is in.",
      subtitle:
        "Not sure yet which service fits? Perfect—we’ll help map next steps.",
      waValue: "Message us",
    },
    contactForm: {
      formEyebrow: "/ Contact form",
      tabActive: "↓ active",
      tabInactive: "→ tap",
      tab01Title: "WhatsApp",
      tab01Sub: "I want to be contacted via WhatsApp.",
      tab02Title: "Email",
      tab02Sub: "I want to be contacted via email.",
      requestReceived: "Request received",
      waSuccessTitleTe: "You’ll hear from us shortly",
      waSuccessBody:
        "We’ll DM you on WhatsApp to clarify scope and keep progressing together.",
      btnClose: "Close",
      btnAnother: "Send another number",
      labelName: "Name",
      phName: "e.g., Alex Johnson",
      labelWhatsapp: "WhatsApp",
      btnSendWa: "Submit request",
      btnSending: "Sending...",
      sendingEmail: "Sending...",
      btnSendEmail: "Send inquiry",
      fullNameLabel: "Full name",
      emailLabel: "Email",
      inquiryLabel: "Inquiry type",
      inquiryPlaceholder: "Pick the closest match",
      phoneLabel: "Phone",
      msgLabel: "Message",
      msgPlaceholder:
        "Share intent, timelines, milestones, constraints—whatever helps.",
      phFullName: "First & last name",
      phEmail: "you@studio.com",
      phPhone: "+1 ...",
      recvBadge: "✓ Received",
      inquiries: {
        general: "General inquiry",
        quote: "I need scoped pricing",
        strategy: "Help deciding what ship first",
        branding: "Branding",
        web: "Website",
        app: "App",
        socials: "Social & content",
        marketing: "Performance / Ads / SEO",
        other: "Other",
      },
      errorSend:
        "Couldn’t send right now—try again shortly or WhatsApp us directly.",
      thankYou:
        "Thank you—we’ll reply as soon as we can. If the idea still feels fuzzy, zero stress—we co-create clarity too.",
      errorWa:
        "Couldn’t log that request yet—give it another try momentarily.",
      whatsappInternalNote: "Kickoff WhatsApp handshake requested.",
    },
    toolsTeaser: {
      bandLabel: "✦ Free tools",
      meta: "No signup · Forever free",
      verTodas1: "View",
      verTodas2: "all",
      linkTools: "Tools",
      usarGratis: "Use free",
    },
    tools: {
      hubTitle: "Tools",
      qr: {
        name: "QR Generator",
        desc: "Create tailored QR codes in seconds.",
        detail: "Links, plaintext, contacts. Export crisp PNG.",
      },
      paleta: {
        name: "Palette generator",
        desc: "Build scales off a HEX base.",
        detail: "Tints, shades, complements, analogous swatches.",
      },
      aspect: {
        name: "Aspect ratios",
        desc: "Reference sizes optimised for platforms.",
        detail: "IG, TikTok, YouTube, LinkedIn + calculators.",
      },
      hubEyebrow: "✦ Digital utilities",
      hubAccent: "free.",
      hubIntro:
        "Simple helpers to unblock you fast—no signup. Same backbone as melonoriaga.com, tuned here for Las Girls+.",
      hubCountSuffix: "tools",
      hubUseBtn: "Open tool",
      hubFooterLead: "Missing something? Ping us.",
      hubFooterContact: "Contact ✦",
      toolTagFree: "FREE",
      qrPageTitle1: "Generator",
      qrPageAccent: "QR.",
      qrAttributionFooter: "Free QR at lasgirlsplus.com",
      qrIntro:
        "Tweak colours, export up to 1000×1000 px PNG, toggle transparent backdrop.",
      qrIntroAttribution:
        " Downloads include footer line «{line}». For PNG sans line append ",
      qrIntroNoAttribution: " Mode without PNG footer.",
      qrTypeLegend: "Content type",
      qrLabelContent: "Content",
      qrLabelSolidBg: "Solid background",
      qrLabelTransparentQr: "QR + transparent background (single click)",
      qrTransparentAlphaHelp: "PNG has alpha—you only keep modules in tint you pick.",
      qrCheckboxTransparent: "PNG with transparent backdrop (alpha)",
      qrLabelQrColor: "QR colour",
      qrLabelQrHex: "QR HEX",
      qrLabelBgSolid: "Background (opaque)",
      qrLabelSize: "Size — {size}×{size} px",
      qrDownloadPng: "Download PNG",
      qrCopyPayload: "Copy payload",
      qrCopied: "✓ Copied",
      qrEmptyPrompt: "Add content before generating QR.",
      qrAriaFgHex: "QR colour hexadecimal",
      qrTransparentBgLabel: "Transparent",
      qrFreeQrParamHint: "?freeQr=true",
      presetClassic: "Classic",
      presetBeige: "Beige",
      presetPink: "Pink",
      presetBlack: "Black",
      presetIndigo: "Indigo",
      transpWhite: "White",
      transpBlack: "Black",
      transpPink: "Pink",
      transpHintDark: "On dark artwork",
      transpHintLight: "On light canvases",
      transpHintBrand: "Las Girls+ pink wash",
      typeUrl: "URL",
      typeText: "Text",
      typeEmail: "Email",
      typePhone: "Phone",
      phUrl: "https://example.com",
      phText: "Any text…",
      phEmail: "hello@example.com",
      phPhone: "+1 702 555 0199",
      paletteMetaTitle: "Palette generator · Las Girls+",
      paletteMetaDesc:
        "Harmonised palettes off a HEX. Custom swatches—export PNG grid up to 1000×1000 with translucent or opaque base.",
      paletteTitle1: "Generator",
      paletteTitleAccent: "palette.",
      paletteIntro:
        "Kick off HEX, stack extra swatches—tints, shades harmonics. PNG grid export up to 1000×1000 opaque or translucent.",
      paletteBaseColour: "Base colour",
      paletteExamplesLabel: "Samples:",
      paletteCustomColours: "Custom swatches",
      paletteCustomHint: "",
      paletteHexField: "HEX",
      paletteAddBtn: "Add swatch",
      paletteExportLegend: "Export PNG artwork",
      paletteExportWidth: "Width (100–1000)",
      paletteExportHeight: "Height (100–1000)",
      paletteExportTransparentBg: "Transparent backdrop",
      paletteExportSolidBgColour: "Background colour when opaque",
      paletteDownloadSamples: "Download PNG ({count} swatches)",
      paletteSwatchSection: "Baseline",
      paletteTints: "Tints · light→base",
      paletteShades: "Shades · base→deep",
      paletteExtraCustom: "Your extra swatches",
      paletteHarmonies: "Harmonics",
      harmComp: "Complementary",
      harmAnalogous: "Analogous",
      harmTriadic: "Triadic",
      paletteLegendBaseMark: "BASE",
      paletteTip:
        "Click any swatch to copy HEX. Exported grid bundles tints, core, shadows, harmonies, custom swatches.",
      aspectMetaTitle: "Aspect ratio toolkit · Las Girls+",
      aspectMetaDesc: "Benchmark dimensions for TikTok verticals, reels, thumbnails—fast.",
      aspectTitle1: "Aspect",
      aspectTitleAccent: "relationships.",
      aspectIntroMicro: "Specs for IG, TikTok, YouTube, LinkedIn and more—with helper calculator.",
      aspectCalcHeading: "Calculator",
      aspectRatioActive: "Locked ratio:",
      aspectModeWide: "Set width entry",
      aspectModeTall: "Set height entry",
      aspectLabelWidePx: "Width (px)",
      aspectLabelTallPx: "Height (px)",
      calcLabelHeight: "HEIGHT",
      calcLabelWidth: "WIDTH",
      calcResultHeading: "Result:",
      calcPlaceholderEg: "e.g. 1200",
      aspectPlatformLabel: "Platform",
      aspectFormatsHeading: "{platform} — formats ({count})",
      aspectFooterTip:
        "Tap dimensions on a card to copy. Selecting a preset syncs ratio in the calculator.",
      copySwatchAria: "Copy {hex}",
      calcComputedSuffix: "(calculated)",
      calcCustomHint: "(custom)",
    },
    teamPage: {
      metadataTitle: "Team",
      metadataDescription:
        "Meet Jean, Mel, and the specialist network powering every Las Girls+ build.",
      badge: "team",
      headline: "Team",
      intro:
        "Jean and Mel are the face of Las Girls+. For each challenge we plug in seasoned specialists spanning development, branding, UX, social storytelling, AV, operations, and experimentation.",
      extendedEyebrow: "01 — Extended crew",
      extendedLead:
        "We’re the face of Las Girls+—and there’s more behind the scenes.",
      extendedBody1:
        "We mobilise senior specialists spanning dev, design, strategy, product ops—whoever ships the outcome fastest.",
      extendedBody2: "You talk with us—we architect and coordinate the roster.",
      extendedBody3:
        "Jean fronts brand narratives with global pedigree—MADFA, TED-style stages, alliances with Palermo Uni, Pantone LATAM chapters, and WEN’s European roster.",
      extendedBody4:
        "Mel carries that ethos into resilient software—full‑stack deployments, ruthless clarity, optimisation before launch hype.",
      profileCta: "View profile",
    },
    teamEditorial: {
      specialties: "Specialties",
      statYears: "years of experience",
      statBrands: "brands",
      statTeam: "crew depth",
      aboutVertical: "About",
      bioEyebrow: "Bio",
      quoteEmDash: "— ·",
      whatDoes: "What",
      nextStepEyebrow: "Ready when you are?",
      ctaTitleLine: "Kick off your",
      ctaTitleAccent: "project.",
      ctaBody:
        "Say hi and we assemble the best squad for the mission. When {name} is the standout match—we move forward.",
      ctaContact: "Contact the crew",
      ctaHome: "Back home",
      alsoTeam: "Also on the team",
    },
    editorialOverridesEn: {
        jean: {
          role: "BRANDING & DESIGN",
          roleLabel: "Head of Brand & Creative Direction",
          tagline: "brands worth falling for.",
          headline: "It's not\njust design—\nit's [[Identity]]",
          skills: ["Visual identity", "Branding", "Social design"],
          bio: [
            "Hey sexy! I'm Jean—advertising designer and Head of Brand focused on tech-forward brand systems across Europe, the US, and Latin America.",
            "I'm the host and presenter of MADFA (Madrid Film Awards)—an IMDb-qualifying festival with pathways toward Oscar-category recognition spanning audiovisual storytellers globally.",
            "I also help produce international moments like TED and Fuckup Nights.",
            "Every Thursday you'll find me on Desayuno con Diseñadores live via YouTube, Twitch, TikTok—with Universidad de Palermo, Trimarchi Festival, Pantone Argentina among our supporters.",
            "I'm ambassador/mentor and European delegate for WEN (Women Entrepreneur Network), rooted in Florida, USA.",
          ],
          quote:
            "Brands behave like humans—every one carries a storyline worth unpacking.",
          expertise: [
            {
              label: "BRANDING",
              desc: "High-contrast visuals paired with ruthless strategic clarity—you own unmistakable swagger.",
            },
            {
              label: "COMMUNICATION",
              desc: "I help distill what you truly need to articulate so resonance outpaces noise.",
            },
            {
              label: "STRATEGY",
              desc: "Momentum with guardrails—I ensure each decision ladders to commercial truth.",
            },
            {
              label: "MENTORING",
              desc: "Partnerships calibrated for sustainable growth—with discipline, pacing, optimism.",
            },
          ],
        },
        mel: {
          role: "PRODUCT BUILDER",
          roleLabel: "Full-stack Engineer & Product Architect",
          tagline: "code that monetises ambition.",
          headline: "The mind\nbehind the\ncode.",
          skills: ["React & Node.js", "Landing systems", "Web apps", "UI/UX"],
          bio: [
            "I'm obsessed with stitching digital experiences end-to-end—architecture through launch polish.",
            "Conversion, clarity, and performance lead my builds—beautiful means nothing unless it survives production reality.",
            "Strategy, engineering, rigorous product instincts keep ideas tethered—scalable instrumentation first.",
            "I shepherd releases from discovery to launch—with technical fidelity and ruthless business calibration.",
          ],
          quote:
            "Shipping code matters only when we're shipping usable, durable, monetisable artefacts.",
          expertise: [
            {
              label: "FRONTEND",
              desc: "React / Next ecosystems with editorial sophistication—rapid, accessible skins that stay on-brand.",
            },
            {
              label: "BACKEND",
              desc: "Node.js, APIs, data layers tuned for elasticity while remaining maintainable long-term.",
            },
            {
              label: "PRODUCT",
              desc: "Architectural instincts paired with ruthless prioritisation so scope maps to observable outcomes.",
            },
            {
              label: "UX / UI",
              desc: "Clarity-forward interactions—beautiful surfaces must accelerate conversion—not wallpaper it.",
            },
          ],
        },
    },
    vip: {
      codeUnavailable: "That code isn’t available.",
      noConnection: "Connection issue—try again.",
      privacyRequired: "Accept processing to continue.",
      successCoord:
        "We’ll follow up shortly to coordinate your discount scope and quoting.",
      leadInWithCode:
        "Drop your VIP token—validated codes unlock intake for tailored estimates.",
      codeLabel: "Code",
      validating: "Validating…",
      validateBtn: "Validate code",
      codePrefix: "Code:",
      phoneLabel: "Phone / WhatsApp",
      projectQuestion: "What should Las Girls+ help you tackle?",
      projectPlaceholder:
        "Outline goals, timelines, inspirations—anything that matters.",
      privacyPrefix:
        "I agree Las Girls+ may process this data per the ",
      privacyLink: "privacy policy",
      successDiscount:
        "We’ll be in touch with VIP perks plus next hops.",
      leadDiscount:
        "Tell us where to ping you—we’ll notify the crew as soon as the drop is approved.",
    },
    fab: { ariaBack: "Back to hero" },
    aboutPage: {
      tag: "about",
      title: "Strategy, backbone, flair.",
      description:
        "Las Girls+ supports initiatives at varying scales—with flexible choreography: diagnostics, roadmap, phased execution calibrated to urgency.",
      principles: [
        "No forced linear playbook for everyone.",
        "Choices grounded in narrative + evidence—not gimmicks.",
        "Design & engineering riff together early.",
        "Every sprint aims for observable business resonance.",
      ],
    },
    servicesPage: {
      h1: "Services",
      intro:
        "Rigid packages aren’t our thing—we combine workstreams aligned with where your product actually sits.",
      cta: "Ask about this",
    },
  } as const;
}
