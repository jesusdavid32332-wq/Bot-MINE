export type SectionId =
  | 'dashboard'
  | 'telegram-connection'
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

export type FlowStepId =
  | 'START'
  | 'BIENVENIDA'
  | 'PAIS'
  | 'PRESENTACION'
  | 'INTERES'
  | 'EXPERIENCIA'
  | 'INFO_MINES'
  | 'TESTIMONIOS'
  | 'INFO_REGISTRO'
  | 'PREGUNTA_REGISTRO'
  | 'SOLICITUD_ID'
  | 'COMO_ENCONTRAR_ID'
  | 'RECEPCION_ID'
  | 'TUTORIAL_MINES'
  | 'FINALIZACION';

export type AccountVerificationStatus =
  | 'id_recibido'
  | 'pendiente_revision'
  | 'revisado'
  | 'no_verificable';

export type ContentType =
  | 'text'
  | 'photo_caption'
  | 'video_caption'
  | 'text_buttons'
  | 'photo_buttons'
  | 'video_buttons'
  | 'photo_group';

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
  idRegex: string;
  unrecognizedFallbackText: string;
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
  stage: string;
  lastActivity: string;
  status: 'active' | 'waiting_reply' | 'completed' | 'paused';
  messagesSent: number;
  messagesReceived: number;
  experienceLevel: 'principiante' | 'experimentado' | 'desconocido';
  experienceInMines?: boolean;
  hasRegistered1xBet?: boolean;
  accountId?: string;
  accountStatus: AccountVerificationStatus;
  consentGiven: boolean;
  notes?: string;
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

export interface TelegramConnectionStatus {
  connected: boolean;
  hasToken: boolean;
  maskedToken?: string;
  bot?: TelegramBotInfo;
  webhook?: TelegramWebhookInfo;
  expectedWebhookUrl?: string | null;
  webhookMatches?: boolean;
  publicBaseUrl?: string;
  publicBaseUrlConfigured: boolean;
  webhookSecretConfigured: boolean;
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
}

