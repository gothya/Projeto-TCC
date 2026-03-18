type SociodemographicData = {
  age: number | string;
  state: string;
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

const FREQUENCIES = [
  { value: "Nenhuma vez", label: "Nunca" },
  { value: "Poucas vezes", label: "Poucas" },
  { value: "Algumas vezes", label: "Algumas" },
  { value: "Muitas vezes", label: "Muitas" },
  { value: "Sempre", label: "Sempre" },
];

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

  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-cyan-300 text-sm font-bold mb-1">
          Finalidade de uso das redes sociais
        </h3>
        <p className="text-gray-400 text-xs">
          Com que frequência você usa redes sociais para cada finalidade?
        </p>
      </div>

      {purposes.map((purpose) => {
        const selected = formData[purpose.name as keyof SociodemographicData] as string;
        return (
          <div key={purpose.name} className="space-y-2">
            <p className="text-gray-300 text-sm leading-snug">{purpose.label}</p>
            <div className="flex gap-1.5 flex-wrap">
              {FREQUENCIES.map(({ value, label }) => {
                const isSelected = selected === value;
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => handleRadioChange(purpose.name, value)}
                    className="flex-1 min-w-[56px] py-2 px-1 rounded-lg text-xs font-semibold transition-all duration-200 active:scale-95"
                    style={isSelected ? {
                      background: "rgba(34,211,238,0.15)",
                      border: "1px solid rgba(34,211,238,0.7)",
                      color: "#22d3ee",
                      boxShadow: "0 0 10px rgba(34,211,238,0.25)",
                    } : {
                      background: "rgba(15,23,42,0.6)",
                      border: "1px solid rgba(255,255,255,0.08)",
                      color: "#64748b",
                    }}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
};
