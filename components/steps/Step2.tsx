import { FormField } from "../form/FormField";
import { CustomRadio } from "../form/CustomRadio";

type SociodemographicData = {
  age: number | string;
  gender: string;
  maritalStatus: string;
  education: string;
  occupation: string;
  continuousMedication: string;
  medicationDetails: string;
  healthDiagnosis: string;
  diagnosisDetails: string;
  monthlyIncome: string;
  platforms: string[];
  otherPlatform: string;
  usagePeriod: string;
  dailyUsage: string;
  purpose_talk: string;
  purpose_share: string;
  purpose_watch: string;
  purpose_search: string;
};

export const Step2 = ({
  formData,
  handleChange,
  handleRadioChange,
}: {
  formData: SociodemographicData;
  handleChange: any;
  handleRadioChange: any;
}) => (
  <div className="space-y-6">
    <FormField label="Remédio de uso contínuo">
      <div className="flex space-x-6">
        <CustomRadio
          name="continuousMedication"
          value="Sim"
          label="Sim"
          checked={formData.continuousMedication === "Sim"}
          onChange={handleRadioChange}
        />
        <CustomRadio
          name="continuousMedication"
          value="Não"
          label="Não"
          checked={formData.continuousMedication === "Não"}
          onChange={handleRadioChange}
        />
      </div>
    </FormField>
    {formData.continuousMedication === "Sim" && (
      <FormField label="Qual(is)?">
        <input
          type="text"
          name="medicationDetails"
          value={formData.medicationDetails}
          onChange={handleChange}
          className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all"
          placeholder="Nome do remédio"
        />
      </FormField>
    )}
    <FormField label="Diagnóstico de saúde física e/ou mental">
      <div className="flex space-x-6">
        <CustomRadio
          name="healthDiagnosis"
          value="Sim"
          label="Sim"
          checked={formData.healthDiagnosis === "Sim"}
          onChange={handleRadioChange}
        />
        <CustomRadio
          name="healthDiagnosis"
          value="Não"
          label="Não"
          checked={formData.healthDiagnosis === "Não"}
          onChange={handleRadioChange}
        />
      </div>
    </FormField>
    {formData.healthDiagnosis === "Sim" && (
      <FormField label="Qual(is)?">
        <input
          type="text"
          name="diagnosisDetails"
          value={formData.diagnosisDetails}
          onChange={handleChange}
          className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all"
          placeholder="Nome do diagnóstico"
        />
      </FormField>
    )}
  </div>
);
