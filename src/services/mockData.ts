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
    contentType: 'text_buttons',
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
    mediaUrl: '/public/assets/aistudio/IMG_7992_53256945.jpeg',
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
    id: 'msg-08-testimonios',
    stepId: 'TESTIMONIOS',
    internalName: '07. Presentación de Testimonios',
    text: `También podrás consultar algunas experiencias compartidas por usuarios.

📌 *Estas imágenes sirven únicamente como referencias de experiencias individuales y no representan resultados garantizados ni ganancias futuras.*`,
    contentType: 'photo_group',
    mediaUrl: '/public/assets/aistudio/IMG_7997_ad4caa21.jpeg',
    mediaType: 'photo',
    additionalMediaUrls: [
      '/public/assets/aistudio/IMG_7998_515178b9.jpeg',
      '/public/assets/aistudio/IMG_7999_3280051c.jpeg',
    ],
    buttons: [],
    condition: 'Posterior a información de Mines (si hay testimonios cargados)',
    nextStepId: 'INFO_REGISTRO',
    isActive: true,
    order: 8,
    stageTag: 'Testimonios',
  },
  {
    id: 'msg-09-info-registro',
    stepId: 'INFO_REGISTRO',
    internalName: '08. Información de Registro en Plataforma',
    text: `Si después de conocer la información deseas explorar la plataforma, puedes consultar el siguiente enlace oficial:`,
    contentType: 'text_buttons',
    buttons: [
      {
        id: 'btn-1x-consultar',
        text: '🎰 CONSULTAR PLATAFORMA 1XBET',
        type: 'url',
        value: 'https://1xbet-col.com?bf=632b4337f60c4_15751275401',
      },
    ],
    condition: 'Posterior a testimonios',
    nextStepId: 'PREGUNTA_REGISTRO',
    isActive: true,
    order: 9,
    stageTag: 'Registro',
  },
  {
    id: 'msg-10-pregunta-registro',
    stepId: 'PREGUNTA_REGISTRO',
    internalName: '09. Pregunta de Registro',
    text: `*¿Ya tienes una cuenta creada en la plataforma?*`,
    contentType: 'text_buttons',
    buttons: [
      { id: 'btn-reg-si', text: '✅ SÍ, YA ME REGISTRÉ', type: 'callback', value: 'reg_si' },
      { id: 'btn-reg-no', text: '⏳ TODAVÍA NO', type: 'callback', value: 'reg_no' },
      { id: 'btn-reg-ayuda', text: '❓ NECESITO AYUDA', type: 'callback', value: 'reg_ayuda' },
    ],
    condition: 'Acompaña el enlace de registro',
    nextStepId: 'SOLICITUD_ID',
    isActive: true,
    order: 10,
    stageTag: 'Registro',
  },
  {
    id: 'msg-11-solicitud-id',
    stepId: 'SOLICITUD_ID',
    internalName: '10. Solicitud del ID de Cuenta',
    text: `¡Perfecto! Para identificar tu cuenta dentro de nuestro proceso de seguimiento, puedes compartir tu ID numérico de cuenta.

🔒 *No envíes contraseñas, códigos de acceso, datos bancarios ni documentos personales.*

Tu ID de cuenta no constituye por sí solo una verificación oficial de tu identidad o de tu registro.

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
    nextStepId: 'RECEPCION_ID',
    isActive: true,
    order: 11,
    stageTag: 'Identificación',
  },
  {
    id: 'msg-12-como-encontrar-id',
    stepId: 'COMO_ENCONTRAR_ID',
    internalName: '11. Guía Visual: Dónde Encontrar el ID (3 Fotos)',
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
    stageTag: 'Instrucciones ID',
  },
  {
    id: 'msg-13-recepcion-id',
    stepId: 'RECEPCION_ID',
    internalName: '12. Confirmación de Recepción de ID',
    text: `¡Gracias! Hemos recibido el identificador que compartiste.

Tu información ha quedado registrada para el seguimiento correspondiente.

📌 *Nota:* El registro queda en estado PENDIENTE DE REVISIÓN y no constituye verificación bancaria o legal.`,
    contentType: 'text',
    buttons: [],
    condition: 'Usuario envía ID numérico válido (6 a 12 dígitos)',
    nextStepId: 'TUTORIAL_MINES',
    isActive: true,
    order: 13,
    stageTag: 'Confirmación',
  },
  {
    id: 'msg-14-tutorial-mines',
    stepId: 'TUTORIAL_MINES',
    internalName: '13. Tutorial de Mines y Probabilidades',
    text: `Ahora puedes consultar el tutorial de Mines.

Aquí aprenderás:
• Cómo funciona el tablero 5×5.
• Cómo se seleccionan las casillas.
• Qué significa la cantidad de minas.
• Cómo funcionan los multiplicadores.
• Cómo interpretar las probabilidades.
• Por qué no se pueden predecir las casillas ocultas.`,
    contentType: 'video_caption',
    mediaUrl: '/public/assets/aistudio/-3957212693191860326_7726be1b.mp4',
    mediaType: 'video',
    buttons: [],
    condition: 'Posterior a recepción de ID',
    nextStepId: 'FINALIZACION',
    isActive: true,
    order: 14,
    stageTag: 'Tutorial',
  },
  {
    id: 'msg-15-finalizacion',
    stepId: 'FINALIZACION',
    internalName: '14. Mensaje Final de Recorrido',
    text: `¡Gracias por conocer Juan Carlos | Mines AI! 💎

Esperamos que la información te haya resultado útil.

Recuerda que Mines es un juego de azar. No existen métodos que garanticen ganancias ni predicciones seguras.

Si necesitas consultar nuevamente los tutoriales, puedes utilizar las opciones de información disponibles en este bot.

¡Bienvenido!`,
    contentType: 'text',
    buttons: [
      {
        id: 'btn-final-platform',
        text: '🎰 Acceder a 1xBet Mines',
        type: 'url',
        value: 'https://1xbet-col.com?bf=632b4337f60c4_15751275401',
      },
    ],
    condition: 'Fin del recorrido guiado automático',
    nextStepId: 'END',
    isActive: true,
    order: 15,
    stageTag: 'Finalización',
  },
];

export const INITIAL_MEDIA_ITEMS: MediaItem[] = [
  {
    id: 'med-paris-presentacion',
    name: 'IMG_7992_Juan_Carlos_Paris_Presentacion.jpeg',
    type: 'photo',
    url: '/public/assets/aistudio/IMG_7992_53256945.jpeg',
    description: 'Fotografía oficial de presentación de Juan Carlos en París (Paso 03 - Presentación).',
    sizeBytes: 890000,
    dimensions: '1080x1620',
    createdAt: '2026-11-10T19:00:00Z',
    associatedStep: 'PRESENTACION',
    isRealAsset: true,
  },
  {
    id: 'med-video-mines',
    name: 'Video_Demostrativo_Mines_Laptop_Mobile.mp4',
    type: 'video',
    url: '/public/assets/aistudio/-3957212693191860326_7726be1b.mp4',
    description: 'Vídeo oficial mostrando la app y el tablero 5x5 de Mines en laptop y celular.',
    sizeBytes: 5200000,
    durationSeconds: 8,
    createdAt: '2026-11-10T19:05:00Z',
    associatedStep: 'INFO_MINES',
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

