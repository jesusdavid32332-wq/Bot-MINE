export type SectionId =
  | 'dashboard'
  | 'telegram-connection'
  | 'deposits'
  | 'messages'
  | 'flow'
  | 'admin-telegram'
  | 'id-tracking'
  | 'media'
  | 'tutorials'
  | 'users'
  | 'conversations'
  | 'support'
  | 'links'
  | 'bot-config'
  | 'general-config';

export type FlowStageId =
  | 'stage_1_welcome'
  | 'stage_1_country'
  | 'stage_1_plans'
  | 'stage_1_registration'
  | 'stage_1_game_guide'
  | 'stage_1_id_pending'
  | 'stage_2_id_verified'
  | 'stage_2_awaiting_receipt'
  | 'stage_2_payment_pending'
  | 'stage_2_payment_verified'
  | 'stage_2_payment_rejected'
  | 'stage_2_content_sent'
  | 'stage_2_practice_completed'
  | 'stage_3_plans'
  | 'stage_3_terms_pending'
  | 'stage_3_completed';

export type FlowStepId =
  | FlowStageId
  | 'START'
  | 'BIENVENIDA'
  | 'PAIS'
  | 'EXPLICACION'
  | 'PLANES_INICIALES'
  | 'RESPUESTA_PLAN'
  | 'GUIA_REGISTRO'
  | 'GUIA_MINES'
  | 'POR_QUE_PLATAFORMA'
  | 'COMO_ENCONTRAR_ID'
  | 'SOLICITUD_ID'
  | 'ESPERA_VERIFICACION'
  | 'CONFIRMACION_ID'
  | 'CONFIRMACION_PLAN'
  | 'INSTRUCCIONES_RECARGA'
  | 'AVISO_DEPOSITO'
  | 'RECEPCION_COMPROBANTE'
  | 'CONFIRMACION_PAGO'
  | 'RECHAZO_PAGO'
  | 'ESPERA_PROGRAMADA'
  | 'RONDAS_ORIENTACION'
  | 'CONTENIDO_MINES'
  | 'VIDEO_MINES'
  | 'FINALIZACION_ETAPA_2'
  | 'TRANSICION_ETAPA_3'
  | 'PLANES_AVANZADOS'
  | 'SELECCION_AVANZADA'
  | 'CONDICIONES_COMISION'
  | 'FIN_RECORRIDO'
  // Legacy compatibility keys
  | 'PRESENTACION'
  | 'INTERES'
  | 'EXPERIENCIA'
  | 'INFO_MINES'
  | 'TESTIMONIOS'
  | 'INFO_REGISTRO'
  | 'PREGUNTA_REGISTRO'
  | 'RECEPCION_ID'
  | 'TUTORIAL_MINES'
  | 'FINALIZACION';

export type AccountVerificationStatus =
  | 'pending_verification'
  | 'verified'
  | 'rejected'
  // Compatibility with previous keys
  | 'id_recibido'
  | 'pendiente_revision'
  | 'revisado'
  | 'no_verificable';

export type PaymentStatus =
  | 'unpaid'
  | 'deposit_notified'
  | 'receipt_pending'
  | 'payment_verified'
  | 'payment_rejected';

export type DepositReceiptStatus = 'pending' | 'verified' | 'rejected';

export type UserFlowStateLabel =
  | 'NUEVO USUARIO'
  | 'PLAN SELECCIONADO'
  | 'REGISTRO PENDIENTE'
  | 'REGISTRO COMPLETADO'
  | 'COMPROBANTE PENDIENTE'
  | 'DEPÓSITO VERIFICADO'
  | 'DEPÓSITO RECHAZADO'
  | 'ACCESO A ORIENTACIÓN HABILITADO';

export interface DepositReceipt {
  id: string;
  telegramId: string;
  userId: string;
  username: string;
  name: string;
  accountId?: string;
  planId?: InitialPlanId;
  planLabel: string;
  receiptUrl: string;
  telegramFileId?: string;
  caption?: string;
  receivedAt: string;
  status: DepositReceiptStatus;
  reviewedBy?: string;
  reviewedAt?: string;
  rejectionReason?: string;
}

export type InitialPlanId = 'plan_15000' | 'plan_25000' | 'plan_40000';
export type AdvancedPlanId = 'plan_50000' | 'plan_100000';

export interface StageTransitionRecord {
  id: string;
  fromStage: string;
  toStage: string;
  timestamp: string;
  actor: 'user' | 'admin' | 'system';
  adminId?: string;
  reason?: string;
}

export type ContentType =
  | 'text'
  | 'photo_caption'
  | 'video_caption'
  | 'text_buttons'
  | 'photo_buttons'
  | 'video_buttons'
  | 'photo_group'
  | 'media_group';

export interface TelegramButton {
  id: string;
  text: string;
  type: 'url' | 'callback';
  value: string;
}

export interface AutoMessage {
  id: string;
  stepId: FlowStepId;
  internalName: string;
  text: string;
  contentType: ContentType;
  mediaUrl?: string;
  mediaType?: 'photo' | 'video';
  additionalMediaUrls?: string[];
  buttons: TelegramButton[];
  condition: string;
  nextStepId: FlowStepId | 'END';
  nextAction?: string;
  isActive: boolean;
  order: number;
  stageTag: string;
  stageGroup?: 'etapa_1' | 'etapa_2' | 'etapa_3' | 'general';
}

export interface DeterministicKeywordConfig {
  keywordsYes: string[];
  keywordsNo: string[];
  keywordsColombia: string[];
  keywordsOtherCountry: string[];
  keywordsWantMore: string[];
  keywordsNotNow: string[];
  keywordsNeedHelp: string[];
  keywordsAlreadyFoundId: string[];
  keywordsDepositDone: string[];
  keywordsPracticeDone: string[];
  idRegex: string;
  unrecognizedFallbackText: string;
  customMinesContentText?: string;
  customPlatformReasonText?: string;
  registrationLink?: string;
  registrationPhotoUrls?: string[];
  plansMessageText?: string;
  registrationMessageText?: string;
  depositPromptText?: string;
  approvalMessageText?: string;
  fiveRoundsMessageText?: string;
  scheduledDelayMinutes?: number;
}

export interface MediaItem {
  id: string;
  name: string;
  type: 'photo' | 'video';
  url: string;
  description: string;
  sizeBytes: number;
  dimensions?: string;
  durationSeconds?: number;
  createdAt: string;
  associatedStep: FlowStepId;
  associatedMessageIds?: string[];
  isRealAsset: boolean;
  isDemo?: boolean;
  stageGroup?: 'etapa_1' | 'etapa_2' | 'etapa_3' | 'general';
  orderIndex?: number;
}

export interface Tutorial {
  id: string;
  title: string;
  description: string;
  mediaUrl?: string;
  mediaType?: 'photo' | 'video';
  explanatoryText: string;
  steps: string[];
  targetStage: 'principiante' | 'avanzado' | 'todos';
  order: number;
  isActive: boolean;
  estimatedReadTime: string;
}

export interface TelegramUser {
  id: string;
  telegramId: string;
  name: string;
  username: string;
  avatarUrl?: string;
  joinDate: string;
  country: string;
  declaredCountry?: string;
  currentStep: FlowStepId;
  stage: FlowStageId | string;
  lastActivity: string;
  status: 'active' | 'waiting_reply' | 'completed' | 'paused';
  messagesSent: number;
  messagesReceived: number;
  experienceLevel?: 'principiante' | 'experimentado' | 'desconocido';
  accountId?: string;
  accountStatus: AccountVerificationStatus;
  initialPlan?: InitialPlanId;
  initialPlanLabel?: string;
  paymentStatus?: PaymentStatus;
  flowStateLabel?: UserFlowStateLabel | string;
  latestDepositId?: string;
  depositNotifiedAt?: string;
  paymentVerifiedAt?: string;
  paymentVerifiedBy?: string;
  idVerifiedAt?: string;
  idVerifiedBy?: string;
  idRejectedAt?: string;
  idRejectedReason?: string;
  practiceCompletedAt?: string;
  advancedPlan?: AdvancedPlanId;
  advancedPlanLabel?: string;
  termsAccepted?: boolean;
  termsAcceptedAt?: string;
  termsVersion?: string;
  stageTransitions?: StageTransitionRecord[];
  processedUpdateIds?: string[];
  consentGiven: boolean;
  notes?: string;
  experienceInMines?: boolean;
  hasRegistered1xBet?: boolean;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'bot' | 'admin' | 'gemini' | 'agent';
  text: string;
  timestamp: string;
  mediaUrl?: string;
  mediaType?: 'photo' | 'video';
  additionalMediaUrls?: string[];
  buttons?: TelegramButton[];
  stepTriggered?: FlowStepId;
  intentDetected?: string;
}

export interface UserConversation {
  userId: string;
  status: 'waiting_response' | 'attended' | 'automated';
  lastMessageTime: string;
  currentStep: FlowStepId;
  messages: ChatMessage[];
  geminiContext?: string;
}

export interface SupportTicket {
  id: string;
  userId: string;
  userName: string;
  userUsername: string;
  subject: string;
  question: string;
  status: 'open' | 'in_progress' | 'resolved';
  priority: 'low' | 'medium' | 'high';
  createdAt: string;
  updatedAt: string;
  replies: {
    id: string;
    sender: 'admin' | 'user';
    text: string;
    timestamp: string;
  }[];
}

export interface TrackedLink {
  id: string;
  platform: string;
  url: string;
  name: string;
  associatedStep: FlowStepId;
  associatedMessageName?: string;
  clicksCount: number;
  isActive: boolean;
  isVerified: boolean;
  verificationNotes: string;
}

export interface BotConfig {
  botName: string;
  username: string;
  welcomeMessage: string;
  status: 'active' | 'maintenance' | 'paused';
  adminTelegramId: string;
  webhookSecret: string;
  enforceAgeVerification18: boolean;
  responsibleGamingDisclaimer: string;
  botToken?: string;
  botTokenSource?: string;
  startBehavior?: string;
  enableInlineKeyboards?: boolean;
  newUserGreeting?: string;
  recurringUserGreeting?: string;
  farewellMessage?: string;
  errorMessage?: string;
}

export interface GeneralConfig {
  adminName: string;
  adminEmail: string;
  adminTelegramId: string;
  telegramWebhookStatus: 'ready_for_cloud_run' | 'connected' | 'simulated' | 'ready_for_render';
  databaseStatus: 'firestore_ready' | 'connected' | 'local_fallback' | 'postgresql_ready';
  responsibleGamingNotice: string;
  minimumAge: number;
}

export interface GeminiConfig {
  model: string;
  temperature: number;
  maxOutputTokens: number;
  topP: number;
  topK: number;
  systemInstruction: string;
  allowedTopics: string[];
  restrictedTopics: string[];
  safetyThreshold: string;
  isActive: boolean;
}

export interface TelegramBotInfo {
  id: number;
  is_bot: boolean;
  first_name: string;
  username: string;
  can_join_groups?: boolean;
  can_read_all_group_messages?: boolean;
  supports_inline_queries?: boolean;
}

export interface TelegramWebhookInfo {
  url: string;
  has_custom_certificate: boolean;
  pending_update_count: number;
  last_error_date?: number;
  last_error_message?: string;
  max_connections?: number;
  allowed_updates?: string[];
}

export type VerificationStatusBadge = 'VERIFICADO' | 'PENDIENTE' | 'ERROR' | 'REQUIERE_AUTORIZACION';

export interface TelegramSeparatedStates {
  tokenAuthenticated: {
    status: VerificationStatusBadge;
    message: string;
    botId?: number;
    username?: string;
  };
  webhookRegistered: {
    status: VerificationStatusBadge;
    url?: string;
    message: string;
  };
  webhookAccessible: {
    status: VerificationStatusBadge;
    message: string;
  };
  updatesReceived: {
    status: VerificationStatusBadge;
    message: string;
    pendingCount?: number;
  };
  updatesProcessed: {
    status: VerificationStatusBadge;
    message: string;
  };
  messagesSentSuccessfully: {
    status: VerificationStatusBadge;
    message: string;
  };
  deliveryErrors: {
    status: VerificationStatusBadge;
    message: string;
  };
}

export interface TelegramConnectionStatus {
  connected: boolean;
  hasToken: boolean;
  maskedToken?: string;
  tokenError?: string;
  bot?: TelegramBotInfo | null;
  webhook?: TelegramWebhookInfo | null;
  expectedWebhookUrl?: string | null;
  webhookMatches?: boolean;
  publicBaseUrl?: string;
  publicBaseUrlConfigured: boolean;
  webhookSecretConfigured: boolean;
  databaseType?: string;
  databaseConfigured?: boolean;
  separatedStates?: TelegramSeparatedStates;
  cloudRunConfig?: {
    serviceName: string;
    region: string;
    projectId: string;
  };
  gcpPermissions?: {
    hasSecretManagerPermission: boolean;
    hasCloudRunPermission: boolean;
    errorMessage?: string;
    requiredRoles: string[];
    gcloudCommands: string[];
  };
  lastChecked?: string;
}

