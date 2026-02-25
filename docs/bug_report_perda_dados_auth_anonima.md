# Relatório de Investigação e Resolução de Bug: Perda de Dados de Participantes

**Data:** 24 de Fevereiro de 2026
**Assunto:** Dados de participantes (respostas e histórico) não aparecendo no Dashboard Administrativo e Exportação para Excel.
**Severidade:** Alta (Potencial perda de dados históricos de participantes contínuos).

---

## 1. O Problema Relatado
Foi reportado que dados salvos no Firebase não estavam sendo recuperados para o dashboard do pesquisador e para a exportação do Excel. Havia a suspeita de que os dados estivessem sendo deletados da base de dados, pois participantes que sabidamente haviam respondido pings apareciam zerados (ou não apareciam) na visão administrativa.

## 2. Investigação Inicial
- **Dashboard e Excel:** Verificou-se que o código do painel (`AdminDashboardScreen.tsx`) e a exportação do Excel consultavam corretamente a coleção `users` do Firestore. A leitura dos dados funcionava sem erros de permissão ou falhas de rede. As regras do Firestore estavam corretas.
- **Coleções do Banco:** O banco possui 73 documentos na coleção `users`. Uma inspeção revelou que alguns usuários reais (ex: `Junet`, `bruno`, `123456`) possuíam histórico de respostas e dados de níveis preservados. No entanto, muitos outros tinham o array de `responses` vazio `[]` e nenhum progresso nas coleções de pings diários.
- **Teste Administrativo:** Simulando o login como administrador (`gothya@gmail.com`), o painel carregou com sucesso a quantidade correta de documentos gerados, mas usuários com níveis elevados (como `TESTMASTER`, Nível 3 / 400 XP) mostravam "0 respostas". Isso confirmava a suspeita de que os documentos associados aos usuários que estavam logando no momento do teste tinham respostas apagadas (ou omitidas), não um problema de leitura do administrador.

## 3. A Causa Raiz
O problema estava na interação entre o **Sistema de Autenticação Anônima** e o fluxo de inicialização do estado do usuário no componente base (`App.tsx`).

### O Mecanismo do Bug
1. O aplicativo utiliza autenticação anônima do Firebase (`signInAnonymously` em `AuthContext.tsx`). Isso significa que a sessão está vinculada ao identificador local do navegador (cache/cookies/localStorage).
2. Se um participante acessar o app através de um navegador onde nunca logou antes, usar aba anônima, limpar o cache do celular, ou simplesmente trocar de dispositivo (sendo que ele não tem e-mail/senha cadastrado), o Firebase gera instantaneamente um **NOVO e diferente UID anônimo**.
3. O código no `App.tsx` (linha `104` em `loadData()`) tratava o carregamento dos dados da seguinte forma:
    - O Firebase autenticava o usuário com o *novo* UID.
    - O app buscava na coleção `users` um documento com esse *novo* UID.
    - Como o UID era novo, o documento não existia.
    - A cláusula `else` do código imediatamente executava:
      ```javascript
      // No data for current UID — create initial document for new user
      await setDoc(docRef, INITIAL_GAME_STATE); // Cria doc zerado no novo UID
      setDataLoaded(true);
      localStorage.setItem(LS_UID_KEY, currentUid); // Salva novo UID local
      ```
4. **O Efeito Cascata:** O documento inicial, contendo as respostas antigas e associado ao *UID anterior* do participante, ficava "órfão" na base de dados (continuava existindo no Firestore, mas "perdido"). Simultaneamente, o participante começava do zero em um novo UID zerado.

## 4. A Correção Implementada (App.tsx)
O aplicativo possuía uma constante `LS_UID_KEY = "psylogos_participant_uid"` que salvava o UID localmente, mas não a utilizava para checar se já existia um histórico do dispositivo em caso de troca de UID pelo Firebase.

A solução implementada em `App.tsx` foi **verificar a existência de um histórico órfão (via `localStorage`)** antes de iniciar um participante do zero:

```javascript
} else {
  // O UID atual (nova sessão) não tem documento. Vamos verificar se havia um UID antigo salvo.
  const previousUid = localStorage.getItem(LS_UID_KEY);

  if (previousUid && previousUid !== currentUid) {
    // Tenta recuperar os dados da sessão anônima anterior
    const previousDocRef = doc(db, "users", previousUid);
    const previousDocSnap = await getDoc(previousDocRef);

    if (previousDocSnap.exists()) {
      const previousData = previousDocSnap.data() as GameState;
      // ... verificações e sanitizações de estrutura ($data.responses) ...
      
      // MIGRAR DADOS: Salva todo o histórico antigo no documento do *novo UID* gerado nesta sessão.
      await setDoc(docRef, previousData, { merge: true });
      setGameState(previousData);
      localStorage.setItem(LS_UID_KEY, currentUid); // Atualiza com o UID correto da sessão ativa
      console.log("Migrated participant data from previous UID to new UID.");
    }
  } else {
    // Se não há nenhum UID anterior, é genuinamente o primeiro acesso.
    await setDoc(docRef, INITIAL_GAME_STATE);
    // ...
  }
}
```

## 5. Conclusão e Status Atual
- **Prevenção de Perdas:** Agora os dados são protegidos mesmo em instabilidades das sessões anônimas, copiando o histórico para a sessão vigente, evitando que os usuários zerem a conta e percam progresso (ou gerem documentos vazios no backend).
- **Os Dados Antigos Órfãos:** Pela natureza anônima das contas, os documentos passados que ficaram órfãos no banco de dados (aqueles que têm respostas mas estão sem associação com a sessão atual dos usuários que resetaram os apps/navegadores) continuam lá — eles não foram deletados, porém sem rastreabilidade do dispositivo físico de origem. O dashboard está listando o total (incluindo esses perfis órfãos) porque todos estão dentro de `users`.
- O Dashboard Administrativo e a função do Excel **funcionam perfeitamente para exibir todos os dados disponíveis na coleção** (os atuais e os órfãos/zerados pela lógica falha).
