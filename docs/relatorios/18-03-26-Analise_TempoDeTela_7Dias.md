# Relatório de Impacto: Mudança Visual do Tempo de Tela para 7 Dias

**Data:** 18 de março de 2026
**Assunto:** Análise sobre a expansão da interface visual do Tempo de Tela de 3 para 7 dias, com manutenção da trava de 3 dias para o relatório.

## 1. Contexto Modificado
Conforme alinhamento em áudio pelo usuário, a regra técnica principal (termo para desbloquear o relatório de resultados individual) **permanecerá travada em no mínimo 3 dias computados**. No entanto, a plataforma deverá passar a **encorajar os participantes a preencherem dados até o 7º dia** da sua jornada de pings, permitindo a contínua contribuição de informações para os testes.

A análise na raiz do aplicativo atestou que o método de agendamento de dias (`ScreenTimeModal.tsx`) já tem capacidade automática de varrer e permitir acesso até o último dia da jornada agendada. Portanto, focar-se-á inteiramente na modificação do front-end.

## 2. O que será efetivamente modificado no código
Nenhuma regra técnica global profunda vai ser alterada. O escopo das mudanças compreenderá apenas:
1. Expansão visual progressiva dos "cristais" brilhantes informativos (indicadores de dias rastreados) de 3 unidades para a meta total de 7 unidades.
2. Inclusão de um alerta textual incentivador na `HomeTab` e aba de `Conquistas`: os participantes no 1º e 2º dia receberão o aviso indicando a proximidade da liberação do relatório aos 3 dias. Do 3º dia em diante, o texto vai reforçar que as análises já estão disponíveis, enquanto computa visualmente até chegar à contagem 7/7 de dias úteis da jornada.

## 3. Impactos Analisados

### A) Participantes Legados e Retenção
**IMPACTO ZERO**. 
Por mantermos o gatilho visual e a trava de segurança original no código base (`screenTimeCount >= 3`), a preocupação com perdas relativas a contas de antigos participantes fica totalmente dirimida. Todos os usuários cuja jornada pregressa encerrou com 3 dias rastreados ainda continuarão visualizando o Dashboard desbloqueado, ao abrirem as notas do sistema para consultar os seus relatórios, mesmo que a UI mostre (por exemplo) "3/7 dias de registro completados".

### B) Interface Visual Mobile (UI Responsiva)
Ao aumentarmos de 3 para 7 símbolos em telas reduzidas ("cristais" ilustrativos), poderá ocorrer sobreposição ou alongamento do cartão principal verticalmente nos botões. Como o SVG original não é em escala microscópica, durante a implementação pode se tornar imperativo diminuir o espaçamento (`gap`) e ligeiramente redimensionar os ícones contadores, para prevenir a quebra da caixa de layout.

### C) Exportação de Planilhas via Administrador (`AdminDashboard`)
Não trará avarias na inteligência de compilação. Para todos os utilizadores que completarem de fato os 7 dias visualizados via `xlsx`, o script de planilhas (`excelExporter.ts`) capturará com êxito os dias avulsos para além dos usuais três primitivos. Essa alteração fará as estatísticas diárias médias da área administrativa representarem um espelho mais sólido do tempo consumido no ambiente mobile integral.

## 4. Próximos Passos
O **Plano de Implementação** já foi atualizado para relatar os arquivos responsáveis pelo redesenho de interface final e agora independe de grandes validações sobre problemas em bancos de dados. 
O desenvolvimento seguirá os novos delineamentos propostos no documento de implantação assim que revisado, não sendo necessário encostar nas variáveis de back-end relacionadas.
