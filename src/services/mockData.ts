import {
  AutoMessage,
  BotConfig,
  GeneralConfig,
  MediaItem,
  SupportTicket,
  TelegramUser,
  TrackedLink,
  Tutorial,
  UserConversation,
} from '../types';

export const INITIAL_BOT_CONFIG: BotConfig = {
  botName: 'Juan Carlos | Mines AI 💎',
  username: '@JuanCarlosMinesAIBot',
  welcomeMessage:
    '¡Hola! 👋 Bienvenido a Juan Carlos | Mines AI 💎\n\nMe alegra tenerte por aquí.',
  status: 'active',
  adminTelegramId: '684920153',
  webhookSecret: 'jc_mines_webhook_secret_9981',
  enforceAgeVerification18: true,
  responsibleGamingDisclaimer:
    'El juego en Mines implica riesgo y los resultados son aleatorios. Plataforma exclusiva para mayores de 18 años (+18). No se garantizan ganancias ni resultados futuros.',
};

export const INITIAL_MESSAGES: AutoMessage[] = [
  {
    id: 'msg-01-bienvenida',
    stepId: 'BIENVENIDA',
    internalName: '01. Bienvenida y Pregunta de País',
    text: `¡Hola! 👋 Bienvenido a *Juan Carlos | Mines AI* 💎

Me alegra tenerte por aquí.

Quiero mostrarte cómo funciona nuestro sistema de información y análisis del juego Mines, cómo se interpreta su tablero y qué herramientas puedes utilizar para comprender mejor sus probabilidades.

Primero quiero conocerte un poquito.

*¿De qué país nos escribes?* 🌎`,
    contentType: 'photo_buttons',
    mediaUrl: '/public/assets/aistudio/IMG_8043_1305f354.jpeg',
    mediaType: 'photo',
    buttons: [
      { id: 'btn-co', text: '🇨🇴 Colombia', type: 'callback', value: 'pais_colombia' },
      { id: 'btn-otro', text: '🌎 Otro país', type: 'callback', value: 'pais_otro' },
    ],
    condition: 'Usuario pulsa START por primera vez',
    nextStepId: 'PAIS',
    isActive: true,
    order: 1,
    stageTag: 'Inicio',
  },
  {
    id: 'msg-02-pais-colombia',
    stepId: 'PAIS',
    internalName: '02A. Respuesta Colombia',
    text: `¡Excelente! 🇨🇴 Qué bueno tenerte por aquí.

Vamos a mostrarte la información correspondiente a Colombia y explicarte cómo funciona el proceso.`,
    contentType: 'text',
    buttons: [],
    condition: 'Usuario responde Colombia o selecciona botón',
    nextStepId: 'PRESENTACION',
    isActive: true,
    order: 2,
    stageTag: 'Segmentación',
  },
  {
    id: 'msg-03-pais-otro',
    stepId: 'PAIS',
    internalName: '02B. Respuesta Internacional',
    text: `¡Perfecto! 🌎 También damos la bienvenida a personas de otros países.

Te compartiré la información general y las instrucciones correspondientes a tu ubicación.`,
    contentType: 'text',
    buttons: [],
    condition: 'Usuario responde otro país o selecciona botón',
    nextStepId: 'PRESENTACION',
    isActive: true,
    order: 3,
    stageTag: 'Segmentación',
  },
  {
    id: 'msg-04-presentacion',
    stepId: 'PRESENTACION',
    internalName: '03. Mensaje de Presentación',
    text: `Antes de continuar, quiero explicarte qué encontrarás aquí.

*Juan Carlos | Mines AI* 💎 es un proyecto enfocado exclusivamente en Mines.

Aquí encontrarás explicaciones del juego, información sobre el tablero de 5×5, probabilidades matemáticas, tutoriales y herramientas para comprender mejor cómo funciona.

⚠️ *No prometemos ganancias ni resultados seguros. Los resultados de Mines dependen del azar.*`,
    contentType: 'photo_caption',
    mediaUrl: '/public/assets/aistudio/IMG_8056_475a1672.jpeg',
    mediaType: 'photo',
    buttons: [],
    condition: 'Inmediatamente posterior a la identificación de país',
    nextStepId: 'INTERES',
    isActive: true,
    order: 4,
    stageTag: 'Presentación',
  },
  {
    id: 'msg-05-interes',
    stepId: 'INTERES',
    internalName: '04. Pregunta de Interés',
    text: `Quiero preguntarte algo antes de continuar.

*¿Te interesa conocer cómo funciona nuestro sistema y recibir toda la información paso a paso?*`,
    contentType: 'text_buttons',
    buttons: [
      { id: 'btn-int-si', text: '✅ SÍ, ME INTERESA', type: 'callback', value: 'interes_si' },
      { id: 'btn-int-mas', text: 'ℹ️ QUIERO SABER MÁS', type: 'callback', value: 'interes_mas' },
      { id: 'btn-int-no', text: '❌ NO POR AHORA', type: 'callback', value: 'interes_no' },
    ],
    condition: 'Posterior al mensaje de presentación',
    nextStepId: 'EXPERIENCIA',
    isActive: true,
    order: 5,
    stageTag: 'Calificación',
  },
  {
    id: 'msg-06-experiencia',
    stepId: 'EXPERIENCIA',
    internalName: '05. Pregunta de Experiencia',
    text: `Ahora quiero saber algo:

*¿Ya conoces el juego Mines o sería tu primera vez?*`,
    contentType: 'text_buttons',
    buttons: [
      { id: 'btn-exp-si', text: '⚡ SÍ, YA LO CONOZCO', type: 'callback', value: 'exp_si' },
      { id: 'btn-exp-no', text: '🎓 NO, SOY PRINCIPIANTE', type: 'callback', value: 'exp_no' },
    ],
    condition: 'Usuario responde afirmativamente a la pregunta de interés',
    nextStepId: 'INFO_MINES',
    isActive: true,
    order: 6,
    stageTag: 'Experiencia',
  },
  {
    id: 'msg-07-info-mines',
    stepId: 'INFO_MINES',
    internalName: '06. Información sobre Mines',
    text: `Mines es un juego que utiliza un tablero de 5×5, compuesto por 25 casillas.

El jugador selecciona la cantidad de minas y descubre casillas intentando evitar las minas ocultas.

⚠️ *Es importante entender que los resultados son aleatorios.*

Ningún análisis de rondas anteriores permite conocer con seguridad dónde estarán las próximas minas.`,
    contentType: 'video_caption',
    mediaUrl: '/public/assets/aistudio/-3957212693191860326_7726be1b.mp4',
    mediaType: 'video',
    buttons: [],
    condition: 'Posterior a registrar nivel de experiencia',
    nextStepId: 'TESTIMONIOS',
    isActive: true,
    order: 7,
    stageTag: 'Educativo',
  },
  {
    id: 'msg-08-planes-iniciales',
    stepId: 'PLANES_INICIALES',
    internalName: '08. Opciones Iniciales (Planes)',
    text: `💎 *ESTAS SON LAS OPCIONES INICIALES*

He organizado tres alternativas para que conozcas los recursos y beneficios disponibles en cada plan.

🥉 *PLAN 1 — $15.000 COP*
💰 Premio indicado: $75.000 COP.

🥈 *PLAN 2 — $25.000 COP*
💰 Premio indicado: $115.000 COP.

🥇 *PLAN 3 — $40.000 COP*
💰 Premio indicado: $35.000 COP.
📱 Incluye acceso a la aplicación de apoyo con herramientas de análisis de casillas.

✨ Elige el plan que deseas consultar.

Antes de realizar cualquier pago, podrás conocer exactamente qué incluye cada opción y cuáles son sus condiciones.

Los premios están sujetos a las reglas del juego y no representan ganancias garantizadas.`,
    contentType: 'text_buttons',
    buttons: [
      { id: 'btn-p1', text: '🥉 PLAN 1 — $15.000 COP', type: 'callback', value: 'plan_15000' },
      { id: 'btn-p2', text: '🥈 PLAN 2 — $25.000 COP', type: 'callback', value: 'plan_25000' },
      { id: 'btn-p3', text: '🥇 PLAN 3 — $40.000 COP', type: 'callback', value: 'plan_40000' },
    ],
    condition: 'Usuario selecciona país en Etapa 1',
    nextStepId: 'GUIA_REGISTRO',
    isActive: true,
    order: 8,
    stageTag: 'Etapa 1 — Planes',
  },
  {
    id: 'msg-09-guia-registro',
    stepId: 'GUIA_REGISTRO',
    internalName: '09. Preparar Registro + Imágenes Oficiales',
    text: `📝 *¡VAMOS A PREPARAR TU REGISTRO!*

Para continuar, sigue estos pasos:

1. Ingresa al enlace oficial.
2. Completa los datos solicitados.
3. Revisa que tu cuenta haya quedado registrada.
4. Consulta las imágenes de orientación que aparecen a continuación para completar el registro correctamente.

🔗 *ENLACE DE REGISTRO:*
https://1xbet-col.com?bf=632b4337f60c4_15751275401

📸 *GUÍA VISUAL DE REGISTRO:*`,
    contentType: 'photo_group',
    mediaUrl: '/public/assets/aistudio/IMG_8045_386300d5.jpeg',
    mediaType: 'photo',
    additionalMediaUrls: [
      '/public/assets/aistudio/IMG_8046_e22d614e.jpeg',
      '/public/assets/aistudio/IMG_8047_fd76850d.jpeg',
      '/public/assets/aistudio/IMG_8048_34b6bffb.jpeg',
      '/public/assets/aistudio/IMG_8049_347e9a5a.jpeg',
      '/public/assets/aistudio/IMG_8050_f9c1e958.jpeg',
    ],
    buttons: [
      { id: 'btn-reg-link', text: '🔗 Abrir enlace de registro', type: 'url', value: 'https://1xbet-col.com?bf=632b4337f60c4_15751275401' },
      { id: 'btn-reg-done', text: '✅ Ya completé el registro', type: 'callback', value: 'continuar_a_guia_mines' },
    ],
    condition: 'Usuario selecciona uno de los 3 planes iniciales',
    nextStepId: 'GUIA_MINES',
    isActive: true,
    order: 9,
    stageTag: 'Etapa 1 — Registro',
  },
  {
    id: 'msg-10-aviso-deposito',
    stepId: 'AVISO_DEPOSITO',
    internalName: '10. Solicitud de Comprobante de Depósito',
    text: `💳 *¡ENVÍANOS TU COMPROBANTE!*

Por favor, envíame la fotografía o captura del comprobante de tu depósito en este mismo chat.

🔍 Nuestro equipo verificará manualmente tu pago desde el panel de administración.

⏳ Tu solicitud quedará pendiente de verificación.

IMPORTANTE: El envío del comprobante no significa que el depósito esté aprobado.`,
    contentType: 'text',
    buttons: [],
    condition: 'Usuario escribe "Ya deposité", "Listo", "Ya pagué" o pulsa botón de depósito',
    nextStepId: 'RECEPCION_COMPROBANTE',
    isActive: true,
    order: 10,
    stageTag: 'Etapa 2 — Comprobante',
  },
  {
    id: 'msg-11-solicitud-id',
    stepId: 'SOLICITUD_ID',
    internalName: '11. Solicitud del ID de Cuenta',
    text: `¡Perfecto! Para identificar tu cuenta dentro de nuestro proceso de seguimiento, puedes compartir tu ID numérico de cuenta.

🔒 *No envíes contraseñas, códigos de acceso, datos bancarios ni documentos personales.*

👉 _Escribe únicamente el número de tu ID a continuación (ej. 1603722093):_`,
    contentType: 'text_buttons',
    buttons: [
      {
        id: 'btn-help-id-step',
        text: '❓ ¿Dónde encuentro mi ID?',
        type: 'callback',
        value: 'ver_tutorial_id',
      },
    ],
    condition: 'Usuario indica que ya se registró',
    nextStepId: 'COMO_ENCONTRAR_ID',
    isActive: true,
    order: 11,
    stageTag: 'Etapa 1 — Identificación',
  },
  {
    id: 'msg-12-como-encontrar-id',
    stepId: 'COMO_ENCONTRAR_ID',
    internalName: '12. Guía Visual: Dónde Encontrar el ID (3 Fotos)',
    text: `No te preocupes. Te voy a mostrar dónde puedes encontrar el identificador de tu cuenta.

Sigue las imágenes paso a paso:

1. Presiona el icono de perfil en la parte superior derecha.
2. Presiona la opción 'Datos personales'.
3. Copia el número que aparece en 'Número de la cuenta'.`,
    contentType: 'photo_group',
    mediaUrl: '/public/assets/aistudio/IMG_8001_4c69f620.jpeg',
    mediaType: 'photo',
    additionalMediaUrls: [
      '/public/assets/aistudio/IMG_8002_9518c00d.jpeg',
      '/public/assets/aistudio/IMG_8003_6df7b69a.jpeg',
    ],
    buttons: [
      { id: 'btn-found-yes', text: '✅ SÍ, YA LO ENCONTRÉ', type: 'callback', value: 'id_ya_lo_encontre' },
      { id: 'btn-found-no', text: '❌ TODAVÍA NO', type: 'callback', value: 'id_todavia_no' },
    ],
    condition: 'Usuario solicita ayuda o no sabe encontrar su ID',
    nextStepId: 'SOLICITUD_ID',
    isActive: true,
    order: 12,
    stageTag: 'Etapa 1 — Instrucciones ID',
  },
  {
    id: 'msg-13-confirmacion-pago',
    stepId: 'CONFIRMACION_PAGO',
    internalName: '13. Confirmación de Depósito Aprobado',
    text: `🎮 *¡VERIFICACIÓN COMPLETADA!*

Tu comprobante ha sido revisado y aprobado por nuestro equipo.

Ahora puedes acceder al material de orientación y conocer la dinámica del juego.

💎 A continuación encontrarás cinco rondas de ejemplo para familiarizarte con el funcionamiento de las casillas.`,
    contentType: 'text',
    buttons: [],
    condition: 'Administrador pulsa «✅ APROBAR DEPÓSITO» en el panel',
    nextStepId: 'RONDAS_ORIENTACION',
    isActive: true,
    order: 13,
    stageTag: 'Etapa 2 — Verificación',
  },
  {
    id: 'msg-14-rondas-orientacion',
    stepId: 'RONDAS_ORIENTACION',
    internalName: '14. Cinco Rondas de Orientación (Ilustrativas)',
    text: `🎮 *SEÑALES DE ORIENTACIÓN*

💎 *RONDA 1*
Trampas: 2 💣
Aperturas de ejemplo: 1 💎
🟫🟫🟫🟫🟫
🟫🟫🟫🟫🟫
🟫🟫💎🟫🟫
🟫🟫🟫🟫🟫
🟫🟫🟫🟫🟫

💎 *RONDA 2*
Trampas: 2 💣
Aperturas de ejemplo: 2 💎
🟫🟫🟫🟫🟫
🟫💎🟫🟫🟫
🟫🟫🟫🟫🟫
🟫🟫🟫💎🟫
🟫🟫🟫🟫🟫

👀 *INSTRUCCIONES*
Estas rondas son ejemplos ilustrativos para que te familiarices con la dinámica del tablero. Este material es orientativo y no garantiza resultados futuros ni representa casillas seguras verificadas.`,
    contentType: 'text',
    buttons: [],
    condition: 'Enviado automáticamente después de aprobar el comprobante',
    nextStepId: 'VIDEO_MINES',
    isActive: true,
    order: 14,
    stageTag: 'Etapa 2 — Orientación',
  },
  {
    id: 'msg-15-video-mines',
    stepId: 'VIDEO_MINES',
    internalName: '15. Video Explicativo + Práctica Etapa 2',
    text: `🎮 *Cómo encontrar y acceder al juego Mines dentro de la plataforma:*

1️⃣ Entra al menú principal y pulsa *Casino*.
2️⃣ Pulsa el botón de *búsqueda* (lupa) y escribe *Mines*.
3️⃣ Pulsa *Más* y desliza hasta encontrar el juego Mines mostrado en el video.
4️⃣ Selecciónalo y ya podrás ingresar al tablero para practicar.

Revisa este video paso a paso con atención. Recuerda que cada ronda es aleatoria e independiente y ninguna herramienta predice resultados.`,
    contentType: 'video_caption',
    mediaUrl: '/public/assets/aistudio/como_encontrar_mines.mp4',
    mediaType: 'video',
    buttons: [
      { id: 'btn-prac-done', text: '✅ YA TERMINÉ LA PRÁCTICA', type: 'callback', value: 'practica_terminada' },
      { id: 'btn-prac-help', text: '❓ NECESITO AYUDA', type: 'callback', value: 'practica_ayuda' },
    ],
    condition: 'Enviado automáticamente tras aprobar el comprobante',
    nextStepId: 'PLANES_AVANZADOS',
    isActive: true,
    order: 15,
    stageTag: 'Etapa 2 — Tutorial',
  },
];

export const INITIAL_MEDIA_ITEMS: MediaItem[] = [
  {
    id: 'med-bienvenida-mines',
    name: 'IMG_8043_Bienvenida_Oficial_Mines.jpeg',
    type: 'photo',
    url: '/public/assets/aistudio/IMG_8043_1305f354.jpeg',
    description: 'Nueva imagen oficial de bienvenida de Mines AI adjunta al mensaje /start.',
    sizeBytes: 235000,
    dimensions: '1170x1599',
    createdAt: '2026-11-13T09:00:00Z',
    associatedStep: 'BIENVENIDA',
    stageGroup: 'etapa_1',
    isRealAsset: true,
  },
  {
    id: 'med-reg-paso-1',
    name: 'Registro_Paso_1_Metodo_Email.jpeg',
    type: 'photo',
    url: '/public/assets/aistudio/IMG_8045_386300d5.jpeg',
    description: 'Guía de Registro - Paso 1: Elegir método de registro "Por e-mail".',
    sizeBytes: 137000,
    dimensions: '590x1280',
    createdAt: '2026-11-13T09:01:00Z',
    associatedStep: 'GUIA_REGISTRO',
    stageGroup: 'etapa_1',
    orderIndex: 1,
    isRealAsset: true,
  },
  {
    id: 'med-reg-paso-2',
    name: 'Registro_Paso_2_Datos_Basicos.jpeg',
    type: 'photo',
    url: '/public/assets/aistudio/IMG_8046_e22d614e.jpeg',
    description: 'Guía de Registro - Paso 2: Rellenar Nombre, Apellidos y E-mail.',
    sizeBytes: 121000,
    dimensions: '590x1280',
    createdAt: '2026-11-13T09:02:00Z',
    associatedStep: 'GUIA_REGISTRO',
    stageGroup: 'etapa_1',
    orderIndex: 2,
    isRealAsset: true,
  },
  {
    id: 'med-reg-paso-3',
    name: 'Registro_Paso_3_Pais_Telefono.jpeg',
    type: 'photo',
    url: '/public/assets/aistudio/IMG_8047_fd76850d.jpeg',
    description: 'Guía de Registro - Paso 3: Seleccionar país, región, ciudad y teléfono.',
    sizeBytes: 106000,
    dimensions: '590x1280',
    createdAt: '2026-11-13T09:03:00Z',
    associatedStep: 'GUIA_REGISTRO',
    stageGroup: 'etapa_1',
    orderIndex: 3,
    isRealAsset: true,
  },
  {
    id: 'med-reg-paso-4',
    name: 'Registro_Paso_4_Moneda_Password.jpeg',
    type: 'photo',
    url: '/public/assets/aistudio/IMG_8048_34b6bffb.jpeg',
    description: 'Guía de Registro - Paso 4: Seleccionar moneda, contraseña y tipo de cuenta.',
    sizeBytes: 154000,
    dimensions: '590x1280',
    createdAt: '2026-11-13T09:04:00Z',
    associatedStep: 'GUIA_REGISTRO',
    stageGroup: 'etapa_1',
    orderIndex: 4,
    isRealAsset: true,
  },
  {
    id: 'med-reg-paso-5',
    name: 'Registro_Paso_5_Casino_1xGames.jpeg',
    type: 'photo',
    url: '/public/assets/aistudio/IMG_8049_347e9a5a.jpeg',
    description: 'Guía de Registro - Paso 5: Seleccionar bono Casino + 1xGames y Guardar.',
    sizeBytes: 138000,
    dimensions: '590x1280',
    createdAt: '2026-11-13T09:05:00Z',
    associatedStep: 'GUIA_REGISTRO',
    stageGroup: 'etapa_1',
    orderIndex: 5,
    isRealAsset: true,
  },
  {
    id: 'med-reg-paso-6',
    name: 'Registro_Paso_6_Completar_Registro.jpeg',
    type: 'photo',
    url: '/public/assets/aistudio/IMG_8050_f9c1e958.jpeg',
    description: 'Guía de Registro - Paso 6: Verificar datos y pulsar Registrarse.',
    sizeBytes: 110000,
    dimensions: '590x1280',
    createdAt: '2026-11-13T09:06:00Z',
    associatedStep: 'GUIA_REGISTRO',
    stageGroup: 'etapa_1',
    orderIndex: 6,
    isRealAsset: true,
  },
  {
    id: 'med-video-como-encontrar-mines',
    name: 'Como_Encontrar_El_Juego_Mines_Post_Deposito.mp4',
    type: 'video',
    url: '/public/assets/aistudio/como_encontrar_mines.mp4',
    description: 'Video explicativo paso a paso sobre cómo encontrar y acceder a Mines (enviado tras depósito verificado).',
    sizeBytes: 2438660,
    durationSeconds: 23,
    createdAt: '2026-11-13T09:10:00Z',
    associatedStep: 'VIDEO_MINES',
    stageGroup: 'etapa_2',
    isRealAsset: true,
  },
  {
    id: 'med-video-mines',
    name: 'Video_Demostrativo_Mines_Laptop_Mobile.mp4',
    type: 'video',
    url: '/public/assets/aistudio/-3957212693191860326_7726be1b.mp4',
    description: 'Vídeo demostración mostrando la app y el tablero 5x5 de Mines en laptop y celular.',
    sizeBytes: 5200000,
    durationSeconds: 8,
    createdAt: '2026-11-10T19:05:00Z',
    associatedStep: 'INFO_MINES',
    stageGroup: 'etapa_2',
    isRealAsset: true,
  },
  {
    id: 'med-testimonio-1',
    name: 'IMG_7997_Testimonio_Carlos_COP.jpeg',
    type: 'photo',
    url: '/public/assets/aistudio/IMG_7997_ad4caa21.jpeg',
    description: 'Captura de chat testimonial 1: Experiencia de usuario en Colombia (COP).',
    sizeBytes: 310000,
    dimensions: '590x1280',
    createdAt: '2026-11-10T19:10:00Z',
    associatedStep: 'TESTIMONIOS',
    isRealAsset: true,
  },
  {
    id: 'med-testimonio-2',
    name: 'IMG_7998_Testimonio_Carlos_2.jpeg',
    type: 'photo',
    url: '/public/assets/aistudio/IMG_7998_515178b9.jpeg',
    description: 'Captura de chat testimonial 2: Uso continuo y comodidad de la app.',
    sizeBytes: 340000,
    dimensions: '590x1280',
    createdAt: '2026-11-10T19:11:00Z',
    associatedStep: 'TESTIMONIOS',
    isRealAsset: true,
  },
  {
    id: 'med-testimonio-3',
    name: 'IMG_7999_Testimonio_Carlos_Laptop.jpeg',
    type: 'photo',
    url: '/public/assets/aistudio/IMG_7999_3280051c.jpeg',
    description: 'Captura de chat testimonial 3: Referencia de experiencia de usuario.',
    sizeBytes: 330000,
    dimensions: '590x1280',
    createdAt: '2026-11-10T19:12:00Z',
    associatedStep: 'TESTIMONIOS',
    isRealAsset: true,
  },
  {
    id: 'med-guia-id-1',
    name: 'IMG_8001_Paso1_Presiona_Perfil.jpeg',
    type: 'photo',
    url: '/public/assets/aistudio/IMG_8001_4c69f620.jpeg',
    description: 'Guía Dónde Encontrar ID - Paso 1: Presiona el icono de perfil en la cabecera.',
    sizeBytes: 280000,
    dimensions: '590x1040',
    createdAt: '2026-11-10T19:20:00Z',
    associatedStep: 'COMO_ENCONTRAR_ID',
    isRealAsset: true,
  },
  {
    id: 'med-guia-id-2',
    name: 'IMG_8002_Paso2_Datos_Personales.jpeg',
    type: 'photo',
    url: '/public/assets/aistudio/IMG_8002_9518c00d.jpeg',
    description: 'Guía Dónde Encontrar ID - Paso 2: Presiona la opción Datos personales.',
    sizeBytes: 290000,
    dimensions: '590x1040',
    createdAt: '2026-11-10T19:21:00Z',
    associatedStep: 'COMO_ENCONTRAR_ID',
    isRealAsset: true,
  },
  {
    id: 'med-guia-id-3',
    name: 'IMG_8003_Paso3_Numero_Cuenta_ID.jpeg',
    type: 'photo',
    url: '/public/assets/aistudio/IMG_8003_6df7b69a.jpeg',
    description: 'Guía Dónde Encontrar ID - Paso 3: Número de cuenta ID (ej. 1603722093).',
    sizeBytes: 310000,
    dimensions: '590x1040',
    createdAt: '2026-11-10T19:22:00Z',
    associatedStep: 'COMO_ENCONTRAR_ID',
    isRealAsset: true,
  },
];

export const INITIAL_USERS: TelegramUser[] = [];

export const INITIAL_CONVERSATIONS: Record<string, UserConversation> = {};


export const INITIAL_TUTORIALS: Tutorial[] = [
  {
    id: 'tut-01',
    title: 'Fundamentos de Mines: Cómo entender la cuadrícula 5x5',
    description: 'Explicación del tablero de 25 casillas y la selección de minas de 1 a 24.',
    mediaUrl: '/public/assets/aistudio/-3957212693191860326_7726be1b.mp4',
    mediaType: 'video',
    explanatoryText:
      'En el tablero de 5x5 hay 25 casillas. Si configuras 3 minas, hay 22 diamantes libres. Los resultados son completamente aleatorios generados por RNG.',
    steps: [
      'Abre Mines en la sección 1xGames.',
      'Configura entre 1 y 24 minas según tu tolerancia al riesgo.',
      'Destapa casillas buscando diamantes.',
      'Pulsa Retirar (Cash Out) antes de tocar una mina.',
    ],
    targetStage: 'principiante',
    order: 1,
    isActive: true,
    estimatedReadTime: '2 min',
  },
  {
    id: 'tut-02',
    title: 'Cómo Encontrar el ID Numérico de Cuenta en 1xBet',
    description: 'Guía paso a paso con las 3 capturas oficiales para localizar el número de cuenta.',
    mediaUrl: '/public/assets/aistudio/IMG_8003_6df7b69a.jpeg',
    mediaType: 'photo',
    explanatoryText:
      '1. Entra a tu perfil en la esquina superior derecha.\n2. Presiona "Datos personales".\n3. En la sección "Cuenta", copia el "Número de la cuenta" (ej. 1603722093).',
    steps: [
      'Paso 1: Presiona el icono de perfil superior derecho.',
      'Paso 2: Presiona Datos personales.',
      'Paso 3: Copia el Número de la cuenta numérico.',
    ],
    targetStage: 'todos',
    order: 2,
    isActive: true,
    estimatedReadTime: '1 min',
  },
];

export const INITIAL_TRACKED_LINKS: TrackedLink[] = [
  {
    id: 'link-01',
    platform: '1xBet',
    url: 'https://1xbet-col.com?bf=632b4337f60c4_15751275401',
    name: 'Enlace Oficial de Registro 1xBet',
    associatedStep: 'INFO_REGISTRO',
    clicksCount: 0,
    isActive: true,
    isVerified: true,
    verificationNotes: 'Enlace oficial verificado para el recorrido del bot.',
  },
];

export const INITIAL_SUPPORT_TICKETS: SupportTicket[] = [];

export const INITIAL_GENERAL_CONFIG: GeneralConfig = {
  adminName: 'Juan Carlos (Administrador)',
  adminEmail: 'juancarlos@mines-ai.admin',
  adminTelegramId: '684920153',
  telegramWebhookStatus: 'ready_for_cloud_run',
  databaseStatus: 'firestore_ready',
  responsibleGamingNotice:
    'El juego de apuestas online está reservado estrictamente para mayores de 18 años (+18). Mines es un juego de azar con resultados aleatorios.',
  minimumAge: 18,
};

