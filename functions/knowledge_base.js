/**
 * Brain Branding - Base de Conocimiento Maestra (Knowledge Base RAG)
 * Arsenal Completo de 60 Sugerencias + Generador Dinámico de Demos Personalizados
 * Inspirada en la metodología y visión de Juanpe Navarro (Tribu Divisual - España)
 */

module.exports = {
  agencia: {
    nombre: "Brain Branding",
    eslogan: "Empoderando Marcas, Reprogramando Mentes",
    metodologia: "Arquitectura Digital con Motor IA Inspirada en Juanpe Navarro (Tribu Divisual)",
    sitioWeb: "https://brainbranding.com.mx",
    whatsappOficial: "+52 771 233 9238",
    contactoUrl: "https://wa.me/527712339238",
    ubicacionGoogleMaps: "https://share.google/xOCfU6TpcXxlANgXS",
    telegramBot: "@Brainbranding_bot"
  },

  // MOTOR DE DEMOS PERSONALIZADOS DINÁMICOS
  generadorDemos: {
    instruccion: "Cuando un prospecto mencione el nombre o giro de su negocio, generarle inmediatamente su enlace personalizado de demostración en vivo.",
    getUrlDemo: (nombreNegocio) => `https://brainbranding.com.mx/?negocio=${encodeURIComponent(nombreNegocio)}`,
    respuestaTipo: (nombreNegocio, giro) => `🚀 ¡Increíble! He generado la demostración interactiva en tiempo real para *${nombreNegocio}*.\n\nAl ingresar, verás los simuladores adaptados con el nombre de tu empresa:\n\n🌐 *Ver Demo de ${nombreNegocio}:*\nhttps://brainbranding.com.mx/?negocio=${encodeURIComponent(nombreNegocio)}`
  },

  // PILAR CORE 1: LOS 3 SERVICIOS PRINCIPALES CON MOTOR IA
  pilares: {
    asistentesPersonalesIA: {
      titulo: "🤖 Asistentes Personales con Inteligencia Artificial (Agentes Cognitivos 24/7)",
      descripcion: "Agentes cognitivos autónomos que comprenden contexto e intención real sin depender de árboles rígidos aburridos. Transcriben notas de voz en milisegundos, envían catálogos/PDFs en tiempo real, filtran spam de forma inteligente y derivan prospectos calificados al WhatsApp de un ejecutivo cuando están listos para cerrar.",
      diferenciador: "Tono 100% humano, imperceptible como robot, integrado a la base de conocimiento de tu empresa y CRM."
    },
    softwareAMedidaIA: {
      titulo: "💻 Software a la Medida con Motor de Inteligencia Artificial (ERP / POS / CRM)",
      descripcion: "Eliminamos el 'Efecto Frankenstein' de pagar 5 programas desconectados. Creamos plataformas integradas a la medida exacta de tu negocio. Puntos de Venta (POS) 100% móviles desde cualquier celular o tablet sin pagar rentas por terminal, inventarios predictivos con IA, firmas digitales en pantalla para arqueos de caja, facturación CFDI e infraestructura resiliente que funciona sin internet.",
      diferenciador: "Operación 100% móvil, cero licencias por dispositivo y respaldos automáticos en la nube."
    },
    paginasWebIA: {
      titulo: "🌐 Páginas y Aplicaciones Web Inteligentes (Diseño Disruptivo de Alta Conversión)",
      descripcion: "Plataformas web de impacto visual 'WOW' con estética futurista (glassmorphism, micro-animaciones) y velocidad de carga instantánea (98+ en Google Lighthouse). Formularios dinámicos con IA y posicionamiento SEO semántico que convierte visitantes en clientes desde los primeros 5 segundos.",
      diferenciador: "Diseño premium estilo Tribu Divisual, conversión acelerada por IA y experiencia inmersiva."
    }
  },

  // PILAR CORE 2: CONOCIMIENTO DE MERCADO Y COMPETENCIA
  competencia: {
    softrestaurant: {
      nombre: "Soft Restaurant",
      analisis: "Software legacy tradicional en México.",
      respuestaRecomendada: "Soft Restaurant es conocido pero rígido. Con Brain Branding ves tus ventas en celular en vivo y atiendes pedidos por WhatsApp con IA sin comisiones. 🚀 ¿Usan versión local o nube?"
    },
    micros_clover: {
      nombre: "Micros / Clover",
      analisis: "Rentas por terminal y contratos forzosos.",
      respuestaRecomendada: "Micros y Clover atan a contratos forzosos y rentas por terminal. Con nosotros mantienes la misma potencia empresarial sin pagar rentas por dispositivo y con IA directa en WhatsApp. 🚀"
    },
    aspel_suite: {
      nombre: "Aspel (SAE / COI / NOI)",
      analisis: "Sistemas contables tradicionales muy rígidos.",
      respuestaRecomendada: "Aspel es excelente para contabilidad dura, pero complejo en celulares. Nosotros modernizamos la interfaz para que tu equipo opere 100% móvil y con asistencia de IA. 💼"
    },
    pos_genericos: {
      nombre: "Puntos de Venta Chinos / Genéricos",
      analisis: "Equipos y software genéricos sin garantía.",
      respuestaRecomendada: "Los puntos de venta genéricos fallan cuando no hay soporte local. Con nosotros cuentas con soporte técnico local 24/7, respaldo en la nube y garantía por contrato. 🔒"
    },
    toast_square: {
      nombre: "Toast POS / Square",
      analisis: "Cobran comisiones porcentuales sobre cada venta.",
      respuestaRecomendada: "Toast y Square cobran comisiones por transacción. Con nosotros tienes cuota plana sin comisiones sobre tus ventas. 📈"
    },
    shopify_woocommerce: {
      nombre: "Shopify / WooCommerce",
      analisis: "Tiendas en línea desconectadas del inventario físico.",
      respuestaRecomendada: "Shopify es bueno para e-commerce, pero nosotros sincronizamos tu inventario físico del local con tu tienda en línea y WhatsApp IA en tiempo real. 🔄"
    },
    odoo: {
      nombre: "Odoo / ERPs Complejos",
      analisis: "Demasiado complejos, requieren meses de consultoría.",
      respuestaRecomendada: "Odoo requiere meses de consultoría costosa. Nosotros entregamos sistemas a la medida simplificados y con IA en 12 a 24 días. ⏱️"
    },
    eleventa: {
      nombre: "Eleventa",
      analisis: "Práctico en abarrotes pequeños pero sin visión multi-sucursal ni IA.",
      respuestaRecomendada: "Eleventa es práctico para empezar. Nosotros modernizamos el sistema para ver el inventario de todas tus sucursales en vivo desde tu celular y atender por WhatsApp con IA. 👍"
    }
  },

  // PILAR CORE 3: SECTORES Y GIROS DE NEGOCIO
  giros: {
    restaurantes: {
      titulo: "Restaurantes, Cafeterías y Bares 🍔",
      solucion: "POS en tablet/celular, comandas digitales a cocina, inventario de insumos y Asistente IA para pedidos en WhatsApp."
    },
    salud: {
      titulo: "Clínicas, Consultorios y Salud 🏥",
      solucion: "Agendamiento autónomo de citas en WhatsApp/Telegram, recordatorios automáticos 24h antes y expediente clínico digital con firma."
    },
    tiendas: {
      titulo: "Abarrotes, Tiendas y Comercio 🛒",
      solucion: "Punto de Venta táctil móvil con escáner de cámara, inventarios en la nube y arqueo de caja con firma en pantalla."
    },
    talleres: {
      titulo: "Talleres Automotrices y Refaccionarias 🚗",
      solucion: "Órdenes de servicio digitales con fotos del auto, cotizaciones por WhatsApp y seguimiento de reparaciones."
    },
    esteticas: {
      titulo: "Estéticas, Barberías y Spas ✂️",
      solucion: "Agenda por especialista, comisiones de estilistas y recordatorios automáticos de citas por WhatsApp."
    },
    hoteles: {
      titulo: "Hoteles Boutique y Alojamientos 🏨",
      solucion: "Motor de reservaciones directo sin comisiones a Booking/Airbnb y check-in digital por WhatsApp."
    },
    escuelas: {
      titulo: "Escuelas, Academias y Colegios 📚",
      solucion: "Control de asistencias por código QR, cobro automático de colegiaturas y avisos masivos a padres por WhatsApp."
    },
    gimnasios: {
      titulo: "Gimnasios, Crossfit y Centros Deportivos 🏋️‍♂️",
      solucion: "Control de acceso con torniquete/código QR, cobro recurrente de membresías y recordatorios de vencimiento."
    }
  },

  // PILAR CORE 4: MANEJO DE OBJECIONES CLAVE
  objeciones: {
    precio: "Entiendo que cuides tu inversión. No somos un gasto, somos un activo que genera retornos desde el primer mes al recuperar ventas perdidas y ahorrar 15+ horas de trabajo semanal. Además, te damos 2 meses de mantenimiento sin costo si arrancamos esta semana. 🎁",
    excel: "Excel es genial para empezar, pero cuando crece el negocio se vuelven archivos pesados que se corrompen o los empleados pueden borrar sin querer. Un sistema en la nube con respaldo diario elimina ese riesgo por completo. 🛡️",
    tiempo: "Nuestros proyectos a la medida se entregan listos para operar en 12 a 24 días hábiles. Además, capacitamos a tu equipo en 30 minutos para que el arranque sea inmediato. ⏱️",
    socio: "Excelente idea platicarlo con tu equipo o socio. Si gustas, te armo un resumen ejecutivo en PDF o agendamos una demostración de 15 minutos en Zoom para resolver sus dudas juntos. 📋",
    miedoPersonal: "Nuestra interfaz está diseñada para ser tan sencilla como usar WhatsApp. Si tus empleados saben mandar mensajes, sabrán usar el sistema desde el primer día. 😊",
    internet: "Nuestros Puntos de Venta (POS) cuentan con modo offline resiliente: si se va el internet en tu local, sigues cobrando y registrando ventas; en cuanto regresa la red, se sincroniza todo en la nube automáticamente. 📶",
    malaExperiencia: "Lamento mucho que hayas tenido una mala experiencia con otros proveedores. En Brain Branding firmamos contrato con Garantía de Satisfacción Garantizada y entregables por fases con visto bueno previo. 🔒",
    migracionExcel: "Te apoyamos 100% sin costo extra a migrar tus catálogos de productos, clientes e inventarios actuales desde Excel o CSV a la nueva plataforma. 📊",
    sinTiempoImplementar: "Nosotros hacemos el 95% del trabajo pesado. Tú solo nos compartes tu catálogo y reglas de negocio; nosotros configuramos todo y te lo entregamos llave en mano. 🔑"
  },

  // PILAR CORE 5: ESQUEMA COMERCIAL TRANSPARENTE
  comercial: {
    activacionInicial: "Cuota plana de desarrollo e implementación a la medida (acorde al alcance).",
    mantenimientoNube: "10% mensual para servidor en la nube resiliente, respaldos diarios automáticos, actualizaciones y soporte técnico 24/7.",
    garantiaCeroRiesgo: "Garantía de Satisfacción Garantizada por contrato y visto bueno por entregables.",
    bonoAccionRapida: "Primeros 2 meses de mantenimiento en la nube 100% GRATIS al contratar esta semana."
  },

  // PREGUNTAS FRECUENTES (FAQ)
  faq: [
    { q: "¿Emiten factura fiscal?", r: "Sí, todos nuestros costos son más IVA y emitimos factura CFDI 4.0 oficial." },
    { q: "¿Necesito comprar computadoras costosas?", r: "No, nuestras plataformas funcionan en cualquier tablet, smartphone, laptop o PC existente." },
    { q: "¿Puedo ver mis ventas desde mi celular si ando de viaje?", r: "Sí, tienes acceso en tiempo real a tus tableros e inventarios desde cualquier parte del mundo." }
  ]
};
