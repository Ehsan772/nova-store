/* =========================================================
   NOVA STORE
   Supabase + Storefront
   ========================================================= */

/* =========================================================
   SUPABASE
   ========================================================= */

// آدرس پروژه Supabase خودت را اینجا قرار بده.
// اطلاعات ورود پنل مدیریت را اینجا قرار نده.
const SUPABASE_URL = "YOUR_SUPABASE_URL";
const SUPABASE_PUBLISHABLE_KEY = "YOUR_SUPABASE_PUBLISHABLE_KEY";

const supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY
);


/* =========================================================
   GLOBAL STATE
   ========================================================= */

let allProducts = [];
let filteredProducts = [];

let cart = JSON.parse(localStorage.getItem("nova_cart") || "[]");
let favorites = JSON.parse(localStorage.getItem("nova_favorites") || "[]");

let currentCategory = "all";
let searchTerm = "";

let currentSlide = 0;
let slideTimer = null;


/* =========================================================
   HELPERS
   ========================================================= */

function $(selector) {
    return document.querySelector(selector);
}

function $$(selector) {
    return document.querySelectorAll(selector);
}

function escapeHTML(value) {
    if (value === null || value === undefined) return "";

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function formatPrice(price) {
    if (price === null || price === undefined || price === "") {
        return "تماس بگیرید";
    }

    const number = Number(price);

    if (Number.isNaN(number)) {
        return escapeHTML(price);
    }

    return new Intl.NumberFormat("fa-IR").format(number) + " تومان";
}


/* =========================================================
   CART
   ========================================================= */

function saveCart() {
    localStorage.setItem("nova_cart", JSON.stringify(cart));
}

function updateCartCount() {
    const count = cart.reduce((total, item) => {
        return total + Number(item.quantity || 1);
    }, 0);

    const elements = [
        "#cartCount",
        ".cart-count",
        "[data-cart-count]"
    ];

    elements.forEach(selector => {
        $$(selector).forEach(element => {
            element.textContent = count;
        });
    });
}

function addToCart(productId) {
    const product = allProducts.find(
        item => String(item.id) === String(productId)
    );

    if (!product) return;

    const existing = cart.find(
        item => String(item.id) === String(product.id)
    );

    if (existing) {
        existing.quantity = Number(existing.quantity || 1) + 1;
    } else {
        cart.push({
            id: product.id,
            name: product.name,
            price: product.price,
            image: product.image,
            quantity: 1
        });
    }

    saveCart();
    updateCartCount();

    showMessage("محصول به سبد خرید اضافه شد");
}

function removeFromCart(productId) {
    cart = cart.filter(
        item => String(item.id) !== String(productId)
    );

    saveCart();
    updateCartCount();
}

function changeCartQuantity(productId, change) {
    const item = cart.find(
        product => String(product.id) === String(productId)
    );

    if (!item) return;

    item.quantity = Number(item.quantity || 1) + change;

    if (item.quantity <= 0) {
        removeFromCart(productId);
        return;
    }

    saveCart();
    updateCartCount();
}


/* =========================================================
   FAVORITES
   ========================================================= */

function saveFavorites() {
    localStorage.setItem(
        "nova_favorites",
        JSON.stringify(favorites)
    );
}

function isFavorite(productId) {
    return favorites.some(
        id => String(id) === String(productId)
    );
}

function toggleFavorite(productId) {
    const index = favorites.findIndex(
        id => String(id) === String(productId)
    );

    if (index >= 0) {
        favorites.splice(index, 1);
    } else {
        favorites.push(productId);
    }

    saveFavorites();
    renderProducts();
}


/* =========================================================
   LOAD PRODUCTS FROM SUPABASE
   ========================================================= */

async function loadProducts() {
    const container =
        $("#productsContainer") ||
        $(".products-grid") ||
        $(".product-grid") ||
        "[data-products]";

    if (!container) {
        console.warn("Product container not found.");
        return;
    }

    container.innerHTML = `
        <div class="products-loading">
            در حال دریافت محصولات...
        </div>
    `;

    const { data, error } = await supabaseClient
        .from("products")
        .select("*")
        .order("id", { ascending: false });

    if (error) {
        console.error("Supabase products error:", error);

        container.innerHTML = `
            <div class="products-error">
                <strong>خطا در دریافت محصولات</strong>
                <p>لطفاً دوباره تلاش کنید.</p>
                <button onclick="loadProducts()">تلاش مجدد</button>
            </div>
        `;

        return;
    }

    allProducts = Array.isArray(data) ? data : [];

    filteredProducts = [...allProducts];

    renderCategories();
    renderProducts();
}


/* =========================================================
   FILTER PRODUCTS
   ========================================================= */

function filterProducts() {

    filteredProducts = allProducts.filter(product => {

        const categoryMatch =
            currentCategory === "all" ||
            String(product.category || "").trim() === currentCategory;

        const text =
            `${product.name || ""} ${product.description || ""} ${product.category || ""}`
                .toLowerCase();

        const searchMatch =
            !searchTerm ||
            text.includes(searchTerm.toLowerCase());

        return categoryMatch && searchMatch;
    });

    renderProducts();
}


/* =========================================================
   RENDER PRODUCTS
   ========================================================= */

function renderProducts() {

    const container =
        $("#productsContainer") ||
        $(".products-grid") ||
        $(".product-grid") ||
        document.querySelector("[data-products]");

    if (!container) return;

    if (!filteredProducts.length) {
        container.innerHTML = `
            <div class="products-empty">
                <div>محصولی پیدا نشد</div>
            </div>
        `;
        return;
    }

    container.innerHTML = filteredProducts.map(product => {

        const favorite = isFavorite(product.id);

        const oldPrice =
            product.old_price !== null &&
            product.old_price !== undefined &&
            product.old_price !== "" &&
            Number(product.old_price) > Number(product.price || 0)
                ? `
                    <span class="old-price">
                        ${formatPrice(product.old_price)}
                    </span>
                  `
                : "";

        const discount =
            product.discount !== null &&
            product.discount !== undefined &&
            product.discount !== ""
                ? `
                    <span class="discount-badge">
                        ${escapeHTML(product.discount)}٪
                    </span>
                  `
                : "";

        const newBadge =
            product.is_new
                ? `<span class="new-badge">جدید</span>`
                : "";

        const image =
            product.image
                ? escapeHTML(product.image)
                : "images/product-placeholder.png";

        return `
            <article
                class="product-card"
                data-product-id="${escapeHTML(product.id)}"
            >

                <div class="product-image">

                    <img
                        src="${image}"
                        alt="${escapeHTML(product.name)}"
                        loading="lazy"
                        onerror="this.src='images/product-placeholder.png'"
                    >

                    <div class="product-badges">
                        ${newBadge}
                        ${discount}
                    </div>

                    <button
                        class="favorite-btn ${favorite ? "active" : ""}"
                        type="button"
                        onclick="toggleFavorite('${escapeHTML(product.id)}')"
                        aria-label="افزودن به علاقه‌مندی‌ها"
                    >
                        ${favorite ? "♥" : "♡"}
                    </button>

                </div>

                <div class="product-info">

                    <div class="product-category">
                        ${escapeHTML(product.category || "")}
                    </div>

                    <h3 class="product-title">
                        ${escapeHTML(product.name || "محصول")}
                    </h3>

                    ${
                        product.description
                            ? `
                                <p class="product-description">
                                    ${escapeHTML(product.description)}
                                </p>
                              `
                            : ""
                    }

                    <div class="product-price">

                        <div class="current-price">
                            ${formatPrice(product.price)}
                        </div>

                        ${oldPrice}

                    </div>

                    <button
                        class="add-to-cart"
                        type="button"
                        onclick="addToCart('${escapeHTML(product.id)}')"
                    >
                        افزودن به سبد خرید
                    </button>

                </div>

            </article>
        `;

    }).join("");
}


/* =========================================================
   CATEGORIES
   ========================================================= */

function renderCategories() {

    const categories = [
        ...new Set(
            allProducts
                .map(product => String(product.category || "").trim())
                .filter(Boolean)
        )
    ];

    const containers = [
        "#categories",
        ".categories",
        ".category-list",
        "[data-categories]"
    ];

    let container = null;

    for (const selector of containers) {
        const element = $(selector);

        if (element) {
            container = element;
            break;
        }
    }

    if (!container) return;

    container.innerHTML = `
        <button
            type="button"
            class="category-btn active"
            data-category="all"
        >
            همه
        </button>

        ${categories.map(category => `
            <button
                type="button"
                class="category-btn"
                data-category="${escapeHTML(category)}"
            >
                ${escapeHTML(category)}
            </button>
        `).join("")}
    `;

    $$(".category-btn").forEach(button => {

        button.addEventListener("click", () => {

            $$(".category-btn").forEach(btn => {
                btn.classList.remove("active");
            });

            button.classList.add("active");

            currentCategory =
                button.dataset.category || "all";

            filterProducts();
        });

    });
}


/* =========================================================
   SEARCH
   ========================================================= */

function setupSearch() {

    const inputs = [
        "#searchInput",
        ".search-input",
        "[data-search]"
    ];

    let input = null;

    for (const selector of inputs) {
        const element = $(selector);

        if (element) {
            input = element;
            break;
        }
    }

    if (!input) return;

    input.addEventListener("input", event => {

        searchTerm = event.target.value.trim();

        filterProducts();

    });
}


/* =========================================================
   VIEW ALL
   ========================================================= */

function setupViewAll() {

    $$("[data-view-all]").forEach(button => {

        button.addEventListener("click", event => {

            event.preventDefault();

            currentCategory = "all";
            searchTerm = "";

            const input =
                $("#searchInput") ||
                $(".search-input") ||
                document.querySelector("[data-search]");

            if (input) {
                input.value = "";
            }

            $$(".category-btn").forEach(btn => {
                btn.classList.remove("active");

                if (btn.dataset.category === "all") {
                    btn.classList.add("active");
                }
            });

            filterProducts();

            const productsSection =
                $("#products") ||
                $(".products-section") ||
                $("#productsContainer");

            if (productsSection) {
                productsSection.scrollIntoView({
                    behavior: "smooth"
                });
            }

        });

    });
}


/* =========================================================
   MESSAGE
   ========================================================= */

function showMessage(message) {

    let element = $("#novaMessage");

    if (!element) {

        element = document.createElement("div");

        element.id = "novaMessage";

        element.style.cssText = `
            position: fixed;
            right: 20px;
            bottom: 20px;
            z-index: 99999;
            padding: 12px 18px;
            border-radius: 12px;
            background: #111827;
            color: white;
            font-size: 14px;
            box-shadow: 0 10px 30px rgba(0,0,0,.18);
            opacity: 0;
            transform: translateY(10px);
            transition: .25s;
        `;

        document.body.appendChild(element);
    }

    element.textContent = message;

    requestAnimationFrame(() => {
        element.style.opacity = "1";
        element.style.transform = "translateY(0)";
    });

    clearTimeout(element._timer);

    element._timer = setTimeout(() => {
        element.style.opacity = "0";
        element.style.transform = "translateY(10px)";
    }, 2200);
}


/* =========================================================
   HERO SLIDER
   ========================================================= */

function setupHeroSlider() {

    const slides = $$(".hero-slide");
    const dots = $$(".hero-dot");

    if (!slides.length) return;

    function showSlide(index) {

        currentSlide =
            (index + slides.length) % slides.length;

        slides.forEach((slide, i) => {
            slide.classList.toggle(
                "active",
                i === currentSlide
            );
        });

        dots.forEach((dot, i) => {
            dot.classList.toggle(
                "active",
                i === currentSlide
            );
        });
    }

    function nextSlide() {
        showSlide(currentSlide + 1);
    }

    function previousSlide() {
        showSlide(currentSlide - 1);
    }

    const nextButton =
        $(".hero-next") ||
        $("[data-slider-next]");

    const prevButton =
        $(".hero-prev") ||
        $("[data-slider-prev]");

    if (nextButton) {
        nextButton.addEventListener("click", nextSlide);
    }

    if (prevButton) {
        prevButton.addEventListener("click", previousSlide);
    }

    dots.forEach((dot, index) => {
        dot.addEventListener("click", () => {
            showSlide(index);
        });
    });

    function startAutoPlay() {

        clearInterval(slideTimer);

        slideTimer = setInterval(() => {
            nextSlide();
        }, 5000);
    }

    const hero =
        $(".hero-slider") ||
        $(".hero");

    if (hero) {

        hero.addEventListener("mouseenter", () => {
            clearInterval(slideTimer);
        });

        hero.addEventListener("mouseleave", () => {
            startAutoPlay();
        });
    }

    let touchStartX = 0;

    if (hero) {

        hero.addEventListener("touchstart", event => {
            touchStartX = event.touches[0].clientX;
        }, { passive: true });

        hero.addEventListener("touchend", event => {

            const touchEndX =
                event.changedTouches[0].clientX;

            const difference =
                touchStartX - touchEndX;

            if (Math.abs(difference) > 50) {

                if (difference > 0) {
                    nextSlide();
                } else {
                    previousSlide();
                }

            }
        }, { passive: true });
    }

    showSlide(0);
    startAutoPlay();
}


/* =========================================================
   MOBILE MENU
   ========================================================= */

function setupMobileMenu() {

    const menuButton =
        $(".mobile-menu-btn") ||
        $("[data-mobile-menu]");

    const menu =
        $(".mobile-menu") ||
        $(".mobile-nav") ||
        $("[data-mobile-nav]");

    if (!menuButton || !menu) return;

    menuButton.addEventListener("click", () => {

        menu.classList.toggle("active");

        menuButton.classList.toggle("active");

    });

}


/* =========================================================
   ACCOUNT / SHOP BUTTONS
   ========================================================= */

function setupButtons() {

    $$("[data-account]").forEach(button => {

        button.addEventListener("click", () => {

            const account =
                $("#account") ||
                $(".account-section");

            if (account) {
                account.scrollIntoView({
                    behavior: "smooth"
                });
            }

        });

    });

    $$("[data-shop]").forEach(button => {

        button.addEventListener("click", () => {

            const products =
                $("#products") ||
                $(".products-section") ||
                $("#productsContainer");

            if (products) {
                products.scrollIntoView({
                    behavior: "smooth"
                });
            }

        });

    });

}


/* =========================================================
   KEYBOARD SHORTCUTS
   ========================================================= */

function setupKeyboard() {

    document.addEventListener("keydown", event => {

        // /
        if (
            event.key === "/" &&
            document.activeElement.tagName !== "INPUT" &&
            document.activeElement.tagName !== "TEXTAREA"
        ) {

            event.preventDefault();

            const search =
                $("#searchInput") ||
                $(".search-input") ||
                document.querySelector("[data-search]");

            if (search) {
                search.focus();
            }
        }

        // Escape
        if (event.key === "Escape") {

            const menu =
                $(".mobile-menu") ||
                $(".mobile-nav") ||
                $("[data-mobile-nav]");

            if (menu) {
                menu.classList.remove("active");
            }

        }

    });

}


/* =========================================================
   REALTIME
   ========================================================= */

function setupRealtime() {

    supabaseClient
        .channel("nova-products")
        .on(
            "postgres_changes",
            {
                event: "*",
                schema: "public",
                table: "products"
            },
            () => {

                // هر تغییری در پنل مدیریت
                // باعث تازه شدن محصولات سایت می‌شود.
                loadProducts();

            }
        )
        .subscribe();

}


/* =========================================================
   INITIALIZE
   ========================================================= */

document.addEventListener("DOMContentLoaded", async () => {

    updateCartCount();

    setupSearch();
    setupViewAll();
    setupHeroSlider();
    setupMobileMenu();
    setupButtons();
    setupKeyboard();

    await loadProducts();

    setupRealtime();

});
