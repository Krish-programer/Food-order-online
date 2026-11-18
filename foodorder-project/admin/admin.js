// FoodOrder admin pages use localStorage so the project works without a server.
(function () {
  "use strict";

  const KEYS = {
    items: "foodorder-menu-items",
    orders: "foodorder-orders",
    messages: "foodorder-messages",
    promotions: "foodorder-promotions"
  };
  const STATUSES = ["Pending", "Preparing", "Delivered", "Cancelled"];
  const TITLES = {
    dashboard: "Dashboard",
    items: "Manage food items",
    "item-form": "Add food item",
    orders: "Manage orders",
    "order-details": "Order details",
    customers: "Manage customers",
    promotions: "Promotions and coupons",
    messages: "Customer messages"
  };
  const NAVIGATION = [
    ["dashboard", "Dashboard", "▦", "index.html"],
    ["items", "Food items", "🍽", "items.html"],
    ["orders", "Orders", "▤", "orders.html"],
    ["customers", "Customers", "♙", "customers.html"],
    ["promotions", "Promotions", "％", "promotions.html"],
    ["messages", "Messages", "✉", "messages.html"]
  ];
  const page = document.body.dataset.page;
  const content = document.getElementById("adminContent");
  const $ = (selector, root) => (root || document).querySelector(selector);
  const escapeHtml = value => String(value == null ? "" : value).replace(/[&<>"']/g, character => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[character]));
  const money = value => "₹" + Number(value || 0).toLocaleString("en-IN", {
    maximumFractionDigits: 2
  });
  const makeId = prefix => prefix + "-" + Date.now().toString(36) + "-" +
    Math.random().toString(36).slice(2, 7);

  function nextMenuItemId(items) {
    const highestId = items.reduce((highest, item) => Math.max(highest, Number(item.id) || 0), -1);
    const savedNextId = Number(localStorage.getItem("foodorder-next-menu-id"));
    const nextId = Math.max(highestId + 1, Number.isSafeInteger(savedNextId) ? savedNextId : 0);
    localStorage.setItem("foodorder-next-menu-id", String(nextId + 1));
    return nextId;
  }

  function readValue(key, fallback) {
    const saved = localStorage.getItem(key);
    if (saved === null) return fallback;
    try {
      return JSON.parse(saved);
    } catch (error) {
      console.error("Could not read saved FoodOrder data for " + key, error);
      throw new Error("Saved data for " + key + " is damaged. Clear that value from localStorage and reload.");
    }
  }

  function readList(key) {
    const list = readValue(key, []);
    if (!Array.isArray(list)) throw new Error("Saved data for " + key + " is not a list.");
    return list;
  }

  function writeValue(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  function showToast(message) {
    const toast = document.getElementById("adminToast");
    toast.textContent = message;
    toast.classList.add("show");
    window.clearTimeout(showToast.timeoutId);
    showToast.timeoutId = window.setTimeout(() => toast.classList.remove("show"), 2600);
  }

  function displayError(message) {
    content.innerHTML = `<section class="admin-panel"><h2>Admin page could not load</h2><p>${escapeHtml(message)}</p></section>`;
  }

  function initialItems() {
    if (localStorage.getItem(KEYS.items) !== null) return readList(KEYS.items);
    const catalog = window.FoodMenuCatalog;
    if (!Array.isArray(catalog) || catalog.length === 0) {
      throw new Error("The food catalog was not loaded. Open this page from the project folder.");
    }
    const items = catalog.map(item => ({
      ...item,
      id: item.id,
      price: Number(item.price),
      rating: Number(item.rating)
    }));
    writeValue(KEYS.items, items);
    return items;
  }

  const DEFAULT_PROMOTIONS = [
    {
      id: "welcome20",
      title: "20% OFF Your First Order",
      description: "Enjoy an instant 20% discount on your very first order when you spend ₹500 or more.",
      code: "WELCOME20",
      label: "🎉 LIMITED TIME OFFER",
      icon: "🎉",
      terms: "Sample preview only. Expiry and eligibility are not configured; no offer is confirmed."
    },
    {
      id: "bogo-pizza",
      title: "Buy 1 Get 1 — Pizza Night",
      description: "Order any medium or large artisan pizza and receive a second pizza of equal or lesser value free.",
      code: "BOGOPIZZA",
      label: "BOGO DEAL",
      icon: "🍕",
      terms: "Informational sample only; not active or service-verified."
    },
    {
      id: "freeship30",
      title: "Free Delivery on Orders ₹600+",
      description: "Get zero delivery fee on all your favorite meals when your cart subtotal reaches ₹600 or higher.",
      code: "FREESHIP30",
      label: "FREE SHIPPING",
      icon: "🚚",
      terms: "Informational sample only; expiry is not configured."
    },
    {
      id: "student15",
      title: "Student Discount — 15% Off",
      description: "Fuel your study sessions with 15% off all menu items. Valid anytime with active student email.",
      code: "STUDENT15",
      label: "STUDENT SPECIAL",
      icon: "🎓",
      terms: "Informational sample only; eligibility is not configured."
    },
    {
      id: "weekend10",
      title: "Weekend Feast — ₹200 Off ₹1,000+",
      description: "Save ₹200 on all orders over ₹1,000 placed Friday through Sunday.",
      code: "WEEKEND10",
      label: "WEEKEND FEAST",
      icon: "🎉",
      terms: "Informational sample only; dates are not configured."
    }
  ];

  function initialPromotions() {
    if (localStorage.getItem(KEYS.promotions) !== null) return readList(KEYS.promotions);
    writeValue(KEYS.promotions, DEFAULT_PROMOTIONS);
    return DEFAULT_PROMOTIONS.slice();
  }

  function renderShell() {
    const sidebar = document.getElementById("adminSidebar");
    const overlay = document.createElement("div");
    overlay.className = "admin-overlay";
    overlay.id = "adminOverlay";
    document.body.appendChild(overlay);

    sidebar.innerHTML = `
      <a class="admin-brand" href="index.html">
        <span class="logo-mark">⚑</span>
        <span>Food<span>Order</span></span>
      </a>
      <p class="admin-nav-label">WORKSPACE</p>
      <nav class="admin-nav" aria-label="Admin navigation">
        ${NAVIGATION.map(([key, label, icon, href]) =>
          `<a href="${href}" class="${page === key || (page === "item-form" && key === "items") || (page === "order-details" && key === "orders") ? "active" : ""}">
            <span class="admin-nav-icon" aria-hidden="true">${icon}</span>${label}
          </a>`).join("")}
      </nav>
      <div class="admin-sidebar-footer">
        <a href="../index.html"><span class="admin-nav-icon" aria-hidden="true">↗</span>View website</a>
      </div>`;

    const notice = document.createElement("p");
    notice.className = "admin-demo-note";
    notice.textContent = "Local demo only: admin data stays in this browser. Checkout entries are previews, not restaurant orders; no payment is processed.";
    document.querySelector(".admin-main").insertBefore(notice, content);

    const toggle = document.getElementById("sidebarToggle");
    const closeSidebar = () => {
      sidebar.classList.remove("open");
      overlay.classList.remove("visible");
      toggle.setAttribute("aria-expanded", "false");
    };
    toggle.addEventListener("click", () => {
      const open = !sidebar.classList.contains("open");
      sidebar.classList.toggle("open", open);
      overlay.classList.toggle("visible", open);
      toggle.setAttribute("aria-expanded", String(open));
    });
    overlay.addEventListener("click", closeSidebar);
    sidebar.querySelectorAll("a").forEach(link => link.addEventListener("click", closeSidebar));
    $("#pageTitle").textContent = TITLES[page] || "Admin";
  }

  function emptyRow(columns, message) {
    return `<tr><td class="admin-empty" colspan="${columns}">${escapeHtml(message)}</td></tr>`;
  }

  function sortedOrders() {
    let orders;
    if (localStorage.getItem(KEYS.orders) === null) {
      const history = readValue("foodorder-preview-history", []);
      if (!Array.isArray(history)) throw new Error("Saved checkout previews are not a list.");
      const catalog = window.FoodMenuCatalog || [];
      orders = history.map(entry => {
        const details = String(entry.details || "");
        const itemsText = details.match(/^Items:\s*(.*)$/m);
        const items = (itemsText ? itemsText[1] : "").split(/,\s*/).filter(Boolean).map(line => {
          const match = line.match(/^(.*?)\s*[×x]\s*(\d+)\s*$/);
          const name = match ? match[1] : line;
          const savedItem = catalog.find(item => item.name === name);
          return {
            id: savedItem ? savedItem.id : null,
            name,
            unitPrice: savedItem ? Number(savedItem.price) : null,
            quantity: match ? Number(match[2]) : 1
          };
        });
        const savedDate = new Date(entry.date);
        const total = Number(String(entry.total || "").replace(/[^\d.]/g, "")) || 0;
        const method = details.match(/^Selected payment method:\s*(.*)$/m);
        return {
          id: String(entry.reference || makeId("legacy-preview")),
          createdAt: Number.isNaN(savedDate.getTime()) ? new Date().toISOString() : savedDate.toISOString(),
          customer: { name: "Details not recorded (older preview)", email: "", phone: "", address: "" },
          items,
          subtotal: null,
          tax: null,
          total,
          paymentMethod: method ? method[1] : "Not recorded",
          status: "Pending",
          localPreview: true,
          legacyPreview: true
        };
      });
      writeValue(KEYS.orders, orders);
    } else {
      orders = readList(KEYS.orders);
    }
    return orders.slice().sort((a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  function statusBadge(status) {
    const validStatus = STATUSES.includes(status) ? status : "Pending";
    return `<span class="status-badge ${validStatus.toLowerCase()}">${validStatus}</span>`;
  }

  function orderItemsLabel(order) {
    return (order.items || []).map(item =>
      `${escapeHtml(item.name)} × ${Number(item.quantity) || 0}`).join(", ");
  }

  function renderDashboard() {
    const orders = sortedOrders();
    const items = initialItems();
    const messages = readList(KEYS.messages);
    const revenue = orders.filter(order => order.status !== "Cancelled")
      .reduce((sum, order) => sum + Number(order.total || 0), 0);
    const stats = [
      ["Total orders", orders.length, "▤"],
      ["Total revenue (preview)", money(revenue), "₹"],
      ["Menu items", items.length, "🍽"],
      ["Messages", messages.length, "✉"]
    ];

    content.innerHTML = `
      <section class="admin-stats">
        ${stats.map(([label, value, icon]) => `<article class="admin-stat">
          <span class="admin-stat-icon" aria-hidden="true">${icon}</span>
          <span class="admin-stat-label">${label}</span>
          <strong class="admin-stat-value">${escapeHtml(value)}</strong>
        </article>`).join("")}
      </section>
      <section class="admin-panel">
        <div class="admin-panel-heading"><h2>Recent checkout previews</h2><a class="admin-button secondary" href="orders.html">View all orders</a></div>
        <div class="admin-table-wrap"><table class="admin-table">
          <thead><tr><th>Order</th><th>Date</th><th>Customer</th><th>Total</th><th>Status</th><th></th></tr></thead>
          <tbody>${orders.length ? orders.slice(0, 5).map(order => `<tr>
            <td>${escapeHtml(order.id)}</td>
            <td>${escapeHtml(new Date(order.createdAt).toLocaleString())}</td>
            <td>${escapeHtml(order.customer.name)}</td>
            <td>${money(order.total)}</td><td>${statusBadge(order.status)}</td>
            <td><a class="admin-button secondary small" href="order-details.html?id=${encodeURIComponent(order.id)}">Details</a></td>
          </tr>`).join("") : emptyRow(6, "No checkout previews have been saved from this browser yet.")}</tbody>
        </table></div>
      </section>`;
  }

  function renderItems() {
    const items = initialItems();
    const categories = [...new Set(items.map(item => item.category).filter(Boolean))].sort();
    content.innerHTML = `
      <section class="admin-panel">
        <div class="admin-panel-heading"><h2>Food catalog</h2><a class="admin-button" href="item-form.html">＋ Add food item</a></div>
        <div class="admin-tools">
          <input type="search" id="itemSearch" placeholder="Search by name" aria-label="Search food items">
          <select id="categoryFilter" aria-label="Filter by category"><option value="">All categories</option>
            ${categories.map(category => `<option value="${escapeHtml(category)}">${escapeHtml(category)}</option>`).join("")}
          </select>
          <span class="admin-panel-label" id="itemCount"></span>
        </div>
        <div class="admin-table-wrap"><table class="admin-table">
          <thead><tr><th>Image</th><th>Name</th><th>Category</th><th>Type</th><th>Price</th><th>Actions</th></tr></thead>
          <tbody id="itemRows"></tbody>
        </table></div>
      </section>`;

    const draw = () => {
      const query = $("#itemSearch").value.trim().toLowerCase();
      const category = $("#categoryFilter").value;
      const filtered = initialItems().filter(item =>
        (!query || item.name.toLowerCase().includes(query)) &&
        (!category || item.category === category));
      $("#itemCount").textContent = `${filtered.length} item${filtered.length === 1 ? "" : "s"}`;
      $("#itemRows").innerHTML = filtered.length ? filtered.map(item => {
        const vegetarian = item.tag === "VEG";
        const image = String(item.image || "").startsWith("http")
          ? item.image
          : "../" + String(item.image || "");
        return `<tr>
          <td><img class="admin-food-thumb" src="${escapeHtml(image)}" alt="${escapeHtml(item.name)}" onerror="this.onerror=null;this.src='../images/menu/Pannertika.png'"></td>
          <td><strong>${escapeHtml(item.name)}</strong></td>
          <td>${escapeHtml(item.category)}</td>
          <td><span class="admin-chip ${vegetarian ? "" : "non-veg"}">${vegetarian ? "Veg" : "Non-veg"}</span></td>
          <td>${money(item.price)}</td>
          <td><div class="admin-actions">
            <a class="admin-button secondary small" href="item-form.html?id=${encodeURIComponent(item.id)}">Edit</a>
            <button class="admin-button danger small" type="button" data-delete-item="${escapeHtml(item.id)}">Delete</button>
          </div></td>
        </tr>`;
      }).join("") : emptyRow(6, "No food items match this search.");
    };
    $("#itemSearch").addEventListener("input", draw);
    $("#categoryFilter").addEventListener("change", draw);
    $("#itemRows").addEventListener("click", event => {
      const button = event.target.closest("[data-delete-item]");
      if (!button) return;
      const target = initialItems().find(item => String(item.id) === button.dataset.deleteItem);
      if (!target || !window.confirm(`Delete "${target.name}" from the menu?`)) return;
      try {
        writeValue(KEYS.items, initialItems().filter(item => String(item.id) !== button.dataset.deleteItem));
        draw();
        showToast("Food item deleted.");
      } catch (error) {
        showToast(error.message);
      }
    });
    draw();
  }

  function setFieldError(name, message) {
    const field = $(`[name="${name}"]`, content);
    const error = $(`[data-error="${name}"]`, content);
    field.classList.toggle("invalid", Boolean(message));
    field.setAttribute("aria-invalid", String(Boolean(message)));
    error.textContent = message;
  }

  function validImagePath(value) {
    if (/^https?:\/\//i.test(value)) {
      try {
        const url = new URL(value);
        return Boolean(url.hostname) && /\.(?:avif|gif|jpe?g|png|svg|webp)(?:$|[?#])/i.test(url.href);
      } catch {
        return false;
      }
    }
    return /^images\/[A-Za-z0-9._/() -]+\.(?:avif|gif|jpe?g|png|svg|webp)$/i.test(value) &&
      !value.includes("..");
  }

  function loadImage(value) {
    return new Promise((resolve, reject) => {
      const image = new Image();
      const timer = window.setTimeout(() => {
        image.src = "";
        reject(new Error("The image took too long to load."));
      }, 8000);
      image.onload = () => {
        window.clearTimeout(timer);
        resolve();
      };
      image.onerror = () => {
        window.clearTimeout(timer);
        reject(new Error("This image could not be loaded."));
      };
      image.src = /^https?:\/\//i.test(value) ? value : "../" + value;
    });
  }

  function renderItemForm() {
    const items = initialItems();
    const params = new URLSearchParams(location.search);
    const editId = params.get("id");
    const current = editId ? items.find(item => String(item.id) === editId) : null;
    if (editId && !current) {
      content.innerHTML = `<section class="admin-panel"><h2>Food item not found</h2><a class="admin-button secondary" href="items.html">Back to food items</a></section>`;
      return;
    }
    const categories = [...new Set(items.map(item => item.category).filter(Boolean))].sort();
    $("#pageTitle").textContent = current ? "Edit food item" : "Add food item";
    content.innerHTML = `
      <section class="admin-panel">
        <h2>${current ? "Edit menu item" : "Add a new menu item"}</h2>
        <p class="admin-help">Images can be a project image path such as images/menu/Pannertika.png or an image URL.</p>
        <form id="itemForm" novalidate>
          <div class="admin-form-grid">
            <label class="admin-field">Food name
              <input name="name" type="text" maxlength="60" value="${escapeHtml(current ? current.name : "")}" autocomplete="off">
              <span class="admin-field-error" data-error="name"></span>
            </label>
            <label class="admin-field">Price (₹)
              <input name="price" type="number" min="0.01" step="0.01" value="${escapeHtml(current ? current.price : "")}">
              <span class="admin-field-error" data-error="price"></span>
            </label>
            <label class="admin-field">Category
              <input name="category" type="text" list="foodCategories" maxlength="40" value="${escapeHtml(current ? current.category : "")}" autocomplete="off">
              <datalist id="foodCategories">${categories.map(category => `<option value="${escapeHtml(category)}"></option>`).join("")}</datalist>
              <span class="admin-field-error" data-error="category"></span>
            </label>
            <label class="admin-field">Food type
              <select name="tag">
                <option value="VEG" ${!current || current.tag === "VEG" ? "selected" : ""}>Vegetarian</option>
                <option value="NON-VEG" ${current && current.tag === "NON-VEG" ? "selected" : ""}>Non-vegetarian</option>
              </select>
              <span class="admin-field-error" data-error="tag"></span>
            </label>
            <label class="admin-field full-width">Image path or URL
              <input name="image" type="text" maxlength="500" value="${escapeHtml(current ? current.image : "")}" placeholder="images/menu/Pannertika.png">
              <span class="admin-field-error" data-error="image"></span>
              <img class="admin-image-preview" id="itemImagePreview" alt="Selected food image preview" hidden>
            </label>
            <label class="admin-field full-width">Description
              <textarea name="description" maxlength="500">${escapeHtml(current ? current.description : "")}</textarea>
              <span class="admin-field-error" data-error="description"></span>
            </label>
          </div>
          <div class="admin-form-actions">
            <button class="admin-button" type="submit">${current ? "Save changes" : "Add food item"}</button>
            <a class="admin-button secondary" href="items.html">Cancel</a>
          </div>
          <p class="admin-help" id="itemFormMessage" role="status"></p>
        </form>
      </section>`;

    const form = $("#itemForm");
    const imageInput = $('[name="image"]', form);
    const preview = $("#itemImagePreview");
    const updatePreview = () => {
      const value = imageInput.value.trim();
      if (!validImagePath(value)) {
        preview.hidden = true;
        preview.removeAttribute("src");
        return;
      }
      preview.hidden = false;
      preview.src = /^https?:\/\//i.test(value) ? value : "../" + value;
      preview.onerror = () => {
        preview.hidden = true;
        setFieldError("image", "This image could not be loaded. Check the path or URL.");
      };
      preview.onload = () => setFieldError("image", "");
    };
    imageInput.addEventListener("input", updatePreview);
    updatePreview();

    form.addEventListener("submit", async event => {
      event.preventDefault();
      const data = Object.fromEntries(new FormData(form).entries());
      const values = {
        name: String(data.name || "").trim(),
        price: String(data.price || "").trim(),
        category: String(data.category || "").trim(),
        tag: String(data.tag || ""),
        image: String(data.image || "").trim(),
        description: String(data.description || "").trim()
      };
      const errors = {
        name: values.name.length < 3 || values.name.length > 60
          ? "Enter a name between 3 and 60 characters." : "",
        price: !Number.isFinite(Number(values.price)) || Number(values.price) <= 0
          ? "Price must be a positive number." : "",
        category: values.category.length < 2 || values.category.length > 40
          ? "Enter a category between 2 and 40 characters." : "",
        tag: ["VEG", "NON-VEG"].includes(values.tag) ? "" : "Choose veg or non-veg.",
        image: validImagePath(values.image) ? "" : "Enter a valid image path or HTTP(S) image URL.",
        description: values.description.length < 10 || values.description.length > 500
          ? "Description must be between 10 and 500 characters." : ""
      };
      const nameExists = items.some(item =>
        item.name.toLowerCase() === values.name.toLowerCase() && String(item.id) !== editId);
      if (nameExists) errors.name = "A food item with this name already exists.";
      Object.entries(errors).forEach(([name, error]) => setFieldError(name, error));
      if (Object.values(errors).some(Boolean)) return;

      const submit = form.querySelector('[type="submit"]');
      submit.disabled = true;
      $("#itemFormMessage").textContent = "Checking image…";
      try {
        await loadImage(values.image);
        const savedItem = {
          ...(current || {}),
          id: current ? current.id : nextMenuItemId(initialItems()),
          page: current ? current.page : 1,
          name: values.name,
          price: Number(values.price),
          category: values.category,
          tag: values.tag,
          image: values.image,
          description: values.description,
          rating: current ? Number(current.rating) || 4.5 : 4.5,
          badge: current ? current.badge || "" : ""
        };
        const nextItems = current
          ? initialItems().map(item => String(item.id) === editId ? savedItem : item)
          : [...initialItems(), savedItem];
        writeValue(KEYS.items, nextItems);
        location.href = "items.html";
      } catch (error) {
        submit.disabled = false;
        $("#itemFormMessage").textContent = error.message || "Could not save this food item.";
        if (error.message && error.message.includes("image")) {
          setFieldError("image", "Could not load this image. Check the URL/path and try again.");
        }
      }
    });
  }

  function renderOrders() {
    const orders = sortedOrders();
    content.innerHTML = `
      <section class="admin-panel">
        <div class="admin-panel-heading"><h2>Local checkout previews</h2><span class="admin-panel-label">${orders.length} total</span></div>
        <p class="admin-help">These are saved browser previews only. Changing a status is a demonstration; it does not update a restaurant order.</p>
        <div class="admin-tools"><select id="orderStatusFilter" aria-label="Filter orders by status">
          <option value="">All statuses</option>${STATUSES.map(status => `<option>${status}</option>`).join("")}
        </select></div>
        <div class="admin-table-wrap"><table class="admin-table">
          <thead><tr><th>Order</th><th>Date</th><th>Customer</th><th>Items</th><th>Total</th><th>Status</th><th></th></tr></thead>
          <tbody id="orderRows"></tbody>
        </table></div>
      </section>`;

    const draw = () => {
      const selected = $("#orderStatusFilter").value;
      const filtered = sortedOrders().filter(order => !selected || order.status === selected);
      $("#orderRows").innerHTML = filtered.length ? filtered.map(order => `<tr>
        <td><strong>${escapeHtml(order.id)}</strong></td>
        <td>${escapeHtml(new Date(order.createdAt).toLocaleString())}</td>
        <td>${escapeHtml(order.customer.name)}</td>
        <td>${orderItemsLabel(order)}</td>
        <td>${money(order.total)}</td>
        <td><select class="admin-status-select" data-order-status="${escapeHtml(order.id)}" aria-label="Status for ${escapeHtml(order.id)}">
          ${STATUSES.map(status => `<option ${status === order.status ? "selected" : ""}>${status}</option>`).join("")}
        </select></td>
        <td><a class="admin-button secondary small" href="order-details.html?id=${encodeURIComponent(order.id)}">Details</a></td>
      </tr>`).join("") : emptyRow(7, "No orders match this filter.");
    };
    $("#orderStatusFilter").addEventListener("change", draw);
    content.addEventListener("change", event => {
      const select = event.target.closest("[data-order-status]");
      if (!select) return;
      try {
        const orders = readList(KEYS.orders);
        const order = orders.find(item => item.id === select.dataset.orderStatus);
        if (!order) throw new Error("That order no longer exists.");
        order.status = select.value;
        writeValue(KEYS.orders, orders);
        showToast(`Order updated to ${select.value}.`);
        draw();
      } catch (error) {
        showToast(error.message);
      }
    });
    draw();
  }

  function renderOrderDetails() {
    const id = new URLSearchParams(location.search).get("id");
    const order = sortedOrders().find(item => item.id === id);
    if (!order) {
      content.innerHTML = `<section class="admin-panel"><h2>Order not found</h2><p class="admin-help">This order may have been removed from this browser.</p><a class="admin-button secondary" href="orders.html">Back to orders</a></section>`;
      return;
    }
    $("#pageTitle").textContent = "Order " + order.id;
    content.innerHTML = `
      <section class="admin-panel">
        <div class="admin-panel-heading">
          <div><h2>${escapeHtml(order.id)}</h2><p class="admin-help">${escapeHtml(new Date(order.createdAt).toLocaleString())}</p></div>
          <a class="admin-button secondary" href="orders.html">← Back to orders</a>
        </div>
        <div class="admin-detail-grid">
          <div class="admin-detail"><span class="admin-detail-label">Customer</span><div class="admin-detail-value">${escapeHtml(order.customer.name)}</div></div>
          <div class="admin-detail"><span class="admin-detail-label">Email</span><div class="admin-detail-value">${escapeHtml(order.customer.email)}</div></div>
          <div class="admin-detail"><span class="admin-detail-label">Phone</span><div class="admin-detail-value">${escapeHtml(order.customer.phone)}</div></div>
          <div class="admin-detail"><span class="admin-detail-label">Delivery address</span><div class="admin-detail-value">${escapeHtml(order.customer.address)}</div></div>
          <div class="admin-detail"><span class="admin-detail-label">Payment</span><div class="admin-detail-value">${escapeHtml(order.paymentMethod)}</div></div>
          <div class="admin-detail"><span class="admin-detail-label">Status</span>
            <select class="admin-status-select" data-order-status="${escapeHtml(order.id)}">
              ${STATUSES.map(status => `<option ${status === order.status ? "selected" : ""}>${status}</option>`).join("")}
            </select>
          </div>
        </div>
      </section>
      <section class="admin-panel">
        <h2>Items ordered</h2>
        ${order.legacyPreview ? '<p class="admin-help">This older preview did not save customer details or exact item prices. Prices shown below, when available, are current catalog estimates.</p>' : ""}
        <div class="admin-table-wrap"><table class="admin-table">
          <thead><tr><th>Item</th><th>Unit price</th><th>Quantity</th><th>Line total</th></tr></thead>
          <tbody>${order.items.map(item => `<tr>
            <td>${escapeHtml(item.name)}</td><td>${item.unitPrice == null ? "Not recorded" : money(item.unitPrice)}</td>
            <td>${Number(item.quantity) || 0}</td><td>${item.unitPrice == null ? "Not recorded" : money(Number(item.unitPrice) * Number(item.quantity))}</td>
          </tr>`).join("")}</tbody>
          <tfoot>
            <tr><td colspan="3"><strong>Subtotal</strong></td><td>${order.subtotal == null ? "Not recorded" : money(order.subtotal)}</td></tr>
            <tr><td colspan="3"><strong>GST</strong></td><td>${order.tax == null ? "Not recorded" : money(order.tax)}</td></tr>
            <tr><td colspan="3"><strong>Total</strong></td><td><strong>${money(order.total)}</strong></td></tr>
          </tfoot>
        </table></div>
      </section>`;
    content.addEventListener("change", event => {
      const select = event.target.closest("[data-order-status]");
      if (!select) return;
      try {
        const orders = readList(KEYS.orders);
        const target = orders.find(item => item.id === select.dataset.orderStatus);
        if (!target) throw new Error("That order no longer exists.");
        target.status = select.value;
        writeValue(KEYS.orders, orders);
        showToast("Order status saved.");
      } catch (error) {
        showToast(error.message);
      }
    });
  }

  function renderCustomers() {
    const customersByEmail = new Map();
    sortedOrders().forEach(order => {
      const customer = order.customer;
      const key = String(customer.email).toLowerCase();
      if (!customersByEmail.has(key)) {
        customersByEmail.set(key, {
          ...customer,
          orderCount: 0,
          totalSpent: 0,
          latestOrder: order.createdAt
        });
      }
      const current = customersByEmail.get(key);
      current.orderCount += 1;
      if (order.status !== "Cancelled") current.totalSpent += Number(order.total || 0);
    });
    const customers = [...customersByEmail.values()].sort((a, b) => b.orderCount - a.orderCount);
    content.innerHTML = `
      <section class="admin-panel">
        <div class="admin-panel-heading"><h2>Customers from local previews</h2><span class="admin-panel-label">${customers.length} customers</span></div>
        <div class="admin-table-wrap"><table class="admin-table">
          <thead><tr><th>Name</th><th>Email</th><th>Phone</th><th>Previews</th><th>Preview total</th><th>Latest preview</th></tr></thead>
          <tbody>${customers.length ? customers.map(customer => `<tr>
            <td><strong>${escapeHtml(customer.name)}</strong></td>
            <td>${escapeHtml(customer.email)}</td><td>${escapeHtml(customer.phone)}</td>
            <td>${customer.orderCount}</td><td>${money(customer.totalSpent)}</td>
            <td>${escapeHtml(new Date(customer.latestOrder).toLocaleDateString())}</td>
          </tr>`).join("") : emptyRow(6, "Customers appear here after they save a local checkout preview.")}</tbody>
        </table></div>
      </section>`;
  }

  function renderPromotions() {
    const promotions = initialPromotions();
    content.innerHTML = `
      <section class="admin-panel">
        <div class="admin-panel-heading">
          <div><h2>Promotion previews</h2><p class="admin-help">These sample offers appear on the public Promotions page. Only WELCOME20 has a local cart preview; expiry and eligibility are not verified.</p></div>
          <button class="admin-button" id="addPromotion" type="button">＋ Add coupon</button>
        </div>
        <div class="admin-table-wrap"><table class="admin-table">
          <thead><tr><th>Offer</th><th>Coupon code</th><th>Label</th><th>Terms</th><th>Actions</th></tr></thead>
          <tbody id="promotionRows">${promotions.length ? promotions.map(promo => `<tr>
            <td><strong>${escapeHtml(promo.title)}</strong><br><span class="admin-help">${escapeHtml(promo.description)}</span></td>
            <td><span class="admin-chip">${escapeHtml(promo.code)}</span></td>
            <td>${escapeHtml(promo.label)}</td><td>${escapeHtml(promo.terms)}</td>
            <td><div class="admin-actions">
              <button class="admin-button secondary small" type="button" data-edit-promotion="${escapeHtml(promo.id)}">Edit</button>
              <button class="admin-button danger small" type="button" data-delete-promotion="${escapeHtml(promo.id)}">Delete</button>
            </div></td>
          </tr>`).join("") : emptyRow(5, "No promotions yet. Add a coupon to publish an offer.")}</tbody>
        </table></div>
      </section>
      <section class="admin-panel" id="promotionFormPanel" hidden>
        <h2 id="promotionFormTitle">Add coupon</h2>
        <form id="promotionForm" novalidate>
          <div class="admin-form-grid">
            <label class="admin-field">Offer title
              <input name="title" type="text" maxlength="80">
              <span class="admin-field-error" data-error="title"></span>
            </label>
            <label class="admin-field">Coupon code
              <input name="code" type="text" maxlength="24" placeholder="SAVE20">
              <span class="admin-field-error" data-error="code"></span>
            </label>
            <label class="admin-field">Offer label
              <input name="label" type="text" maxlength="40" placeholder="WEEKEND SPECIAL">
              <span class="admin-field-error" data-error="label"></span>
            </label>
            <label class="admin-field">Card icon (emoji)
              <input name="icon" type="text" maxlength="8" placeholder="🎉">
              <span class="admin-field-error" data-error="icon"></span>
            </label>
            <label class="admin-field full-width">Description
              <textarea name="description" maxlength="240"></textarea>
              <span class="admin-field-error" data-error="description"></span>
            </label>
            <label class="admin-field full-width">Terms and validity
              <input name="terms" type="text" maxlength="160" placeholder="Valid on orders over ₹500">
              <span class="admin-field-error" data-error="terms"></span>
            </label>
          </div>
          <div class="admin-form-actions">
            <button class="admin-button" type="submit">Save coupon</button>
            <button class="admin-button secondary" id="cancelPromotion" type="button">Cancel</button>
          </div>
        </form>
      </section>`;

    const panel = $("#promotionFormPanel");
    const form = $("#promotionForm");
    let editingId = null;
    const resetForm = () => {
      editingId = null;
      form.reset();
      panel.hidden = true;
      $("#promotionFormTitle").textContent = "Add coupon";
      Object.keys({ title: 1, code: 1, label: 1, icon: 1, description: 1, terms: 1 })
        .forEach(name => setFieldError(name, ""));
    };
    $("#addPromotion").addEventListener("click", () => {
      resetForm();
      panel.hidden = false;
      $("#promotionFormTitle").textContent = "Add coupon";
      $('[name="title"]', form).focus();
    });
    $("#cancelPromotion").addEventListener("click", resetForm);
    $("#promotionRows").addEventListener("click", event => {
      const deleteButton = event.target.closest("[data-delete-promotion]");
      const editButton = event.target.closest("[data-edit-promotion]");
      if (deleteButton) {
        if (!window.confirm("Delete this coupon?")) return;
        try {
          writeValue(KEYS.promotions, readList(KEYS.promotions).filter(item => item.id !== deleteButton.dataset.deletePromotion));
          renderPromotions();
          showToast("Coupon deleted.");
        } catch (error) {
          showToast(error.message);
        }
      }
      if (editButton) {
        const promo = readList(KEYS.promotions).find(item => item.id === editButton.dataset.editPromotion);
        if (!promo) {
          showToast("That coupon could not be found.");
          return;
        }
        editingId = promo.id;
        Object.entries(promo).forEach(([key, value]) => {
          const field = $(`[name="${key}"]`, form);
          if (field) field.value = value;
        });
        panel.hidden = false;
        $("#promotionFormTitle").textContent = "Edit coupon";
        $('[name="title"]', form).focus();
      }
    });
    form.addEventListener("submit", event => {
      event.preventDefault();
      const values = Object.fromEntries(new FormData(form).entries());
      Object.keys(values).forEach(key => { values[key] = String(values[key]).trim(); });
      values.code = values.code.toUpperCase();
      const errors = {
        title: values.title.length < 3 ? "Enter an offer title with at least 3 characters." : "",
        code: /^[A-Z0-9-]{3,24}$/.test(values.code) ? "" : "Use 3–24 letters, numbers, or hyphens.",
        label: values.label.length < 2 ? "Enter a short offer label." : "",
        icon: values.icon.length < 1 ? "Add an emoji for this coupon." : "",
        description: values.description.length < 8 ? "Description must be at least 8 characters." : "",
        terms: values.terms.length < 3 ? "Add validity or coupon terms." : ""
      };
      const duplicate = readList(KEYS.promotions).some(item =>
        item.code.toLowerCase() === values.code.toLowerCase() && item.id !== editingId);
      if (duplicate) errors.code = "This coupon code is already in use.";
      Object.entries(errors).forEach(([name, message]) => setFieldError(name, message));
      if (Object.values(errors).some(Boolean)) return;

      try {
        const currentPromotions = readList(KEYS.promotions);
        const promo = { ...values, id: editingId || makeId("coupon") };
        const next = editingId
          ? currentPromotions.map(item => item.id === editingId ? promo : item)
          : [...currentPromotions, promo];
        writeValue(KEYS.promotions, next);
        renderPromotions();
        showToast(editingId ? "Coupon updated." : "Coupon added.");
      } catch (error) {
        showToast(error.message);
      }
    });
  }

  function renderMessages() {
    const messages = readList(KEYS.messages).slice().sort((a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    content.innerHTML = `
      <section class="admin-panel">
        <div class="admin-panel-heading"><h2>Locally saved contact messages</h2><span class="admin-panel-label">${messages.length} message${messages.length === 1 ? "" : "s"}</span></div>
        <p class="admin-help">Messages are stored in this browser only; they are not sent to FoodOrder.</p>
        <div class="admin-table-wrap"><table class="admin-table">
          <thead><tr><th>Saved</th><th>Name</th><th>Email</th><th>Message</th><th>Action</th></tr></thead>
          <tbody>${messages.length ? messages.map(message => `<tr>
            <td>${escapeHtml(new Date(message.createdAt).toLocaleString())}</td>
            <td><strong>${escapeHtml(message.name)}</strong></td><td>${escapeHtml(message.email)}</td>
            <td>${escapeHtml(message.message)}</td>
            <td><button class="admin-button danger small" type="button" data-delete-message="${escapeHtml(message.id)}">Delete</button></td>
          </tr>`).join("") : emptyRow(5, "No locally saved contact messages yet.")}</tbody>
        </table></div>
      </section>`;
    content.addEventListener("click", event => {
      const button = event.target.closest("[data-delete-message]");
      if (!button) return;
      if (!window.confirm("Delete this customer message?")) return;
      try {
        writeValue(KEYS.messages, readList(KEYS.messages).filter(message => message.id !== button.dataset.deleteMessage));
        renderMessages();
        showToast("Message deleted.");
      } catch (error) {
        showToast(error.message);
      }
    });
  }

  try {
    renderShell();
    initialItems();
    if (page === "dashboard") renderDashboard();
    else if (page === "items") renderItems();
    else if (page === "item-form") renderItemForm();
    else if (page === "orders") renderOrders();
    else if (page === "order-details") renderOrderDetails();
    else if (page === "customers") renderCustomers();
    else if (page === "promotions") renderPromotions();
    else if (page === "messages") renderMessages();
    else throw new Error("Unknown admin page.");
  } catch (error) {
    console.error("FoodOrder admin could not load.", error);
    displayError(error.message || "An unexpected error occurred.");
  }
})();
