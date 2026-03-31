# Plano de Implementação: Campos Sociodemográficos Órfãos na Exportação Excel

**Data:** 31/03/2026
**Feature:** Exportação de Dados
**Objetivo:** Garantir que todas as informações coletadas durante o formulário sociodemográfico no *Onboarding* sejam fielmente replicadas na aba "Participantes" do relatório exportado em Excel (`.xlsx`), para fins de análise estatística.

---

## 1. Contexto e Problema
Atualmente, apenas as informações iniciais e demográficas básicas (Idade, Estado, Gênero, Estado Civil, Escolaridade, Ocupação e Renda Mensal) do questionário de Onboarding estão mapeadas. O mapeamento deixa de fora quase metade do questionário que avalia critérios de eliminação ou correlação clínica (saúde mental, uso de medicamentos) e de perfil de uso cibernético (quais redes usa, propósitos e horários).

Os dados estão sendo salvos corretamente no Firebase sob o objeto `sociodemographicData`, mas ignorados pelo front-end na hora da extração.

---

## 2. Novos Campos a Serem Incluídos

Os campos faltantes serão incluídos em `exportTypes.ts` (na interface `ParticipantRow`) recebendo tratativas default (`"N/A"`) para impedir falhas em contas antigas:

**Sessão de Saúde:**
- `Medicação Contínua`: string
- `Detalhes Medicação`: string
- `Diagnóstico Saúde Mental`: string
- `Detalhes Diagnóstico`: string

**Sessão de Uso Digital:**
- `Plataformas Mais Usadas`: (Array extraído para string unificada separada por vírgula)
- `Outras Plataformas`: string
- `Período de Uso`: string
- `Tempo de Uso Diário`: string
- `Propósito (Conversar)`: string
- `Propósito (Compartilhar)`: string
- `Propósito (Assistir)`: string
- `Propósito (Pesquisar)`: string

---

## 3. Guia de Alterações no Código

### Passo 1: Atualizar Tipagem (`src/utils/exportTypes.ts`)
* Adicionar as chaves correspondentes aos novos campos na interface `ParticipantRow` para que a biblioteca `xlsx` saiba montar o cabeçalho.

### Passo 2: Atualizar Montagem de Linha (`src/utils/excelExporter.ts`)
* Na função `buildParticipantsSheet`, modificar o `map(user => ...)` para acomodar:
  ```typescript
  "Medicação Contínua": sd?.continuousMedication ?? "N/A",
  "Detalhes Medicação": sd?.medicationDetails ?? "N/A",
  "Diagnóstico Saúde Mental": sd?.healthDiagnosis ?? "N/A",
  // ... e assim por diante
  ```
* **Tratamento Especial:** `sd?.platforms` é do tipo `string[]`. Fazer um join por vírgulas para a exportação Excel:
  ```typescript
  "Plataformas Mais Usadas": sd?.platforms ? sd.platforms.join(", ") : "N/A",
  ```

---

## 4. Passos de Validação (TDD GSD)
1. Abrir o app no Painel Administrativo com usuário admin.
2. Rodar a exportação do arquivo Excel.
3. Abrir o arquivo `dados_estudo_enigma_YYYY-MM-DD.xlsx`.
4. Ir até a aba "Participantes" e buscar pelas colunas inseridas. Validar se os dados estão condizentes com o Mock existente ou com o banco de dados.
