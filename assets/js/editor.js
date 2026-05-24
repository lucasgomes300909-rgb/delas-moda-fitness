(function () {
  const STORAGE_KEY = "DELAS_EDITOR_DRAFT_V3";
  const baseConfig = window.DELAS_CONFIG || {};
  let config = loadDraft() || clone(baseConfig);
  let activeTab = "inicio";
  let selectedProductId = config.products?.[0]?.id || null;

  const tabs = [
    { id: "inicio", label: "Início", icon: "🏠" },
    { id: "loja", label: "Loja", icon: "💎" },
    { id: "visual", label: "Visual", icon: "🎨" },
    { id: "capa", label: "Capa", icon: "⚡" },
    { id: "produtos", label: "Produtos", icon: "🛍️" },
    { id: "categorias", label: "Categorias", icon: "🏷️" },
    { id: "secoes", label: "Seções", icon: "📍" },
    { id: "seo", label: "SEO", icon: "🔎" },
    { id: "publicar", label: "Publicar", icon: "🚀" },
    { id: "ajuda", label: "Ajuda", icon: "❔" }
  ];

  const tabList = document.getElementById("tabList");
  const editorContent = document.getElementById("editorContent");
  const preview = document.getElementById("sitePreview");
  const previewStage = document.getElementById("previewStage");
  const toastEl = document.getElementById("toast");

  function clone(value) { return JSON.parse(JSON.stringify(value || {})); }
  function loadDraft() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (error) { return null; }
  }
  function saveDraft(silent = false) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    if (!silent) toast("Prévia salva neste navegador.");
  }
  function escapeHTML(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }
  function getPath(path) {
    return path.split(".").reduce((acc, key) => (acc ? acc[key] : undefined), config);
  }
  function setPath(path, value) {
    const parts = path.split(".");
    let obj = config;
    parts.slice(0, -1).forEach((key) => {
      if (!obj[key] || typeof obj[key] !== "object") obj[key] = {};
      obj = obj[key];
    });
    obj[parts.at(-1)] = value;
  }
  function slug(text) {
    return String(text || "produto")
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "produto";
  }
  function parseList(value) {
    return String(value || "").split(/[,\n]/).map((item) => item.trim()).filter(Boolean);
  }
  function formatList(list) { return (list || []).join(", "); }
  function money(value) { return Number(value || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" }); }
  function toast(message) {
    toastEl.textContent = message;
    toastEl.classList.add("show");
    clearTimeout(toastEl._timer);
    toastEl._timer = setTimeout(() => toastEl.classList.remove("show"), 2600);
  }
  function postPreview() {
    saveDraft(true);
    preview?.contentWindow?.postMessage({ type: "DELAS_CONFIG_PREVIEW", config: clone(config) }, "*");
  }
  preview.addEventListener("load", () => setTimeout(postPreview, 200));

  function renderTabs() {
    tabList.innerHTML = tabs.map((tab) => `
      <button class="tab-button ${activeTab === tab.id ? "active" : ""}" type="button" data-tab="${tab.id}">
        <span class="tab-icon">${tab.icon}</span><span>${tab.label}</span>
      </button>`).join("");
    tabList.querySelectorAll("button").forEach((btn) => btn.addEventListener("click", () => {
      activeTab = btn.dataset.tab;
      render();
    }));
  }

  function input(label, path, opts = {}) {
    const value = getPath(path) ?? "";
    const type = opts.type || "text";
    const help = opts.help ? `<small>${opts.help}</small>` : "";
    const placeholder = opts.placeholder ? `placeholder="${escapeHTML(opts.placeholder)}"` : "";
    return `<div class="field"><label>${label}</label><input class="input js-field" data-path="${path}" data-type="${type}" type="${type === "number" ? "number" : type}" value="${escapeHTML(value)}" ${placeholder} />${help}</div>`;
  }
  function textarea(label, path, opts = {}) {
    const value = getPath(path) ?? "";
    const help = opts.help ? `<small>${opts.help}</small>` : "";
    return `<div class="field"><label>${label}</label><textarea class="js-field" data-path="${path}" data-type="text" placeholder="${escapeHTML(opts.placeholder || "")}">${escapeHTML(value)}</textarea>${help}</div>`;
  }
  function color(label, path) {
    const value = getPath(path) ?? "#ffffff";
    return `<div class="field"><label>${label}</label><div class="color-row"><input class="js-field" data-path="${path}" data-type="color" type="color" value="${escapeHTML(value)}" /><input class="input js-field" data-path="${path}" data-type="color" value="${escapeHTML(value)}" /></div></div>`;
  }
  function range(label, path, min, max, suffix = "px") {
    const value = Number(getPath(path) ?? min);
    return `<div class="field"><label>${label}: <span class="range-value">${value}${suffix}</span></label><input class="js-field js-range" data-path="${path}" data-type="number" type="range" min="${min}" max="${max}" value="${value}" /></div>`;
  }
  function check(label, path) {
    const value = Boolean(getPath(path));
    return `<label class="check"><input class="js-field" data-path="${path}" data-type="boolean" type="checkbox" ${value ? "checked" : ""} />${label}</label>`;
  }
  function imageField(label, path, help = "Você pode colar uma URL, usar o caminho de uma imagem da pasta do site ou enviar uma imagem do computador.") {
    const value = getPath(path) || "";
    return `
      <div class="field">
        <label>${label}</label>
        <div class="image-preview">${value ? `<img src="${escapeHTML(value)}" alt="Prévia da imagem" />` : `<span style="color:var(--muted)">Sem imagem</span>`}</div>
        <input class="input js-field" data-path="${path}" data-type="text" value="${escapeHTML(value)}" placeholder="assets/img/logo-delas.jpg ou https://..." />
        <div class="upload-box"><input type="file" accept="image/*" class="js-image-upload" data-path="${path}" /></div>
        <small>${help}</small>
      </div>`;
  }

  function renderInicio() {
    return `
      <div class="form-section">
        <div><p class="eyebrow">Comece por aqui</p><h2>Painel de edição premium</h2></div>
        <div class="preview-note"><b>Agora ficou mais prático:</b> você edita do lado esquerdo e vê o site mudar do lado direito em tempo real. Quando terminar, baixe o arquivo <b>site-config.js</b> e substitua na pasta do site.</div>
        <div class="grid-2">
          <button class="btn primary" type="button" data-go="produtos">Editar produtos</button>
          <button class="btn" type="button" data-go="visual">Mudar aparência</button>
          <button class="btn" type="button" data-go="loja">Dados da loja</button>
          <button class="btn" type="button" data-go="publicar">Como publicar</button>
        </div>
        <div class="section-intro">
          <b>O que este painel faz:</b><br>
          • Edita textos, cores, produtos, fotos, categorias, SEO e seções.<br>
          • Mostra prévia em desktop, tablet e celular.<br>
          • Permite importar/exportar backup em JSON.<br>
          • Gera o arquivo final que alimenta o site.
        </div>
        <div class="grid-3">
          <div class="section-intro"><b>${config.products?.length || 0}</b><br>produtos cadastrados</div>
          <div class="section-intro"><b>${config.categories?.length || 0}</b><br>categorias</div>
          <div class="section-intro"><b>${config.business?.name || "DELAS"}</b><br>nome da loja</div>
        </div>
      </div>`;
  }

  function renderLoja() {
    return `
      <div class="form-section">
        <div><p class="eyebrow">Dados principais</p><h2>Informações da loja</h2></div>
        <div class="section-intro">Essas informações aparecem no topo, rodapé, botões de WhatsApp, localização e textos do site.</div>
        ${imageField("Logo da loja", "business.logo", "Para manter leve, use a imagem da pasta assets/img ou envie uma versão otimizada.")}
        <div class="grid-2">${input("Nome da loja", "business.name")}${input("Subtítulo", "business.subtitle")}</div>
        ${input("Slogan curto", "business.slogan")}
        <div class="grid-2">${input("WhatsApp", "business.whatsapp", { help: "Use com DDI e DDD. Exemplo: 5519971436208" })}${input("Instagram", "business.instagram")}</div>
        ${input("Endereço", "business.address")}
        ${input("Link do Google Maps", "business.mapsUrl")}
        ${input("Horário de funcionamento", "business.hours")}
      </div>`;
  }

  function renderVisual() {
    return `
      <div class="form-section">
        <div><p class="eyebrow">Design</p><h2>Aparência do site</h2></div>
        <div class="section-intro">Altere cores, arredondamento e intensidade das sombras. Use os presets para mudar rápido o estilo geral.</div>
        <div class="row-actions">
          <button class="btn small" type="button" data-preset="neon">Neon DELAS</button>
          <button class="btn small" type="button" data-preset="luxo">Luxo escuro</button>
          <button class="btn small" type="button" data-preset="rose">Rosé clean</button>
          <button class="btn small" type="button" data-preset="claro">Claro premium</button>
        </div>
        <div class="grid-2">${color("Cor principal", "theme.primary")}${color("Cor secundária/acento", "theme.accent")}</div>
        <div class="grid-2">${color("Fundo principal", "theme.background")}${color("Fundo secundário", "theme.backgroundSoft")}</div>
        <div class="grid-2">${color("Texto principal", "theme.text")}${color("Texto secundário", "theme.muted")}</div>
        <div class="grid-2">${color("Cor de sucesso", "theme.success")}${color("Cor clara", "theme.secondary")}</div>
        ${range("Arredondamento dos cards", "theme.radius", 8, 48)}
        ${range("Arredondamento dos botões", "theme.buttonRadius", 8, 999)}
        ${range("Força das sombras", "theme.shadow", 0, 70, "")}
        <div class="warning-note">Dica: para combinar com a logo neon, o estilo escuro com rosa/pink costuma ficar mais profissional e marcante.</div>
      </div>`;
  }

  function renderCapa() {
    return `
      <div class="form-section">
        <div><p class="eyebrow">Primeira impressão</p><h2>Capa / Hero do site</h2></div>
        ${input("Texto pequeno acima do título", "hero.eyebrow")}
        ${textarea("Título principal", "hero.title", { help: "Frase grande da primeira dobra do site." })}
        ${input("Palavra em destaque", "hero.highlight")}
        ${textarea("Descrição", "hero.description")}
        <div class="grid-2">${input("Botão principal", "hero.primaryText")}${input("Botão secundário", "hero.secondaryText")}</div>
        <h3>Cards rápidos da capa</h3>
        <div class="repeater">
          ${(config.hero?.stats || []).map((stat, index) => `
            <div class="repeater-row">
              <input class="input js-stat" data-index="${index}" data-key="value" value="${escapeHTML(stat.value)}" placeholder="Valor" />
              <input class="input js-stat" data-index="${index}" data-key="label" value="${escapeHTML(stat.label)}" placeholder="Legenda" />
              <button class="btn small danger" type="button" data-remove-stat="${index}">Remover</button>
            </div>`).join("")}
        </div>
        <button class="btn" type="button" id="addStatBtn">Adicionar card</button>
      </div>`;
  }

  function renderProdutos() {
    if (!config.products) config.products = [];
    if (!selectedProductId && config.products[0]) selectedProductId = config.products[0].id;
    const product = config.products.find((p) => p.id === selectedProductId) || config.products[0];
    if (!product) return `
      <div class="form-section"><h2>Produtos</h2><div class="section-intro">Nenhum produto cadastrado ainda.</div><button class="btn primary" id="addProductBtn" type="button">Criar primeiro produto</button></div>`;
    return `
      <div class="form-section">
        <div><p class="eyebrow">Catálogo</p><h2>Produtos</h2></div>
        <div class="section-intro">Clique em um produto na lista, edite os dados e veja a prévia mudar. Você pode enviar imagem do computador, colar link ou usar caminho de arquivo.</div>
        <div class="row-actions">
          <button class="btn primary" id="addProductBtn" type="button">Adicionar produto</button>
          <button class="btn" id="duplicateProductBtn" type="button">Duplicar</button>
          <button class="btn danger" id="deleteProductBtn" type="button">Excluir</button>
        </div>
        <div class="product-manager">
          <div class="product-list">
            ${config.products.map((p) => `<button type="button" class="${p.id === product.id ? "active" : ""}" data-select-product="${escapeHTML(p.id)}">${escapeHTML(p.name || "Produto sem nome")}<small>${escapeHTML(p.category || "Sem categoria")} • ${money(p.price)}</small></button>`).join("")}
          </div>
          <div class="product-form">
            <div class="grid-2">
              <div class="field"><label>Nome</label><input class="input js-product" data-key="name" value="${escapeHTML(product.name)}" /></div>
              <div class="field"><label>Categoria</label><select class="js-product" data-key="category">${(config.categories || []).filter((c) => c !== "Todos").map((cat) => `<option ${product.category === cat ? "selected" : ""}>${escapeHTML(cat)}</option>`).join("")}</select></div>
            </div>
            <div class="grid-2">
              <div class="field"><label>Preço</label><input class="input js-product" data-key="price" data-type="number" type="number" step="0.01" value="${escapeHTML(product.price)}" /></div>
              <div class="field"><label>Preço antigo opcional</label><input class="input js-product" data-key="oldPrice" data-type="optional-number" type="number" step="0.01" value="${escapeHTML(product.oldPrice ?? "")}" /></div>
            </div>
            <div class="field"><label>Descrição</label><textarea class="js-product" data-key="description">${escapeHTML(product.description || "")}</textarea></div>
            <div class="grid-2">
              <div class="field"><label>Tamanhos</label><input class="input js-product" data-key="sizes" data-type="array" value="${escapeHTML(formatList(product.sizes))}" /><small>Separe por vírgula. Ex: P, M, G, GG</small></div>
              <div class="field"><label>Cores</label><input class="input js-product" data-key="colors" data-type="array" value="${escapeHTML(formatList(product.colors))}" /><small>Separe por vírgula.</small></div>
            </div>
            <div class="field"><label>Etiquetas extras</label><input class="input js-product" data-key="tags" data-type="array" value="${escapeHTML(formatList(product.tags))}" /><small>Ex: Zero transparência, Leveza, Destaque</small></div>
            <div class="check-grid">
              ${productCheck("Novo", "isNew", product)}
              ${productCheck("Destaque", "isFeatured", product)}
              ${productCheck("Promoção", "isPromotion", product)}
              ${productCheck("Mais vendido", "isBestSeller", product)}
              ${productCheck("Disponível", "available", product)}
            </div>
            <div class="field"><label>Observação de estoque</label><input class="input js-product" data-key="stockNote" value="${escapeHTML(product.stockNote || "")}" /></div>
            <div class="field">
              <label>Imagem principal</label>
              <div class="image-preview">${product.image ? `<img src="${escapeHTML(product.image)}" alt="Prévia do produto" />` : `<span style="color:var(--muted)">Sem imagem</span>`}</div>
              <input class="input js-product" data-key="image" value="${escapeHTML(product.image || "")}" placeholder="assets/produtos/foto.jpg ou https://..." />
              <div class="upload-box"><input type="file" accept="image/*" class="js-product-image" /></div>
              <small>Para praticidade, enviar imagem transforma a foto em código interno. Para site grande, prefira imagens otimizadas em pasta.</small>
            </div>
            <div class="field">
              <label>Galeria de imagens adicionais</label>
              <textarea class="js-product" data-key="images" data-type="array-lines" placeholder="Uma URL ou caminho por linha">${escapeHTML((product.images || []).join("\n"))}</textarea>
              <div class="upload-box"><input type="file" accept="image/*" multiple class="js-gallery-upload" /></div>
              <small>Use para mostrar variações da peça no modal de detalhes.</small>
            </div>
          </div>
        </div>
      </div>`;
  }

  function productCheck(label, key, product) {
    return `<label class="check"><input class="js-product" data-key="${key}" data-type="boolean" type="checkbox" ${product[key] ? "checked" : ""} />${label}</label>`;
  }

  function renderCategorias() {
    return `
      <div class="form-section">
        <div><p class="eyebrow">Organização</p><h2>Categorias</h2></div>
        <div class="section-intro">As categorias aparecem nos filtros do catálogo e no formulário de produtos. Mantenha “Todos” como primeira categoria.</div>
        <div class="repeater">
          ${(config.categories || []).map((cat, index) => `
            <div class="category-row">
              <input class="input js-category" data-index="${index}" value="${escapeHTML(cat)}" ${index === 0 ? "readonly" : ""}/>
              <button class="btn small danger" type="button" data-remove-category="${index}" ${index === 0 ? "disabled" : ""}>Remover</button>
            </div>`).join("")}
        </div>
        <button class="btn primary" id="addCategoryBtn" type="button">Adicionar categoria</button>
        <div class="warning-note">Atenção: se remover uma categoria usada em produtos, esses produtos continuarão com a categoria antiga até você alterar cada um.</div>
      </div>`;
  }

  function renderSecoes() {
    return `
      <div class="form-section">
        <div><p class="eyebrow">Conteúdo</p><h2>Seções do site</h2></div>
        <div class="check-grid">
          ${check("Mostrar novidades", "sections.newArrivals")}
          ${check("Mostrar mais vendidos", "sections.bestSellers")}
          ${check("Mostrar promoções", "sections.promotions")}
        </div>
        <div class="divider"></div>
        ${input("Título sobre a loja", "sections.aboutTitle")}
        ${textarea("Texto sobre a loja", "sections.aboutText")}
        ${input("Título da seção Como funciona", "sections.howTitle")}
        <h3>Passos de compra/reserva</h3>
        <div class="repeater">
          ${(config.sections?.howSteps || []).map((step, index) => `
            <div class="category-row">
              <input class="input js-step" data-index="${index}" value="${escapeHTML(step)}" />
              <button class="btn small danger" type="button" data-remove-step="${index}">Remover</button>
            </div>`).join("")}
        </div>
        <button class="btn" id="addStepBtn" type="button">Adicionar passo</button>
        <div class="divider"></div>
        ${input("Título da localização", "sections.locationTitle")}
        ${textarea("Texto da localização", "sections.locationText")}
      </div>`;
  }

  function renderSEO() {
    return `
      <div class="form-section">
        <div><p class="eyebrow">Google e compartilhamento</p><h2>SEO básico</h2></div>
        <div class="section-intro">Essas informações ajudam quando o link do site é compartilhado no WhatsApp, Instagram ou encontrado no Google.</div>
        ${input("Título da aba/navegador", "seo.title")}
        ${textarea("Descrição do site", "seo.description")}
        ${imageField("Imagem de compartilhamento", "seo.shareImage")}
      </div>`;
  }

  function renderPublicar() {
    return `
      <div class="form-section">
        <div><p class="eyebrow">Finalização</p><h2>Exportar e publicar</h2></div>
        <div class="preview-note"><b>Passo principal:</b> clique em “Baixar site-config.js” e substitua o arquivo antigo com o mesmo nome dentro da pasta do site.</div>
        <div class="grid-2">
          <button class="btn primary" id="exportJsBtn2" type="button">Baixar site-config.js</button>
          <button class="btn" id="exportJsonBtn" type="button">Baixar backup JSON</button>
          <button class="btn" id="importJsonBtn" type="button">Importar backup JSON</button>
          <button class="btn danger" id="resetBtn" type="button">Restaurar original</button>
        </div>
        <input id="jsonFile" type="file" accept="application/json" hidden />
        <div class="warning-note">Este painel é estático, sem banco de dados. Para visitantes verem as alterações no site publicado, você precisa exportar o arquivo e reenviar/substituir no servidor/hospedagem.</div>
        <h3>Checklist antes de publicar</h3>
        <div class="code-box">
          1. Teste no modo Celular na prévia.\n
          2. Confira WhatsApp, Instagram e endereço.\n
          3. Verifique produtos, preços e fotos.\n
          4. Baixe o site-config.js.\n
          5. Substitua o arquivo na pasta do site.\n
          6. Publique a pasta em Netlify, Vercel, GitHub Pages ou hospedagem comum.
        </div>
      </div>`;
  }

  function renderAjuda() {
    return `
      <div class="form-section">
        <div><p class="eyebrow">Guia rápido</p><h2>Como usar sem se perder</h2></div>
        <div class="section-intro">
          <b>1) Dados da loja:</b> ajuste WhatsApp, Instagram, endereço e logo.<br><br>
          <b>2) Visual:</b> escolha um preset ou mude cores manualmente.<br><br>
          <b>3) Produtos:</b> cadastre fotos, preços, tamanhos, cores e etiquetas.<br><br>
          <b>4) Prévia:</b> veja como fica em desktop, tablet e celular.<br><br>
          <b>5) Publicar:</b> baixe <b>site-config.js</b> e substitua o arquivo antigo.
        </div>
        <h3>Onde ficam as fotos?</h3>
        <div class="code-box">Opção prática: envie pelo painel.\nOpção profissional: coloque imagens otimizadas na pasta assets/produtos/ e escreva o caminho no campo da imagem, por exemplo:\n\nassets/produtos/conjunto-preto.jpg</div>
        <h3>Como deixar ainda mais automático?</h3>
        <div class="section-intro">O próximo nível seria criar um painel com login e banco de dados usando Firebase ou Supabase. Aí as alterações ficariam online automaticamente, sem baixar arquivo.</div>
      </div>`;
  }

  function render() {
    renderTabs();
    const views = { inicio: renderInicio, loja: renderLoja, visual: renderVisual, capa: renderCapa, produtos: renderProdutos, categorias: renderCategorias, secoes: renderSecoes, seo: renderSEO, publicar: renderPublicar, ajuda: renderAjuda };
    editorContent.innerHTML = (views[activeTab] || renderInicio)();
    bindEditorEvents();
    postPreview();
  }

  function bindEditorEvents() {
    editorContent.querySelectorAll("[data-go]").forEach((btn) => btn.addEventListener("click", () => { activeTab = btn.dataset.go; render(); }));

    editorContent.querySelectorAll(".js-field").forEach((el) => {
      el.addEventListener("input", (e) => {
        const type = el.dataset.type;
        let value = el.type === "checkbox" ? el.checked : el.value;
        if (type === "number") value = Number(value);
        if (type === "boolean") value = el.checked;
        setPath(el.dataset.path, value);
        if (el.classList.contains("js-range")) el.closest(".field").querySelector(".range-value").textContent = `${value}${el.dataset.path.includes("shadow") ? "" : "px"}`;
        postPreview();
      });
    });

    editorContent.querySelectorAll(".js-image-upload").forEach((input) => input.addEventListener("change", async () => {
      const file = input.files?.[0];
      if (!file) return;
      const data = await readFile(file);
      setPath(input.dataset.path, data);
      toast("Imagem carregada na prévia.");
      render();
    }));

    editorContent.querySelectorAll("[data-preset]").forEach((btn) => btn.addEventListener("click", () => applyPreset(btn.dataset.preset)));

    editorContent.querySelectorAll(".js-stat").forEach((el) => el.addEventListener("input", () => {
      const index = Number(el.dataset.index);
      const key = el.dataset.key;
      if (!config.hero.stats) config.hero.stats = [];
      if (!config.hero.stats[index]) config.hero.stats[index] = { value: "", label: "" };
      config.hero.stats[index][key] = el.value;
      postPreview();
    }));
    editorContent.querySelectorAll("[data-remove-stat]").forEach((btn) => btn.addEventListener("click", () => { config.hero.stats.splice(Number(btn.dataset.removeStat), 1); render(); }));
    editorContent.querySelector("#addStatBtn")?.addEventListener("click", () => { if (!config.hero.stats) config.hero.stats = []; config.hero.stats.push({ value: "Novo", label: "destaque" }); render(); });

    editorContent.querySelector("#addProductBtn")?.addEventListener("click", addProduct);
    editorContent.querySelector("#duplicateProductBtn")?.addEventListener("click", duplicateProduct);
    editorContent.querySelector("#deleteProductBtn")?.addEventListener("click", deleteProduct);
    editorContent.querySelectorAll("[data-select-product]").forEach((btn) => btn.addEventListener("click", () => { selectedProductId = btn.dataset.selectProduct; render(); }));
    editorContent.querySelectorAll(".js-product").forEach((el) => el.addEventListener("input", () => updateProductField(el)));
    editorContent.querySelector(".js-product-image")?.addEventListener("change", async (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      currentProduct().image = await readFile(file);
      toast("Imagem do produto carregada.");
      render();
    });
    editorContent.querySelector(".js-gallery-upload")?.addEventListener("change", async (e) => {
      const files = [...(e.target.files || [])];
      if (!files.length) return;
      currentProduct().images = await Promise.all(files.map(readFile));
      toast("Galeria carregada.");
      render();
    });

    editorContent.querySelectorAll(".js-category").forEach((el) => el.addEventListener("input", () => { config.categories[Number(el.dataset.index)] = el.value; postPreview(); }));
    editorContent.querySelectorAll("[data-remove-category]").forEach((btn) => btn.addEventListener("click", () => { const i = Number(btn.dataset.removeCategory); if (i > 0) config.categories.splice(i, 1); render(); }));
    editorContent.querySelector("#addCategoryBtn")?.addEventListener("click", () => { config.categories.push("Nova categoria"); render(); });

    editorContent.querySelectorAll(".js-step").forEach((el) => el.addEventListener("input", () => { config.sections.howSteps[Number(el.dataset.index)] = el.value; postPreview(); }));
    editorContent.querySelectorAll("[data-remove-step]").forEach((btn) => btn.addEventListener("click", () => { config.sections.howSteps.splice(Number(btn.dataset.removeStep), 1); render(); }));
    editorContent.querySelector("#addStepBtn")?.addEventListener("click", () => { config.sections.howSteps.push("Novo passo"); render(); });

    editorContent.querySelector("#exportJsBtn2")?.addEventListener("click", exportJS);
    editorContent.querySelector("#exportJsonBtn")?.addEventListener("click", exportJSON);
    editorContent.querySelector("#importJsonBtn")?.addEventListener("click", () => document.getElementById("jsonFile")?.click());
    editorContent.querySelector("#resetBtn")?.addEventListener("click", resetAll);
    editorContent.querySelector("#jsonFile")?.addEventListener("change", importJSON);
  }

  function currentProduct() {
    return config.products.find((p) => p.id === selectedProductId) || config.products[0];
  }
  function updateProductField(el) {
    const p = currentProduct();
    if (!p) return;
    const key = el.dataset.key;
    const type = el.dataset.type;
    let value = el.type === "checkbox" ? el.checked : el.value;
    if (type === "number") value = Number(value || 0);
    if (type === "optional-number") value = value === "" ? null : Number(value);
    if (type === "boolean") value = el.checked;
    if (type === "array") value = parseList(value);
    if (type === "array-lines") value = String(value || "").split("\n").map((v) => v.trim()).filter(Boolean);
    p[key] = value;
    if (key === "name") p.id = p.id || slug(value);
    postPreview();
  }
  function addProduct() {
    const id = `${slug("novo-produto")}-${Date.now().toString().slice(-5)}`;
    const category = (config.categories || []).find((c) => c !== "Todos") || "Conjuntos";
    const product = {
      id, name: "Novo produto", category, price: 99.90, oldPrice: null,
      description: "Descrição da peça. Informe tecido, caimento, uso e diferenciais.",
      image: createPlaceholder("Novo produto"), images: [], sizes: ["P", "M", "G"], colors: ["Preto"], tags: ["Novo"],
      isNew: true, isFeatured: false, isPromotion: false, isBestSeller: false, available: true,
      stockNote: "Disponibilidade sujeita à confirmação pelo WhatsApp."
    };
    config.products.unshift(product);
    selectedProductId = id;
    render();
  }
  function duplicateProduct() {
    const p = currentProduct();
    if (!p) return;
    const copy = clone(p);
    copy.id = `${slug(copy.name)}-${Date.now().toString().slice(-5)}`;
    copy.name = `${copy.name} cópia`;
    config.products.unshift(copy);
    selectedProductId = copy.id;
    render();
  }
  function deleteProduct() {
    const p = currentProduct();
    if (!p) return;
    if (!confirm(`Excluir "${p.name}"?`)) return;
    config.products = config.products.filter((item) => item.id !== p.id);
    selectedProductId = config.products[0]?.id || null;
    render();
  }

  function createPlaceholder(label) {
    const primary = config.theme?.primary || "#ff0aa9";
    const accent = config.theme?.accent || "#8b5cf6";
    const text = escapeHTML(label).replaceAll("&quot;", "");
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="900" height="1150" viewBox="0 0 900 1150"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${primary}"/><stop offset="1" stop-color="${accent}"/></linearGradient></defs><rect width="900" height="1150" fill="#07070d"/><rect x="40" y="40" width="820" height="1070" rx="70" fill="url(#g)" opacity=".92"/><circle cx="450" cy="360" r="130" fill="#fff" opacity=".18"/><path d="M280 900h340L550 635c-25-72-175-72-200 0Z" fill="#05050a" opacity=".68"/><text x="450" y="1015" text-anchor="middle" font-family="Arial" font-size="48" font-weight="800" fill="#fff">${text}</text></svg>`;
    return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
  }

  function readFile(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  function applyPreset(name) {
    const presets = {
      neon: { background: "#07070d", backgroundSoft: "#10101a", text: "#ffffff", muted: "#b8b7c5", primary: "#ff0aa9", secondary: "#ffffff", accent: "#8b5cf6", success: "#22c55e", radius: "30", buttonRadius: "999", shadow: "35" },
      luxo: { background: "#050505", backgroundSoft: "#111111", text: "#fffaf0", muted: "#c8bda8", primary: "#d4af37", secondary: "#ffffff", accent: "#ec4899", success: "#22c55e", radius: "24", buttonRadius: "999", shadow: "42" },
      rose: { background: "#1f111a", backgroundSoft: "#321827", text: "#fff7fb", muted: "#e7bdd2", primary: "#f472b6", secondary: "#ffffff", accent: "#fb7185", success: "#22c55e", radius: "34", buttonRadius: "999", shadow: "30" },
      claro: { background: "#fff7fb", backgroundSoft: "#ffffff", text: "#181018", muted: "#725868", primary: "#db2777", secondary: "#ffffff", accent: "#9333ea", success: "#16a34a", radius: "28", buttonRadius: "999", shadow: "18" }
    };
    config.theme = { ...(config.theme || {}), ...(presets[name] || presets.neon) };
    toast("Preset aplicado.");
    render();
  }

  function exportJS() {
    const js = `window.DELAS_CONFIG = ${JSON.stringify(config, null, 2)};\n`;
    downloadFile("site-config.js", js, "text/javascript;charset=utf-8");
    toast("Arquivo site-config.js baixado.");
  }
  function exportJSON() {
    downloadFile("backup-delas-config.json", JSON.stringify(config, null, 2), "application/json;charset=utf-8");
    toast("Backup JSON baixado.");
  }
  function importJSON(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        config = JSON.parse(reader.result);
        selectedProductId = config.products?.[0]?.id || null;
        toast("Backup importado com sucesso.");
        render();
      } catch (error) {
        toast("Não foi possível importar o arquivo.");
      }
    };
    reader.readAsText(file);
  }
  function downloadFile(name, content, type) {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }
  function resetAll() {
    if (!confirm("Restaurar a versão original? As alterações salvas neste navegador serão apagadas.")) return;
    localStorage.removeItem(STORAGE_KEY);
    config = clone(baseConfig);
    selectedProductId = config.products?.[0]?.id || null;
    toast("Versão original restaurada.");
    render();
  }

  document.getElementById("saveDraftBtn")?.addEventListener("click", () => saveDraft(false));
  document.getElementById("exportJsBtn")?.addEventListener("click", exportJS);
  document.getElementById("openSiteBtn")?.addEventListener("click", () => window.open("index.html?draft=1", "_blank"));
  document.querySelectorAll("[data-device]").forEach((btn) => btn.addEventListener("click", () => {
    document.querySelectorAll("[data-device]").forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    previewStage.className = `preview-stage ${btn.dataset.device}`;
  }));

  render();
})();
