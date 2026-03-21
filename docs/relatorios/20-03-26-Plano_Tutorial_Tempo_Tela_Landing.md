# Tutorial de Tempo de Tela — Plano de Implementação (Landing Page)

Adicionar uma nova seção interativa na Landing Page (`PsyTutorials.tsx`) para ensinar os participantes a registrar o tempo de tela corretamente no app, utilizando o modelo passo a passo com imagens fornecidas (1 a 12).

---

## Proposta Visual e Funcional

A seção será posicionada logo após o **Bloco 3 — O PANAS** e antes do **Fluxo Diário Resumido**. Ela terá um formato de **Carrossel Passo a Passo** ou **Grid Interativo** com scroll horizontal suave. 

Para a landing page ser didática sem ficar massante, o usuário clica em botões numéricos (ou setas) para avançar as telas de explicação, simulando o app real.

### Estrutura do Conteúdo (Baseado no Áudio e Imagens 1-12)

O fluxo narra desde abrir o form até achar a informação nas configs do celular.

1. **Iniciando o Registro:**
   - Tela 1: O participante clica no botão "Lançar Tempo de Tela" a partir da aba principal (Dashboard).
2. **O Formulário:**
   - Tela 2: O modal de captura é aberto. Ele avisa que o participante registrará o uso de cada rede e desbloqueia um novo dia de registro.
3. **Adicionando Redes Sociais:**
   - Tela 3 e 4: O participante clica em "Adicionar Nova Rede Social" para selecionar e registrar o tempo de uso dos aplicativos alvo do estudo (TikTok, Reels, Shorts).
   - Tela 5, 6 e 7: Clicando no card, é possível escolher na lista qual aplicativo registrar. Ao final, a soma total aparece no alto da tela.
4. **Encontrando os Dados no Celular (Android/iOS):**
   - Tela 8, 9, 10, 11 e 12: Ensina onde recuperar a informação no celular para não colocar um valor "chutado".
   - *Instrução:* Abrir "Configurações" ➔ Buscar por "Bem-estar digital" (ou Tempo de Tela no iOS) ➔ Clicar no gráfico de barras no centro da tela ➔ Ver o tempo exato associado à rede social.

---

## Modificações Propostas

### 1. Novo Bloco no Componente Principal

#### [MODIFY] [PsyTutorials.tsx](file:///c:/dev/Psylogos-landing-page-website-template/src/components/PsyTutorials.tsx)

- **Local:** Inserir o novo bloco (`<div className="max-w-4xl mx-auto mb-20">...</div>`) logo após o fechamento do "BLOCO 3: PANAS".
- **Título:** Passo 4 — Registro de Tempo de Tela.
- **Estrutura:** 
  Um componente de passos (Step-by-Step). À esquerda a explicação em texto (animada com `framer-motion`) e à direita um visualizador simulando a tela de um celular contendo as imagens (`tela_1.png` até `tela_12.jpg`).

### 2. Lógica do Carrossel de Imagens

Como temos 12 imagens, exibir todas em bloco deixaria a página gigante. A solução ideal:
- Um estado local `const [activeStep, setActiveStep] = useState(0)`
- Um array de 12 itens contendo: `{ img: '/tutorial/screen-time/tela_1.png', caption: 'Texto da etapa 1' }`
- Botões de Próximo/Anterior e indicadores de bolinha na parte inferior.
- Transições de *fade* ou *slide* na troca da imagem usando `<AnimatePresence>` do Framer Motion.

```tsx
// Exemplo de Array de Passos
const screenTimeSteps = [
  { img: '/tutorial/screen-time/tela_1.png', title: 'Acesse o Formulário', text: 'Na página inicial, clique no botão para Lançar o Tempo de Tela.' },
  { img: '/tutorial/screen-time/tela_2.png', title: 'O Modal', text: 'Você verá um resumo de como registrar e desbloqueará novos dias de envio.' },
  { img: '/tutorial/screen-time/tela_3.png', title: 'Adicionar Redes', text: 'Clique no botão Adicionar para listar as redes consumidas hoje.' },
  // ... mapear até a tela 12
]
```

---

## Plano de Verificação

1. **Integridade de Arquivos:** Certificar que as 12 imagens estão exatamente no caminho `/public/tutorial/screen-time/`.
2. **Implementação de Código:** Injetar o array de passos e o JSX do Bloco 4 no `PsyTutorials.tsx`.
3. **Teste Visual:**
   - Iniciar o servidor com `npm run dev`.
   - Navegar até a parte de "Como Responder" na landing page.
   - Clicar nas setas do novo carrossel.
   - Verificar se as 12 imagens renderizam na ordem correta, se o texto atualiza e se as animações de entrada (`framer-motion`) estão suaves.
4. **Responsividade:** Garantir que o bloco de imagem não fique achatado no mobile (dando preferência a empilhar a imagem em cima e o texto embaixo telas pequenas).

---

*Branch: `Tutoriais` — Março 2026*
