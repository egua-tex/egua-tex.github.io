// ÉguaTex: seção de avaliações da página inicial (média, lista e formulário).
// As avaliações ficam numa planilha Google (servidor-avaliacoes/Codigo.gs). O endereço do app da Web
// fica em assets/js/config.js; sem endereço, a seção fica escondida. Para apagar, apague a linha na planilha.

(() => {
  const secao = document.getElementById("avaliacoes");
  const SERVIDOR = (window.EGUATEX && window.EGUATEX.servidorAvaliacoes) || "";
  if (!secao || !SERVIDOR) return;
  secao.hidden = false;

  const lista = document.getElementById("av-lista");
  const media = document.getElementById("av-media");
  const total = document.getElementById("av-total");
  const estrelasMedia = document.getElementById("av-estrelas-media");
  const form = document.getElementById("av-form");
  const aviso = document.getElementById("av-aviso");
  const grupo = document.getElementById("av-nota");
  const botao = form.querySelector("button[type=submit]");
  const contador = document.getElementById("av-contador");
  const comentario = document.getElementById("av-comentario");

  const ESTRELA = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.6l2.9 6 6.6.8-4.9 4.5 1.3 6.5L12 17.2l-5.9 3.2 1.3-6.5L2.5 9.4l6.6-.8z"/></svg>';

  const pedir = (caminho, opcoes = {}) =>
    window.EGUATEX && window.EGUATEX.simular
      ? window.EGUATEX.simular(caminho, opcoes)
      : fetch(SERVIDOR, opcoes).then(async (r) => {
          const corpo = await r.json();
          return { status: corpo.erro ? 400 : r.status, corpo };
        });

  function desenharEstrelas(alvo, nota) {
    alvo.innerHTML = [1, 2, 3, 4, 5].map((i) => {
      const cheio = Math.max(0, Math.min(1, nota - i + 1));
      return `<span class="estrela" style="--cheio:${Math.round(cheio * 100)}%">${ESTRELA}</span>`;
    }).join("");
  }

  function dataLegivel(texto) {
    const d = new Date(String(texto).replace(" ", "T") + "Z");
    return isNaN(d) ? "" : d.toLocaleDateString("pt-BR", { day: "numeric", month: "long", year: "numeric" });
  }

  function escapar(t) {
    return String(t).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }

  async function carregar() {
    try {
      const { status, corpo } = await pedir("/avaliacoes");
      if (status !== 200) throw new Error();
      media.textContent = corpo.total ? String(corpo.media).replace(".", ",") : "Ainda sem notas";
      desenharEstrelas(estrelasMedia, corpo.media || 0);
      total.textContent = corpo.total === 1 ? "1 avaliação" : `${corpo.total} avaliações`;
      lista.innerHTML = corpo.avaliacoes.length
        ? corpo.avaliacoes.map((a) => `
            <li class="av-item">
              <div class="av-item-topo">
                <strong>${escapar(a.nome)}</strong>
                <span class="av-estrelas" role="img" aria-label="${a.nota} de 5 estrelas">${ESTRELA.repeat(a.nota)}</span>
              </div>
              <p>${escapar(a.comentario).replace(/\n/g, "<br>")}</p>
              <time>${dataLegivel(a.criado_em)}</time>
            </li>`).join("")
        : '<li class="av-vazio">Nenhuma avaliação ainda. Baixou o ÉguaTex? Conte aqui o que achou.</li>';
    } catch {
      lista.innerHTML = '<li class="av-vazio">Não deu para carregar as avaliações agora. Recarregue a página em alguns minutos.</li>';
    }
  }

  /* ---------- escolha das estrelas ---------- */
  function marcar(n) { grupo.dataset.nota = n || ""; }
  grupo.addEventListener("change", () => marcar(form.nota.value));
  grupo.querySelectorAll("label").forEach((l, i) => {
    l.addEventListener("mouseenter", () => { grupo.dataset.previa = i + 1; });
  });
  grupo.addEventListener("mouseleave", () => { delete grupo.dataset.previa; });

  comentario.addEventListener("input", () => { contador.textContent = `${comentario.value.length} de 1000`; });

  /* ---------- envio ---------- */
  function mostrarAviso(texto, tipo) {
    aviso.textContent = texto;
    aviso.className = "av-aviso " + tipo;
    aviso.hidden = false;
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!form.reportValidity()) return;
    if (!form.nota.value) { mostrarAviso("Escolha de 1 a 5 estrelas.", "erro"); grupo.querySelector("input").focus(); return; }

    botao.disabled = true;
    botao.textContent = "Enviando…";
    try {
      const dados = { nome: form.nome.value, nota: Number(form.nota.value), comentario: form.comentario.value, site: form.site.value };
      const { status, corpo } = await pedir("/avaliacoes", {
        method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify(dados),
      });
      if (status >= 400) { mostrarAviso(corpo.erro || "Não deu para enviar. Confira os campos.", "erro"); return; }
      form.reset(); marcar(""); contador.textContent = "0 de 1000";
      mostrarAviso("Avaliação enviada. Obrigado por contar o que achou do ÉguaTex!", "certo");
      carregar();
    } catch {
      mostrarAviso("Sem conexão com o servidor. Confira a internet e tente de novo.", "erro");
    } finally {
      botao.disabled = false;
      botao.textContent = "Enviar avaliação";
    }
  });

  carregar();
})();
