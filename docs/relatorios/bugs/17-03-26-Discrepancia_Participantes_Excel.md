# Diagnóstico: Diferença na Contagem de Participantes (Painel vs. Excel)

Identifiquei o motivo exato de o Painel de Controle mostrar 13 participantes, enquanto a planilha Excel exportada contém apenas 6.

## 1. O que está acontecendo?
A diferença de **7 participantes** (13 no total menos 6 na planilha) deve-se aos registros incompletos identificados como **"Iniciante"**.

*   **No Painel Admin:** O contador de "Participantes Ativos" simplesmente conta o número total de documentos na coleção `participantes` do banco de dados. Como existem 13 documentos lá, ele mostra 13.
*   **No Excel:** A lógica de exportação é baseada em **respostas**. Para cada participante, ele verifica a lista de `responses`. Se o participante não tiver nenhuma resposta registrada (o que é o caso de todos os usuários "Iniciante" que abandonaram o onboarding), ele não gera nenhuma linha nas abas do Excel (SAM, PANAS, etc.).

## 2. Por que os 7 estão "sumindo"?
Como os usuários "Iniciante" não concluíram o cadastro, eles:
1.  Não possuem dados sociodemográficos.
2.  Não iniciaram a jornada de 7 dias.
3.  **Não possuem nenhuma resposta no histórico.**

O exportador de Excel atual pula usuários sem respostas para evitar linhas vazias nas planilhas de instrumentos.

## 3. Recomendações

### Para o Painel de Controle:
Podemos ajustar o contador para mostrar apenas participantes que realmente concluíram o onboarding:
```typescript
// Em src/pages/AdminDashboardPage.tsx
const activeUsersCount = allUsers.filter(u => u.hasOnboarded).length;
```

### Para o Excel:
Podemos adicionar uma nova aba chamada **"Participantes"** que liste *todos* os usuários cadastrados, mesmo aqueles que ainda não enviaram respostas. Isso daria visibilidade total ao pesquisador sobre quem iniciou o processo mas não continuou.

---

**Deseja que eu aplique o filtro no contador do Painel para que ele mostre apenas os 6 participantes reais?**
