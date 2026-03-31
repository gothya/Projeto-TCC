# Relatório de Investigação: Bug no Ranking Global (Produção)

**Data:** 28/03/2026
**Assunto:** Investigação do erro onde "os participantes ficam como zerados e o ranking tá sempre como carregando" na branch `main`.

---

## 🔍 Resumo do Diagnóstico

Após investigar o comportamento do frontend (`DashboardPage.tsx` e `SocialTab.tsx`) em conjunto com as integrações do banco em `UserService.ts` e as regras de segurança do Firebase (`firestore.rules`), o problema do Ranking Global trata-se de **uma soma de três fatores**, sendo o bloqueio principal ocasionado por uma **recusa de permissão silenciosa na query do Firestore em produção**.

---

## 🚨 Causas Raiz Identificadas

### 1. Ausência de Regras de Segurança em Produção (Ranking Preso em "Carregando...")
O componente `DashboardPage.tsx` se inscreve na coleção `leaderboard` usando:

```tsx
const q = query(collection(db, "leaderboard"), orderBy("points", "desc"));
const unsubscribe = onSnapshot(q, (snapshot) => {
    // Popula o estado com os jogadores
});
```
**O Bug:** O código do projeto local recém-criado estipula a nova regra de segurança `match /leaderboard/{userId}` no arquivo `firestore.rules`. No entanto, como essa regra provavelmente **não foi enviada para produção (falta de deploy)**, o Firestore na nuvem nega o acesso de leitura à coleção na inicialização do App. 
Como o `onSnapshot` no código *não possui uma função de tratamento de erro (fallback)*, o erro é jogado apenas no console, o estado `leaderboardData` fica travado como um array vazio `[]`, e a interface exibe as frases literais de vazio: **"0 participantes"** (aparentando estar zerado) e **"Carregando ranking..."**.

### 2. Bug de Sincronização de XP do Tempo de Tela ("Os participantes ficam zerados")
Existe um bug crítico de lógica na atualização dos pontos do usuário na collection global.
O método `updateUser()` no `UserService.ts` atualiza corretamente a coleção principal e espelha os pontos na coleção global `leaderboard`.
Porém, **o método `saveDailyScreenTimeLogs()` (usado na recompensa de 500 XP pelo preenchimento do formulário de tempo de tela) atualiza OBRIGATORIAMENTE os pontos APENAS no documento do participante e não no `leaderboard`**. 
Isso significa que o participante ganha XP, sobe de nível na própria interface, mas sua numeração global permanece congelada nos pontos antigos (ficando "zerado" para a competição pública se só tiver feito essa atividade).

---

## 🛠 Plano de Ação Recomendado (Próximos Passos)

Para solucionar o problema de imediato na branch `main`:

**Passo 1: Fazer Deploy das Regras do Firestore**
Rode o comando a seguir no terminal para garantir que o banco em produção aceite as leituras de qualquer usuário autenticado no ranking global:
```bash
firebase deploy --only firestore:rules
```

**Passo 2: Corrigir `saveDailyScreenTimeLogs` em `UserService.ts`**
Ajustar o método para sincronizar os pontos no ranking, assim como é feito no `updateUser`.
```typescript
const leaderboardRef = doc(db, "leaderboard", currentUser.uid);
await Promise.all([
    updateDoc(docRef, { /* atualiza dailyScreenTimeLogs e points */ }),
    setDoc(leaderboardRef, { points: state.user.points }, { merge: true }) 
]);
```

**Passo 3: Adicionar Tratamento de Erros no `onSnapshot`**
Proteger o `DashboardPage.tsx` adicionando uma função de captura de erro na consulta do ranking.
```typescript
const unsubscribe = onSnapshot(
  q, 
  (snapshot) => { /* lógica original */ },
  (error) => {
    console.error("Erro ao assinar a coleção leaderboard:", error);
    // Sugestão: Alterar estado para exibir mensagem de erro no lugar de "Carregando"
  }
);
```
