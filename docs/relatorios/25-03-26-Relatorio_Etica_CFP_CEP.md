# Relatório de Conformidade Ética e Profissional (Psicologia)

**Data da análise:** 2026-03-24
**Referências Base:**
- Resolução CNS nº 466/2012 (Diretrizes e Normas Regulamentadoras de Pesquisas Envolvendo Seres Humanos)
- Resolução CNS nº 510/2016 (Pesquisas em Ciências Humanas e Sociais)
- Resolução CFP nº 09/2024 (Regulamenta o exercício profissional da Psicologia mediado por TDICs)
- Código de Ética Profissional do Psicólogo (CEPP)

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

## 3. Diretrizes Profissionais da Psicologia (CFP Res. 09/2024)

### A. Instrumentalização via Tecnologias Digitais (TDICs)
- **O que a Resolução exige:** O psicólogo/pesquisador é responsável por garantir infraestrutura segura para proteger o sigilo e segurança, além do rastreio apenas de instrumentos válidos ao uso online.
- **Como o projeto aplica:**
  - **Uso do PANAS/SAM:** Tratando-se de inventários e avaliações de autorrelato para pesquisa acadêmica (e não uso privativo restrito para laudos), eles podem ser administrados virtualmente. Sugere-se referenciar suas validações nacionais em ambiente online no texto do TCC.
  - **Sigilo de Dados (Firestore Security Rules):** O relatório de segurança anterior comprovou e consertou regras no banco de dados. Os dados em `/participantes/{userId}` são rigorosamente bloqueados: um participante não tem permissão de leitura sobre a linha de tempo emocional ou identificadores de qualquer outro participante.

---

## 4. Recomendações e Pontos de Melhoria (Débitos Éticos)

Apesar da alta conformidade arquitetônica, levantamos melhorias simples que blindam a integridade da pesquisa:

**1. Botão de Exclusão de Conta / Revogação de Consentimento Automatizada**
- *Problema:* O RCLE garante que o participante pode "*se retirar da pesquisa a qualquer momento e solicitar a exclusão dos dados*". No momento atual, isso requer que ele envie ativamente um e-mail ao pesquisador.
- *Solução Ética-Técnica (Sugerida):* Implementar dentro da tab de Perfil/Configurações um botão direto **"Desistir da Pesquisa e Excluir Meus Dados"**. Isso devolve a autonomia máxima ao participante, em estrita conformidade com a LGPD e CNS 510/2016, executando a exclusão de seu `document` no Firestore via Cloud Function.

**2. Acesso Contínuo ao RCLE e Contato do CEP**
- *Problema:* O termo só é exibido na primeira tela e o participante pode não tirar *print*.
- *Solução:* Incluir na mesma tab do aplicativo de "Configurações Globais" um botão secundário: **"Ver Termos e Contatos do Comitê de Ética"** repassando o componente `RcleModal.tsx`.

**3. Tratamento de Vulnerabilidade Emocional Severa (Alerta)**
- *Problema:* As aplicações de Psicologia guiadas por TDICs exigem que o ambiente virtual contemple situações de vulnerabilidade.
- *Solução (Sugestão Clínica):* Durante a análise cruzada do PANAS, caso o sistema detecte persistente carga extrema no afeto negativo (`negativeScore`) atrelada ao baixo bem-estar pelos 7 dias, a tela de encerramento do estudo poderia apresentar uma notificação amigável com contatos como o **CVV (Centro de Valorização da Vida - Ligação 188)** ou rede de apoio, exercendo a beneficência fundamental e o papel social da psicologia em contextos digitais.

---

## Conclusão Geral do Laudo

O repositório do aplicativo encontra-se apto e segue estritamente as prerrogativas do *Consentimento Eletrônico*, *Segurança do Sigilo Digital em nuvem (Security Rules implementadas)* e *Desidentificação de sujeito em pesquisas humanas (Pseudônimo / UIDs)*, não incorrendo em falta frente ao CEP, CFP, nem no que tange o armazenamento previsto na LGPD. O software reflete as boas práticas acadêmicas listadas nos Conselhos representativos.
