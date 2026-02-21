import React from "react";
import { SociodemographicData } from "../data/SocialDemographicData";
import { Modal } from "../modal/Modal";

export const SociodemographicModal: React.FC<{
  onClose: () => void;
  data: SociodemographicData;
}> = ({ onClose, data }) => {
  const DataRow = ({
    label,
    value,
  }: {
    label: string;
    value: string | string[] | undefined | null;
  }) =>
    value ? (
      <div className="py-2 border-b border-cyan-400/10">
        <dt className="text-sm font-semibold text-cyan-300">{label}</dt>
        <dd className="text-gray-300">
          {Array.isArray(value) ? value.join(", ") : value}
        </dd>
      </div>
    ) : null;

  return (
    <Modal onClose={onClose} className="max-w-2xl">
      <div className="p-8">
        <h2 className="text-2xl font-bold text-cyan-400 text-center mb-4">
          Meus Dados Sociodemográficos
        </h2>
        <div className="h-96 overflow-y-auto p-4 border border-cyan-400/30 rounded-lg bg-black/20 text-gray-300 text-sm">
          <dl>
            <DataRow label="Idade" value={`${data.age} anos`} />
            <DataRow label="Gênero" value={data.gender} />
            <DataRow label="Estado Civil" value={data.maritalStatus} />
            <DataRow label="Escolaridade" value={data.education} />
            <DataRow label="Ocupação Principal" value={data.occupation} />
            <DataRow
              label="Uso de medicação contínua"
              value={data.continuousMedication}
            />
            {data.continuousMedication === "Sim" && (
              <DataRow label="Medicação(ões)" value={data.medicationDetails} />
            )}
            <DataRow
              label="Diagnóstico de saúde"
              value={data.healthDiagnosis}
            />
            {data.healthDiagnosis === "Sim" && (
              <DataRow label="Diagnóstico(s)" value={data.diagnosisDetails} />
            )}
            <DataRow label="Renda Mensal" value={data.monthlyIncome} />
            <DataRow
              label="Plataformas de vídeos curtos"
              value={
                data.platforms.includes("Outras")
                  ? [
                      ...data.platforms.filter((p) => p !== "Outras"),
                      data.otherPlatform,
                    ]
                  : data.platforms
              }
            />
            <DataRow label="Período de maior uso" value={data.usagePeriod} />
            <DataRow label="Tempo de uso diário" value={data.dailyUsage} />
            <DataRow label="Finalidade: Conversar" value={data.purpose_talk} />
            <DataRow
              label="Finalidade: Trocar vídeos"
              value={data.purpose_share}
            />
            <DataRow
              label="Finalidade: Ver vídeos curtos"
              value={data.purpose_watch}
            />
            <DataRow
              label="Finalidade: Buscar informações"
              value={data.purpose_search}
            />
          </dl>
        </div>
      </div>
    </Modal>
  );
};
