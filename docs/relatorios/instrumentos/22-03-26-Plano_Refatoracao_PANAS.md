# Plano de Refatoração do PANAS e Tabela de Transição

O objetivo deste plano é detalhar todas as frentes de impacto da troca das palavras do PANAS no código. A mudança não é apenas visual; as palavras funcionam como **chaves (`keys`)** no banco de dados para os dados já coletados.

---

## 1. Tabela de Transição

Mapeamento **1 para 1** (sem perda de dados, desde que tratado corretamente).

### Afetos Positivos (PA)
| Palavra Antiga (Legado) | Palavra Nova  | Status   |
|------------------------|---------------|----------|
| Animado                | Animado       | Mantido  |
| Entusiasmado           | Entusiasmado  | Mantido  |
| Inspirado              | Inspirado     | Mantido  |
| Orgulhoso              | Orgulhoso     | Mantido  |
| Determinado            | Determinado   | Mantido  |
| Forte                  | Forte         | Mantido  |
| Dinâmico               | Ativo         | Trocado  |
| Vigoroso               | Atento        | Trocado  |
| Amável                 | Alerta        | Trocado  |
| Apaixonado             | Interessado   | Trocado  |

### Afetos Negativos (NA)
| Palavra Antiga (Legado) | Palavra Nova   | Status   |
|------------------------|----------------|----------|
| Aflito                 | Aflito         | Mantido  |
| Angustiado             | Angustiado     | Mantido  |
| Perturbado             | Perturbado     | Mantido  |
| Incomodado             | Incomodado     | Mantido  |
| Irritado               | Irritado       | Mantido  |
| Rancoroso              | Culpado        | Trocado  |
| Amedrontado            | Amedrontado    | Mantido  |
| Nervoso                | Nervoso        | Mantido  |
| Inquieto               | Inquieto       | Mantido  |
| Humilhado              | Envergonhado   | Trocado  |

**Resumo:** 6 PA mantidos + 4 trocados; 8 NA mantidos + 2 trocados.

---

## 2. Decisão Arquitetural

**Estratégia adotada: Mapeamento em Memória (PANAS_MIGRATION_MAP)**

- O dado bruto no Firestore **não é alterado** — garantia de rollback total.
- Um dicionário de tradução (`PANAS_MIGRATION_MAP`) converte chaves legadas para as novas em tempo de execução, antes de qualquer cálculo ou exportação.
- Dashboard, relatório do participante e exportação Excel operam apenas com as 20 chaves novas.

---

## 3. Ordem de Execução (Implementada)

A ordem abaixo evita janelas de inconsistência — a fonte de verdade é atualizada primeiro, depois os consumidores:

| # | Arquivo | Ação |
|---|---------|------|
| 1 | `src/constants/panas.ts` | Atualiza `POSITIVE_ITEMS` e `NEGATIVE_ITEMS`; adiciona `PANAS_MIGRATION_MAP` |
| 2 | `src/components/data/PanasItems.tsx` | Deriva a lista do formulário das constantes (`.sort()`) — elimina duplicação |
| 3 | `src/utils/ReportGeneratorUtils.ts` | Exporta `normalizePanasResponse()`; aplica no cálculo do relatório do participante |
| 4 | `src/utils/adminStats.ts` | Importa e aplica `normalizePanasResponse()` nos dois loops de cálculo global |
| 5 | `src/utils/excelExporter.ts` | Aplica `normalizePanasResponse()` antes de preencher as colunas PANAS |
| 6 | `src/components/screen/AdminDashboardScreen.tsx` | Remove listas hardcodadas locais; importa das constantes + aplica normalização |

> **Nota sobre o Excel:** os nomes das colunas mudam de `POS_Dinâmico → POS_Ativo`, etc. Planilhas exportadas antes da migração têm nomes de colunas diferentes das novas. Planilhas exportadas após a migração refletem as novas palavras, mesmo para dados históricos. Comunicar ao orientador antes de exportar definitivamente.

> **Rollback:** como o Firestore mantém os dados brutos intactos, basta remover `PANAS_MIGRATION_MAP` e reverter as constantes para restaurar o comportamento anterior.

---

## 4. Arquivos Sem Mudanças Necessárias

| Arquivo | Motivo |
|---------|--------|
| `src/components/PANASComponent.tsx` | Itera sobre `PANAS_ITEMS` — atualiza automaticamente |
| `src/components/modal/ParticipantReportModal.tsx` | Consome totais calculados pelas utils — transparente |
| `src/utils/ReportTestScenarios.ts` | Já importa de `POSITIVE_ITEMS`/`NEGATIVE_ITEMS` — atualiza automaticamente |

---

## 5. Checklist de Verificação

- [ ] Formulário PANAS exibe as 20 novas palavras
- [ ] Relatório do participante calcula PA/NA com as novas chaves (incluindo dados históricos)
- [ ] Dashboard admin exibe médias corretas para participantes com dados antigos e novos
- [ ] Excel exportado contém colunas com os novos nomes e valores históricos corretamente migrados
- [ ] Nenhuma referência às palavras antigas (Dinâmico, Vigoroso, Amável, Apaixonado, Rancoroso, Humilhado) na UI

---

*Implementado: Março 2026*
