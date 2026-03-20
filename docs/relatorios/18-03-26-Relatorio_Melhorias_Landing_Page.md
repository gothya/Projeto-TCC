# Relatório Preliminar de Melhorias na Landing Page (Psylogos)

**Data:** 18 de março de 2026
**Assunto:** Mapeamento de Correções e Novas Funcionalidades para a Landing Page (Visual Template).

Este relatório consolida as instruções enviadas por áudio e texto, apontando os arquivos que precisarão ser modificados **antes da implementação de código**.

---

## 1. Alterações Textuais Solicitadas
Foram identificadas diversas correções de copy e informações defasadas na interface atual:

| De (Atual / Incorreto) | Para (Desejado) | Arquivo Relacionado |
| :--- | :--- | :--- |
| "Sua mente reage..." / "Sua mente" | "Seu coração reage aos algoritmos" / "Seu coração" | `PsyHero.tsx` |
| "Relatório psicológico personalisado" | "Relatório de Jornada Personalizado" | `PsyGamification.tsx` |
| "Cadeado + 3 dias de dados" | "21 respostas válidas e 2700XP (pontos de participação)" | `PsyGamification.tsx` |
| "Thiago - Pesquisador principal" | Remover "principal" (Apenas "Thiago - Pesquisador" / "Pesquisador") | `PsyAuthority.tsx` |
| "TCLE" | "RCLE" (Registro de Consentimento...) | `PsyFooter.tsx` e `PsyAuthority.tsx` |

Além dessas, no botão do topo, o Call to Action deve mudar de acordo com o áudio para: *"participe de uma jornada de 7 dias de autodescoberta científica e vamos descobrir se as redes sociais têm algo a nos ensinar sobre as nossas emoções"*. 

---

## 2. Redirecionamento de Acesso (Vercel)
**Problema:** Atualmente, os formulários / botões de ação ("Quero participar da pesquisa") estão apontando para lugares genéricos ou antigos.
**Solução:** Ambos os botões (O de cima `PsyHero` e o de baixo na seção CTA `PsyCTA` ou rodapé) serão parametrizados para enviar o usuário à plataforma web ativa:
- **Destino Oficial:** `https://projeto-tcc-pi.vercel.app/dashboard`

---

## 3. Correção de Layout (Bugs Identificados)
**Problema Relatado:** *"As vezes é difícil rolar a tela, como se tivesse uma janela dentro da outra."* 
**Análise:** Esse efeito ocorre no ambiente Web quando declaramos múltiplos "containers" com altura fixa (`100vh` ou `h-screen`) e sobrepomos as barras de rolagem (`overflow-y-auto` ou `overflow-y-scroll`). O navegador da landing page confunde a rolagem do corpo da página (body) com a rolagem do elemento container.
**Solução Futura:** Revisaremos os containers principais no `Index.tsx` e em outros componentes macro como `App.tsx` para garantir que apenas o `body` geral retenha o atributo de barra de rolagem unificada, removendo as marcações redundantes `h-screen` com `overflow-hidden`.

---

## 4. Melhorias de Design e Animações
O design será substancialmente embelezado nas seguintes frentes:
1. **Highlight de Navegação e Animação:** Inclusão de um cabeçalho (Navbar) com rastreamento da rolagem. Enquanto o usuário flutua pela página, o menu iluminará a seção ativa atual (Highlights) de forma fluida.
2. **Nova Arte Emocional:** Transformar a clássica pergunta para: *"Pronto para decifrar o enigma do seu coração?"*, e introduzir visualmente um coração sob iluminação quente, em contraste poético com o fundo azul frio da landing page.
3. **Plano de Fundo em Vídeo:** Criação de um espaço contêiner no fundo do Topo (Hero) reservado para rodar um arquivo de vídeo ("Video Space"), sobreposto pelos textos de título que existem hoje no `PsyHero.tsx`.

---

## 5. Novas Seções Estruturais
Para aumentar a credibilidade e utilidade pedagógica da página, as seguintes sessões de interface devem ser criadas e conectadas ao documento visual principal (`Index.tsx`):
- **Sessão História Psylogos:** Um bloco narrativo reservado no meio/fim da página que relatará a origem ou propósitos do app Pyslogos (inicialmente sem miolo/texto, apenas o design reservado e diagramado).
- **Sessão de Tutoriais (Como Responder):** Um diagrama visual contendo imagens e possivelmente conexões em fluxograma ensinando passo a passo como o participante deverá responder os questionários (pings e PANAS/SAM).
- **Revisão Visual das Cartas de Pesquisa:** Modernizar e arranjar inteligentemente as exibições dos "Instrumentos de Pesquisa" (CORE, SAM, PANAS, Tempo de Tela), hoje representados por divisões ou cards antigos, buscando aumentar a compreensão cognitiva de quem lê.

---

## 6. Integração com WhatsApp e Limpeza Visual
**Comunicação Direta e Lembretes:**
- **Sessão Lembrete via WhatsApp:** Criar uma nova chamada (Call to Action) convidando o participante a solicitar lembretes dos horários de resposta. O botão apontará diretamente para a conversa: `http://wa.me/5561992360330`.
- **Contato com o Pesquisador:** A atual seção de "contato/suporte" da landing page será unificada e também direcionada para o mesmo link do WhatsApp, operando como suporte humanizado e base de alerta de notificações.

**Limpeza e Simplificação (Garantias):**
- **Redução de Poluição Visual:** A landing page exibe repetidamente selos e textos de garantia (ex: "100% anônimo", "100% ético"). Para evitar a saturação de texto, removeremos ocorrências redundantes, mantendo a citação destas garantias em um único layout central simplificado.

---

> Esse relatório consolida todos os pontos apontados. Após validação, esse levantamento guiará nosso **Plano de Implementação de Código** da Landing Page.
