import React, { useState } from "react";
import { SociodemographicData } from "../data/SocialDemographicData";
import { Modal } from "../modal/Modal";
import { SociodemographicQuestionnaireScreen } from "../screen/SociodemographicQuestionnaireScreen";

export const SociodemographicModal: React.FC<{
  onClose: () => void;
  data: SociodemographicData;
  nickname: string;
  onSaveNickname: (newNickname: string) => Promise<void>;
  onSaveSocio: (newData: SociodemographicData) => Promise<void>;
}> = ({ onClose, data, nickname, onSaveNickname, onSaveSocio }) => {
  const [activeTab, setActiveTab] = useState<"socio" | "nickname">("socio");
  const [isEditingSocio, setIsEditingSocio] = useState(false);
  const [isEditingNickname, setIsEditingNickname] = useState(false);
  
  const [newNickname, setNewNickname] = useState(nickname);
  const [isSaving, setIsSaving] = useState(false);

  const handleSaveNickname = async () => {
    if (newNickname.trim().length <= 2) return;
    setIsSaving(true);
    await onSaveNickname(newNickname);
    setIsSaving(false);
    setIsEditingNickname(false);
  };

  const handleSaveSocio = async (newData: any) => {
    setIsSaving(true);
    await onSaveSocio(newData);
    setIsSaving(false);
    setIsEditingSocio(false);
  };

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
        <h2 className="text-2xl font-bold text-cyan-400 text-center mb-6">
          Meus Dados
        </h2>

        {/* Tabs */}
        <div className="flex justify-center space-x-4 mb-6 border-b border-cyan-400/30 pb-2">
          <button
            onClick={() => setActiveTab("socio")}
            className={`px-4 py-2 font-semibold transition-colors ${
              activeTab === "socio"
                ? "text-cyan-400 border-b-2 border-cyan-400"
                : "text-gray-400 hover:text-cyan-200"
            }`}
          >
            Sociodemográficos
          </button>
          <button
            onClick={() => setActiveTab("nickname")}
            className={`px-4 py-2 font-semibold transition-colors ${
              activeTab === "nickname"
                ? "text-cyan-400 border-b-2 border-cyan-400"
                : "text-gray-400 hover:text-cyan-200"
            }`}
          >
            Nickname
          </button>
        </div>

        <div className="h-[450px] overflow-y-auto overflow-x-hidden p-2">
          {activeTab === "nickname" && (
            <div className="flex flex-col items-center justify-center h-full space-y-6">
              {!isEditingNickname ? (
                <>
                  <div className="text-center space-y-2">
                    <p className="text-sm text-cyan-300">Seu Pseudônimo Atual</p>
                    <p className="text-3xl font-bold text-white tracking-wider">
                      {nickname}
                    </p>
                  </div>
                  <button
                    onClick={() => setIsEditingNickname(true)}
                    className="px-6 py-2 border border-cyan-400 text-cyan-400 rounded-lg hover:bg-cyan-400/10 transition-colors flex items-center space-x-2"
                  >
                    Editar Nickname
                  </button>
                </>
              ) : (
                <div className="w-full max-w-sm space-y-4 text-center">
                  <p className="text-gray-300 text-sm mb-4">
                    Escolha um apelido único que será usado no ranking e para sua identificação anônima.
                  </p>
                  <input
                    type="text"
                    value={newNickname}
                    onChange={(e) => setNewNickname(e.target.value)}
                    placeholder="Digite seu nickname"
                    className="w-full px-4 py-2 text-center text-white bg-slate-800 border-b-2 border-cyan-400 focus:outline-none focus:border-cyan-300 transition-all rounded-t-md"
                  />
                  <div className="flex space-x-4 justify-center pt-4">
                    <button
                      onClick={() => {
                        setNewNickname(nickname);
                        setIsEditingNickname(false);
                      }}
                      className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
                      disabled={isSaving}
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handleSaveNickname}
                      disabled={newNickname.trim().length <= 2 || isSaving}
                      className="px-6 py-2 bg-cyan-400 text-brand-dark font-bold rounded-lg hover:bg-cyan-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSaving ? "Salvando..." : "Salvar"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === "socio" && (
            <div className="relative h-full">
              {!isEditingSocio ? (
                <div className="h-full flex flex-col">
                  <div className="flex justify-end mb-4">
                    <button
                      onClick={() => setIsEditingSocio(true)}
                      className="text-sm px-4 py-1.5 border border-cyan-400 text-cyan-400 rounded-lg hover:bg-cyan-400/10 transition-colors"
                    >
                      Editar Dados
                    </button>
                  </div>
                  <div className="flex-1 overflow-y-auto p-4 border border-cyan-400/30 rounded-lg bg-black/20 text-gray-300 text-sm">
                    <dl>
                      <DataRow label="Idade" value={`${data.age} anos`} />
                      <DataRow label="Estado (UF)" value={data.state} />
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
              ) : (
                <div className="relative">
                   <div className="absolute top-0 right-0 z-50">
                    <button
                      onClick={() => setIsEditingSocio(false)}
                      className="text-gray-400 hover:text-white bg-slate-900 border border-gray-600 px-3 py-1 rounded-md text-sm"
                      disabled={isSaving}
                    >
                       Cancelar Edição
                    </button>
                   </div>
                   {/* We wrap the questionnaire to adjust its internal styling if needed, or just render it */}
                   <div className="scale-90 origin-top -mt-8">
                     <SociodemographicQuestionnaireScreen 
                        initialData={data as any} 
                        onComplete={handleSaveSocio} 
                     />
                   </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};
