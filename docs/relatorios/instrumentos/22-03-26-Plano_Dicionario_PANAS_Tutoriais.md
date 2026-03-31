# Dicionário de Emoções do PANAS nos Tutoriais

## Objetivo
Inserir um dicionário visual com as 20 emoções do PANAS em dois contextos:
1. **App (mobile)** — `TutoriaisTab.tsx`, dentro do accordion "💬 O Formulário PANAS"
2. **Landing Page (desktop/mobile)** — `PsyTutorials.tsx`, dentro da seção do PANAS

---

## Dados Completos (Fonte Única)

O dicionário será centralizado em **`src/constants/panasDict.ts`** e consumido por ambos os contextos. Qualquer edição futura nas descrições acontece em um único lugar.

### Estrutura do tipo
```ts
export type EmotionEntry = {
  word: string;
  context: string;       // descrição acessível, linguagem não-técnica
  valence: "Positiva" | "Negativa";
  arousal: "Alta" | "Média-Alta" | "Média" | "Baixa";
  opposite: string;      // emoção contrária
};
```

### Afetos Positivos (PA)
| Emoção | Contexto emocional | Valência | Ativação | Emoção contrária |
|--------|-------------------|----------|----------|-----------------|
| Animado | Estado de energia e disposição positiva | Positiva | Alta | Apático |
| Entusiasmado | Motivação intensa para agir ou participar | Positiva | Alta | Desmotivado |
| Inspirado | Sensação de propósito, criatividade e significado | Positiva | Média | Desanimado |
| Orgulhoso | Satisfação com conquistas pessoais | Positiva | Média | Envergonhado |
| Determinado | Foco e persistência em objetivos | Positiva | Média-Alta | Indeciso |
| Forte | Sensação de capacidade e controle interno | Positiva | Média | Fraco |
| Ativo | Engajamento em ações, energia comportamental | Positiva | Alta | Inativo |
| Atento | Estado de foco e concentração | Positiva | Média | Distraído |
| Alerta | Vigilância e prontidão ao ambiente | Positiva | Média-Alta | Letárgico |
| Interessado | Curiosidade e envolvimento cognitivo/emocional | Positiva | Média | Desinteressado |

### Afetos Negativos (NA)
| Emoção | Contexto emocional | Valência | Ativação | Emoção contrária |
|--------|-------------------|----------|----------|-----------------|
| Aflito | Sofrimento emocional, sensação de sobrecarga | Negativa | Alta | Tranquilo |
| Angustiado | Desconforto emocional profundo e persistente | Negativa | Alta | Aliviado |
| Perturbado | Estado de abalo emocional ou confusão | Negativa | Média | Calmo |
| Incomodado | Irritação leve ou desconforto situacional | Negativa | Média | Confortável |
| Irritado | Reatividade emocional elevada, impaciência | Negativa | Média-Alta | Paciente |
| Culpado | Sensação de erro moral ou responsabilidade negativa | Negativa | Média | Inocente |
| Amedrontado | Medo diante de ameaça percebida | Negativa | Alta | Seguro |
| Nervoso | Ansiedade e tensão antecipatória | Negativa | Média-Alta | Relaxado |
| Inquieto | Ansiedade com componente físico (agitação) | Negativa | Alta | Calmo |
| Envergonhado | Avaliação negativa de si em contexto social | Negativa | Média | Orgulhoso |

---

## Decisões de Design

### Fonte de verdade única (obrigatório)
`src/constants/panasDict.ts` exporta os dados. Tanto `TutoriaisTab.tsx` quanto `PsyTutorials.tsx` importam desse arquivo. Nenhum dado de emoção é hardcodado em componente.

### App (TutoriaisTab.tsx)
- Posição: após a escala de resposta (1–5) e os cards de tipo de ping, ainda dentro do accordion PANAS
- Botão toggle "📖 Ver guia das emoções" — colapsado por padrão
- Animação: `grid-template-rows: 0fr → 1fr` (padrão do projeto — **não** usar `{open && ...}`)
- Layout: lista vertical com separador PA/NA; cada linha mostra `Emoção`, `Contexto`, `Ativação` e `Oposta`
- Header PA em ciano (`#22d3ee`), header NA em rosa (`#f472b6`)
- A coluna Valência é omitida no mobile (PA = sempre positiva, NA = sempre negativa — redundante)

### Landing Page (PsyTutorials.tsx)
- Posição: após o bloco da escala 1–5, dentro da seção PANAS
- Colapsável por padrão — botão "📊 Ver tabela completa das emoções"
- Quando aberto: tabela com todas as 5 colunas (Emoção · Contexto · Valência · Ativação · Oposta)
- Separado em duas subtabelas: PA (header azul) e NA (header vermelho)
- Usa framer-motion `AnimatePresence` + `motion.div` com `overflow: hidden` para o toggle
- Desktop: tabela HTML com `table-auto`; Mobile: colunas Valência e Ativação ficam colapsadas

---

## Arquivos a Modificar

| # | Arquivo | Ação |
|---|---------|------|
| 1 | `src/constants/panasDict.ts` | **CRIAR** — array `PA_DICT` e `NA_DICT` com os 20 itens completos |
| 2 | `src/components/tabs/TutoriaisTab.tsx` | **MODIFICAR** — adicionar `PanasDictionary` no accordion PANAS |
| 3 | `src/components/PsyTutorials.tsx` (landing page) | **MODIFICAR** — adicionar `EmotionDictionaryTable` após a escala |

> **Nota:** `PsyTutorials.tsx` está na pasta `c:/dev/Psylogos-landing-page-website-template/src/components/` — projeto separado do app. O `panasDict.ts` precisará ser copiado/duplicado lá, ou os dados injetados inline como constante local. Duplicar é aceitável dado que são projetos distintos, desde que o plano documente isso.

---

## Esboço dos Componentes

### `PanasDictionary` (App)
```tsx
const PanasDictionary: React.FC = () => {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <button onClick={() => setOpen(v => !v)}>
        📖 {open ? "Fechar" : "Ver"} guia das emoções
      </button>
      {/* grid-template-rows animation — NÃO usar {open && ...} */}
      <div style={{
        display: "grid",
        gridTemplateRows: open ? "1fr" : "0fr",
        transition: "grid-template-rows 320ms ease",
      }}>
        <div style={{ overflow: "hidden" }}>
          {/* Header PA */}
          {PA_DICT.map(e => <EmotionRow key={e.word} entry={e} />)}
          {/* Header NA */}
          {NA_DICT.map(e => <EmotionRow key={e.word} entry={e} />)}
        </div>
      </div>
    </div>
  );
};
```

### `EmotionDictionaryTable` (Landing Page)
```tsx
// Colapsável com AnimatePresence do framer-motion
// Tabela com 5 colunas: Emoção | Contexto | Valência | Ativação | Contrária
// PA_DICT e NA_DICT importados de constante local (dados duplicados da landing page)
```

---

## Checklist de Verificação

- [ ] `panasDict.ts` criado com todos os 20 itens e 5 campos cada
- [ ] App: dicionário colapsado por padrão, abre com animação `grid-template-rows`
- [ ] App: PA em ciano, NA em rosa; colunas legíveis em tela pequena
- [ ] Landing page: tabela colapsada por padrão, abre com framer-motion
- [ ] Landing page: todas as 5 colunas visíveis em desktop
- [ ] Nenhuma emoção hardcodada diretamente nos componentes (vem de constante)
- [ ] Dados iguais nos dois contextos (app e landing page)

---

*Revisado: Março 2026*
