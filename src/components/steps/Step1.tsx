import { FormField } from "../form/FormField";
import { CustomRadio } from "../form/CustomRadio";
import type { SociodemographicData } from "@/src/components/data/SocialDemographicData";

export const Step1 = ({
  formData,
  handleChange,
  handleRadioChange,
}: {
  formData: SociodemographicData;
  handleChange: any;
  handleRadioChange: any;
}) => (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
    <FormField label="Idade">
      <input
        type="number"
        name="age"
        value={formData.age}
        onChange={handleChange}
        className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all"
        placeholder="Sua idade"
      />
    </FormField>
    <FormField label="Estado (UF)">
      <select
        name="state"
        value={formData.state}
        onChange={handleChange as any}
        className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all appearance-none"
      >
        <option value="" disabled>Selecione seu estado</option>
        <option value="AC">Acre (AC)</option>
        <option value="AL">Alagoas (AL)</option>
        <option value="AP">Amapá (AP)</option>
        <option value="AM">Amazonas (AM)</option>
        <option value="BA">Bahia (BA)</option>
        <option value="CE">Ceará (CE)</option>
        <option value="DF">Distrito Federal (DF)</option>
        <option value="ES">Espírito Santo (ES)</option>
        <option value="GO">Goiás (GO)</option>
        <option value="MA">Maranhão (MA)</option>
        <option value="MT">Mato Grosso (MT)</option>
        <option value="MS">Mato Grosso do Sul (MS)</option>
        <option value="MG">Minas Gerais (MG)</option>
        <option value="PA">Pará (PA)</option>
        <option value="PB">Paraíba (PB)</option>
        <option value="PR">Paraná (PR)</option>
        <option value="PE">Pernambuco (PE)</option>
        <option value="PI">Piauí (PI)</option>
        <option value="RJ">Rio de Janeiro (RJ)</option>
        <option value="RN">Rio Grande do Norte (RN)</option>
        <option value="RS">Rio Grande do Sul (RS)</option>
        <option value="RO">Rondônia (RO)</option>
        <option value="RR">Roraima (RR)</option>
        <option value="SC">Santa Catarina (SC)</option>
        <option value="SP">São Paulo (SP)</option>
        <option value="SE">Sergipe (SE)</option>
        <option value="TO">Tocantins (TO)</option>
      </select>
    </FormField>
    <FormField label="Gênero">
      <div className="space-y-2">
        <CustomRadio
          name="gender"
          value="Feminino"
          label="Feminino"
          checked={formData.gender === "Feminino"}
          onChange={handleRadioChange}
        />
        <CustomRadio
          name="gender"
          value="Masculino"
          label="Masculino"
          checked={formData.gender === "Masculino"}
          onChange={handleRadioChange}
        />
        <CustomRadio
          name="gender"
          value="Outro"
          label="Outro"
          checked={formData.gender === "Outro"}
          onChange={handleRadioChange}
        />
        <CustomRadio
          name="gender"
          value="Prefiro não responder"
          label="Prefiro não responder"
          checked={formData.gender === "Prefiro não responder"}
          onChange={handleRadioChange}
        />
      </div>
    </FormField>
    <FormField label="Estado Civil">
      <div className="space-y-2">
        <CustomRadio
          name="maritalStatus"
          value="Solteiro(a)"
          label="Solteiro(a)"
          checked={formData.maritalStatus === "Solteiro(a)"}
          onChange={handleRadioChange}
        />
        <CustomRadio
          name="maritalStatus"
          value="Casado(a) / União estável"
          label="Casado(a) / União estável"
          checked={formData.maritalStatus === "Casado(a) / União estável"}
          onChange={handleRadioChange}
        />
        <CustomRadio
          name="maritalStatus"
          value="Separado(a) / Divorciado(a)"
          label="Separado(a) / Divorciado(a)"
          checked={formData.maritalStatus === "Separado(a) / Divorciado(a)"}
          onChange={handleRadioChange}
        />
        <CustomRadio
          name="maritalStatus"
          value="Viúvo(a)"
          label="Viúvo(a)"
          checked={formData.maritalStatus === "Viúvo(a)"}
          onChange={handleRadioChange}
        />
      </div>
    </FormField>
    <FormField label="Escolaridade">
      <div className="space-y-2">
        <CustomRadio
          name="education"
          value="Ensino Fundamental"
          label="Ensino Fundamental"
          checked={formData.education === "Ensino Fundamental"}
          onChange={handleRadioChange}
        />
        <CustomRadio
          name="education"
          value="Ensino Médio"
          label="Ensino Médio"
          checked={formData.education === "Ensino Médio"}
          onChange={handleRadioChange}
        />
        <CustomRadio
          name="education"
          value="Ensino Superior (em andamento)"
          label="Ensino Superior (em andamento)"
          checked={formData.education === "Ensino Superior (em andamento)"}
          onChange={handleRadioChange}
        />
        <CustomRadio
          name="education"
          value="Ensino Superior (concluído)"
          label="Ensino Superior (concluído)"
          checked={formData.education === "Ensino Superior (concluído)"}
          onChange={handleRadioChange}
        />
        <CustomRadio
          name="education"
          value="Pós-graduação / Mestrado / Doutorado"
          label="Pós-graduação / Mestrado / Doutorado"
          checked={
            formData.education === "Pós-graduação / Mestrado / Doutorado"
          }
          onChange={handleRadioChange}
        />
      </div>
    </FormField>
    <div className="md:col-span-2">
      <FormField label="Ocupação principal">
        <input
          type="text"
          name="occupation"
          value={formData.occupation}
          onChange={handleChange}
          className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all"
          placeholder="Sua ocupação"
        />
      </FormField>
    </div>
  </div>
);
