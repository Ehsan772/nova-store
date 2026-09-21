/* =========================================================
   NOVA STORE - MAIN SCRIPT
   ========================================================= */

document.addEventListener("DOMContentLoaded", () => {

  /* =========================
     VARIABLES
  ========================= */

  let products = [];
  let cart = JSON.parse(localStorage.getItem("nova_cart") || "[]");
  let favorites = JSON.parse(localStorage.getItem("nova_favorites") || "[]");

  const productsGrid = document.getElementById("productsGrid");
  const searchInput = document.getElementById("searchInput");

  const cartCount = document.getElementById("cartCount");
  const favoriteCount = document.getElementById("favoriteCount");

  const productModal = document.getElementById("productModal");
  const cartModal = document.getElementById("cartModal");
  const favoritesModal = document.getElementById("favoritesModal");

  const productModalContent =
    document.getElementById("productModalContent");

  const cartItems =
    document.getElementById("cartItems");

  const favoritesItems =
    document.getElementById("favoritesItems");

  const cartTotal =
    document.getElementById("cartTotal");

  /* =========================
     SUPABASE
  ========================= */

  const SUPABASE_URL =
    "https://zwtbrgsphgjyczdibldj.supabase.co";

  const SUPABASE_KEY =
    "sb_publishable_rU0rSsuonmSoDYzK9-S1ig_uNPkAOha";

  let db = window.supabaseClient;

  if (!db && window.supabase) {
    db = window.supabase.createClient(
      SUPABASE_URL,
      SUPABASE_KEY
    );
  }

  /* =========================
     SAVE DATA
  ========================= */

  function saveCart() {
    localStorage.setItem(
      "nova_cart",
      JSON.stringify(cart)
    );
  }

  function saveFavorites() {
    localStorage.setItem(
      "nova_favorites",
      JSON.stringify(favorites)
    );
  }

  /* =========================
     COUNTS
  ========================= */

  function updateCounts() {

    if (cartCount) {
      const total = cart.reduce(
        (sum, item) => sum + (item.quantity || 1),
        0
      );

      cartCount.textContent = total;
    }

    if (favoriteCount) {
      favoriteCount.textContent = favorites.length;
    }
  }

  /* =========================
     FORMAT PRICE
  ========================= */

  function formatPrice(price) {

    if (price === undefined || price === null || price === "") {
      return "تماس بگیرید";
    }

    return Number(price).toLocaleString("fa-IR") + " تومان";
  }

  /* =========================
     ESCAPE HTML
  ========================= */

  function escapeHTML(value) {

    if (!value) return "";

    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  /* =========================
     PRODUCT CARD
  ========================= */

  function productCard(product) {

    const isFavorite =
      favorites.some(
        item => String(item.id) === String(product.id)
      );

    const oldPrice =
      product.old_price
        ? `<span class="old-price">
             ${formatPrice(product.old_price)}
           </span>`
        : "";

    const discount =
      product.discount
        ? `<span class="discount-badge">
             ${escapeHTML(product.discount)}٪
           </span>`
        : "";

    const newBadge =
      product.is_new
        ? `<span class="new-badge">جدید</span>`
        : "";

    const image =
      product.image ||
      "https://via.placeholder.com/600x600?text=Nova+Store";

    return `
      <article
        class="product-card"
        data-id="${escapeHTML(product.id)}"
      >

        <div class="product-image-wrap">

          <img
            src="${escapeHTML(image)}"
            alt="${escapeHTML(product.name)}"
            class="product-image"
            loading="lazy"
          >

          <div class="product-badges">
            ${newBadge}
            ${discount}
          </div>

          <button
            class="favorite-btn ${isFavorite ? "active" : ""}"
            data-favorite="${escapeHTML(product.id)}"
            aria-label="افزودن به علاقه‌مندی"
          >
            ${isFavorite ? "♥" : "♡"}
          </button>

        </div>

        <div class="product-info">

          <span class="product-category">
            ${escapeHTML(product.category || "محصول")}
          </span>

          <h3>
            ${escapeHTML(product.name || "محصول بدون نام")}
          </h3>

          <p class="product-description">
            ${escapeHTML(
              product.description ||
              product.text ||
              "توضیحات محصول"
            )}
          </p>

          <div class="product-price">
            ${oldPrice}
            <strong>
              ${formatPrice(product.price)}
            </strong>
          </div>

          <div class="product-actions">

            <button
              class="view-product"
              data-product="${escapeHTML(product.id)}"
            >
              مشاهده
            </button>

            <button
              class="add-cart"
              data-cart="${escapeHTML(product.id)}"
            >
              افزودن به سبد
            </button>

          </div>

        </div>

      </article>
    `;
  }

  /* =========================
     RENDER PRODUCTS
  ========================= */

  function renderProducts(list = products) {

    if (!productsGrid) return;

    if (!list.length) {

      productsGrid.innerHTML = `
        <div class="empty-products">
          <div class="empty-icon">🛍️</div>
          <h3>محصولی پیدا نشد</h3>
          <p>
            فعلاً محصولی در این بخش وجود ندارد.
          </p>
        </div>
      `;

      return;
    }

    productsGrid.innerHTML =
      list.map(productCard).join("");

    updateCounts();
  }

  /* =========================
     SET PRODUCTS
  ========================= */

  window.setNovaProducts = function (data) {

    products = Array.isArray(data)
      ? data
      : [];

    renderProducts(products);
    updateCounts();
  };

  /* =========================
     LOAD PRODUCTS
  ========================= */

  async function loadProducts() {

    if (!db) {
      console.error("Supabase پیدا نشد.");
      return;
    }

    try {

      const { data, error } =
        await db
          .from("products")
          .select("*")
          .order("created_at", {
            ascending: false
          });

      if (error) {
        console.error(error);

        if (!products.length) {
          renderProducts([]);
        }

        return;
      }

      products = data || [];

      renderProducts(products);

    } catch (error) {

      console.error(
        "خطا در دریافت محصولات:",
        error
      );

    }
  }

  /* =========================
     SEARCH
  ========================= */

  if (searchInput) {

    searchInput.addEventListener(
      "input",
      () => {

        const query =
          searchInput.value
            .trim()
            .toLowerCase();

        if (!query) {
          renderProducts(products);
          return;
        }

        const filtered =
          products.filter(product => {

            const name =
              String(product.name || "")
                .toLowerCase();

            const category =
              String(product.category || "")
                .toLowerCase();

            const description =
              String(
                product.description ||
                product.text ||
                ""
              ).toLowerCase();

            return (
              name.includes(query) ||
              category.includes(query) ||
              description.includes(query)
            );
          });

        renderProducts(filtered);
      }
    );
  }

  /* =========================
     CATEGORY FILTER
  ========================= */

  document.addEventListener(
    "click",
    event => {

      const category =
        event.target.closest(
          ".category-card"
        );

      if (!category) return;

      const categoryName =
        category.dataset.category;

      if (!categoryName) return;

      /*
       * فعلاً دسته‌بندی را در همان صفحه فیلتر می‌کنیم.
       * برای صفحه جداگانه بعداً category.html اضافه می‌کنیم.
       */

      const filtered =
        products.filter(product =>
          String(product.category || "")
            .trim()
            .toLowerCase() ===
          String(categoryName)
            .trim()
            .toLowerCase()
        );

      if (filtered.length) {
        renderProducts(filtered);

        const productsSection =
          document.getElementById("products");

        if (productsSection) {
          productsSection.scrollIntoView({
            behavior: "smooth"
          });
        }

      } else {

        renderProducts([]);

        const productsSection =
          document.getElementById("products");

        if (productsSection) {
          productsSection.scrollIntoView({
            behavior: "smooth"
          });
        }
      }
    }
  );

  /* =========================
     SHOW ALL PRODUCTS
  ========================= */

  const showAll =
    document.getElementById("showAllProducts");

  if (showAll) {

    showAll.addEventListener(
      "click",
      () => {

        renderProducts(products);

        const productsSection =
          document.getElementById("products");

        if (productsSection) {
          productsSection.scrollIntoView({
            behavior: "smooth"
          });
        }
      }
    );
  }

  /* =========================
     FAVORITE
  ========================= */

  function toggleFavorite(id) {

    const product =
      products.find(
        item => String(item.id) === String(id)
      );

    if (!product) return;

    const index =
      favorites.findIndex(
        item => String(item.id) === String(id)
      );

    if (index >= 0) {

      favorites.splice(index, 1);

    } else {

      favorites.push(product);
    }

    saveFavorites();
    updateCounts();

    renderProducts(
      getCurrentVisibleProducts()
    );
  }

  /* =========================
     CURRENT PRODUCTS
  ========================= */

  function getCurrentVisibleProducts() {

    if (!productsGrid) {
      return products;
    }

    const cards =
      productsGrid.querySelectorAll(
        ".product-card"
      );

    if (!cards.length) {
      return products;
    }

    const ids =
      Array.from(cards)
        .map(card => card.dataset.id);

    return products.filter(product =>
      ids.includes(String(product.id))
    );
  }

  /* =========================
     CART
  ========================= */

  function addToCart(id) {

    const product =
      products.find(
        item => String(item.id) === String(id)
      );

    if (!product) return;

    const existing =
      cart.find(
        item => String(item.id) === String(id)
      );

    if (existing) {

      existing.quantity =
        (existing.quantity || 1) + 1;

    } else {

      cart.push({
        ...product,
        quantity: 1
      });
    }

    saveCart();
    updateCounts();

    showToast("محصول به سبد خرید اضافه شد 🛒");
  }

  function removeFromCart(id) {

    cart =
      cart.filter(
        item => String(item.id) !== String(id)
      );

    saveCart();
    renderCart();
    updateCounts();
  }

  function changeQuantity(id, amount) {

    const item =
      cart.find(
        product => String(product.id) === String(id)
      );

    if (!item) return;

    item.quantity =
      (item.quantity || 1) + amount;

    if (item.quantity <= 0) {
      removeFromCart(id);
      return;
    }

    saveCart();
    renderCart();
    updateCounts();
  }

  /* =========================
     RENDER CART
  ========================= */

  function renderCart() {

    if (!cartItems) return;

    if (!cart.length) {

      cartItems.innerHTML = `
        <div class="empty-cart">
          <div>🛒</div>
          <h3>سبد خرید خالی است</h3>
          <p>
            هنوز محصولی به سبد خرید اضافه نکرده‌اید.
          </p>
        </div>
      `;

      if (cartTotal) {
        cartTotal.textContent =
          formatPrice(0);
      }

      return;
    }

    cartItems.innerHTML =
      cart.map(item => {

        const image =
          item.image ||
          "https://via.placeholder.com/120";

        return `
          <div class="cart-item">

            <img
              src="${escapeHTML(image)}"
              alt="${escapeHTML(item.name)}"
            >

            <div class="cart-item-info">

              <h4>
                ${escapeHTML(item.name)}
              </h4>

              <strong>
                ${formatPrice(item.price)}
              </strong>

              <div class="quantity-controls">

                <button
                  data-minus="${escapeHTML(item.id)}"
                >
                  −
                </button>

                <span>
                  ${item.quantity || 1}
                </span>

                <button
                  data-plus="${escapeHTML(item.id)}"
                >
                  +
                </button>

              </div>

            </div>

            <button
              class="remove-cart"
              data-remove="${escapeHTML(item.id)}"
            >
              ×
            </button>

          </div>
        `;

      }).join("");

    const total =
      cart.reduce(
        (sum, item) =>
          sum +
          Number(item.price || 0) *
          Number(item.quantity || 1),
        0
      );

    if (cartTotal) {
      cartTotal.textContent =
        formatPrice(total);
    }
  }

  /* =========================
     FAVORITES MODAL
  ========================= */

  function renderFavorites() {

    if (!favoritesItems) return;

    if (!favorites.length) {

      favoritesItems.innerHTML = `
        <div class="empty-favorites">
          <div>♡</div>
          <h3>هنوز محصولی ذخیره نکرده‌اید</h3>
          <p>
            روی قلب محصولات بزنید تا اینجا ذخیره شوند.
          </p>
        </div>
      `;

      return;
    }

    favoritesItems.innerHTML =
      favorites.map(product => {

        const image =
          product.image ||
          "https://via.placeholder.com/150";

        return `
          <div class="favorite-item">

            <img
              src="${escapeHTML(image)}"
              alt="${escapeHTML(product.name)}"
            >

            <div>

              <h4>
                ${escapeHTML(product.name)}
              </h4>

              <strong>
                ${formatPrice(product.price)}
              </strong>

              <div class="favorite-actions">

                <button
                  data-fav-cart="${escapeHTML(product.id)}"
                >
                  افزودن به سبد
                </button>

                <button
                  data-fav-remove="${escapeHTML(product.id)}"
                >
                  حذف
                </button>

              </div>

            </div>

          </div>
        `;

      }).join("");
  }

  /* =========================
     PRODUCT MODAL
  ========================= */

  function openProduct(id) {

    const product =
      products.find(
        item => String(item.id) === String(id)
      );

    if (!product || !productModal) return;

    const image =
      product.image ||
      "https://via.placeholder.com/600";

    if (productModalContent) {

      productModalContent.innerHTML = `

        <div class="modal-product">

          <img
            src="${escapeHTML(image)}"
            alt="${escapeHTML(product.name)}"
          >

          <div class="modal-product-info">

            <span class="product-category">
              ${escapeHTML(
                product.category || "محصول"
              )}
            </span>

            <h2>
              ${escapeHTML(product.name)}
            </h2>

            <p>
              ${escapeHTML(
                product.description ||
                product.text ||
                "توضیحی برای این محصول ثبت نشده است."
              )}
            </p>

            <div class="modal-price">
              ${formatPrice(product.price)}
            </div>

            <button
              class="modal-add-cart"
              data-modal-cart="${escapeHTML(product.id)}"
            >
              افزودن به سبد خرید
            </button>

          </div>

        </div>

      `;
    }

    productModal.classList.add("active");
    document.body.classList.add("modal-open");
  }

  /* =========================
     CLOSE MODALS
  ========================= */

  function closeModal(modal) {

    if (!modal) return;

    modal.classList.remove("active");
    document.body.classList.remove("modal-open");
  }

  /* =========================
     GLOBAL CLICK HANDLER
  ========================= */

  document.addEventListener(
    "click",
    event => {

      /* Favorite */

      const favoriteButton =
        event.target.closest(
          "[data-favorite]"
        );

      if (favoriteButton) {

        event.stopPropagation();

        toggleFavorite(
          favoriteButton.dataset.favorite
        );

        return;
      }

      /* Add Cart */

      const cartButton =
        event.target.closest(
          "[data-cart]"
        );

      if (cartButton) {

        event.stopPropagation();

        addToCart(
          cartButton.dataset.cart
        );

        return;
      }

      /* Product */

      const productButton =
        event.target.closest(
          "[data-product]"
        );

      if (productButton) {

        openProduct(
          productButton.dataset.product
        );

        return;
      }

      /* Cart + */

      const plus =
        event.target.closest(
          "[data-plus]"
        );

      if (plus) {

        changeQuantity(
          plus.dataset.plus,
          1
        );

        return;
      }

      /* Cart - */

      const minus =
        event.target.closest(
          "[data-minus]"
        );

      if (minus) {

        changeQuantity(
          minus.dataset.minus,
          -1
        );

        return;
      }

      /* Remove Cart */

      const remove =
        event.target.closest(
          "[data-remove]"
        );

      if (remove) {

        removeFromCart(
          remove.dataset.remove
        );

        return;
      }

      /* Favorite Cart */

      const favoriteCart =
        event.target.closest(
          "[data-fav-cart]"
        );

      if (favoriteCart) {

        addToCart(
          favoriteCart.dataset.favCart
        );

        return;
      }

      /* Favorite Remove */

      const favoriteRemove =
        event.target.closest(
          "[data-fav-remove]"
        );

      if (favoriteRemove) {

        toggleFavorite(
          favoriteRemove.dataset.favRemove
        );

        renderFavorites();

        return;
      }

      /* Modal Cart */

      const modalCart =
        event.target.closest(
          "[data-modal-cart]"
        );

      if (modalCart) {

        addToCart(
          modalCart.dataset.modalCart
        );

        closeModal(productModal);

        return;
      }

      /* Close */

      const closeButton =
        event.target.closest(
          "[data-close]"
        );

      if (closeButton) {

        closeModal(productModal);
        closeModal(cartModal);
        closeModal(favoritesModal);

        return;
      }

      /* Click outside modal */

      if (
        event.target === productModal
      ) {
        closeModal(productModal);
      }

      if (
        event.target === cartModal
      ) {
        closeModal(cartModal);
      }

      if (
        event.target === favoritesModal
      ) {
        closeModal(favoritesModal);
      }

    }
  );

  /* =========================
     CART BUTTON
  ========================= */

  const cartButton =
    document.getElementById("cartButton");

  if (cartButton) {

    cartButton.addEventListener(
      "click",
      () => {

        renderCart();

        if (cartModal) {
          cartModal.classList.add("active");
          document.body.classList.add("modal-open");
        }
      }
    );
  }

  /* =========================
     FAVORITES BUTTON
  ========================= */

  const favoritesButton =
    document.getElementById("favoritesButton");

  if (favoritesButton) {

    favoritesButton.addEventListener(
      "click",
      () => {

        renderFavorites();

        if (favoritesModal) {
          favoritesModal.classList.add("active");
          document.body.classList.add("modal-open");
        }
      }
    );
  }

  /* =========================
     THEME
  ========================= */

  const themeToggle =
    document.getElementById("themeToggle");

  const savedTheme =
    localStorage.getItem("nova_theme");

  if (savedTheme === "dark") {
    document.body.classList.add("dark");
  }

  if (themeToggle) {

    themeToggle.addEventListener(
      "click",
      () => {

        document.body.classList.toggle("dark");

        localStorage.setItem(
          "nova_theme",
          document.body.classList.contains("dark")
            ? "dark"
            : "light"
        );
      }
    );
  }

  /* =========================
     MOBILE MENU
  ========================= */

  const menuButton =
    document.getElementById("menuButton");

  const mobileMenu =
    document.getElementById("mobileMenu");

  if (menuButton && mobileMenu) {

    menuButton.addEventListener(
      "click",
      () => {

        mobileMenu.classList.toggle("active");
      }
    );

  }

  /* =========================
     TOAST
  ========================= */

  function showToast(message) {

    let toast =
      document.getElementById("novaToast");

    if (!toast) {

      toast =
        document.createElement("div");

      toast.id = "novaToast";

      toast.className = "nova-toast";

      document.body.appendChild(toast);
    }

    toast.textContent = message;

    toast.classList.add("show");

    clearTimeout(
      window.novaToastTimer
    );

    window.novaToastTimer =
      setTimeout(() => {

        toast.classList.remove("show");

      }, 2200);
  }

  /* =========================
     NAVIGATION
  ========================= */

  document.querySelectorAll(
    'a[href^="#"]'
  ).forEach(link => {

    link.addEventListener(
      "click",
      event => {

        const id =
          link.getAttribute("href");

        if (!id || id === "#") return;

        const target =
          document.querySelector(id);

        if (!target) return;

        event.preventDefault();

        target.scrollIntoView({
          behavior: "smooth"
        });

        if (mobileMenu) {
          mobileMenu.classList.remove(
            "active"
          );
        }
      }
    );
  });

  /* =========================
     ESCAPE KEY
  ========================= */

  document.addEventListener(
    "keydown",
    event => {

      if (event.key !== "Escape") return;

      closeModal(productModal);
      closeModal(cartModal);
      closeModal(favoritesModal);

      if (mobileMenu) {
        mobileMenu.classList.remove(
          "active"
        );
      }
    }
  );

  /* =========================
     INITIALIZE
  ========================= */

  updateCounts();

  renderCart();

  renderFavorites();

  /*
   * اگر index.html خودش محصولات را از Supabase
   * گرفته باشد، همان داده‌ها استفاده می‌شوند.
   *
   * در غیر این صورت خودمان محصولات را می‌گیریم.
   */

  if (!window.novaProductsLoaded) {
    loadProducts();
  }

});
