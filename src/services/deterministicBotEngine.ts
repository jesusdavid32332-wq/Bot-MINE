import {
  AccountVerificationStatus,
  AutoMessage,
  ChatMessage,
  DeterministicKeywordConfig,
  FlowStepId,
  TelegramButton,
  TelegramUser,
} from '../types';

export const DEFAULT_KEYWORD_CONFIG: DeterministicKeywordConfig = {
  keywordsYes: [
    'si',
    'sí',
    'claro',
    'correcto',
    'ya lo conozco',
    'me interesa',
    'si me interesa',
    'sí me interesa',
    'obvio',
    'por supuesto',
    'ya me registre',
    'ya me registré',
    'ya lo encontre',
    'ya lo encontré',
    'listo',
    'dale',
    'seguro',
    'confirmar',
    'yes',
  ],
  keywordsNo: [
    'no',
    'todavia no',
    'todavía no',
    'nunca he jugado',
    'soy principiante',
    'no por ahora',
    'no me interesa',
    'nunca',
    'nop',
    'cero',
    'aun no',
    'aún no',
  ],
  keywordsColombia: [
    'colombia',
    'colombiano',
    'colombiana',
    'medellin',
    'medellín',
    'bogota',
    'bogotá',
    'cali',
    'barranquilla',
    'bucaramanga',
    'cartagena',
    'pereira',
    'paisa',
    'nequi',
    'daviplata',
    'co',
  ],
  keywordsOtherCountry: [
    'otro',
    'otro país',
    'otro pais',
    'españa',
    'espana',
    'mexico',
    'méxico',
    'peru',
    'perú',
    'chile',
    'argentina',
    'ecuador',
    'venezuela',
    'bolivia',
    'uruguay',
    'paraguay',
    'panama',
    'panamá',
    'costa rica',
    'guatemala',
    'estados unidos',
    'usa',
    'madrid',
    'miami',
  ],
  keywordsWantMore: [
    'quiero saber mas',
    'quiero saber más',
    'mas info',
    'más info',
    'informacion',
    'información',
    'detalles',
  ],
  keywordsNotNow: [
    'no por ahora',
    'luego',
    'despues',
    'después',
    'mas tarde',
    'más tarde',
    'cancelar',
  ],
  keywordsNeedHelp: [
    'necesito ayuda',
    'ayuda',
    'como registrarse',
    'cómo registrarse',
    'tutorial registro',
    'no se como',
    'no sé cómo',
  ],
  keywordsAlreadyFoundId: [
    'ya lo encontre',
    'ya lo encontré',
    'lo tengo',
    'encontrado',
    'tengo el id',
    'ya lo se',
    'ya lo sé',
  ],
  idRegex: '^\\d{6,12}$',
  unrecognizedFallbackText:
    'No logré identificar tu respuesta. Puedes seleccionar una de las opciones para continuar.',
};

export interface EngineResult {
  updatedUser: TelegramUser;
  messagesToSend: {
    text: string;
    mediaUrl?: string;
    mediaType?: 'photo' | 'video';
    additionalMediaUrls?: string[];
    buttons?: TelegramButton[];
    stepTriggered?: FlowStepId;
  }[];
  recognizedAction: string;
}

export function normalizeInput(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

export function matchesAnyKeyword(normalized: string, keywords: string[]): boolean {
  return keywords.some((kw) => {
    const normKw = normalizeInput(kw);
    // Exact or word boundary match
    if (normalized === normKw) return true;
    const regex = new RegExp(`(^|\\s)${normKw}(\\s|$)`, 'i');
    return regex.test(normalized);
  });
}

/**
 * Pure Deterministic Conversation Engine for Juan Carlos | Mines AI
 */
function applyCustomMessages(
  messages: EngineResult['messagesToSend'],
  customMap?: Map<FlowStepId, AutoMessage> | Record<string, AutoMessage>
): EngineResult['messagesToSend'] {
  if (!customMap) return messages;

  const getCustom = (step: FlowStepId): AutoMessage | undefined => {
    if (customMap instanceof Map) return customMap.get(step);
    return (customMap as Record<string, AutoMessage>)[step];
  };

  return messages.map((m) => {
    if (!m.stepTriggered) return m;
    const custom = getCustom(m.stepTriggered);
    if (!custom || !custom.isActive) return m;

    return {
      ...m,
      text: custom.text || m.text,
      mediaUrl: custom.mediaUrl !== undefined ? custom.mediaUrl : m.mediaUrl,
      mediaType: custom.mediaType || m.mediaType,
      additionalMediaUrls: custom.additionalMediaUrls || m.additionalMediaUrls,
      buttons: custom.buttons && custom.buttons.length > 0 ? custom.buttons : m.buttons,
    };
  });
}

export function processDeterministicUpdate(
  user: TelegramUser,
  rawInput: string,
  callbackData?: string,
  config: DeterministicKeywordConfig = DEFAULT_KEYWORD_CONFIG,
  customMessagesMap?: Map<FlowStepId, AutoMessage> | Record<string, AutoMessage>,
  options?: { adminTelegramId?: string; publicBaseUrl?: string }
): EngineResult {
  const result = runDeterministicLogic(user, rawInput, callbackData, config, options);
  if (customMessagesMap) {
    return {
      ...result,
      messagesToSend: applyCustomMessages(result.messagesToSend, customMessagesMap),
    };
  }
  return result;
}

function runDeterministicLogic(
  user: TelegramUser,
  rawInput: string,
  callbackData: string | undefined,
  config: DeterministicKeywordConfig,
  options?: { adminTelegramId?: string; publicBaseUrl?: string }
): EngineResult {
  const inputSource = callbackData || rawInput || '';
  const norm = normalizeInput(inputSource);
  const trimmed = inputSource.trim();

  // Robust /start detection (supports /start, /start <ref>, /start@bot, start, iniciar, /reiniciar, /reset)
  const isStart =
    norm === '/start' ||
    norm.startsWith('/start ') ||
    norm.startsWith('/start@') ||
    norm === 'start' ||
    norm === 'iniciar' ||
    norm === '/reiniciar' ||
    norm === 'reiniciar' ||
    norm === '/reset' ||
    norm === 'reset';

  // Global commands check at ANY stage of conversation
  const isAyuda =
    norm === '/ayuda' ||
    norm.startsWith('/ayuda@') ||
    norm === '/help' ||
    norm.startsWith('/help@') ||
    norm === 'ayuda' ||
    norm === 'help';

  const isTutorial =
    norm === '/tutorial' ||
    norm.startsWith('/tutorial@') ||
    norm === 'tutorial' ||
    norm === 'ver tutorial' ||
    callbackData === 'cmd_tutorial';

  const isIdCommand =
    norm === '/id' ||
    norm.startsWith('/id@') ||
    norm === 'mi id' ||
    norm === 'id' ||
    callbackData === 'cmd_id';

  const isAdminCommand =
    norm === '/admin' ||
    norm.startsWith('/admin@') ||
    norm === 'admin' ||
    callbackData === 'cmd_admin';

  const adminTelegramId = options?.adminTelegramId || '684920153';
  const publicBaseUrl = (options?.publicBaseUrl || 'https://mine-aimbot-167398797374.us-west2.run.app').replace(/\/$/, '');

  const updatedUser: TelegramUser = {
    ...user,
    lastActivity: 'Ahora',
    messagesReceived: user.messagesReceived + 1,
  };

  const messagesToSend: EngineResult['messagesToSend'] = [];

  // ==========================================
  // GLOBAL COMMAND: /ayuda o /help
  // ==========================================
  if (isAyuda) {
    updatedUser.messagesSent += 1;
    messagesToSend.push({
      text: `💎 *Juan Carlos | Mines AI — Centro de Ayuda*

Aquí tienes los comandos disponibles para interactuar con el bot:

• */start* — Iniciar o reiniciar el recorrido desde el principio.
• */tutorial* — Ver el tutorial en vídeo y la guía del tablero de Mines.
• */id* — Consultar tu ID de Telegram y el estado de tu cuenta.
• */ayuda* — Mostrar este mensaje de asistencia.
• */admin* — Panel de administración (sólo administradores).

⚠️ *Recordatorio de Transparencia:*
Mines es un juego de azar sobre un tablero de 5×5 casillas. No existen bots milagrosos ni señales 100% infalibles. Aprende a gestionar tus probabilidades de manera responsable (+18).`,
      buttons: [
        { id: 'btn-help-start', text: '🔄 Iniciar Bot (/start)', type: 'callback', value: '/start' },
        { id: 'btn-help-tut', text: '🎓 Ver Tutorial de Mines', type: 'callback', value: 'cmd_tutorial' },
        { id: 'btn-help-id', text: '🆔 Consultar Mi ID', type: 'callback', value: 'cmd_id' },
      ],
    });

    return {
      updatedUser,
      messagesToSend,
      recognizedAction: 'Comando global /ayuda ejecutado',
    };
  }

  // ==========================================
  // GLOBAL COMMAND: /tutorial
  // ==========================================
  if (isTutorial) {
    updatedUser.messagesSent += 1;
    messagesToSend.push({
      stepTriggered: 'TUTORIAL_MINES',
      text: `🎓 *Tutorial del Juego Mines (Tablero 5×5)*

Mines es un juego basado en una cuadrícula de 25 casillas (5 filas × 5 columnas):

1. *Configuración:* Eliges el número de minas ocultas (de 1 a 24). A mayor número de minas, mayor es el multiplicador de cada diamante descubierto.
2. *Descubrimiento:* Cada casilla seleccionada puede revelar un Diamante 💎 o una Mina 💣.
3. *Cobro:* Puedes retirarte en cualquier momento asegurando tus ganancias acumuladas.
4. *Probabilidad matemática:* Cada casilla descubierta modifica la probabilidad de la siguiente. No hay patrones fijos.

Mira el siguiente vídeo explicativo para ver la interfaz en tiempo real:`,
      mediaUrl: '/public/assets/aistudio/-3957212693191860326_7726be1b.mp4',
      mediaType: 'video',
      buttons: [
        { id: 'btn-tut-cont', text: '▶️ Continuar Recorrido', type: 'callback', value: '/start' },
        {
          id: 'btn-tut-plat',
          text: '🎰 Consultar Plataforma 1xBet',
          type: 'url',
          value: 'https://1xbet-col.com?bf=632b4337f60c4_15751275401',
        },
      ],
    });

    return {
      updatedUser,
      messagesToSend,
      recognizedAction: 'Comando global /tutorial ejecutado',
    };
  }

  // ==========================================
  // GLOBAL COMMAND: /id
  // ==========================================
  if (isIdCommand) {
    updatedUser.messagesSent += 1;
    const statusLabel =
      updatedUser.accountStatus === 'revisado'
        ? '✅ REVISADO / APROBADO'
        : updatedUser.accountStatus === 'id_recibido'
        ? '⏳ ID RECIBIDO / EN REVISIÓN'
        : '📝 PENDIENTE DE REVISIÓN';

    messagesToSend.push({
      text: `👤 *Información de tu Perfil de Usuario*

• *Telegram ID:* \`${updatedUser.telegramId}\`
• *Nombre:* ${updatedUser.name}
• *Usuario:* @${updatedUser.username || 'Sin alias'}
• *País registrado:* ${updatedUser.country || updatedUser.declaredCountry || 'Sin especificar'}
• *ID 1xBet:* \`${updatedUser.accountId || 'Aún no registrado'}\`
• *Nivel:* ${updatedUser.experienceLevel || 'Principiante'}
• *Estado actual:* *${statusLabel}*
• *Etapa del bot:* ${updatedUser.stage || 'Inicio'}

Si necesitas actualizar o volver a enviar tu ID, puedes reiniciar con el botón a continuación.`,
      buttons: [
        { id: 'btn-id-restart', text: '🔄 Reiniciar Bot (/start)', type: 'callback', value: '/start' },
        { id: 'btn-id-find', text: '❓ ¿Dónde encuentro mi ID?', type: 'callback', value: 'ver_tutorial_id' },
      ],
    });

    return {
      updatedUser,
      messagesToSend,
      recognizedAction: 'Comando global /id ejecutado',
    };
  }

  // ==========================================
  // GLOBAL COMMAND: /admin
  // ==========================================
  if (isAdminCommand) {
    updatedUser.messagesSent += 1;
    const senderId = String(updatedUser.telegramId).trim();
    const isAuthorized = senderId === String(adminTelegramId).trim() || senderId === '684920153';

    if (isAuthorized) {
      messagesToSend.push({
        text: `👑 *Panel de Administración — Juan Carlos | Mines AI 💎*

¡Bienvenido, Administrador!

⚡ *Estado del Sistema:*
• *Admin ID:* \`${senderId}\` (Autorizado)
• *Servicio:* Cloud Run (\`mine-aimbot\`)
• *Base de Datos:* Firebase Firestore
• *URL Pública:* ${publicBaseUrl}

Puedes gestionar los mensajes automáticos, revisar IDs de usuarios y configurar el bot desde el panel web:`,
        buttons: [
          {
            id: 'btn-adm-web',
            text: '🌐 Abrir Panel de Control Web',
            type: 'url',
            value: publicBaseUrl,
          },
          { id: 'btn-adm-users', text: '👤 Consultar Mi ID', type: 'callback', value: 'cmd_id' },
          { id: 'btn-adm-start', text: '🔄 Probar /start', type: 'callback', value: '/start' },
        ],
      });
      return {
        updatedUser,
        messagesToSend,
        recognizedAction: 'Comando /admin ejecutado con éxito por Administrador',
      };
    } else {
      messagesToSend.push({
        text: `⛔ *Acceso Restringido*

El comando */admin* está reservado exclusivamente para el administrador autorizado de *Juan Carlos | Mines AI*.

Tu Telegram ID es: \`${senderId}\`

Si necesitas asistencia general, escribe */ayuda*.`,
        buttons: [
          { id: 'btn-denied-help', text: 'ℹ️ Ver Ayuda (/ayuda)', type: 'callback', value: '/ayuda' },
          { id: 'btn-denied-start', text: '🔄 Iniciar Bot (/start)', type: 'callback', value: '/start' },
        ],
      });
      return {
        updatedUser,
        messagesToSend,
        recognizedAction: `Comando /admin denegado para usuario ${senderId}`,
      };
    }
  }

  // ==========================================
  // 1. START / FIRST VISIT / RESET
  // ==========================================
  if (isStart || user.currentStep === 'START') {
    updatedUser.currentStep = 'PAIS';
    updatedUser.stage = 'Pregunta de País';
    updatedUser.messagesSent += 1;

    messagesToSend.push({
      stepTriggered: 'BIENVENIDA',
      text: `¡Hola! 👋 Bienvenido a *Juan Carlos | Mines AI* 💎

Me alegra tenerte por aquí.

Quiero mostrarte cómo funciona nuestro sistema de información y análisis del juego Mines, cómo se interpreta su tablero y qué herramientas puedes utilizar para comprender mejor sus probabilidades.

Primero quiero conocerte un poquito.

*¿De qué país nos escribes?* 🌎`,
      buttons: [
        { id: 'btn-co', text: '🇨🇴 Colombia', type: 'callback', value: 'pais_colombia' },
        { id: 'btn-otro', text: '🌎 Otro país', type: 'callback', value: 'pais_otro' },
      ],
    });

    return {
      updatedUser,
      messagesToSend,
      recognizedAction: 'Inicio de conversación con /start',
    };
  }

  // 2. PAÍS
  if (user.currentStep === 'PAIS') {
    const isColombia =
      callbackData === 'pais_colombia' ||
      matchesAnyKeyword(norm, config.keywordsColombia);

    const isOther =
      callbackData === 'pais_otro' ||
      matchesAnyKeyword(norm, config.keywordsOtherCountry);

    if (isColombia || isOther) {
      const selectedCountry = isColombia ? 'Colombia' : 'Otro País';
      updatedUser.country = selectedCountry;
      updatedUser.declaredCountry = selectedCountry;
      updatedUser.currentStep = 'INTERES';
      updatedUser.stage = 'Pregunta de Interés';

      // 1. Country response
      if (isColombia) {
        messagesToSend.push({
          stepTriggered: 'PAIS',
          text: `¡Excelente! 🇨🇴 Qué bueno tenerte por aquí.\n\nVamos a mostrarte la información correspondiente a Colombia y explicarte cómo funciona el proceso.`,
        });
      } else {
        messagesToSend.push({
          stepTriggered: 'PAIS',
          text: `¡Perfecto! 🌎 También damos la bienvenida a personas de otros países.\n\nTe compartiré la información general y las instrucciones correspondientes a tu ubicación.`,
        });
      }

      // 2. Presentación con foto real de Juan Carlos
      messagesToSend.push({
        stepTriggered: 'PRESENTACION',
        text: `Antes de continuar, quiero explicarte qué encontrarás aquí.

*Juan Carlos | Mines AI* 💎 es un proyecto enfocado exclusivamente en Mines.

Aquí encontrarás explicaciones del juego, información sobre el tablero de 5×5, probabilidades matemáticas, tutoriales y herramientas para comprender mejor cómo funciona.

⚠️ *No prometemos ganancias ni resultados seguros. Los resultados de Mines dependen del azar.*`,
        mediaUrl: '/public/assets/aistudio/IMG_7992_53256945.jpeg',
        mediaType: 'photo',
      });

      // 3. Pregunta de Interés
      messagesToSend.push({
        stepTriggered: 'INTERES',
        text: `Quiero preguntarte algo antes de continuar.

*¿Te interesa conocer cómo funciona nuestro sistema y recibir toda la información paso a paso?*`,
        buttons: [
          { id: 'btn-int-si', text: '✅ SÍ, ME INTERESA', type: 'callback', value: 'interes_si' },
          { id: 'btn-int-mas', text: 'ℹ️ QUIERO SABER MÁS', type: 'callback', value: 'interes_mas' },
          { id: 'btn-int-no', text: '❌ NO POR AHORA', type: 'callback', value: 'interes_no' },
        ],
      });

      updatedUser.messagesSent += messagesToSend.length;
      return {
        updatedUser,
        messagesToSend,
        recognizedAction: `País registrado: ${updatedUser.declaredCountry}`,
      };
    }

    // Unrecognized country
    return returnUnrecognized(updatedUser, [
      { id: 'btn-co', text: '🇨🇴 Colombia', type: 'callback', value: 'pais_colombia' },
      { id: 'btn-otro', text: '🌎 Otro país', type: 'callback', value: 'pais_otro' },
    ]);
  }

  // 3. INTERÉS
  if (user.currentStep === 'INTERES') {
    const isYes =
      callbackData === 'interes_si' ||
      matchesAnyKeyword(norm, config.keywordsYes);

    const isWantMore =
      callbackData === 'interes_mas' ||
      matchesAnyKeyword(norm, config.keywordsWantMore);

    const isNotNow =
      callbackData === 'interes_no' ||
      matchesAnyKeyword(norm, config.keywordsNotNow);

    if (isNotNow) {
      updatedUser.currentStep = 'FINALIZACION';
      updatedUser.status = 'completed';
      updatedUser.stage = 'Finalizado (No interesado)';
      updatedUser.messagesSent += 1;

      messagesToSend.push({
        stepTriggered: 'FINALIZACION',
        text: `No hay problema. Gracias por visitarnos. Si deseas conocer más adelante cómo funciona Mines, puedes volver a escribirnos cuando gustes. ¡Hasta luego!`,
      });

      return {
        updatedUser,
        messagesToSend,
        recognizedAction: 'Usuario declinó continuar por ahora.',
      };
    }

    if (isYes || isWantMore) {
      updatedUser.currentStep = 'EXPERIENCIA';
      updatedUser.stage = 'Pregunta de Experiencia';

      if (isWantMore) {
        messagesToSend.push({
          stepTriggered: 'INTERES',
          text: `¡Claro! Te explicaré cada parte con calma para que conozcas el funcionamiento antes de decidir si quieres continuar.`,
        });
      }

      // Pregunta de Experiencia
      messagesToSend.push({
        stepTriggered: 'EXPERIENCIA',
        text: `Ahora quiero saber algo:

*¿Ya conoces el juego Mines o sería tu primera vez?*`,
        buttons: [
          { id: 'btn-exp-si', text: '⚡ SÍ, YA LO CONOZCO', type: 'callback', value: 'exp_si' },
          { id: 'btn-exp-no', text: '🎓 NO, SOY PRINCIPIANTE', type: 'callback', value: 'exp_no' },
        ],
      });

      updatedUser.messagesSent += messagesToSend.length;
      return {
        updatedUser,
        messagesToSend,
        recognizedAction: isWantMore ? 'Interés: Quiere saber más' : 'Interés: Sí, confirmado',
      };
    }

    return returnUnrecognized(updatedUser, [
      { id: 'btn-int-si', text: '✅ SÍ, ME INTERESA', type: 'callback', value: 'interes_si' },
      { id: 'btn-int-mas', text: 'ℹ️ QUIERO SABER MÁS', type: 'callback', value: 'interes_mas' },
      { id: 'btn-int-no', text: '❌ NO POR AHORA', type: 'callback', value: 'interes_no' },
    ]);
  }

  // 4. EXPERIENCIA
  if (user.currentStep === 'EXPERIENCIA') {
    const isYes =
      callbackData === 'exp_si' ||
      matchesAnyKeyword(norm, config.keywordsYes);

    const isNo =
      callbackData === 'exp_no' ||
      matchesAnyKeyword(norm, config.keywordsNo);

    if (isYes || isNo) {
      updatedUser.experienceLevel = isYes ? 'experimentado' : 'principiante';
      updatedUser.currentStep = 'PREGUNTA_REGISTRO';
      updatedUser.stage = 'Registro en 1xBet';

      // 1. Mensaje de nivel
      if (isYes) {
        messagesToSend.push({
          stepTriggered: 'EXPERIENCIA',
          text: `¡Perfecto! Entonces ya tienes una idea de cómo funciona Mines.\n\nTe mostraremos información sobre el tablero, los multiplicadores y las probabilidades matemáticas.`,
        });
      } else {
        messagesToSend.push({
          stepTriggered: 'EXPERIENCIA',
          text: `¡No te preocupes! Vamos paso a paso.\n\nTe explicaremos desde cero cómo funciona Mines, cómo está organizado su tablero y qué debes tener en cuenta antes de jugar.`,
        });
      }

      // 2. Información sobre Mines con vídeo real del tablero
      messagesToSend.push({
        stepTriggered: 'INFO_MINES',
        text: `Mines es un juego que utiliza un tablero de 5×5, compuesto por 25 casillas.

El jugador selecciona la cantidad de minas y descubre casillas intentando evitar las minas ocultas.

⚠️ *Es importante entender que los resultados son aleatorios.*

Ningún análisis de rondas anteriores permite conocer con seguridad dónde estarán las próximas minas.`,
        mediaUrl: '/public/assets/aistudio/-3957212693191860326_7726be1b.mp4',
        mediaType: 'video',
      });

      // 3. Testimonios reales
      messagesToSend.push({
        stepTriggered: 'TESTIMONIOS',
        text: `También podrás consultar algunas experiencias compartidas por usuarios de nuestra comunidad.

📌 *Estas imágenes sirven únicamente como referencias de experiencias individuales y no representan resultados garantizados ni ganancias futuras.*`,
        mediaUrl: '/public/assets/aistudio/IMG_7997_ad4caa21.jpeg',
        mediaType: 'photo',
        additionalMediaUrls: [
          '/public/assets/aistudio/IMG_7998_515178b9.jpeg',
          '/public/assets/aistudio/IMG_7999_3280051c.jpeg',
        ],
      });

      // 4. Información de registro & enlace editable
      messagesToSend.push({
        stepTriggered: 'INFO_REGISTRO',
        text: `Si después de conocer la información deseas explorar la plataforma, puedes consultar el siguiente enlace oficial:`,
        buttons: [
          {
            id: 'btn-1x-platform',
            text: '🎰 CONSULTAR PLATAFORMA 1XBET',
            type: 'url',
            value: 'https://1xbet-col.com?bf=632b4337f60c4_15751275401',
          },
        ],
      });

      // 5. Pregunta de registro
      messagesToSend.push({
        stepTriggered: 'PREGUNTA_REGISTRO',
        text: `*¿Ya tienes una cuenta creada en la plataforma?*`,
        buttons: [
          { id: 'btn-reg-si', text: '✅ SÍ, YA ME REGISTRÉ', type: 'callback', value: 'reg_si' },
          { id: 'btn-reg-no', text: '⏳ TODAVÍA NO', type: 'callback', value: 'reg_no' },
          { id: 'btn-reg-ayuda', text: '❓ NECESITO AYUDA', type: 'callback', value: 'reg_ayuda' },
        ],
      });

      updatedUser.messagesSent += messagesToSend.length;
      return {
        updatedUser,
        messagesToSend,
        recognizedAction: `Nivel registrado: ${updatedUser.experienceLevel}`,
      };
    }

    return returnUnrecognized(updatedUser, [
      { id: 'btn-exp-si', text: '⚡ SÍ, YA LO CONOZCO', type: 'callback', value: 'exp_si' },
      { id: 'btn-exp-no', text: '🎓 NO, SOY PRINCIPIANTE', type: 'callback', value: 'exp_no' },
    ]);
  }

  // 5. PREGUNTA DE REGISTRO
  if (user.currentStep === 'PREGUNTA_REGISTRO') {
    const isYes =
      callbackData === 'reg_si' ||
      matchesAnyKeyword(norm, config.keywordsYes);

    const isNo =
      callbackData === 'reg_no' ||
      matchesAnyKeyword(norm, config.keywordsNo);

    const isNeedHelp =
      callbackData === 'reg_ayuda' ||
      matchesAnyKeyword(norm, config.keywordsNeedHelp);

    if (isYes) {
      updatedUser.currentStep = 'SOLICITUD_ID';
      updatedUser.stage = 'Esperando ID de Cuenta';
      updatedUser.messagesSent += 1;

      messagesToSend.push({
        stepTriggered: 'SOLICITUD_ID',
        text: `¡Perfecto! Para identificar tu cuenta dentro de nuestro proceso de seguimiento, puedes compartir tu ID numérico de cuenta.

🔒 *No envíes contraseñas, códigos de acceso, datos bancarios ni documentos personales.*

Tu ID de cuenta no constituye por sí solo una verificación oficial de tu identidad o de tu registro.

👉 _Escribe únicamente el número de tu ID a continuación (ej. 1603722093):_`,
        buttons: [
          {
            id: 'btn-help-find-id',
            text: '❓ ¿Dónde encuentro mi ID?',
            type: 'callback',
            value: 'ver_tutorial_id',
          },
        ],
      });

      return {
        updatedUser,
        messagesToSend,
        recognizedAction: 'Registro confirmado -> Solicitar ID numérico',
      };
    }

    if (isNo) {
      updatedUser.messagesSent += 1;
      messagesToSend.push({
        stepTriggered: 'PREGUNTA_REGISTRO',
        text: `Puedes revisar el enlace y consultar las condiciones de la plataforma antes de decidir si deseas registrarte.

Cuando termines, puedes regresar a esta conversación.`,
        buttons: [
          {
            id: 'btn-consultar-1x',
            text: '🎰 CONSULTAR PLATAFORMA 1XBET',
            type: 'url',
            value: 'https://1xbet-col.com?bf=632b4337f60c4_15751275401',
          },
          {
            id: 'btn-confirmar-vuelta',
            text: '✅ VOLVER A CONFIRMAR REGISTRO',
            type: 'callback',
            value: 'reg_si',
          },
        ],
      });

      return {
        updatedUser,
        messagesToSend,
        recognizedAction: 'Aún no registrado -> Espera con enlace disponible',
      };
    }

    if (isNeedHelp) {
      updatedUser.messagesSent += 1;
      messagesToSend.push({
        stepTriggered: 'PREGUNTA_REGISTRO',
        text: `Claro, te puedo mostrar las instrucciones disponibles para registrarte en 1xBet de forma segura.

1. Abre el enlace oficial de la plataforma.
2. Pulsa en 'Registro' y selecciona registro en un clic o por teléfono.
3. Guarda tu usuario y contraseña en un lugar seguro.`,
        buttons: [
          {
            id: 'btn-consultar-1x-2',
            text: '🎰 ABRIR PLATAFORMA 1XBET',
            type: 'url',
            value: 'https://1xbet-col.com?bf=632b4337f60c4_15751275401',
          },
          {
            id: 'btn-reg-done-help',
            text: '✅ SÍ, YA ME REGISTRÉ',
            type: 'callback',
            value: 'reg_si',
          },
        ],
      });

      return {
        updatedUser,
        messagesToSend,
        recognizedAction: 'Ayuda de registro enviada',
      };
    }

    return returnUnrecognized(updatedUser, [
      { id: 'btn-reg-si', text: '✅ SÍ, YA ME REGISTRÉ', type: 'callback', value: 'reg_si' },
      { id: 'btn-reg-no', text: '⏳ TODAVÍA NO', type: 'callback', value: 'reg_no' },
      { id: 'btn-reg-ayuda', text: '❓ NECESITO AYUDA', type: 'callback', value: 'reg_ayuda' },
    ]);
  }

  // 6. SOLICITUD_ID & CÓMO ENCONTRAR EL ID
  if (user.currentStep === 'SOLICITUD_ID' || user.currentStep === 'COMO_ENCONTRAR_ID') {
    // If user asked how to find ID
    const wantsGuide =
      callbackData === 'ver_tutorial_id' ||
      callbackData === 'id_todavia_no' ||
      norm.includes('donde') ||
      norm.includes('dónde') ||
      norm.includes('no se') ||
      norm.includes('no sé') ||
      norm.includes('como encuentro') ||
      norm.includes('cómo encuentro');

    if (wantsGuide) {
      updatedUser.currentStep = 'COMO_ENCONTRAR_ID';
      updatedUser.stage = 'Viendo Guía de ID (Fotos 1, 2, 3)';

      // Sends real tutorial photos in order
      messagesToSend.push({
        stepTriggered: 'COMO_ENCONTRAR_ID',
        text: `No te preocupes. Te voy a mostrar dónde puedes encontrar el identificador de tu cuenta.

Sigue las imágenes paso a paso:`,
      });

      // Photo 1: Presiona 1 Perfil
      messagesToSend.push({
        stepTriggered: 'COMO_ENCONTRAR_ID',
        text: `*FOTOGRAFÍA 1:*
En la parte superior derecha de 1xBet, presiona el icono de tu perfil de usuario.`,
        mediaUrl: '/public/assets/aistudio/IMG_8001_4c69f620.jpeg',
        mediaType: 'photo',
      });

      // Photo 2: Presiona 2 Datos personales
      messagesToSend.push({
        stepTriggered: 'COMO_ENCONTRAR_ID',
        text: `*FOTOGRAFÍA 2:*
En el menú desplegado de tu perfil, presiona la opción *'Datos personales'* con el icono de usuario.`,
        mediaUrl: '/public/assets/aistudio/IMG_8002_9518c00d.jpeg',
        mediaType: 'photo',
      });

      // Photo 3: Presiona 3 ID de cuenta
      messagesToSend.push({
        stepTriggered: 'COMO_ENCONTRAR_ID',
        text: `*FOTOGRAFÍA 3:*
En la sección *'Cuenta'*, verás tu *'Número de la cuenta'*. Ese número es tu ID oficial (ejemplo: \`1603722093\`).`,
        mediaUrl: '/public/assets/aistudio/IMG_8003_6df7b69a.jpeg',
        mediaType: 'photo',
      });

      // Confirmation question
      messagesToSend.push({
        stepTriggered: 'COMO_ENCONTRAR_ID',
        text: `*¿Ya encontraste tu ID?*`,
        buttons: [
          { id: 'btn-found-yes', text: '✅ SÍ, YA LO ENCONTRÉ', type: 'callback', value: 'id_ya_lo_encontre' },
          { id: 'btn-found-no', text: '❌ TODAVÍA NO', type: 'callback', value: 'id_todavia_no' },
        ],
      });

      updatedUser.messagesSent += messagesToSend.length;
      return {
        updatedUser,
        messagesToSend,
        recognizedAction: 'Envío de guía visual de 3 fotos para encontrar ID',
      };
    }

    if (callbackData === 'id_ya_lo_encontre') {
      updatedUser.currentStep = 'SOLICITUD_ID';
      messagesToSend.push({
        stepTriggered: 'SOLICITUD_ID',
        text: `¡Excelente! Escribe aquí tu ID numérico de cuenta para guardarlo en tu ficha de seguimiento:`,
      });
      return {
        updatedUser,
        messagesToSend,
        recognizedAction: 'Usuario listo para enviar ID numérico',
      };
    }

    // Check if input is a valid numeric ID (only digits, 6-12 chars)
    const numericRegex = new RegExp(config.idRegex);
    const cleanedDigits = rawInput.trim().replace(/\s+/g, '');

    if (numericRegex.test(cleanedDigits)) {
      updatedUser.accountId = cleanedDigits;
      updatedUser.accountStatus = 'id_recibido';
      updatedUser.consentGiven = true;
      updatedUser.currentStep = 'FINALIZACION';
      updatedUser.status = 'completed';
      updatedUser.stage = 'ID Recibido / Flujo Completado';

      // 1. Recepción del ID
      messagesToSend.push({
        stepTriggered: 'RECEPCION_ID',
        text: `¡Gracias! Hemos recibido el identificador que compartiste (\`${cleanedDigits}\`).

Tu información ha quedado registrada para el seguimiento correspondiente.

📌 *Nota de transparencia:* El registro de tu ID queda en estado *ID RECIBIDO / PENDIENTE DE REVISIÓN*. No constituye por sí solo una verificación oficial.`,
      });

      // 2. Tutorial de Mines
      messagesToSend.push({
        stepTriggered: 'TUTORIAL_MINES',
        text: `Ahora puedes consultar el tutorial de Mines.

Aquí aprenderás:
• Cómo funciona el tablero 5×5.
• Cómo se seleccionan las casillas.
• Qué significa la cantidad de minas.
• Cómo funcionan los multiplicadores.
• Cómo interpretar las probabilidades.
• Por qué no se pueden predecir las casillas ocultas.`,
        mediaUrl: '/public/assets/aistudio/-3957212693191860326_7726be1b.mp4',
        mediaType: 'video',
      });

      // 3. Mensaje Final
      messagesToSend.push({
        stepTriggered: 'FINALIZACION',
        text: `¡Gracias por conocer Juan Carlos | Mines AI! 💎

Esperamos que la información te haya resultado útil.

Recuerda que Mines es un juego de azar. No existen métodos que garanticen ganancias ni predicciones seguras.

Si necesitas consultar nuevamente los tutoriales, puedes utilizar las opciones de información disponibles en este bot.

¡Bienvenido!`,
      });

      updatedUser.messagesSent += messagesToSend.length;
      return {
        updatedUser,
        messagesToSend,
        recognizedAction: `ID numérico válido recibido: ${cleanedDigits}`,
      };
    }

    // Invalid format
    messagesToSend.push({
      stepTriggered: 'SOLICITUD_ID',
      text: `El identificador debe ser un código numérico (ej. \`1603722093\`) sin letras, contraseñas ni símbolos.

Si tienes dudas de dónde encontrarlo en 1xBet, pulsa el botón a continuación para ver las imágenes guía:`,
      buttons: [
        {
          id: 'btn-see-id-guide',
          text: '📸 Ver fotos de dónde está mi ID',
          type: 'callback',
          value: 'ver_tutorial_id',
        },
      ],
    });

    updatedUser.messagesSent += 1;
    return {
      updatedUser,
      messagesToSend,
      recognizedAction: 'ID no válido -> Explicación y botón de guía',
    };
  }

  // Finalized state: user writes something after completion
  if (user.currentStep === 'FINALIZACION') {
    messagesToSend.push({
      stepTriggered: 'FINALIZACION',
      text: `¡Hola de nuevo! Ya has completado el recorrido informativo de Juan Carlos | Mines AI 💎.

Tu ID registrado: \`${user.accountId || 'No especificado'}\`
Estado: *${user.accountStatus.toUpperCase()}*

Si deseas volver a realizar el recorrido desde el inicio, pulsa el botón a continuación:`,
      buttons: [
        { id: 'btn-restart', text: '🔄 Reiniciar Recorrido', type: 'callback', value: '/start' },
        {
          id: 'btn-1x-final',
          text: '🎰 Acceder a 1xBet Mines',
          type: 'url',
          value: 'https://1xbet-col.com?bf=632b4337f60c4_15751275401',
        },
      ],
    });

    updatedUser.messagesSent += 1;
    return {
      updatedUser,
      messagesToSend,
      recognizedAction: 'Usuario en estado finalizado -> Menú de ayuda',
    };
  }

  return returnUnrecognized(updatedUser, [
    { id: 'btn-restart-gen', text: '🔄 Reiniciar Bot (/start)', type: 'callback', value: '/start' },
  ]);
}

function returnUnrecognized(user: TelegramUser, buttons: TelegramButton[]): EngineResult {
  const updatedUser: TelegramUser = {
    ...user,
    messagesSent: user.messagesSent + 1,
  };

  return {
    updatedUser,
    messagesToSend: [
      {
        text: DEFAULT_KEYWORD_CONFIG.unrecognizedFallbackText,
        buttons,
      },
    ],
    recognizedAction: 'Respuesta no reconocida -> Fallback con botones de la pregunta pendiente',
  };
}
