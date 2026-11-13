import React, { useState } from 'react';
import { FlowStageId } from '../../types';
import {
  DEFAULT_KEYWORD_CONFIG,
  matchesAnyKeyword,
  normalizeInput,
} from '../../services/deterministicBotEngine';
import {
  GitFork,
  CheckCircle2,
  ArrowRight,
  Bot,
  Play,
  Terminal,
  Layers,
  Image as ImageIcon,
  Video,
  ShieldCheck,
  AlertCircle,
  Lock,
  Sparkles,
  CreditCard,
  UserCheck,
} from 'lucide-react';

interface StageBlock {
  id: string;
  stageName: string;
  stageNumber: number;
  badge: string;
  color: string;
  description: string;
  gateDescription?: string;
  steps: {
    number: string;
    name: string;
    trigger: string;
    action: string;
    media?: 'video' | 'photo' | 'album';
    requiresAdmin?: boolean;
    requiresUserConfirmation?: boolean;
  }[];
}

const THREE_STAGE_ARCHITECTURE: StageBlock[] = [
  {
    id: 'etapa-1',
    stageName: 'ETAPA 1: BIENVENIDA, PLANES INICIALES, REGISTRO Y ENVÍO DEL ID',
    stageNumber: 1,
    badge: '100% AUTOMÁTICO HASTA RECEPCIÓN DE ID',
    color: 'from-sky-500/20 to-blue-600/10 border-sky-500/30',
    description:
      'El usuario recorre la bienvenida, responde su país, conoce la introducción transparente, elige entre los 3 planes iniciales ($15k, $25k, $40k), recibe el video de registro, video de Mines, imagen explicativa de plataforma, y el álbum de 3 imágenes para encontrar su ID. Concluye enviando su ID numérico.',
    gateDescription:
      '🛑 COMPUERTA DE ESPERA OBLIGATORIA: Tras recibir el ID, el bot queda en espera activa (stage_1_id_pending). La Etapa 2 NO puede comenzar hasta que el administrador pulse «ACEPTAR Y VERIFICAR ID».',
    steps: [
      {
        number: '1.1',
        name: 'Bienvenida (/start)',
        trigger: 'Comando /start o pulsar Iniciar',
        action: 'Saludo oficial de Juan Carlos con la nueva imagen de Mines adjunta directamente al mensaje.',
        media: 'photo',
      },
      {
        number: '1.2',
        name: 'Pregunta de País',
        trigger: 'Automático tras bienvenida',
        action: '5 botones: Colombia 🇨🇴, México 🇲🇽, Perú 🇵🇪, Argentina 🇦🇷, Otro país 🌎. Guarda selección.',
      },
      {
        number: '1.3',
        name: 'Explicación General y Transparencia',
        trigger: 'Selección de país',
        action: 'Explicación del proceso y aviso de azar (+18, RNG, ninguna señal garantiza ganancias).',
      },
      {
        number: '1.4',
        name: 'Presentación de 3 Planes Iniciales',
        trigger: 'Automático tras explicación',
        action: 'Botones: PLAN 1 ($15.000), PLAN 2 ($25.000) y PLAN 3 ($40.000 COP). Aclara que no son inversiones con rentabilidad garantizada.',
      },
      {
        number: '1.5',
        name: 'Respuesta a la Selección del Plan',
        trigger: 'Pulsar uno de los 3 planes',
        action: 'Confirmación de elección y aviso de que se mostrará cómo registrarse.',
      },
      {
        number: '1.6',
        name: 'Guía de Registro (Álbum 6 Fotos)',
        trigger: 'Automático tras selección de plan',
        action: 'Envío ordenado de las 6 fotografías paso a paso (1 al 6) junto con las instrucciones y enlace de registro.',
        media: 'album',
      },
      {
        number: '1.7',
        name: 'Guía para Encontrar Mines (Video)',
        trigger: 'Automático tras registro',
        action: 'Envío de SEGUNDO VIDEO independiente para localizar Mines en la plataforma.',
        media: 'video',
      },
      {
        number: '1.8',
        name: '¿Por qué elegí esta plataforma? (Imagen)',
        trigger: 'Automático tras video de Mines',
        action: 'Envío de infografía oficial "¿Por qué elijo 1xBet?" + texto explicativo.',
        media: 'photo',
      },
      {
        number: '1.9',
        name: 'Guía para Encontrar el ID (Álbum 3 Fotos)',
        trigger: 'Automático tras plataforma',
        action: 'Envío en grupo multimedia (sendMediaGroup) de 3 fotos paso a paso + mensaje único.',
        media: 'album',
      },
      {
        number: '1.10',
        name: 'Recepción del ID Numérico',
        trigger: 'El usuario escribe su ID numérico (ej. 1603722093)',
        action: 'Guarda ID, fija estado stage_1_id_pending y avisa que Juan Carlos lo revisará.',
        requiresAdmin: true,
      },
    ],
  },
  {
    id: 'etapa-2',
    stageName: 'ETAPA 2: VERIFICACIÓN DEL ID, CONFIRMACIÓN Y CONTENIDO DE APRENDIZAJE',
    stageNumber: 2,
    badge: 'REQUIERE APROBACIÓN MANUAL DE JUAN CARLOS',
    color: 'from-emerald-500/20 to-teal-600/10 border-emerald-500/30',
    description:
      'Activada exclusivamente cuando el administrador pulsa «ACEPTAR Y VERIFICAR ID». El bot confirma la verificación, reitera el plan, envía instrucciones de recarga, espera reporte de depósito, confirma la operación y entrega el contenido de estrategia de Mines con video demostración.',
    gateDescription:
      '🛑 COMPUERTA DE CONTINUIDAD: El bot se detiene esperando que el usuario confirme que finalizó la práctica («YA TERMINÉ LA PRÁCTICA»). La Etapa 3 NO se inicia automáticamente.',
    steps: [
      {
        number: '2.1',
        name: 'Acción Administrativa: Aceptar o Rechazar ID',
        trigger: 'Botón «ACEPTAR Y VERIFICAR ID» o «RECHAZAR ID» en el panel',
        action: 'Si acepta: registra auditoría (fecha, admin) y dispara Etapa 2. Si rechaza: solicita corregir el número.',
        requiresAdmin: true,
      },
      {
        number: '2.2',
        name: 'Confirmación Automática del ID',
        trigger: 'Disparo de Aceptación',
        action: 'Mensaje celebrando la confirmación del ID en la base de datos.',
      },
      {
        number: '2.3',
        name: 'Confirmación del Plan y Condiciones',
        trigger: 'Secuencial tras ID confirmado',
        action: 'Recordatorio del plan elegido y recomendación de revisar importe y beneficios antes de operar.',
      },
      {
        number: '2.4',
        name: 'Instrucciones de Recarga (Fotos en orden)',
        trigger: 'Secuencial tras plan',
        action: 'Envío de capturas de recarga + texto único + botón interactivo «💳 YA REALICÉ EL DEPÓSITO».',
        media: 'album',
      },
      {
        number: '2.5',
        name: 'Reporte de Depósito del Usuario',
        trigger: 'Pulsar «YA REALICÉ EL DEPÓSITO» o escribir frases de recarga',
        action: 'Transiciona a stage_2_payment_pending y notifica al panel que se requiere confirmación.',
        requiresAdmin: true,
      },
      {
        number: '2.6',
        name: 'Confirmación Administrativa de Pago',
        trigger: 'Botón «CONFIRMAR OPERACIÓN / PAGO» en panel',
        action: 'Marca payment_verified y libera el contenido de aprendizaje.',
        requiresAdmin: true,
      },
      {
        number: '2.7',
        name: 'Video Cómo Encontrar Mines + Estrategia',
        trigger: 'Pago confirmado por administrador',
        action: 'Envío del contenido de estrategia + video explicativo adjunto mostrando cómo encontrar y acceder al juego Mines.',
        media: 'video',
      },
      {
        number: '2.8',
        name: 'Espera de Finalización de Práctica',
        trigger: 'Contenido entregado',
        action: 'Envío de mensaje invitando a practicar con calma + botones «✅ YA TERMINÉ LA PRÁCTICA» y «❓ NECESITO AYUDA».',
        requiresUserConfirmation: true,
      },
    ],
  },
  {
    id: 'etapa-3',
    stageName: 'ETAPA 3: CONTINUIDAD Y PLANES AVANZADOS',
    stageNumber: 3,
    badge: 'CONDICIONADA A CONFIRMACIÓN EXPRESA DEL USUARIO',
    color: 'from-amber-500/20 to-orange-600/10 border-amber-500/30',
    description:
      'Comienza ÚNICAMENTE cuando el usuario confirma que terminó la práctica o desea continuar. Presenta las opciones avanzadas de $50.000 y $100.000 COP, y formaliza las condiciones de comisión del 10% sobre ganancias netas verificadas.',
    steps: [
      {
        number: '3.1',
        name: 'Confirmación Expresa de Práctica',
        trigger: 'Pulsar «YA TERMINÉ LA PRÁCTICA» o escribir "ya terminé", "terminé la práctica", etc.',
        action: 'Mensaje de felicitación por el avance y transición hacia las opciones avanzadas.',
        requiresUserConfirmation: true,
      },
      {
        number: '3.2',
        name: 'Presentación de Planes Avanzados',
        trigger: 'Automático tras confirmación',
        action: 'Detalle de PLAN AVANZADO ($50.000 COP) y PLAN PREMIUM ($100.000 COP) con botones correspondientes.',
      },
      {
        number: '3.3',
        name: 'Selección de Plan Avanzado',
        trigger: 'Pulsar Plan Avanzado o Plan Premium',
        action: 'Registro en Firestore y presentación del acuerdo de comisión del 10%.',
      },
      {
        number: '3.4',
        name: 'Condiciones de Comisión del 10%',
        trigger: 'Automático tras elegir plan avanzado',
        action: 'Explicación rigurosa: aplica sólo a ganancias netas verificadas. Botones: «✅ ACEPTAR CONDICIONES» o «❌ NO ACEPTO».',
      },
      {
        number: '3.5',
        name: 'Cierre del Recorrido y Registro Formal',
        trigger: 'Aceptación o rechazo de comisión',
        action: 'Guarda timestamp y versión de términos. Notifica a Juan Carlos para coordinar el acompañamiento.',
      },
    ],
  },
];

export const FlowView: React.FC = () => {
  const [selectedStageIndex, setSelectedStageIndex] = useState<number>(0);
  const currentStage = THREE_STAGE_ARCHITECTURE[selectedStageIndex];

  // Deterministic Keyword Tester Playground
  const [testInput, setTestInput] = useState('1603722093');
  const [testResult, setTestResult] = useState<{
    classification: string;
    matchedKeywords: string;
    nextStepTarget: string;
    isNumericId: boolean;
  } | null>(null);

  const handleTestPhrase = (phraseToTest?: string) => {
    const input = (phraseToTest || testInput).trim();
    if (!input) return;

    const norm = normalizeInput(input);
    const numericRegex = new RegExp(DEFAULT_KEYWORD_CONFIG.idRegex);
    const isId = numericRegex.test(input.replace(/\s+/g, ''));

    let classification = 'Desconocido (Trigger Fallback)';
    let matchedKeywords = 'Ninguna coincidencia en diccionario';
    let nextStepTarget = 'Envío de mensaje con opciones pendientes';

    if (isId) {
      classification = 'ID Numérico de Cuenta Válido';
      matchedKeywords = `Regex: ^\\d{6,12}$ -> ${input}`;
      nextStepTarget = 'stage_1_id_pending (Queda en espera de verificación manual por Juan Carlos)';
    } else if (norm === '/start' || norm === 'start' || norm === 'iniciar') {
      classification = 'Evento /start Inicial';
      matchedKeywords = '/start, start';
      nextStepTarget = 'stage_1_welcome -> stage_1_country (Pregunta de País)';
    } else if (matchesAnyKeyword(norm, DEFAULT_KEYWORD_CONFIG.keywordsColombia)) {
      classification = 'País: Colombia';
      matchedKeywords = 'colombia, medellín, bogotá, cali, etc.';
      nextStepTarget = 'stage_1_plans (Presentación de Planes Iniciales)';
    } else if (matchesAnyKeyword(norm, DEFAULT_KEYWORD_CONFIG.keywordsOtherCountry)) {
      classification = 'País: Internacional / Otro País';
      matchedKeywords = 'méxico, perú, argentina, otro país, etc.';
      nextStepTarget = 'stage_1_plans (Presentación de Planes Iniciales)';
    } else if (matchesAnyKeyword(norm, DEFAULT_KEYWORD_CONFIG.keywordsDepositDone)) {
      classification = 'Reporte de Depósito Realizado';
      matchedKeywords = 'ya deposité, ya realicé el depósito, comprobante, etc.';
      nextStepTarget = 'stage_2_payment_pending (Alerta a Juan Carlos para confirmar pago)';
    } else if (matchesAnyKeyword(norm, DEFAULT_KEYWORD_CONFIG.keywordsPracticeDone)) {
      classification = 'Confirmación de Práctica Terminada';
      matchedKeywords = 'ya terminé, terminé la práctica, quiero continuar, etc.';
      nextStepTarget = 'stage_3_plans (Abre Etapa 3 y presenta planes de $50k y $100k)';
    }

    setTestResult({
      classification,
      matchedKeywords,
      nextStepTarget,
      isNumericId: isId,
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Banner Notice */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-[#0d1629] via-[#0e1c36] to-[#0d1629] border border-sky-500/20 shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold text-white tracking-tight">
              Arquitectura de Tres Etapas — Juan Carlos | Mines AI 💎
            </h2>
            <span className="text-[10px] px-2 py-0.5 rounded font-mono font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
              ESTRUCTURA EXACTA · 2 COMPUERTAS ESTRICTAS
            </span>
          </div>
          <p className="text-xs text-slate-300 mt-0.5 max-w-3xl">
            Flujo determinista riguroso: la <strong>Etapa 2</strong> sólo inicia con la aprobación de Juan Carlos en el panel; la <strong>Etapa 3</strong> sólo inicia con la confirmación expresa del usuario al terminar su práctica.
          </p>
        </div>

        <button
          onClick={() => handleTestPhrase('1603722093')}
          className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-sky-500 hover:bg-sky-400 text-white shadow-md shadow-sky-500/20 transition-all cursor-pointer whitespace-nowrap"
        >
          Probar Evaluador de Frases
        </button>
      </div>

      {/* Stage Selector Tabs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {THREE_STAGE_ARCHITECTURE.map((stg, sIdx) => {
          const isSelected = selectedStageIndex === sIdx;
          return (
            <div
              key={stg.id}
              onClick={() => setSelectedStageIndex(sIdx)}
              className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                isSelected
                  ? `bg-gradient-to-br ${stg.color} shadow-lg ring-1 ring-sky-400/50`
                  : 'bg-[#0c1424] border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-900/80 text-sky-300 border border-slate-700">
                  ETAPA {stg.stageNumber}
                </span>
                <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-sky-500/10 text-sky-300">
                  {stg.steps.length} pasos
                </span>
              </div>
              <h3 className="text-xs font-bold text-white line-clamp-2 mb-1">
                {stg.stageName}
              </h3>
              <p className="text-[11px] text-slate-400 line-clamp-2">
                {stg.description}
              </p>
            </div>
          );
        })}
      </div>

      {/* Stage Overview & Steps */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Stage Details & Sequential Steps (7 Cols) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Gate Notice Box */}
          {currentStage.gateDescription && (
            <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-200 flex items-start gap-2.5">
              <Lock className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <p className="leading-relaxed">{currentStage.gateDescription}</p>
            </div>
          )}

          <div className="p-4 rounded-2xl bg-[#0c1424] border border-slate-800 space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-400 pb-2 border-b border-slate-800">
              <span className="font-semibold text-white">Pasos de la {currentStage.stageName.split(':')[0]}</span>
              <span>Total: {currentStage.steps.length}</span>
            </div>

            <div className="space-y-2.5">
              {currentStage.steps.map((step, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-xl bg-[#090f1d] border border-slate-800 hover:border-slate-700 transition-all space-y-1.5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-sky-400 px-1.5 py-0.5 rounded bg-sky-500/10 border border-sky-500/20">
                        {step.number}
                      </span>
                      <h4 className="text-xs font-bold text-white">{step.name}</h4>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {step.media && (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-500/10 text-purple-300 border border-purple-500/20 flex items-center gap-1">
                          {step.media === 'video' ? <Video className="w-3 h-3" /> : <ImageIcon className="w-3 h-3" />}
                          {step.media === 'video' ? 'Vídeo' : step.media === 'album' ? 'Álbum' : 'Foto'}
                        </span>
                      )}

                      {step.requiresAdmin && (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30 flex items-center gap-1 font-semibold">
                          <UserCheck className="w-3 h-3" />
                          Panel Admin
                        </span>
                      )}

                      {step.requiresUserConfirmation && (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 flex items-center gap-1 font-semibold">
                          <CheckCircle2 className="w-3 h-3" />
                          Usuario Confirma
                        </span>
                      )}
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    <strong>Acción:</strong> {step.action}
                  </p>
                  <p className="text-[10px] text-slate-500 font-mono">
                    Disparador: {step.trigger}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Testing Playground & Interactive Evaluation (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="p-5 rounded-2xl bg-[#0c1424] border border-slate-800 space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-sky-500/15 border border-sky-500/30 flex items-center justify-center text-sky-400">
                <Terminal className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                  Evaluador de Respuestas y Transiciones
                </h3>
                <p className="text-[11px] text-slate-400">
                  Comprueba a qué etapa y acción conduce cualquier mensaje escrito
                </p>
              </div>
            </div>

            {/* Quick Test Chips */}
            <div className="flex flex-wrap gap-1.5">
              {[
                '1603722093',
                'Colombia',
                'México',
                'ya deposité',
                'ya terminé',
                'terminé la práctica',
                'quiero continuar',
                'necesito ayuda',
              ].map((chip) => (
                <button
                  key={chip}
                  onClick={() => {
                    setTestInput(chip);
                    handleTestPhrase(chip);
                  }}
                  className="text-[10px] px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors font-mono cursor-pointer"
                >
                  "{chip}"
                </button>
              ))}
            </div>

            {/* Input & Button */}
            <div className="flex gap-2">
              <input
                type="text"
                value={testInput}
                onChange={(e) => setTestInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleTestPhrase()}
                placeholder="Escribe texto o ID para evaluar..."
                className="flex-1 bg-[#080d1a] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500 font-mono"
              />
              <button
                onClick={() => handleTestPhrase()}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-sky-500 hover:bg-sky-400 text-white transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
              >
                <Play className="w-3.5 h-3.5 fill-white" />
                Evaluar
              </button>
            </div>

            {/* Result Display */}
            {testResult && (
              <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-700/80 space-y-2 text-xs">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <span className="font-semibold text-white flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    {testResult.classification}
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-sky-500/10 text-sky-300 font-bold border border-sky-500/20">
                    Regla Determinista
                  </span>
                </div>

                <div className="grid grid-cols-1 gap-2 text-[11px] pt-1">
                  <div>
                    <span className="text-slate-400 block">Patrón o palabra coincidente:</span>
                    <span className="font-mono text-amber-300">{testResult.matchedKeywords}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Acción / Destino:</span>
                    <span className="font-mono text-sky-400">{testResult.nextStepTarget}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
