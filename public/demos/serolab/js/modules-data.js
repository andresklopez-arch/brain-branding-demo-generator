/* ============================================================
   BRAIN BRANDING - CATÁLOGO EXTENDIDO DE MÓDULOS, IA & SUBMÓDULOS
   ============================================================ */

const SEROLAB_MODULES = [
  // EJE 1: RECEPCIÓN Y COMERCIAL
  {
    id: "solicitud_examenes",
    category: "recepcion",
    name: "Solicitud de Exámenes (Admisión)",
    icon: "📋",
    badgeType: "legacy",
    badgeText: "Módulo Actual Labtivity",
    currentApp: "Captura de datos del paciente y selección de estudios uno por uno. Emisión de folio manual de orden.",
    brainBetter: "Admisión ultrarrápida en < 45 seg con búsqueda predictiva por nombre/teléfono. Impresión térmica automática de etiquetas con código de barras y color de tapón para tubos.",
    defaultUso: "Recepción de pacientes de mostrador y registro de muestras que llegan en ayuno por la mañana.",
    defaultDeseo: "Que no se trabe en horas pico y que imprima las etiquetas de los tubos al momento para no confundir muestras.",
    advices: [
      "Lector de Código de Barras 2D (DataMatrix) para identificación exacta de tubos pediátricos y adultos.",
      "Cuestionario clínico rápido de ayuno y medicamentos que advierte al químico si hay interferencia analítica.",
      "Firma digital de consentimiento informado en tablet para estudios especiales o tomas a domicilio."
    ],
    submodules: [
      "Escáner OCR de Receta Médica (autocompleta los estudios)",
      "Impresión de etiquetas con indicación de color de tapón (Lila, Rojo, Oro, Azul)",
      "Semáforo de Prioridad / Muestras Urgentes",
      "Consentimiento Informado Digital con firma en pantalla"
    ]
  },
  {
    id: "carga_masiva",
    category: "recepcion",
    name: "Carga Masiva de Solicitudes (XLS)",
    icon: "📑",
    badgeType: "legacy",
    badgeText: "Módulo Actual Labtivity",
    currentApp: "Subida de archivos Excel para registrar grupos de pacientes de empresas o sindicatos.",
    brainBetter: "Validador inteligente que detecta celdas vacías o errores antes de guardar. Generación masiva de etiquetas para todo el lote corporativo en 1 clic.",
    defaultUso: "Para chequeos de admisión o periódicos de empresas con 50 a 200 empleados.",
    defaultDeseo: "Que si una fila de Excel viene mal no rechace todo el archivo, sino que marque solo el error para corregirlo.",
    advices: [
      "Descarga de plantilla Excel precargada con los catálogos exactos para evitar errores ortográficos.",
      "Importación en segundo plano que procesa 500 registros en menos de 5 segundos sin congelar la pantalla.",
      "Consolidado ejecutivo en PDF para entregar al área de Recursos Humanos de la empresa con 1 clic."
    ],
    submodules: [
      "Validador de celdas con resaltado en rojo de datos faltantes",
      "Asignación automática de folio correlativo y paquete empresarial",
      "Generación en lote de órdenes y etiquetas de código de barras",
      "Reporte médico corporativo consolidado para la empresa"
    ]
  },
  {
    id: "cotizaciones",
    category: "recepcion",
    name: "Cotizaciones y Presupuestos",
    icon: "🏷️",
    badgeType: "legacy",
    badgeText: "Módulo Actual Labtivity",
    currentApp: "Cálculo de presupuestos para pacientes o empresas que piden informes de costos.",
    brainBetter: "Cotizador express que envía el presupuesto formateado con diseño institucional directo al WhatsApp del paciente, con botón para convertir a orden de recepción en 1 solo clic.",
    defaultUso: "Cuando los pacientes llaman por teléfono o preguntan en mostrador cuánto cuesta un perfil o check-up.",
    defaultDeseo: "Que se pueda enviar por WhatsApp en PDF o mensaje bonito sin tener que imprimirlo.",
    advices: [
      "Recordatorio automático a los 3 días por WhatsApp para pacientes que cotizaron perfiles preventivos.",
      "Calculadora de paquetes inteligentes que sugiere estudios complementarios al paciente (Upselling médico).",
      "Cupones de descuento temporales con código QR escaneable en caja."
    ],
    submodules: [
      "Envío directo de cotización con botón de pago a WhatsApp",
      "Conversión de Cotización a Orden de Admisión en 1 clic (sin recaptura)",
      "Manejo de vigencias y promociones por día de la semana",
      "Seguimiento automático de cotizaciones no concretadas"
    ]
  },
  {
    id: "convenios",
    category: "recepcion",
    name: "Convenios Corporativos y Empresas",
    icon: "🤝",
    badgeType: "legacy",
    badgeText: "Módulo Actual Labtivity",
    currentApp: "Catálogo de empresas con acuerdos comerciales y descuentos fijos.",
    brainBetter: "Gestión de tarifas B2B escalonadas por volumen y Portal Web para médicos de empresa donde consultan en tiempo real solo a sus colaboradores.",
    defaultUso: "Manejo de cuentas corporativas, fábricas, escuelas y aseguradoras de la zona.",
    defaultDeseo: "Que las empresas puedan descargar sus resultados autorizados sin tener que estarles enviando correos uno por uno.",
    advices: [
      "Portal exclusivo B2B con acceso seguro por empresa para el área de Salud Ocupacional.",
      "Límite de crédito automático que alerta cuando la empresa excede el saldo autorizado.",
      "Facturación mensual consolidada por lote de empleados atendidos."
    ],
    submodules: [
      "Portal B2B de consulta para Médicos Laborales de Empresa",
      "Tarifas personalizadas por porcentaje o precio fijo por empresa",
      "Bloqueo automático por límite de crédito excedido",
      "Facturación masiva consolidada a fin de mes"
    ]
  },
  {
    id: "crm_medico",
    category: "recepcion",
    name: "CRM Médico & Pipeline Comercial",
    icon: "📈",
    badgeType: "new",
    badgeText: "⚡ Nuevo de Brain Branding",
    currentApp: "No existe en Labtivity. La prospección y fidelización se hace a mano o en libretas.",
    brainBetter: "Pipeline de ventas para captación de convenios corporativos, seguimiento de representantes médicos y campañas de salud preventiva por WhatsApp.",
    defaultUso: "Para dar seguimiento a visitas médicas y reactivar pacientes que se hicieron check-up hace un año.",
    defaultDeseo: "Avisar automáticamente a pacientes diabéticos que ya les toca su glucosa o HbA1c trimestral.",
    advices: [
      "Campañas automáticas segmentadas por tipo de paciente (diabéticos, embarazadas, chequeo anual).",
      "Historial de visitas de representantes comerciales a consultorios médicos.",
      "Alerta de 'Médicos Inactivos' que llevan más de 30 días sin derivar pacientes para reactivarlos."
    ],
    submodules: [
      "Recordatorios automáticos de chequeo periódico por WhatsApp",
      "Pipeline de seguimiento a prospectos corporativos y convenios",
      "Historial de visitas y contactos de representantes médicos",
      "Encuestas de satisfacción automáticas al entregar resultados"
    ]
  },

  // EJE 2: LIMS OPERATIVO Y ESTUDIOS
  {
    id: "estudios",
    category: "lims",
    name: "Catálogo de Estudios y Perfiles",
    icon: "🧪",
    badgeType: "legacy",
    badgeText: "Módulo Actual Labtivity",
    currentApp: "Catálogo de pruebas, unidades de medida y valores de referencia.",
    brainBetter: "Rangos dinámicos por edad, sexo y estado fisiológico, con motor de fórmulas automáticas (p. ej. LDL calculado, Relación A/G, Índices) para cero errores de cálculo.",
    defaultUso: "Configuración de químicas, biometrías, perfiles hormonales y paquetes especiales.",
    defaultDeseo: "Que el sistema calcule automáticamente las fórmulas en cuanto el químico capture los valores base.",
    advices: [
      "Motor de más de 50 fórmulas matemáticas preconstruidas y personalizables por el Químico Jefe.",
      "Valores de referencia multinivel: recién nacidos, niños, adultos, adultos mayores, trimestres de embarazo.",
      "Control de metodología y equipo analizador asociado por cada parámetro analítico."
    ],
    submodules: [
      "Cálculo automático de Fórmulas Clínicas (LDL, A/G, Depuraciones)",
      "Rangos dinámicos por edad (días/meses/años) y sexo",
      "Plantillas de texto libre para estudios de Microbiología y Parasitología",
      "Asociación de método e instrumento analítico por analito"
    ]
  },
  {
    id: "entregas_resultados",
    category: "lims",
    name: "Entregas, Validación y Resultados",
    icon: "🖨️",
    badgeType: "legacy",
    badgeText: "Módulo Actual Labtivity",
    currentApp: "Captura analítica e impresión tradicional de resultados en papel.",
    brainBetter: "Firma electrónica del Químico con Cédula Profesional, alerta visual de valores críticos (pánicos) y generación de PDF institucional con Código QR de autenticidad pública.",
    defaultUso: "Liberación técnica y clínica de resultados por el químico responsable.",
    defaultDeseo: "Que los resultados tengan código QR para que el médico o paciente los valide en su celular sin falsificaciones.",
    advices: [
      "Alerta visual roja con sonido ante valores críticos (pánicos) y notificación instantánea al médico.",
      "Sellado digital con código QR inviolable para cumplimiento normativo (ISO 15189 / NOM-007).",
      "Historial de resultados anteriores del mismo paciente en una columna comparativa para ver evolución."
    ],
    submodules: [
      "Firma Electrónica y Cédula Profesional Digital del Químico",
      "Sellado con Código QR de validación de autenticidad pública",
      "Alertas de Valores Críticos (Pánicos) con notificación prioritaria",
      "Columna de Histórico de Resultados Previos del Paciente (Delta Check)"
    ]
  },
  {
    id: "portal_pacientes",
    category: "lims",
    name: "Portal Web & Móvil de Pacientes",
    icon: "📱",
    badgeType: "new",
    badgeText: "⚡ Nuevo de Brain Branding",
    currentApp: "No existe de forma moderna; los pacientes deben ir a recoger a sucursal o pedir por correo.",
    brainBetter: "Portal web responsivo 24/7. El paciente escanea el QR de su ticket de pago y visualiza/descarga su historial y PDF directamente.",
    defaultUso: "Para que el paciente no tenga que formarse en sucursal ni saturar las líneas telefónicas.",
    defaultDeseo: "Que desde el celular con un solo clic el paciente descargue su resultado.",
    advices: [
      "Envío automático por WhatsApp Cloud API con el enlace de descarga en cuanto el químico valida el estudio.",
      "Gráficas interactivas para el paciente (p. ej. evolución de su glucosa o colesterol en el tiempo).",
      "Modo PWA instalable en el celular del paciente como una aplicación nativa."
    ],
    submodules: [
      "Acceso directo mediante escaneo de Código QR en el ticket",
      "Envío automatizado de resultados vía WhatsApp y Correo",
      "Expediente histórico con gráficas de evolución clínica",
      "Descarga de factura electrónica desde el mismo portal"
    ]
  },
  {
    id: "doctores",
    category: "lims",
    name: "Directorio y Portal de Doctores",
    icon: "👨‍⚕️",
    badgeType: "legacy",
    badgeText: "Módulo Actual Labtivity",
    currentApp: "Directorio de médicos que derivan pacientes.",
    brainBetter: "Portal médico seguro para revisar resultados de sus pacientes en tiempo real y módulo transparente de liquidación de comisiones o puntos de lealtad.",
    defaultUso: "Registro de médicos remitentes y asignación en la solicitud del paciente.",
    defaultDeseo: "Que el doctor pueda ver el expediente de sus pacientes desde su consultorio.",
    advices: [
      "Acceso web para que el médico revise estudios pendientes y resultados liberados en tiempo real.",
      "Cálculo transparente de beneficios o comisiones conforme a las políticas internas del laboratorio.",
      "Mensaje de WhatsApp automático al médico cuando el resultado de su paciente esté listo."
    ],
    submodules: [
      "Portal Web exclusivo para Médicos Tratantes",
      "Aviso por WhatsApp al médico en resultados urgentes",
      "Módulo de liquidación de comisiones / puntos de lealtad",
      "Estadísticas de pacientes referidos por especialidad"
    ]
  },
  {
    id: "lista_precios",
    category: "lims",
    name: "Listas de Precios y Tarifarios",
    icon: "💲",
    badgeType: "legacy",
    badgeText: "Módulo Actual Labtivity",
    currentApp: "Manejo de precios por estudio.",
    brainBetter: "Multi-tarifarios automáticos (Público General, Doctores, Convenios, Urgencias) con actualización masiva por porcentaje en 1 clic.",
    defaultUso: "Ajuste de tarifas de inicio de año y promociones temporales.",
    defaultDeseo: "Poder subir o bajar precios por categoría con un solo clic sin ir estudio por estudio.",
    advices: [
      "Actualización masiva de precios por grupo analítico (p. ej. subir 5% a toda la sección de Química).",
      "Tarifas diferenciadas por sucursal física vs. toma a domicilio vs. servicio nocturno.",
      "Control de vigencias y precios promocionales con activación y desactivación automática."
    ],
    submodules: [
      "Actualización masiva por porcentaje en 1 clic",
      "Tarifarios por sucursal (Matriz, San Pedro, Sucursales)",
      "Tarifa especial para tomas a domicilio y urgencias",
      "Historial de cambios de precio auditado"
    ]
  },

  // EJE 3: FACTURACIÓN Y FINANZAS
  {
    id: "corte_caja",
    category: "finanzas",
    name: "Corte de Caja y Turnos (POS)",
    icon: "💰",
    badgeType: "legacy",
    badgeText: "Módulo Actual Labtivity",
    currentApp: "Cierre de caja por turno o sucursal.",
    brainBetter: "Arqueo ciego de caja (el recepcionista declara el efectivo sin ver el total del sistema para evitar ajustes), desglose de terminales TPV y envío del corte a gerencia por WhatsApp.",
    defaultUso: "Cierre de turno matutino y vespertino en cada sucursal.",
    defaultDeseo: "Que no haya fugas de dinero y que el supervisor reciba el corte exacto en su celular.",
    advices: [
      "Arqueo ciego que obliga a contar el dinero real antes de ver la cifra del sistema para evitar 'cuadres' artificiales.",
      "Registro de gastos menores y retiros de caja chica con foto del comprobante.",
      "Envío automático del corte en PDF al grupo de WhatsApp o Telegram de la gerencia al cerrar turno."
    ],
    submodules: [
      "Arqueo ciego de caja con validación de supervisor",
      "Desglose por forma de pago (Efectivo, Tarjeta, SPEI, Vales)",
      "Control de gastos de caja chica y retiros parciales",
      "Notificación instantánea del corte a directores por WhatsApp"
    ]
  },
  {
    id: "facturacion_cfdi",
    category: "finanzas",
    name: "Facturación CFDI 4.0 & Autofacturación",
    icon: "🧾",
    badgeType: "legacy",
    badgeText: "Módulo Actual Labtivity",
    currentApp: "Emisión de facturas electrónicas desde el sistema.",
    brainBetter: "Timbrado CFDI 4.0 ultrarrápido, generación de Factura Global diaria automática y portal de autofacturación web donde el paciente factura su ticket desde casa con su RFC.",
    defaultUso: "Facturación a pacientes particulares y facturación masiva a empresas.",
    defaultDeseo: "Que recepción no pierda tiempo pidiendo datos fiscales en mostrador, que el paciente lo haga por internet.",
    advices: [
      "Portal de autofacturación web mediante código QR en el ticket para eliminar filas en mostrador.",
      "Generación automática de la Factura Global diaria de tickets de mostrador al hacer el corte.",
      "Validación de CSF (Constancia de Situación Fiscal) del SAT por QR para evitar errores en nombre y CP."
    ],
    submodules: [
      "Autofacturación web para pacientes desde su celular",
      "Factura Global Diaria automática de tickets de mostrador",
      "Lector QR de Constancia del SAT (autocompleta RFC, CP y Régimen)",
      "Emisión ágil de Complementos de Pago (REP)"
    ]
  },
  {
    id: "cuentas_cobrar",
    category: "finanzas",
    name: "Cuentas por Cobrar (CxC)",
    icon: "📊",
    badgeType: "legacy",
    badgeText: "Módulo Actual Labtivity",
    currentApp: "Listado de saldos pendientes de cobro.",
    brainBetter: "Semáforo de cartera vencida a 30, 60 y 90 días, envío automático de estados de cuenta por correo y cobro mediante ligas digitales (SPEI referenciado / Tarjeta).",
    defaultUso: "Control de pagos pendientes de empresas con crédito a 15 o 30 días.",
    defaultDeseo: "Saber exactamente cuánto nos debe cada empresa y avisarles automáticamente cuando venza su plazo.",
    advices: [
      "Semáforo visual de cobro que clasifica cuentas al corriente, por vencer y vencidas.",
      "Ligas de pago en línea por SPEI referenciado o tarjeta de crédito enviadas por WhatsApp.",
      "Conciliación bancaria automática cuando la empresa paga por transferencia."
    ],
    submodules: [
      "Semáforo de cartera vencida a 30, 60 y 90 días",
      "Envío automático de Estados de Cuenta por WhatsApp y Correo",
      "Ligas de pago en línea con conciliación instantánea",
      "Bloqueo comercial automático a convenios morosos"
    ]
  },
  {
    id: "notas_credito",
    category: "finanzas",
    name: "Notas de Crédito y Devoluciones",
    icon: "🔄",
    badgeType: "legacy",
    badgeText: "Módulo Actual Labtivity",
    currentApp: "Registro de cancelaciones de estudios y notas de crédito.",
    brainBetter: "Flujo de seguridad con PIN de supervisor o doble factor para cancelaciones y descuentos, con trazabilidad contable inmediata.",
    defaultUso: "Cancelaciones por paciente que no pudo acudir o error de captura.",
    defaultDeseo: "Que nadie pueda cancelar un estudio o ticket sin autorización del administrador.",
    advices: [
      "Autorización remota por PIN o aprobación en celular de gerencia para cancelar tickets.",
      "Afectación automática e inmediata a caja, contabilidad e inventario de reactivos.",
      "Registro inmutable de auditoría (*Audit Log*) con fecha, hora, usuario y motivo del ajuste."
    ],
    submodules: [
      "Autorización de cancelaciones con PIN de supervisor",
      "Emisión de Nota de Crédito CFDI 4.0 timbrada ante el SAT",
      "Registro de motivo de cancelación para análisis de calidad",
      "Ajuste automático a corte de caja y contabilidad"
    ]
  },

  // EJE 4: ERP, CONTABILIDAD Y GESTIÓN
  {
    id: "contabilidad_sat",
    category: "erp",
    name: "Contabilidad Electrónica Integrada SAT",
    icon: "📚",
    badgeType: "new",
    badgeText: "⚡ Nuevo de Brain Branding",
    currentApp: "No existe en Labtivity. Se tiene que pasar la información a un contador externo a mano.",
    brainBetter: "Pólizas automáticas de ingresos, egresos y diario generadas en tiempo real sin recaptura, con catálogo agrupador del SAT y exportación de balanza XML.",
    defaultUso: "Para que el contador tenga la contabilidad lista sin pedir papeles a fin de mes.",
    defaultDeseo: "Que cada venta o gasto genere su póliza contable automáticamente.",
    advices: [
      "Pólizas contables autónomas generadas al momento de cada corte de caja y timbrado de factura.",
      "Catálogo de cuentas alineado 100% al agrupador oficial del SAT.",
      "Bóveda fiscal que valida proveedores contra la lista negra del SAT (Art. 69-B CFF)."
    ],
    submodules: [
      "Generación automática de Pólizas de Ingresos, Egresos y Diario",
      "Catálogo Agrupador SAT y descarga de Balanza XML",
      "Bóveda de validación de XMLs contra EFOS y facturas canceladas",
      "Reporte de IVA trasladado, retenido y causación de impuestos"
    ]
  },
  {
    id: "estado_resultados_pnl",
    category: "erp",
    name: "Estado de Resultados (P&L) en Vivo",
    icon: "📉",
    badgeType: "new",
    badgeText: "⚡ Nuevo de Brain Branding",
    currentApp: "No existe. No se sabe con certeza la utilidad neta de cada sucursal o estudio.",
    brainBetter: "Cálculo en vivo de ingresos menos costo exacto de reactivos por prueba (COGS) menos gastos operativos (nómina, renta, luz) = Utilidad Operativa en tiempo real.",
    defaultUso: "Para que la dirección sepa qué sucursales y estudios dejan más ganancia real.",
    defaultDeseo: "Saber el costo real de cada estudio y la rentabilidad mensual por sucursal.",
    advices: [
      "Cálculo del margen bruto por cada prueba analítica deduciendo su costo de reactivo al mililitro.",
      "Comparativa mensual y anual de ingresos vs gastos operativos de cada sucursal.",
      "Gráficas interactivas de EBITDA y Utilidad Neta accesibles desde el celular del Director."
    ],
    submodules: [
      "Margen Bruto y Utilidad Neta por Sucursal en Tiempo Real",
      "Costeo de Reactivos e Insumos por Prueba Procesada (COGS)",
      "Control presupuestal: Gasto Proyectado vs. Gasto Real",
      "Dashboard Financiero Ejecutivo para Dirección General"
    ]
  },
  {
    id: "administracion_erp",
    category: "erp",
    name: "ERP: Compras e Inventario de Reactivos",
    icon: "📦",
    badgeType: "new",
    badgeText: "⚡ Nuevo de Brain Branding",
    currentApp: "No existe control de insumos por prueba en Labtivity.",
    brainBetter: "Descuento automático de mililitros/pruebas de reactivo por cada estudio procesado, punto de reorden con órdenes de compra automáticas y control de analizadores.",
    defaultUso: "Control de almacén de tubos, agujas, reactivos de química y mantenimiento de equipos.",
    defaultDeseo: "Que el sistema avise antes de que se termine un reactivo o caduque en refrigerador.",
    advices: [
      "Descuento de reactivos por prueba realizada para control de mermas y caducidades.",
      "Punto de reorden que genera la Orden de Compra al proveedor antes de agotar existencias.",
      "Expediente de mantenimiento y calibración de cada equipo analizador y centrífuga."
    ],
    submodules: [
      "Descuento automático de reactivos por estudio procesado",
      "Alertas de caducidad en refrigerador y punto de reorden",
      "Órdenes de Compra y Recepción de Insumos contra Factura XML",
      "Control de Mantenimiento Preventivo y Calibración de Analizadores"
    ]
  },
  {
    id: "informes_bi",
    category: "erp",
    name: "Informes Ejecutivos & BI",
    icon: "📊",
    badgeType: "legacy",
    badgeText: "Módulo Actual Labtivity",
    currentApp: "Reportes estáticos en tablas que requieren exportar a Excel.",
    brainBetter: "Dashboard interactivo con métricas en vivo: tiempos de espera de pacientes, estudios más vendidos, productividad por químico y comparativa entre sucursales.",
    defaultUso: "Revisión gerencial semanal y mensual del rendimiento del laboratorio.",
    defaultDeseo: "Gráficas interactivas que se puedan ver desde el celular del director sin estar en la oficina.",
    advices: [
      "Métrica de Tiempos de Entrega (TAT): Tiempo desde la toma de muestra hasta la validación del químico.",
      "Ranking de estudios y perfiles más rentables por volumen y margen.",
      "Reporte ejecutivo dominical enviado automáticamente por Telegram/WhatsApp a la Dirección."
    ],
    submodules: [
      "Métrica de Tiempo de Respuesta (TAT - Turnaround Time)",
      "Productividad analítica por Químico y Flebotomista",
      "Ventas por hora pico para optimizar turnos de personal",
      "Exportador automatizado a Excel ejecutivo y PDF gerencial"
    ]
  }
];
