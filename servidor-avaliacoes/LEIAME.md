# Servidor das avaliações do site

Guarda as avaliações enviadas pelo site: nome, nota de 1 a 5 e comentário. Nada além disso é pedido a quem avalia. A avaliação aparece no site assim que é enviada.

Roda na Cloudflare (Workers e banco D1), no plano gratuito.

## Como ligar (uma vez só)

Precisa de Node.js e de uma conta na Cloudflare.

```bash
cd servidor-avaliacoes
npx wrangler login
npx wrangler d1 create eguatex-avaliacoes
```

O último comando mostra um `database_id`. Cole esse valor em `wrangler.toml`, no lugar de `COLE_AQUI_O_ID_DO_BANCO`. Depois:

```bash
npx wrangler d1 execute eguatex-avaliacoes --remote --file=esquema.sql
npx wrangler secret put TOKEN_ADMIN
npx wrangler deploy
```

O `secret put` pede a senha de moderação. Escolha uma senha longa e entregue só a quem pode apagar avaliações.

O `deploy` mostra o endereço do servidor, parecido com `https://eguatex-avaliacoes.<conta>.workers.dev`. Coloque esse endereço em `assets/js/config.js`, no campo `servidorAvaliacoes`. A seção de avaliações aparece no site assim que esse arquivo for publicado.

## Apagar uma avaliação

1. Abra `https://egua-tex.github.io/#moderar`.
2. Digite a senha de moderação. Cada avaliação ganha um botão Apagar.
3. Clique em Apagar e depois em "Confirmar: apagar de vez".

Quem não tem a senha não vê nem o campo, nem os botões.

## Limites

Cada conexão pode mandar até 3 avaliações por hora. O servidor guarda só um resumo embaralhado da conexão para isso, sem o endereço em si.
