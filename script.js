const STORAGE_KEY = "casaBurguerMenuV2";
const WHATSAPP_NUMBER = "5519971132549";
const FALLBACK_IMAGE = "assets/jardim-card.jpg";
const FALLBACK_EXPLODED = "assets/jardim-exploded.jpg";

const defaultMenu = [
  {
    id: "jardim",
    name: "Jardim",
    tagline: "Fresco, defumado e equilibrado",
    category: "Burgers",
    price: 38,
    description: "Brioche, blend 160g, queijo prato, agrião, cebola roxa caramelizada no açúcar mascavo e maionese defumada da casa.",
    ingredients: [
      "Pão de brioche",
      "Blend 160g",
      "Queijo prato",
      "Agrião",
      "Cebola roxa caramelizada no açúcar mascavo",
      "Maionese defumada da casa"
    ],
    image: "assets/jardim-card.jpg",
    explodedImage: "assets/jardim-exploded.jpg",
    active: true,
    featured: true
  },
  {
    id: "casa",
    name: "Casa",
    tagline: "Clássico com cremosidade",
    category: "Burgers",
    price: 40,
    description: "Brioche, blend 160g, alface americana, tomate, queijo prato, cream cheese e bacon crocante.",
    ingredients: [
      "Pão de brioche",
      "Blend 160g",
      "Alface americana",
      "Tomate",
      "Queijo prato",
      "Cream cheese",
      "Bacon"
    ],
    image: "assets/casa-card.jpg",
    explodedImage: "assets/casa-exploded.jpg",
    active: true,
    featured: false
  },
  {
    id: "terraco",
    name: "Terraço",
    tagline: "Intenso, cremoso e agridoce",
    category: "Burgers",
    price: 42,
    description: "Pão tipo francês, burger 160g artesanal, queijo minas gratinado no maçarico, tomate confit e geleia de pimenta.",
    ingredients: [
      "Pão tipo francês",
      "Burger 160g artesanal",
      "Queijo minas padrão gratinado no maçarico",
      "Tomate confit",
      "Geleia de pimenta"
    ],
    image: "assets/terraco-card.jpg",
    explodedImage: "assets/terraco-exploded.jpg",
    active: true,
    featured: true
  }
];

const currency = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL"
});

const page = document.body.dataset.page;

function readMenu() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw !== null) {
      const saved = JSON.parse(raw);
      if (Array.isArray(saved)) return saved;
    }
  } catch (error) {
    console.warn("Cardapio local invalido", error);
  }
  return defaultMenu;
}

function writeMenu(menu) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(menu));
}

function makeId(value) {
  const base = value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  return `${base || "item"}-${Date.now().toString(36)}`;
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function getImage(item) {
  return item.image || FALLBACK_IMAGE;
}

function getExplodedImage(item) {
  return item.explodedImage || FALLBACK_EXPLODED;
}

function getIngredients(item) {
  if (Array.isArray(item.ingredients) && item.ingredients.length) return item.ingredients;
  return item.description.split(",").map((entry) => entry.trim()).filter(Boolean);
}

function showDialog(target) {
  if (typeof target.showModal === "function") {
    target.showModal();
  } else {
    target.setAttribute("open", "");
  }
}

function itemCard(item) {
  return `
    <article class="menu-card ${item.active ? "" : "unavailable"}">
      <div class="menu-image-wrap">
        <img src="${escapeHtml(getImage(item))}" alt="${escapeHtml(item.name)}" loading="lazy">
        <span class="pill">${escapeHtml(item.category)}</span>
        ${item.featured ? '<span class="pill featured-tag">Destaque</span>' : ""}
      </div>
      <div class="menu-card-body">
        <div>
          <p class="menu-tagline">${escapeHtml(item.tagline || "Burger artesanal")}</p>
          <div class="menu-card-title">
            <h3>${escapeHtml(item.name)}</h3>
            <strong>${currency.format(Number(item.price) || 0)}</strong>
          </div>
        </div>
        <p>${escapeHtml(item.description)}</p>
        <div class="menu-card-actions">
          <button class="button secondary" type="button" data-ingredients="${escapeHtml(item.id)}">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 19h16"/><path d="M5 19a7 7 0 0 1 14 0"/><path d="M12 4v3"/><path d="M8 7l-2-2"/><path d="M16 7l2-2"/></svg>
            Ingredientes
          </button>
          <button class="button primary" type="button" data-order="${escapeHtml(item.id)}" ${item.active ? "" : "disabled"}>
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
            ${item.active ? "Pedir" : "Indisponível"}
          </button>
        </div>
      </div>
    </article>
  `;
}

function initStore() {
  const grid = document.querySelector("#menu-grid");
  const tabs = document.querySelector("#category-tabs");
  const search = document.querySelector("#menu-search");
  const dialog = document.querySelector("#order-dialog");
  const ingredientsDialog = document.querySelector("#ingredients-dialog");
  const form = document.querySelector("#order-form");
  let menu = readMenu();
  let currentCategory = "Todos";
  let selectedItem = null;
  let ingredientItem = null;

  function categories() {
    return ["Todos", ...new Set(menu.map((item) => item.category).filter(Boolean))];
  }

  function renderTabs() {
    tabs.innerHTML = categories()
      .map((category) => `
        <button class="tab-button" type="button" role="tab" aria-selected="${category === currentCategory}" data-category="${escapeHtml(category)}">
          ${escapeHtml(category)}
        </button>
      `)
      .join("");
  }

  function filteredMenu() {
    const query = search.value.trim().toLowerCase();
    return menu.filter((item) => {
      const inCategory = currentCategory === "Todos" || item.category === currentCategory;
      const ingredients = getIngredients(item).join(" ");
      const inSearch = !query || `${item.name} ${item.tagline || ""} ${item.description} ${ingredients}`.toLowerCase().includes(query);
      return inCategory && inSearch;
    });
  }

  function renderMenu() {
    const items = filteredMenu();
    grid.innerHTML = items.length
      ? items.map(itemCard).join("")
      : '<div class="empty-state">Nenhum item encontrado.</div>';
  }

  function openOrder(item) {
    selectedItem = item;
    document.querySelector("#order-item-name").textContent = item.name;
    document.querySelector("#order-item-details").textContent = `${currency.format(Number(item.price) || 0)} - ${item.description}`;
    document.querySelector("#order-quantity").value = 1;
    document.querySelector("#order-notes").value = "";
    showDialog(dialog);
  }

  function openIngredients(item) {
    ingredientItem = item;
    document.querySelector("#ingredients-title").textContent = item.name;
    document.querySelector("#ingredients-description").textContent = item.tagline || item.description;
    const image = document.querySelector("#ingredients-image");
    image.src = getExplodedImage(item);
    image.alt = `Ingredientes desmembrados do burger ${item.name}`;
    document.querySelector("#ingredients-list").innerHTML = getIngredients(item)
      .map((ingredient) => `<li>${escapeHtml(ingredient)}</li>`)
      .join("");
    showDialog(ingredientsDialog);
  }

  tabs.addEventListener("click", (event) => {
    const button = event.target.closest("[data-category]");
    if (!button) return;
    currentCategory = button.dataset.category;
    renderTabs();
    renderMenu();
  });

  search.addEventListener("input", renderMenu);

  grid.addEventListener("click", (event) => {
    const orderButton = event.target.closest("[data-order]");
    const ingredientsButton = event.target.closest("[data-ingredients]");

    if (ingredientsButton) {
      const item = menu.find((entry) => entry.id === ingredientsButton.dataset.ingredients);
      if (item) openIngredients(item);
      return;
    }

    if (orderButton) {
      const item = menu.find((entry) => entry.id === orderButton.dataset.order);
      if (item && item.active) openOrder(item);
    }
  });

  document.querySelector("[data-close-dialog]").addEventListener("click", () => dialog.close());
  document.querySelector("[data-close-ingredients]").addEventListener("click", () => ingredientsDialog.close());
  document.querySelector("#ingredients-order").addEventListener("click", () => {
    if (!ingredientItem) return;
    ingredientsDialog.close();
    openOrder(ingredientItem);
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!selectedItem) return;

    const quantity = Math.max(1, Number(document.querySelector("#order-quantity").value) || 1);
    const total = quantity * (Number(selectedItem.price) || 0);
    const customer = document.querySelector("#customer-name").value.trim();
    const address = document.querySelector("#customer-address").value.trim();
    const notes = document.querySelector("#order-notes").value.trim() || "Sem observações";
    const ingredients = getIngredients(selectedItem).join(", ");

    if (!customer || !address) {
      form.reportValidity();
      return;
    }

    const message = [
      "Olá, Casa Burguer! Quero fazer um pedido:",
      "",
      `Prato: ${selectedItem.name}`,
      `Quantidade: ${quantity}`,
      `Valor estimado: ${currency.format(total)}`,
      `Ingredientes: ${ingredients}`,
      `Especificações: ${notes}`,
      "",
      `Nome: ${customer}`,
      `Endereço: ${address}`
    ].join("\n");

    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`, "_blank", "noreferrer");
    dialog.close();
  });

  renderTabs();
  renderMenu();
}

function initDashboard() {
  let menu = readMenu();
  const form = document.querySelector("#menu-form");
  const list = document.querySelector("#dashboard-list");
  const imageInput = document.querySelector("#item-image");
  const fileInput = document.querySelector("#item-image-file");
  const fields = {
    id: document.querySelector("#item-id"),
    name: document.querySelector("#item-name"),
    category: document.querySelector("#item-category"),
    price: document.querySelector("#item-price"),
    image: imageInput,
    explodedImage: document.querySelector("#item-exploded"),
    ingredients: document.querySelector("#item-ingredients"),
    description: document.querySelector("#item-description"),
    active: document.querySelector("#item-active"),
    featured: document.querySelector("#item-featured")
  };

  function setFieldDefaults() {
    fields.id.value = "";
    fields.name.value = "";
    fields.category.value = "Burgers";
    fields.price.value = "";
    fields.image.value = FALLBACK_IMAGE;
    fields.explodedImage.value = FALLBACK_EXPLODED;
    fields.ingredients.value = "";
    fields.description.value = "";
    fields.active.checked = true;
    fields.featured.checked = false;
    fileInput.value = "";
    document.querySelector("#form-title").textContent = "Novo item";
    updatePreview();
  }

  function updateStats() {
    document.querySelector("#stat-items").textContent = menu.length;
    document.querySelector("#stat-active").textContent = menu.filter((item) => item.active).length;
    document.querySelector("#stat-highlight").textContent = menu.filter((item) => item.featured).length;
  }

  function renderList() {
    updateStats();
    list.innerHTML = menu.length
      ? menu.map((item) => `
        <article class="dashboard-item">
          <img src="${escapeHtml(getImage(item))}" alt="${escapeHtml(item.name)}">
          <div>
            <h3>${escapeHtml(item.name)}</h3>
            <p>${escapeHtml(item.description)}</p>
            <div class="item-meta">
              <strong>${currency.format(Number(item.price) || 0)}</strong>
              <span class="status-pill ${item.active ? "active" : "off"}">${item.active ? "Ativo" : "Pausado"}</span>
              ${item.featured ? '<span class="status-pill active">Destaque</span>' : ""}
            </div>
          </div>
          <div class="item-actions">
            <button class="icon-button" type="button" data-edit="${escapeHtml(item.id)}" aria-label="Editar ${escapeHtml(item.name)}">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5Z"/></svg>
            </button>
            <button class="icon-button" type="button" data-toggle="${escapeHtml(item.id)}" aria-label="Alternar disponibilidade de ${escapeHtml(item.name)}">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
            </button>
            <button class="icon-button" type="button" data-remove="${escapeHtml(item.id)}" aria-label="Remover ${escapeHtml(item.name)}">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v5M14 11v5"/></svg>
            </button>
          </div>
        </article>
      `).join("")
      : '<div class="empty-state">Nenhum item cadastrado.</div>';
  }

  function updatePreview() {
    document.querySelector("#preview-name").textContent = fields.name.value || "Novo burger";
    document.querySelector("#preview-category").textContent = fields.category.value || "Burgers";
    document.querySelector("#preview-price").textContent = currency.format(Number(fields.price.value) || 0);
    document.querySelector("#preview-description").textContent = fields.description.value || "Descrição do prato.";
    document.querySelector("#preview-image").src = fields.image.value || FALLBACK_IMAGE;
  }

  function fillForm(item) {
    fields.id.value = item.id;
    fields.name.value = item.name;
    fields.category.value = item.category;
    fields.price.value = item.price;
    fields.image.value = item.image || FALLBACK_IMAGE;
    fields.explodedImage.value = item.explodedImage || FALLBACK_EXPLODED;
    fields.ingredients.value = getIngredients(item).join("\n");
    fields.description.value = item.description;
    fields.active.checked = Boolean(item.active);
    fields.featured.checked = Boolean(item.featured);
    fileInput.value = "";
    document.querySelector("#form-title").textContent = "Editar item";
    updatePreview();
    form.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function persist() {
    writeMenu(menu);
    renderList();
  }

  form.addEventListener("input", updatePreview);

  fileInput.addEventListener("change", () => {
    const file = fileInput.files && fileInput.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.addEventListener("load", () => {
      fields.image.value = reader.result;
      updatePreview();
    });
    reader.readAsDataURL(file);
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const ingredients = fields.ingredients.value
      .split(/\n|,/)
      .map((entry) => entry.trim())
      .filter(Boolean);
    const item = {
      id: fields.id.value || makeId(fields.name.value),
      name: fields.name.value.trim(),
      tagline: ingredients.length ? `${ingredients.length} ingredientes selecionados` : "Burger artesanal",
      category: fields.category.value,
      price: Number(fields.price.value) || 0,
      image: fields.image.value.trim() || FALLBACK_IMAGE,
      explodedImage: fields.explodedImage.value.trim() || FALLBACK_EXPLODED,
      ingredients,
      description: fields.description.value.trim(),
      active: fields.active.checked,
      featured: fields.featured.checked
    };

    if (!item.name || !item.description) {
      form.reportValidity();
      return;
    }

    const index = menu.findIndex((entry) => entry.id === item.id);
    if (index >= 0) {
      menu[index] = item;
    } else {
      menu = [item, ...menu];
    }
    persist();
    setFieldDefaults();
  });

  list.addEventListener("click", (event) => {
    const edit = event.target.closest("[data-edit]");
    const toggle = event.target.closest("[data-toggle]");
    const remove = event.target.closest("[data-remove]");

    if (edit) {
      const item = menu.find((entry) => entry.id === edit.dataset.edit);
      if (item) fillForm(item);
    }

    if (toggle) {
      menu = menu.map((item) => item.id === toggle.dataset.toggle ? { ...item, active: !item.active } : item);
      persist();
    }

    if (remove) {
      const item = menu.find((entry) => entry.id === remove.dataset.remove);
      if (item && confirm(`Remover "${item.name}" do cardápio?`)) {
        menu = menu.filter((entry) => entry.id !== remove.dataset.remove);
        persist();
      }
    }
  });

  document.querySelector("#clear-form").addEventListener("click", setFieldDefaults);
  document.querySelector("#reset-menu").addEventListener("click", () => {
    if (!confirm("Restaurar o cardápio inicial da Casa Burguer?")) return;
    menu = defaultMenu;
    writeMenu(menu);
    renderList();
    setFieldDefaults();
  });

  setFieldDefaults();
  renderList();
}

if (page === "store") initStore();
if (page === "dashboard") initDashboard();
