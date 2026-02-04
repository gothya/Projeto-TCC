# Product Requirements Document (PRD) - Psylogos: O Enigma do Coração

## 1. Visão Geral do Produto
**Psylogos** é uma aplicação web progressiva (PWA) gamificada destinada à pesquisa científica. O objetivo é coletar dados via Avaliação Ecológica Momentânea (EMA) sobre estados emocionais e hábitos de consumo de vídeos curtos.

## 2. Personas e Usuários
*   **Participante (User)**: O usuário final que participa do estudo de 7 dias. Busca autoconhecimento e recompensas (gamificação).
*   **Pesquisador (Admin)**: O administrador que monitora o progresso, visualiza dados agregados e gerencia o estudo.

## 3. Funcionalidades Principais

### 3.1. Experiência do Participante (Mobile-First)
*   **Onboarding**:
    *   Coleta de apelido e dados sociodemográficos básicos.
    *   Tutorial introdutório sobre a missão.
*   **Dashboard do Usuário**:
    *   Visualização de progresso ("Jornada de 7 Dias").
    *   Feedback visual de "Streak" (dias consecutivos).
    *   Avatar dinâmico (com base no nível/progresso).
*   **Coleta de Dados (Check-in Diário)**:
    *   **Escala SAM (Self-Assessment Manikin)**: Avaliação visual de Prazer, Ativação e Dominância.
    *   **Escala PANAS**: Avaliação de afeto positivo e negativo.
    *   **Questionário de Uso de Vídeos**: Perguntas sobre tempo de tela e sentimentos associados a apps como TikTok/Reels.
*   **Gamificação**:
    *   **Badges (Troféus)**: Conquistas desbloqueáveis (ex: "Pontualidade", "Streak Semanal").
    *   **Feedback Visual**: Animações e sons ao completar tarefas.
    *   **Termômetro de Tela**: Feedback visual sobre o tempo de uso relatado.

### 3.2. Painel Administrativo
*   **Autenticação**: Login seguro para pesquisadores.
*   **Visão Geral**:
    *   Métricas globais (Total de participantes, Taxa de Retenção).
    *   Gráficos de aderência diária.
*   **Gerenciamento de Dados**:
    *   Visualização detalhada por participante.
    *   Exportação de dados (potencialmente CSV/JSON).

## 4. Requisitos Técnicos

### 4.1. Stack Tecnológica
*   **Frontend**: React (Vite), TypeScript.
*   **Estilização**: Tailwind CSS (Foco em tema escuro/neon "Cyberpunk/Sci-Fi").
*   **Backend/BaaS**: Firebase (Firestore, Auth).
*   **Hospedagem**: Vercel.

### 4.2. Segurança e Privacidade
*   **Autenticação Anônima**: Participantes usam login anônimo do Firebase para reduzir atrito.
*   **Regras de Firestore**: Apenas Admins leem todos os dados; Usuários leem/escrevem apenas seus próprios dados.

## 5. Design System
*   **Estética**: "Enigma da Mente", tons escuros (Brand Dark), Ciano/Neon (Brand Blue) para destaque.
*   **Interatividade**: Micro-interações, transições suaves (Framer Motion ou CSS animations).

## 6. Métricas de Sucesso do Projeto
*   Taxa de retenção de 7 dias > 80%.
*   Consistência no preenchimento dos formulários diários.
*   Usabilidade (facilidade de uso reportada).
