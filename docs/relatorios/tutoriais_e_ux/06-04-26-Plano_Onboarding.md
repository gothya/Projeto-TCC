# Plano Técnico: Onboarding do App (Tour Guiado)
**Data:** 06/04/2026  
**Status:** 🟡 Aguardando Aprovação para Implementação

O objetivo desta etapa é fornecer uma ambientação visual interativa rápida ao participante logo na sua primeira entrada na conta do Psylogos PWA, escurecendo a tela com pontos focais iluminados sobre as abas principais.

## Entendimento do Requisito

1. **Gatilho:** Acionado exclusivamente na primeira vez que o participante acessa o `DashboardPage` — detectado pela ausência ou valor `false` da flag `hasSeenOnboarding`.
2. **Visual:** A tela principal fica com um overlay escuro contendo recortes iluminados (foco) apontados para as áreas em destaque. Os balões explicativos aparecem próximos do centro.
3. **Escopo Conciso:** O tour não deve ser longo. Deve focar:
   - **Botão "Responder Ping":** Explicar que é a interação principal diária. *(passo 1 — elemento de maior prioridade)*
   - **Aba Social:** Mostra rankings e jornada.
   - **Aba Guia (Tutoriais):** Orientar que ali encontram-se os tutoriais e que o tour pode ser refeito.
   - **Aba Feitos (Conquistas):** Indicar o acesso ao Relatório ("Meu relatório") e conquistas do estudo.

> **Nota:** A Aba Início foi removida do roteiro do tour — o participante já está nela quando o tour dispara, tornando o passo redundante e potencialmente confuso.

---

## Solução Proposta

Para garantir que os balões de diálogo, o fundo escurecido e o efeito de foco luminoso operem sem problemas no navegador do celular, a proposta é integrar o pacote npm `react-joyride`.

> **Atenção ao bundle size:** `react-joyride` adiciona ~80KB ao bundle antes de tree-shaking. Para um PWA mobile-first, isso deve ser monitorado. Avaliar lazy load do componente de onboarding para não impactar o carregamento inicial do Dashboard.

### 1. Estado do Participante (`ParticipantProfile.ts`)

A flag de onboarding é dado de **preferência do usuário**, não de estado de jogo. Por isso, deve ser adicionada ao tipo de perfil do participante (ex: `ParticipantProfile.ts`), e não ao `GameState.ts`:

```typescript
hasSeenOnboarding?: boolean; // Ausente ou false → dispara o tour.
```

A lógica de verificação deve tratar tanto `false` explícito quanto campo ausente (`undefined`) como equivalentes:

```typescript
const shouldShowOnboarding = !participant.hasSeenOnboarding;
```

### 2. Âncoras Visuais (`BottomNav.tsx`)

Usar atributos `data-tour` em vez de `id` para ancoragem do tour. Atributos `id` têm papel semântico e de acessibilidade (`aria-labelledby`, âncoras de rota, etc.) e não devem ser usados como hooks de UI de terceiros:

```tsx
<TabButton data-tour="tab-social"   ... />
<TabButton data-tour="tab-guias"    ... />
<TabButton data-tour="tab-feitos"   ... />
<PingButton data-tour="ping-button" ... />
```

> **Atenção — Ping dentro de modal:** Se o botão "Responder Ping" estiver dentro de um modal ou drawer, `react-joyride` não calcula a posição do spotlight corretamente para elementos dentro de overlays. Nesse caso, a âncora deve ser no elemento do `BottomNav` que abre o ping (sino/ícone), com o texto explicativo descrevendo a ação de responder.

### 3. Componente do Tour (`DashboardOnboarding.tsx`)

Criar o componente contendo a configuração da jornada:

- **Passos:** Cada `target` usa seletor `[data-tour="..."]` e recebe texto explicativo conciso.
- **Ordem dos passos:** Ping → Social → Guia → Feitos.
- **Tema:** Customização visual com tooltip em fundo escuro (`#0f172a`), bordas neon (`#a855f7`), adequando-se à aparência Dark-Neon do projeto.
- **Acessibilidade:** Configurar navegação por teclado e atributos `aria-*` conforme suporte nativo do `react-joyride`.

```tsx
const steps: Step[] = [
  { target: '[data-tour="ping-button"]', content: '...' },
  { target: '[data-tour="tab-social"]',  content: '...' },
  { target: '[data-tour="tab-guias"]',   content: '...' },
  { target: '[data-tour="tab-feitos"]',  content: '...' },
];
```

> **Atenção — Mobile/iOS Safari:** Elementos com `position: fixed` (como o `BottomNav`) podem causar cálculo incorreto do spotlight em alguns browsers mobile. Testar em iOS Safari antes de aprovar a implementação. Se necessário, usar a prop `disableScrolling` e ajustar `offset` por step.

### 4. Chamada na Inicialização (`DashboardPage.tsx`)

Renderizar condicionalmente o `<DashboardOnboarding />` quando `!participant.hasSeenOnboarding`.

Ao concluir o tour, persistir a flag com tratamento de erro:

```typescript
const handleTourFinish = async () => {
  try {
    await updateParticipante({ hasSeenOnboarding: true });
  } catch (err) {
    // Falha silenciosa: o tour reaparece no próximo acesso.
    // Não bloquear o usuário por falha de escrita.
    console.error('Falha ao persistir onboarding flag:', err);
  }
};
```

> **Estratégia de falha:** A escrita é feita *após* o tour terminar (não otimisticamente). Se falhar, o tour reaparece no próximo acesso — comportamento aceitável e preferível a travar o usuário.

### 5. Mecanismo de Replay (`GuiasPage.tsx`)

Adicionar na Aba Guia (Tutoriais) um botão "Rever tour inicial" que redefine a flag:

```typescript
await updateParticipante({ hasSeenOnboarding: false });
// Redirecionar para o Dashboard — o tour será disparado novamente.
```

---

## Decisões Técnicas a Revisar (User Review)

> [!IMPORTANT]
> A implementação requer:
> 1. Inserir `hasSeenOnboarding?: boolean` no tipo de perfil do participante (não em `GameState`) e no hook de inicialização correspondente.
> 2. Instalar `npm install react-joyride` para gerenciar highlights de sobreposição e navegação em passos.
> 3. Usar `data-tour="..."` como atributo de ancoragem em vez de `id`.
> 4. Validar comportamento do spotlight com `BottomNav` fixo em iOS Safari antes da entrega.
>
> A estratégia está alinhada?

---

## Plano de Verificação

1. Instalar a biblioteca: `npm install react-joyride`.
2. Preparar dois participantes de teste:
   - **Caso A:** campo `hasSeenOnboarding` **ausente** (simula novo usuário real).
   - **Caso B:** campo `hasSeenOnboarding` com valor explícito `false`.
3. Para cada caso: entrar no Dashboard pelo emulador PWA local e percorrer os 4 passos do tour.
4. Ao fim, verificar se `hasSeenOnboarding: true` foi persistido no Firestore — o tour não deve reaparecer no próximo acesso.
5. **Caso de borda — abandono:** Fechar o app no passo 2 e reabrir. O tour deve recomeçar do início (flag não persistida).
6. **Caso de borda — falha de escrita:** Simular falha no Firestore ao concluir o tour. Verificar que o usuário não é bloqueado e que o tour reaparece no próximo acesso.
7. Testar em iOS Safari (navegador mais restritivo) para validar posicionamento do spotlight sobre o `BottomNav` fixo.
8. Verificar que o botão de replay na Aba Guia redefine a flag e relança o tour corretamente.
