// ÉguaTex — fogueira de fórmulas e busca da versão mais recente do APK.

const REPO = "jessicamelo0532/egua-tex";

/* ---------------- Fogueira: LaTeX ao vivo ---------------- */
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
const botao = document.getElementById("r-botao");

function tamanhoLegivel(bytes) {
  const mb = bytes / (1024 * 1024);
  return mb >= 1 ? mb.toFixed(1).replace(".", ",") + " MB" : Math.round(bytes / 1024) + " KB";
}

async function buscarVersao() {
  try {
    const resp = await fetch(`https://api.github.com/repos/${REPO}/releases/latest`, {
      headers: { Accept: "application/vnd.github+json" },
    });
    if (resp.status === 404) {
      estado.textContent = "Ainda não há uma versão publicada. Assim que o APK for lançado, o botão abaixo passa a baixar o arquivo direto.";
      return;
    }
    if (!resp.ok) throw new Error("status " + resp.status);

    const release = await resp.json();
    const apk = (release.assets || []).find((a) => a.name.toLowerCase().endsWith(".apk"));
    if (!apk) {
      estado.textContent = `A versão ${release.tag_name} foi publicada, mas ainda sem o arquivo APK. Veja a página de versões.`;
      return;
    }

    document.getElementById("r-versao").textContent = release.tag_name;
    document.getElementById("r-data").textContent = new Date(release.published_at)
      .toLocaleDateString("pt-BR", { day: "numeric", month: "long", year: "numeric" });
    document.getElementById("r-tamanho").textContent = tamanhoLegivel(apk.size);
    botao.href = apk.browser_download_url;
    botao.textContent = "Baixar o APK";
    estado.textContent = "Versão mais recente, pronta para instalar.";
    detalhes.hidden = false;
  } catch (e) {
    estado.textContent = "Não deu para consultar o GitHub agora. O botão abaixo leva à página de versões, onde o APK fica.";
  }
}

buscarVersao();
