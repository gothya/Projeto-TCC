import React, { useState, useRef } from "react";
import html2pdf from "html2pdf.js";
import { GameState } from "@/src/components/data/GameState";
import {
  calculateReportStats,
  generateTextFeedback,
  ReportStats,
  SCREEN_TIME_GLOBAL_REF,
  SCREEN_TIME_NATIONAL_REF,
} from "@/src/utils/ReportGeneratorUtils";
import {
  buildMockGameState,
  SCENARIO_DESCRIPTIONS,
  SCENARIO_LABELS,
  ScenarioProfile,
} from "@/src/utils/ReportTestScenarios";

const MAX_SCREEN_DISPLAY = 300;

const SCENARIO_PROFILES: ScenarioProfile[] = ["high", "medium", "low", "mixed", "minimal"];

const formatMinutes = (mins: number) =>
  `${Math.floor(mins / 60)}h ${mins % 60}min`;

const ScoreBar: React.FC<{
  value: number;
  min: number;
  max: number;
  colorClass: string;
}> = ({ value, min, max, colorClass }) => {
  const pct = Math.min(100, Math.max(0, ((value - min) / (max - min)) * 100));
  return (
    <div className="w-full bg-gray-200 rounded-full h-3">
      <div
        className={`h-3 rounded-full transition-all duration-500 ${colorClass}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
};

const SectionTitle: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <h3 className="text-xs font-bold uppercase tracking-widest text-cyan-700 border-b border-cyan-200 pb-1 mb-3">
    {children}
  </h3>
);

type Props = {
  gameState: GameState;
  onClose: () => void;
  testMode?: boolean;
};

export const ParticipantReportModal: React.FC<Props> = ({ gameState, onClose, testMode = false }) => {
  const [selectedProfile, setSelectedProfile] = useState<ScenarioProfile | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);

  const activeGameState = testMode && selectedProfile
    ? buildMockGameState(selectedProfile)
    : gameState;

  const stats: ReportStats = calculateReportStats(activeGameState);
  const feedback = generateTextFeedback(stats);

  const generatedAt = new Date().toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  const studyStart = activeGameState.studyStartDate
    ? new Date(activeGameState.studyStartDate).toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      })
    : null;

  const studyEnd = activeGameState.studyStartDate
    ? (() => {
        const end = new Date(activeGameState.studyStartDate);
        end.setDate(end.getDate() + 6);
        return end.toLocaleDateString("pt-BR", {
          day: "2-digit",
          month: "long",
          year: "numeric",
        });
      })()
    : null;

  const handleExportPdf = async () => {
    if (!reportRef.current) return;
    setIsExporting(true);
    const nickname = activeGameState.user?.nickname ?? "participante";
    const filename = `psylogos-relatorio-${nickname.toLowerCase().replace(/\s+/g, "-")}.pdf`;

    // Aguarda fontes (Google Fonts) estarem 100% carregadas antes de rasterizar
    await document.fonts.ready;

    // Injeta estilo temporário para corrigir renderização do html2canvas:
    // - letter-spacing e word-spacing: o canvas não recalcula kerning de fontes externas
    // - font-kerning: none + text-rendering: optimizeSpeed: desativa ligatures que o canvas não processa
    // - font-family: força fallback para fonte do sistema durante a rasterização, evitando
    //   que o Inter (Google Fonts) cause word-collapsing no canvas
    const pdfStyle = document.createElement("style");
    pdfStyle.textContent = `
      * {
        letter-spacing: normal !important;
        word-spacing: normal !important;
        line-height: 1.5 !important;
        font-kerning: none !important;
        text-rendering: optimizeSpeed !important;
        font-family: Arial, Helvetica, sans-serif !important;
      }
    `;
    reportRef.current.appendChild(pdfStyle);

    try {
      await html2pdf()
        .set({
          margin: [15, 15, 15, 15],
          filename,
          image: { type: "jpeg", quality: 0.98 },
          html2canvas: { scale: 2, useCORS: true, logging: false },
          jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
          pagebreak: { mode: ["avoid-all", "css", "legacy"] },
        })
        .from(reportRef.current)
        .save();
    } finally {
      // Remove o estilo temporário — visual da tela permanece intacto
      reportRef.current.removeChild(pdfStyle);
      setIsExporting(false);
    }
  };

  return (
    <>
      <div id="psylogos-modal-backdrop" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
        <div
          id="psylogos-modal-container"
          className="relative bg-slate-900 border border-cyan-400/30 rounded-xl max-w-2xl w-full flex flex-col shadow-2xl"
          style={{ maxHeight: "90vh" }}
        >
          {/* Fechar */}
          <button
            onClick={onClose}
            className="absolute top-3 right-3 text-gray-400 hover:text-white z-10 transition-colors"
            aria-label="Fechar relatório"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Barra de teste (apenas em modo dev) */}
          {testMode && (
            <div
              id="report-dev-bar"
              className="flex-shrink-0 bg-amber-950 border-b border-amber-700 p-3 rounded-t-xl"
            >
              <p className="text-xs font-bold text-amber-400 uppercase tracking-widest mb-2">
                [DEV] Perfil de Teste
              </p>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setSelectedProfile(null)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors border ${
                    selectedProfile === null
                      ? "bg-amber-400 text-amber-950 border-amber-400"
                      : "bg-transparent text-amber-300 border-amber-600 hover:border-amber-400"
                  }`}
                >
                  Dados Reais
                </button>
                {SCENARIO_PROFILES.map((profile) => (
                  <button
                    key={profile}
                    onClick={() => setSelectedProfile(profile)}
                    title={SCENARIO_DESCRIPTIONS[profile]}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors border ${
                      selectedProfile === profile
                        ? "bg-amber-400 text-amber-950 border-amber-400"
                        : "bg-transparent text-amber-300 border-amber-600 hover:border-amber-400"
                    }`}
                  >
                    {SCENARIO_LABELS[profile]}
                  </button>
                ))}
              </div>
              {selectedProfile && (
                <p className="text-xs text-amber-500 mt-1.5">
                  {SCENARIO_DESCRIPTIONS[selectedProfile]}
                </p>
              )}
            </div>
          )}

          {/* Área scrollável + imprimível */}
          <div id="psylogos-modal-scroll" className="overflow-y-auto flex-1">
            <div id="psylogos-report" ref={reportRef} className="p-6 bg-white text-gray-800">

              {/* ── Cabeçalho ── */}
              <div className="text-center mb-6 pb-4 border-b-2 border-cyan-500">
                <p className="text-xs text-gray-400 uppercase tracking-widest mb-1">Relatório Pessoal</p>
                <h1 className="text-2xl font-bold text-cyan-600">Psylogos</h1>
                <p className="text-sm text-gray-500 italic mt-0.5">"O Enigma do Coração"</p>
                <div className="mt-3 flex justify-center gap-6 text-sm text-gray-700">
                  <span className="font-semibold">{activeGameState.user?.nickname ?? "—"}</span>
                  <span>Nível {activeGameState.user?.level ?? 1}</span>
                  <span>{activeGameState.user?.points ?? 0} XP</span>
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  {studyStart && studyEnd
                    ? `Jornada realizada de ${studyStart} até ${studyEnd}`
                    : studyStart
                    ? `Jornada iniciada em ${studyStart}`
                    : ""}
                </p>
              </div>

              {/* ── Desempenho na Jornada ── */}
              <div className="mb-6">
                <SectionTitle>Desempenho na Jornada</SectionTitle>
                <div className="grid grid-cols-3 gap-3 text-center mb-3">
                  <div className="bg-green-50 rounded-lg p-3 border border-green-200">
                    <p className="text-2xl font-bold text-green-600">{stats.pingStats.completed}</p>
                    <p className="text-xs text-gray-500 mt-1">Respondidos</p>
                  </div>
                  <div className="bg-red-50 rounded-lg p-3 border border-red-200">
                    <p className="text-2xl font-bold text-red-500">{stats.pingStats.missed}</p>
                    <p className="text-xs text-gray-500 mt-1">Perdidos</p>
                  </div>
                  <div className="bg-cyan-50 rounded-lg p-3 border border-cyan-200">
                    <p className="text-2xl font-bold text-cyan-600">{stats.pingStats.completionRate}%</p>
                    <p className="text-xs text-gray-500 mt-1">Taxa de Resposta</p>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>Progresso geral</span>
                    <span>{stats.pingStats.completed} de {stats.pingStats.issued} pings emitidos</span>
                  </div>
                  <ScoreBar
                    value={stats.pingStats.completed}
                    min={0}
                    max={stats.pingStats.issued || 1}
                    colorClass="bg-cyan-500"
                  />
                </div>
              </div>

              {/* ── SAM ── */}
              {stats.sam ? (
                <div className="mb-6">
                  <SectionTitle>Bem-Estar Emocional — SAM</SectionTitle>
                  <p className="text-xs text-gray-500 mb-3">
                    O SAM (Self-Assessment Manikin) avalia três dimensões emocionais em escala de 1 a 9.
                    Valores acima de 5 indicam estados positivos, ativados e com maior senso de controle.
                  </p>
                  <div className="space-y-4">
                    {[
                      {
                        label: "Valência (Prazer)",
                        value: stats.sam.valence,
                        low: "Desprazer",
                        high: "Prazer",
                        colorClass: stats.sam.valence >= 5 ? "bg-cyan-500" : "bg-orange-400",
                      },
                      {
                        label: "Alerta (Ativação)",
                        value: stats.sam.arousal,
                        low: "Calmo",
                        high: "Agitado",
                        colorClass: "bg-blue-500",
                      },
                      {
                        label: "Dominância (Controle)",
                        value: stats.sam.dominance,
                        low: "Sem controle",
                        high: "Com controle",
                        colorClass: stats.sam.dominance >= 5 ? "bg-purple-500" : "bg-gray-400",
                      },
                    ].map(({ label, value, low, high, colorClass }) => (
                      <div key={label}>
                        <div className="flex justify-between text-xs text-gray-700 mb-1">
                          <span className="font-medium">{label}</span>
                          <span className="font-bold text-cyan-700">{value.toFixed(1)} / 9</span>
                        </div>
                        <ScoreBar value={value} min={1} max={9} colorClass={colorClass} />
                        <div className="flex justify-between text-xs text-gray-400 mt-0.5">
                          <span>{low}</span>
                          <span>{high}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-gray-400 mt-2">Baseado em {stats.sam.count} avaliações.</p>
                </div>
              ) : (
                <div className="mb-6 p-3 bg-gray-50 rounded-lg border border-gray-200 text-center">
                  <SectionTitle>Bem-Estar Emocional — SAM</SectionTitle>
                  <p className="text-xs text-gray-400">Nenhuma avaliação SAM registrada ainda.</p>
                </div>
              )}

              {/* ── PANAS ── */}
              {stats.panas ? (
                <div className="mb-6">
                  <SectionTitle>Afeto — PANAS</SectionTitle>
                  <p className="text-xs text-gray-500 mb-3">
                    A escala PANAS avalia 10 afetos positivos e 10 negativos (cada item: 1–5 pontos; total por dimensão: 10–50).
                    Afeto Positivo alto e Negativo baixo indicam maior bem-estar.
                  </p>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-xs text-gray-700 mb-1">
                        <span className="font-medium">Afeto Positivo (PA)</span>
                        <span className="font-bold text-green-600">{stats.panas.pa.toFixed(1)} / 50</span>
                      </div>
                      <ScoreBar value={stats.panas.pa} min={10} max={50} colorClass="bg-green-500" />
                      <div className="flex justify-between text-xs text-gray-400 mt-0.5">
                        <span>Baixo (10)</span>
                        <span>Alto (50)</span>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-xs text-gray-700 mb-1">
                        <span className="font-medium">Afeto Negativo (NA)</span>
                        <span className="font-bold text-red-500">{stats.panas.na.toFixed(1)} / 50</span>
                      </div>
                      <ScoreBar value={stats.panas.na} min={10} max={50} colorClass="bg-red-400" />
                      <div className="flex justify-between text-xs text-gray-400 mt-0.5">
                        <span>Baixo (10)</span>
                        <span>Alto (50)</span>
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-gray-400 mt-2">Baseado em {stats.panas.count} avaliações.</p>
                </div>
              ) : (
                <div className="mb-6 p-3 bg-gray-50 rounded-lg border border-gray-200 text-center">
                  <SectionTitle>Afeto — PANAS</SectionTitle>
                  <p className="text-xs text-gray-400">Nenhuma avaliação PANAS registrada ainda.</p>
                </div>
              )}

              {/* ── Tempo de Tela ── */}
              {stats.screenTime ? (
                <div className="mb-6">
                  <SectionTitle>Consumo de Vídeos Curtos</SectionTitle>
                  <p className="text-xs text-gray-500 mb-3">
                    Tempo médio diário de uso de plataformas de vídeos curtos (TikTok, Reels, Shorts).
                    As linhas de referência indicam a média global e a média nacional (Brasil, DataReportal 2024).
                  </p>

                  <div className="mb-1">
                    <div className="flex justify-between text-xs text-gray-700 mb-1">
                      <span className="font-medium">Sua média diária</span>
                      <span className="font-bold text-cyan-700">
                        {formatMinutes(stats.screenTime.avgDailyMinutes)}
                        {" "}({stats.screenTime.avgDailyMinutes} min)
                      </span>
                    </div>
                    <div className="relative w-full bg-gray-200 rounded-full h-5">
                      <div
                        className={`h-5 rounded-full transition-all duration-500 ${
                          stats.screenTime.avgDailyMinutes > SCREEN_TIME_NATIONAL_REF
                            ? "bg-red-500"
                            : stats.screenTime.avgDailyMinutes > SCREEN_TIME_GLOBAL_REF
                            ? "bg-yellow-400"
                            : "bg-green-500"
                        }`}
                        style={{
                          width: `${Math.min(100, (stats.screenTime.avgDailyMinutes / MAX_SCREEN_DISPLAY) * 100)}%`,
                        }}
                      />
                      <div
                        className="absolute top-0 bottom-0 w-0.5 bg-blue-600"
                        style={{ left: `${(SCREEN_TIME_GLOBAL_REF / MAX_SCREEN_DISPLAY) * 100}%` }}
                      />
                      <div
                        className="absolute top-0 bottom-0 w-0.5 bg-purple-600"
                        style={{ left: `${(SCREEN_TIME_NATIONAL_REF / MAX_SCREEN_DISPLAY) * 100}%` }}
                      />
                    </div>
                    <div className="relative flex justify-between text-xs text-gray-400 mt-1 h-4">
                      <span>0</span>
                      <span
                        className="absolute text-blue-600 font-medium"
                        style={{
                          left: `${(SCREEN_TIME_GLOBAL_REF / MAX_SCREEN_DISPLAY) * 100}%`,
                          transform: "translateX(-50%)",
                        }}
                      >
                        {SCREEN_TIME_GLOBAL_REF}m Global
                      </span>
                      <span
                        className="absolute text-purple-600 font-medium"
                        style={{
                          left: `${(SCREEN_TIME_NATIONAL_REF / MAX_SCREEN_DISPLAY) * 100}%`,
                          transform: "translateX(-50%)",
                        }}
                      >
                        {SCREEN_TIME_NATIONAL_REF}m BR
                      </span>
                      <span>{MAX_SCREEN_DISPLAY}min+</span>
                    </div>
                  </div>

                  {Object.keys(stats.screenTime.platformBreakdown).length > 0 && (
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      {Object.entries(stats.screenTime.platformBreakdown)
                        .sort(([, a], [, b]) => b - a)
                        .map(([platform, totalMins]) => (
                          <div
                            key={platform}
                            className="bg-gray-50 rounded p-2 border border-gray-200 text-xs flex justify-between"
                          >
                            <span className="font-medium text-gray-700">{platform}</span>
                            <span className="text-gray-500">
                              ~{Math.round(totalMins / stats.screenTime!.totalDays)} min/dia
                            </span>
                          </div>
                        ))}
                    </div>
                  )}
                  <p className="text-xs text-gray-400 mt-2">
                    Baseado em {stats.screenTime.totalDays} registros de fim de dia.
                  </p>
                </div>
              ) : (
                <div className="mb-6 p-3 bg-gray-50 rounded-lg border border-gray-200 text-center">
                  <SectionTitle>Consumo de Vídeos Curtos</SectionTitle>
                  <p className="text-xs text-gray-400">Nenhum registro de tempo de tela encontrado.</p>
                </div>
              )}

              {/* ── Avaliação do Psylogos ── */}
              <div className="mb-6 p-4 bg-cyan-50 rounded-lg border border-cyan-200">
                <SectionTitle>Avaliação do Psylogos</SectionTitle>
                <p className="text-sm text-gray-700 leading-relaxed">{feedback}</p>

                {/* Disclaimer — visibilidade adequada para contexto de pesquisa */}
                <div className="mt-4 flex items-start gap-2 bg-white rounded-lg border border-gray-300 p-3">
                  <svg className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M12 2a10 10 0 110 20A10 10 0 0112 2z" />
                  </svg>
                  <p className="text-xs text-gray-600 leading-snug">
                    Este relatório é gerado automaticamente com base nas suas respostas durante o estudo EMA
                    e tem finalidade exclusivamente informativa e de devolutiva científica.{" "}
                    <strong>Não constitui diagnóstico clínico ou avaliação psicológica profissional.</strong>
                  </p>
                </div>
              </div>

              {/* ── Rodapé ── */}
              <div className="text-center text-xs text-gray-400 border-t border-gray-200 pt-3">
                <p className="font-medium">Psylogos — Estudo de Avaliação Ecológica Momentânea (EMA)</p>
                <p>Relatório gerado em {generatedAt}</p>
              </div>

            </div>
          </div>

          {/* ── Botões de ação ── */}
          <div className="flex justify-end gap-3 p-4 border-t border-slate-700 bg-slate-900 rounded-b-xl flex-shrink-0">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm text-gray-400 hover:text-white border border-slate-600 hover:border-slate-400 rounded-lg transition-colors"
            >
              Fechar
            </button>
            <button
              onClick={handleExportPdf}
              disabled={isExporting}
              className="px-4 py-2 text-sm bg-cyan-500 hover:bg-cyan-400 disabled:opacity-60 disabled:cursor-wait text-slate-900 font-bold rounded-lg transition-colors flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
              </svg>
              {isExporting ? "Gerando PDF..." : "Salvar como PDF"}
            </button>
          </div>

        </div>
      </div>
    </>
  );
};
