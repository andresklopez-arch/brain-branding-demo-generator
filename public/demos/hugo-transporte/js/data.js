/* ==========================================================================
   TRANSPORTE INTELIGENTE HUGO - DATA & INITIAL CONFIGURATION
   Brain Branding AI Platform
   ========================================================================== */

const HugoTransportData = {
  client: {
    name: "Hugo",
    business: "Transportes y Autobuses Hugo S.A. de C.V.",
    demoPasscode: "59381",
    createdDate: "2026-08-22",
    expirationDays: 90,
    activeShift: "Turno Matutino (05:30 - 14:00)",
    currentDriver: "Carlos Mendoza (ID: CH-101)",
    currentUnit: "Unidad 04 (Placas: 742-HU-9 • Crafter Maxi)",
    currentRouteId: "R-01"
  },

  // Catálogo de Rutas y Tarifas
  routes: [
    {
      id: "R-01",
      name: "Ruta 01: Centro ⇄ Terminal Sur",
      code: "R01-CTR",
      distanceKm: 14.5,
      frequencyMin: 8,
      baseFare: 14.00,
      fares: [
        { id: "gen", label: "General", price: 14.00, icon: "👤", badge: "Normal" },
        { id: "pref", label: "Estudiante / Inapam", price: 8.00, icon: "🎓", badge: "50% Desc" },
        { id: "local", label: "Tramo Corto / Local", price: 10.00, icon: "📍", badge: "Intermedio" }
      ],
      currentOccupancy: 18,
      maxCapacity: 28,
      status: "Activa (En Ruta)"
    },
    {
      id: "R-02",
      name: "Ruta 02: Zona Industrial ⇄ Parque Tecnológico",
      code: "R02-IND",
      distanceKm: 22.0,
      frequencyMin: 12,
      baseFare: 18.00,
      fares: [
        { id: "gen", label: "General Turno", price: 18.00, icon: "🏭", badge: "Estándar" },
        { id: "pref", label: "Tarjeta Empleado", price: 15.00, icon: "💳", badge: "Convenio" },
        { id: "noct", label: "Horario Nocturno", price: 22.00, icon: "🌙", badge: "+Tarifa" }
      ],
      currentOccupancy: 24,
      maxCapacity: 35,
      status: "Activa"
    },
    {
      id: "R-03",
      name: "Ruta Exprés: Aeropuerto ⇄ Corredor Financiero",
      code: "R03-EXP",
      distanceKm: 31.2,
      frequencyMin: 15,
      baseFare: 35.00,
      fares: [
        { id: "gen", label: "Boleto Exprés", price: 35.00, icon: "✈️", badge: "Directo" },
        { id: "round", label: "Viaje Redondo (QR)", price: 60.00, icon: "🔄", badge: "Ahorro $10" },
        { id: "luggage", label: "Equipaje Adicional", price: 15.00, icon: "🧳", badge: "Extra" }
      ],
      currentOccupancy: 12,
      maxCapacity: 20,
      status: "Activa"
    },
    {
      id: "R-04",
      name: "Ruta Intermunicipal: San Pedro ⇄ Santa Catarina",
      code: "R04-INT",
      distanceKm: 28.5,
      frequencyMin: 10,
      baseFare: 24.00,
      fares: [
        { id: "gen", label: "Completo Intermunicipal", price: 24.00, icon: "🚌", badge: "Completo" },
        { id: "pref", label: "Media Ruta / Escolar", price: 12.00, icon: "🎒", badge: "Descuento" }
      ],
      currentOccupancy: 20,
      maxCapacity: 32,
      status: "Activa"
    }
  ],

  // Tarjetas Prepago y Monederos Electrónicos NFC / QR
  nfcCards: [
    { id: "NFC-84920", passenger: "Valeria Gómez", type: "Estudiante Frecuente", balance: 142.00, discountPct: 50, avatar: "👩‍🎓" },
    { id: "NFC-73109", passenger: "Lic. Fernando Ruiz", type: "Pase Ejecutivo", balance: 350.00, discountPct: 0, avatar: "👨‍💼" },
    { id: "NFC-51092", passenger: "Doña Elena Mendoza", type: "Adulto Mayor (INAPAM)", balance: 86.00, discountPct: 50, avatar: "👵" }
  ],

  // Puntos de Control GPS & Geocercas en Ruta
  gpsWaypoints: [
    { id: "WP-01", name: "Terminal Central", lat: 19.4326, lng: -99.1332, zone: "Zona Urbana Centro", suggestedFareId: "gen", basePrice: 14.00 },
    { id: "WP-02", name: "Av. Insurgentes & Reforma", lat: 19.4360, lng: -99.1550, zone: "Corredor Comercial", suggestedFareId: "local", basePrice: 10.00 },
    { id: "WP-03", name: "Parque Industrial Norte", lat: 19.4890, lng: -99.1780, zone: "Zona Industrial", suggestedFareId: "gen", basePrice: 18.00 },
    { id: "WP-04", name: "Acceso Autopista / Caseta", lat: 19.5320, lng: -99.2100, zone: "Tramo Carretero Foráneo", suggestedFareId: "gen", basePrice: 24.00 }
  ],

  // Telemetría de la Unidad en Tiempo Real
  telemetry: {
    currentSpeedKmh: 42,
    speedLimitKmh: 60,
    engineRpm: 1850,
    fuelLevelPct: 78,
    driverScore: 97, // de 100
    harshBrakingCount: 0,
    speedingEvents: 0,
    fuelSavingsEstimateMxn: 3450
  },

  // Flotilla de Unidades
  fleet: [
    { id: "U-01", name: "Unidad #01", model: "Mercedes-Benz Sprinter 2024", plates: "318-HU-1", capacity: 22, driver: "Roberto Vargas", status: "En Ruta", route: "Ruta 02", passengersToday: 142, revenueToday: 2480, fuelEfficiency: "9.2 km/L", alert: null },
    { id: "U-04", name: "Unidad #04", model: "Crafter Maxi 2023", plates: "742-HU-9", capacity: 28, driver: "Carlos Mendoza", status: "En Ruta (Activo)", route: "Ruta 01", passengersToday: 189, revenueToday: 2646, fuelEfficiency: "8.8 km/L", alert: null },
    { id: "U-08", name: "Unidad #08", model: "Marcopolo Boxer 2022", plates: "891-HU-4", capacity: 35, driver: "Esteban Morales", status: "En Ruta", route: "Ruta 04", passengersToday: 215, revenueToday: 5160, fuelEfficiency: "6.4 km/L", alert: "Mantenimiento 500 km" },
    { id: "U-12", name: "Unidad #12", model: "Volvo 9700 Grand 2023", plates: "450-HU-7", capacity: 20, driver: "Javier Solís", status: "En Ruta", route: "Ruta Exprés", passengersToday: 98, revenueToday: 3430, fuelEfficiency: "10.1 km/L", alert: null },
    { id: "U-15", name: "Unidad #15", model: "Sprinter Transfer 2021", plates: "129-HU-3", capacity: 22, driver: "Disponible", status: "Taller Preventivo", route: "Standby", passengersToday: 0, revenueToday: 0, fuelEfficiency: "-", alert: "Servicio de Frenos" }
  ],

  // Choferes y Turnos
  drivers: [
    { id: "CH-101", name: "Carlos Mendoza", license: "Tipo C Federal", unit: "Unidad #04", score: 9.8, ticketsIssued: 189, cashCollected: 2646.00, anomalies: 0, shift: "05:30 - 14:00" },
    { id: "CH-102", name: "Roberto Vargas", license: "Tipo C Federal", unit: "Unidad #01", score: 9.5, ticketsIssued: 142, cashCollected: 2480.00, anomalies: 1, shift: "05:30 - 14:00" },
    { id: "CH-103", name: "Esteban Morales", license: "Tipo C Federal", unit: "Unidad #08", score: 9.2, ticketsIssued: 215, cashCollected: 5160.00, anomalies: 0, shift: "06:00 - 14:30" },
    { id: "CH-104", name: "Javier Solís", license: "Tipo C Federal", unit: "Unidad #12", score: 9.9, ticketsIssued: 98, cashCollected: 3430.00, anomalies: 0, shift: "06:00 - 14:30" }
  ],

  // Historial de Boletos Recientes (Simulación en Vivo)
  recentTickets: [
    { folio: "TCK-89210", time: "10:38:12", route: "Ruta 01: Centro ⇄ Terminal Sur", fareType: "General", amount: 14.00, payment: "Efectivo", unit: "Unidad #04", driver: "Carlos Mendoza", trigger: "IA Cámara (Detección Auto)" },
    { folio: "TCK-89209", time: "10:35:45", route: "Ruta 01: Centro ⇄ Terminal Sur", fareType: "General", amount: 14.00, payment: "Efectivo", unit: "Unidad #04", driver: "Carlos Mendoza", trigger: "Manual 1-Tap" },
    { folio: "TCK-89208", time: "10:32:01", route: "Ruta 01: Centro ⇄ Terminal Sur", fareType: "Estudiante / Inapam", amount: 8.00, payment: "QR Digital", unit: "Unidad #04", driver: "Carlos Mendoza", trigger: "Manual 1-Tap" },
    { folio: "TCK-89207", time: "10:28:44", route: "Ruta 01: Centro ⇄ Terminal Sur", fareType: "General", amount: 14.00, payment: "Efectivo", unit: "Unidad #04", driver: "Carlos Mendoza", trigger: "IA Cámara (Detección Auto)" },
    { folio: "TCK-89206", time: "10:21:19", route: "Ruta 01: Centro ⇄ Terminal Sur", fareType: "Tramo Corto / Local", amount: 10.00, payment: "Efectivo", unit: "Unidad #04", driver: "Carlos Mendoza", trigger: "Manual 1-Tap" }
  ],

  // Datos para Comparativa de Ahorro ROI (Papel vs Sistema IA)
  roiModel: {
    paperTicketCostPerThousand: 220, // $220 pesos por millar de boletos impresos en talonarios
    monthlyTicketsAvg: 38000,
    paperLossAndWastePct: 6.5, // 6.5% de boletos maltratados, mojados o perdidos
    estimatedLeakageReductionPct: 14.2, // 14.2% de boletos no cobrados o dinero no reportado en papel
    avgTicketPrice: 16.50
  }
};
