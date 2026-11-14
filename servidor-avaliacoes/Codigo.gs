/**
 * ÉguaTex: servidor das avaliações do site, guardadas numa planilha Google.
 *
 * GET  -> lista as avaliações (nome, nota, comentário e data), com média e total
 * POST -> recebe { nome, nota, comentario } e grava uma linha nova
 *
 * Para apagar uma avaliação, apague a linha dela na planilha.
 */

const ABA = 'Avaliações';
const CABECALHO = ['Data', 'Nome', 'Nota', 'Comentário'];
const LIMITES = { nome: [2, 60], comentario: [5, 1000] };
const ENVIOS_POR_MINUTO = 10;
const MAXIMO_NA_LISTA = 100;

function doGet() {
  const linhas = aba_().getDataRange().getValues().slice(1)
    .filter(function (l) { return l[0] && l[1] && l[2]; });

  const avaliacoes = linhas.map(function (l, i) {
    return {
      id: i + 2,
      criado_em: dataUtc_(l[0]),
      nome: String(l[1]),
      nota: Number(l[2]),
      comentario: String(l[3]),
    };
  }).filter(function (a) { return a.nota >= 1 && a.nota <= 5; });

  avaliacoes.sort(function (a, b) { return a.criado_em < b.criado_em ? 1 : -1; });
  const soma = avaliacoes.reduce(function (s, a) { return s + a.nota; }, 0);

  return json_({
    total: avaliacoes.length,
    media: avaliacoes.length ? Math.round((soma / avaliacoes.length) * 10) / 10 : 0,
    avaliacoes: avaliacoes.slice(0, MAXIMO_NA_LISTA),
  });
}

function doPost(e) {
  let dados;
  try {
    dados = JSON.parse(e.postData.contents);
  } catch (erro) {
    return json_({ erro: 'Envio em formato inválido.' });
  }

  // Campo escondido do formulário: pessoas não preenchem, robôs costumam preencher.
  if (dados.site) return json_({ ok: true });

  const nome = limpar_(dados.nome, false);
  const comentario = limpar_(dados.comentario, true);
  const nota = Number(dados.nota);

  const erros = [];
  if (!dentro_(nome, LIMITES.nome)) erros.push('Escreva seu nome (de 2 a 60 letras).');
  if (!(nota >= 1 && nota <= 5 && Math.floor(nota) === nota)) erros.push('Escolha de 1 a 5 estrelas.');
  if (!dentro_(comentario, LIMITES.comentario)) erros.push('Escreva um comentário (de 5 a 1000 caracteres).');
  if (erros.length) return json_({ erro: erros.join(' ') });

  // Freio contra enxurrada de envios.
  const cache = CacheService.getScriptCache();
  const minuto = 'envios-' + Math.floor(Date.now() / 60000);
  const enviados = Number(cache.get(minuto) || 0);
  if (enviados >= ENVIOS_POR_MINUTO) {
    return json_({ erro: 'Muitas avaliações chegaram agora. Tente de novo daqui a um minuto.' });
  }
  cache.put(minuto, String(enviados + 1), 120);

  // A mesma avaliação enviada duas vezes seguidas entra uma vez só.
  const repetida = 'ultima-' + Utilities.base64Encode(Utilities.computeDigest(
    Utilities.DigestAlgorithm.SHA_256, nome + '|' + nota + '|' + comentario, Utilities.Charset.UTF_8));
  if (cache.get(repetida)) return json_({ ok: true });
  cache.put(repetida, '1', 600);

  const trava = LockService.getScriptLock();
  trava.waitLock(10000);
  try {
    aba_().appendRow([new Date(), protegido_(nome), nota, protegido_(comentario)]);
  } finally {
    trava.releaseLock();
  }

  return json_({ ok: true });
}

/* ---------- apoio ---------- */

function aba_() {
  const planilha = SpreadsheetApp.getActiveSpreadsheet();
  let aba = planilha.getSheetByName(ABA);
  if (!aba) {
    aba = planilha.insertSheet(ABA);
    aba.appendRow(CABECALHO);
    aba.setFrozenRows(1);
    aba.getRange(1, 1, 1, CABECALHO.length).setFontWeight('bold');
    aba.setColumnWidth(4, 520);
  }
  return aba;
}

// Texto que começa com = + - @ viraria fórmula na planilha; o apóstrofo guarda como texto puro.
function protegido_(texto) {
  return /^[=+\-@]/.test(texto) ? "'" + texto : texto;
}

function limpar_(valor, multilinha) {
  let t = String(valor == null ? '' : valor).normalize('NFC')
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '');
  t = multilinha ? t.replace(/\r\n?/g, '\n').replace(/\n{3,}/g, '\n\n') : t.replace(/\s+/g, ' ');
  return t.trim();
}

function dentro_(texto, limites) {
  return texto.length >= limites[0] && texto.length <= limites[1];
}

function dataUtc_(valor) {
  const d = valor instanceof Date ? valor : new Date(valor);
  return Utilities.formatDate(d, 'UTC', 'yyyy-MM-dd HH:mm:ss');
}

function json_(corpo) {
  return ContentService.createTextOutput(JSON.stringify(corpo)).setMimeType(ContentService.MimeType.JSON);
}
