# Avaliações do site

As avaliações enviadas pelo site (nome, nota de 1 a 5 e comentário) ficam numa planilha Google. Nada além disso é pedido a quem avalia. Cada avaliação chega na planilha com a caixa "Aprovada" desmarcada e só aparece no site depois que a caixa é marcada.

## Como ligar (uma vez só)

1. Crie uma planilha em branco no Google Planilhas, por exemplo "Avaliações ÉguaTex".
2. Na planilha, abra **Extensões**, depois **Apps Script**.
3. Apague o que estiver no editor, cole o conteúdo de `Codigo.gs` e clique em **Salvar**.
4. Clique em **Implantar**, depois **Nova implantação**. Em "Tipo", escolha **App da Web**. Em "Executar como", deixe **Eu**. Em "Quem pode acessar", escolha **Qualquer pessoa**. Clique em **Implantar** e autorize.
5. Copie o endereço que termina em `/exec` e coloque em `assets/js/config.js`, no campo `servidorAvaliacoes`.

A aba "Avaliações", com o cabeçalho Data, Nome, Nota, Comentário e Aprovada, aparece sozinha na primeira avaliação.

## Aprovar uma avaliação

Marque a caixa da coluna "Aprovada" na linha dela. Ela entra no site em seguida, e a média passa a contar com ela. Para tirar do site sem apagar, desmarque a caixa.

## Apagar uma avaliação

Apague a linha dela na planilha. Ela some do site em seguida.

## Mudar o código depois

Depois de editar o script, use **Implantar**, **Gerenciar implantações**, o lápis de editar e "Nova versão". Assim o endereço `/exec` continua o mesmo.

## Limites

Até 10 avaliações por minuto no site inteiro, e a mesma avaliação enviada duas vezes seguidas entra uma vez só. Um campo escondido no formulário barra a maior parte dos robôs.
