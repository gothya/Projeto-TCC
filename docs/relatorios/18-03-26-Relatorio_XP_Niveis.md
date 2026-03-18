# Relatório de Funcionamento do Sistema de XP 

**Data:** 18 de março de 2026
**Assunto:** Mapeamento de Pontuação, Metas de Retenção e Níveis de Usuário na Jornada de 7 Dias

---

## 1. Valores Base de Experiência (XP)
A pontuação do aplicativo ("XP") funciona como o principal combustível de gamificação. Cada pequena ação gera recompensas para alimentar a sensação de progressão.

- **Ping Comum:** `50 XP`
- **Ping Estrela (ex: Final do Dia):** `100 XP`
- **Registro Diário (Tempo de Tela):** `500 XP`

## 2. Cenários de Conclusão e Metas

A jornada de 7 dias apresenta um total de **7 janelas diárias de pings** (ex: 9h, 11h, 13h, 15h, 17h, 19h e 21h). Dessas janelas, 6 acionam questionários breves (pings comuns) e 1 aciona um questionário profundo (ping estrela).

### Cenário A: O Ideal (100% de Engajamento)
- **42** Pings Comuns x 50 XP = 2.100 XP
- **7** Pings Estrela x 100 XP = 700 XP
- **7** Registros de Tempo de Tela x 500 XP = 3.500 XP
- **Total Teórico Máximo:** **6.300 XP**

### Cenário B: O Alvo Mínimo (Apenas ~40% de Engajamento)
Para evitar a frustração e manter uma régua de sucesso plausível, estipula-se uma cota de **21 Pings** (aprox. 3 dias de retenção ou 40% da jornada).
Se calcularmos um participante que interage medianamente para atingir os requisitos mínimos de liberação do relatório:
- **18** Pings Comuns respondidos = 900 XP
- **3** Pings Estrela respondidos = 300 XP
- **3** Registros de Tempo de Tela preenchidos = 1.500 XP
- **Total do Alvo Mínimo:** **2.700 XP** (Garante atingir o `Nível 17` antes da liberação final do relatório).

---

## 3. Progressão de Níveis e Títulos
Para guiar o participante até o final da jornada, estabelecemos um sistema linear de 21 "níveis de vida". A cada **160 XP**, o usuário evolui de nível numérico. Adicionalmente, em alguns limiares de nível, o sistema confere um **Novo Título** que altera o rótulo ("badge") no painel do participante. Qualquer valor atingido acima do Nível 11 (1.600 XP) fixa o jogador no título máximo eterno ("Lenda").

| Nível Numérico | XP Mínimo | Título do Participante | Observação |
| :--- | :--- | :--- | :--- |
| **Nível 1** | 0 XP | *Mente Curiosa* | Nível inicial. |
| **Nível 2** | 160 XP | *Explorador* | Atingível no 1º dia. |
| **Nível 3** | 320 XP | *Observador* |
| **Nível 4** | 480 XP | *Investigador* |
| **Nível 5** | 640 XP | *Analista* |
| **Nível 6** | 800 XP | *Decifrador* |
| **Nível 7** | 960 XP | *Estrategista* |
| **Nível 8** | 1.120 XP | *Visionário* |
| **Nível 9** | 1.280 XP | *Mestre* |
| **Nível 10** | 1.440 XP | *Sábio* |
| **Nível 11** | 1.600 XP | **Lenda** | Título Máximo Atingido. |
| **Nível 12** | 1.760 XP | *Lenda* | O participante continua subindo de #, mantendo o título *Lenda*. |
| **Nível 13** | 1.920 XP | *Lenda* |
| **Nível 14** | 2.080 XP | *Lenda* |
| **Nível 15** | 2.240 XP | *Lenda* |
| **Nível 16** | 2.400 XP | *Lenda* |
| **Nível 17** | 2.560 XP | *Lenda* | O **Alvo Mínimo** (2700XP) repousa geralmente aqui no finalzinho. |
| **Nível 18** | 2.720 XP | *Lenda* |
| **Nível 19** | 2.880 XP | *Lenda* |
| **Nível 20** | 3.040 XP | *Lenda* |
| **Nível 21+**| 3.200 XP | *Lenda* | Teto numérico codificado. Pontuações acima de 3.200 continuam somando no BD, mas não alteram o Nível. |

> **Nota:** Se os participantes engajarem em todos os 7 dias, eles estourarão o limite máximo de XP estabelecido na UI (`3.200 XP`), já que o recorde absoluto é de `6.300 XP`. Sugere-se expandir o array de `LEVEL_THRESHOLDS` futuramente caso o comportamento altamente engajado se torne prevalente.
