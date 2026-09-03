/* ==========================================================================
   REGISTRO MULTI-TENANT DE DEMOS & DATOS INICIALES - BRAIN BRANDING DEMOS
   ========================================================================== */

const demoRegistry = {
  // NIP de Pedro (Fábrica de Lámparas)
  "84927": {
    clientId: "pedro-lamparas",
    clientName: "Pedro",
    businessName: "Fábrica de Lámparas Pedro",
    createdDate: "2026-08-08",
    expirationDays: 90,
    welcomeTitle: "¡Bienvenido Pedro a la Demo Interactiva de tu Fábrica de Lámparas con IA!",
    welcomeText: "Sabemos que tu fábrica de lámparas opera a papel y lápiz. Esta aplicación demuestra cómo tu nuevo software personalizado tomará el control total de producción, inventarios y finanzas en tiempo real."
  },

  // NIP de María (Demo Boutique & Retail)
  "73194": {
    clientId: "maria-retail",
    clientName: "María",
    businessName: "Boutique & Retail María",
    createdDate: "2026-08-08",
    expirationDays: 90,
    welcomeTitle: "¡Bienvenida María a tu Demo de Gestión de Tienda & Moda con IA!",
    welcomeText: "Control inteligente de existencias, código de barras y catálogo digital de prendas."
  },

  // NIP de SERO LAB Grupo Diagnóstico (LIMS & ERP 4.0)
  "72217": {
    clientId: "serolab-lims",
    clientName: "SERO LAB",
    businessName: "SERO LAB Grupo Diagnóstico",
    createdDate: "2026-08-20",
    expirationDays: 90,
    redirectUrl: "serolab/index.html",
    welcomeTitle: "¡Bienvenido equipo de SERO LAB al Configurador LIMS & ERP de Brain Branding!",
    welcomeText: "Diagnóstico interactivo de los 23 módulos (incluye Recursos Humanos) y configuración de requerimientos a la medida con IA."
  },

  // NIP Alternativo 20260 para SERO LAB
  "20260": {
    clientId: "serolab-lims",
    clientName: "SERO LAB",
    businessName: "SERO LAB Grupo Diagnóstico",
    createdDate: "2026-08-20",
    expirationDays: 90,
    redirectUrl: "serolab/index.html",
    welcomeTitle: "¡Bienvenido equipo de SERO LAB al Configurador LIMS & ERP de Brain Branding!",
    welcomeText: "Diagnóstico interactivo de los 23 módulos (incluye Recursos Humanos) y configuración de requerimientos a la medida con IA."
  },

  // NIP de Hugo (Transporte de Pasajeros con Choferes & Boletaje IA)
  "59381": {
    clientId: "hugo-transporte",
    clientName: "Hugo",
    businessName: "Transporte de Pasajeros Hugo",
    createdDate: "2026-08-22",
    expirationDays: 90,
    redirectUrl: "hugo-transporte/index.html",
    welcomeTitle: "¡Bienvenido Hugo al Ecosistema Digital de Transporte & Boletaje Inteligente con IA!",
    welcomeText: "Despídete del papel preimpreso, las fugas de dinero y los reportes tardíos. Controla tu boletaje en ruta con impresión térmica y visión artificial IA en tiempo real."
  },

  // NIP Alternativo 22082 para Hugo
  "22082": {
    clientId: "hugo-transporte",
    clientName: "Hugo",
    businessName: "Transporte de Pasajeros Hugo",
    createdDate: "2026-08-22",
    expirationDays: 90,
    redirectUrl: "hugo-transporte/index.html",
    welcomeTitle: "¡Bienvenido Hugo al Ecosistema Digital de Transporte & Boletaje Inteligente con IA!",
    welcomeText: "Despídete del papel preimpreso, las fugas de dinero y los reportes tardíos. Controla tu boletaje en ruta con impresión térmica y visión artificial IA en tiempo real."
  },

  // NIP de Carlos (Recicladora SIO - Chatarra & Metales)
  "51934": {
    clientId: "carlos-sio",
    clientName: "Carlos",
    businessName: "Recicladora SIO - Servicios Industriales Otay",
    createdDate: "2026-09-03",
    expirationDays: 90,
    redirectUrl: "sio-recicladora/index.html",
    welcomeTitle: "¡Bienvenido Carlos a la Demo de Recicladora SIO con Inteligencia en Precios e IA!",
    welcomeText: "Diseñada a la medida para acaparadores de chatarra y metales. Controla en 1 clic los cambios de precio de la siderúrgica en cascada, agiliza el pesaje en báscula y visualiza tu Estado de Resultados en tiempo real con impacto por volatilidad."
  },

  // NIP de Carlos (Demo Distribuidora Logística)
  "91823": {
    clientId: "carlos-logistica",
    clientName: "Carlos",
    businessName: "Distribuidora Logística Carlos",
    createdDate: "2026-08-08",
    expirationDays: 90,
    welcomeTitle: "¡Bienvenido Carlos a tu Demo de Logística 4.0 con IA!",
    welcomeText: "Supervisión de flotillas, rutas óptimas y rastreo de envíos en tiempo real."
  }
};

const initialData = {
  clientName: "Pedro",
  passcode: "84927", // PIN privado de 5 dígitos para Pedro
  createdDate: "2026-08-08",
  expirationDays: 90,
  
  // Catálogo Profesional de Lámparas (Hogar, Empresa y Gobierno)
  lamps: [
    {
      id: "LAMP-101",
      name: "Lámpara Industrial High-Bay 150W",
      category: "Industrial & Naves",
      targetSector: "🏛️ Gobierno & 🏢 Empresa",
      price: 2450,
      cost: 1100,
      stock: 42,
      power: "150W LED 18,000 LM",
      specs: "Cuerpo Aluminio Extruido IP66, Driver MeanWell. Ideal para almacenes, naves industriales y gobierno.",
      img: "img/lamp_highbay.jpg",
      insumosNeeded: [
        { name: "Chips LED SMD 5050", qty: 30 },
        { name: "Driver 150W IP67", qty: 1 },
        { name: "Carcasa Aluminio Heavy", qty: 1 }
      ]
    },
    {
      id: "LAMP-102",
      name: "Candelabro Luxury Titanium Ring",
      category: "Residencial & Lujo",
      targetSector: "🏠 Hogar & 🏢 Empresa",
      price: 6800,
      cost: 2900,
      stock: 15,
      power: "85W Dimerizable Warm",
      specs: "Titanio Cepillado, Cristal K9, Control WiFi/App. Iluminación elegante para residencias de lujo y hoteles.",
      img: "img/lamp_candelabro.jpg",
      insumosNeeded: [
        { name: "Anillos Titanio 60cm", qty: 3 },
        { name: "Tira LED Alta Densidad Warm", qty: 5 },
        { name: "Controlador Smart Tuya/WiFi", qty: 1 }
      ]
    },
    {
      id: "LAMP-103",
      name: "Reflector Arquitectónico RGBW 100W",
      category: "Alumbrado Público & Monumentos",
      targetSector: "🏛️ Gobierno & 🏢 Empresa",
      price: 3200,
      cost: 1450,
      stock: 28,
      power: "100W RGBW Ultra Bright",
      specs: "Vidrio Templado 5mm, DMX512. Iluminación de fachadas, plazas públicas y proyectos gubernamentales.",
      img: "img/lamp_reflector.jpg",
      insumosNeeded: [
        { name: "Módulo LED RGBW 100W", qty: 1 },
        { name: "Driver RGB DMX", qty: 1 },
        { name: "Vidrio Templado Estanque", qty: 1 }
      ]
    }
  ],

  // Inventarios Categorizados (4 tipos requeridos)
  inventories: {
    insumos: [
      { id: "INS-01", name: "Lámina de Aluminio Anodizado", category: "Materia Prima", stock: 450, unit: "piezas", minStock: 100, alert: false },
      { id: "INS-02", name: "Vidrio Templado Pyrex 5mm", category: "Materia Prima", stock: 120, unit: "piezas", minStock: 150, alert: true },
      { id: "INS-03", name: "Pintura Electroestática Negra Matte", category: "Insumo Líquido", stock: 85, unit: "litros", minStock: 20, alert: false },
      { id: "INS-04", name: "Cajas de Cartón Corrugado Máster", category: "Empaque", stock: 680, unit: "piezas", minStock: 200, alert: false }
    ],
    componentes: [
      { id: "COM-01", name: "Chips LED SMD 5050 Crisp-White", category: "Electrónica", stock: 8500, unit: "unidades", minStock: 2000, alert: false },
      { id: "COM-02", name: "Driver MeanWell 150W IP67", category: "Electrónica", stock: 18, unit: "unidades", minStock: 50, alert: true },
      { id: "COM-03", name: "Controlador Smart Tuya RGBW", category: "Módulos IoT", stock: 95, unit: "unidades", minStock: 30, alert: false },
      { id: "COM-04", name: "Cable Térmico Siliconado 2.5mm", category: "Cableado", stock: 420, unit: "metros", minStock: 100, alert: false }
    ],
    comprados: [
      { id: "PROD-COM-01", name: "Dimmer de Pared Inteligente Zigbee", category: "Venta Directa", stock: 60, price: 650, cost: 320 },
      { id: "PROD-COM-02", name: "Sensor de Movimiento Microondas IP65", category: "Accesorios", stock: 110, price: 420, cost: 190 },
      { id: "PROD-COM-03", name: "Control Remoto DMX 24 Canales", category: "Accesorios", stock: 45, price: 890, cost: 410 }
    ],
    fabricados: [
      { id: "FAB-01", name: "Lámpara Industrial High-Bay 150W", stock: 42, location: "Almacén A-12" },
      { id: "FAB-02", name: "Candelabro Luxury Titanium Ring", stock: 15, location: "Almacén B-04" },
      { id: "FAB-03", name: "Reflector Arquitectónico RGBW 100W", stock: 28, location: "Almacén A-08" }
    ]
  },

  // Procesos de Fabricación y Lotes Activos
  productionBatches: [
    { id: "LOTE-8841", lampName: "Lámpara Industrial High-Bay 150W", qty: 50, stage: "Corte y Mecanizado", operator: "Carlos Ramos", progress: 20 },
    { id: "LOTE-8842", lampName: "Candelabro Luxury Titanium Ring", qty: 20, stage: "Ensamble Electrónico", operator: "María Delgado", progress: 45 },
    { id: "LOTE-8843", lampName: "Reflector Arquitectónico RGBW 100W", qty: 35, stage: "Control de Calidad QC", operator: "Jorge Mendoza", progress: 85 }
  ],

  // Etapas del Proceso
  stages: [
    "Corte y Mecanizado",
    "Ensamble Electrónico",
    "Cableado y Pruebas",
    "Control de Calidad QC",
    "Empaque y Envío"
  ],

  // Personal (Recursos Humanos)
  personnel: [
    { id: "RH-01", name: "Carlos Ramos", role: "Técnico Mecanizador", shift: "Matutino", station: "Corte y Mecanizado", productivity: 96, active: true },
    { id: "RH-02", name: "María Delgado", role: "Especialista en Electrónica LED", shift: "Matutino", station: "Ensamble Electrónico", productivity: 98, active: true },
    { id: "RH-03", name: "Jorge Mendoza", role: "Inspector de Calidad QC", shift: "Matutino", station: "Control de Calidad QC", productivity: 94, active: true },
    { id: "RH-04", name: "Sofía Ibáñez", role: "Supervisor de Logística", shift: "Vespertino", station: "Empaque y Envío", productivity: 92, active: true }
  ],

  // Finanzas y Métricas de Operación
  finance: {
    monthlyRevenue: 485000,
    monthlyCosts: 220000,
    grossProfit: 265000,
    marginPercentage: 54.6,
    paperVsDigitalROI: {
      hoursSavedPerMonth: 120,
      materialWasteSaved: 35000,
      projectedExtraProfit: 78000
    }
  },

  // Historial de Pedidos de Clientes
  orders: [
    { id: "PED-901", client: "Constructora Proyectos Lux", items: "30x High-Bay 150W", status: "En Producción", deliveryDate: "Mañana, 16:00 hrs" },
    { id: "PED-902", client: "Hotel Boutique Rivera", items: "5x Candelabro Luxury Titanium", status: "Listo para Entrega", deliveryDate: "Hoy Mismo" }
  ]
};
