/* ==========================================================================
   REGISTRO MULTI-TENANT & DATOS INICIALES - RECICLADORA SIO (BRAIN BRANDING DEMOS)
   ========================================================================== */

const demoRegistry = {
  // NIP de Carlos (Recicladora SIO)
  "51934": {
    clientId: "carlos-sio",
    clientName: "Carlos",
    businessName: "Recicladora SIO - Servicios Industriales Otay",
    businessTagline: "Recicladora de Acero & Metales • Licencia Ambiental I AI - CEDES",
    createdDate: "2026-09-03",
    expirationDays: 90,
    welcomeTitle: "¡Bienvenido Carlos a la Demo de Recicladora SIO con Inteligencia en Precios e IA!",
    welcomeText: "Diseñada a la medida para acaparadores de chatarra y metales. Controla en 1 clic los cambios de precio de la siderúrgica en cascada, agiliza el pesaje en báscula, proyecta precios internacionales con IA, comanda precios por WhatsApp/Telegram y sincroniza en tiempo real la pantalla LED de tu patio."
  }
};

const initialData = {
  clientName: "Carlos",
  passcode: "51934",
  businessName: "Recicladora SIO",
  fullName: "Recicladora de Acero SIO - Servicios Industriales Otay",
  buyerName: "Siderúrgica & Fundición Monterrey (Comprador Único)",
  license: "Licencia Ambiental 'I AI' Otorgada por CEDES",
  currency: "MXN",
  cashOnHand: 248500.00,
  
  // MERCADOS INTERNACIONALES (LME, COMEX, FASTMARKETS)
  internationalMarkets: [
    {
      symbol: "LME-CU",
      name: "Cobre LME (London Metal Exchange)",
      priceUSDPerTon: 9840.00,
      priceMXNPerKg: 186.96,
      trend24h: "+3.8%",
      forecast72h: "ALCISTA (▲ +4.5%)",
      confidence: "94%",
      impactLocal: "Aumento inminente de la Siderúrgica en Cobre de 1ra y 2da (+4.00 a +7.00 MXN/kg)",
      actionSuggested: "Acaparar Cobre en patio y elevar precio en báscula antes de la llamada."
    },
    {
      symbol: "FM-STEEL",
      name: "Acero Chatarra HMS 1/2 (Fastmarkets)",
      priceUSDPerTon: 365.00,
      priceMXNPerKg: 6.93,
      trend24h: "-2.4%",
      forecast72h: "BAJISTA (▼ -3.2%)",
      confidence: "88%",
      impactLocal: "Posible reducción del precio de compra de la Siderúrgica Monterrey (-0.30 a -0.50 MXN/kg)",
      actionSuggested: "Despachar góndolas de acero acumuladas hoy mismo para asegurar tarifa actual."
    },
    {
      symbol: "COMEX-AL",
      name: "Aluminio Primario COMEX NY",
      priceUSDPerTon: 2480.00,
      priceMXNPerKg: 47.12,
      trend24h: "+1.9%",
      forecast72h: "ESTABLE / LIGERO ALZA (▲ +1.5%)",
      confidence: "91%",
      impactLocal: "Estabilidad de precio con tendencia a subir +$1.00/kg en Perfil y Bote.",
      actionSuggested: "Mantener margen del 28% en Nivel 1."
    }
  ],

  supplierTiers: [
    {
      id: "T1",
      name: "Nivel 1: Menudeo / Recolector de a pie",
      shortName: "Nivel 1 (Menudeo)",
      description: "Menor volumen (< 100 kg). Mayor margen comercial para SIO.",
      defaultMarginPct: 0.28,
      color: "#38bdf8"
    },
    {
      id: "T2",
      name: "Nivel 2: Proveedor Camionetero / Taller Frecuente",
      shortName: "Nivel 2 (Frecuente)",
      description: "Volumen medio (100 - 1,000 kg). Tarifa competitiva de fidelización.",
      defaultMarginPct: 0.16,
      color: "#10b981"
    },
    {
      id: "T3",
      name: "Nivel 3: Maquila / Proveedor Industrial",
      shortName: "Nivel 3 (Industrial)",
      description: "Alto volumen (> 1,000 kg). Precio preferencial para retención.",
      defaultMarginPct: 0.08,
      color: "#f59e0b"
    }
  ],

  materials: [
    {
      id: "MAT-01",
      name: "Cobre de 1ra (Brillante / Desnudo)",
      category: "No Ferrosos",
      unit: "kg",
      buyerPrice: 154.00,
      t1Price: 110.88,
      t2Price: 129.36,
      t3Price: 141.68,
      currentStockKg: 3820,
      avgCostPerKg: 123.50,
      minStockAlert: 1000,
      icon: "⚡",
      colorTag: "#f97316",
      intlBenchmark: "LME-CU"
    },
    {
      id: "MAT-02",
      name: "Cobre de 2da (Quemado / Tubería / Esmaltado)",
      category: "No Ferrosos",
      unit: "kg",
      buyerPrice: 138.00,
      t1Price: 99.36,
      t2Price: 115.92,
      t3Price: 126.96,
      currentStockKg: 2450,
      avgCostPerKg: 110.20,
      minStockAlert: 800,
      icon: "🟤",
      colorTag: "#b45309",
      intlBenchmark: "LME-CU"
    },
    {
      id: "MAT-03",
      name: "Acero Mixto / Chatarra Pesada Industrial",
      category: "Ferrosos",
      unit: "kg",
      buyerPrice: 5.40,
      t1Price: 3.88,
      t2Price: 4.53,
      t3Price: 4.96,
      currentStockKg: 46800,
      avgCostPerKg: 4.25,
      minStockAlert: 15000,
      icon: "🏗️",
      colorTag: "#64748b",
      intlBenchmark: "FM-STEEL"
    },
    {
      id: "MAT-04",
      name: "Aluminio Perfil / Arquitectónico",
      category: "No Ferrosos",
      unit: "kg",
      buyerPrice: 35.00,
      t1Price: 25.20,
      t2Price: 29.40,
      t3Price: 32.20,
      currentStockKg: 7100,
      avgCostPerKg: 28.10,
      minStockAlert: 2000,
      icon: "🪟",
      colorTag: "#0ea5e9",
      intlBenchmark: "COMEX-AL"
    },
    {
      id: "MAT-05",
      name: "Aluminio Bote (Lata Prensada / Suelta)",
      category: "No Ferrosos",
      unit: "kg",
      buyerPrice: 29.00,
      t1Price: 20.88,
      t2Price: 24.36,
      t3Price: 26.68,
      currentStockKg: 5300,
      avgCostPerKg: 23.40,
      minStockAlert: 1500,
      icon: "🥤",
      colorTag: "#38bdf8",
      intlBenchmark: "COMEX-AL"
    },
    {
      id: "MAT-06",
      name: "Bronce / Latón de Válvulas y Grifería",
      category: "No Ferrosos",
      unit: "kg",
      buyerPrice: 96.00,
      t1Price: 69.12,
      t2Price: 80.64,
      t3Price: 88.32,
      currentStockKg: 1950,
      avgCostPerKg: 76.80,
      minStockAlert: 500,
      icon: "🛎️",
      colorTag: "#d97706",
      intlBenchmark: "LME-CU"
    },
    {
      id: "MAT-07",
      name: "Baterías de Plomo / Acumuladores Automotrices",
      category: "Peligrosos",
      unit: "kg",
      buyerPrice: 20.00,
      t1Price: 14.40,
      t2Price: 16.80,
      t3Price: 18.40,
      currentStockKg: 3600,
      avgCostPerKg: 15.90,
      minStockAlert: 1000,
      icon: "🔋",
      colorTag: "#ef4444",
      intlBenchmark: "LME-PB"
    },
    {
      id: "MAT-08",
      name: "Acero Inoxidable Grado Industrial (304 / 316)",
      category: "Ferrosos",
      unit: "kg",
      buyerPrice: 27.00,
      t1Price: 19.44,
      t2Price: 22.68,
      t3Price: 24.84,
      currentStockKg: 4200,
      avgCostPerKg: 21.30,
      minStockAlert: 1000,
      icon: "🍴",
      colorTag: "#94a3b8",
      intlBenchmark: "FM-STEEL"
    },
    {
      id: "MAT-09",
      name: "Cartón Corrugado Industrial (Pacas)",
      category: "Celulosa",
      unit: "kg",
      buyerPrice: 2.20,
      t1Price: 1.58,
      t2Price: 1.84,
      t3Price: 2.02,
      currentStockKg: 21000,
      avgCostPerKg: 1.72,
      minStockAlert: 8000,
      icon: "📦",
      colorTag: "#a16207",
      intlBenchmark: "LOCAL"
    }
  ],

  suppliers: [
    { id: "SUP-01", name: "Don Ramón (Recolector)", tier: "T1", phone: "664-102-3344", vehicle: "Triciclo / Diablito", frequentMaterial: "MAT-05" },
    { id: "SUP-02", name: "Chatarrero El Güero", tier: "T2", phone: "664-555-8899", vehicle: "Pick-up F-150 (BC-882)", frequentMaterial: "MAT-03" },
    { id: "SUP-03", name: "Taller & Herrería Industrial Otay", tier: "T2", phone: "664-444-1234", vehicle: "Camioneta Estaquitas", frequentMaterial: "MAT-01" },
    { id: "SUP-04", name: "Maquiladora Precision Metals S.A.", tier: "T3", phone: "664-777-9900", vehicle: "Camión Rabón 8 Ton", frequentMaterial: "MAT-08" },
    { id: "SUP-05", name: "Constructora e Instalaciones de la Costa", tier: "T3", phone: "664-999-3322", vehicle: "Camión Volteo", frequentMaterial: "MAT-01" }
  ],

  recentWeighings: [
    {
      folio: "REC-2026-0842",
      timestamp: "2026-09-03 15:10",
      supplierName: "Taller & Herrería Industrial Otay",
      tier: "T2",
      materialId: "MAT-01",
      materialName: "Cobre de 1ra (Brillante / Desnudo)",
      grossWeightKg: 210.0,
      tareWeightKg: 18.0,
      netWeightKg: 192.0,
      pricePerKg: 129.36,
      totalPayout: 24837.12,
      status: "PAGADO_EFECTIVO",
      scaleType: "Báscula Plataforma 1 Ton"
    },
    {
      folio: "REC-2026-0841",
      timestamp: "2026-09-03 14:15",
      supplierName: "Chatarrero El Güero",
      tier: "T2",
      materialId: "MAT-03",
      materialName: "Acero Mixto / Chatarra Pesada Industrial",
      grossWeightKg: 3820.0,
      tareWeightKg: 1950.0,
      netWeightKg: 1870.0,
      pricePerKg: 4.53,
      totalPayout: 8471.10,
      status: "PAGADO_EFECTIVO",
      scaleType: "Báscula Camionera 60 Ton"
    },
    {
      folio: "REC-2026-0840",
      timestamp: "2026-09-03 12:45",
      supplierName: "Don Ramón (Recolector)",
      tier: "T1",
      materialId: "MAT-05",
      materialName: "Aluminio Bote (Lata Prensada / Suelta)",
      grossWeightKg: 62.0,
      tareWeightKg: 4.0,
      netWeightKg: 58.0,
      pricePerKg: 20.88,
      totalPayout: 1211.04,
      status: "PAGADO_EFECTIVO",
      scaleType: "Báscula Mostrador 300 kg"
    },
    {
      folio: "REC-2026-0839",
      timestamp: "2026-09-03 11:20",
      supplierName: "Maquiladora Precision Metals S.A.",
      tier: "T3",
      materialId: "MAT-08",
      materialName: "Acero Inoxidable Grado Industrial (304 / 316)",
      grossWeightKg: 3100.0,
      tareWeightKg: 700.0,
      netWeightKg: 2400.0,
      pricePerKg: 24.84,
      totalPayout: 59616.00,
      status: "TRANSFERENCIA_BANCARIA",
      scaleType: "Báscula Camionera 60 Ton"
    }
  ],

  shipmentsToBuyer: [
    {
      folio: "EMB-SIO-094",
      date: "2026-09-03",
      buyerName: "Siderúrgica & Fundición Monterrey (Comprador Único)",
      materialId: "MAT-03",
      materialName: "Acero Mixto / Chatarra Pesada Industrial",
      shippedKg: 32000,
      salePricePerKg: 5.40,
      totalRevenue: 172800.00,
      avgCostPerKg: 4.25,
      totalCost: 136000.00,
      freightCost: 4800.00,
      grossProfit: 32000.00,
      marginPct: 18.52,
      status: "EN_TRÁNSITO_AUTORIZADO"
    },
    {
      folio: "EMB-SIO-093",
      date: "2026-09-02",
      buyerName: "Siderúrgica & Fundición Monterrey (Comprador Único)",
      materialId: "MAT-01",
      materialName: "Cobre de 1ra (Brillante / Desnudo)",
      shippedKg: 4500,
      salePricePerKg: 154.00,
      totalRevenue: 693000.00,
      avgCostPerKg: 123.50,
      totalCost: 555750.00,
      freightCost: 3500.00,
      grossProfit: 133750.00,
      marginPct: 19.30,
      status: "LIQUIDADO_PAGADO"
    }
  ],

  operatingExpenses: {
    freightAndLogistics: 14500.00,
    fuelAndMachinery: 9200.00,
    yardPayrollAndOperators: 32000.00,
    utilitiesAndLicenses: 7800.00,
    unrecoverableScrapWaste: 4200.00
  },

  priceChangeHistory: [
    {
      timestamp: "2026-09-03 09:15",
      trigger: "Llamada del Comprador Siderúrgico (Ajuste LME)",
      materialId: "MAT-01",
      materialName: "Cobre 1ra",
      oldBuyerPrice: 150.00,
      newBuyerPrice: 154.00,
      deltaBuyer: "+$4.00/kg",
      revaluationImpact: 15280.00,
      impactType: "GANANCIA_STOCK"
    },
    {
      timestamp: "2026-09-01 14:30",
      trigger: "Ajuste a la baja por exceso de oferta de chatarra",
      materialId: "MAT-03",
      materialName: "Acero Mixto",
      oldBuyerPrice: 5.80,
      newBuyerPrice: 5.40,
      deltaBuyer: "-$0.40/kg",
      revaluationImpact: -18720.00,
      impactType: "PÉRDIDA_STOCK"
    }
  ],

  // TELEGRAM / WHATSAPP BOT CHAT LOG
  botMessages: [
    {
      id: "MSG-01",
      sender: "bot",
      time: "15:30",
      text: "🚨 <strong>Alerta IA Mercados Internacionales:</strong> El Cobre en la Bolsa de Metales de Londres (LME) subió <strong>+3.8% hoy</strong>. Se proyecta que tu Comprador Mayorista elevará el precio de compra en aprox. 2 horas (+4.00 a +7.00 MXN/kg).",
      actions: [
        { label: "⚡ Subir Cobre +$5.00", cmd: "adjust_copper_up" },
        { label: "🛡️ Proteger Báscula", cmd: "sync_protect" }
      ]
    },
    {
      id: "MSG-02",
      sender: "bot",
      time: "15:42",
      text: "🤖 <strong>Bot SIO:</strong> Puedes enviarme comandos directos como: <code>/precio cobre +5</code>, <code>/bajar acero 0.40</code> o <code>/status patio</code> para sincronizar la báscula y la pantalla LED de inmediato sin llamar al cajero."
    }
  ]
};
