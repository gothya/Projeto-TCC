# Relatório de Investigação: Bug de Tradução no Aplicativo (Samsung / Android)

## 1. O Problema Relatado
Foi identificado que em alguns dispositivos móveis, especificamente no Samsung Galaxy S20 FE (mas com potencial para ocorrer em outros aparelhos Android), palavras do aplicativo estavam sendo exibidas de forma incorreta ou modificada. 

**Exemplos identificados nas imagens do usuário:**
- O termo "Orgulhoso" no dicionário do PANAS foi substituído pela palavra "assim".
- O título "O que é o SAM" apareceu como "O ó SAM".
- "O que é o PANAS" apareceu como "O Ó PANAS".
- Pedaços do texto como "Não se trata de uma questão de..." apareceram no menu inferior (Tab bar) de forma cortada ou com tradução estranha.
- Palavras nos afetos positivos apareceram alteradas com a formatação confusa.

## 2. Investigação e Causa Raiz
Ao investigar o código fonte da aplicação `Projeto-TCC`, focando primariamente no arquivo de fundação `index.html` (o arquivo mestre que carrega a aplicação inteira), encontramos a seguinte linha de código:

```html
<html lang="en">
```

Esta configuração informa aos navegadores web e ao sistema operacional que o idioma oficial do site/aplicação é o **Inglês**.

**O que acontece na prática (O Bug de Tradução Automática):**
1. O navegador (como o Samsung Internet ou o Google Chrome nativo do Android) acessa a aplicação Psylogos e lê a tag `lang="en"`.
2. O sistema operacional do aparelho do usuário está configurado para o idioma **Português (`pt-BR`)**.
3. O motor de inteligência do navegador conclui: *"Esta página está num idioma estrangeiro (Inglês) diferente do idioma nativo do sistema do usuário (Português). Vou varrer a página e realizar uma tradução automática para facilitar a leitura."*
4. O problema crítico é que **o texto da interface do Psylogos JÁ estava em português**. 
Quando o tradutor automático tenta forçar uma tradução de *inglês para português* em cima de frases e palavras que não são do inglês, o motor de tradução (seja o nativo do Google ou equivalente da Samsung) se "confunde". O motor tentar encontrar correspondências fonéticas ou tentar processar a palavra livremente, resultando em traduções absurdas.
- Por exemplo: o motor de tradução pode ter tentado converter sílabas conjuntas de "Orgulhoso" como se fosse "so" ou algo semelhante no modelo, resultando livremente na palavra "assim". A mesma distorção ocorre para "O que é o", gerando construções como "O ó".

## 3. A Correção
A correção para este problema é extremamente simples, mas altamente eficaz na prevenção deste comportamento em qualquer aparelho Android ou navegador futuro. Precisamos apenas sinalizar as tags corretas no cabeçalho `HTML`.

### Arquivo a ser modificado:
`c:\dev\Projeto-TCC\index.html`

### Ações:
**1. Corrigir a declaração global de idioma:**
Mudar o atributo `lang` da tag principal de `en` para `pt-BR`. Isso faz o navegador entender que o site e o sistema do usuário estão configurados com o mesmo idioma, inativando a popup/sugestão de tradução.
```diff
- <html lang="en">
+ <html lang="pt-BR">
```

**2. Adicionar uma Flag "Notranslate" (Prevenção extra):**
Adicionar uma meta tag específica no `<head>` alertando os motores do Google Translate, Samsung e extensões que este site não deve ser modificado automaticamente caso o navegador se confunda de alguma forma em sistemas legados.
```html
<meta name="google" content="notranslate" />
```

Essas duas pequenas alterações farão com que as palavras voltem ao normal e que nenhuma inteligência embutida no celular do usuário tente renomear ou traduzir termos nativos do seu projeto, preservando a fidelidade da interface e do instrumento científico do estudo PANAS/SAM.
