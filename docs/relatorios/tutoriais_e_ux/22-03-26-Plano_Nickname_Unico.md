# Plano: Nicknames Únicos no Onboarding

## Diagnóstico

Atualmente dois participantes podem ter o mesmo nickname. `handleNicknameSubmit` em `OnboardingScreen.tsx` chama `onComplete(nickname, data)` diretamente, sem consulta ao Firestore. O armazenamento é por UID (`setDoc(uid, data)`), então duplicatas ficam em documentos separados sem erro — nickname é apenas um campo string, sem unicidade garantida.

---

## Estratégia

**Query `where("user.nicknameLower", "==", nickname.toLowerCase())` antes do `setDoc`.**

- Firestore não suporta constraint de unicidade nativa — a verificação acontece no cliente.
- Campo `nicknameLower` (lowercase normalizado) armazenado junto com o nickname original para exibição. Isso garante que `"Batman"` e `"batman"` sejam tratados como o mesmo apelido.
- Verificação em dois momentos: **durante a digitação** (debounce, feedback imediato) e **no submit** (double-check de segurança).

> **Race condition:** Em alta concorrência (dois usuários submetendo o mesmo nick ao mesmo tempo), a query-antes-de-setDoc não é atômica. Para um estudo com dezenas de participantes, esse risco é desprezível.

> **Índice Firestore (pré-requisito obrigatório antes de produção):** A query em `user.nicknameLower` (campo aninhado) pode exigir índice composto. Sem o índice, o Firestore retorna erro — não resultado vazio — quebrando o onboarding. Criar o índice no console Firebase e verificar antes de liberar para participantes.

---

## Arquivos a Modificar

| # | Arquivo | Ação |
|---|---------|------|
| 1 | `src/service/user/UserService.ts` | Adicionar `isNicknameTaken(nickname): Promise<boolean>` |
| 2 | `src/components/screen/OnboardingScreen.tsx` | Feedback em tempo real + bloquear submit + `nicknameLower` no `onComplete` |

> `OnboardingPage.tsx` **não precisa mudar** — o erro é tratado inteiramente dentro do `OnboardingScreen` via state local. `onComplete` só é chamado após confirmação de disponibilidade.

---

## Detalhamento das Mudanças

### 1. `UserService.ts` — `isNicknameTaken`

```ts
import { query, where, limit } from "firebase/firestore";

async isNicknameTaken(nickname: string): Promise<boolean> {
  const q = query(
    collection(db, this.collectionName),
    where("user.nicknameLower", "==", nickname.trim().toLowerCase()),
    limit(1)
  );
  const snapshot = await getDocs(q);
  return !snapshot.empty;
}
```

### 2. `OnboardingScreen.tsx` — Verificação em tempo real

- Novo state: `nicknameStatus: "idle" | "checking" | "available" | "taken" | "error"`
- Novo `useRef` `nicknameCheckRef` separado do `nicknameDebounceRef` (que serve só para salvar rascunho)
- Debounce de **600ms** após digitação → chama `isNicknameTaken`
- Timeout de **5s**: se a verificação não responder, status `"error"` com mensagem "Não foi possível verificar — tente novamente"

**UI de feedback:**
| Status | Visual |
|---|---|
| `idle` | Nenhum |
| `checking` | "Verificando…" em cinza |
| `available` | ✅ "Disponível" em verde |
| `taken` | ❌ "Este apelido já está em uso." em vermelho |
| `error` | ⚠️ "Não foi possível verificar — tente novamente" em amarelo |

- Botão "Iniciar Jornada": `disabled` exceto quando `nicknameStatus === "available"`

### 3. Double-check no submit

```ts
const handleNicknameSubmit = async () => {
  if (nickname.trim().length <= 2 || !sociodemographicData) return;
  setNicknameStatus("checking");
  try {
    const taken = await Promise.race([
      userService.isNicknameTaken(nickname),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("timeout")), 5000)
      ),
    ]);
    if (taken) { setNicknameStatus("taken"); return; }
    onDraftClear();
    onComplete(nickname, sociodemographicData);
  } catch {
    setNicknameStatus("error");
  }
};
```

### 4. Normalização case-insensitive

Ao salvar o participante (`createUser`), incluir `user.nicknameLower = nickname.toLowerCase()`. Alternativamente, `onComplete` pode receber o nickname e o consumer (`OnboardingPage`) monta o GameState incluindo `nicknameLower`. A abordagem mais segura: incluir no `UserService.createUser` para garantir que o campo sempre seja persistido.

---

## Checklist de Verificação

- [ ] **[PRÉ-REQUISITO]** Criar índice no Firestore para `user.nicknameLower` e verificar que a query não retorna erro
- [ ] `isNicknameTaken` retorna `true` para nick já existente e `false` para disponível
- [ ] `"Batman"` e `"batman"` são bloqueados como duplicata (case-insensitive)
- [ ] Feedback visual correto para todos os 5 estados (`idle`, `checking`, `available`, `taken`, `error`)
- [ ] Botão "Iniciar Jornada" desabilitado exceto quando `available`
- [ ] Double-check no submit impede cadastro mesmo se feedback não atualizou a tempo
- [ ] Timeout de 5s exibe estado `error` sem travar o onboarding indefinidamente
- [ ] `user.nicknameLower` salvo no Firestore ao criar participante

---

*Revisado: Março 2026*
