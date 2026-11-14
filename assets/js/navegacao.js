// ÉguaTex: menu no celular e tela de carregamento ao trocar de aba (vale para todas as páginas).

(() => {
  const TEMPO_TROCA = 1500; // quanto tempo a tela do curupira fica ao trocar de aba, em milissegundos

  /* ---------- contador de visitas (GoatCounter: sem cookies e sem dados pessoais) ---------- */
  const cfg = window.EGUATEX || {};
  if (cfg.contadorVisitas && !document.body.hasAttribute("data-sem-contagem")) {
    const contador = document.createElement("script");
    contador.async = true;
    contador.src = "https://gc.zgo.at/count.js";
    contador.dataset.goatcounter = `https://${cfg.contadorVisitas}.goatcounter.com/count`;
    document.head.appendChild(contador);
  }

  /* ---------- tela de carregamento ---------- */
  const pegadas = [30, 70, 110, 150, 190, 230, 270, 310]
    .map((x, i) => `<use href="#pe-carga" transform="translate(${x} ${i % 2 ? 44 : 18}) rotate(90)"/>`)
    .join("");

  document.body.insertAdjacentHTML("afterbegin", `
    <div class="carregando" id="carregando" role="status" aria-live="polite" aria-label="Carregando o ÉguaTex">
      <div class="carregando-centro">
        <img class="carregando-logo" src="assets/img/curupira-256.png" alt="" width="176" height="176">
        <div class="carregando-fundo" aria-hidden="true"><span>ÉguaTex</span></div>
        <div class="trilha">
          <svg class="pegadas-carga" viewBox="0 0 360 64" aria-hidden="true">
            <defs>
              <g id="pe-carga">
                <ellipse cx="0" cy="0" rx="9" ry="15" />
                <circle cx="-7" cy="19" r="3.2" />
                <circle cx="-1" cy="22" r="3.4" />
                <circle cx="5" cy="21" r="3" />
                <circle cx="10" cy="17" r="2.6" />
              </g>
            </defs>
            ${pegadas}
          </svg>
        </div>
        <p class="carregando-texto">Seguindo as pegadas do curupira…</p>
        <p class="carregando-dica">Os pés do curupira apontam para um lado e ele anda para o outro.</p>
      </div>
    </div>`);

  const tela = document.getElementById("carregando");
  const mostrar = () => tela.classList.add("mostrar");
  const esconder = () => tela.classList.remove("mostrar");

  // Ao voltar com o botão "Voltar" do navegador, a página pode reaparecer com a tela ainda aberta.
  addEventListener("pageshow", (e) => { if (e.persisted) esconder(); });

  /* ---------- menu no celular ---------- */
  const topo = document.querySelector(".topo");
  const nav = topo && topo.querySelector("nav");
  if (nav) {
    nav.id = nav.id || "menu-principal";
    const botao = document.createElement("button");
    botao.type = "button";
    botao.className = "menu-botao";
    botao.setAttribute("aria-controls", nav.id);
    botao.setAttribute("aria-expanded", "false");
    botao.innerHTML = '<span class="menu-icone" aria-hidden="true"></span><span class="menu-rotulo">Menu</span>';
    topo.appendChild(botao);
    topo.classList.add("tem-menu");

    const rotulo = botao.querySelector(".menu-rotulo");
    const abrir = (sim) => {
      topo.classList.toggle("aberto", sim);
      botao.setAttribute("aria-expanded", String(sim));
      rotulo.textContent = sim ? "Fechar" : "Menu";
    };
    botao.addEventListener("click", () => abrir(!topo.classList.contains("aberto")));
    document.addEventListener("keydown", (e) => { if (e.key === "Escape") abrir(false); });
    document.addEventListener("click", (e) => { if (!topo.contains(e.target)) abrir(false); });
    nav.addEventListener("click", (e) => { if (e.target.closest("a")) abrir(false); });
  }

  /* ---------- trocar de aba com a tela do curupira ---------- */
  const semIndex = (caminho) => caminho.replace(/index\.html$/, "");

  document.addEventListener("click", (e) => {
    const link = e.target.closest(".topo nav a, .marca, .rodape-conteudo a");
    if (!link || e.defaultPrevented || e.button !== 0) return;
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || link.target === "_blank") return;

    const destino = new URL(link.href, location.href);
    if (destino.origin !== location.origin) return; // links para outros sites seguem normais

    e.preventDefault();
    mostrar();

    if (semIndex(destino.pathname) !== semIndex(location.pathname)) {
      setTimeout(() => { location.href = destino.href; }, TEMPO_TROCA);
      return;
    }

    // Mesma página: troca de seção por trás da tela e depois revela.
    setTimeout(() => {
      const raiz = document.documentElement;
      const id = decodeURIComponent(destino.hash.slice(1));
      const alvo = id && document.getElementById(id);
      raiz.style.scrollBehavior = "auto";
      if (alvo) alvo.scrollIntoView(); else scrollTo(0, 0);
      raiz.style.scrollBehavior = "";
      history.pushState(null, "", destino.hash || location.pathname);
    }, TEMPO_TROCA - 350);
    setTimeout(esconder, TEMPO_TROCA);
  });
})();
