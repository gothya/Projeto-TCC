# Dossiê do Projeto: Psylogos - Enigma da Mente

**Data:** 17 de Março de 2026  
**Autores/Pesquisadores:** Thiago & Orientadora  
**Contexto:** Trabalho de Conclusão de Curso (TCC)  

Este documento reúne todas as informações estruturais, metodológicas e conceituais do aplicativo imprescíndíveis para a modelagem da comunicação e do roteiro da Landing Page (VSL, seções de texto e CTAs).

---

## 1. Visão Geral e Propósito do Aplicativo
O **Psylogos: Enigma da Mente** é uma ferramenta de pesquisa acadêmica disfarçada de um ambiente interativo e gamificado. Seu principal objetivo é coletar dados em tempo real sobre a flutuação do estado emocional dos participantes e sua correlação com o uso de redes sociais, utilizando o método EMA.

**Por que gamificar?** Pesquisas longitudinais padrão sofrem com alta taxa de desistência. O Psylogos utiliza estética *dark/sci-fi*, mecânicas de RPG (níveis, XP) e recompensas ocultas para engajar o participante a concluir a jornada de 7 dias com consistência.

---

## 2. Metodologia: EMA (Ecological Momentary Assessment)
O aplicativo é fundamentado no EMA (Avaliação Ecológica Momentânea). Em vez de depender de questionários retrospectivos (onde a memória falha ou é enviesada), o EMA capta o estado psicológico do usuário no momento exato em que ele ocorre, em seu ambiente natural e associado a eventos do dia a dia (neste caso, o consumo de feed de redes sociais).

**Como funciona na prática:**
- O participante passa por uma **jornada contínua de 7 dias**.
- Ao longo do dia, o aplicativo envia notificações ("Pings") em janelas de tempo específicas.
- O participante tem **25 minutos** para responder cada ping. Se perder a janela, o ping é marcado como "perdido" (missed).
- Há **6 pings regulares** e **1 ping especial** de fim de dia ("Star Ping").

---

## 3. Instrumentos Psicométricos Utilizados
Os questionários disparados durante os pings são versões digitais de instrumentos psicométricos validados cientificamente:

### 3.1. SAM (Self-Assessment Manikin)
- **O que é:** Uma escala visual e não-verbal que mede a resposta afetiva do indivíduo de forma rápida e intuitiva.
- **O que avalia no app:** A valência da emoção no momento presente (ex: escala de 1 a 9, onde 1 é tristeza/desconforto e 9 é alegria/euforia).
- **Vantagem:** Muito rápido de responder (apenas um toque), ideal para o formato de notificações intermitentes.

### 3.2. Contextualização de Feed
- Uma pergunta coringa e crucial para a pesquisa: *"Você estava assistindo a vídeos (feed) nos últimos 5 minutos?"* 
- Isso isola o estímulo das redes sociais para a análise de dados.

### 3.3. PANAS (Positive and Negative Affect Schedule)
- **O que é:** Uma escala de Afetos Positivos e Negativos. 
- **O que avalia no app:** 
  - **Modo Contextual (Pings Regulares):** Como o usuário se sentiu nos últimos 5 minutos (com foco na experiência durante o uso de redes sociais, se aplicável).
  - **Modo Diário (Último Ping do Dia):** Um balanço geral de como o indivíduo se sentiu durante todo o seu dia.

### 3.4. Relatório de Fim de Dia (End of Day Log)
- Exclusivo do 7º ping ("Star Ping") de cada dia.
- Coleta métricas de fechamento: **Qualidade do Sono**, presença de **Eventos Estressantes** e as **Horas e Minutos exatos de uso de Redes Sociais** (Screen Time do celular).

---

## 4. O Sistema de Gamificação
A espinha dorsal de retenção do Psylogos. Tudo gira em torno de recompensar o engajamento imediato.

- **XP Misto:** Pings regulares dão 50 pontos; o ping de estrela dá 100 pontos.
- **Leveling:** Limiares de XP fazem o usuário subir de "Nível", dando uma sensação de familiaridade e progresso constante.
- **Social (Leaderboard):** Uma aba onde o participante vê um ranking com os nicknames dos outros participantes e seus respectivos pontos. A competição saudável estimula a resposta aos pings.
- **Conquistas:** Badges visuais destravados de acordo com o desempenho e a consistência.

---

## 5. A Grande Recompensa (O "Hook" da Pesquisa)
Para encorajar os usuários a irem até o fim da jornada, além da XP, há um forte gatilho de curiosidade e benefício real:

- **O Relatório Personalizado:** Ao atingir uma meta mínima viável de **21 respostas válidas**, o sistema desbloqueia a geração de um relatório dinâmico.
- **Valor para o Usuário:** Não é apenas um jogo; o usuário recebe de volta um mapeamento dos próprios padrões emocionais e de uso de tela, algo fascinante para quem busca autoconhecimento. Este é o argumento central (Call to Action) para as redes sociais.

---

## 6. Privacidade, Ética e Autenticação
- **TCLE:** Tudo ocorre perante o Termo de Consentimento Livre e Esclarecido.
- **Anonimização:** Os usuários recebem códigos de acesso ou Firebase IDs anônimos e um "Nickname" escolhido por eles, garantindo a proteção da identidade na pesquisa.
- **Segurança:** O banco de dados no Firestore isola as informações e a comunicação via push notifications é autorizada previamente pelo usuário na instalação do PWA.

---

## 7. Sumário Estrutural Visual (A Vibe)
- Tonalidade: Introspectiva, focada na "mente" (Enigma da Mente).
- Componentização: Escura, botões neon, fontes limpas, modais com "vidro fosco" (backdrop-blur). A landing page replicará essa matriz visual para que haja zero atrito entre ver o vídeo institucional e abrir o aplicativo pela primeira vez.
