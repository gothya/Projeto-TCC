# Plano de Implementação: Correções na Exportação e Tipo Sociodemográfico

**Data:** 31/03/2026
**Feature:** Exportação de Dados / Qualidade do Código

---

## Contexto

Auditoria do código identificou que o plano anterior (`31-03-26-Plano_Exportacao_Sociodemografico.md`) descrevia trabalho já implementado. No processo, três problemas reais foram encontrados no código atual que afetam integridade dos dados de pesquisa e manutenibilidade.

---

## Problemas a Corrigir

### Problema 1 — Label enganoso na aba Participantes do Excel

**Arquivo:** `src/utils/exportTypes.ts` (linha 56) e `src/utils/excelExporter.ts` (linha 236)

O formulário (Step 2) pergunta **"Diagnóstico de saúde física e/ou mental"**, mas a coluna exportada chama-se **"Diagnóstico Saúde Mental"** — omitindo "física". Um pesquisador que analise o Excel sem ver o formulário pode interpretar erroneamente que a coluna registra apenas diagnósticos psiquiátricos.

**Correção:** Renomear a chave para `"Diagnóstico Saúde Física/Mental"` nos dois arquivos.

---

### Problema 2 — `SociodemographicData` duplicado em 7 arquivos

**Arquivos afetados:**
- `src/components/data/SocialDemographicData.tsx` (definição canônica)
- `src/components/screen/SociodemographicQuestionnaireScreen.tsx` (cópia local)
- `src/components/steps/Step1.tsx` (cópia local)
- `src/components/steps/Step2.tsx` (cópia local)
- `src/components/steps/Step3.tsx` (cópia local)
- `src/components/steps/Step4.tsx` (cópia local)
- `src/components/steps/Step5.tsx` (cópia local)

O type está definido localmente em cada arquivo. Se um novo campo for adicionado ao type canônico, **nenhum erro de compilação avisa** que os outros 6 estão desatualizados — criando divergência silenciosa entre o que o formulário coleta, o que é salvo e o que é exportado.

**Correção:** Remover as 6 cópias locais e substituir por `import { SociodemographicData } from "@/src/components/data/SocialDemographicData"` em cada arquivo.

---

### Problema 3 — Exportação trava completamente quando não há respostas de pings

**Arquivo:** `src/utils/excelExporter.ts` (linhas 346–349)

```ts
const allResponses = flattenResponses(allUsers);
if (allResponses.length === 0) {
  return { success: false, recordCount: 0, message: "Nenhuma resposta encontrada para exportar." };
}
```

Se nenhum participante respondeu um ping ainda (início do estudo), a exportação aborta **antes de gerar qualquer aba** — incluindo a aba "Participantes" com todos os dados sociodemográficos coletados no onboarding. Pesquisador perde acesso aos dados cadastrais da amostra.

**Correção:** Separar o guard de `allResponses` da geração da aba Participantes. A aba Participantes deve sempre ser gerada enquanto houver usuários. As abas de respostas (SAM, PANAS, etc.) ficam com placeholder "Sem dados disponíveis" (comportamento já implementado em `addSheetToWorkbook`).

---

### Problema 4 — Mensagem de sucesso anuncia "5 abas" mas são 6

**Arquivo:** `src/utils/excelExporter.ts` (linha 365)

```ts
message: `...${totalRecords} registros em 5 abas.`
```

O workbook gera 6 abas: Participantes, SAM, PANAS, Tempo de Tela (EOD), Tempo de Tela (Diário), Co-variáveis. O hardcode `5 abas` é incorreto desde que a aba "Tempo de Tela (Diário)" foi adicionada.

**Correção:** Substituir `"5 abas"` por `"6 abas"` (ou calcular dinamicamente via contagem das abas adicionadas ao workbook).

---

## Guia de Implementação

### Passo 1 — Renomear label no exportTypes e excelExporter

**`src/utils/exportTypes.ts`:**
```ts
// ANTES
"Diagnóstico Saúde Mental": string;
// DEPOIS
"Diagnóstico Saúde Física/Mental": string;
```

**`src/utils/excelExporter.ts`:**
```ts
// ANTES
"Diagnóstico Saúde Mental": sd?.healthDiagnosis ?? "N/A",
// DEPOIS
"Diagnóstico Saúde Física/Mental": sd?.healthDiagnosis ?? "N/A",
```

> ⚠️ A chave é usada como cabeçalho da coluna Excel — alterar o nome em `exportTypes.ts` não cria type error, mas a chave deve ser idêntica nos dois arquivos.

---

### Passo 2 — Centralizar o type SociodemographicData

Em cada um dos 6 arquivos com cópia local, remover o bloco `type SociodemographicData = { ... }` e adicionar o import:

```ts
import { SociodemographicData } from "@/src/components/data/SocialDemographicData";
```

Arquivos a alterar:
1. `src/components/screen/SociodemographicQuestionnaireScreen.tsx`
2. `src/components/steps/Step1.tsx`
3. `src/components/steps/Step2.tsx`
4. `src/components/steps/Step3.tsx`
5. `src/components/steps/Step4.tsx`
6. `src/components/steps/Step5.tsx`

---

### Passo 3 — Corrigir o bloqueio da exportação

**`src/utils/excelExporter.ts`** — refatorar `exportToExcel`:

```ts
export function exportToExcel(allUsers: GameState[]): ExportResult {
  if (!allUsers || allUsers.length === 0) {
    return { success: false, recordCount: 0, message: "Nenhum dado disponível para exportar." };
  }

  // Removido o early-return de allResponses aqui.
  // buildWorkbook lida com respostas vazias graciosamente via addSheetToWorkbook.
  const { wb, sheets } = buildWorkbook(allUsers);

  const dateStr = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(wb, `dados_estudo_enigma_${dateStr}.xlsx`);

  const totalRecords =
    sheets.sam.length +
    sheets.panas.length +
    sheets.screenTime.length +
    sheets.covariables.length;

  return {
    success: true,
    recordCount: totalRecords,
    message: `Exportado com sucesso: ${sheets.participants.length} participantes e ${totalRecords} registros em 6 abas.`,
  };
}
```

---

## Plano de Verificação (QA)

1. **Problema 1:** Exportar o Excel e abrir a aba "Participantes". Confirmar que a coluna chama-se `"Diagnóstico Saúde Física/Mental"`.
2. **Problema 2:** Após remover as cópias locais, confirmar que o projeto compila sem erros TypeScript (`tsc --noEmit`).
3. **Problema 3:** Simular um banco com usuários que têm `responses: []` (nenhuma resposta de ping). Confirmar que a exportação gera o arquivo normalmente com a aba Participantes preenchida.
4. **Problema 4:** Verificar o toast de sucesso após exportação — deve dizer "6 abas".
