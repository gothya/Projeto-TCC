# Relatório de Implementação e Reestruturação: Aba de Tutoriais (Landing Page)

Este relatório detalha a nova arquitetura de informação e estrutura de componentes para a seção de tutoriais na Landing Page do Psylogos (`PsyTutorials.tsx` e `PsyTutorialMap.tsx`), focando na integração de uma nova **Série de Tutoriais em Vídeo** para facilitar o Onboarding dos participantes.

---

## 📅 Nova Estrutura da Página "Como Responder"

A página será reorganizada em uma sequência lógica que espelha a exata jornada do participante, mesclando **vídeos explicativos** práticos com o material **escrito e imagético** de apoio.

### 📍 Cabeçalho
- **Título da página:** "Como Responder"

### 📍 Passo 1: Primeiro Acesso
Foco em ensinar o participante a configurar sua conta e entender o RCLE.
- **Vídeo Explicativo:** Demonstração visual de como navegar no primeiro acesso.
- **Apoio Escrito/Visual:** Exibição dos **Cards Explicativos** atuais (RCLE, Apelido, Perfil, Dashboard) logo abaixo do vídeo.

### 📍 Passo 2: O SAM e o PANAS
Fusão das antigas seções separadas de SAM e PANAS em uma experiência unificada sobre *Estado Emocional*.
- **Vídeo Explicativo:** Vídeo geral instruindo como preencher o SAM e o PANAS (link já informado previamente).
- **Apoio Escrito/Visual:** 
  - Subseção do SAM (escalas de Valência, Ativação e Dominância).
  - Subseção do PANAS com a explicação das 20 palavras e horários de notificação temporizados.

### 📍 Passo 3: Registro de Tempo de Tela
Ensina o principal ponto de fricção técnica da pesquisa: a extração correta dos dados do celular.
- **Vídeo Explicativo:** Preenchimento do tempo de tela na prática.
  - *Link inserido:* [Assista aqui](https://youtu.be/McoepjtjJtY)
- **Apoio Escrito/Visual:**
  - Tutorial em layout Snake (Cobrinha) / Carrossel com as 12 telas guiando como recuperar a informação nas configurações do celular.
  - **Destaque:** Card de *Dica de Configuração de Alarmes* (sugestão de alarmes fixos: 11h, 15h, 19h) para maximizar o número de pings respondidos.

### 📍 Fluxo Diário Resumido
Mantém o card visual com as 'arrows' (setas) demonstrando a rotina do participante (Notificação → SAM → PANAS) e a diferença do Ping Estrela das 21h (SAM + PANAS + Tempo de Tela).

### 📍 Passo 4: Relatório de Jornada (Nova Seção)
Orienta como o participante desbloqueia o seu relatório final, que é a recompensa chave da gamificação.
- **Vídeo Explicativo:** Demonstração de como visualizar e interpretar o Relatório de Jornada (vídeo será fornecido posteriormente, usaremos placeholder).
- **Quadro Explicativo (Ajuste Crítico):** 
  - Retirar a referência ao limite de "2700xp".
  - Trocar por um visual indicativo de "Cadeado" 🔒 contendo a regra: **"3+ registros de tempo de tela"** para a liberação do relatório.

---

## 🛠 Plano de Refatoração no Código

Para realizar essa alteração na _Landing Page_, as seguintes etapas de componentização serão adotadas:

1. **`PsyTutorials.tsx` (Componente Principal)**
   - Criar um novo componente wrapper de vídeo transparente (`<TutorialVideoBlock url="..." />`) com vidro-morfismo e aspect-ratio de 16:9, padrão nas seções.
   - Refatorar os "Bloco 2" e "Bloco 3" para que pertençam ao novo grupo estrutural "Passo 2", encabeçados pelo `<TutorialVideoBlock>`.
   - Incluir o vídeo de "Tempo de Tela" imediatamente acima da importação do componente `<PsyTutorialMap />`.
   - Adicionar o bloco "Passo 4 - Relatório de Jornada" ao fim do arquivo.
2. **Atualização de UI Cards**
   - No "Relatório de Jornada", construir o card do cadeado ("3+ registros de tempo de tela") com tratamento visual destacado, utilizando a paleta neon/pink existente na LP.

## ✅ Próximos Passos
Se este relatório e a ordem proposta refletem exatamente sua visão para a Landing Page, podemos dar início imediato à substituição do conteúdo de `PsyTutorials.tsx`.
