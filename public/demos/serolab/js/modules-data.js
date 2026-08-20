/* ============================================================
   BRAIN BRANDING - CATÁLOGO DE MÓDULOS Y REGLAS DE IA
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
    aiAdvice: "💡 Consejo Brain Branding: Podemos agregar un lector de código de barras 2D (DataMatrix) y cuestionario clínico rápido (ayuno/medicamentos) que advierta al químico en pantalla."
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
    aiAdvice: "💡 Consejo Brain Branding: Podemos habilitar plantillas inteligentes con catálogo precargado y descarga automática de resultados masivos consolidados para la empresa."
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
    aiAdvice: "💡 Consejo Brain Branding: Sugerimos incluir un recordatorio automático a los 3 días por WhatsApp para pacientes que cotizaron estudios preventivos."
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
    aiAdvice: "💡 Consejo Brain Branding: Podemos asignar un subdominio o portal con login exclusivo para cada empresa cliente con descarga de facturas y expedientes."
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
    aiAdvice: "💡 Consejo Brain Branding: Esta automatización aumenta la tasa de retorno de pacientes en un 35% sin esfuerzo del personal de mostrador."
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
    aiAdvice: "💡 Consejo Brain Branding: Integraremos cálculo matemático automático de más de 40 índices clínicos y advertencia si el resultado no es biológicamente congruente."
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
    aiAdvice: "💡 Consejo Brain Branding: Al validar un estudio con valor crítico (pánico), el sistema puede lanzar una alerta prioritaria al médico tratante de inmediato."
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
    aiAdvice: "💡 Consejo Brain Branding: Reduce en un 70% las llamadas a recepción y proyecta una imagen tecnológica de primer nivel."
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
    aiAdvice: "💡 Consejo Brain Branding: El médico puede recibir una notificación por WhatsApp cuando el resultado de su paciente esté liberado por el químico."
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
    aiAdvice: "💡 Consejo Brain Branding: Incluye programador de promociones por día de la semana (ej. 'Miércoles de Check-up con 20%')."
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
    aiAdvice: "💡 Consejo Brain Branding: Detecta automáticamente discrepancias entre efectivo, transferencias y pagos con tarjeta al instante."
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
    aiAdvice: "💡 Consejo Brain Branding: Ahorra más de 3 horas diarias de recaptura fiscal y emite complementos de pago en 1 clic."
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
    aiAdvice: "💡 Consejo Brain Branding: Bloquea automáticamente nuevas solicitudes a crédito si la empresa excedió su límite o plazo pactado."
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
    aiAdvice: "💡 Consejo Brain Branding: Registro de auditoría inmutable (*Audit Log*) que guarda quién, cuándo y por qué autorizó la cancelación."
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
    aiAdvice: "💡 Consejo Brain Branding: Reduce al 100% las discrepancias fiscales y valida automáticamente que los proveedores no estén en listas negras del SAT."
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
    aiAdvice: "💡 Consejo Brain Branding: Conoce al milímetro el margen de utilidad bruta y neta para tomar decisiones estratégicas de precios y expansión."
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
    aiAdvice: "💡 Consejo Brain Branding: Evita compras de pánico y elimina hasta un 15% de merma por caducidades no detectadas."
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
    aiAdvice: "💡 Consejo Brain Branding: Incluye reportes automáticos semanales enviados en PDF ejecutivo a Telegram o WhatsApp de la dirección."
  }
];
