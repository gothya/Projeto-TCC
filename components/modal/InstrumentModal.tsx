import React from "react";

import { InstrumentFlowState } from "../states/InstrumentFlowState";
import { InstrumentResponse } from "../data/InstrumentResponse";
import { SAMComponent } from "../SAMComponent";
import { FeedContextComponent } from "../FeedContextComponent";
import { PANASComponent } from "../PANASComponent";

export const InstrumentModal: React.FC<{
  flow: InstrumentFlowState;
  onStep: (data: Partial<InstrumentResponse>) => void;
  onCancel: () => void;
}> = ({ flow, onCancel, onStep }) => {
  if (!flow) return null;

  const REGULAR_FLOW_SEQUENCE = ["sam", "feed_context", "panas_contextual"];
  const EOD_FLOW_SEQUENCE = ["panas_daily", "end_of_day_log"];

  const sequence =
    flow.type === "regular" ? REGULAR_FLOW_SEQUENCE : EOD_FLOW_SEQUENCE;
  const currentStepIndex = sequence.indexOf(flow.step);
  const totalSteps = sequence.length;

  const stepTitles: { [key: string]: string } = {
    sam: "Como você está se sentindo agora?",
    feed_context: "Contexto",
    panas_contextual: "Emoções (Últimos 5 min)",
    panas_daily: "Emoções (Hoje)",
    end_of_day_log: "Relatório de Fim de Dia",
  };

  const renderStepContent = () => {
    switch (flow.step) {
      case "sam":
        return <SAMComponent onComplete={(sam) => onStep({ sam })} />;
      case "feed_context":
        return (
          <FeedContextComponent
            onComplete={(wasWatchingFeed) => onStep({ wasWatchingFeed })}
          />
        );
      case "panas_contextual":
        const panasQuestion = flow.data.wasWatchingFeed
          ? "Quais emoções você sentiu ao assistir vídeos nos últimos 5 minutos?"
          : "Quais emoções percebe ter sentido nos últimos 5 minutos?";
        return (
          <PANASComponent
            question={panasQuestion}
            onComplete={(panas) => onStep({ panas })}
          />
        );
      case "panas_daily":
        return (
          <PANASComponent
            question="Indique até que ponto você se sentiu desta forma hoje."
            onComplete={(panas) => onStep({ panas })}
          />
        );
      case "end_of_day_log":
        return <EndOfDayLogComponent onComplete={(data) => onStep(data)} />;
      default:
        return <div>Passo desconhecido.</div>;
    }
  };

  return (
    <Modal onClose={onCancel} className="max-w-4xl">
      <div className="p-4 sm:p-8">
        <div className="mb-4">
          <div className="flex justify-between items-start mb-2">
            <div>
              <h2 className="text-xl font-bold text-cyan-400">
                {stepTitles[flow.step]}
              </h2>
              {flow.step === "sam" && (
                <p className="text-sm text-gray-400 mt-1">
                  O nível 9 é o de maior alegria, a escala começa na tristeza e
                  vai até a alegria.
                </p>
              )}
            </div>
            <span className="text-sm font-semibold text-gray-400">
              Passo {currentStepIndex + 1}{" "}
              <span className="font-normal text-gray-500">de</span> {totalSteps}
            </span>
          </div>
          <div className="w-full bg-gray-700/50 rounded-full h-1">
            <div
              className="bg-cyan-400 h-1 rounded-full transition-all duration-300"
              style={{
                width: `${((currentStepIndex + 1) / totalSteps) * 100}%`,
              }}
            ></div>
          </div>
        </div>
        {renderStepContent()}
      </div>
    </Modal>
  );
};
