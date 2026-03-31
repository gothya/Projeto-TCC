# Plano de Implementação: Melhoria na Análise de Tempo de Tela

**Data:** 31/03/2026
**Feature:** Tempo de Tela / Painel do Pesquisador

## Objetivo
Expandir a capacidade analítica do Painel do Pesquisador (AdminDashboard), permitindo visualizar não apenas as médias gerais consolidadas, mas o **comportamento diário detalhado** de Uso de Telas/Smartphones de um participante específico.

---

## 🏗️ Proposta de Dashboard / Interface

Modificaremos a visualização focada no participante para incluir uma nova listagem cronológica logo abaixo dos quadros de "Resumo".

### 1. Novo Componente: Histórico Descritivo de Telas
- Ao selecionar um participante (`selectedUser`), mapearemos e ordenaremos o array `selectedUser.dailyScreenTimeLogs` (do mais recente para o mais antigo).
- Criaremos uma seção estilo "Timeline" ou "Cards Expandíveis" onde cada item representará um **Dia Registrado** (baseado no atributo `date`).

### 2. Detalhamento por Dia Renderizado
Cada Card ou Linha de Acordeão mostrará:
- **Header (Resumo do Dia):** 
  - A Data da resposta (ex: `29/03/2026`).
  - O **Tempo Total daquele dia** agregado (ex: `3h 45m`).
- **Corpo (Breakdown):** 
  - Uma quebra descritiva listando cada plataforma daquele dia e suas inserções exatas. Exemplo:
    - `Instagram`: 2h 00m
    - `TikTok`: 1h 30m
    - `Outros (WhatsApp)`: 0h 15m

### 3. Técnicas Utilizadas
- Reutilizaremos a utilitária matemática já existente `parseDurationMinutes(entry)` proveniente de `screenTimeUtils.ts` para agregar precisamente a duração de cada entrada, unificar e formatar novamente no padrão legível `h m`.
- Caso o participante selecionado não possua inserções válidas em `dailyScreenTimeLogs`, exibiremos um placeholder amigável como *"Nenhum registro de tela detalhado concluído por este participante"*.

---

## ❓ Questões em Aberto e Definições de Regra de Negócio

1. **Alertas Visuais:** Devemos incluir um feedback de cor (ex: card vermelho/quente) caso o somatório das horas daquele dia individual ultrapasse um certo limite agressivo (como a média nacional de 4h)?

---

## ✅ Plano de Verificação (QA)

Após a implementação, a validação consistirá em:
1. **Acessar** o Painel Administrativo.
2. **Selecionar** um usuário com dados preenchidos de múltiplos fluxos (usuário simulado via testes ou contas ativas).
3. Entrar na seção de visualização detalhada e olhar o novo **Histórico de Tempo de Tela**.
4. Validar se a quantidade de relatórios diários de tela "bate" visualmente com a quantidade diária preenchida no Firestore e se a conversão de horas/minutos está isenta de bugs matemáticos.
