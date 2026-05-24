(function () {
  const app = document.getElementById("app");
  const PREVIEW_MODE = new URLSearchParams(location.search).has("preview");
  const DRAFT_MODE = new URLSearchParams(location.search).has("draft");
  const STORAGE_KEY = "DELAS_EDITOR_DRAFT_V3";
  const DEFAULT_CONFIG = window.DELAS_CONFIG || {};
  let config = clone(DEFAULT_CONFIG);
  let currentFilter = "Todos";
  let currentSearch = "";
  let currentSize = "Todos";
  let currentTag = "Todos";
  let priceSort = "featured";

  if (DRAFT_MODE) {
    try {
      const draft = localStorage.getItem(STORAGE_KEY);
      if (draft) config = JSON.parse(draft);
    } catch (error) {
      console.warn("Não foi possível carregar a prévia salva.", error);
    }
  }

  function clone(value) {
    return JSON.parse(JSON.stringify(value || {}));
  }

  function escapeHTML(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function money(value) {
    const n = Number(value || 0);
    return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  }

  function onlyDigits(value) {
    return String(value || "").replace(/\D/g, "");
  }

  function waLink(message) {
    const number = onlyDigits(config.business?.whatsapp || "5519971436208");
    return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
  }

  function icon(name) {
    const icons = {
      search: '<svg width="19" height="19" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m21 21-4.35-4.35M10.8 18a7.2 7.2 0 1 1 0-14.4 7.2 7.2 0 0 1 0 14.4Z" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
      menu: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
      x: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
      whats: '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M20.4 11.9a8.35 8.35 0 0 1-12.37 7.3L4 20.4l1.25-3.9A8.35 8.35 0 1 1 20.4 11.9Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M8.85 8.55c.2-.45.42-.46.62-.46h.53c.17 0 .4.06.62.52.22.46.74 1.8.8 1.93.07.13.1.29.02.46-.08.18-.13.29-.26.44l-.39.43c-.13.13-.26.27-.11.52.15.26.66 1.08 1.42 1.75.98.87 1.8 1.15 2.07 1.28.26.13.42.11.58-.07.17-.2.66-.78.84-1.05.18-.26.35-.22.6-.13.24.09 1.54.73 1.8.86.27.13.45.2.51.31.07.12.07.68-.15 1.33-.22.64-1.28 1.23-1.78 1.27-.46.04-1.05.06-1.7-.1-.39-.1-.9-.29-1.55-.57-2.73-1.18-4.51-3.92-4.64-4.1-.14-.17-1.12-1.49-1.12-2.84 0-1.35.7-2.02.96-2.3Z" fill="currentColor"/></svg>',
      instagram: '<svg width="19" height="19" viewBox="0 0 24 24" fill="none" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5" stroke="currentColor" stroke-width="2"/><circle cx="12" cy="12" r="4" stroke="currentColor" stroke-width="2"/><circle cx="17.5" cy="6.5" r="1.2" fill="currentColor"/></svg>',
      pin: '<svg width="30" height="30" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 21s7-5.2 7-12a7 7 0 1 0-14 0c0 6.8 7 12 7 12Z" stroke="currentColor" stroke-width="2"/><circle cx="12" cy="9" r="2.4" stroke="currentColor" stroke-width="2"/></svg>',
      spark: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 2 14.8 9.2 22 12l-7.2 2.8L12 22l-2.8-7.2L2 12l7.2-2.8L12 2Z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg>',
      heart: '<svg width="19" height="19" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 1 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
      bag: '<svg width="19" height="19" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M6 8h12l-1 13H7L6 8Z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="M9 8a3 3 0 0 1 6 0" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
      shield: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 3 19 6v5c0 5-3.1 8.5-7 10-3.9-1.5-7-5-7-10V6l7-3Z" stroke="currentColor" stroke-width="2"/><path d="m9 12 2 2 4-5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
      truck: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M3 7h12v10H3V7Z" stroke="currentColor" stroke-width="2"/><path d="M15 11h3l3 3v3h-6v-6Z" stroke="currentColor" stroke-width="2"/><circle cx="7" cy="18" r="2" stroke="currentColor" stroke-width="2"/><circle cx="18" cy="18" r="2" stroke="currentColor" stroke-width="2"/></svg>',
      star: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m12 2 2.9 6 6.6 1-4.8 4.6 1.1 6.5L12 17l-5.8 3.1 1.1-6.5L2.5 9l6.6-1L12 2Z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg>'
    };
    return icons[name] || "";
  }

  function applyTheme() {
    const t = config.theme || {};
    const root = document.documentElement;
    root.style.setProperty("--bg", t.background || "#07070d");
    root.style.setProperty("--bg-soft", t.backgroundSoft || "#10101a");
    root.style.setProperty("--surface", t.surface || "rgba(255,255,255,0.065)");
    root.style.setProperty("--surface-strong", t.surfaceStrong || "rgba(255,255,255,0.12)");
    root.style.setProperty("--text", t.text || "#fff");
    root.style.setProperty("--muted", t.muted || "#b8b7c5");
    root.style.setProperty("--primary", t.primary || "#ff0aa9");
    root.style.setProperty("--secondary", t.secondary || "#fff");
    root.style.setProperty("--accent", t.accent || "#8b5cf6");
    root.style.setProperty("--success", t.success || "#22c55e");
    root.style.setProperty("--radius", `${Number(t.radius || 30)}px`);
    root.style.setProperty("--button-radius", `${Number(t.buttonRadius || 999)}px`);
    root.style.setProperty("--shadow-strength", Number(t.shadow || 35));
    document.title = config.seo?.title || `${config.business?.name || "DELAS"} | Catálogo`;
    setMeta("description", config.seo?.description || "Catálogo online de moda fitness feminina.");
    setMeta("og:title", config.seo?.title || document.title, true);
    setMeta("og:description", config.seo?.description || "Catálogo online de moda fitness feminina.", true);
    setMeta("og:image", config.seo?.shareImage || config.business?.logo || "", true);
  }

  function setMeta(name, content, property = false) {
    const attr = property ? "property" : "name";
    let el = document.head.querySelector(`meta[${attr}="${name}"]`);
    if (!el) {
      el = document.createElement("meta");
      el.setAttribute(attr, name);
      document.head.appendChild(el);
    }
    el.setAttribute("content", content || "");
  }

  function getTags() {
    const tags = new Set(["Todos"]);
    (config.products || []).forEach((p) => {
      if (p.isNew) tags.add("Novidades");
      if (p.isPromotion) tags.add("Promoções");
      if (p.isBestSeller) tags.add("Mais vendidos");
      (p.tags || []).forEach((tag) => tags.add(tag));
    });
    return [...tags];
  }

  function getSizes() {
    const sizes = new Set(["Todos"]);
    (config.products || []).forEach((p) => (p.sizes || []).forEach((s) => sizes.add(s)));
    return [...sizes];
  }

  function productMatches(product) {
    const search = currentSearch.trim().toLowerCase();
    const inCategory = currentFilter === "Todos" || product.category === currentFilter ||
      (currentFilter === "Promoções" && product.isPromotion) || (currentFilter === "Novidades" && product.isNew);
    const inSearch = !search || [product.name, product.category, product.description, ...(product.tags || [])].join(" ").toLowerCase().includes(search);
    const inSize = currentSize === "Todos" || (product.sizes || []).includes(currentSize);
    const inTag = currentTag === "Todos" ||
      (currentTag === "Novidades" && product.isNew) ||
      (currentTag === "Promoções" && product.isPromotion) ||
      (currentTag === "Mais vendidos" && product.isBestSeller) ||
      (product.tags || []).includes(currentTag);
    return inCategory && inSearch && inSize && inTag;
  }

  function sortedProducts() {
    const list = (config.products || []).filter(productMatches);
    if (priceSort === "price-low") return list.sort((a, b) => Number(a.price || 0) - Number(b.price || 0));
    if (priceSort === "price-high") return list.sort((a, b) => Number(b.price || 0) - Number(a.price || 0));
    if (priceSort === "new") return list.sort((a, b) => Number(b.isNew) - Number(a.isNew));
    return list.sort((a, b) => Number(b.isFeatured || b.isBestSeller) - Number(a.isFeatured || a.isBestSeller));
  }

  function productBadges(product) {
    const tags = [];
    if (product.isNew) tags.push({ text: "Novo", primary: true });
    if (product.isPromotion) tags.push({ text: "Promoção", primary: true });
    if (product.isBestSeller) tags.push({ text: "Mais vendido", primary: false });
    (product.tags || []).slice(0, 2).forEach((tag) => tags.push({ text: tag, primary: false }));
    return tags.slice(0, 4).map((tag) => `<span class="badge ${tag.primary ? "primary" : ""}">${escapeHTML(tag.text)}</span>`).join("");
  }

  function renderProductCard(product) {
    const message = `Olá! Vi no catálogo da ${config.business?.name || "DELAS"} o produto ${product.name}. Gostaria de saber se ainda tem disponível, quais tamanhos e cores vocês têm na loja.`;
    return `
      <article class="product-card reveal" data-product-id="${escapeHTML(product.id)}">
        <div class="product-image">
          <div class="badges">${productBadges(product)}</div>
          <button class="favorite icon-btn" type="button" aria-label="Favoritar ${escapeHTML(product.name)}">${icon("heart")}</button>
          <img src="${escapeHTML(product.image || config.business?.logo || "")}" alt="${escapeHTML(product.name)}" loading="lazy" />
        </div>
        <div class="product-body">
          <div class="category">${escapeHTML(product.category || "Produto")}</div>
          <div class="product-meta">
            <h3>${escapeHTML(product.name)}</h3>
            <div class="price-wrap">
              ${product.oldPrice ? `<span class="old-price">${money(product.oldPrice)}</span>` : ""}
              <div class="price">${money(product.price)}</div>
            </div>
          </div>
          <p class="product-desc">${escapeHTML(product.description || "")}</p>
          <div class="pills">
            ${(product.sizes || []).slice(0, 5).map((s) => `<span class="pill">Tam. ${escapeHTML(s)}</span>`).join("")}
            ${(product.colors || []).slice(0, 3).map((c) => `<span class="pill">${escapeHTML(c)}</span>`).join("")}
          </div>
          <div class="card-actions">
            <button class="btn btn-secondary details-btn" type="button" data-id="${escapeHTML(product.id)}">Ver detalhes</button>
            <a class="btn btn-primary" href="${waLink(message)}" target="_blank" rel="noopener">WhatsApp</a>
          </div>
        </div>
      </article>`;
  }

  function renderMiniProduct(product) {
    return `
      <button class="mini-card" type="button" data-mini-id="${escapeHTML(product.id)}">
        <img src="${escapeHTML(product.image || "")}" alt="${escapeHTML(product.name)}" loading="lazy" />
        <div><strong>${escapeHTML(product.name)}</strong><span>${money(product.price)}</span></div>
      </button>`;
  }

  function renderHeader() {
    const b = config.business || {};
    return `
      <a class="skip-link" href="#catalogo">Pular para o catálogo</a>
      <header class="site-header">
        <div class="container header-inner">
          <a href="#inicio" class="brand" aria-label="Início ${escapeHTML(b.name)}">
            <img src="${escapeHTML(b.logo || "")}" alt="Logo ${escapeHTML(b.name || "DELAS")}" />
            <span class="brand-name"><strong>${escapeHTML(b.name || "DELAS")}</strong><span>${escapeHTML(b.subtitle || "Moda Fitness")}</span></span>
          </a>
          <nav class="nav" aria-label="Menu principal">
            <a href="#inicio">Início</a>
            <a href="#catalogo">Catálogo</a>
            <a href="#novidades">Novidades</a>
            <a href="#sobre">Sobre</a>
            <a href="#localizacao">Localização</a>
          </nav>
          <div class="header-actions">
            <a class="btn btn-primary" href="${waLink(`Olá! Vim pelo catálogo online da ${b.name || "DELAS"} e gostaria de atendimento.`)}" target="_blank" rel="noopener">${icon("whats")} WhatsApp</a>
            <button class="mobile-toggle" type="button" aria-label="Abrir menu" id="mobileToggle">${icon("menu")}</button>
          </div>
        </div>
        <div class="container mobile-menu" id="mobileMenu">
          <a href="#inicio">Início</a><a href="#catalogo">Catálogo</a><a href="#novidades">Novidades</a><a href="#sobre">Sobre</a><a href="#localizacao">Localização</a>
        </div>
      </header>`;
  }

  function renderHero() {
    const b = config.business || {};
    const h = config.hero || {};
    return `
      <section class="hero" id="inicio">
        <div class="container hero-grid">
          <div>
            <div class="eyebrow">${escapeHTML(h.eyebrow || "Catálogo oficial")}</div>
            <h1>${escapeHTML(h.title || "Moda fitness feminina") } <span class="gradient-text">${escapeHTML(h.highlight || b.name || "DELAS")}</span></h1>
            <p>${escapeHTML(h.description || b.slogan || "Conheça as peças disponíveis na loja física.")}</p>
            <div class="hero-actions">
              <a class="btn btn-primary" href="#catalogo">${icon("bag")} ${escapeHTML(h.primaryText || "Ver catálogo")}</a>
              <a class="btn btn-secondary" href="${waLink(`Olá! Vim pelo catálogo online da ${b.name || "DELAS"} e gostaria de atendimento.`)}" target="_blank" rel="noopener">${icon("whats")} ${escapeHTML(h.secondaryText || "Chamar no WhatsApp")}</a>
            </div>
            <div class="hero-stats">
              ${(h.stats || []).slice(0, 3).map((s) => `<div class="stat"><strong>${escapeHTML(s.value)}</strong><span>${escapeHTML(s.label)}</span></div>`).join("")}
            </div>
          </div>
          <div class="hero-showcase" aria-hidden="true">
            <div class="logo-orb"></div>
            <div class="floating-card float-a"><span class="float-dot"></span> Novidades</div>
            <div class="floating-card float-b"><span class="float-dot"></span> Loja física</div>
            <div class="logo-card"><img src="${escapeHTML(b.logo || "")}" alt="" /></div>
          </div>
        </div>
      </section>`;
  }

  function renderCatalog() {
    const cats = config.categories || ["Todos"];
    const list = sortedProducts();
    return `
      <section class="section" id="catalogo">
        <div class="container">
          <div class="section-heading">
            <div><div class="eyebrow">Catálogo online</div><h2>Escolha seu próximo look fitness</h2></div>
            <p>Consulte disponibilidade, tamanhos e cores pelo WhatsApp. O estoque pode mudar conforme as vendas na loja física.</p>
          </div>
          <div class="catalog-tools">
            <label class="input-wrap">${icon("search")}<input id="searchInput" type="search" placeholder="Buscar peça, cor ou categoria..." value="${escapeHTML(currentSearch)}" /></label>
            <select id="sizeSelect" aria-label="Filtrar por tamanho">${getSizes().map((s) => `<option ${s === currentSize ? "selected" : ""}>${escapeHTML(s)}</option>`).join("")}</select>
            <select id="tagSelect" aria-label="Filtrar por destaque">${getTags().map((t) => `<option ${t === currentTag ? "selected" : ""}>${escapeHTML(t)}</option>`).join("")}</select>
            <select id="sortSelect" aria-label="Ordenar produtos">
              <option value="featured" ${priceSort === "featured" ? "selected" : ""}>Destaques primeiro</option>
              <option value="new" ${priceSort === "new" ? "selected" : ""}>Novidades primeiro</option>
              <option value="price-low" ${priceSort === "price-low" ? "selected" : ""}>Menor preço</option>
              <option value="price-high" ${priceSort === "price-high" ? "selected" : ""}>Maior preço</option>
            </select>
          </div>
          <div class="filters" role="list" aria-label="Categorias">
            ${cats.map((cat) => `<button class="filter-chip ${cat === currentFilter ? "active" : ""}" data-category="${escapeHTML(cat)}" type="button">${escapeHTML(cat)}</button>`).join("")}
          </div>
          <div class="product-grid" id="productGrid">
            ${list.length ? list.map(renderProductCard).join("") : `<div class="empty"><h3>Nenhuma peça encontrada</h3><p>Teste outro filtro ou chame a loja no WhatsApp para perguntar sobre novidades.</p></div>`}
          </div>
          <div class="feature-strip">
            <div class="feature">${icon("spark")}<strong>Novidades frequentes</strong><p>Catálogo pensado para mostrar os lançamentos da loja física.</p></div>
            <div class="feature">${icon("shield")}<strong>Consulta segura</strong><p>Confirme tamanho, cor e disponibilidade diretamente com a equipe.</p></div>
            <div class="feature">${icon("truck")}<strong>Retirada na loja</strong><p>Combine atendimento, retirada ou visita pelo WhatsApp.</p></div>
            <div class="feature">${icon("star")}<strong>Looks selecionados</strong><p>Peças femininas para treino, caminhada, academia e dia a dia.</p></div>
          </div>
        </div>
      </section>`;
  }

  function renderHighlightSection(id, title, text, predicate) {
    const products = (config.products || []).filter(predicate).slice(0, 4);
    if (!products.length) return "";
    return `
      <section class="section highlight-section" id="${id}">
        <div class="container">
          <div class="section-heading"><div><div class="eyebrow">DELAS</div><h2>${escapeHTML(title)}</h2></div><p>${escapeHTML(text)}</p></div>
          <div class="mini-grid">${products.map(renderMiniProduct).join("")}</div>
        </div>
      </section>`;
  }

  function renderInfoSections() {
    const s = config.sections || {};
    const b = config.business || {};
    return `
      <section class="section" id="sobre">
        <div class="container info-grid">
          <div class="info-card">
            <div class="eyebrow">Sobre a loja</div>
            <h2>${escapeHTML(s.aboutTitle || "Uma vitrine digital da loja física")}</h2>
            <p>${escapeHTML(s.aboutText || "Conheça a loja e consulte as peças pelo WhatsApp.")}</p>
            <div class="hero-actions"><a class="btn btn-primary" href="${escapeHTML(b.instagram || "#")}" target="_blank" rel="noopener">${icon("instagram")} Instagram</a><a class="btn btn-secondary" href="${waLink(`Olá! Vim pelo catálogo online da ${b.name || "DELAS"}.`)}" target="_blank" rel="noopener">WhatsApp</a></div>
          </div>
          <div class="info-card">
            <div class="eyebrow">Como funciona</div>
            <h2>${escapeHTML(s.howTitle || "Como consultar ou reservar")}</h2>
            <div class="step-list">
              ${(s.howSteps || []).map((step, i) => `<div class="step"><span>${i + 1}</span><div><strong>${escapeHTML(step)}</strong></div></div>`).join("")}
            </div>
          </div>
        </div>
      </section>
      <section class="section" id="localizacao">
        <div class="container info-grid">
          <div class="info-card">
            <div class="eyebrow">Localização</div>
            <h2>${escapeHTML(s.locationTitle || "Visite a loja física")}</h2>
            <p>${escapeHTML(s.locationText || b.address || "")}</p>
            <div class="step-list">
              <div class="step"><span>${icon("pin")}</span><div><strong>${escapeHTML(b.address || "")}</strong><p>${escapeHTML(b.hours || "")}</p></div></div>
            </div>
            <div class="hero-actions"><a class="btn btn-primary" href="${escapeHTML(b.mapsUrl || "#")}" target="_blank" rel="noopener">Como chegar</a><a class="btn btn-secondary" href="${waLink(`Olá! Gostaria de saber o horário e a localização da ${b.name || "DELAS"}.`)}" target="_blank" rel="noopener">Chamar loja</a></div>
          </div>
          <a class="map-card" href="${escapeHTML(b.mapsUrl || "#")}" target="_blank" rel="noopener" aria-label="Abrir mapa da loja">
            <div class="map-card-content"><div class="map-pin">${icon("pin")}</div><h3>${escapeHTML(b.address || "Rua Santa Cruz, 594")}</h3><p>${escapeHTML(b.hours || "")}</p><span class="btn btn-light">Abrir no Google Maps</span></div>
          </a>
        </div>
      </section>`;
  }

  function renderFooter() {
    const b = config.business || {};
    return `
      <footer class="site-footer">
        <div class="container footer-inner">
          <a href="#inicio" class="brand"><img src="${escapeHTML(b.logo || "")}" alt="Logo ${escapeHTML(b.name || "DELAS")}" /><span class="brand-name"><strong>${escapeHTML(b.name || "DELAS")}</strong><span>${escapeHTML(b.subtitle || "Moda Fitness")}</span></span></a>
          <div class="footer-links"><a href="#catalogo">Catálogo</a><a href="${escapeHTML(b.instagram || "#")}" target="_blank" rel="noopener">Instagram</a><a href="${waLink(`Olá! Vim pelo site da ${b.name || "DELAS"}.`)}" target="_blank" rel="noopener">WhatsApp</a><a href="${escapeHTML(b.mapsUrl || "#")}" target="_blank" rel="noopener">Endereço</a></div>
        </div>
      </footer>
      <a class="whatsapp-float" href="${waLink(`Olá! Vim pelo catálogo online da ${b.name || "DELAS"} e gostaria de atendimento.`)}" target="_blank" rel="noopener" aria-label="Chamar no WhatsApp">${icon("whats")}</a>`;
  }

  function renderModal(product) {
    const images = [product.image, ...(product.images || [])].filter(Boolean);
    const main = images[0] || config.business?.logo || "";
    const message = `Olá! Vi no catálogo da ${config.business?.name || "DELAS"} o produto ${product.name}. Gostaria de saber se ainda tem disponível, quais tamanhos e cores vocês têm na loja.`;
    return `
      <div class="modal open" id="productModal" role="dialog" aria-modal="true" aria-label="Detalhes do produto">
        <div class="modal-card">
          <div class="modal-grid">
            <div>
              <div class="modal-image"><img src="${escapeHTML(main)}" alt="${escapeHTML(product.name)}" id="modalMainImage" /></div>
              ${images.length > 1 ? `<div class="gallery-thumbs">${images.map((img, i) => `<button class="thumb ${i === 0 ? "active" : ""}" type="button" data-img="${escapeHTML(img)}"><img src="${escapeHTML(img)}" alt="Variação ${i + 1} de ${escapeHTML(product.name)}" /></button>`).join("")}</div>` : ""}
            </div>
            <div class="modal-content">
              <div class="modal-top">
                <div><div class="category">${escapeHTML(product.category || "Produto")}</div><h2>${escapeHTML(product.name)}</h2></div>
                <button class="icon-btn close-modal" type="button" aria-label="Fechar detalhes">${icon("x")}</button>
              </div>
              <div class="price-wrap">${product.oldPrice ? `<span class="old-price" style="text-align:left">${money(product.oldPrice)}</span>` : ""}<div class="price">${money(product.price)}</div></div>
              <p class="modal-desc">${escapeHTML(product.description || "")}</p>
              <div class="pills">${(product.sizes || []).map((s) => `<span class="pill">Tamanho ${escapeHTML(s)}</span>`).join("")}</div>
              <div class="pills">${(product.colors || []).map((c) => `<span class="pill">${escapeHTML(c)}</span>`).join("")}</div>
              <p class="stock-note"><span class="float-dot"></span>${escapeHTML(product.stockNote || "Disponibilidade sujeita à confirmação pelo WhatsApp.")}</p>
              <div class="hero-actions"><a class="btn btn-primary btn-full" href="${waLink(message)}" target="_blank" rel="noopener">${icon("whats")} Consultar disponibilidade</a><button class="btn btn-secondary btn-full close-modal" type="button">Voltar ao catálogo</button></div>
            </div>
          </div>
        </div>
      </div>`;
  }

  function render() {
    applyTheme();
    app.innerHTML = `
      ${renderHeader()}
      <main>
        ${renderHero()}
        ${renderCatalog()}
        ${config.sections?.newArrivals ? renderHighlightSection("novidades", "Novidades da semana", "Peças recém-chegadas ou marcadas como novidade no catálogo.", (p) => p.isNew) : ""}
        ${config.sections?.bestSellers ? renderHighlightSection("mais-vendidos", "Mais vendidos", "Looks favoritos das clientes da loja.", (p) => p.isBestSeller) : ""}
        ${config.sections?.promotions ? renderHighlightSection("promocoes", "Promoções", "Peças selecionadas com condições especiais na loja física.", (p) => p.isPromotion) : ""}
        ${renderInfoSections()}
      </main>
      ${renderFooter()}
      <div id="modalMount"></div>`;
    bindEvents();
  }

  function bindEvents() {
    const toggle = document.getElementById("mobileToggle");
    const menu = document.getElementById("mobileMenu");
    if (toggle && menu) toggle.addEventListener("click", () => {
      menu.classList.toggle("open");
      toggle.innerHTML = menu.classList.contains("open") ? icon("x") : icon("menu");
    });

    document.querySelectorAll(".filter-chip").forEach((btn) => btn.addEventListener("click", () => {
      currentFilter = btn.dataset.category || "Todos";
      render();
      document.getElementById("catalogo")?.scrollIntoView({ block: "start" });
    }));

    document.getElementById("searchInput")?.addEventListener("input", (e) => {
      currentSearch = e.target.value;
      updateGridOnly();
    });
    document.getElementById("sizeSelect")?.addEventListener("change", (e) => { currentSize = e.target.value; updateGridOnly(); });
    document.getElementById("tagSelect")?.addEventListener("change", (e) => { currentTag = e.target.value; updateGridOnly(); });
    document.getElementById("sortSelect")?.addEventListener("change", (e) => { priceSort = e.target.value; updateGridOnly(); });

    document.querySelectorAll(".details-btn, .mini-card").forEach((btn) => btn.addEventListener("click", () => {
      const id = btn.dataset.id || btn.dataset.miniId;
      openProduct(id);
    }));
  }

  function updateGridOnly() {
    const grid = document.getElementById("productGrid");
    if (!grid) return;
    const list = sortedProducts();
    grid.innerHTML = list.length ? list.map(renderProductCard).join("") : `<div class="empty"><h3>Nenhuma peça encontrada</h3><p>Teste outro filtro ou chame a loja no WhatsApp para perguntar sobre novidades.</p></div>`;
    document.querySelectorAll(".details-btn").forEach((btn) => btn.addEventListener("click", () => openProduct(btn.dataset.id)));
  }

  function openProduct(id) {
    const product = (config.products || []).find((p) => p.id === id);
    if (!product) return;
    const mount = document.getElementById("modalMount");
    mount.innerHTML = renderModal(product);
    const modal = document.getElementById("productModal");
    const close = () => { modal?.remove(); };
    modal?.addEventListener("click", (e) => { if (e.target === modal) close(); });
    modal?.querySelectorAll(".close-modal").forEach((btn) => btn.addEventListener("click", close));
    modal?.querySelectorAll(".thumb").forEach((btn) => btn.addEventListener("click", () => {
      modal.querySelectorAll(".thumb").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      const img = document.getElementById("modalMainImage");
      if (img) img.src = btn.dataset.img;
    }));
    document.addEventListener("keydown", function esc(e) { if (e.key === "Escape") { close(); document.removeEventListener("keydown", esc); } });
  }

  if (PREVIEW_MODE) {
    window.addEventListener("message", (event) => {
      if (!event.data || event.data.type !== "DELAS_CONFIG_PREVIEW") return;
      config = clone(event.data.config);
      currentFilter = "Todos";
      currentSearch = "";
      currentSize = "Todos";
      currentTag = "Todos";
      priceSort = "featured";
      render();
    });
  }

  render();
})();
