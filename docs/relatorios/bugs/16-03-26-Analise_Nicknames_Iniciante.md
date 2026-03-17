# Análise: Nicknames "Iniciante" no Banco de Dados

Identifiquei a causa raiz dos usuários aparecendo com o nome "Iniciante" e por que isso está acontecendo com frequência.

## 1. Causa Raiz
O problema ocorre no arquivo [GoogleLoginButton.tsx](file:///c:/dev/Projeto-TCC/src/components/auth/GoogleLoginButton.tsx) (linhas 24-42). 

Atualmente, assim que um usuário faz login com o Google pela primeira vez, o sistema:
1.  **Cria imediatamente** um documento no Firestore com o UID do usuário.
2.  Define o nickname padrão como **"Iniciante"**.
3.  Redireciona o usuário para a página de `/onboarding`.

**O Problema:** Se o usuário fechar o navegador ou abandonar o processo na tela de Onboarding (onde ele deveria escolher seu nickname real e preencher os dados sociodemográficos), o registro já foi criado no banco com o nome "Iniciante".

## 2. Impacto
*   **Dados Incompletos:** Esses usuários possuem `hasOnboarded: false` (ou o campo ausente) e não têm dados sociodemográficos vinculados.
*   **Poluição no Admin:** O Painel do Pesquisador fica cheio de usuários chamados "Iniciante", que na verdade são tentativas de cadastro não concluídas.

## 3. Soluções Sugeridas

### Solução A: Criação Preguiçosa (Recomendado)
Alterar o [GoogleLoginButton.tsx](file:///c:/dev/Projeto-TCC/src/components/auth/GoogleLoginButton.tsx) para **não criar o documento** no Firestore imediatamente.
- O botão apenas autentica o usuário.
- O documento só é criado no [OnboardingPage.tsx](file:///c:/dev/Projeto-TCC/src/pages/OnboardingPage.tsx) após o usuário preencher o formulário e clicar em "Iniciar Jornada".

### Solução B: Status de "Incompleto"
Manter a criação imediata, mas adicionar um campo `registrationStatus: "pending"`.
- Alterar o filtro do Admin para ignorar usuários pendentes.
- No Onboarding, mudar o status para `"complete"`.

### Solução C: Script de Limpeza
Criar um script para deletar todos os usuários da coleção `participantes` que tenham o nickname "Iniciante" e que não tenham completado o onboarding.

---

**Deseja que eu implemente a Solução A para evitar que novos registros "Iniciante" apareçam?**
