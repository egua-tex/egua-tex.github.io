// ÉguaTex: servidor das avaliações do site (Cloudflare Worker + banco D1).
//
// Rotas públicas
//   GET  /avaliacoes          lista as avaliações, com média e total
//   POST /avaliacoes          recebe { nome, nota, comentario } e publica na hora
//
// Rotas de moderação (pedem o cabeçalho Authorization: Bearer <TOKEN_ADMIN>)
//   GET    /admin/verificar        confere a senha
//   DELETE /admin/avaliacoes/:id   apaga uma avaliação
//
// Variáveis (wrangler.toml e segredos)
//   ORIGEM       endereço do site que pode chamar o servidor (https://egua-tex.github.io)
//   TOKEN_ADMIN  senha de moderação, guardada como segredo: npx wrangler secret put TOKEN_ADMIN

const LIMITES = { nome: [2, 60], comentario: [5, 1000] };
const ENVIOS_POR_HORA = 3;

export default {
  async fetch(pedido, env) {
    const cors = cabecalhosCors(pedido, env);
    if (pedido.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });

    try {
      const url = new URL(pedido.url);
      const partes = url.pathname.replace(/\/+$/, "").split("/").filter(Boolean);

      if (partes[0] === "avaliacoes" && partes.length === 1) {
        if (pedido.method === "GET") return json(await listar(env), 200, cors, "public, max-age=30");
        if (pedido.method === "POST") return await receber(pedido, env, cors);
      }

      if (partes[0] === "admin") {
        if (!(await autorizado(pedido, env))) return json({ erro: "Senha incorreta." }, 401, cors);
        if (partes[1] === "verificar" && partes.length === 2 && pedido.method === "GET") return json({ ok: true }, 200, cors);
        const id = Number(partes[2]);
        if (partes[1] === "avaliacoes" && partes.length === 3 && pedido.method === "DELETE" && Number.isInteger(id)) {
          await env.DB.prepare("DELETE FROM avaliacoes WHERE id = ?").bind(id).run();
          return json({ ok: true }, 200, cors);
        }
      }

      return json({ erro: "Endereço não encontrado." }, 404, cors);
    } catch (e) {
      return json({ erro: "O servidor não conseguiu responder agora. Tente de novo em alguns minutos." }, 500, cors);
    }
  },
};

/* ---------- rotas ---------- */

async function listar(env) {
  const { results } = await env.DB.prepare(
    "SELECT id, nome, nota, comentario, criado_em FROM avaliacoes ORDER BY criado_em DESC, id DESC LIMIT 100"
  ).all();
  const resumo = await env.DB.prepare("SELECT COUNT(*) AS total, ROUND(AVG(nota), 1) AS media FROM avaliacoes").first();
  return { total: resumo.total || 0, media: resumo.media || 0, avaliacoes: results };
}

async function receber(pedido, env, cors) {
  let dados;
  try { dados = await pedido.json(); } catch { return json({ erro: "Envio em formato inválido." }, 400, cors); }

  // Campo escondido: pessoas não preenchem, robôs costumam preencher.
  if (dados.site) return json({ ok: true }, 200, cors);

  const nome = limpar(dados.nome);
  const comentario = limpar(dados.comentario, true);
  const nota = Number(dados.nota);

  const erros = [];
  if (!dentro(nome, LIMITES.nome)) erros.push("Escreva seu nome (de 2 a 60 letras).");
  if (!Number.isInteger(nota) || nota < 1 || nota > 5) erros.push("Escolha de 1 a 5 estrelas.");
  if (!dentro(comentario, LIMITES.comentario)) erros.push("Escreva um comentário (de 5 a 1000 caracteres).");
  if (erros.length) return json({ erro: erros.join(" ") }, 400, cors);

  // Limite de envios por conexão, para evitar enxurrada de avaliações falsas.
  // Guarda só um resumo embaralhado da conexão, que não permite descobrir o endereço.
  const ip = pedido.headers.get("CF-Connecting-IP") || "desconhecido";
  const marca = await resumoSha256(ip + (env.TOKEN_ADMIN || ""));
  const recentes = await env.DB.prepare(
    "SELECT COUNT(*) AS n FROM avaliacoes WHERE marca_envio = ? AND criado_em > datetime('now', '-1 hour')"
  ).bind(marca).first();
  if ((recentes.n || 0) >= ENVIOS_POR_HORA) {
    return json({ erro: "Você já enviou algumas avaliações agora há pouco. Tente de novo mais tarde." }, 429, cors);
  }

  await env.DB.prepare(
    "INSERT INTO avaliacoes (nome, nota, comentario, marca_envio) VALUES (?, ?, ?, ?)"
  ).bind(nome, nota, comentario, marca).run();

  return json({ ok: true }, 201, cors);
}

/* ---------- apoio ---------- */

function cabecalhosCors(pedido, env) {
  const origem = pedido.headers.get("Origin") || "";
  const permitidas = String(env.ORIGEM || "").split(",").map((s) => s.trim()).filter(Boolean);
  return {
    "Access-Control-Allow-Origin": permitidas.includes(origem) ? origem : permitidas[0] || "",
    "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  };
}

async function autorizado(pedido, env) {
  const enviado = (pedido.headers.get("Authorization") || "").replace(/^Bearer\s+/i, "");
  if (!env.TOKEN_ADMIN || !enviado) return false;
  // Compara os resumos, para o tempo de resposta não revelar a senha.
  const [a, b] = await Promise.all([resumoSha256(enviado), resumoSha256(env.TOKEN_ADMIN)]);
  let diferenca = 0;
  for (let i = 0; i < a.length; i++) diferenca |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diferenca === 0;
}

async function resumoSha256(texto) {
  const bytes = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(texto));
  return [...new Uint8Array(bytes)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function limpar(valor, multilinha = false) {
  let t = String(valor ?? "").normalize("NFC").replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "");
  t = multilinha ? t.replace(/\r\n?/g, "\n").replace(/\n{3,}/g, "\n\n") : t.replace(/\s+/g, " ");
  return t.trim();
}

function dentro(texto, [min, max]) {
  return texto.length >= min && texto.length <= max;
}

function json(corpo, status, cabecalhos, cache = "no-store") {
  return new Response(JSON.stringify(corpo), {
    status,
    headers: { ...cabecalhos, "Content-Type": "application/json; charset=utf-8", "Cache-Control": cache },
  });
}
