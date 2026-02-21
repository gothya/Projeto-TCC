import React from "react";
import { Modal } from "./Modal";

export const RCLE_TEXT = `Você está sendo convidado(a) a participar como voluntário(a) do estudo Associação longitudinal entre exposição a vídeos curtos e variabilidade emocional: moderação da valência e efeitos no humor diário, DESENVOLVIDO POR PESQUISADORES DO Centro de Ensino Unificado de Brasília (UniCEUB). O nome deste documento que você está lendo é Registro de Consentimento Livre e Esclarecido (RCLE) que visa assegurar seus direitos como participante.
Sua colaboração neste estudo será de muita importância para nós, mas se desistir a qualquer momento, isso não lhe causará prejuízo. Antes de decidir se deseja participar (de livre e espontânea vontade) você deverá ler e compreender todo o conteúdo.
A pesquisa tem como objetivo A pesquisa tem como objetivo investigar a relação entre o tempo de exposição a vídeos curtos em plataformas digitais e a variabilidade emocional, considerando a valência afetiva do conteúdo e seus efeitos sobre o humor diário. O estudo busca entender se e como o tempo de visualização de vídeos curtos e a polaridade afetiva do conteúdo podem influenciar a flutuação de emoções e o bem-estar diário dos adultos.
A participação dos envolvidos é essencial para coletar dados que permitirão uma análise precisa dessa relação, contribuindo para uma melhor compreensão dos impactos das redes sociais na saúde mental e na regulação emocional.
Sua participação consiste em utilizar um aplicativo gamificado por sete dias, respondendo a notificações periódicas que avaliarão seu estado emocional presente, a valência dos vídeos assistidos e seu humor diário, além de registrar o tempo de uso de redes sociais. O aplicativo também incluirá perguntas sociodemográficas e avaliação momentânea sobre a valência e a variabilidade emocional, registrando o tempo de tela e a ocorrência de eventos estressores e qualidade do sono. A participação é voluntária, anônima e os dados coletados serão utilizados exclusivamente para fins acadêmicos.
Este estudo possui riscos mínimos e incluem desconforto ao responder perguntas sobre valência emocional dos vídeos e a variação de emoções ao longo do dia. Para minimizar esses riscos, todas as respostas serão anônimas e armazenadas em plataformas seguras, seguindo as orientações da CONEP para pesquisas em ambientes virtuais. Além disso, os participantes podem interromper sua participação a qualquer momento e solicitar a exclusão de seus dados. Medidas de proteção, como o uso de plataformas seguras e o cumprimento da LGPD, serão adotadas para garantir a privacidade e segurança dos dados coletados.
Com sua participação nesta pesquisa você contribuirá para um melhor entendimento da relação entre o tempo de exposição a vídeos curtos, a valência afetiva dos conteúdos e a variabilidade emocional em adultos. Embora não haja benefícios diretos para os participantes, os resultados poderão gerar insights valiosos que ajudarão na compreensão dos impactos das mídias sociais na saúde mental e no bem-estar emocional, contribuindo para debates acadêmicos e propostas de intervenção mais informadas.
Sua participação é voluntária. Você não terá nenhum prejuízo se não quiser participar. Você poderá se retirar desta pesquisa a qualquer momento, bastando para isso entrar em contato com um dos pesquisadores responsáveis. Também deverá ser esclarecido quanto ao direito do participante de não responder qualquer uma das perguntas.
Conforme previsto pelas normas brasileiras de pesquisa com a participação de seres humanos, você não receberá nenhum tipo de compensação financeira pela sua participação neste estudo.
Seus dados serão manuseados somente pelos pesquisadores e não será permitido o acesso a outras pessoas. Os dados e instrumentos utilizados (por exemplo, fitas, entrevistas, questionários) ficarão guardados sob a responsabilidade de Thiago de Souza Ferreira Carneiro com a garantia de manutenção do sigilo e confidencialidade, e arquivados por um período de 5 anos; após esse tempo serão destruídos. Os resultados deste trabalho poderão ser apresentados em encontros ou revistas científicas. Entretanto, ele mostrará apenas os resultados obtidos como um todo, sem revelar seu nome, instituição a qual pertence ou qualquer informação que esteja relacionada com sua privacidade.
Se houver alguma dúvida referente aos objetivos, procedimentos e métodos utilizados nesta pesquisa, entre em contato com os pesquisadores responsáveis pelo e-mail thiagosdcarneiro@sempreceub.com ou pelo telefone (61) 99236-0330. Também, se houver alguma consideração ou dúvida referente aos aspectos éticos da pesquisa, entre em contato com o Comitê de Ética em Pesquisa do Centro Universitário de Brasília (CEP-UniCEUB), que aprovou esta pesquisa, pelo telefone 3966-1511 ou pelo e-mail cep.uniceub@uniceub.br. O horário de atendimento do CEP-UniCEUB é de segunda a quinta: 09h30 às 12h30 e 14h30 às 18h30. Também entre em contato para informar ocorrências irregulares ou danosas durante a sua participação no estudo.
O CEP é um grupo de profissionais de várias áreas do conhecimento e da comunidade, autônomo, de relevância pública, que tem o propósito de defender os interesses dos participantes da pesquisa em sua integridade e dignidade e de contribuir para o desenvolvimento da pesquisa dentro de padrões éticos.`;

export const RcleModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  return (
    <Modal onClose={onClose} className="max-w-2xl">
      <div className="p-8">
        <h2 className="text-2xl font-bold text-cyan-400 text-center mb-4">
          Registro de Consentimento Livre e Esclarecido
        </h2>
        <div className="h-96 overflow-y-auto p-4 border border-cyan-400/30 rounded-lg bg-black/20 text-gray-300 text-sm">
          <p className="whitespace-pre-wrap">{RCLE_TEXT}</p>
        </div>
      </div>
    </Modal>
  );
};
