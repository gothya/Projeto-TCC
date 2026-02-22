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

export const Step5 = ({
  formData,
  handleRadioChange,
}: {
  formData: SociodemographicData;
  handleRadioChange: any;
}) => {
  const purposes = [
    { name: "purpose_talk", label: "Conversar com amigos/família" },
    { name: "purpose_share", label: "Trocar vídeos com amigos/família" },
    { name: "purpose_watch", label: "Ver vídeos curtos (rolar o feed)" },
    { name: "purpose_search", label: "Buscar informações" },
  ];
  const frequencies = [
    "Nenhuma vez",
    "Poucas vezes",
    "Algumas vezes",
    "Muitas vezes",
    "Sempre",
  ];
  return (
    <div>
      <h3 className="text-cyan-300 text-sm font-bold mb-2">
        Finalidade de uso das redes sociais
      </h3>
      <p className="text-gray-400 text-xs mb-4">
        Assinale a frequência com que utiliza para cada finalidade
      </p>
      <div className="overflow-x-auto pb-2">
        <table className="w-full text-left text-sm min-w-[700px] xl:min-w-full">
          <thead>
            <tr className="border-b border-cyan-400/20">
              <th className="p-2">Finalidade</th>
              {frequencies.map((f) => (
                <th
                  key={f}
                  className="p-2 text-center text-gray-400 font-normal"
                >
                  {f}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {purposes.map((purpose) => (
              <tr key={purpose.name} className="border-b border-cyan-400/10">
                <td className="p-2 text-gray-300">{purpose.label}</td>
                {frequencies.map((freq) => (
                  <td key={freq} className="p-2 text-center">
                    <label className="flex justify-center">
                      <CustomRadio
                        name={purpose.name}
                        value={freq}
                        label=""
                        checked={
                          formData[
                          purpose.name as keyof SociodemographicData
                          ] === freq
                        }
                        onChange={handleRadioChange}
                      />
                    </label>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
