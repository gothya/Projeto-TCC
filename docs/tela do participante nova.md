# <a name="_agkvf65up6sq"></a>**📋 Relatório Técnico da Nova Estrutura do Participante**
Este relatório define a reorganização da interface do participante em uma estrutura de três telas principais, navegáveis via uma barra inferior (Bottom Navigation). O objetivo é separar o engajamento diário, o histórico de progresso e a comparação social.

-----
## <a name="_h4tp8t715ggy"></a>**📱 Elemento Global: Bottom Navigation Bar**
Barra de navegação fixa na parte inferior da tela, presente em todas as visualizações.

|**Elemento**|**Ícone (Sugestão)**|**Destino**|**Estado Ativo**|
| :- | :- | :- | :- |
|**Botão Conquistas**|🏆 (Troféu)|Tela 2: Conquistas|Ícone/Texto com brilho cyan mais intenso.|
|**Botão Início (Central)**|🏠 (Casa)|Tela 1: Principal|Botão maior, centralizado, com destaque visual permanente.|
|**Botão Leaderboard**|📊 (Podium/Gráfico)|Tela 3: Leaderboard|Ícone/Texto com brilho cyan mais intenso.|

-----
## <a name="_sq8rxlp8uhyz"></a>**1️⃣ Tela Principal: O "Hub" de Ação**
**Foco:** Engajamento imediato ("Hoje"), identidade e próxima ação.
### <a name="_v7zzt8k92inx"></a>**🎨 Background e Identidade Central**

|**Elemento**|**Descrição**|**Fonte de Dados**|
| :- | :- | :- |
|**PlexusFace Background**|Animação 3D de partículas (o "rosto" da IA) posicionada no fundo, atrás dos elementos centrais, em *loop* suave.|Componente Visual|
|**Avatar Central**|Foto circular de grande destaque (ex: 128x128px) no centro da tela. Borda brilhante cyan.|user.avatar|
|**Apelido (Nickname)**|Texto em destaque logo abaixo do avatar.|user.nickname|
|**Título e Nível**|Exibido no quadrante superior esquerdo da tela "Nível X - [Título Hardcoded]".|user.level + Texto fixo|
### <a name="_xrsznvawlhvr"></a>**🎯 HUD Diário e Ações Imediatas (Órbita Central)**
Dispostos ao redor do avatar central ou em uma linha proeminente abaixo dele.

|**Elemento**|**Descrição**|**Estado Visual**|
| :- | :- | :- |
|**Indicadores de Ping do Dia**|<p>Apenas 7 slots representando os pings do **dia atual**.</p><p></p>|<p>🟢 Verde: Completo</p><p></p><p>🔴 Vermelho: Perdido</p><p></p><p>⚫ Cinza: Pendente/Futuro</p>|
||||
### <a name="_itwc774p41rp"></a>**📈 Barra de Evolução e Streak (Órbita Inferior)**

|**Elemento**|**Descrição**|**Cálculo/Fonte**|
| :- | :- | :- |
|**Current Streak**|Contador de sequência de pings. Ex: 🔥 "Sequência: 5 pings".|**user.currentStreak** (Anteriormente oculto)|
|**Barra de Progresso XP**|Barra de progresso visual abaixo do streak.|(xpIntoLevel / xpForThisLevel) \* 100 %|
|**Legenda de XP**|Informação textual abaixo da barra: `Nível Atual|XP Atual / XP Alvo|

-----
## <a name="_egqeqo95f2ze"></a>**2️⃣ Tela de Conquistas: A Jornada**
**Foco:** Histórico, visão semanal e recompensas acumuladas.
### <a name="_nxus8rdivujk"></a>**📅 Cabeçalho: Resumo da Semana**

|**Elemento**|**Valor Exibido / Denominador**|**Descrição**|
| :- | :- | :- |
|✅ **Pings Respondidos**|completedPings / 49|Total de pings regulares feitos na semana.|
|❌ **Pings Perdidos**|missedPings|Total de pings perdidos na semana (hardcoded threshold).|
|⭐ **Dias Completos**|completedStars / 7|Total de pings de fim de dia (estrelas) completados.|
### <a name="_r4ihgh5n0z6x"></a>**🗓️ Card: Grid Histórico de Pings**

|**Elemento**|**Descrição**|
| :- | :- |
|**Matriz 7x7**|Visualização completa da semana (Dias nas linhas x Horários nas colunas).|
|**Status Visual**|Mesma legenda visual do relatório anterior (🟢🔴⚫⭐—⬛) para mapear toda a rotina semanal. Permite identificar padrões de comportamento.|
### <a name="_5hfo6lgqyqis"></a>**🏅 Card: Coleção de Badges**

|**Elemento**|**Descrição**|
| :- | :- |
|**Slots de Badges**|Exibição das medalhas conquistadas. Badges bloqueados aparecem em escala de cinza/cadeado.|
|**Melhoria Futura**|Slots bloqueados podem exibir, ao clicar, a condição de desbloqueio (ex: "Mantenha a sequência por 3 dias").|
### <a name="_dwnv283ygdlp"></a>**🔒 Área Bloqueada: Relatório de Participação (Mecânica de Curiosidade)**
Um card com efeito visual de vidro fosco (glassmorphism) e um ícone de cadeado grande, impedindo a visualização do conteúdo interno até que uma condição seja atendida.

|**Elemento**|**Descrição**|**Conteúdo Oculto (Quando liberado)**|
| :- | :- | :- |
|**Condição de Desbloqueio**|Texto explicativo sobre o card fosco. Ex: "Desbloqueia ao completar 21 pings respondidos (verde)".|Relatório de desempenho do participante.|
|**Taxa de Resposta**|(Oculto) Gráfico ou porcentagem da assiduidade global.|**user.responseRate** (Anteriormente oculto)|
|**Métricas Emocionais**|(Oculto) Visualizações gráficas simples das médias de SAM/PANAS acumuladas.|Dados agregados das coletas.|

-----
## <a name="_pajz9m512cde"></a>**3️⃣ Tela de Leaderboard: Social**
**Foco:** Comparação social e ranking competitivo.

|**Elemento**|**Descrição**|**Fonte de Dados**|
| :- | :- | :- |
|**Pódio (Top 3)**|Componente PodiumItem destacado no topo. Tratamento visual diferenciado para 1º (Ouro/Coroa), 2º (Prata) e 3º (Bronze).|Firestore (users ordenado por points desc).|
|**Lista de Ranqueamento**|Lista de rolagem vertical para os usuários do 4º lugar em diante. Mostra Rank, Avatar, Nickname e XP Total.|Firestore.|
|**Ancoragem do Usuário**|Se o usuário atual **não** estiver no Top 3 (ou visível na tela), uma barra fixa aparece na parte inferior da lista (acima da navegação) mostrando sua posição, avatar, nick e pontos, com borda cyan de destaque.|Posição do currentUser no array do snapshot.|

-----
## <a name="_ucooizrtjybb"></a>**🗃️ Atualização na Estrutura de Dados (User)**
TypeScript

type User = {

`  `nickname: string;

`  `points: number;

`  `level: number;

`  `avatar?: string | null;

`  `// Os campos abaixo agora SÃO utilizados na interface:

`  `currentStreak: number;          // Exibido na Tela 1 (Principal)

`  `responseRate: number;           // Exibido na Tela 2 (Área Bloqueada)

`  `completedDays: number;          // Usado no cálculo do Resumo da Semana (Tela 2)

`  `tokenNotifications?: string | null;

}



