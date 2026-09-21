/* =================================
   NOVA STORE — SCRIPT
================================= */

let products = [];
let cart = JSON.parse(localStorage.getItem("novaCart")) || [];
let favorites = JSON.parse(localStorage.getItem("novaFavorites")) || [];
let currentCategory = "all";

/* =================================
   ELEMENTS
================================= */

const productsGrid = document.getElementById("productsGrid");
const searchInput = document.getElementById("searchInput");

const cartButton = document.getElementById("cartButton");
const favoritesButton = document.getElementById("favoritesButton");
const themeToggle = document.getElementById("themeToggle");
const menuButton = document.getElementById("menuButton");

const cartCount = document.getElementById("cartCount");
const favoriteCount = document.getElementById("favoriteCount");

const cartModal = document.getElementById("cartModal");
const favoritesModal = document.getElementById("favoritesModal");
const productModal = document.getElementById("productModal");

const cartItems = document.getElementById("cartItems");
const favoritesItems = document.getElementById("favoritesItems");
const cartTotal = document.getElementById("cartTotal");

const mobileMenu = document.getElementById("mobileMenu");


/* =================================
   LOAD PRODUCTS
================================= */

async function loadProducts() {

    if (window.novaProductsLoaded) return;

    window.novaProductsLoaded = true;

    try {

        const { data, error } =
            await window.supabaseClient
                .from("products")
                .select("*")
                .order("created_at", { ascending: false });

        if (error) throw error;

        products = data || [];

        renderProducts(products);

        updateCounts();

    } catch (error) {

        console.error("Product loading error:", error);

        if (productsGrid) {
            productsGrid.innerHTML = `
                <div class="products-loading">
                    <strong>خطا در دریافت محصولات</strong>
                    <span>لطفاً صفحه را دوباره باز کنید.</span>
                </div>
            `;
        }
    }
}


/* =================================
   RENDER PRODUCTS
================================= */

function renderProducts(list) {

    if (!productsGrid) return;

    if (!list.length) {

        productsGrid.innerHTML = `
            <div class="products-loading">
                <strong>محصولی پیدا نشد</strong>
                <span>محصول دیگری را جستجو کنید.</span>
            </div>
        `;

        return;
    }

    productsGrid.innerHTML = list.map(product => {

        const isFavorite = favorites.includes(product.id);

        const price = Number(product.price || 0);
        const oldPrice = Number(product.old_price || 0);

        return `
            <article class="product-card">

                <div class="product-image-wrap">

                    <img
                        class="product-image"
                        src="${product.image || "https://via.placeholder.com/600x600?text=NOVA"}"
                        alt="${escapeHTML(product.name || "محصول")}"
                        loading="lazy"
                    >

                    <div class="product-badges">

                        ${
                            product.is_new
                                ? `<span class="new-badge">جدید</span>`
                                : ""
                        }

                        ${
                            product.discount
                                ? `<span class="discount-badge">${product.discount}% تخفیف</span>`
                                : ""
                        }

                    </div>

                    <button
                        class="favorite-btn ${isFavorite ? "active" : ""}"
                        onclick="toggleFavorite(${product.id})"
                        aria-label="افزودن به علاقه‌مندی"
                    >
                        ${isFavorite ? "♥" : "♡"}
                    </button>

                </div>

                <div class="product-info">

                    <span class="product-category">
                        ${escapeHTML(product.category || "سایر")}
                    </span>

                    <h3>
                        ${escapeHTML(product.name || "محصول بدون نام")}
                    </h3>

                    <p class="product-description">
                        ${escapeHTML(
                            product.description ||
                            product.text ||
                            "توضیحی برای این محصول ثبت نشده است."
                        )}
                    </p>

                    <div class="product-price">

                        <strong>
                            ${formatPrice(price)} تومان
                        </strong>

                        ${
                            oldPrice > price
                                ? `<span class="old-price">
                                    ${formatPrice(oldPrice)} تومان
                                   </span>`
                                : ""
                        }

                    </div>

                    <div class="product-actions">

                        <button
                            class="view-product"
                            onclick="openProduct(${product.id})"
                        >
                            مشاهده
                        </button>

                        <button
                            class="add-cart"
                            onclick="addToCart(${product.id})"
                        >
                            افزودن به سبد
                        </button>

                    </div>

                </div>

            </article>
        `;

    }).join("");
}


/* =================================
   SEARCH
================================= */

function searchProducts() {

    const query =
        searchInput?.value.trim().toLowerCase() || "";

    let result = [...products];

    if (currentCategory !== "all") {

        result = result.filter(product =>
            String(product.category || "").toLowerCase() ===
            currentCategory.toLowerCase()
        );
    }

    if (query) {

        result = result.filter(product => {

            const name =
                String(product.name || "").toLowerCase();

            const description =
                String(
                    product.description ||
                    product.text ||
                    ""
                ).toLowerCase();

            const category =
                String(product.category || "").toLowerCase();

            return (
                name.includes(query) ||
                description.includes(query) ||
                category.includes(query)
            );
        });
    }

    renderProducts(result);
}


/* =================================
   CATEGORY FILTER
================================= */

function filterCategory(category) {

    currentCategory = category || "all";

    searchProducts();

    document
        .getElementById("products")
        ?.scrollIntoView({
            behavior: "smooth"
        });
}


/* =================================
   CATEGORY BUTTONS
================================= */

document.querySelectorAll(".category-card").forEach(button => {

    button.addEventListener("click", () => {

        const category =
            button.dataset.category || "all";

        filterCategory(category);

    });

});


/* =================================
   SHOW ALL PRODUCTS
================================= */

function showAllProducts() {

    currentCategory = "all";

    if (searchInput) {
        searchInput.value = "";
    }

    renderProducts(products);

    document
        .getElementById("products")
        ?.scrollIntoView({
            behavior: "smooth"
        });
}

document
    .getElementById("showAllProducts")
    ?.addEventListener("click", showAllProducts);

document
    .getElementById("showAllProductsTop")
    ?.addEventListener("click", showAllProducts);


/* =================================
   SEARCH INPUT
================================= */

searchInput?.addEventListener(
    "input",
    searchProducts
);


/* =================================
   FAVORITES
================================= */

function toggleFavorite(id) {

    const index = favorites.indexOf(id);

    if (index === -1) {

        favorites.push(id);

        showToast("به علاقه‌مندی‌ها اضافه شد");

    } else {

        favorites.splice(index, 1);

        showToast("از علاقه‌مندی‌ها حذف شد");
    }

    localStorage.setItem(
        "novaFavorites",
        JSON.stringify(favorites)
    );

    updateCounts();

    searchProducts();

    if (favoritesModal?.classList.contains("active")) {
        renderFavorites();
    }
}


function renderFavorites() {

    if (!favoritesItems) return;

    const favoriteProducts =
        products.filter(product =>
            favorites.includes(product.id)
        );

    if (!favoriteProducts.length) {

        favoritesItems.innerHTML = `
            <div class="products-loading">
                <strong>هنوز محصولی اضافه نکرده‌اید</strong>
                <span>محصولات مورد علاقه‌تان اینجا نمایش داده می‌شوند.</span>
            </div>
        `;

        return;
    }

    favoritesItems.innerHTML =
        favoriteProducts.map(product => {

            return `
                <article class="product-card">

                    <div class="product-image-wrap">

                        <img
                            class="product-image"
                            src="${product.image || "https://via.placeholder.com/600x600?text=NOVA"}"
                            alt="${escapeHTML(product.name || "محصول")}"
                        >

                    </div>

                    <div class="product-info">

                        <span class="product-category">
                            ${escapeHTML(product.category || "سایر")}
                        </span>

                        <h3>
                            ${escapeHTML(product.name || "محصول")}
                        </h3>

                        <div class="product-price">
                            <strong>
                                ${formatPrice(Number(product.price || 0))} تومان
                            </strong>
                        </div>

                        <div class="product-actions">

                            <button
                                class="view-product"
                                onclick="openProduct(${product.id})"
                            >
                                مشاهده
                            </button>

                            <button
                                class="add-cart"
                                onclick="addToCart(${product.id})"
                            >
                                افزودن به سبد
                            </button>

                        </div>

                    </div>

                </article>
            `;

        }).join("");
}


/* =================================
   CART
================================= */

function addToCart(id) {

    const product = products.find(
        product => product.id === id
    );

    if (!product) return;

    const existing =
        cart.find(item => item.id === id);

    if (existing) {

        existing.quantity += 1;

    } else {

        cart.push({
            id: id,
            quantity: 1
        });
    }

    saveCart();

    updateCounts();

    showToast("محصول به سبد خرید اضافه شد");
}


function removeFromCart(id) {

    cart =
        cart.filter(item => item.id !== id);

    saveCart();

    renderCart();

    updateCounts();
}


function changeQuantity(id, amount) {

    const item =
        cart.find(item => item.id === id);

    if (!item) return;

    item.quantity += amount;

    if (item.quantity <= 0) {

        removeFromCart(id);

        return;
    }

    saveCart();

    renderCart();

    updateCounts();
}


function renderCart() {

    if (!cartItems) return;

    if (!cart.length) {

        cartItems.innerHTML = `
            <div class="products-loading">
                <strong>سبد خرید خالی است</strong>
                <span>هنوز محصولی به سبد اضافه نکرده‌اید.</span>
            </div>
        `;

        if (cartTotal) {
            cartTotal.textContent = "0 تومان";
        }

        return;
    }

    let total = 0;

    cartItems.innerHTML =
        cart.map(item => {

            const product =
                products.find(
                    product => product.id === item.id
                );

            if (!product) return "";

            const price =
                Number(product.price || 0);

            total += price * item.quantity;

            return `
                <div class="cart-item">

                    <img
                        src="${product.image || "https://via.placeholder.com/100?text=NOVA"}"
                        alt="${escapeHTML(product.name || "محصول")}"
                    >

                    <div class="cart-item-info">

                        <strong>
                            ${escapeHTML(product.name || "محصول")}
                        </strong>

                        <span>
                            ${formatPrice(price)} تومان
                        </span>

                        <div style="
                            display:flex;
                            align-items:center;
                            gap:8px;
                            margin-top:7px;
                        ">

                            <button
                                onclick="changeQuantity(${product.id}, -1)"
                                style="
                                    width:25px;
                                    height:25px;
                                    border-radius:7px;
                                "
                            >−</button>

                            <span>
                                ${item.quantity}
                            </span>

                            <button
                                onclick="changeQuantity(${product.id}, 1)"
                                style="
                                    width:25px;
                                    height:25px;
                                    border-radius:7px;
                                "
                            >+</button>

                        </div>

                    </div>

                    <button
                        onclick="removeFromCart(${product.id})"
                        style="
                            color:#ef4444;
                            background:transparent;
                            font-size:18px;
                        "
                    >
                        ×
                    </button>

                </div>
            `;

        }).join("");

    if (cartTotal) {
        cartTotal.textContent =
            `${formatPrice(total)} تومان`;
    }
}


function saveCart() {

    localStorage.setItem(
        "novaCart",
        JSON.stringify(cart)
    );
}


/* =================================
   PRODUCT MODAL
================================= */

function openProduct(id) {

    const product =
        products.find(product => product.id === id);

    if (!product || !productModal) return;

    const content =
        document.getElementById("productModalContent");

    if (!content) return;

    content.innerHTML = `

        <img
            src="${product.image || "https://via.placeholder.com/600x600?text=NOVA"}"
            alt="${escapeHTML(product.name || "محصول")}"
        >

        <div>

            <span class="product-category">
                ${escapeHTML(product.category || "سایر")}
            </span>

            <h2 style="margin:10px 0;">
                ${escapeHTML(product.name || "محصول")}
            </h2>

            <p style="
                color:var(--text-light);
                font-size:13px;
                line-height:2;
                margin-bottom:18px;
            ">
                ${escapeHTML(
                    product.description ||
                    product.text ||
                    "توضیحی برای این محصول ثبت نشده است."
                )}
            </p>

            <div class="product-price">

                <strong style="font-size:20px;">
                    ${formatPrice(Number(product.price || 0))}
                    تومان
                </strong>

                ${
                    product.old_price
                        ? `
                            <span class="old-price">
                                ${formatPrice(Number(product.old_price))}
                                تومان
                            </span>
                        `
                        : ""
                }

            </div>

            <button
                class="add-cart"
                onclick="addToCart(${product.id}); closeModal('productModal')"
                style="
                    width:100%;
                    height:48px;
                    border-radius:10px;
                    margin-top:15px;
                    font-weight:bold;
                "
            >
                افزودن به سبد خرید
            </button>

        </div>
    `;

    openModal("productModal");
}


/* =================================
   MODALS
================================= */

function openModal(id) {

    const modal =
        document.getElementById(id);

    if (!modal) return;

    modal.classList.add("active");

    document.body.classList.add("modal-open");
}


function closeModal(id) {

    const modal =
        document.getElementById(id);

    if (!modal) return;

    modal.classList.remove("active");

    if (
        !document.querySelector(".modal.active")
    ) {
        document.body.classList.remove("modal-open");
    }
}


document
    .querySelectorAll(".modal-close")
    .forEach(button => {

        button.addEventListener("click", () => {

            const modal =
                button.closest(".modal");

            if (modal) {
                closeModal(modal.id);
            }

        });

    });


document
    .querySelectorAll(".modal")
    .forEach(modal => {

        modal.addEventListener("click", event => {

            if (event.target === modal) {
                closeModal(modal.id);
            }

        });

    });


/* =================================
   CART BUTTON
================================= */

cartButton?.addEventListener(
    "click",
    () => {

        renderCart();

        openModal("cartModal");
    }
);


/* =================================
   FAVORITES BUTTON
================================= */

favoritesButton?.addEventListener(
    "click",
    () => {

        renderFavorites();

        openModal("favoritesModal");
    }
);


/* =================================
   THEME
================================= */

function applyTheme() {

    const dark =
        localStorage.getItem("novaTheme") === "dark";

    document.body.classList.toggle(
        "dark-mode",
        dark
    );

    if (themeToggle) {

        themeToggle.innerHTML =
            dark ? "☀️" : "🌙";
    }
}


themeToggle?.addEventListener(
    "click",
    () => {

        const dark =
            document.body.classList.toggle(
                "dark-mode"
            );

        localStorage.setItem(
            "novaTheme",
            dark ? "dark" : "light"
        );

        applyTheme();
    }
);


/* =================================
   MOBILE MENU
================================= */

menuButton?.addEventListener(
    "click",
    () => {

        if (!mobileMenu) return;

        const isOpen =
            mobileMenu.style.display === "block";

        mobileMenu.style.display =
            isOpen ? "none" : "block";
    }
);


document
    .querySelectorAll(".mobile-menu a")
    .forEach(link => {

        link.addEventListener("click", () => {

            if (mobileMenu) {
                mobileMenu.style.display = "none";
            }

        });

    });


/* =================================
   ESC KEY
================================= */

document.addEventListener(
    "keydown",
    event => {

        if (event.key !== "Escape") return;

        document
            .querySelectorAll(".modal.active")
            .forEach(modal => {
                closeModal(modal.id);
            });

    }
);


/* =================================
   COUNTERS
================================= */

function updateCounts() {

    if (favoriteCount) {

        favoriteCount.textContent =
            favorites.length;

        favoriteCount.style.display =
            favorites.length
                ? "flex"
                : "none";
    }

    if (cartCount) {

        const count =
            cart.reduce(
                (sum, item) =>
                    sum + item.quantity,
                0
            );

        cartCount.textContent = count;

        cartCount.style.display =
            count
                ? "flex"
                : "none";
    }
}


/* =================================
   TOAST
================================= */

function showToast(message) {

    let toast =
        document.getElementById("novaToast");

    if (!toast) {

        toast =
            document.createElement("div");

        toast.id = "novaToast";

        toast.style.cssText = `
            position:fixed;
            bottom:25px;
            right:25px;
            z-index:5000;
            padding:12px 18px;
            border-radius:12px;
            background:#18181b;
            color:white;
            font-size:12px;
            box-shadow:0 10px 30px rgba(0,0,0,.2);
            transition:.25s;
        `;

        document.body.appendChild(toast);
    }

    toast.textContent = message;

    toast.style.opacity = "1";

    clearTimeout(window.novaToastTimer);

    window.novaToastTimer =
        setTimeout(() => {

            toast.style.opacity = "0";

        }, 2200);
}


/* =================================
   HELPERS
================================= */

function formatPrice(number) {

    return Number(number || 0)
        .toLocaleString("fa-IR");
}


function escapeHTML(value) {

    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


/* =================================
   INITIALIZE
================================= */

applyTheme();

updateCounts();

loadProducts();
