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

export const Step3 = ({
  formData,
  handleRadioChange,
}: {
  formData: SociodemographicData;
  handleRadioChange: any;
}) => (
  <FormField label="Renda mensal aproximada">
    <div className="space-y-2">
      <CustomRadio
        name="monthlyIncome"
        value="Até 1 salário mínimo"
        label="Até 1 salário mínimo"
        checked={formData.monthlyIncome === "Até 1 salário mínimo"}
        onChange={handleRadioChange}
      />
      <CustomRadio
        name="monthlyIncome"
        value="De 1 a 3 salários mínimos"
        label="De 1 a 3 salários mínimos"
        checked={formData.monthlyIncome === "De 1 a 3 salários mínimos"}
        onChange={handleRadioChange}
      />
      <CustomRadio
        name="monthlyIncome"
        value="De 3 a 5 salários mínimos"
        label="De 3 a 5 salários mínimos"
        checked={formData.monthlyIncome === "De 3 a 5 salários mínimos"}
        onChange={handleRadioChange}
      />
      <CustomRadio
        name="monthlyIncome"
        value="Acima de 5 salários mínimos"
        label="Acima de 5 salários mínimos"
        checked={formData.monthlyIncome === "Acima de 5 salários mínimos"}
        onChange={handleRadioChange}
      />
      <CustomRadio
        name="monthlyIncome"
        value="Prefiro não informar"
        label="Prefiro não informar"
        checked={formData.monthlyIncome === "Prefiro não informar"}
        onChange={handleRadioChange}
      />
    </div>
  </FormField>
);
