import React, { useState } from 'react';
import { FlowStepId } from '../../types';
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
} from 'lucide-react';

interface StepDescriptor {
  id: FlowStepId;
  name: string;
  category: string;
  trigger: string;
  hasMedia?: 'photo' | 'video' | 'photo_group';
  expectedInput: string;
  destination: string;
}

const FLOW_STEPS: StepDescriptor[] = [
  {
    id: 'START',
    name: '01. Evento START',
    category: 'Inicio',
    trigger: 'El usuario entra al bot y pulsa START una sola vez.',
    expectedInput: '/start o comando Iniciar',
    destination: 'BIENVENIDA y Pregunta de País',
  },
  {
    id: 'BIENVENIDA',
    name: '02. Mensaje de Bienvenida',
    category: 'Inicio',
    trigger: 'Enviado automáticamente tras START.',
    expectedInput: 'Botones [Colombia] o [Otro país] / Texto libre',
    destination: 'PAIS',
  },
  {
    id: 'PAIS',
    name: '03. Identificación del País',
    category: 'Segmentación',
    trigger: 'Respuesta de país (Colombia vs Internacional).',
    expectedInput: 'Colombia, Medellín, Bogotá, España, México, etc.',
    destination: 'PRESENTACION',
  },
  {
    id: 'PRESENTACION',
    name: '04. Mensaje de Presentación',
    category: 'Identidad',
    trigger: 'Automático tras guardar país.',
    hasMedia: 'photo',
    expectedInput: 'Continúa directo a Pregunta de Interés',
    destination: 'INTERES',
  },
  {
    id: 'INTERES',
    name: '05. Pregunta de Interés',
    category: 'Calificación',
    trigger: 'Consulta si desea conocer el sistema paso a paso.',
    expectedInput: '[SÍ, ME INTERESA] / [QUIERO SABER MÁS] / [NO POR AHORA]',
    destination: 'EXPERIENCIA (o finaliza si responde NO)',
  },
  {
    id: 'EXPERIENCIA',
    name: '06. Pregunta de Experiencia',
    category: 'Nivel',
    trigger: '¿Conoces Mines o es tu primera vez?',
    expectedInput: '[SÍ, YA LO CONOZCO] / [NO, SOY PRINCIPIANTE]',
    destination: 'INFO_MINES',
  },
  {
    id: 'INFO_MINES',
    name: '07. Información sobre Mines',
    category: 'Educativo',
    trigger: 'Explicación del tablero 5x5 (25 casillas) y aleatoriedad RNG.',
    hasMedia: 'video',
    expectedInput: 'Continúa a Testimonios',
    destination: 'TESTIMONIOS',
  },
  {
    id: 'TESTIMONIOS',
    name: '08. Presentación de Testimonios',
    category: 'Prueba Social',
    trigger: '3 capturas reales de experiencias compartidas.',
    hasMedia: 'photo_group',
    expectedInput: 'Continúa a Enlace de Registro',
    destination: 'INFO_REGISTRO',
  },
  {
    id: 'INFO_REGISTRO',
    name: '09. Información de Registro 1xBet',
    category: 'Plataforma',
    trigger: 'Envío del enlace oficial editable y botón de acceso.',
    expectedInput: 'Continúa a Pregunta de Registro',
    destination: 'PREGUNTA_REGISTRO',
  },
  {
    id: 'PREGUNTA_REGISTRO',
    name: '10. Pregunta de Registro',
    category: 'Conversión',
    trigger: '¿Ya tienes una cuenta creada en la plataforma?',
    expectedInput: '[SÍ, YA ME REGISTRÉ] / [TODAVÍA NO] / [NECESITO AYUDA]',
    destination: 'SOLICITUD_ID',
  },
  {
    id: 'SOLICITUD_ID',
    name: '11. Solicitud del ID de Cuenta',
    category: 'Identificación',
    trigger: 'Solicita número de ID de cuenta (sin contraseñas).',
    expectedInput: 'ID numérico (6 a 12 dígitos, ej. 1603722093)',
    destination: 'RECEPCION_ID (o COMO_ENCONTRAR_ID si necesita ayuda)',
  },
  {
    id: 'COMO_ENCONTRAR_ID',
    name: '12. Guía Visual: Dónde Encontrar el ID',
    category: 'Instrucciones',
    trigger: '3 capturas paso a paso: 1. Perfil, 2. Datos personales, 3. ID.',
    hasMedia: 'photo_group',
    expectedInput: '[SÍ, YA LO ENCONTRÉ] / [TODAVÍA NO]',
    destination: 'SOLICITUD_ID',
  },
  {
    id: 'RECEPCION_ID',
    name: '13. Recepción y Registro de ID',
    category: 'Auditoría',
    trigger: 'ID numérico recibido. Estado: Pendiente de revisión.',
    expectedInput: 'Continúa a Tutorial de Mines',
    destination: 'TUTORIAL_MINES',
  },
  {
    id: 'TUTORIAL_MINES',
    name: '14. Tutorial de Mines y Multiplicadores',
    category: 'Tutorial',
    trigger: 'Guía detallada de tablero, selección y probabilidades.',
    hasMedia: 'video',
    expectedInput: 'Continúa a Mensaje Final',
    destination: 'FINALIZACION',
  },
  {
    id: 'FINALIZACION',
    name: '15. Mensaje Final de Recorrido',
    category: 'Cierre',
    trigger: 'Agradecimiento, advertencia +18 y recordatorio de azar.',
    expectedInput: 'Flujo completado con éxito',
    destination: 'Fin del recorrido',
  },
];

export const FlowView: React.FC = () => {
  const [selectedStep, setSelectedStep] = useState<StepDescriptor>(FLOW_STEPS[0]);

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
    let nextStepTarget = 'Envío de mensaje de aclaración con botones';

    if (isId) {
      classification = 'ID Numérico de Cuenta 1xBet Válido';
      matchedKeywords = `Regex: ^\\d{6,12}$ -> ${input}`;
      nextStepTarget = 'RECEPCION_ID (Guarda en BD y avanza a TUTORIAL_MINES)';
    } else if (norm === '/start' || norm === 'start' || norm === 'iniciar') {
      classification = 'Evento /start Inicial';
      matchedKeywords = '/start, start';
      nextStepTarget = 'BIENVENIDA (Pregunta de País)';
    } else if (matchesAnyKeyword(norm, DEFAULT_KEYWORD_CONFIG.keywordsColombia)) {
      classification = 'País: Colombia';
      matchedKeywords = 'colombia, medellín, bogotá, cali, nequi, etc.';
      nextStepTarget = 'PAIS -> PRESENTACION (Foto París) -> INTERES';
    } else if (matchesAnyKeyword(norm, DEFAULT_KEYWORD_CONFIG.keywordsOtherCountry)) {
      classification = 'País: Internacional / Otro País';
      matchedKeywords = 'otro, españa, méxico, perú, chile, etc.';
      nextStepTarget = 'PAIS -> PRESENTACION (Foto París) -> INTERES';
    } else if (matchesAnyKeyword(norm, DEFAULT_KEYWORD_CONFIG.keywordsYes)) {
      classification = 'Respuesta Afirmativa (SÍ)';
      matchedKeywords = 'sí, si, claro, correcto, ya lo conozco, me interesa, etc.';
      nextStepTarget = 'Avanza a la siguiente etapa de confirmación';
    } else if (matchesAnyKeyword(norm, DEFAULT_KEYWORD_CONFIG.keywordsNo)) {
      classification = 'Respuesta Negativa (NO)';
      matchedKeywords = 'no, todavía no, nunca he jugado, soy principiante, etc.';
      nextStepTarget = 'Avanza a rama para principiantes o finaliza si no hay interés';
    } else if (matchesAnyKeyword(norm, DEFAULT_KEYWORD_CONFIG.keywordsNeedHelp)) {
      classification = 'Petición de Ayuda de Registro';
      matchedKeywords = 'necesito ayuda, ayuda, tutorial registro';
      nextStepTarget = 'Envía instrucciones de registro y botones de confirmación';
    } else if (matchesAnyKeyword(norm, DEFAULT_KEYWORD_CONFIG.keywordsAlreadyFoundId)) {
      classification = 'Confirmación de ID Encontrado';
      matchedKeywords = 'ya lo encontré, lo tengo, encontrado';
      nextStepTarget = 'SOLICITUD_ID (Solicita digitar el número)';
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
              Flujo Conversacional Determinista (15 Pasos Completos)
            </h2>
            <span className="text-[10px] px-2 py-0.5 rounded font-mono font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
              100% AUTOMÁTICO · SIN GEMINI · REGLAS PRECISAS
            </span>
          </div>
          <p className="text-xs text-slate-300 mt-0.5 max-w-3xl">
            Cada usuario avanza de forma independiente desde <strong>START</strong> hasta <strong>FINALIZACIÓN</strong>. El bot recuerda exactamente el paso pendiente y no se reinicia con preguntas imprevistas.
          </p>
        </div>

        <button
          onClick={() => handleTestPhrase('1603722093')}
          className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-sky-500 hover:bg-sky-400 text-white shadow-md shadow-sky-500/20 transition-all cursor-pointer whitespace-nowrap"
        >
          Probar Evaluador Determinista
        </button>
      </div>

      {/* Main Grid: Steps List on Left, Detail & Tester on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: 15 Sequential Steps List (6 cols) */}
        <div className="lg:col-span-6 space-y-2.5">
          <div className="flex items-center justify-between text-xs text-slate-400 px-1">
            <span className="font-semibold text-white">Cadena de Pasos Programados ({FLOW_STEPS.length})</span>
            <span>Flujo lineal con bifurcaciones</span>
          </div>

          <div className="space-y-2">
            {FLOW_STEPS.map((step, idx) => {
              const isSelected = selectedStep.id === step.id;
              return (
                <div
                  key={step.id}
                  onClick={() => setSelectedStep(step)}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-[#101c36] border-sky-400/60 shadow-lg shadow-sky-950/60'
                      : 'bg-[#0c1424] border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="w-6 h-6 rounded-lg bg-slate-800 text-sky-400 flex items-center justify-center font-mono text-[11px] font-bold shrink-0 border border-slate-700">
                        {idx + 1}
                      </span>
                      <div className="min-w-0">
                        <h4 className="text-xs font-bold text-white truncate">{step.name}</h4>
                        <span className="text-[10px] text-slate-400 font-mono">{step.category}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {step.hasMedia && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-300 font-mono flex items-center gap-1 border border-amber-500/20">
                          {step.hasMedia === 'video' ? <Video className="w-3 h-3" /> : <ImageIcon className="w-3 h-3" />}
                          {step.hasMedia === 'video' ? 'Vídeo' : 'Foto'}
                        </span>
                      )}
                      <span className="text-[10px] font-mono text-sky-300 bg-sky-950/60 px-2 py-0.5 rounded border border-sky-400/20">
                        {step.id}
                      </span>
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-300 mt-1.5 line-clamp-1">
                    {step.trigger}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Step Inspector & Keyword Tester (6 cols) */}
        <div className="lg:col-span-6 space-y-5">
          {/* Selected Step Inspector */}
          <div className="p-5 rounded-2xl bg-[#0c1424] border border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <span className="text-[10px] font-mono uppercase text-sky-400 tracking-wider font-semibold">
                  Ficha de la Etapa Seleccionada
                </span>
                <h3 className="text-sm font-bold text-white">{selectedStep.name}</h3>
              </div>
              <span className="text-xs px-2.5 py-0.5 rounded-full font-mono font-bold bg-slate-800 text-slate-300">
                {selectedStep.category}
              </span>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-slate-400 block font-medium mb-1">Disparador de la etapa:</span>
                <p className="text-slate-200 bg-slate-900/80 p-2.5 rounded-xl border border-slate-800">
                  {selectedStep.trigger}
                </p>
              </div>

              <div>
                <span className="text-slate-400 block font-medium mb-1">
                  Respuestas esperadas reconocidas:
                </span>
                <p className="font-mono text-amber-300 bg-slate-900/80 p-2.5 rounded-xl border border-slate-800 text-[11px]">
                  {selectedStep.expectedInput}
                </p>
              </div>

              <div>
                <span className="text-slate-400 block font-medium mb-1">Destino siguiente:</span>
                <p className="font-mono text-sky-400 bg-sky-950/30 p-2.5 rounded-xl border border-sky-500/20 text-[11px]">
                  {selectedStep.destination}
                </p>
              </div>
            </div>
          </div>

          {/* Pure Deterministic Tester Playground */}
          <div className="p-5 rounded-2xl bg-gradient-to-b from-[#0c1424] to-[#080d1a] border border-sky-500/30 shadow-xl space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-sky-500/15 border border-sky-500/30 flex items-center justify-center text-sky-400">
                <Terminal className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                  Probador de Reconocimiento Determinista (Sin IA)
                </h3>
                <p className="text-[11px] text-slate-400">
                  Verifica cómo las reglas fijas clasifican palabras escritas y códigos numéricos de cuenta
                </p>
              </div>
            </div>

            {/* Quick Test Chips */}
            <div className="flex flex-wrap gap-1.5">
              {[
                '1603722093',
                'Soy de Medellín',
                'España',
                'SÍ, ME INTERESA',
                'Quiero saber más',
                'No por ahora',
                'Ya lo encontré',
                '¿Cuánto dinero voy a ganar?',
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
                placeholder="Escribe una respuesta para clasificar..."
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

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] pt-1">
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
