-- Tabela das avaliações do site do ÉguaTex (banco D1 da Cloudflare).
-- Criar uma vez com: npx wrangler d1 execute eguatex-avaliacoes --remote --file=esquema.sql

CREATE TABLE IF NOT EXISTS avaliacoes (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  nome         TEXT    NOT NULL,
  nota         INTEGER NOT NULL CHECK (nota BETWEEN 1 AND 5),
  comentario   TEXT    NOT NULL,
  marca_envio  TEXT    NOT NULL,          -- resumo embaralhado da conexão, só para limitar envios repetidos
  criado_em    TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_avaliacoes_data ON avaliacoes (criado_em);
CREATE INDEX IF NOT EXISTS idx_avaliacoes_marca ON avaliacoes (marca_envio, criado_em);
