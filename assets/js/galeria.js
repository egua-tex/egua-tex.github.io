// ÉguaTex: página de templates (busca, filtros, cartões que viram para mostrar o código e entradas animadas).

(() => {
  const raiz = document.documentElement;
  const calmo = raiz.classList.contains("calmo");
  const cards = [...document.querySelectorAll(".categoria")];
  const campo = document.getElementById("busca");
  const vazio = document.getElementById("busca-vazia");
  const botoesFiltro = [...document.querySelectorAll(".filtros button")];
  let filtro = "todas";

  /* ---------- verso de cada cartão: o começo do código do template ---------- */
  const colorir = (linha) => linha
    .replace(/&/g, "&amp;").replace(/</g, "&lt;")
    .replace(/(\\[a-zA-Z]+\*?)/g, '<span class="cmd">$1</span>')
    .replace(/\{([^{}]*)\}/g, '{<span class="arg">$1</span>}');

  cards.forEach((card) => {
    const arte = card.querySelector(".cat-arte");
    const giro = document.createElement("div");
    giro.className = "cat-giro";
    arte.replaceWith(giro);
    arte.classList.add("cat-frente");
    giro.appendChild(arte);
    const verso = document.createElement("div");
    verso.className = "cat-verso";
    verso.setAttribute("aria-hidden", "true");
    verso.innerHTML = `<pre>${card.dataset.trecho.split("|").map(colorir).join("\n")}</pre>`;
    giro.appendChild(verso);

    // No celular não existe "passar o mouse": um toque vira o cartão.
    giro.addEventListener("click", () => {
      if (matchMedia("(hover: none)").matches) card.classList.toggle("virado");
    });
  });

  /* ---------- busca e filtros ---------- */
  const semAcento = (t) => t.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

  function aplicar() {
    const termos = semAcento(campo.value).split(/\s+/).filter(Boolean);
    let visiveis = 0;
    cards.forEach((c) => {
      const texto = semAcento(c.dataset.busca + " " + c.dataset.classe + " " + c.querySelector("h3").textContent + " " + c.querySelector("p").textContent);
      const mostra = (filtro === "todas" || c.dataset.grupo === filtro) && termos.every((t) => texto.includes(t));
      c.hidden = !mostra;
      if (mostra) visiveis++;
    });
    vazio.hidden = visiveis > 0;
  }

  // Quando o navegador permite, os cartões deslizam para o novo lugar ao filtrar.
  const comTransicao = (fn) => (!calmo && document.startViewTransition ? document.startViewTransition(fn) : fn());

  cards.forEach((c, i) => { c.style.viewTransitionName = `categoria-${i}`; });

  botoesFiltro.forEach((b) => b.addEventListener("click", () => {
    filtro = b.dataset.filtro;
    botoesFiltro.forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
    comTransicao(aplicar);
  }));
  document.getElementById("busca-form").addEventListener("submit", (e) => e.preventDefault());
  campo.addEventListener("input", aplicar);

  if (calmo) return;

  /* ---------- cartões entram em sequência ao aparecer na tela ---------- */
  const lista = document.getElementById("categorias");
  lista.classList.add("animar");
  const observador = new IntersectionObserver((entradas) => {
    entradas.filter((e) => e.isIntersecting).forEach((e, i) => {
      e.target.style.transitionDelay = `${i * 90}ms`;
      e.target.classList.add("visto");
      observador.unobserve(e.target);
    });
  }, { threshold: 0.15 });
  cards.forEach((c) => observador.observe(c));
})();
