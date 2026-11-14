// ÉguaTex: editor de fórmulas ao vivo e busca da versão mais recente dos instaladores (Windows, Android e Linux).

const REPO = "egua-tex/egua-tex.github.io";

/* ---------------- Experimente: LaTeX ao vivo ---------------- */
const EXEMPLOS = {
  bhaskara: "x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}",
  gauss: "\\int_{-\\infty}^{\\infty} e^{-x^2}\\,dx = \\sqrt{\\pi}",
  euler: "e^{i\\pi} + 1 = 0",
  matriz: "A = \\begin{pmatrix} 1 & 2 \\\\ 3 & 4 \\end{pmatrix},\\quad \\det A = -2",
  soma: "\\sum_{n=1}^{\\infty} \\frac{1}{n^2} = \\frac{\\pi^2}{6}",
};

const entrada = document.getElementById("entrada");
const saida = document.getElementById("saida");
const erro = document.getElementById("erro");
const botoesExemplo = document.querySelectorAll(".exemplos button");

function renderizar() {
  if (!window.katex) {
    saida.textContent = "Não deu para carregar o motor de fórmulas. Confira a conexão e recarregue a página.";
    return;
  }
  const codigo = entrada.value.trim();
  if (!codigo) {
    saida.textContent = "Escreva uma fórmula ao lado para ver ela aqui.";
    erro.hidden = true;
    return;
  }
  try {
    katex.render(codigo, saida, { displayMode: true, throwOnError: true });
    erro.hidden = true;
  } catch (e) {
    erro.textContent = "Essa fórmula tem um erro: " + e.message.replace(/^KaTeX parse error:\s*/, "");
    erro.hidden = false;
  }
}

function escolherExemplo(chave) {
  entrada.value = EXEMPLOS[chave];
  botoesExemplo.forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.ex === chave)));
  renderizar();
}

botoesExemplo.forEach((b) => b.addEventListener("click", () => escolherExemplo(b.dataset.ex)));
entrada.addEventListener("input", () => {
  botoesExemplo.forEach((b) => b.setAttribute("aria-pressed", "false"));
  renderizar();
});

entrada.value = EXEMPLOS.bhaskara;
// o script do KaTeX é carregado com defer antes deste, então já está disponível
renderizar();

/* ---------------- Baixar: versão mais recente no GitHub ---------------- */
const estado = document.getElementById("release-estado");
const detalhes = document.getElementById("release-detalhes");

// Cada sistema procura o seu arquivo na publicação mais recente.
const PLATAFORMAS = [
  { id: "p-windows", acha: (n) => n.endsWith("-setup.exe") || n.endsWith(".exe") || n.endsWith(".msi") },
  { id: "p-android", acha: (n) => n.endsWith(".apk") },
  { id: "p-linux", acha: (n) => n.endsWith(".appimage") || n.endsWith(".deb") || n.endsWith(".rpm") },
];

function tamanhoLegivel(bytes) {
  const mb = bytes / (1024 * 1024);
  return mb >= 1 ? mb.toFixed(1).replace(".", ",") + " MB" : Math.round(bytes / 1024) + " KB";
}

function ligar(id, arquivo) {
  const caixa = document.getElementById(id);
  if (!caixa) return;
  const atual = caixa.querySelector(".botao");
  const link = document.createElement("a");
  link.className = "botao botao-fogo";
  link.href = arquivo.browser_download_url;
  link.textContent = "Baixar";
  atual.replaceWith(link);
  caixa.querySelector(".tam").textContent = tamanhoLegivel(arquivo.size);
  caixa.classList.add("pronto");
}

function aguardando(id) {
  const caixa = document.getElementById(id);
  if (!caixa || caixa.classList.contains("pronto")) return;
  const atual = caixa.querySelector(".botao");
  const aviso = document.createElement("span");
  aviso.className = "botao botao-linha desligado";
  aviso.setAttribute("aria-disabled", "true");
  aviso.textContent = "Em breve";
  atual.replaceWith(aviso);
}

async function buscarVersao() {
  try {
    const resp = await fetch(`https://api.github.com/repos/${REPO}/releases/latest`, {
      headers: { Accept: "application/vnd.github+json" },
    });
    if (resp.status === 404) {
      estado.textContent = "Ainda não há uma versão publicada. Assim que os instaladores saírem, os botões abaixo passam a baixar o arquivo direto.";
      PLATAFORMAS.forEach((p) => aguardando(p.id));
      return;
    }
    if (!resp.ok) throw new Error("status " + resp.status);

    const release = await resp.json();
    const arquivos = release.assets || [];
    let algum = false;
    PLATAFORMAS.forEach((p) => {
      const arquivo = arquivos.find((a) => p.acha(a.name.toLowerCase()));
      if (arquivo) { ligar(p.id, arquivo); algum = true; } else aguardando(p.id);
    });
    if (!algum) {
      estado.textContent = `A versão ${release.tag_name} foi publicada, mas ainda sem instaladores. Veja todas as versões.`;
      return;
    }
    document.getElementById("r-versao").textContent = release.tag_name;
    document.getElementById("r-data").textContent = new Date(release.published_at)
      .toLocaleDateString("pt-BR", { day: "numeric", month: "long", year: "numeric" });
    estado.textContent = "Versão mais recente, pronta para instalar. Escolha o seu sistema.";
    detalhes.hidden = false;
  } catch (e) {
    estado.textContent = "Não deu para consultar o GitHub agora. Os botões levam à página de versões, onde ficam os instaladores.";
  }
}

buscarVersao();
