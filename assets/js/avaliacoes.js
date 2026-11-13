// ÉguaTex: seção de avaliações da página inicial (média, lista e formulário).
// O endereço do servidor fica em assets/js/config.js. Sem endereço, a seção fica escondida.
// Moderação: abrir o site com #moderar no fim do endereço e digitar a senha libera o botão Apagar.

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

  let senha = "";
  try { senha = sessionStorage.getItem("eguatex-moderacao") || ""; } catch {}

  const pedir = (caminho, opcoes = {}) => {
    if (senha && caminho.startsWith("/admin")) opcoes = { ...opcoes, headers: { ...(opcoes.headers || {}), Authorization: `Bearer ${senha}` } };
    return window.EGUATEX && window.EGUATEX.simular
      ? window.EGUATEX.simular(caminho, opcoes)
      : fetch(SERVIDOR.replace(/\/$/, "") + caminho, opcoes).then(async (r) => ({ status: r.status, corpo: await r.json() }));
  };

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
            <li class="av-item" data-id="${a.id}">
              <div class="av-item-topo">
                <strong>${escapar(a.nome)}</strong>
                <span class="av-estrelas" role="img" aria-label="${a.nota} de 5 estrelas">${ESTRELA.repeat(a.nota)}</span>
              </div>
              <p>${escapar(a.comentario).replace(/\n/g, "<br>")}</p>
              <time>${dataLegivel(a.criado_em)}</time>
              <button type="button" class="av-apagar">Apagar</button>
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
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(dados),
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

  /* ---------- moderação (só com #moderar no endereço e a senha) ---------- */
  const caixa = document.createElement("form");
  caixa.className = "av-moderar";
  caixa.hidden = true;
  caixa.innerHTML = `
    <label for="av-senha">Senha de moderação</label>
    <input id="av-senha" type="password" autocomplete="current-password" required>
    <button type="submit" class="botao botao-linha pequeno">Entrar</button>
    <span class="av-moderar-msg" role="status"></span>`;
  secao.querySelector(".secao-cabeca").after(caixa);
  const msgModerar = caixa.querySelector(".av-moderar-msg");

  const sairModeracao = document.createElement("button");
  sairModeracao.type = "button";
  sairModeracao.className = "botao botao-linha pequeno av-sair";
  sairModeracao.textContent = "Sair da moderação";
  sairModeracao.hidden = true;
  secao.querySelector(".secao-cabeca").after(sairModeracao);

  function modoModeracao(ligado) {
    secao.classList.toggle("moderando", ligado);
    sairModeracao.hidden = !ligado;
    caixa.hidden = ligado || location.hash !== "#moderar";
  }

  async function conferirSenha() {
    const { status } = await pedir("/admin/verificar");
    if (status === 200) { modoModeracao(true); return true; }
    senha = ""; try { sessionStorage.removeItem("eguatex-moderacao"); } catch {}
    modoModeracao(false);
    return false;
  }

  caixa.addEventListener("submit", async (e) => {
    e.preventDefault();
    senha = caixa.querySelector("input").value;
    msgModerar.textContent = "Conferindo…";
    if (await conferirSenha()) {
      try { sessionStorage.setItem("eguatex-moderacao", senha); } catch {}
      msgModerar.textContent = "";
      caixa.reset();
    } else msgModerar.textContent = "Senha incorreta.";
  });

  sairModeracao.addEventListener("click", () => {
    senha = ""; try { sessionStorage.removeItem("eguatex-moderacao"); } catch {}
    history.replaceState(null, "", location.pathname);
    modoModeracao(false);
  });

  lista.addEventListener("click", async (e) => {
    const b = e.target.closest(".av-apagar");
    if (!b || !secao.classList.contains("moderando")) return;
    if (!b.dataset.confirmar) { b.dataset.confirmar = "1"; b.textContent = "Confirmar: apagar de vez"; return; }
    b.disabled = true;
    const { status } = await pedir(`/admin/avaliacoes/${b.closest("li").dataset.id}`, { method: "DELETE" });
    if (status !== 200) { b.disabled = false; b.textContent = "Não deu para apagar. Tentar de novo"; delete b.dataset.confirmar; return; }
    carregar();
  });

  function verEndereco() {
    if (location.hash === "#moderar") {
      caixa.hidden = secao.classList.contains("moderando");
      secao.scrollIntoView();
    }
  }
  addEventListener("hashchange", verEndereco);

  carregar();
  if (senha) conferirSenha();
  verEndereco();
})();
