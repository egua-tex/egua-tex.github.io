// ÉguaTex: tela de carregamento, entradas animadas, portal do código ao PDF, vaga-lumes e editor que se digita.
(() => {
  const raiz = document.documentElement;
  const calmo = () => raiz.classList.contains("calmo");
  const carregando = document.getElementById("carregando");
  const abertura = document.querySelector(".abertura");

  /* ---------- entrada do título: letra por letra, do desfocado ao nítido ---------- */
  function prepararTitulo() {
    const h1 = document.getElementById("titulo");
    const letras = [...h1.textContent];
    h1.innerHTML = letras.map((l, i) =>
      `<span class="letra${i === 0 ? " acento" : ""}" aria-hidden="true" style="transition-delay:${i * 70}ms">${l}</span>`
    ).join("");
    const lema = document.getElementById("lema");
    const palavras = lema.textContent.split(" ");
    lema.setAttribute("aria-label", lema.textContent);
    lema.innerHTML = palavras.map((p, i) =>
      `<span class="palavra-lema" aria-hidden="true" style="transition-delay:${500 + i * 55}ms">${p}${i < palavras.length - 1 ? " " : ""}</span>`
    ).join("");
    abertura.querySelector(".apoio").style.transitionDelay = "1.1s";
    abertura.querySelector(".acoes").style.transitionDelay = "1.3s";
  }
  function revelarAbertura() {
    abertura.classList.remove("revelar");
    void abertura.offsetWidth;
    requestAnimationFrame(() => abertura.classList.add("revelar"));
  }
  prepararTitulo();

  /* ---------- tela de carregamento: só se a página passar de 400 ms ---------- */
  let mostrou = false, inicio = 0;
  const timer = setTimeout(() => { mostrou = true; inicio = performance.now(); carregando.classList.add("mostrar"); }, 400);
  function terminar() {
    clearTimeout(timer);
    const espera = mostrou ? Math.max(0, 900 - (performance.now() - inicio)) : 0;
    setTimeout(() => { carregando.classList.remove("mostrar"); revelarAbertura(); }, espera);
  }
  if (document.readyState === "complete") terminar(); else addEventListener("load", terminar, { once: true });

  if (calmo()) { abertura.classList.add("revelar"); return; }

  /* ---------- curupira segue o mouse de leve ---------- */
  const figura = document.getElementById("figura");
  const img = figura.querySelector(".logo-viva"), brasa = figura.querySelector(".brasa");
  if (matchMedia("(pointer: fine)").matches) {
    addEventListener("pointermove", (e) => {
      const x = e.clientX / innerWidth - 0.5, y = e.clientY / innerHeight - 0.5;
      img.style.transform = `rotateY(${x * 14}deg) rotateX(${-y * 10}deg)`;
      brasa.style.transform = `translate(${-x * 30}px, ${-y * 24}px)`;
    });
  }


  /* ---------- o cabelo do curupira pega fogo: labaredas e faíscas ---------- */
  (() => {
    const tela = figura.querySelector(".chamas");
    if (!tela) return;
    const ctx = tela.getContext("2d");
    const dpr = Math.min(2, devicePixelRatio || 1);
    // A tela das chamas é 120% x 126% da logo, deslocada 10% para a esquerda e 26% para cima.
    const DX = 0.10 / 1.2, DY = 0.26 / 1.26, LX = 1 / 1.2, LY = 1 / 1.26;
    const CABECA = [0.64, 0.70]; // de onde o fogo começa a se espalhar
    let w = 0, h = 0, escala = 1, pontos = [], chamas = [], faiscas = [];
    let ativo = false, inicio = 0;

    // Desenho de cada língua de fogo: um brilho redondo, do miolo claro à borda transparente.
    function sprite(miolo, meio, borda) {
      const c = document.createElement("canvas"); c.width = c.height = 64;
      const g = c.getContext("2d"), r = g.createRadialGradient(32, 32, 0, 32, 32, 32);
      r.addColorStop(0, miolo); r.addColorStop(0.35, meio); r.addColorStop(1, borda);
      g.fillStyle = r; g.fillRect(0, 0, 64, 64); return c;
    }
    const FASES = [
      sprite("rgba(255,250,220,1)", "rgba(255,210,80,.85)", "rgba(255,150,30,0)"),
      sprite("rgba(255,220,120,1)", "rgba(255,130,30,.75)", "rgba(230,60,20,0)"),
      sprite("rgba(255,150,60,.9)", "rgba(224,50,40,.55)", "rgba(120,20,60,0)"),
    ];

    function medir() {
      w = tela.clientWidth; h = tela.clientHeight; escala = w / 640;
      tela.width = w * dpr; tela.height = h * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    // As labaredas nascem na borda de cima de cada mecha do cabelo.
    const fonte = new Image();
    fonte.src = figura.querySelector(".cabelo").currentSrc || figura.querySelector(".cabelo").src;
    fonte.onload = () => {
      const N = 140, c = document.createElement("canvas"); c.width = c.height = N;
      const g = c.getContext("2d"); g.drawImage(fonte, 0, 0, N, N);
      const d = g.getImageData(0, 0, N, N).data;
      for (let y = 2; y < N; y += 2) for (let x = 0; x < N; x += 2) {
        if (d[(y * N + x) * 4 + 3] < 200) continue;
        const px = x / N, py = y / N;
        const borda = d[((y - 2) * N + x) * 4 + 3] < 40;
        // pontos da borda de cima entram mais vezes: ali o fogo é mais forte
        const vezes = borda ? 4 : (py < 0.42 ? 1 : 0);
        for (let k = 0; k < vezes; k++) pontos.push({ x: px, y: py, dist: Math.hypot(px - CABECA[0], py - CABECA[1]), ponta: 1 - py });
      }
    };

    const naTela = (p) => [(DX + p.x * LX) * w, (DY + p.y * LY) * h];

    function quadro(agora) {
      if (!ativo) return;
      ctx.clearRect(0, 0, w, h);
      const t = inicio ? (agora - inicio) / 1000 : 0;
      // O fogo se espalha da cabeça até as pontas em cerca de 2,5 segundos.
      const alcance = Math.min(1.2, t * 0.5);
      const forca = Math.min(1, t / 2.5);
      if (inicio && pontos.length) {
        const acesos = pontos.filter((p) => p.dist < alcance);
        const novas = Math.round((3 + 7 * forca) * Math.max(0.35, Math.min(1, acesos.length / 300)));
        for (let i = 0; i < novas && acesos.length && chamas.length < 300; i++) {
          const p = acesos[(Math.random() * acesos.length) | 0];
          const [x, y] = naTela(p);
          const alta = 0.55 + p.ponta * 0.9; // mechas mais altas soltam labaredas maiores
          chamas.push({ x: x + (Math.random() - 0.5) * 6 * escala, y, vx: (Math.random() - 0.5) * 0.5 * escala - 0.15 * escala,
                        vy: -(1.4 + Math.random() * 1.8) * escala * alta, vida: 0, max: 18 + Math.random() * 22,
                        r: (9 + Math.random() * 13) * escala * alta, fase: Math.random() * 6.28 });
          if (Math.random() < 0.08 * forca) faiscas.push({ x, y, vx: (Math.random() - 0.6) * 0.8 * escala, vy: -(1.2 + Math.random() * 1.6) * escala,
                                                           vida: 0, max: 50 + Math.random() * 60, r: (0.8 + Math.random() * 1.4) * escala });
        }
      }
      ctx.globalCompositeOperation = "lighter";
      chamas = chamas.filter((c) => c.vida < c.max);
      for (const c of chamas) {
        c.vida++;
        const k = c.vida / c.max;
        c.x += c.vx + Math.sin(c.vida * 0.45 + c.fase) * 0.6 * escala;
        c.y += c.vy; c.vy *= 0.985;
        const tam = c.r * (1 - k * 0.6);
        ctx.globalAlpha = Math.min(1, k * 6) * Math.pow(1 - k, 1.3) * 0.5;
        ctx.drawImage(FASES[k < 0.3 ? 0 : k < 0.65 ? 1 : 2], c.x - tam * 0.75, c.y - tam * 2.6, tam * 1.5, tam * 3.4);
      }
      ctx.globalCompositeOperation = "lighter";
      faiscas = faiscas.filter((f) => f.vida < f.max);
      for (const f of faiscas) {
        f.vida++; f.x += f.vx + Math.sin(f.vida / 6) * 0.35 * escala; f.y += f.vy; f.vy *= 0.993;
        const k = f.vida / f.max;
        ctx.globalAlpha = (1 - k) * 0.95;
        ctx.fillStyle = k < 0.4 ? "#ffe39a" : k < 0.75 ? "#ff9a3c" : "#e8473c";
        ctx.beginPath(); ctx.arc(f.x, f.y, f.r * (1 - k * 0.5), 0, 6.29); ctx.fill();
      }
      ctx.globalAlpha = 1; ctx.globalCompositeOperation = "source-over";
      requestAnimationFrame(quadro);
    }

    medir(); addEventListener("resize", medir);
    // O fogo pega depois que a logo termina de aparecer.
    const acender = () => setTimeout(() => { inicio = performance.now(); }, 1100);
    if (abertura.classList.contains("revelar")) acender();
    else new MutationObserver((m, o) => { if (abertura.classList.contains("revelar")) { o.disconnect(); acender(); } })
      .observe(abertura, { attributes: true, attributeFilter: ["class"] });
    new IntersectionObserver((e) => {
      const antes = ativo; ativo = e[0].isIntersecting;
      if (ativo && !antes) requestAnimationFrame(quadro);
    }).observe(tela);
  })();

  /* ---------- portal: rolagem gira o cartão e troca as legendas ---------- */
  const portal = document.getElementById("portal");
  const cartao = document.getElementById("cartao");
  const legA = document.getElementById("leg-a"), legB = document.getElementById("leg-b");
  const suave = (t) => t * t * (3 - 2 * t);
  const lerp = (a, b, t) => a + (b - a) * t;
  function rolar() {
    const r = portal.getBoundingClientRect();
    const total = portal.offsetHeight - innerHeight;
    const p = Math.min(1, Math.max(0, -r.top / total));
    const g = suave(Math.min(1, Math.max(0, (p - 0.3) / 0.4)));
    const estreito = innerWidth <= 760;
    const [l0, h0, l1, h1] = estreito ? [200, 300, 230, 325] : [250, 380, 340, 480];
    cartao.style.setProperty("--giro", `${g * 180 - (1 - g) * 8 * Math.sin(p * 6)}deg`);
    cartao.style.setProperty("--larg", `${lerp(l0, l1, g)}px`);
    cartao.style.setProperty("--alt", `${lerp(h0, h1, g)}px`);
    legA.classList.toggle("some", g > 0.5);
    legB.classList.toggle("some", g <= 0.5);
  }
  addEventListener("scroll", () => requestAnimationFrame(rolar), { passive: true });
  addEventListener("resize", rolar);
  rolar();

  /* equação do PDF com KaTeX, se ele carregou */
  if (window.katex) { const eq = document.getElementById("eq-pdf"); katex.render(eq.dataset.tex, eq, { throwOnError: false, displayMode: true }); }


  /* ---------- topo: encolhe e mostra progresso da leitura ---------- */
  const topo = document.querySelector(".topo");
  function progresso() {
    const max = document.documentElement.scrollHeight - innerHeight;
    topo.style.setProperty("--lido", max > 0 ? (scrollY / max).toFixed(4) : 0);
    topo.classList.toggle("rolou", scrollY > 20);
  }
  addEventListener("scroll", () => requestAnimationFrame(progresso), { passive: true });
  progresso();

  /* ---------- elementos que surgem ao entrar na tela ---------- */
  const observador = new IntersectionObserver((ents) => {
    ents.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("visto"); observador.unobserve(e.target); } });
  }, { threshold: 0.25 });
  document.querySelectorAll(".surge, .passos").forEach((el) => observador.observe(el));

  /* ---------- vaga-lumes ---------- */
  document.querySelectorAll("canvas.vagalumes").forEach((cv) => {
    const ctx = cv.getContext("2d");
    let w = 0, h = 0, ativo = false, luzes = [];
    const dpr = Math.min(2, devicePixelRatio || 1);
    function medir() {
      w = cv.clientWidth; h = cv.clientHeight;
      cv.width = w * dpr; cv.height = h * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const n = Math.round(Math.min(34, w / 40));
      luzes = Array.from({ length: n }, () => ({
        x: Math.random() * w, y: h * (0.15 + Math.random() * 0.8),
        r: 1.2 + Math.random() * 1.8, fase: Math.random() * 6.28,
        vx: (Math.random() - 0.5) * 0.25, vy: (Math.random() - 0.5) * 0.18,
        cor: Math.random() < 0.7 ? "214,255,120" : "255,182,39",
      }));
    }
    function quadro(t) {
      if (!ativo) return;
      ctx.clearRect(0, 0, w, h);
      for (const l of luzes) {
        l.x += l.vx + Math.sin(t / 2400 + l.fase) * 0.15;
        l.y += l.vy + Math.cos(t / 2000 + l.fase) * 0.12;
        if (l.x < -10) l.x = w + 10; if (l.x > w + 10) l.x = -10;
        if (l.y < 0) l.y = h; if (l.y > h) l.y = 0;
        const a = Math.max(0, Math.sin(t / 900 + l.fase)) ** 2;
        const g = ctx.createRadialGradient(l.x, l.y, 0, l.x, l.y, l.r * 7);
        g.addColorStop(0, `rgba(${l.cor},${0.9 * a})`); g.addColorStop(1, `rgba(${l.cor},0)`);
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(l.x, l.y, l.r * 7, 0, 6.29); ctx.fill();
      }
      requestAnimationFrame(quadro);
    }
    medir(); addEventListener("resize", medir);
    new IntersectionObserver((ents) => {
      const antes = ativo; ativo = ents[0].isIntersecting;
      if (ativo && !antes) requestAnimationFrame(quadro);
    }).observe(cv);
  });

  /* ---------- editor: a fórmula se escreve sozinha ---------- */
  const entrada = document.getElementById("entrada");
  const saida = document.getElementById("saida");
  const painel = entrada.closest(".painel-codigo");
  let digitacao = 0;
  function digitar(texto) {
    const id = ++digitacao;
    painel.classList.add("digitando");
    let i = 0;
    entrada.value = "";
    (function passo() {
      if (id !== digitacao) return;
      i = Math.min(texto.length, i + 1 + (Math.random() < 0.3 ? 1 : 0));
      entrada.value = texto.slice(0, i);
      try { katex.render(entrada.value, saida, { displayMode: true, throwOnError: true }); } catch (e) {}
      if (i < texto.length) setTimeout(passo, 28 + Math.random() * 40);
      else { painel.classList.remove("digitando"); renderizar(); }
    })();
  }
  entrada.addEventListener("input", () => { digitacao++; painel.classList.remove("digitando"); });
  document.querySelectorAll(".exemplos button").forEach((b) =>
    b.addEventListener("click", () => window.katex && digitar(EXEMPLOS[b.dataset.ex]))
  );
  new IntersectionObserver((ents, obs) => {
    if (ents[0].isIntersecting && window.katex) { digitar(entrada.value); obs.disconnect(); }
  }, { threshold: 0.5 }).observe(document.querySelector(".editor"));

  /* ---------- pegadas aparecem ao contrário, como o curupira anda ---------- */
  const rastro = document.getElementById("rastro");
  const pes = [...rastro.querySelectorAll("use")];
  pes.forEach((pe, i) => pe.style.animationDelay = `${i * 0.42}s`);
  new IntersectionObserver((ents) => {
    rastro.classList.toggle("andou", ents[0].isIntersecting);
  }, { threshold: 0.2 }).observe(rastro);
})();
