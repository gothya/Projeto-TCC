# Relatório de Conformidade Ética e Profissional (Psicologia)

**Data da análise:** 2026-03-25
**Referências Base:**
- Resolução CNS nº 466/2012 (Diretrizes e Normas Regulamentadoras de Pesquisas Envolvendo Seres Humanos)
- Resolução CNS nº 510/2016 (Pesquisas em Ciências Humanas e Sociais)
- Resolução CFP nº 09/2024 (Regulamenta o exercício profissional da Psicologia mediado por TDICs)
- Código de Ética Profissional do Psicólogo (CEPP)
- Lei Geral de Proteção de Dados (LGPD — Lei nº 13.709/2018)

---

## 1. Escopo e Concordância Geral

O projeto consiste na criação de um aplicativo gamificado para investigar a relação entre o tempo de tela em vídeos curtos e a variabilidade emocional, aferida pelas escalas PANAS e SAM ao longo de 7 dias.

Considerando os parâmetros do Conselho de Ética em Pesquisa (CEP/CONEP) aplicados às Ciências Humanas e Sociais, e as diretrizes do Conselho Federal de Psicologia (CFP) para uso de tecnologias de informação (TDICs), **o projeto apresenta um ALTO GRAU DE CONFORMIDADE ÉTICA em sua arquitetura base**.

Abaixo são detalhados como cada pilar ético está refletido no código e funcionamento atual do aplicativo.

## 2. Parâmetros Éticos do CEP / CONEP (Res. 510/2016)

### A. Termo de Consentimento (RCLE / TCLE)
- **O que a Resolução exige:** Acesso prévio, claro, em linguagem acessível e consentimento voluntário e manifesto (Art. 8º da CNS 510/2016 permite registro de consentimento em formato digital/eletrônico).
- **Como o projeto aplica:**
  - Existe um componente dedicado (`ConsentScreen.tsx`) que atua como barreira impeditiva para o onboarding.
  - O texto (`RCLE_TEXT`) detalha o objetivo do estudo, autoria (UniCEUB), contato do pesquisador e do Comitê de Ética.
  - **Ação do Usuário:** Para avançar, o usuário deve obrigatoriamente marcar a caixa ("Li e concordo com os termos") habilitando o botão "Continuar". Essa dupla checagem na UI garante o consentimento explícito.
  - **Acesso Contínuo:** O RCLE está disponível permanentemente no menu do participante ("Ver Termos"), acessível a qualquer momento durante toda a jornada via `RcleModal.tsx`. ✅

### B. Proteção do Anonimato e Identidade
- **O que a Resolução exige:** Garantia de que a identidade do participante não seja revelada sob nenhuma hipótese nos resultados da pesquisa (Art. 15 da CNS 510/2016).
- **Como o projeto aplica:**
  - O onboarding exige a criação de um **Pseudônimo (Nickname)** único no step 2 da `OnboardingScreen.tsx`.
  - Esse nickname assegura que o nome real do participante não transacione no sistema de ranking.
  - A autenticação cria um identificador único alfanumérico ininteligível (UID) gerado pelo Firebase no backend, desassociando o perfil das respostas diretas caso os dados sejam exportados em CSV.

### C. Beneficência e Não-Maleficência (Riscos)
- **O que a Resolução exige:** Avaliação e controle dos riscos da participação.
- **Como o projeto aplica:**
  - O texto do RCLE menciona o "desconforto ao responder perguntas" como risco mínimo e estabelece os contatos para reporte de dano.
  - O aplicativo não induz a emoção artificialmente de forma maligna, apenas atua como Diário Eletrônico / Avaliação Ecológica Momentânea (EMA).

### D. Direito de Retirada e Exclusão de Dados (LGPD / CNS 510/2016)
- **O que as Resoluções exigem:** O participante pode se retirar da pesquisa a qualquer momento e solicitar a exclusão integral de seus dados (Art. 15 da CNS 510/2016; Art. 18 da LGPD).
- **Como o projeto aplica:** ✅
  - Implementado o botão **"Excluir Participação"** diretamente no menu do participante (`ProfileMenu.tsx`).
  - Ao clicar, abre o `DeleteAccountModal.tsx` com fluxo de dupla confirmação: mensagem de alerta sobre irreversibilidade + campo de texto onde o participante deve digitar **EXCLUIR** para ativar o botão.
  - Ao confirmar, a Cloud Function `deleteParticipantAccount` (Firebase Functions) executa:
    1. Exclusão do documento em `participantes/{uid}` (respostas, progresso, perfil)
    2. Exclusão do documento em `reactionEvaluations/{uid}`
    3. Exclusão do documento em `publicMessages/{uid}` (mensagem pública, se existir)
    4. Exclusão da conta no Firebase Authentication
  - A exclusão é atomicamente delegada ao servidor via Admin SDK, contornando as regras de imutabilidade do Firestore client-side e garantindo remoção completa.

## 3. Diretrizes Profissionais da Psicologia (CFP Res. 09/2024)

### A. Instrumentalização via Tecnologias Digitais (TDICs)
- **O que a Resolução exige:** O psicólogo/pesquisador é responsável por garantir infraestrutura segura para proteger o sigilo e segurança, além do rastreio apenas de instrumentos válidos ao uso online.
- **Como o projeto aplica:**
  - **Uso do PANAS/SAM:** Tratando-se de inventários e avaliações de autorrelato para pesquisa acadêmica (e não uso privativo restrito para laudos), eles podem ser administrados virtualmente. Sugere-se referenciar suas validações nacionais em ambiente online no texto do TCC.
  - **Sigilo de Dados (Firestore Security Rules):** O relatório de segurança anterior comprovou e consertou regras no banco de dados. Os dados em `/participantes/{userId}` são rigorosamente bloqueados: um participante não tem permissão de leitura sobre a linha de tempo emocional ou identificadores de qualquer outro participante.

### B. Publicação Voluntária de Mensagem — Exceção Consentida ao Anonimato
- **O que a Resolução exige:** Qualquer divulgação pública de dados do participante exige consentimento específico e informado.
- **Como o projeto aplica:**
  - Ao final da jornada, o campo "freeComment" da Avaliação de Reação permite que o participante deixe uma mensagem opcional de incentivo a futuros participantes, assinada pelo seu nickname.
  - O campo é **visualmente destacado** no app com aviso explícito: *"Sua mensagem será publicada no site do Psylogos com sua assinatura como explorador."*
  - O preenchimento é **totalmente opcional** — a avaliação pode ser concluída sem preencher o campo.
  - A identidade real permanece protegida: apenas o pseudônimo escolhido pelo próprio participante é exibido publicamente.
  - **Status atual:** A exibição pública das mensagens no site está implementada mas não ativada (mantida invisível até decisão final sobre divulgação). A coleta e armazenamento já estão operacionais para revisão interna.
  - O RCLE deve ser atualizado para mencionar explicitamente essa possibilidade de publicação voluntária antes do início da coleta de dados.

---

## 4. Recomendações e Status de Implementação

| # | Recomendação | Status |
|---|---|---|
| 1 | Botão de exclusão de conta / revogação de consentimento | ✅ Implementado |
| 2 | Acesso contínuo ao RCLE no menu do participante | ✅ Implementado |
| 3 | Alerta de vulnerabilidade emocional severa (CVV) na tela de encerramento | 🔲 Sugerido — pendente de avaliação da orientadora |
| 4 | Atualizar RCLE para mencionar publicação voluntária de mensagem | 🔲 Pendente — deve ser feito antes do início da coleta |

### Detalhamento dos Pendentes

**Recomendação 3 — Alerta de Vulnerabilidade Emocional**
- *Motivação:* As aplicações de Psicologia guiadas por TDICs exigem que o ambiente virtual contemple situações de vulnerabilidade.
- *Sugestão clínica:* Durante a análise cruzada do PANAS, caso o sistema detecte persistente carga extrema no afeto negativo (`negativeScore`) atrelada ao baixo bem-estar pelos 7 dias, a tela de encerramento do estudo poderia apresentar uma notificação amigável com contatos como o **CVV (Centro de Valorização da Vida — Ligação 188)** ou rede de apoio.

**Recomendação 4 — Atualização do RCLE**
- O campo de mensagem voluntária cria uma exceção consentida ao anonimato. O texto do RCLE precisa de um parágrafo adicional explicitando essa possibilidade, o caráter opcional e a forma de exibição (apenas o nickname), **antes do início oficial da coleta de dados**.

---

## Conclusão Geral do Laudo

O repositório do aplicativo encontra-se apto e segue estritamente as prerrogativas do *Consentimento Eletrônico*, *Segurança do Sigilo Digital em nuvem (Security Rules implementadas)*, *Desidentificação de sujeito em pesquisas humanas (Pseudônimo / UIDs)* e *Direito à Exclusão de Dados (LGPD / CNS 510/2016)*, não incorrendo em falta frente ao CEP, CFP, nem no que tange o armazenamento previsto na LGPD. O software reflete as boas práticas acadêmicas listadas nos Conselhos representativos.

As duas pendências remanescentes (Recomendações 3 e 4) não comprometem a coleta, mas devem ser resolvidas em alinhamento com a orientadora antes da abertura oficial para participantes.
