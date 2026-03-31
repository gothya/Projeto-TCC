import React, { useState } from "react";
import { Step1 } from "../steps/Step1";
import { Step2 } from "../steps/Step2";
import { Step3 } from "../steps/Step3";
import { Step4 } from "../steps/Step4";
import { Step5 } from "../steps/Step5";
export type { SociodemographicData } from "@/src/components/data/SocialDemographicData";
import type { SociodemographicData } from "@/src/components/data/SocialDemographicData";

export const SociodemographicQuestionnaireScreen: React.FC<{
  onComplete: (data: SociodemographicData) => void;
  initialData?: SociodemographicData;
  initialStep?: number;
  onStepChange?: (step: number, data: SociodemographicData) => void;
}> = ({ onComplete, initialData, initialStep, onStepChange }) => {
  const totalSteps = 5;
  const [step, setStep] = useState(initialStep ?? 0);
  const [formData, setFormData] = useState<SociodemographicData>(
    initialData || {
      age: "",
      state: "",
      gender: "",
      maritalStatus: "",
      education: "",
      occupation: "",
      continuousMedication: "",
      medicationDetails: "",
      healthDiagnosis: "",
      diagnosisDetails: "",
      monthlyIncome: "",
      platforms: [],
      otherPlatform: "",
      usagePeriod: "",
      dailyUsage: "",
      purpose_talk: "",
      purpose_share: "",
      purpose_watch: "",
      purpose_search: "",
    }
  );

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    if (type === "checkbox") {
      const { checked } = e.target as HTMLInputElement;
      setFormData((prev) => ({
        ...prev,
        platforms: checked
          ? [...prev.platforms, value]
          : prev.platforms.filter((p) => p !== value),
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleRadioChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const nextStep = () => {
    const next = Math.min(step + 1, totalSteps - 1);
    setStep(next);
    onStepChange?.(next, formData);
  };

  const prevStep = () => {
    const prev = Math.max(step - 1, 0);
    setStep(prev);
    onStepChange?.(prev, formData);
  };

  const isStepValid = (): boolean => {
    const d = formData;
    switch (step) {
      case 0:
        return (
          String(d.age).trim() !== "" &&
          Number(d.age) > 0 &&
          d.state !== "" &&
          d.gender !== "" &&
          d.maritalStatus !== "" &&
          d.education !== "" &&
          d.occupation.trim() !== ""
        );
      case 1:
        return (
          d.continuousMedication !== "" &&
          (d.continuousMedication !== "Sim" || d.medicationDetails.trim() !== "") &&
          d.healthDiagnosis !== "" &&
          (d.healthDiagnosis !== "Sim" || d.diagnosisDetails.trim() !== "")
        );
      case 2:
        return d.monthlyIncome !== "";
      case 3:
        return (
          d.platforms.length > 0 &&
          (!d.platforms.includes("Outras") || d.otherPlatform.trim() !== "") &&
          d.usagePeriod !== "" &&
          d.dailyUsage !== ""
        );
      case 4:
        return (
          d.purpose_talk !== "" &&
          d.purpose_share !== "" &&
          d.purpose_watch !== "" &&
          d.purpose_search !== ""
        );
      default:
        return true;
    }
  };

  const handleSubmit = () => {
    onComplete(formData);
  };

  const renderStep = () => {
    switch (step) {
      case 0:
        return (
          <Step1
            formData={formData}
            handleChange={handleChange}
            handleRadioChange={handleRadioChange}
          />
        );
      case 1:
        return (
          <Step2
            formData={formData}
            handleChange={handleChange}
            handleRadioChange={handleRadioChange}
          />
        );
      case 2:
        return (
          <Step3 formData={formData} handleRadioChange={handleRadioChange} />
        );
      case 3:
        return (
          <Step4
            formData={formData}
            handleChange={handleChange}
            handleRadioChange={handleRadioChange}
          />
        );
      case 4:
        return (
          <Step5 formData={formData} handleRadioChange={handleRadioChange} />
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 animate-fade-in">
      <div className="w-full max-w-2xl p-8 space-y-6 bg-slate-900/50 backdrop-blur-md rounded-2xl border border-cyan-400/20 shadow-glow-blue">
        <h2 className="text-xl font-bold text-cyan-400 text-center">
          Questionário Sociodemográfico
        </h2>
        <div className="w-full bg-gray-700 rounded-full h-1.5">
          <div
            className="bg-cyan-400 h-1.5 rounded-full"
            style={{ width: `${((step + 1) / totalSteps) * 100}%` }}
          ></div>
        </div>

        <div className="min-h-[300px] py-4">{renderStep()}</div>

        <div className="flex justify-between items-center pt-4">
          <button
            onClick={prevStep}
            disabled={step === 0}
            className="px-6 py-2 font-bold text-cyan-300 bg-transparent border border-cyan-400/50 rounded-lg hover:bg-cyan-400/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Voltar
          </button>
          {step < totalSteps - 1 ? (
            <button
              onClick={nextStep}
              disabled={!isStepValid()}
              className="px-6 py-2 font-bold text-brand-dark bg-cyan-400 rounded-lg hover:bg-cyan-300 transition-colors shadow-glow-blue disabled:bg-gray-600 disabled:text-gray-400 disabled:cursor-not-allowed disabled:shadow-none"
            >
              Próximo
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={!isStepValid()}
              className="px-6 py-2 font-bold text-brand-dark bg-green-400 rounded-lg hover:bg-green-300 transition-colors shadow-glow-blue disabled:bg-gray-600 disabled:text-gray-400 disabled:cursor-not-allowed disabled:shadow-none"
            >
              Finalizar
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
