# Relatório de Estratégia: Desbloqueio de Formulário via Tempo de Tela

**Data:** 17 de Março de 2026
**Objetivo:** Implementar um sistema de bloqueio ("cadeados") para um formulário específico ("Meu Formulário" / Relatório), exigindo que o participante tenha registrado seu Tempo de Tela por pelo menos 3 dias distintos.

---

## 1. Viabilidade e Impacto no Código

**Impacto Geral:** Baixo a Médio.
A implementação é perfeitamente viável e se integra bem com a refatoração recente (separação do tempo de tela do ping do final do dia).

*   **Estado da Aplicação (`GameState`):** Como já planejamos a criação de um array `dailyScreenTimeLogs` no estado do usuário para salvar os tempos de tela avulsos, basta contarmos o tamanho desse array. Não precisamos criar novas variáveis de estado complexas, apenas ler o que já existe.
*   **Complexidade Lógica:** Baixa. A lógica consiste em verificar se `participante.dailyScreenTimeLogs.length >= 3`.
*   **Complexidade de UI (Interface):** Média. Precisaremos criar um componente visual agradável para o botão desse formulário, mostrando claramente os 3 cadeados (🔒) e mudando seu estado (aberto/fechado) conforme o progresso.

---

## 2. Estratégia de Implementação (Passo a Passo)

### Passo 1: Lógica de Contagem de Dias
Sempre que formos renderizar o botão de acesso ao "Meu Formulário", calculamos o progresso atual:
```typescript
const screenTimeCount = participante.dailyScreenTimeLogs?.length || 0;
const isFormUnlocked = screenTimeCount >= 3;
```

### Passo 2: Componente Visual do Botão (UI)
Criaremos um botão dedicado (seja na aba Home ou no Menu). Este botão terá:
*   **Texto Principal:** "Acessar Meu Formulário" (ou o nome real do recurso).
*   **Subtexto de Requisito (se bloqueado):** "Registre o Tempo de Tela por mais X dias para liberar."
*   **Indicadores Visuais (Os Cadeados):** Uma fileira de 3 ícones.
    *   Exemplo de progresso (1 dia registrado): 🔓 🔒 🔒
    *   Concluído (3 ou mais dias): 🔓 🔓 🔓 (Botão fica interativo).
*   **Efeito Visual:** Se bloqueado, o botão ficará com opacidade reduzida e cursor não-clicável (`cursor-not-allowed`).

### Passo 3: Proteção de Rota / Modal
Além de desabilitar o botão, a função de clique deve verificar novamente o requisito para garantir que o modal/formulário não seja aberto indevidamente.

```typescript
const handleOpenMyForm = () => {
    if (screenTimeCount < 3) {
        alert("Você precisa registrar o tempo de tela por 3 dias para liberar!");
        return;
    }
    // Lógica para abrir o formulário
};
```

---

## 3. Considerações de Design (UX/UI)

Para manter a estética cyberpunk/neon ("Enigma da Mente"):
*   Os cadeados iniciais estarão em um tom opaco de cinza (`slate-600`).
*   Ao destrancar um cadeado, ele ganha uma cor neon (ex: Cyan ou Verde `cyan-400`), com um leve efeito de brilho (glow), para gerar dopamina e sensação de progresso no usuário.
*   Quando os três cadeados forem liberados, o botão inteiro sofre uma animação suave (ex: ganha uma borda neon cintilante) indicando que a ação principal agora está disponível.

---

## 4. Próximos Passos (Ação Requerida)

Para iniciarmos a implementação de código dessa feature e da refatoração do Tempo de Tela, preciso apenas confirmar:
1.  Onde exatamente esse botão com os cadeados vai ficar? (Na aba `Home`, abaixo do botão "Lançar Tempo de Tela"? Ou dentro do menu de Perfil?)
R. 3 pequenos cadeados ao lado do botão "Lançar Tempo de Tela" e 3 cadeados por cima do botão "Meu relatório final". o passar o mouse por cima do cadeado, ele deve mostrar uma tooltip explicando o que é e quantos dias faltam para liberar.
2.  Quando você diz "Meu formulário", você está se referindo a uma nova tela/modal que vamos criar para coletar novos dados, ou se refere ao recurso "Meu Relatório" (relatório final do participante)?
Meu relatório final do participante.
Podemos seguir com essa estratégia? Se sim, assim que me tirar essa dúvida, inicio a codificação!
