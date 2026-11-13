import {
  AccountVerificationStatus,
  AutoMessage,
  DeterministicKeywordConfig,
  FlowStageId,
  FlowStepId,
  InitialPlanId,
  AdvancedPlanId,
  TelegramButton,
  TelegramUser,
  StageTransitionRecord,
} from '../types';

export const DEFAULT_REGISTRATION_LINK = 'https://1xbet-col.com?bf=632b4337f60c4_15751275401';

export const DEFAULT_REGISTRATION_PHOTOS: string[] = [
  '/public/assets/aistudio/IMG_8045_386300d5.jpeg',
  '/public/assets/aistudio/IMG_8046_e22d614e.jpeg',
  '/public/assets/aistudio/IMG_8047_fd76850d.jpeg',
  '/public/assets/aistudio/IMG_8048_34b6bffb.jpeg',
  '/public/assets/aistudio/IMG_8049_347e9a5a.jpeg',
  '/public/assets/aistudio/IMG_8050_f9c1e958.jpeg',
];

export const DEFAULT_PLANS_MESSAGE_TEXT = `💎 *ESTAS SON LAS OPCIONES INICIALES*

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

Los premios están sujetos a las reglas del juego y no representan ganancias garantizadas.`;

export const DEFAULT_REGISTRATION_MESSAGE_TEXT = `📝 *¡VAMOS A PREPARAR TU REGISTRO!*

Para continuar, sigue estos pasos:

1. Ingresa al enlace oficial.
2. Completa los datos solicitados.
3. Revisa que tu cuenta haya quedado registrada.
4. Consulta las imágenes de orientación que aparecen a continuación para completar el registro correctamente.

🔗 *ENLACE DE REGISTRO:*
{LINK}

📸 *GUÍA VISUAL DE REGISTRO:*`;

export const DEFAULT_DEPOSIT_PROMPT_TEXT = `💳 *¡ENVÍANOS TU COMPROBANTE!*

Por favor, envíame la fotografía o captura del comprobante de tu depósito en este mismo chat.

🔍 Nuestro equipo verificará manualmente tu pago desde el panel de administración.

⏳ Tu solicitud quedará pendiente de verificación.

IMPORTANTE: El envío del comprobante no significa que el depósito esté aprobado.`;

export const DEFAULT_APPROVAL_MESSAGE_TEXT = `🎮 *¡VERIFICACIÓN COMPLETADA!*

Tu comprobante ha sido revisado y aprobado por nuestro equipo.

Ahora puedes acceder al material de orientación y conocer la dinámica del juego.

💎 A continuación encontrarás cinco rondas de ejemplo para familiarizarte con el funcionamiento de las casillas.`;

export const DEFAULT_FIVE_ROUNDS_MESSAGE_TEXT = `🎮 *SEÑALES DE ORIENTACIÓN*

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

💎 *RONDA 3*
Trampas: 2 💣
Aperturas de ejemplo: 1 💎
🟫🟫🟫🟫🟫
🟫🟫🟫🟫🟫
🟫🟫🟫🟫🟫
🟫💎🟫🟫🟫
🟫🟫🟫🟫🟫

💎 *RONDA 4*
Trampas: 2 💣
Aperturas de ejemplo: 2 💎
🟫🟫🟫🟫💎
🟫🟫🟫🟫🟫
🟫🟫🟫🟫🟫
🟫🟫🟫🟫🟫
🟫🟫💎🟫🟫

💎 *RONDA 5*
Trampas: 2 💣
Aperturas de ejemplo: 1 💎
🟫🟫🟫🟫🟫
🟫🟫🟫🟫🟫
🟫🟫💎🟫🟫
🟫🟫🟫🟫🟫
🟫🟫🟫🟫🟫

👀 *INSTRUCCIONES*

Estas rondas son ejemplos ilustrativos para que te familiarices con la dinámica del tablero.

El número de trampas está configurado en 2 minas únicamente como referencia visual.

Este material es orientativo y no garantiza resultados futuros ni representa casillas seguras verificadas.`;

export const DEFAULT_KEYWORD_CONFIG: DeterministicKeywordConfig = {
  keywordsYes: [
    'si', 'sí', 'claro', 'correcto', 'ya lo conozco', 'me interesa', 'si me interesa',
    'sí me interesa', 'obvio', 'por supuesto', 'ya me registre', 'ya me registré',
    'ya lo encontre', 'ya lo encontré', 'dale', 'seguro', 'confirmar', 'yes'
  ],
  keywordsNo: [
    'no', 'todavia no', 'todavía no', 'nunca he jugado', 'soy principiante',
    'no por ahora', 'no me interesa', 'nunca', 'nop', 'cero', 'aun no', 'aún no'
  ],
  keywordsColombia: [
    'colombia', 'colombiano', 'colombiana', 'medellin', 'medellín', 'bogota',
    'bogotá', 'cali', 'barranquilla', 'bucaramanga', 'cartagena', 'pereira',
    'paisa', 'co'
  ],
  keywordsOtherCountry: [
    'mexico', 'méxico', 'peru', 'perú', 'argentina', 'otro', 'otro país', 'otro pais',
    'chile', 'ecuador', 'venezuela', 'bolivia', 'uruguay', 'paraguay', 'panama',
    'panamá', 'costa rica', 'guatemala', 'españa', 'espana', 'estados unidos', 'usa'
  ],
  keywordsWantMore: [
    'quiero saber mas', 'quiero saber más', 'mas info', 'más info', 'informacion',
    'información', 'detalles'
  ],
  keywordsNotNow: [
    'no por ahora', 'luego', 'despues', 'después', 'mas tarde', 'más tarde', 'cancelar'
  ],
  keywordsNeedHelp: [
    'necesito ayuda', 'ayuda', 'como registrarse', 'cómo registrarse', 'tutorial registro',
    'no se como', 'no sé cómo', 'no entiendo', 'orientacion', 'orientación'
  ],
  keywordsAlreadyFoundId: [
    'ya lo encontre', 'ya lo encontré', 'lo tengo', 'encontrado', 'tengo el id',
    'ya lo se', 'ya lo sé'
  ],
  keywordsDepositDone: [
    'ya deposite', 'ya deposité', 'ya hice el deposito', 'ya hice el depósito',
    'ya realice el deposito', 'ya realicé el depósito',
    'deposito realizado', 'depósito realizado', 'ya pague', 'ya pagué', 'pago realizado',
    'listo', 'ya esta', 'ya está', 'transferencia realizada', 'ya transferi', 'ya transferí',
    'listo el deposito', 'listo el pago', 'comprobante'
  ],
  keywordsPracticeDone: [
    'ya termine', 'ya terminé', 'termine la practica', 'terminé la práctica',
    'ya hice el ejercicio', 'quiero continuar', 'continuar', 'listo la practica',
    'practica terminada', 'práctica terminada', 'terminado', 'siguiente paso'
  ],
  idRegex: '^\\d{6,12}$',
  unrecognizedFallbackText:
    'No logré identificar tu respuesta. Por favor, pulsa una de las opciones que te he dejado en los botones para continuar con el proceso.',
  customMinesContentText:
    `💎 *ANÁLISIS Y ESTRATEGIA DE MINES — JUAN CARLOS* 💎\n\nEn este tablero de 5×5 (25 casillas), la disciplina en el cobro (Cash Out) es el factor clave.\n\n• Configuración recomendada para práctica: 3 o 4 minas.\n• En 3 minas, hay 22 diamantes libres y 3 ocultas.\n• Busca entre 2 y 4 aciertos por ronda y asegura el retiro.\n\n⚠️ *Aviso de transparencia:* Recuerda que cada ronda de Mines es totalmente aleatoria e independiente. No existen señales ni trucos que garanticen ganancias fijas.`,
  customPlatformReasonText:
    `Aquí podrás conocer más detalles sobre la plataforma y revisar sus condiciones antes de decidir si deseas utilizarla.\n\nHe elegido esta plataforma por su estabilidad en el juego Mines, rapidez en las operaciones y trayectoria internacional. Revisa sus términos y juega de manera responsable (+18).`,
  registrationLink: DEFAULT_REGISTRATION_LINK,
  registrationPhotoUrls: DEFAULT_REGISTRATION_PHOTOS,
  plansMessageText: DEFAULT_PLANS_MESSAGE_TEXT,
  registrationMessageText: DEFAULT_REGISTRATION_MESSAGE_TEXT,
  depositPromptText: DEFAULT_DEPOSIT_PROMPT_TEXT,
  approvalMessageText: DEFAULT_APPROVAL_MESSAGE_TEXT,
  fiveRoundsMessageText: DEFAULT_FIVE_ROUNDS_MESSAGE_TEXT,
  scheduledDelayMinutes: 0,
};

export interface OutgoingTelegramMessage {
  text: string;
  mediaUrl?: string;
  mediaType?: 'photo' | 'video';
  additionalMediaUrls?: string[];
  isMediaGroup?: boolean;
  albumCaption?: string;
  mediaGroupItems?: { type: 'photo' | 'video'; url: string }[];
  buttons?: TelegramButton[];
  stepTriggered?: FlowStepId;
}

export interface EngineResult {
  updatedUser: TelegramUser;
  messagesToSend: OutgoingTelegramMessage[];
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
    if (normalized === normKw) return true;
    const regex = new RegExp(`(^|\\s)${normKw}(\\s|$)`, 'i');
    return regex.test(normalized);
  });
}

/**
 * Creates an immutable transition record for auditability
 */
export function createTransitionRecord(
  fromStage: string,
  toStage: string,
  actor: 'user' | 'admin' | 'system',
  adminId?: string,
  reason?: string
): StageTransitionRecord {
  return {
    id: `tr-${Date.now()}-${Math.random().toString(36).substring(7)}`,
    fromStage,
    toStage,
    timestamp: new Date().toISOString(),
    actor,
    adminId,
    reason,
  };
}

/**
 * Pure Deterministic Engine for the 3-Stage Juan Carlos | Mines AI Flow
 */
export function processDeterministicUpdate(
  user: TelegramUser,
  rawInput: string,
  callbackData?: string,
  config: DeterministicKeywordConfig = DEFAULT_KEYWORD_CONFIG,
  customMessagesMap?: Map<FlowStepId, AutoMessage> | Record<string, AutoMessage>,
  options?: { adminTelegramId?: string; publicBaseUrl?: string }
): EngineResult {
  const inputSource = callbackData || rawInput || '';
  const norm = normalizeInput(inputSource);
  const trimmed = inputSource.trim();

  const isStart =
    norm === '/start' ||
    norm.startsWith('/start ') ||
    norm.startsWith('/start@') ||
    norm === 'start' ||
    norm === 'iniciar' ||
    norm === '/reiniciar' ||
    norm === 'reiniciar';

  const isAyuda =
    norm === '/ayuda' ||
    norm.startsWith('/ayuda@') ||
    norm === '/help' ||
    norm.startsWith('/help@') ||
    norm === 'ayuda';

  const isIdCommand =
    norm === '/id' ||
    norm.startsWith('/id@') ||
    norm === 'mi id' ||
    norm === 'id';

  const transitions = user.stageTransitions ? [...user.stageTransitions] : [];

  const updatedUser: TelegramUser = {
    ...user,
    lastActivity: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    messagesReceived: (user.messagesReceived || 0) + 1,
    stageTransitions: transitions,
  };

  const messagesToSend: OutgoingTelegramMessage[] = [];

  // ==========================================
  // GLOBAL COMMAND: /ayuda
  // ==========================================
  if (isAyuda) {
    updatedUser.messagesSent = (updatedUser.messagesSent || 0) + 1;
    messagesToSend.push({
      text: `👋 *Juan Carlos | Mines AI 💎 — Centro de Asistencia*

Aquí tienes información sobre tu estado en el bot:

• *Etapa actual:* ${updatedUser.stage || 'Etapa 1'}
• *País registrado:* ${updatedUser.country || updatedUser.declaredCountry || 'Sin registrar'}
• *Plan seleccionado:* ${updatedUser.initialPlanLabel || 'Ninguno'}
• *ID de Cuenta:* \`${updatedUser.accountId || 'Pendiente'}\`
• *Estado de Verificación:* ${updatedUser.accountStatus === 'verified' ? '✅ VERIFICADO' : updatedUser.accountStatus === 'rejected' ? '❌ RECHAZADO' : '⏳ PENDIENTE DE REVISIÓN'}

Si tienes alguna pregunta o inconveniente, déjame tu mensaje por aquí y te orientaré con gusto.`,
      buttons: [
        { id: 'btn-help-start', text: '🔄 Volver al Inicio (/start)', type: 'callback', value: '/start' },
      ],
    });
    return {
      updatedUser,
      messagesToSend,
      recognizedAction: 'Comando global /ayuda ejecutado',
    };
  }

  // ==========================================
  // GLOBAL COMMAND: /id
  // ==========================================
  if (isIdCommand) {
    updatedUser.messagesSent = (updatedUser.messagesSent || 0) + 1;
    messagesToSend.push({
      text: `👤 *Ficha de Usuario — Juan Carlos | Mines AI*

• *Telegram ID:* \`${updatedUser.telegramId}\`
• *Nombre:* ${updatedUser.name}
• *ID 1xBet:* \`${updatedUser.accountId || 'No enviado aún'}\`
• *Estado de Verificación:* *${updatedUser.accountStatus.toUpperCase()}*
• *Etapa actual:* \`${updatedUser.stage}\`
• *Estado:* ${updatedUser.flowStateLabel || updatedUser.stage}
• *Plan inicial:* ${updatedUser.initialPlanLabel || 'Sin seleccionar'}
• *Plan avanzado:* ${updatedUser.advancedPlanLabel || 'Sin seleccionar'}`,
      buttons: [
        { id: 'btn-id-start', text: '▶️ Continuar', type: 'callback', value: '/start' },
      ],
    });
    return {
      updatedUser,
      messagesToSend,
      recognizedAction: 'Comando global /id ejecutado',
    };
  }

  // ==========================================
  // ETAPA 1: PASO 1 - BIENVENIDA (/start)
  // ==========================================
  if (isStart || !user.stage || user.currentStep === 'START' || user.stage === 'stage_1_welcome') {
    const prevStage = updatedUser.stage || 'inicio';
    updatedUser.currentStep = 'stage_1_country';
    updatedUser.stage = 'stage_1_country';
    updatedUser.flowStateLabel = 'NUEVO USUARIO';
    updatedUser.status = 'active';
    transitions.push(
      createTransitionRecord(prevStage, 'stage_1_country', 'user', undefined, 'Comando /start')
    );

    // PASO 1. BIENVENIDA (Nueva imagen oficial de Mines adjunta directamente)
    messagesToSend.push({
      stepTriggered: 'BIENVENIDA',
      mediaUrl: '/public/assets/aistudio/IMG_8043_1305f354.jpeg',
      mediaType: 'photo',
      text: `👋 ¡Hola! Te doy la bienvenida.

Soy Juan Carlos y voy a acompañarte durante este proceso.

Quiero explicarte cómo funciona mi comunidad, mostrarte los recursos disponibles y ayudarte a conocer cada paso.

💎 Comencemos.`,
    });

    // PASO 2. PREGUNTAR EL PAÍS
    messagesToSend.push({
      stepTriggered: 'PAIS',
      text: `🌎 Antes de continuar, quiero conocerte un poco.

¿Desde qué país me escribes?`,
      buttons: [
        { id: 'btn-co', text: 'Colombia 🇨🇴', type: 'callback', value: 'pais_colombia' },
        { id: 'btn-mx', text: 'México 🇲🇽', type: 'callback', value: 'pais_mexico' },
        { id: 'btn-pe', text: 'Perú 🇵🇪', type: 'callback', value: 'pais_peru' },
        { id: 'btn-ar', text: 'Argentina 🇦🇷', type: 'callback', value: 'pais_argentina' },
        { id: 'btn-otro', text: 'Otro país 🌎', type: 'callback', value: 'pais_otro' },
      ],
    });

    updatedUser.messagesSent = (updatedUser.messagesSent || 0) + messagesToSend.length;
    return {
      updatedUser,
      messagesToSend,
      recognizedAction: 'Etapa 1: Bienvenida enviada y pregunta de país formulada',
    };
  }

  // ==========================================
  // ETAPA 1: PASO 2 -> PASO 3 & 4 (PAÍS -> PLANES INICIALES NUEVOS)
  // ==========================================
  if (user.currentStep === 'stage_1_country' || user.stage === 'stage_1_country') {
    let countrySelected = '';
    if (callbackData === 'pais_colombia' || matchesAnyKeyword(norm, config.keywordsColombia)) {
      countrySelected = 'Colombia 🇨🇴';
    } else if (callbackData === 'pais_mexico' || norm.includes('mexico') || norm.includes('méxico')) {
      countrySelected = 'México 🇲🇽';
    } else if (callbackData === 'pais_peru' || norm.includes('peru') || norm.includes('perú')) {
      countrySelected = 'Perú 🇵🇪';
    } else if (callbackData === 'pais_argentina' || norm.includes('argentina')) {
      countrySelected = 'Argentina 🇦🇷';
    } else if (callbackData === 'pais_otro' || matchesAnyKeyword(norm, config.keywordsOtherCountry)) {
      countrySelected = 'Otro país 🌎';
    }

    if (countrySelected) {
      updatedUser.country = countrySelected;
      updatedUser.declaredCountry = countrySelected;
      updatedUser.currentStep = 'stage_1_plans';
      updatedUser.stage = 'stage_1_plans';
      updatedUser.flowStateLabel = 'NUEVO USUARIO';
      transitions.push(
        createTransitionRecord('stage_1_country', 'stage_1_plans', 'user', undefined, `Seleccionó país: ${countrySelected}`)
      );

      // PASO 3. EXPLICACIÓN GENERAL
      messagesToSend.push({
        stepTriggered: 'EXPLICACION',
        text: `Perfecto, ¡gracias por contarme! 🤝

Te explico cómo funciona el proceso.

Primero conocerás Mines y los recursos disponibles. Después podrás elegir uno de los planes iniciales, completar tu registro y enviarme tu comprobante de depósito para revisión manual.

Si decides continuar, una vez validado tu pago te mostraré el material de orientación y las cinco rondas de ejemplo.

Recuerda que Mines es un juego de azar. Ninguna aplicación, análisis o señal puede garantizar que una casilla sea segura ni asegurar ganancias.`,
      });

      // PASO 4. PRESENTACIÓN DE LOS TRES PLANES INICIALES (MENSAJE ACTUALIZADO)
      const plansText = config.plansMessageText?.trim() || DEFAULT_PLANS_MESSAGE_TEXT;
      messagesToSend.push({
        stepTriggered: 'PLANES_INICIALES',
        text: plansText,
        buttons: [
          { id: 'btn-p1', text: '🥉 PLAN 1 — $15.000', type: 'callback', value: 'plan_15000' },
          { id: 'btn-p2', text: '🥈 PLAN 2 — $25.000', type: 'callback', value: 'plan_25000' },
          { id: 'btn-p3', text: '🥇 PLAN 3 — $40.000', type: 'callback', value: 'plan_40000' },
        ],
      });

      updatedUser.messagesSent = (updatedUser.messagesSent || 0) + messagesToSend.length;
      return {
        updatedUser,
        messagesToSend,
        recognizedAction: `País guardado (${countrySelected}) y 3 planes iniciales actualizados presentados`,
      };
    }

    // Unrecognized country
    return returnUnrecognized(updatedUser, [
      { id: 'btn-co', text: 'Colombia 🇨🇴', type: 'callback', value: 'pais_colombia' },
      { id: 'btn-mx', text: 'México 🇲🇽', type: 'callback', value: 'pais_mexico' },
      { id: 'btn-pe', text: 'Perú 🇵🇪', type: 'callback', value: 'pais_peru' },
      { id: 'btn-ar', text: 'Argentina 🇦🇷', type: 'callback', value: 'pais_argentina' },
      { id: 'btn-otro', text: 'Otro país 🌎', type: 'callback', value: 'pais_otro' },
    ]);
  }

  // ==========================================
  // ETAPA 1: SELECCIÓN DE PLAN -> REGISTRO CON ENLACE E IMÁGENES CONFIGURABLES
  // ==========================================
  if (user.currentStep === 'stage_1_plans' || user.stage === 'stage_1_plans') {
    let chosenPlan: InitialPlanId | undefined = undefined;
    let chosenPlanLabel = '';
    let planDetailsText = '';

    if (callbackData === 'plan_15000' || norm.includes('15000') || norm.includes('15.000') || norm.includes('plan 1')) {
      chosenPlan = 'plan_15000';
      chosenPlanLabel = 'PLAN 1 — $15.000 COP';
      planDetailsText = `🥉 *PLAN 1 — $15.000 COP*\n💰 Premio indicado: $75.000 COP.\n\n• Incluye guía paso a paso de registro, orientación inicial y material de ejemplo tras la verificación manual de tu comprobante.`;
    } else if (callbackData === 'plan_25000' || norm.includes('25000') || norm.includes('25.000') || norm.includes('plan 2')) {
      chosenPlan = 'plan_25000';
      chosenPlanLabel = 'PLAN 2 — $25.000 COP';
      planDetailsText = `🥈 *PLAN 2 — $25.000 COP*\n💰 Premio indicado: $115.000 COP.\n\n• Incluye guía paso a paso de registro, recursos adicionales y material de orientación tras la verificación manual de tu comprobante.`;
    } else if (callbackData === 'plan_40000' || norm.includes('40000') || norm.includes('40.000') || norm.includes('plan 3')) {
      chosenPlan = 'plan_40000';
      chosenPlanLabel = 'PLAN 3 — $40.000 COP';
      planDetailsText = `🥇 *PLAN 3 — $40.000 COP*\n💰 Premio indicado: $35.000 COP.\n📱 Incluye acceso a la aplicación de apoyo con herramientas de análisis de casillas y material de orientación tras la verificación manual de tu comprobante.`;
    }

    if (chosenPlan) {
      updatedUser.initialPlan = chosenPlan;
      updatedUser.initialPlanLabel = chosenPlanLabel;
      updatedUser.currentStep = 'stage_1_registration';
      updatedUser.stage = 'stage_1_registration';
      updatedUser.paymentStatus = 'unpaid';
      updatedUser.flowStateLabel = 'REGISTRO PENDIENTE';
      transitions.push(
        createTransitionRecord('stage_1_plans', 'stage_1_plans', 'user', undefined, `PLAN SELECCIONADO: ${chosenPlanLabel}`)
      );
      transitions.push(
        createTransitionRecord('stage_1_plans', 'stage_1_registration', 'system', undefined, `Envió guía de registro para ${chosenPlanLabel}`)
      );

      // 1. Confirmación y detalles del plan seleccionado
      messagesToSend.push({
        stepTriggered: 'RESPUESTA_PLAN',
        text: `¡Excelente elección! 🤝

He guardado tu selección en tu cuenta de Telegram:
${planDetailsText}

⚠️ Los premios están sujetos a las reglas del juego y no representan ganancias garantizadas.`,
      });

      // 2. Mensaje de registro con enlace configurable
      const registrationLink = config.registrationLink?.trim() || DEFAULT_REGISTRATION_LINK;
      const rawRegTemplate = config.registrationMessageText?.trim() || DEFAULT_REGISTRATION_MESSAGE_TEXT;
      const registrationText = rawRegTemplate.includes('{LINK}')
        ? rawRegTemplate.replace(/\{LINK\}/g, registrationLink)
        : `${rawRegTemplate}\n\n🔗 *ENLACE DE REGISTRO:*\n${registrationLink}`;

      const configuredPhotos =
        config.registrationPhotoUrls && config.registrationPhotoUrls.length > 0
          ? config.registrationPhotoUrls.filter((u) => Boolean(u && u.trim()))
          : DEFAULT_REGISTRATION_PHOTOS;

      // Chunk photos into batches of 10 (Telegram sendMediaGroup max = 10 items)
      const firstBatch = configuredPhotos.slice(0, 10);
      const extraBatches: string[][] = [];
      for (let i = 10; i < configuredPhotos.length; i += 10) {
        extraBatches.push(configuredPhotos.slice(i, i + 10));
      }

      messagesToSend.push({
        stepTriggered: 'GUIA_REGISTRO',
        isMediaGroup: firstBatch.length > 0,
        albumCaption: registrationText,
        mediaGroupItems: firstBatch.map((url) => ({ type: 'photo', url })),
        text: `Sigue las imágenes en orden (del 1 al ${configuredPhotos.length}) para completar tu registro.\n\nCuando hayas completado el registro, pulsa el botón «✅ YA COMPLETÉ EL REGISTRO» para continuar con el envío y verificación de tu ID:`,
        buttons: [
          {
            id: 'btn-1x-reg',
            text: '🔗 ABRIR ENLACE DE REGISTRO',
            type: 'url',
            value: registrationLink,
          },
          {
            id: 'btn-continue-reg',
            text: '✅ YA COMPLETÉ EL REGISTRO',
            type: 'callback',
            value: 'continuar_a_guia_mines',
          },
        ],
      });

      for (const batch of extraBatches) {
        messagesToSend.push({
          stepTriggered: 'GUIA_REGISTRO',
          isMediaGroup: true,
          mediaGroupItems: batch.map((url) => ({ type: 'photo', url })),
          text: '',
        });
      }

      updatedUser.messagesSent = (updatedUser.messagesSent || 0) + messagesToSend.length;
      return {
        updatedUser,
        messagesToSend,
        recognizedAction: `Plan registrado (${chosenPlanLabel}) y guía de registro configurable (${configuredPhotos.length} fotos + enlace) enviada`,
      };
    }

    return returnUnrecognized(updatedUser, [
      { id: 'btn-p1', text: '🥉 PLAN 1 — $15.000', type: 'callback', value: 'plan_15000' },
      { id: 'btn-p2', text: '🥈 PLAN 2 — $25.000', type: 'callback', value: 'plan_25000' },
      { id: 'btn-p3', text: '🥇 PLAN 3 — $40.000', type: 'callback', value: 'plan_40000' },
    ]);
  }

  // ==========================================
  // DETECCIÓN DE AVISO DE DEPÓSITO (SOLO TRAS VERIFICACIÓN DE ID)
  // Frases: Ya deposité / Ya hice el depósito / Ya pagué / Listo / Depósito realizado / Ya está / Transferencia realizada
  // Nunca aprueba automáticamente; solicita la fotografía del comprobante.
  // ==========================================
  const stagesEligibleForDepositNotice = new Set<string>([
    'stage_2_id_verified',
    'stage_2_awaiting_receipt',
    'stage_2_payment_pending',
    'stage_2_payment_rejected',
  ]);

  const isUserIdVerified =
    user.accountStatus === 'verified' || stagesEligibleForDepositNotice.has(user.stage || '');

  const isDepositAnnouncement =
    isUserIdVerified &&
    (callbackData === 'deposito_realizado' ||
      (stagesEligibleForDepositNotice.has(user.stage || '') && matchesAnyKeyword(norm, config.keywordsDepositDone)));

  if (isDepositAnnouncement) {
    const prevStage = user.stage || 'stage_2_id_verified';
    updatedUser.paymentStatus = 'deposit_notified';
    updatedUser.depositNotifiedAt = new Date().toISOString();
    updatedUser.currentStep = 'AVISO_DEPOSITO';
    updatedUser.stage = 'stage_2_awaiting_receipt';
    updatedUser.flowStateLabel = 'COMPROBANTE PENDIENTE';
    transitions.push(
      createTransitionRecord(
        prevStage,
        'stage_2_awaiting_receipt',
        'user',
        undefined,
        'Usuario notificó haber realizado depósito tras verificación de ID -> Solicitando foto del comprobante'
      )
    );

    const promptText = config.depositPromptText?.trim() || DEFAULT_DEPOSIT_PROMPT_TEXT;
    messagesToSend.push({
      stepTriggered: 'AVISO_DEPOSITO',
      text: promptText,
    });

    updatedUser.messagesSent = (updatedUser.messagesSent || 0) + 1;
    return {
      updatedUser,
      messagesToSend,
      recognizedAction: 'Aviso de depósito detectado (ID verificado) -> Solicitando captura/foto del comprobante (COMPROBANTE PENDIENTE)',
    };
  }

  if (callbackData === 'deposito_realizado' && !isUserIdVerified) {
    messagesToSend.push({
      stepTriggered: 'SOLICITUD_ID',
      text: `⏳ Antes de pasar al depósito, primero debemos completar la verificación de tu ID de cuenta.\n\nPor favor, envíame tu ID numérico (de 6 a 12 dígitos) o aguarda la confirmación de nuestro equipo en este chat.`,
    });
    updatedUser.messagesSent = (updatedUser.messagesSent || 0) + 1;
    return {
      updatedUser,
      messagesToSend,
      recognizedAction: 'Aviso de depósito bloqueado hasta verificar ID del usuario',
    };
  }

  // ==========================================
  // ETAPA 1: PASO 7, 8, 9, 10 (REGISTRO COMPLETADO -> GUÍA MINES -> FOTOS ID -> SOLICITUD ID)
  // ==========================================
  if (
    user.currentStep === 'stage_1_registration' ||
    user.stage === 'stage_1_registration'
  ) {
    if (
      callbackData === 'continuar_a_guia_mines' ||
      callbackData === 'registro_completado' ||
      matchesAnyKeyword(norm, ['continuar', 'ya me registre', 'ya me registré', 'ya complete el registro', 'ya completé el registro', 'ya vi el video'])
    ) {
      updatedUser.currentStep = 'stage_1_game_guide';
      updatedUser.stage = 'stage_1_game_guide';
      updatedUser.flowStateLabel = 'REGISTRO COMPLETADO';
      transitions.push(
        createTransitionRecord('stage_1_registration', 'stage_1_game_guide', 'user', undefined, 'REGISTRO COMPLETADO -> Guía de Mines y obtención de ID')
      );

      // PASO 7. GUÍA PARA ENCONTRAR MINES
      messagesToSend.push({
        stepTriggered: 'GUIA_MINES',
        text: `🎮 ¡Registro completado! Ahora te voy a mostrar cómo encontrar el juego Mines.`,
      });

      messagesToSend.push({
        stepTriggered: 'GUIA_MINES',
        text: `Revisa el procedimiento en el video y localiza el juego Mines dentro de la plataforma.`,
        mediaUrl: '/public/assets/aistudio/-6292808403713465323_4367ba72.mp4',
        mediaType: 'video',
      });

      // PASO 8. EXPLICACIÓN DE POR QUÉ ELEGÍ ESTA PLATAFORMA
      const platformText = config.customPlatformReasonText ||
        `Aquí podrás conocer más detalles sobre la plataforma y revisar sus condiciones antes de decidir si deseas utilizarla.`;

      messagesToSend.push({
        stepTriggered: 'POR_QUE_PLATAFORMA',
        text: `🤝 Quiero compartirte por qué decidí utilizar esta plataforma.

Te mostraré una imagen y una explicación sobre mi experiencia y los motivos de mi elección.\n\n${platformText}`,
        mediaUrl: '/public/assets/aistudio/IMG_8056_475a1672.jpeg',
        mediaType: 'photo',
      });

      // PASO 9. CÓMO ENCONTRAR EL ID
      messagesToSend.push({
        stepTriggered: 'COMO_ENCONTRAR_ID',
        text: `📱 Para identificar y verificar tu cuenta antes del depósito, busca tu ID numérico siguiendo estas tres imágenes:`,
      });

      messagesToSend.push({
        stepTriggered: 'COMO_ENCONTRAR_ID',
        text: ``,
        isMediaGroup: true,
        mediaGroupItems: [
          { type: 'photo', url: '/public/assets/aistudio/IMG_8001_4c69f620.jpeg' },
          { type: 'photo', url: '/public/assets/aistudio/IMG_8002_9518c00d.jpeg' },
          { type: 'photo', url: '/public/assets/aistudio/IMG_8003_6df7b69a.jpeg' },
        ],
      });

      // PASO 10. SOLICITAR EL ID (El botón de depósito aparecerá únicamente después de verificar el ID)
      messagesToSend.push({
        stepTriggered: 'SOLICITUD_ID',
        text: `📩 Envíame ahora tu ID de cuenta numérico (ej. \`1603722093\`) para revisarlo y verificarlo:`,
      });

      updatedUser.messagesSent = (updatedUser.messagesSent || 0) + messagesToSend.length;
      return {
        updatedUser,
        messagesToSend,
        recognizedAction: 'REGISTRO COMPLETADO -> Guía Mines + Foto 1xBet + Álbum 3 fotos de ID enviado.',
      };
    }

    // If user sends something else while in stage_1_registration (e.g., numeric ID directly)
    const cleanedDigits = trimmed.replace(/\s+/g, '');
    const numericRegex = new RegExp(config.idRegex || '^\\d{6,12}$');
    if (numericRegex.test(cleanedDigits)) {
      updatedUser.accountId = cleanedDigits;
      updatedUser.accountStatus = 'pending_verification';
      updatedUser.currentStep = 'stage_1_id_pending';
      updatedUser.stage = 'stage_1_id_pending';
      updatedUser.flowStateLabel = 'REGISTRO COMPLETADO';
      transitions.push(
        createTransitionRecord('stage_1_registration', 'stage_1_id_pending', 'user', undefined, `Envió ID de cuenta: ${cleanedDigits}`)
      );

      messagesToSend.push({
        stepTriggered: 'ESPERA_VERIFICACION',
        text: `¡Recibí tu ID (\`${cleanedDigits}\`)! 📩\n\nAhora voy a revisarlo desde mi panel administrativo. En cuanto quede verificado, te enviaré las instrucciones para que realices tu depósito y habilitaremos el botón correspondiente.`,
      });
      updatedUser.messagesSent = (updatedUser.messagesSent || 0) + 1;
      return {
        updatedUser,
        messagesToSend,
        recognizedAction: `ID recibido (${cleanedDigits}) desde registro -> stage_1_id_pending`,
      };
    }

    const registrationLink = config.registrationLink?.trim() || DEFAULT_REGISTRATION_LINK;
    return returnUnrecognized(updatedUser, [
      { id: 'btn-1x-reg-fb', text: '🔗 ABRIR ENLACE DE REGISTRO', type: 'url', value: registrationLink },
      { id: 'btn-continue-reg-fb', text: '✅ YA COMPLETÉ EL REGISTRO', type: 'callback', value: 'continuar_a_guia_mines' },
    ]);
  }

  // ==========================================
  // ETAPA 1: PASO 11 - RECEPCIÓN Y ESPERA DE VERIFICACIÓN ADMINISTRATIVA DE ID
  // ==========================================
  if (user.currentStep === 'stage_1_game_guide' || user.stage === 'stage_1_game_guide') {
    const cleanedDigits = trimmed.replace(/\s+/g, '');
    const numericRegex = new RegExp(config.idRegex || '^\\d{6,12}$');

    if (numericRegex.test(cleanedDigits)) {
      updatedUser.accountId = cleanedDigits;
      updatedUser.accountStatus = 'pending_verification';
      updatedUser.currentStep = 'stage_1_id_pending';
      updatedUser.stage = 'stage_1_id_pending';
      updatedUser.flowStateLabel = 'REGISTRO COMPLETADO';
      transitions.push(
        createTransitionRecord(
          'stage_1_game_guide',
          'stage_1_id_pending',
          'user',
          undefined,
          `Envió ID de cuenta: ${cleanedDigits}. En espera de verificación administrativa por Juan Carlos.`
        )
      );

      messagesToSend.push({
        stepTriggered: 'ESPERA_VERIFICACION',
        text: `¡Recibí tu ID! 📩

Ahora voy a revisarlo desde mi panel administrativo.

En cuanto quede verificado, recibirás un mensaje con las instrucciones para realizar tu depósito y el botón para reportarlo.`,
      });

      updatedUser.messagesSent = (updatedUser.messagesSent || 0) + 1;
      return {
        updatedUser,
        messagesToSend,
        recognizedAction: `ID recibido (${cleanedDigits}) -> Estado stage_1_id_pending fijado. En espera de admin.`,
      };
    }

    if (callbackData === 'ver_fotos_id_again' || norm.includes('donde') || norm.includes('ayuda')) {
      messagesToSend.push({
        stepTriggered: 'COMO_ENCONTRAR_ID',
        text: `📱 Revisa las 3 fotografías que te compartí arriba:\n1. Icono de perfil (arriba a la derecha)\n2. Presiona "Datos personales"\n3. Copia el número que dice "Número de la cuenta"\n\nEnvíame solo ese número (ej. 1603722093):`,
      });
      updatedUser.messagesSent = (updatedUser.messagesSent || 0) + 1;
      return {
        updatedUser,
        messagesToSend,
        recognizedAction: 'Recordatorio de fotos de ID enviado',
      };
    }

    messagesToSend.push({
      stepTriggered: 'SOLICITUD_ID',
      text: `El ID de cuenta debe ser un número de entre 6 y 12 dígitos (por ejemplo: \`1603722093\`) sin letras, espacios ni símbolos.\n\nPor favor, envíame únicamente ese número para verificar tu cuenta.`,
    });
    updatedUser.messagesSent = (updatedUser.messagesSent || 0) + 1;
    return {
      updatedUser,
      messagesToSend,
      recognizedAction: 'ID no numérico -> Solicitando reenvío de número válido',
    };
  }

  // ==========================================
  // USUARIO ESCRIBE MIENTRAS ESTÁ EN ESPERA DE VERIFICACIÓN ADMINISTRATIVA DE ID
  // ==========================================
  if (user.currentStep === 'stage_1_id_pending' || user.stage === 'stage_1_id_pending') {
    const cleanedDigits = trimmed.replace(/\s+/g, '');
    const numericRegex = new RegExp(config.idRegex || '^\\d{6,12}$');

    if (numericRegex.test(cleanedDigits)) {
      updatedUser.accountId = cleanedDigits;
      updatedUser.accountStatus = 'pending_verification';
      transitions.push(
        createTransitionRecord(
          'stage_1_id_pending',
          'stage_1_id_pending',
          'user',
          undefined,
          `Actualizó ID de cuenta a: ${cleanedDigits}`
        )
      );

      messagesToSend.push({
        stepTriggered: 'ESPERA_VERIFICACION',
        text: `¡ID actualizado! 📩

He registrado el nuevo número: \`${cleanedDigits}\`.

Continúo con la revisión desde mi panel administrativo. En cuanto quede verificado, recibirás la confirmación e instrucciones para realizar tu depósito.`,
      });

      updatedUser.messagesSent = (updatedUser.messagesSent || 0) + 1;
      return {
        updatedUser,
        messagesToSend,
        recognizedAction: `ID actualizado a ${cleanedDigits} en espera de admin`,
      };
    }

    messagesToSend.push({
      stepTriggered: 'ESPERA_VERIFICACION',
      text: `¡Hola! Tu ID de cuenta (\`${user.accountId || 'registrado'}\`) se encuentra actualmente en cola de revisión por parte de Juan Carlos en el panel administrativo.\n\nEn cuanto sea verificado, te avisaré por aquí para que puedas realizar tu depósito.`,
    });
    updatedUser.messagesSent = (updatedUser.messagesSent || 0) + 1;
    return {
      updatedUser,
      messagesToSend,
      recognizedAction: 'Recordatorio cortés: esperando verificación administrativa de ID',
    };
  }

  // ==========================================
  // ETAPA 2: ID VERIFICADO -> ESPERANDO QUE EL USUARIO REALICE EL DEPÓSITO Y PULSE EL BOTÓN
  // ==========================================
  if (user.stage === 'stage_2_id_verified') {
    const planLabel = user.initialPlanLabel || 'el plan que seleccionaste';
    messagesToSend.push({
      stepTriggered: 'INSTRUCCIONES_RECARGA',
      text: `💎 Tu ID ya fue verificado correctamente.

💳 Ahora realiza tu depósito correspondiente a *${planLabel}* siguiendo las indicaciones que te envié arriba y conserva tu comprobante.

👇 *Cuando ya hayas realizado el depósito, pulsa el botón de abajo:*`,
      buttons: [
        { id: 'btn-dep-done', text: '💳 YA REALICÉ EL DEPÓSITO', type: 'callback', value: 'deposito_realizado' },
      ],
    });
    updatedUser.messagesSent = (updatedUser.messagesSent || 0) + 1;
    return {
      updatedUser,
      messagesToSend,
      recognizedAction: 'ID verificado -> Recordando realizar depósito y pulsar botón YA REALICÉ EL DEPÓSITO',
    };
  }

  // ==========================================
  // ETAPA 2: ESPERA DE FOTO DE COMPROBANTE O REVISIÓN DE DEPÓSITO PENDIENTE / RECHAZADO
  // ==========================================
  if (user.stage === 'stage_2_awaiting_receipt') {
    messagesToSend.push({
      stepTriggered: 'AVISO_DEPOSITO',
      text: `📸 Por favor, envía la *fotografía o captura de pantalla* de tu comprobante de depósito directamente en este chat (usando el clip / galería de Telegram).

⏳ Una vez recibida la imagen, quedará en estado *PENDIENTE DE VERIFICACIÓN* para que nuestro equipo la apruebe manualmente.`,
    });
    updatedUser.messagesSent = (updatedUser.messagesSent || 0) + 1;
    return {
      updatedUser,
      messagesToSend,
      recognizedAction: 'Recordatorio: esperando fotografía del comprobante de depósito',
    };
  }

  if (user.stage === 'stage_2_payment_pending') {
    messagesToSend.push({
      stepTriggered: 'RECEPCION_COMPROBANTE',
      text: `🟡 *Tu comprobante se encuentra PENDIENTE DE VERIFICACIÓN.*

Nuestro equipo revisará manualmente tu depósito desde el panel de administración.

⏳ Tan pronto sea aprobado, recibirás automáticamente la confirmación y el material de orientación en este chat. ¡Gracias por tu paciencia! 🤝`,
    });
    updatedUser.messagesSent = (updatedUser.messagesSent || 0) + 1;
    return {
      updatedUser,
      messagesToSend,
      recognizedAction: 'Comprobante en cola manual -> Sin auto-aprobación',
    };
  }

  if (user.stage === 'stage_2_payment_rejected') {
    messagesToSend.push({
      stepTriggered: 'RECHAZO_PAGO',
      text: `❌ Tu comprobante anterior no pudo ser validado.

📸 Por favor, envía una *nueva fotografía o captura legible* de tu comprobante de depósito en este mismo chat para revisarlo nuevamente.`,
    });
    updatedUser.messagesSent = (updatedUser.messagesSent || 0) + 1;
    return {
      updatedUser,
      messagesToSend,
      recognizedAction: 'Depósito rechazado -> Solicitando nuevo comprobante válido',
    };
  }

  // ==========================================
  // ETAPA 2: FINALIZACIÓN DE PRÁCTICA -> PASO A ETAPA 3
  // ==========================================
  if (
    user.stage === 'stage_2_content_sent' ||
    user.stage === 'stage_2_payment_verified' ||
    callbackData === 'practica_terminada' ||
    callbackData === 'practica_ayuda' ||
    matchesAnyKeyword(norm, config.keywordsPracticeDone)
  ) {
    if (callbackData === 'practica_ayuda' || matchesAnyKeyword(norm, config.keywordsNeedHelp)) {
      messagesToSend.push({
        stepTriggered: 'FINALIZACION_ETAPA_2',
        text: `Claro, cuéntame qué inconveniente tienes y voy a orientarte.`,
        buttons: [
          { id: 'btn-pr-done', text: '✅ YA TERMINÉ LA PRÁCTICA', type: 'callback', value: 'practica_terminada' },
        ],
      });
      updatedUser.messagesSent = (updatedUser.messagesSent || 0) + 1;
      return {
        updatedUser,
        messagesToSend,
        recognizedAction: 'Usuario solicitó ayuda en práctica de Etapa 2',
      };
    }

    const isPracticeFinished =
      callbackData === 'practica_terminada' ||
      matchesAnyKeyword(norm, config.keywordsPracticeDone);

    if (isPracticeFinished) {
      updatedUser.practiceCompletedAt = new Date().toISOString();
      updatedUser.currentStep = 'stage_3_plans';
      updatedUser.stage = 'stage_3_plans';
      transitions.push(
        createTransitionRecord(
          user.stage,
          'stage_3_plans',
          'user',
          undefined,
          'Usuario confirmó expresamente haber terminado la práctica. Inicio de Etapa 3.'
        )
      );

      messagesToSend.push({
        stepTriggered: 'TRANSICION_ETAPA_3',
        text: `👏 ¡Excelente! Has completado esta parte del proceso.

Ahora quiero mostrarte dos alternativas adicionales con más recursos de acompañamiento.

Te explicaré qué incluye cada una para que puedas decidir con tranquilidad.`,
      });

      messagesToSend.push({
        stepTriggered: 'PLANES_AVANZADOS',
        text: `💎 OPCIONES DE ACOMPAÑAMIENTO AVANZADO

🥇 PLAN AVANZADO — $50.000 COP
- Recursos adicionales de acompañamiento.
- Asesoría con disponibilidad 24/7, según las condiciones de servicio.
- Orientación sobre el funcionamiento de Mines.

💎 PLAN PREMIUM — $100.000 COP
- Acceso a la aplicación de apoyo con herramientas de análisis de casillas.
- Asesoría con disponibilidad 24/7, según las condiciones de servicio.
- Acceso a los recursos premium incluidos.

Revisa los beneficios y condiciones antes de elegir.

Ninguna herramienta garantiza ganancias ni elimina el azar del juego.`,
        buttons: [
          { id: 'btn-adv-50', text: '🥇 PLAN AVANZADO — $50.000', type: 'callback', value: 'plan_avanzado_50000' },
          { id: 'btn-adv-100', text: '💎 PLAN PREMIUM — $100.000', type: 'callback', value: 'plan_premium_100000' },
        ],
      });

      updatedUser.messagesSent = (updatedUser.messagesSent || 0) + messagesToSend.length;
      return {
        updatedUser,
        messagesToSend,
        recognizedAction: 'Práctica confirmada -> Inicio formal de Etapa 3 (Planes avanzados)',
      };
    }
  }

  // ==========================================
  // ETAPA 3: SELECCIÓN DE PLAN AVANZADO ($50.000 / $100.000)
  // ==========================================
  if (user.currentStep === 'stage_3_plans' || user.stage === 'stage_3_plans') {
    let advancedPlan: AdvancedPlanId | undefined = undefined;
    let advancedPlanLabel = '';

    if (callbackData === 'plan_avanzado_50000' || norm.includes('50000') || norm.includes('50.000') || norm.includes('avanzado')) {
      advancedPlan = 'plan_50000';
      advancedPlanLabel = 'PLAN AVANZADO — $50.000 COP';
    } else if (callbackData === 'plan_premium_100000' || norm.includes('100000') || norm.includes('100.000') || norm.includes('premium')) {
      advancedPlan = 'plan_100000';
      advancedPlanLabel = 'PLAN PREMIUM — $100.000 COP';
    }

    if (advancedPlan) {
      updatedUser.advancedPlan = advancedPlan;
      updatedUser.advancedPlanLabel = advancedPlanLabel;
      updatedUser.currentStep = 'stage_3_terms_pending';
      updatedUser.stage = 'stage_3_terms_pending';
      transitions.push(
        createTransitionRecord(
          'stage_3_plans',
          'stage_3_terms_pending',
          'user',
          undefined,
          `Seleccionó plan avanzado: ${advancedPlanLabel}`
        )
      );

      if (advancedPlan === 'plan_50000') {
        messagesToSend.push({
          stepTriggered: 'SELECCION_AVANZADA',
          text: `¡De acuerdo! Has seleccionado el Plan Avanzado.

Te mostraré los detalles del acompañamiento y las condiciones para continuar.`,
        });
      } else {
        messagesToSend.push({
          stepTriggered: 'SELECCION_AVANZADA',
          text: `¡De acuerdo! Has seleccionado el Plan Premium.

Te mostraré cómo acceder a los recursos incluidos y cuáles son las condiciones del servicio.`,
        });
      }

      messagesToSend.push({
        stepTriggered: 'CONDICIONES_COMISION',
        text: `Quiero explicarte cómo funciona la comisión del acompañamiento.

Si aceptas un acuerdo de comisión del 10%, debe quedar definido por escrito qué se considera ganancia neta, cómo se calcula y cuándo se liquida.

No se debe cobrar comisión sobre pérdidas ni presentar esta condición como automática.`,
        buttons: [
          { id: 'btn-terms-acc', text: '✅ REVISAR Y ACEPTAR CONDICIONES', type: 'callback', value: 'terminos_aceptar' },
          { id: 'btn-terms-rej', text: '❌ NO ACEPTO', type: 'callback', value: 'terminos_rechazar' },
        ],
      });

      updatedUser.messagesSent = (updatedUser.messagesSent || 0) + messagesToSend.length;
      return {
        updatedUser,
        messagesToSend,
        recognizedAction: `Plan avanzado ${advancedPlanLabel} registrado. Condiciones de comisión enviadas.`,
      };
    }

    return returnUnrecognized(updatedUser, [
      { id: 'btn-adv-50', text: '🥇 PLAN AVANZADO — $50.000', type: 'callback', value: 'plan_avanzado_50000' },
      { id: 'btn-adv-100', text: '💎 PLAN PREMIUM — $100.000', type: 'callback', value: 'plan_premium_100000' },
    ]);
  }

  // ==========================================
  // ETAPA 3: ACEPTACIÓN O RECHAZO DE CONDICIONES
  // ==========================================
  if (user.currentStep === 'stage_3_terms_pending' || user.stage === 'stage_3_terms_pending') {
    const isAccepted = callbackData === 'terminos_aceptar' || matchesAnyKeyword(norm, ['acepto', 'aceptar', 'si acepto', 'sí acepto', 'de acuerdo']);
    const isRejected = callbackData === 'terminos_rechazar' || matchesAnyKeyword(norm, ['no acepto', 'rechazar', 'no deseo', 'cancelar']);

    if (isAccepted) {
      updatedUser.termsAccepted = true;
      updatedUser.termsAcceptedAt = new Date().toISOString();
      updatedUser.termsVersion = '1.0-comision-10%';
      updatedUser.currentStep = 'stage_3_completed';
      updatedUser.stage = 'stage_3_completed';
      updatedUser.status = 'completed';
      transitions.push(
        createTransitionRecord(
          'stage_3_terms_pending',
          'stage_3_completed',
          'user',
          undefined,
          'Aceptó formalmente las condiciones de comisión (10% sobre ganancia neta verificada).'
        )
      );

      messagesToSend.push({
        stepTriggered: 'FIN_RECORRIDO',
        text: `¡Excelente! He registrado tu aceptación de las condiciones. Bienvenido formalmente al acompañamiento. En breve me pondré en contacto contigo para coordinar los detalles.

¡Muchas gracias por confiar en este proceso! 💎`,
      });

      updatedUser.messagesSent = (updatedUser.messagesSent || 0) + 1;
      return {
        updatedUser,
        messagesToSend,
        recognizedAction: 'Condiciones de comisión aceptadas y registradas. Etapa 3 completada con éxito.',
      };
    }

    if (isRejected) {
      updatedUser.termsAccepted = false;
      updatedUser.currentStep = 'stage_3_completed';
      updatedUser.stage = 'stage_3_completed';
      updatedUser.status = 'completed';
      transitions.push(
        createTransitionRecord(
          'stage_3_terms_pending',
          'stage_3_completed',
          'user',
          undefined,
          'Usuario rechazó las condiciones de comisión. No se activa acuerdo.'
        )
      );

      messagesToSend.push({
        stepTriggered: 'FIN_RECORRIDO',
        text: `Entendido perfectamente. Las condiciones quedan sin efecto. Si en algún momento deseas consultarlas de nuevo, aquí estaré. ¡Gracias por tu tiempo! 🤝`,
      });

      updatedUser.messagesSent = (updatedUser.messagesSent || 0) + 1;
      return {
        updatedUser,
        messagesToSend,
        recognizedAction: 'Condiciones de comisión rechazadas. Acuerdo no activado.',
      };
    }

    return returnUnrecognized(updatedUser, [
      { id: 'btn-terms-acc', text: '✅ REVISAR Y ACEPTAR CONDICIONES', type: 'callback', value: 'terminos_aceptar' },
      { id: 'btn-terms-rej', text: '❌ NO ACEPTO', type: 'callback', value: 'terminos_rechazar' },
    ]);
  }

  // ==========================================
  // ETAPA 3 COMPLETADA: MENÚ FINAL
  // ==========================================
  if (user.stage === 'stage_3_completed') {
    messagesToSend.push({
      stepTriggered: 'FIN_RECORRIDO',
      text: `👋 ¡Hola de nuevo! Has completado el recorrido integral de tres etapas con Juan Carlos | Mines AI 💎.

• *ID Registrado:* \`${user.accountId || 'N/A'}\`
• *Verificación:* ✅ Verificado
• *Plan Elegido:* ${user.advancedPlanLabel || user.initialPlanLabel || 'Plan Básico'}
• *Acuerdo de Comisión:* ${user.termsAccepted ? '✅ Aceptado (10%)' : '❌ No activado'}

Si deseas revisar alguna sección o reiniciar el recorrido, pulsa el botón a continuación:`,
      buttons: [
        { id: 'btn-restart-final', text: '🔄 Reiniciar Bot (/start)', type: 'callback', value: '/start' },
      ],
    });

    updatedUser.messagesSent = (updatedUser.messagesSent || 0) + 1;
    return {
      updatedUser,
      messagesToSend,
      recognizedAction: 'Usuario en etapa final -> Recordatorio de estado',
    };
  }

  // Fallback genérico
  return returnUnrecognized(updatedUser, [
    { id: 'btn-restart-gen', text: '🔄 Reiniciar Bot (/start)', type: 'callback', value: '/start' },
  ]);
}

/**
 * Handles an incoming deposit receipt photo sent by a Telegram user (Punto 5).
 * NEVER auto-approves; moves user into COMPROBANTE PENDIENTE for manual admin verification.
 */
export function handleIncomingReceiptPhoto(
  user: TelegramUser,
  depositId: string
): EngineResult {
  const prevStage = user.stage || 'stage_2_awaiting_receipt';
  const transitions = user.stageTransitions ? [...user.stageTransitions] : [];
  transitions.push(
    createTransitionRecord(
      prevStage,
      'stage_2_payment_pending',
      'user',
      undefined,
      `Comprobante fotográfico recibido (${depositId}). Estado: PENDIENTE DE VERIFICACIÓN`
    )
  );

  const updatedUser: TelegramUser = {
    ...user,
    stage: 'stage_2_payment_pending',
    currentStep: 'stage_2_payment_pending',
    paymentStatus: 'receipt_pending',
    flowStateLabel: 'COMPROBANTE PENDIENTE',
    latestDepositId: depositId,
    depositNotifiedAt: user.depositNotifiedAt || new Date().toISOString(),
    lastActivity: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    messagesReceived: (user.messagesReceived || 0) + 1,
    messagesSent: (user.messagesSent || 0) + 1,
    stageTransitions: transitions,
  };

  return {
    updatedUser,
    messagesToSend: [
      {
        stepTriggered: 'RECEPCION_COMPROBANTE',
        text: `📸 *¡COMPROBANTE RECIBIDO!*

Hemos guardado la fotografía de tu comprobante (${updatedUser.initialPlanLabel || 'Plan seleccionado'}) para revisión manual.

🟡 *Estado:* PENDIENTE DE VERIFICACIÓN

⏳ Nuestro equipo validará la operación desde el panel de administración. En cuanto sea aprobada, recibirás automáticamente la confirmación y el material de orientación en este chat.`,
      },
    ],
    recognizedAction: `Comprobante guardado (${depositId}) -> Estado COMPROBANTE PENDIENTE (esperando admin)`,
  };
}

function returnUnrecognized(user: TelegramUser, buttons: TelegramButton[]): EngineResult {
  const updatedUser: TelegramUser = {
    ...user,
    messagesSent: (user.messagesSent || 0) + 1,
  };

  return {
    updatedUser,
    messagesToSend: [
      {
        text: DEFAULT_KEYWORD_CONFIG.unrecognizedFallbackText,
        buttons,
      },
    ],
    recognizedAction: 'Respuesta no reconocida -> Fallback con botones de la opción pendiente',
  };
}

/**
 * Returns the sequence of messages sent when admin accepts and verifies user's ID
 */
export function getEtapa2ActivationMessages(user: TelegramUser): OutgoingTelegramMessage[] {
  const planLabel = user.initialPlanLabel || 'el plan que seleccionaste';

  return [
    {
      stepTriggered: 'CONFIRMACION_ID',
      text: `💎 ¡Tu ID ha sido verificado correctamente!\n\nYa confirmé tu identificador y quedó registrado en nuestra base de datos.\n\nAhora ya puedes realizar el depósito correspondiente a tu plan.\n\n¡Gracias por completar esta parte! 🤝`,
    },
    {
      stepTriggered: 'CONFIRMACION_PLAN',
      text: `¡Perfecto! Ya podemos continuar con *${planLabel}*.\n\nEs momento de realizar tu depósito. Revisa cuidadosamente el importe, las instrucciones de pago y conserva tu comprobante.`,
    },
    {
      stepTriggered: 'INSTRUCCIONES_RECARGA',
      isMediaGroup: true,
      mediaGroupItems: [
        { type: 'photo', url: '/public/assets/aistudio/IMG_8055_1c7f857b.jpeg' },
        { type: 'photo', url: '/public/assets/aistudio/IMG_8053_cc818551.jpeg' },
      ],
      text: `💳 *¡ES MOMENTO DE REALIZAR TU DEPÓSITO!*

Ya puedes hacer tu depósito para *${planLabel}* siguiendo las instrucciones de las imágenes anteriores.

1️⃣ Verifica que los datos del destinatario y el valor sean correctos.
2️⃣ Conserva la captura o fotografía del comprobante.
3️⃣ No realices una segunda transferencia si todavía no se ha confirmado la primera.

👇 *Cuando ya hayas realizado tu depósito, pulsa el botón de abajo:*`,
      buttons: [
        { id: 'btn-dep-done', text: '💳 YA REALICÉ EL DEPÓSITO', type: 'callback', value: 'deposito_realizado' },
      ],
    },
  ];
}

/**
 * Returns the sequence of messages sent ONLY when admin manually approves deposit (Puntos 7 y 8 + Video Mines)
 */
export function getEtapa2ContentMessages(
  user: TelegramUser,
  customContent?: string,
  config?: Partial<DeterministicKeywordConfig>
): OutgoingTelegramMessage[] {
  const approvalText = config?.approvalMessageText?.trim() || DEFAULT_APPROVAL_MESSAGE_TEXT;
  const fiveRoundsText = config?.fiveRoundsMessageText?.trim() || DEFAULT_FIVE_ROUNDS_MESSAGE_TEXT;
  const strategyText = customContent || config?.customMinesContentText || DEFAULT_KEYWORD_CONFIG.customMinesContentText || '';

  return [
    {
      stepTriggered: 'CONFIRMACION_PAGO',
      text: approvalText,
    },
    {
      stepTriggered: 'RONDAS_ORIENTACION',
      text: fiveRoundsText,
    },
    {
      stepTriggered: 'VIDEO_MINES',
      mediaType: 'video',
      mediaUrl: '/public/assets/aistudio/como_encontrar_mines.mp4',
      text: `🎮 *Cómo encontrar y acceder al juego Mines dentro de la plataforma:*

1️⃣ Entra al menú principal y pulsa *Casino*.
2️⃣ Pulsa el botón de *búsqueda* (lupa) y escribe *Mines*.
3️⃣ Pulsa *Más* y desliza hasta encontrar el juego Mines mostrado en el video.
4️⃣ Selecciónalo y ya podrás ingresar al tablero para practicar.`,
    },
    {
      stepTriggered: 'FINALIZACION_ETAPA_2',
      text: `${strategyText}\n\nCuando hayas revisado las rondas ilustrativas y completado tu práctica, confirma aquí si deseas avanzar:`,
      buttons: [
        { id: 'btn-prac-done', text: '✅ YA TERMINÉ LA PRÁCTICA', type: 'callback', value: 'practica_terminada' },
        { id: 'btn-prac-help', text: '❓ NECESITO AYUDA', type: 'callback', value: 'practica_ayuda' },
      ],
    },
  ];
}


