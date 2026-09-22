/* =========================================================
   NOVA STORE - COMPLETE SCRIPT.JS
========================================================= */

/* =========================================================
   SUPABASE
========================================================= */

const SUPABASE_URL = "https://zwtbrgsphgjyczdibldj.supabase.co";

/*
   کلید publishable/anons فعلی خودت را همین‌جا نگه دار.
   اگر در فایل قبلی کلیدت را داری، فقط مقدار زیر را با همان
   کلید قبلی خودت قرار بده.
*/
const SUPABASE_KEY = "sb_publishable_rU0rSsuonmSoDYzK9-S1ig_uNPkAOha";

const supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);


/* =========================================================
   GLOBAL STATE
========================================================= */

let allProducts = [];
let filteredProducts = [];

let favorites = loadStorage("novaFavorites", []);
let cart = loadStorage("novaCart", []);

let currentCategory = "all";
let currentSearch = "";

let currentSlide = 0;
let sliderTimer = null;

let toastTimer = null;


/* =========================================================
   DOM READY
========================================================= */

document.addEventListener("DOMContentLoaded", () => {

    normalizeStorage();

    setupSearch();
    setupCategories();
    setupHeroSlider();
    setupButtons();
    setupMobileNavigation();
    setupKeyboard();
    setupRealtime();

    renderFavorites();
    renderCart();
    updateCounters();

    loadProducts();
});


/* =========================================================
   LOCAL STORAGE
========================================================= */

function loadStorage(key, fallback) {

    try {
        const value = localStorage.getItem(key);

        if (!value) {
            return fallback;
        }

        const parsed = JSON.parse(value);

        return parsed ?? fallback;

    } catch (error) {

        console.warn("Storage read error:", error);

        return fallback;
    }
}


function saveStorage(key, value) {

    try {

        localStorage.setItem(
            key,
            JSON.stringify(value)
        );

    } catch (error) {

        console.warn("Storage save error:", error);
    }
}


function normalizeStorage() {

    if (!Array.isArray(favorites)) {
        favorites = [];
    }

    if (!Array.isArray(cart)) {
        cart = [];
    }

    /*
       پشتیبانی از هر دو حالت:
       cart = [1,2,3]
       یا
       cart = [{id:1, quantity:2}]
    */

    cart = cart
        .map(item => {

            if (
                typeof item === "number" ||
                typeof item === "string"
            ) {

                return {
                    id: String(item),
                    quantity: 1
                };
            }

            if (!item || item.id === undefined) {
                return null;
            }

            return {
                id: String(item.id),
                quantity: Math.max(
                    1,
                    Number(item.quantity) || 1
                )
            };
        })
        .filter(Boolean);

    favorites = favorites.map(id => String(id));

    saveStorage("novaFavorites", favorites);
    saveStorage("novaCart", cart);
}


/* =========================================================
   HELPERS
========================================================= */

function escapeHTML(value) {

    if (value === null || value === undefined) {
        return "";
    }

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


function formatPrice(value) {

    const number = Number(value) || 0;

    return new Intl.NumberFormat("fa-IR").format(number);
}


function getProductId(product) {

    return String(product.id);
}


function getProductById(id) {

    return allProducts.find(
        product => String(product.id) === String(id)
    );
}


function getProductImage(product) {

    return (
        product.image_url ||
        product.image ||
        product.imageUrl ||
        ""
    );
}


function getProductDiscount(product) {

    if (product.discount !== null &&
        product.discount !== undefined &&
        product.discount !== "") {

        const discount = Number(product.discount);

        if (discount > 0) {
            return discount;
        }
    }

    const oldPrice = Number(product.old_price) || 0;
    const price = Number(product.price) || 0;

    if (oldPrice > price && price > 0) {

        return Math.round(
            ((oldPrice - price) / oldPrice) * 100
        );
    }

    return 0;
}


function getProductCategory(product) {

    return String(
        product.category || "سایر"
    ).trim();
}


/* =========================================================
   SUPABASE PRODUCTS
========================================================= */

async function loadProducts() {

    const productsGrid =
        document.getElementById("productsGrid");

    if (productsGrid) {

        productsGrid.innerHTML = `
            <div class="products-loading">
                <i class="fa-solid fa-spinner fa-spin"></i>
                <span>در حال دریافت محصولات...</span>
            </div>
        `;
    }

    try {

        const {
            data,
            error
        } = await supabaseClient
            .from("products")
            .select("*")
            .order("id", {
                ascending: false
            });

        if (error) {
            throw error;
        }

        allProducts = Array.isArray(data)
            ? data
            : [];

        filteredProducts = [...allProducts];

        renderCategories();

        filterProducts();

        renderFavorites();

        renderCart();

        updateCounters();

    } catch (error) {

        console.error(
            "Supabase products error:",
            error
        );

        if (productsGrid) {

            productsGrid.innerHTML = `
                <div class="products-error">
                    <i class="fa-solid fa-triangle-exclamation"></i>
                    <p>خطا در دریافت محصولات</p>
                    <small>
                        اتصال فروشگاه به پایگاه داده بررسی شود.
                    </small>
                </div>
            `;
        }
    }
}


/* =========================================================
   PRODUCTS
========================================================= */

function renderProducts(products = filteredProducts) {

    const grid =
        document.getElementById("productsGrid");

    if (!grid) {
        return;
    }

    if (!products.length) {

        grid.innerHTML = `
            <div class="empty-state">
                <i class="fa-solid fa-box-open"></i>
                <h3>محصولی پیدا نشد</h3>
                <p>
                    محصولی با این جستجو یا دسته‌بندی وجود ندارد.
                </p>
                <button
                    class="primary-btn"
                    id="resetProductsBtn"
                    type="button"
                >
                    نمایش همه محصولات
                </button>
            </div>
        `;

        const resetBtn =
            document.getElementById("resetProductsBtn");

        if (resetBtn) {

            resetBtn.addEventListener(
                "click",
                () => {

                    currentCategory = "all";
                    currentSearch = "";

                    const search =
                        document.getElementById("searchInput");

                    if (search) {
                        search.value = "";
                    }

                    updateCategoryButtons();

                    filterProducts();
                }
            );
        }

        return;
    }


    grid.innerHTML = products.map(product => {

        const id = getProductId(product);

        const name =
            escapeHTML(
                product.name || "محصول بدون نام"
            );

        const category =
            escapeHTML(
                getProductCategory(product)
            );

        const description =
            escapeHTML(
                product.description || ""
            );

        const image =
            getProductImage(product);

        const price =
            Number(product.price) || 0;

        const oldPrice =
            Number(product.old_price) || 0;

        const discount =
            getProductDiscount(product);

        const isNew =
            product.is_new === true ||
            product.is_new === "true" ||
            product.is_new === 1;

        const isFavorite =
            favorites.includes(id);

        return `
            <article
                class="product-card"
                data-product-id="${escapeHTML(id)}"
            >

                <div class="product-image ${
                    image ? "" : "no-image"
                }">

                    ${
                        image
                        ? `
                            <img
                                src="${escapeHTML(image)}"
                                alt="${name}"
                                loading="lazy"
                                onerror="this.style.display='none'; this.parentElement.classList.add('no-image');"
                            >
                          `
                        : ""
                    }


                    <div class="product-badges">

                        ${
                            discount > 0
                            ? `
                                <span class="discount-badge">
                                    ${formatPrice(discount)}٪ تخفیف
                                </span>
                              `
                            : ""
                        }

                        ${
                            isNew
                            ? `
                                <span class="new-badge">
                                    جدید
                                </span>
                              `
                            : ""
                        }

                    </div>


                    <button
                        class="favorite-btn ${
                            isFavorite ? "active" : ""
                        }"
                        type="button"
                        data-favorite-id="${escapeHTML(id)}"
                        aria-label="افزودن به علاقه‌مندی"
                    >
                        <i class="${
                            isFavorite
                            ? "fa-solid"
                            : "fa-regular"
                        } fa-heart"></i>
                    </button>

                </div>


                <div class="product-info">

                    <div class="product-category">
                        ${category}
                    </div>

                    <h3 class="product-title">
                        ${name}
                    </h3>

                    ${
                        description
                        ? `
                            <p class="product-description">
                                ${description}
                            </p>
                          `
                        : ""
                    }


                    <div class="product-price">

                        <div>
                            <span class="current-price">
                                ${formatPrice(price)}
                                <small>تومان</small>
                            </span>

                            ${
                                oldPrice > price
                                ? `
                                    <span class="old-price">
                                        ${formatPrice(oldPrice)}
                                    </span>
                                  `
                                : ""
                            }

                        </div>

                    </div>


                    <button
                        class="add-to-cart"
                        type="button"
                        data-cart-id="${escapeHTML(id)}"
                    >
                        <i class="fa-solid fa-cart-plus"></i>
                        افزودن به سبد خرید
                    </button>

                </div>

            </article>
        `;

    }).join("");


    setupProductEvents();
}


/* =========================================================
   PRODUCT EVENTS
========================================================= */

function setupProductEvents() {

    document
        .querySelectorAll("[data-favorite-id]")
        .forEach(button => {

            button.addEventListener(
                "click",
                event => {

                    event.preventDefault();
                    event.stopPropagation();

                    toggleFavorite(
                        button.dataset.favoriteId
                    );
                }
            );
        });


    document
        .querySelectorAll("[data-cart-id]")
        .forEach(button => {

            button.addEventListener(
                "click",
                event => {

                    event.preventDefault();
                    event.stopPropagation();

                    addToCart(
                        button.dataset.cartId
                    );
                }
            );
        });
}


/* =========================================================
   FAVORITES
========================================================= */

function toggleFavorite(id) {

    id = String(id);

    const index =
        favorites.indexOf(id);

    if (index === -1) {

        favorites.push(id);

        showToast(
            "محصول به علاقه‌مندی‌ها اضافه شد",
            "fa-heart"
        );

    } else {

        favorites.splice(index, 1);

        showToast(
            "محصول از علاقه‌مندی‌ها حذف شد",
            "fa-heart"
        );
    }

    saveStorage(
        "novaFavorites",
        favorites
    );

    renderProducts(filteredProducts);

    renderFavorites();

    updateCounters();
}


function renderFavorites() {

    const grid =
        document.getElementById("favoritesGrid");

    const empty =
        document.getElementById("emptyFavorites");

    if (!grid) {
        return;
    }

    const favoriteProducts =
        favorites
            .map(id => getProductById(id))
            .filter(Boolean);


    if (!favoriteProducts.length) {

        grid.innerHTML = "";

        if (empty) {
            empty.hidden = false;
        }

        return;
    }


    if (empty) {
        empty.hidden = true;
    }


    grid.innerHTML =
        favoriteProducts
            .map(product => {

                const id =
                    getProductId(product);

                const name =
                    escapeHTML(
                        product.name || "محصول"
                    );

                const image =
                    getProductImage(product);

                const price =
                    Number(product.price) || 0;

                const oldPrice =
                    Number(product.old_price) || 0;

                return `
                    <article class="product-card">

                        <div class="product-image ${
                            image ? "" : "no-image"
                        }">

                            ${
                                image
                                ? `
                                    <img
                                        src="${escapeHTML(image)}"
                                        alt="${name}"
                                        loading="lazy"
                                    >
                                  `
                                : ""
                            }

                            <button
                                class="favorite-btn active"
                                type="button"
                                data-favorite-id="${escapeHTML(id)}"
                            >
                                <i class="fa-solid fa-heart"></i>
                            </button>

                        </div>

                        <div class="product-info">

                            <div class="product-category">
                                ${escapeHTML(
                                    getProductCategory(product)
                                )}
                            </div>

                            <h3 class="product-title">
                                ${name}
                            </h3>

                            <div class="product-price">

                                <div>

                                    <span class="current-price">
                                        ${formatPrice(price)}
                                        <small>تومان</small>
                                    </span>

                                    ${
                                        oldPrice > price
                                        ? `
                                            <span class="old-price">
                                                ${formatPrice(oldPrice)}
                                            </span>
                                          `
                                        : ""
                                    }

                                </div>

                            </div>

                            <button
                                class="add-to-cart"
                                type="button"
                                data-cart-id="${escapeHTML(id)}"
                            >
                                <i class="fa-solid fa-cart-plus"></i>
                                افزودن به سبد خرید
                            </button>

                        </div>

                    </article>
                `;
            })
            .join("");


    grid
        .querySelectorAll("[data-favorite-id]")
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    toggleFavorite(
                        button.dataset.favoriteId
                    );
                }
            );
        });


    grid
        .querySelectorAll("[data-cart-id]")
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    addToCart(
                        button.dataset.cartId
                    );
                }
            );
        });
}


/* =========================================================
   CART
========================================================= */

function addToCart(id) {

    id = String(id);

    const product =
        getProductById(id);

    if (!product) {
        return;
    }

    const existing =
        cart.find(
            item => String(item.id) === id
        );


    if (existing) {

        existing.quantity += 1;

    } else {

        cart.push({
            id: id,
            quantity: 1
        });
    }


    saveStorage(
        "novaCart",
        cart
    );

    renderCart();

    updateCounters();

    showToast(
        "محصول به سبد خرید اضافه شد",
        "fa-cart-shopping"
    );
}


function increaseQuantity(id) {

    id = String(id);

    const item =
        cart.find(
            item => String(item.id) === id
        );

    if (!item) {
        return;
    }

    item.quantity += 1;

    saveStorage(
        "novaCart",
        cart
    );

    renderCart();
    updateCounters();
}


function decreaseQuantity(id) {

    id = String(id);

    const item =
        cart.find(
            item => String(item.id) === id
        );

    if (!item) {
        return;
    }

    item.quantity -= 1;

    if (item.quantity <= 0) {

        cart =
            cart.filter(
                cartItem =>
                    String(cartItem.id) !== id
            );
    }

    saveStorage(
        "novaCart",
        cart
    );

    renderCart();
    updateCounters();
}


function removeFromCart(id) {

    id = String(id);

    cart =
        cart.filter(
            item =>
                String(item.id) !== id
        );

    saveStorage(
        "novaCart",
        cart
    );

    renderCart();

    updateCounters();

    showToast(
        "محصول از سبد خرید حذف شد",
        "fa-trash"
    );
}


/* =========================================================
   CART CALCULATIONS
========================================================= */

function getCartDetails() {

    let subtotal = 0;
    let oldTotal = 0;
    let totalItems = 0;

    cart.forEach(item => {

        const product =
            getProductById(item.id);

        if (!product) {
            return;
        }

        const quantity =
            Math.max(
                1,
                Number(item.quantity) || 1
            );

        const price =
            Number(product.price) || 0;

        const oldPrice =
            Number(product.old_price) || price;

        subtotal += price * quantity;

        oldTotal +=
            Math.max(oldPrice, price) *
            quantity;

        totalItems += quantity;
    });


    const discount =
        Math.max(
            0,
            oldTotal - subtotal
        );


    /*
       ارسال رایگان در صورت خرید بالاتر از
       2,000,000 تومان.
    */

    const shipping =
        subtotal === 0
            ? 0
            : subtotal >= 2000000
                ? 0
                : 50000;


    const total =
        subtotal + shipping;


    return {
        subtotal,
        oldTotal,
        discount,
        shipping,
        total,
        totalItems
    };
}


/* =========================================================
   RENDER CART
========================================================= */

function renderCart() {

    const itemsContainer =
        document.getElementById("cartItems");

    const emptyCart =
        document.getElementById("emptyCart");

    if (!itemsContainer) {
        return;
    }


    const validCart =
        cart.filter(
            item => getProductById(item.id)
        );


    if (validCart.length !== cart.length) {

        cart = validCart;

        saveStorage(
            "novaCart",
            cart
        );
    }


    if (!cart.length) {

        itemsContainer.innerHTML = "";

        if (emptyCart) {
            emptyCart.hidden = false;
        }

        updateCartSummary();

        return;
    }


    if (emptyCart) {
        emptyCart.hidden = true;
    }


    itemsContainer.innerHTML =
        cart.map(item => {

            const product =
                getProductById(item.id);

            if (!product) {
                return "";
            }

            const id =
                getProductId(product);

            const name =
                escapeHTML(
                    product.name || "محصول"
                );

            const image =
                getProductImage(product);

            const price =
                Number(product.price) || 0;

            const quantity =
                Math.max(
                    1,
                    Number(item.quantity) || 1
                );

            const lineTotal =
                price * quantity;


            return `
                <div
                    class="cart-item"
                    data-cart-item="${escapeHTML(id)}"
                >

                    <div class="cart-item-image ${
                        image ? "" : "no-image"
                    }">

                        ${
                            image
                            ? `
                                <img
                                    src="${escapeHTML(image)}"
                                    alt="${name}"
                                >
                              `
                            : ""
                        }

                    </div>


                    <div class="cart-item-info">

                        <h3>
                            ${name}
                        </h3>

                        <p>
                            ${escapeHTML(
                                getProductCategory(product)
                            )}
                        </p>

                        <div class="cart-item-price">
                            ${formatPrice(price)}
                            تومان
                        </div>


                        <div class="quantity-control">

                            <button
                                type="button"
                                data-quantity-plus="${escapeHTML(id)}"
                                aria-label="افزایش"
                            >
                                <i class="fa-solid fa-plus"></i>
                            </button>

                            <span>
                                ${formatPrice(quantity)}
                            </span>

                            <button
                                type="button"
                                data-quantity-minus="${escapeHTML(id)}"
                                aria-label="کاهش"
                            >
                                <i class="fa-solid fa-minus"></i>
                            </button>

                        </div>

                    </div>


                    <div class="cart-item-actions">

                        <strong class="cart-item-total">
                            ${formatPrice(lineTotal)}
                            تومان
                        </strong>

                        <button
                            type="button"
                            class="remove-cart-item"
                            data-remove-cart="${escapeHTML(id)}"
                            aria-label="حذف محصول"
                        >
                            <i class="fa-solid fa-trash"></i>
                        </button>

                    </div>

                </div>
            `;

        }).join("");


    setupCartEvents();

    updateCartSummary();
}


/* =========================================================
   CART EVENTS
========================================================= */

function setupCartEvents() {

    document
        .querySelectorAll("[data-quantity-plus]")
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    increaseQuantity(
                        button.dataset.quantityPlus
                    );
                }
            );
        });


    document
        .querySelectorAll("[data-quantity-minus]")
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    decreaseQuantity(
                        button.dataset.quantityMinus
                    );
                }
            );
        });


    document
        .querySelectorAll("[data-remove-cart]")
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    removeFromCart(
                        button.dataset.removeCart
                    );
                }
            );
        });
}


/* =========================================================
   CART SUMMARY
========================================================= */

function updateCartSummary() {

    const details =
        getCartDetails();


    const totalItems =
        document.getElementById(
            "cartTotalItems"
        );

    const subtotal =
        document.getElementById(
            "cartSubtotal"
        );

    const discount =
        document.getElementById(
            "cartDiscount"
        );

    const shipping =
        document.getElementById(
            "cartShipping"
        );

    const total =
        document.getElementById(
            "cartTotal"
        );


    if (totalItems) {

        totalItems.textContent =
            formatPrice(details.totalItems);
    }


    if (subtotal) {

        subtotal.textContent =
            `${formatPrice(details.subtotal)} تومان`;
    }


    if (discount) {

        discount.textContent =
            details.discount > 0
                ? `- ${formatPrice(details.discount)} تومان`
                : "۰ تومان";
    }


    if (shipping) {

        shipping.textContent =
            details.shipping === 0
                ? "رایگان"
                : `${formatPrice(details.shipping)} تومان`;
    }


    if (total) {

        total.textContent =
            `${formatPrice(details.total)} تومان`;
    }
}


/* =========================================================
   COUNTERS
========================================================= */

function updateCounters() {

    const favoriteCount =
        favorites.length;

    const cartDetails =
        getCartDetails();

    const cartCount =
        cartDetails.totalItems;


    const headerCartCount =
        document.getElementById(
            "cartCount"
        );

    const mobileCartCount =
        document.getElementById(
            "mobileCartCount"
        );

    const favoritesCount =
        document.getElementById(
            "favoritesCount"
        );


    if (headerCartCount) {

        headerCartCount.textContent =
            formatPrice(cartCount);

        headerCartCount.hidden =
            cartCount === 0;
    }


    if (mobileCartCount) {

        mobileCartCount.textContent =
            formatPrice(cartCount);

        mobileCartCount.hidden =
            cartCount === 0;
    }


    if (favoritesCount) {

        favoritesCount.textContent =
            formatPrice(favoriteCount);

        favoritesCount.hidden =
            favoriteCount === 0;
    }
}


/* =========================================================
   CATEGORY SYSTEM
========================================================= */

function setupCategories() {

    const containers = [
        document.getElementById("categories"),
        document.getElementById("categoriesGrid")
    ].filter(Boolean);

    containers.forEach(container => {

        container.addEventListener(
            "click",
            event => {

                const card =
                    event.target.closest(
                        "[data-category]"
                    );

                if (!card) {
                    return;
                }

                event.preventDefault();

                const category =
                    card.dataset.category;

                selectCategory(category);
            }
        );
    });
}


function renderCategories() {

    const grid =
        document.getElementById(
            "categoriesGrid"
        );

    if (!grid || !allProducts.length) {
        return;
    }


    /*
       اگر دسته‌بندی‌های ثابت داخل HTML وجود دارند،
       همان‌ها حفظ می‌شوند.
    */

    const staticCards =
        grid.querySelectorAll(
            "[data-category]"
        );


    if (staticCards.length) {

        updateCategoryButtons();

        return;
    }


    const categoryMap =
        new Map();


    allProducts.forEach(product => {

        const category =
            getProductCategory(product);

        if (
            category &&
            !categoryMap.has(category)
        ) {

            categoryMap.set(
                category,
                0
            );
        }

        if (category) {

            categoryMap.set(
                category,
                categoryMap.get(category) + 1
            );
        }
    });


    const icons = [
        "fa-mobile-screen-button",
        "fa-laptop",
        "fa-headphones",
        "fa-gamepad",
        "fa-camera",
        "fa-clock",
        "fa-keyboard",
        "fa-box"
    ];


    const colors = [
        "purple",
        "blue",
        "pink",
        "green",
        "orange",
        "violet",
        "yellow",
        "red"
    ];


    let index = 0;


    grid.innerHTML = `

        <button
            type="button"
            class="category-card active"
            data-category="all"
        >
            <div class="cat-icon purple">
                <i class="fa-solid fa-border-all"></i>
            </div>

            <b>همه محصولات</b>

            <small>
                ${formatPrice(allProducts.length)} محصول
            </small>
        </button>

        ${
            Array.from(categoryMap.entries())
                .map(([category, count]) => {

                    const icon =
                        icons[index % icons.length];

                    const color =
                        colors[index % colors.length];

                    index++;

                    return `
                        <button
                            type="button"
                            class="category-card"
                            data-category="${escapeHTML(category)}"
                        >
                            <div class="cat-icon ${color}">
                                <i class="fa-solid ${icon}"></i>
                            </div>

                            <b>
                                ${escapeHTML(category)}
                            </b>

                            <small>
                                ${formatPrice(count)} محصول
                            </small>
                        </button>
                    `;
                })
                .join("")
        }

    `;


    setupCategories();
}


function selectCategory(category) {

    currentCategory =
        String(category || "all");

    updateCategoryButtons();

    filterProducts();

    scrollToProducts();
}


function updateCategoryButtons() {

    document
        .querySelectorAll(
            "#categoriesGrid [data-category]"
        )
        .forEach(button => {

            const category =
                String(
                    button.dataset.category
                );

            button.classList.toggle(
                "active",
                category === currentCategory
            );
        });
}


/* =========================================================
   FILTER
========================================================= */

function filterProducts() {

    const category =
        currentCategory.toLowerCase();

    const search =
        currentSearch
            .trim()
            .toLowerCase();


    filteredProducts =
        allProducts.filter(product => {

            const productCategory =
                getProductCategory(product)
                    .toLowerCase();

            const name =
                String(
                    product.name || ""
                ).toLowerCase();

            const description =
                String(
                    product.description || ""
                ).toLowerCase();


            const categoryMatch =
                category === "all" ||
                productCategory === category;


            const searchMatch =
                !search ||
                name.includes(search) ||
                productCategory.includes(search) ||
                description.includes(search);


            return (
                categoryMatch &&
                searchMatch
            );
        });


    renderProducts(
        filteredProducts
    );
}


/* =========================================================
   SEARCH
========================================================= */

function setupSearch() {

    const input =
        document.getElementById(
            "searchInput"
        );

    if (!input) {
        return;
    }


    input.addEventListener(
        "input",
        event => {

            currentSearch =
                event.target.value || "";

            filterProducts();
        }
    );


    input.addEventListener(
        "keydown",
        event => {

            if (event.key === "Escape") {

                input.value = "";

                currentSearch = "";

                filterProducts();
            }
        }
    );
}


/* =========================================================
   HERO SLIDER
========================================================= */

function setupHeroSlider() {

    const slider =
        document.getElementById(
            "heroSlider"
        );

    if (!slider) {
        return;
    }


    const slides =
        slider.querySelectorAll(
            ".hero-slide"
        );

    const dotsContainer =
        document.getElementById(
            "sliderDots"
        );


    if (!slides.length) {
        return;
    }


    if (dotsContainer) {

        dotsContainer.innerHTML =
            Array.from(slides)
                .map((_, index) => {

                    return `
                        <button
                            type="button"
                            class="dot ${
                                index === 0
                                    ? "active"
                                    : ""
                            }"
                            data-slide="${index}"
                            aria-label="اسلاید ${index + 1}"
                        ></button>
                    `;
                })
                .join("");


        dotsContainer
            .querySelectorAll("[data-slide]")
            .forEach(dot => {

                dot.addEventListener(
                    "click",
                    () => {

                        goToSlide(
                            Number(
                                dot.dataset.slide
                            )
                        );

                        restartSlider();
                    }
                );
            });
    }


    const previous =
        document.getElementById(
            "prevSlide"
        );

    const next =
        document.getElementById(
            "nextSlide"
        );


    if (previous) {

        previous.addEventListener(
            "click",
            () => {

                goToSlide(
                    currentSlide - 1
                );

                restartSlider();
            }
        );
    }


    if (next) {

        next.addEventListener(
            "click",
            () => {

                goToSlide(
                    currentSlide + 1
                );

                restartSlider();
            }
        );
    }


    slider.addEventListener(
        "mouseenter",
        pauseSlider
    );

    slider.addEventListener(
        "mouseleave",
        startSlider
    );


    slider.addEventListener(
        "touchstart",
        pauseSlider,
        {
            passive: true
        }
    );

    slider.addEventListener(
        "touchend",
        startSlider,
        {
            passive: true
        }
    );


    goToSlide(0);

    startSlider();
}


function goToSlide(index) {

    const slides =
        document.querySelectorAll(
            "#heroSlider .hero-slide"
        );

    const dots =
        document.querySelectorAll(
            "#sliderDots .dot"
        );


    if (!slides.length) {
        return;
    }


    if (index < 0) {
        index = slides.length - 1;
    }

    if (index >= slides.length) {
        index = 0;
    }


    currentSlide = index;


    slides.forEach(
        (slide, slideIndex) => {

            slide.classList.toggle(
                "active",
                slideIndex === index
            );
        }
    );


    dots.forEach(
        (dot, dotIndex) => {

            dot.classList.toggle(
                "active",
                dotIndex === index
            );
        }
    );
}


function startSlider() {

    clearInterval(sliderTimer);

    sliderTimer =
        setInterval(
            () => {

                goToSlide(
                    currentSlide + 1
                );

            },
            5000
        );
}


function pauseSlider() {

    clearInterval(sliderTimer);
}


function restartSlider() {

    clearInterval(sliderTimer);

    startSlider();
}


/* =========================================================
   HEADER / GENERAL BUTTONS
========================================================= */

function setupButtons() {

    const headerCart =
        document.getElementById(
            "headerCartBtn"
        );

    if (headerCart) {

        headerCart.addEventListener(
            "click",
            () => {

                openCart();
            }
        );
    }


    const checkout =
        document.getElementById(
            "checkoutBtn"
        );

    if (checkout) {

        checkout.addEventListener(
            "click",
            () => {

                if (!cart.length) {

                    showToast(
                        "سبد خرید شما خالی است",
                        "fa-cart-shopping"
                    );

                    return;
                }

                showToast(
                    "مرحله پرداخت در حال آماده‌سازی است",
                    "fa-credit-card"
                );
            }
        );
    }


    const continueShopping =
        document.getElementById(
            "continueShoppingBtn"
        );

    if (continueShopping) {

        continueShopping.addEventListener(
            "click",
            () => {

                showProducts();
            }
        );
    }


    const emptyCartProducts =
        document.getElementById(
            "emptyCartProductsBtn"
        );

    if (emptyCartProducts) {

        emptyCartProducts.addEventListener(
            "click",
            () => {

                showProducts();
            }
        );
    }


    const closeFavorites =
        document.getElementById(
            "closeFavoritesBtn"
        );

    if (closeFavorites) {

        closeFavorites.addEventListener(
            "click",
            () => {

                showProducts();
            }
        );
    }


    const backProducts =
        document.getElementById(
            "backToProductsBtn"
        );

    if (backProducts) {

        backProducts.addEventListener(
            "click",
            () => {

                showProducts();
            }
        );
    }


    const viewAll =
        document.getElementById(
            "viewAllBtn"
        );

    if (viewAll) {

        viewAll.addEventListener(
            "click",
            () => {

                currentCategory = "all";

                currentSearch = "";

                const search =
                    document.getElementById(
                        "searchInput"
                    );

                if (search) {
                    search.value = "";
                }

                updateCategoryButtons();

                showProducts();
            }
        );
    }


    /*
       لینک‌هایی که href="#products" دارند.
    */

    document
        .querySelectorAll(
            'a[href="#products"]'
        )
        .forEach(link => {

            link.addEventListener(
                "click",
                () => {

                    setTimeout(
                        showProducts,
                        50
                    );
                }
            );
        });


    document
        .querySelectorAll(
            'a[href="#categories"]'
        )
        .forEach(link => {

            link.addEventListener(
                "click",
                () => {

                    setTimeout(
                        scrollToCategories,
                        50
                    );
                }
            );
        });


    document
        .querySelectorAll(
            'a[href="#about"]'
        )
        .forEach(link => {

            link.addEventListener(
                "click",
                () => {

                    setTimeout(
                        scrollToAbout,
                        50
                    );
                }
            );
        });
}


/* =========================================================
   MOBILE NAVIGATION
========================================================= */

function setupMobileNavigation() {

    document
        .querySelectorAll(
            ".mobile-nav-item"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                event => {

                    event.preventDefault();

                    const action =
                        button.dataset.action ||
                        button.dataset.target ||
                        "";


                    document
                        .querySelectorAll(
                            ".mobile-nav-item"
                        )
                        .forEach(item => {

                            item.classList.remove(
                                "active"
                            );
                        });


                    button.classList.add(
                        "active"
                    );


                    if (
                        action === "home" ||
                        action === "products"
                    ) {

                        showProducts();

                    } else if (
                        action === "categories"
                    ) {

                        scrollToCategories();

                    } else if (
                        action === "favorites"
                    ) {

                        openFavorites();

                    } else if (
                        action === "cart"
                    ) {

                        openCart();

                    } else if (
                        action === "account"
                    ) {

                        showToast(
                            "بخش حساب کاربری به‌زودی فعال می‌شود",
                            "fa-user"
                        );
                    }
                }
            );
        });
}


/* =========================================================
   PAGE SECTIONS
========================================================= */

function getSection(id) {

    return document.getElementById(id);
}


function showProducts() {

    const products =
        getSection("products");

    const favoritesSection =
        getSection("favoritesSection");

    const cartSection =
        getSection("cartSection");


    if (products) {
        products.hidden = false;
    }

    if (favoritesSection) {
        favoritesSection.hidden = true;
    }

    if (cartSection) {
        cartSection.hidden = true;
    }


    setMobileActive("home");

    scrollToElement(products);
}


function openFavorites() {

    const products =
        getSection("products");

    const favoritesSection =
        getSection("favoritesSection");

    const cartSection =
        getSection("cartSection");


    if (products) {
        products.hidden = true;
    }

    if (cartSection) {
        cartSection.hidden = true;
    }

    if (favoritesSection) {
        favoritesSection.hidden = false;
    }


    renderFavorites();

    setMobileActive("favorites");

    scrollToElement(
        favoritesSection
    );
}


function openCart() {

    const products =
        getSection("products");

    const favoritesSection =
        getSection("favoritesSection");

    const cartSection =
        getSection("cartSection");


    if (products) {
        products.hidden = true;
    }

    if (favoritesSection) {
        favoritesSection.hidden = true;
    }

    if (cartSection) {
        cartSection.hidden = false;
    }


    renderCart();

    setMobileActive("cart");

    scrollToElement(
        cartSection
    );
}


function scrollToProducts() {

    const products =
        getSection("products");

    showProducts();

    scrollToElement(products);
}


function scrollToCategories() {

    const categories =
        getSection("categories");

    if (categories) {

        categories.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });
    }

    setMobileActive("categories");
}


function scrollToAbout() {

    const about =
        getSection("about");

    if (about) {

        about.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });
    }
}


function scrollToElement(element) {

    if (!element) {
        return;
    }

    setTimeout(
        () => {

            element.scrollIntoView({
                behavior: "smooth",
                block: "start"
            });

        },
        20
    );
}


function setMobileActive(action) {

    document
        .querySelectorAll(
            ".mobile-nav-item"
        )
        .forEach(button => {

            const buttonAction =
                button.dataset.action ||
                button.dataset.target ||
                "";

            button.classList.toggle(
                "active",
                buttonAction === action
            );
        });
}


/* =========================================================
   KEYBOARD
========================================================= */

function setupKeyboard() {

    document.addEventListener(
        "keydown",
        event => {

            if (event.key === "Escape") {

                const toast =
                    document.getElementById(
                        "toast"
                    );

                if (toast) {
                    toast.classList.remove(
                        "show"
                    );
                }
            }


            if (
                event.key === "ArrowLeft" &&
                document.activeElement?.tagName !== "INPUT"
            ) {

                goToSlide(
                    currentSlide + 1
                );

                restartSlider();
            }


            if (
                event.key === "ArrowRight" &&
                document.activeElement?.tagName !== "INPUT"
            ) {

                goToSlide(
                    currentSlide - 1
                );

                restartSlider();
            }
        }
    );
}


/* =========================================================
   TOAST
========================================================= */

function showToast(
    message,
    icon = "fa-circle-check"
) {

    const toast =
        document.getElementById(
            "toast"
        );

    const messageElement =
        document.getElementById(
            "toastMessage"
        );


    if (!toast || !messageElement) {
        return;
    }


    const iconElement =
        toast.querySelector("i");


    if (iconElement) {

        iconElement.className =
            `fa-solid ${icon}`;
    }


    messageElement.textContent =
        message;


    toast.classList.add(
        "show"
    );


    clearTimeout(
        toastTimer
    );


    toastTimer =
        setTimeout(
            () => {

                toast.classList.remove(
                    "show"
                );

            },
            2500
        );
}


/* =========================================================
   SUPABASE REALTIME
========================================================= */

function setupRealtime() {

    try {

        supabaseClient
            .channel("nova-products-channel")

            .on(
                "postgres_changes",
                {
                    event: "*",
                    schema: "public",
                    table: "products"
                },
                () => {

                    loadProducts();
                }
            )

            .subscribe();

    } catch (error) {

        console.warn(
            "Realtime unavailable:",
            error
        );
    }
}


/* =========================================================
   GLOBAL FUNCTIONS
========================================================= */

window.NovaStore = {

    getProducts: () => allProducts,

    getCart: () => cart,

    getFavorites: () => favorites,

    addToCart,

    removeFromCart,

    increaseQuantity,

    decreaseQuantity,

    toggleFavorite,

    openCart,

    openFavorites,

    showProducts,

    selectCategory,

    loadProducts
};
