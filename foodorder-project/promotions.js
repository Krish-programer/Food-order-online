// Render the public promotions from the same localStorage list used by admin.
(function () {
  "use strict";

  const key = "foodorder-promotions";
  const defaults = [
    { id: "welcome20", title: "20% OFF Your First Order", description: "Enjoy an instant 20% discount on your very first order when you spend ₹500 or more.", code: "WELCOME20", label: "🎉 LIMITED TIME OFFER", icon: "🎉", terms: "Sample preview only. Expiry and eligibility are not configured; no offer is confirmed." },
    { id: "bogo-pizza", title: "Buy 1 Get 1 — Pizza Night", description: "Order any medium or large artisan pizza and receive a second pizza of equal or lesser value free.", code: "BOGOPIZZA", label: "BOGO DEAL", icon: "🍕", terms: "Informational sample only; not active or service-verified." },
    { id: "freeship30", title: "Free Delivery on Orders ₹600+", description: "Get zero delivery fee on all your favorite meals when your cart subtotal reaches ₹600 or higher.", code: "FREESHIP30", label: "FREE SHIPPING", icon: "🚚", terms: "Informational sample only; expiry is not configured." },
    { id: "student15", title: "Student Discount — 15% Off", description: "Fuel your study sessions with 15% off all menu items. Valid anytime with active student email.", code: "STUDENT15", label: "STUDENT SPECIAL", icon: "🎓", terms: "Informational sample only; eligibility is not configured." },
    { id: "weekend10", title: "Weekend Feast — ₹200 Off ₹1,000+", description: "Save ₹200 on all orders over ₹1,000 placed Friday through Sunday.", code: "WEEKEND10", label: "WEEKEND FEAST", icon: "🎉", terms: "Informational sample only; dates are not configured." }
  ];
  const escapeHtml = value => String(value == null ? "" : value).replace(/[&<>"']/g, character => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[character]));

  function getPromotions() {
    const saved = localStorage.getItem(key);
    if (saved === null) {
      localStorage.setItem(key, JSON.stringify(defaults));
      return defaults;
    }
    const promotions = JSON.parse(saved);
    if (!Array.isArray(promotions)) throw new Error("Saved promotions must be a list.");
    return promotions;
  }

  function draw() {
    const hero = document.querySelector(".promo-hero-card");
    const deals = document.querySelector(".deals-grid");
    if (!hero || !deals) return;
    const promotions = getPromotions();
    const featured = promotions[0];
    if (!featured) {
      hero.innerHTML = `<div><span class="badge promo-hero-badge">NO CURRENT OFFERS</span><h2 class="promo-hero-title">Check back for new <span class="accent">promotions</span></h2><p class="promo-hero-desc">New FoodOrder offers will appear here.</p><a class="btn orange-btn" href="menu.html">Browse menu →</a></div>`;
    } else {
      hero.innerHTML = `
        <div>
          <span class="badge promo-hero-badge">${escapeHtml(featured.label)}</span>
          <h2 class="promo-hero-title">${escapeHtml(featured.title)}</h2>
          <p class="promo-hero-desc">${escapeHtml(featured.description)}</p>
          <div class="promo-coupon-action">
            <div class="promo-hero-coupon"><span class="coupon-label">COUPON CODE:</span><b class="coupon-code">${escapeHtml(featured.code)}</b></div>
            <a class="btn orange-btn" href="menu.html">Order Now →</a>
          </div>
          <p class="promo-hero-note">* ${escapeHtml(featured.terms)}</p>
        </div>
        <div class="hero-img promo-hero-img">
          <img src="https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=800&q=85" alt="FoodOrder promotion">
        </div>`;
    }
    deals.innerHTML = promotions.slice(1).map(promo => `
      <article class="food-card deal-card">
        <div>
          <div class="deal-card-header">
            <div class="number deal-card-icon">${escapeHtml(promo.icon)}</div>
            <span class="badge deal-badge ${/FREE|DELIVERY/i.test(promo.label) ? "badge-green" : "badge-yellow"}">${escapeHtml(promo.label)}</span>
          </div>
          <h3 class="deal-card-title">${escapeHtml(promo.title)}</h3>
          <p class="deal-card-desc">${escapeHtml(promo.description)}</p>
        </div>
        <div>
          <div class="deal-coupon-box"><span class="deal-coupon-label">CODE:</span><b class="deal-coupon-code">${escapeHtml(promo.code)}</b></div>
          <div class="deal-card-footer"><span>${escapeHtml(promo.terms)}</span></div>
        </div>
      </article>`).join("") || `<p class="subtitle">There are no additional deals at this time.</p>`;
  }

  try {
    draw();
  } catch (error) {
    console.error("Could not display FoodOrder promotions.", error);
    const host = document.querySelector(".deals-grid");
    if (host) host.innerHTML = `<p class="subtitle">Promotions could not be loaded. Please refresh the page.</p>`;
  }
})();
