import { FormField } from "../form/FormField";
import { CustomCheckbox } from "../form/CustomCheckbox";
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

export const Step4 = ({
  formData,
  handleChange,
  handleRadioChange,
}: {
  formData: SociodemographicData;
  handleChange: any;
  handleRadioChange: any;
}) => (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
    <FormField label="Quais redes sociais você utiliza para ver vídeos curtos?">
      <div className="space-y-2">
        <CustomCheckbox
          name="platforms"
          value="TikTok"
          label="TikTok"
          checked={formData.platforms.includes("TikTok")}
          onChange={handleChange}
        />
        <CustomCheckbox
          name="platforms"
          value="Instagram"
          label="Instagram"
          checked={formData.platforms.includes("Instagram")}
          onChange={handleChange}
        />
        <CustomCheckbox
          name="platforms"
          value="YouTube Shorts"
          label="YouTube Shorts"
          checked={formData.platforms.includes("YouTube Shorts")}
          onChange={handleChange}
        />
        <CustomCheckbox
          name="platforms"
          value="Outras"
          label="Outras"
          checked={formData.platforms.includes("Outras")}
          onChange={handleChange}
        />
      </div>
      {formData.platforms.includes("Outras") && (
        <input
          type="text"
          name="otherPlatform"
          value={formData.otherPlatform}
          onChange={handleChange}
          className="form-input mt-2"
          placeholder="Quais?"
        />
      )}
    </FormField>
    <FormField label="Período em que mais utiliza redes sociais">
      <div className="space-y-2">
        <CustomRadio
          name="usagePeriod"
          value="Manhã"
          label="Manhã"
          checked={formData.usagePeriod === "Manhã"}
          onChange={handleRadioChange}
        />
        <CustomRadio
          name="usagePeriod"
          value="Tarde"
          label="Tarde"
          checked={formData.usagePeriod === "Tarde"}
          onChange={handleRadioChange}
        />
        <CustomRadio
          name="usagePeriod"
          value="Noite"
          label="Noite"
          checked={formData.usagePeriod === "Noite"}
          onChange={handleRadioChange}
        />
      </div>
    </FormField>
    <div className="md:col-span-2">
      <FormField label="Tempo médio estimado de uso diário">
        <div className="space-y-2">
          <CustomRadio
            name="dailyUsage"
            value="Menos de 1 hora"
            label="Menos de 1 hora"
            checked={formData.dailyUsage === "Menos de 1 hora"}
            onChange={handleRadioChange}
          />
          <CustomRadio
            name="dailyUsage"
            value="1 a 2 horas"
            label="1 a 2 horas"
            checked={formData.dailyUsage === "1 a 2 horas"}
            onChange={handleRadioChange}
          />
          <CustomRadio
            name="dailyUsage"
            value="3 a 4 horas"
            label="3 a 4 horas"
            checked={formData.dailyUsage === "3 a 4 horas"}
            onChange={handleRadioChange}
          />
          <CustomRadio
            name="dailyUsage"
            value="5 a 6 horas"
            label="5 a 6 horas"
            checked={formData.dailyUsage === "5 a 6 horas"}
            onChange={handleRadioChange}
          />
          <CustomRadio
            name="dailyUsage"
            value="Mais de 6 horas"
            label="Mais de 6 horas"
            checked={formData.dailyUsage === "Mais de 6 horas"}
            onChange={handleRadioChange}
          />
        </div>
      </FormField>
    </div>
  </div>
);
