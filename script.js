/* =========================================================
   NOVA STORE - MAIN JAVASCRIPT
========================================================= */


/* =========================================================
   SUPABASE
========================================================= */

const SUPABASE_URL =
    "https://zwtbrgsphgjyczdibldj.supabase.co";

/*
 * مهم:
 * این مقدار را با همان Publishable / Anon Key
 * قبلی خودت جایگزین کن.
 *
 * هرگز Service Role Key را اینجا قرار نده.
 */
const SUPABASE_KEY =
    "sb_publishable_rU0rSsuonmSoDYzK9-S1ig_uNPkAOha";


let supabaseClient = null;


/* =========================================================
   GLOBAL STATE
========================================================= */

let allProducts = [];
let filteredProducts = [];

let favorites = [];
let cart = [];

let currentCategory = "";
let currentSearch = "";

let currentSlide = 0;
let sliderTimer = null;
let toastTimer = null;


/* =========================================================
   LOCAL STORAGE KEYS
========================================================= */

const FAVORITES_KEY = "novaFavorites";
const CART_KEY = "novaCart";


/* =========================================================
   DOM READY
========================================================= */

document.addEventListener("DOMContentLoaded", () => {

    initializeApp();

});


/* =========================================================
   INITIALIZE APP
========================================================= */

async function initializeApp() {

    loadLocalData();

    initializeSupabase();

    setupHeader();

    setupNavigation();

    setupCategories();

    setupCart();

    setupFavorites();

    setupHeroSlider();

    setupSearch();

    setupProductButtons();

    setupScrollButtons();

    updateFavoritesUI();

    updateCartUI();

    renderFavorites();

    await loadProducts();

}


/* =========================================================
   SUPABASE INITIALIZATION
========================================================= */

function initializeSupabase() {

    if (
        !window.supabase ||
        typeof window.supabase.createClient !== "function"
    ) {

        showToast(
            "کتابخانه اتصال به فروشگاه بارگذاری نشده است."
        );

        return;

    }


    try {

        supabaseClient =
            window.supabase.createClient(
                SUPABASE_URL,
                SUPABASE_KEY
            );

    } catch (error) {

        console.error(
            "Supabase initialization error:",
            error
        );

        showToast(
            "خطا در اتصال به فروشگاه."
        );

    }

}


/* =========================================================
   LOCAL DATA
========================================================= */

function loadLocalData() {

    try {

        const savedFavorites =
            localStorage.getItem(FAVORITES_KEY);

        const savedCart =
            localStorage.getItem(CART_KEY);


        if (savedFavorites) {

            const parsedFavorites =
                JSON.parse(savedFavorites);

            if (Array.isArray(parsedFavorites)) {

                favorites =
                    parsedFavorites.map(String);

            }

        }


        if (savedCart) {

            const parsedCart =
                JSON.parse(savedCart);

            if (Array.isArray(parsedCart)) {

                cart = parsedCart
                    .map(item => ({
                        id: String(item.id),
                        quantity:
                            Math.max(
                                1,
                                Number(item.quantity) || 1
                            )
                    }));

            }

        }

    } catch (error) {

        console.error(
            "Local storage error:",
            error
        );

        favorites = [];
        cart = [];

    }

}


function saveFavorites() {

    try {

        localStorage.setItem(
            FAVORITES_KEY,
            JSON.stringify(favorites)
        );

    } catch (error) {

        console.error(
            "Could not save favorites:",
            error
        );

    }

}


function saveCart() {

    try {

        localStorage.setItem(
            CART_KEY,
            JSON.stringify(cart)
        );

    } catch (error) {

        console.error(
            "Could not save cart:",
            error
        );

    }

}


/* =========================================================
   LOAD PRODUCTS
========================================================= */

async function loadProducts() {

    const productsGrid =
        document.getElementById("productsGrid");


    if (!supabaseClient) {

        if (productsGrid) {

            productsGrid.innerHTML = `
                <div class="products-loading">
                    <i class="fa-solid fa-triangle-exclamation"></i>
                    <span>اتصال به فروشگاه برقرار نشد.</span>
                </div>
            `;

        }

        return;

    }


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


        allProducts =
            Array.isArray(data)
                ? data
                : [];


        cleanupLocalData();

        applyFilters();

        renderFavorites();

        updateFavoritesUI();

        updateCartUI();


    } catch (error) {

        console.error(
            "Products loading error:",
            error
        );


        if (productsGrid) {

            productsGrid.innerHTML = `
                <div class="products-loading">
                    <i class="fa-solid fa-circle-exclamation"></i>
                    <span>
                        خطا در دریافت محصولات
                    </span>
                </div>
            `;

        }


        showToast(
            "خطا در دریافت محصولات."
        );

    }

}


/* =========================================================
   CLEAN INVALID LOCAL DATA
========================================================= */

function cleanupLocalData() {

    const validIds =
        new Set(
            allProducts.map(
                product => String(product.id)
            )
        );


    favorites =
        favorites.filter(
            id => validIds.has(String(id))
        );


    cart =
        cart.filter(
            item => validIds.has(String(item.id))
        );


    saveFavorites();

    saveCart();

}


/* =========================================================
   PRODUCT HELPERS
========================================================= */

function getProductId(product) {

    return String(product.id);

}


function getProductImage(product) {

    return (
        product.image_url ||
        product.image ||
        product.imageUrl ||
        ""
    );

}


function getProductName(product) {

    return (
        product.name ||
        "محصول بدون نام"
    );

}


function getProductCategory(product) {

    return (
        product.category ||
        "عمومی"
    );

}


function getProductDescription(product) {

    return (
        product.description ||
        "توضیحی برای این محصول ثبت نشده است."
    );

}


function getProductPrice(product) {

    return Number(product.price) || 0;

}


function getProductOldPrice(product) {

    return Number(product.old_price) || 0;

}


function isProductNew(product) {

    return (
        product.is_new === true ||
        product.is_new === "true" ||
        product.is_new === 1
    );

}


function getProductDiscount(product) {

    const directDiscount =
        Number(product.discount) || 0;


    if (directDiscount > 0) {

        return Math.round(
            directDiscount
        );

    }


    const price =
        getProductPrice(product);

    const oldPrice =
        getProductOldPrice(product);


    if (
        oldPrice > price &&
        price > 0
    ) {

        return Math.round(
            ((oldPrice - price) / oldPrice) * 100
        );

    }


    return 0;

}


/* =========================================================
   FILTERS
========================================================= */

function applyFilters() {

    const search =
        currentSearch
            .trim()
            .toLowerCase();


    filteredProducts =
        allProducts.filter(product => {

            const category =
                String(
                    getProductCategory(product)
                ).toLowerCase();


            const name =
                String(
                    getProductName(product)
                ).toLowerCase();


            const description =
                String(
                    getProductDescription(product)
                ).toLowerCase();


            const matchesCategory =
                !currentCategory ||
                category ===
                    currentCategory.toLowerCase();


            const matchesSearch =
                !search ||
                name.includes(search) ||
                category.includes(search) ||
                description.includes(search);


            return (
                matchesCategory &&
                matchesSearch
            );

        });


    renderProducts(
        filteredProducts
    );

}


/* =========================================================
   RENDER PRODUCTS
========================================================= */

function renderProducts(products) {

    const grid =
        document.getElementById("productsGrid");


    if (!grid) {

        return;

    }


    if (!products.length) {

        grid.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">
                    <i class="fa-solid fa-box-open"></i>
                </div>

                <h3>
                    محصولی پیدا نشد
                </h3>

                <p>
                    عبارت جستجو یا دسته‌بندی دیگری را امتحان کنید.
                </p>

                <button
                    class="primary-btn"
                    type="button"
                    data-clear-filters
                >
                    نمایش همه محصولات
                </button>
            </div>
        `;


        const clearButton =
            grid.querySelector(
                "[data-clear-filters]"
            );


        if (clearButton) {

            clearButton.addEventListener(
                "click",
                clearFilters
            );

        }


        return;

    }


    grid.innerHTML =
        products
            .map(
                product =>
                    createProductCard(product)
            )
            .join("");


    bindProductCardEvents();

}


/* =========================================================
   CREATE PRODUCT CARD
========================================================= */

function createProductCard(product) {

    const id =
        getProductId(product);

    const name =
        escapeHtml(
            getProductName(product)
        );

    const category =
        escapeHtml(
            getProductCategory(product)
        );

    const description =
        escapeHtml(
            getProductDescription(product)
        );

    const image =
        getProductImage(product);

    const price =
        getProductPrice(product);

    const oldPrice =
        getProductOldPrice(product);

    const discount =
        getProductDiscount(product);

    const isNew =
        isProductNew(product);


    const isFavorite =
        favorites.includes(id);


    const imageHTML =
        image
            ? `
                <img
                    src="${escapeAttribute(image)}"
                    alt="${escapeAttribute(
                        getProductName(product)
                    )}"
                    loading="lazy"
                >
            `
            : "";


    const oldPriceHTML =
        oldPrice > price
            ? `
                <span class="old-price">
                    ${formatPrice(oldPrice)}
                </span>
            `
            : "";


    const discountHTML =
        discount > 0
            ? `
                <span class="discount-badge">
                    ${discount}٪ تخفیف
                </span>
            `
            : "";


    const newHTML =
        isNew
            ? `
                <span class="new-badge">
                    جدید
                </span>
            `
            : "";


    return `
        <article
            class="product-card"
            data-product-id="${escapeAttribute(id)}"
        >

            <div
                class="product-image ${
                    image ? "" : "no-image"
                }"
            >

                ${imageHTML}

                <div class="product-badges">
                    ${discountHTML}
                    ${newHTML}
                </div>


                <button
                    class="favorite-btn ${
                        isFavorite ? "active" : ""
                    }"
                    type="button"
                    data-favorite-id="${escapeAttribute(id)}"
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

                <span class="product-category">
                    ${category}
                </span>

                <h3 class="product-title">
                    ${name}
                </h3>

                <p class="product-description">
                    ${description}
                </p>


                <div class="product-price">

                    <span class="current-price">
                        ${formatPrice(price)}
                    </span>

                    ${oldPriceHTML}

                </div>


                <button
                    class="add-to-cart"
                    type="button"
                    data-add-cart-id="${escapeAttribute(id)}"
                >

                    <i class="fa-solid fa-cart-plus"></i>

                    <span>
                        افزودن به سبد
                    </span>

                </button>

            </div>

        </article>
    `;

}


/* =========================================================
   BIND PRODUCT EVENTS
========================================================= */

function bindProductCardEvents() {

    document
        .querySelectorAll(
            "[data-favorite-id]"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                event => {

                    event.preventDefault();
                    event.stopPropagation();

                    const id =
                        button.dataset.favoriteId;

                    toggleFavorite(id);

                }
            );

        });


    document
        .querySelectorAll(
            "[data-add-cart-id]"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                event => {

                    event.preventDefault();
                    event.stopPropagation();

                    const id =
                        button.dataset.addCartId;

                    addToCart(id);

                }
            );

        });


    document
        .querySelectorAll(".product-card")
        .forEach(card => {

            card.addEventListener(
                "click",
                event => {

                    if (
                        event.target.closest(
                            "button"
                        )
                    ) {

                        return;

                    }

                    const id =
                        card.dataset.productId;

                    if (id) {

                        const product =
                            findProduct(id);

                        if (product) {

                            showToast(
                                getProductName(product)
                            );

                        }

                    }

                }
            );

        });

}


/* =========================================================
   PRODUCT BUTTON FALLBACK
========================================================= */

function setupProductButtons() {

    document.addEventListener(
        "click",
        event => {

            const addButton =
                event.target.closest(
                    "[data-add-cart-id]"
                );


            if (
                addButton &&
                !addButton.dataset.bound
            ) {

                addButton.dataset.bound = "true";

            }

        }
    );

}


/* =========================================================
   FIND PRODUCT
========================================================= */

function findProduct(id) {

    return allProducts.find(
        product =>
            String(product.id) === String(id)
    );

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
            "محصول به علاقه‌مندی‌ها اضافه شد."
        );

    } else {

        favorites.splice(index, 1);

        showToast(
            "محصول از علاقه‌مندی‌ها حذف شد."
        );

    }


    saveFavorites();

    updateFavoritesUI();

    renderFavorites();


    if (
        currentCategory ||
        currentSearch
    ) {

        renderProducts(
            filteredProducts
        );

    } else {

        renderProducts(
            allProducts
        );

    }

}


function renderFavorites() {

    const grid =
        document.getElementById(
            "favoritesGrid"
        );

    const empty =
        document.getElementById(
            "emptyFavorites"
        );


    if (!grid || !empty) {

        return;

    }


    const favoriteProducts =
        allProducts.filter(
            product =>
                favorites.includes(
                    getProductId(product)
                )
        );


    if (!favoriteProducts.length) {

        grid.innerHTML = "";

        empty.hidden = false;

        return;

    }


    empty.hidden = true;


    grid.innerHTML =
        favoriteProducts
            .map(
                product =>
                    createProductCard(product)
            )
            .join("");


    bindProductCardEvents();

}


function updateFavoritesUI() {

    const count =
        favorites.length;


    const mobileCount =
        document.getElementById(
            "favoritesCount"
        );


    const headerCount =
        document.getElementById(
            "headerFavoritesCount"
        );


    if (mobileCount) {

        mobileCount.textContent =
            String(count);

        mobileCount.hidden =
            count === 0;

    }


    if (headerCount) {

        headerCount.textContent =
            String(count);

        headerCount.hidden =
            count === 0;

    }

}


/* =========================================================
   FAVORITES SECTION
========================================================= */

function openFavorites() {

    const section =
        document.getElementById(
            "favoritesSection"
        );


    if (!section) {

        return;

    }


    closeCart(false);

    section.hidden = false;


    section.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });


    setMobileNavActive(
        "favorites"
    );

}


function closeFavorites() {

    const section =
        document.getElementById(
            "favoritesSection"
        );


    if (!section) {

        return;

    }


    section.hidden = true;

    setMobileNavActive(
        "home"
    );

}


function setupFavorites() {

    const headerButton =
        document.getElementById(
            "headerFavoritesBtn"
        );


    if (headerButton) {

        headerButton.addEventListener(
            "click",
            openFavorites
        );

    }


    const closeButton =
        document.getElementById(
            "closeFavoritesBtn"
        );


    if (closeButton) {

        closeButton.addEventListener(
            "click",
            closeFavorites
        );

    }


    const backButton =
        document.getElementById(
            "backToProductsBtn"
        );


    if (backButton) {

        backButton.addEventListener(
            "click",
            () => {

                closeFavorites();

                scrollToProducts();

            }
        );

    }

}


/* =========================================================
   CART
========================================================= */

function addToCart(id) {

    id = String(id);


    const product =
        findProduct(id);


    if (!product) {

        showToast(
            "این محصول پیدا نشد."
        );

        return;

    }


    const existing =
        cart.find(
            item =>
                String(item.id) === id
        );


    if (existing) {

        existing.quantity += 1;

    } else {

        cart.push({
            id,
            quantity: 1
        });

    }


    saveCart();

    updateCartUI();

    showToast(
        "محصول به سبد خرید اضافه شد."
    );


    /*
     * سبد را خودکار باز نمی‌کنیم
     * تا کاربر بتواند محصولات بیشتری
     * انتخاب کند.
     */

}


function decreaseCartQuantity(id) {

    id = String(id);


    const item =
        cart.find(
            item =>
                String(item.id) === id
        );


    if (!item) {

        return;

    }


    item.quantity -= 1;


    if (item.quantity <= 0) {

        removeFromCart(
            id,
            false
        );

        return;

    }


    saveCart();

    updateCartUI();

}


function increaseCartQuantity(id) {

    id = String(id);


    const item =
        cart.find(
            item =>
                String(item.id) === id
        );


    if (!item) {

        return;

    }


    item.quantity += 1;

    saveCart();

    updateCartUI();

}


function removeFromCart(
    id,
    showMessage = true
) {

    id = String(id);


    cart =
        cart.filter(
            item =>
                String(item.id) !== id
        );


    saveCart();

    updateCartUI();


    if (showMessage) {

        showToast(
            "محصول از سبد خرید حذف شد."
        );

    }

}


/* =========================================================
   CART UI
========================================================= */

function updateCartUI() {

    const totalItems =
        cart.reduce(
            (sum, item) =>
                sum +
                (Number(item.quantity) || 0),
            0
        );


    const countElement =
        document.getElementById(
            "cartCount"
        );


    const mobileCountElement =
        document.getElementById(
            "mobileCartCount"
        );


    if (countElement) {

        countElement.textContent =
            String(totalItems);

        countElement.hidden =
            totalItems === 0;

    }


    if (mobileCountElement) {

        mobileCountElement.textContent =
            String(totalItems);

        mobileCountElement.hidden =
            totalItems === 0;

    }


    renderCart();

}


function renderCart() {

    const cartItemsElement =
        document.getElementById(
            "cartItems"
        );

    const emptyCart =
        document.getElementById(
            "emptyCart"
        );


    if (
        !cartItemsElement ||
        !emptyCart
    ) {

        return;

    }


    const validItems =
        cart
            .map(item => {

                const product =
                    findProduct(item.id);

                if (!product) {

                    return null;

                }

                return {
                    product,
                    quantity:
                        Math.max(
                            1,
                            Number(item.quantity) || 1
                        )
                };

            })
            .filter(Boolean);


    if (!validItems.length) {

        cartItemsElement.innerHTML = "";

        emptyCart.hidden = false;

        updateCartSummary([]);

        return;

    }


    emptyCart.hidden = true;


    cartItemsElement.innerHTML =
        validItems
            .map(
                ({ product, quantity }) =>
                    createCartItem(
                        product,
                        quantity
                    )
            )
            .join("");


    bindCartEvents(
        cartItemsElement
    );


    updateCartSummary(
        validItems
    );

}


function createCartItem(
    product,
    quantity
) {

    const id =
        getProductId(product);

    const image =
        getProductImage(product);

    const imageHTML =
        image
            ? `
                <img
                    src="${escapeAttribute(image)}"
                    alt="${escapeAttribute(
                        getProductName(product)
                    )}"
                >
            `
            : `
                <i class="fa-solid fa-box"></i>
            `;


    return `
        <article
            class="cart-item"
            data-cart-id="${escapeAttribute(id)}"
        >

            <div class="cart-item-image">
                ${imageHTML}
            </div>


            <div class="cart-item-info">

                <h3>
                    ${escapeHtml(
                        getProductName(product)
                    )}
                </h3>

                <div class="cart-item-category">
                    ${escapeHtml(
                        getProductCategory(product)
                    )}
                </div>

                <div class="cart-item-price">
                    ${formatPrice(
                        getProductPrice(product)
                    )}
                </div>

            </div>


            <div class="cart-item-controls">

                <div class="quantity-control">

                    <button
                        class="quantity-btn"
                        type="button"
                        data-cart-plus="${escapeAttribute(id)}"
                        aria-label="افزایش تعداد"
                    >
                        <i class="fa-solid fa-plus"></i>
                    </button>

                    <span class="quantity-value">
                        ${quantity}
                    </span>

                    <button
                        class="quantity-btn"
                        type="button"
                        data-cart-minus="${escapeAttribute(id)}"
                        aria-label="کاهش تعداد"
                    >
                        <i class="fa-solid fa-minus"></i>
                    </button>

                </div>


                <button
                    class="remove-cart-item"
                    type="button"
                    data-cart-remove="${escapeAttribute(id)}"
                    aria-label="حذف محصول"
                >
                    <i class="fa-solid fa-trash"></i>
                </button>

            </div>

        </article>
    `;

}


function bindCartEvents(container) {

    container
        .querySelectorAll(
            "[data-cart-plus]"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    increaseCartQuantity(
                        button.dataset.cartPlus
                    );

                }
            );

        });


    container
        .querySelectorAll(
            "[data-cart-minus]"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    decreaseCartQuantity(
                        button.dataset.cartMinus
                    );

                }
            );

        });


    container
        .querySelectorAll(
            "[data-cart-remove]"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    removeFromCart(
                        button.dataset.cartRemove
                    );

                }
            );

        });

}


/* =========================================================
   CART SUMMARY
========================================================= */

function updateCartSummary(items) {

    let totalItems = 0;
    let subtotal = 0;
    let discount = 0;


    items.forEach(
        ({ product, quantity }) => {

            const price =
                getProductPrice(product);

            const oldPrice =
                getProductOldPrice(product);


            totalItems += quantity;

            subtotal +=
                price * quantity;


            if (oldPrice > price) {

                discount +=
                    (oldPrice - price) *
                    quantity;

            }

        }
    );


    const shipping =
        subtotal === 0
            ? 0
            : subtotal >= 2000000
                ? 0
                : 50000;


    const total =
        subtotal + shipping;


    setText(
        "cartTotalItems",
        formatNumber(totalItems)
    );

    setText(
        "cartSubtotal",
        formatPrice(subtotal)
    );

    setText(
        "cartDiscount",
        formatPrice(discount)
    );

    setText(
        "cartShipping",
        shipping === 0 && subtotal > 0
            ? "رایگان"
            : formatPrice(shipping)
    );

    setText(
        "cartTotal",
        formatPrice(total)
    );

}


/* =========================================================
   OPEN / CLOSE CART
========================================================= */

function openCart() {

    const cartSection =
        document.getElementById(
            "cartSection"
        );


    if (!cartSection) {

        return;

    }


    closeFavorites();

    cartSection.hidden = false;


    cartSection.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });


    setMobileNavActive(
        "cart"
    );


    /*
     * بعد از باز شدن سبد، دوباره
     * UI را تازه می‌کنیم.
     */
    updateCartUI();

}


function closeCart(
    updateNav = true
) {

    const cartSection =
        document.getElementById(
            "cartSection"
        );


    if (!cartSection) {

        return;

    }


    cartSection.hidden = true;


    if (updateNav) {

        setMobileNavActive(
            "home"
        );

    }

}


/* =========================================================
   CART SETUP
========================================================= */

function setupCart() {

    /*
     * Header Cart
     */

    const headerCart =
        document.getElementById(
            "headerCartBtn"
        );


    if (headerCart) {

        headerCart.addEventListener(
            "click",
            event => {

                event.preventDefault();

                openCart();

            }
        );

    }


    /*
     * Close Cart
     */

    const closeCartButton =
        document.getElementById(
            "closeCartBtn"
        );


    if (closeCartButton) {

        closeCartButton.addEventListener(
            "click",
            event => {

                event.preventDefault();

                event.stopPropagation();

                closeCart();

                /*
                 * بعد از بستن، کاربر را به
                 * محصولات برنمی‌گردانیم.
                 */

            }
        );

    }


    /*
     * Continue Shopping
     */

    const continueShopping =
        document.getElementById(
            "continueShoppingBtn"
        );


    if (continueShopping) {

        continueShopping.addEventListener(
            "click",
            () => {

                closeCart();

                scrollToProducts();

            }
        );

    }


    /*
     * Empty Cart Button
     */

    const emptyCartProducts =
        document.getElementById(
            "emptyCartProductsBtn"
        );


    if (emptyCartProducts) {

        emptyCartProducts.addEventListener(
            "click",
            () => {

                closeCart();

                scrollToProducts();

            }
        );

    }


    /*
     * Checkout
     */

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
                        "سبد خرید شما خالی است."
                    );

                    return;

                }


                showToast(
                    "مرحله پرداخت در حال آماده‌سازی است."
                );

            }
        );

    }

}


/* =========================================================
   NAVIGATION
========================================================= */

function setupNavigation() {

    /*
     * Desktop nav
     */

    document
        .querySelectorAll(
            ".desktop-nav .nav-link"
        )
        .forEach(link => {

            link.addEventListener(
                "click",
                () => {

                    document
                        .querySelectorAll(
                            ".desktop-nav .nav-link"
                        )
                        .forEach(
                            item =>
                                item.classList.remove(
                                    "active"
                                )
                        );


                    link.classList.add(
                        "active"
                    );

                }
            );

        });


    /*
     * Mobile navigation
     */

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
                        button.dataset.action;


                    handleMobileNavigation(
                        action
                    );

                }
            );

        });


    /*
     * Brand
     */

    const brandHome =
        document.getElementById(
            "brandHome"
        );


    if (brandHome) {

        brandHome.addEventListener(
            "click",
            () => {

                closeCart();

                closeFavorites();

                setMobileNavActive(
                    "home"
                );

            }
        );

    }


    /*
     * Header Account
     */

    const account =
        document.getElementById(
            "headerAccountBtn"
        );


    if (account) {

        account.addEventListener(
            "click",
            showAccountMessage
        );

    }

}


function handleMobileNavigation(
    action
) {

    switch (action) {

        case "home":

            closeCart();

            closeFavorites();

            currentCategory = "";

            currentSearch = "";

            const searchInput =
                document.getElementById(
                    "searchInput"
                );

            if (searchInput) {

                searchInput.value = "";

            }

            renderProducts(
                allProducts
            );

            setMobileNavActive(
                "home"
            );

            scrollToTop();

            break;


        case "categories":

            closeCart();

            closeFavorites();

            setMobileNavActive(
                "categories"
            );

            scrollToCategories();

            break;


        case "favorites":

            openFavorites();

            break;


        case "cart":

            openCart();

            break;


        case "account":

            showAccountMessage();

            break;

    }

}


function setMobileNavActive(
    action
) {

    document
        .querySelectorAll(
            ".mobile-nav-item"
        )
        .forEach(button => {

            button.classList.toggle(
                "active",
                button.dataset.action === action
            );

        });

}


/* =========================================================
   CATEGORIES
========================================================= */

function setupCategories() {

    const container =
        document.getElementById(
            "categoriesGrid"
        );


    if (!container) {

        return;

    }


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


            const category =
                card.dataset.category || "";


            selectCategory(
                category
            );

        }
    );

}


function selectCategory(
    category
) {

    currentCategory =
        category || "";


    const searchInput =
        document.getElementById(
            "searchInput"
        );


    if (searchInput) {

        searchInput.value =
            currentSearch;

    }


    closeCart();

    closeFavorites();

    applyFilters();

    setMobileNavActive(
        "categories"
    );


    scrollToProducts();


    if (currentCategory) {

        showToast(
            `دسته‌بندی «${currentCategory}»`
        );

    }

}


function clearFilters() {

    currentCategory = "";

    currentSearch = "";


    const searchInput =
        document.getElementById(
            "searchInput"
        );


    if (searchInput) {

        searchInput.value = "";

    }


    applyFilters();

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


    let searchTimeout = null;


    input.addEventListener(
        "input",
        () => {

            clearTimeout(
                searchTimeout
            );


            searchTimeout =
                setTimeout(
                    () => {

                        currentSearch =
                            input.value || "";

                        closeFavorites();

                        closeCart();

                        applyFilters();

                    },
                    180
                );

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


    const dots =
        slider.querySelectorAll(
            ".slider-dot"
        );


    const prev =
        document.getElementById(
            "prevSlide"
        );


    const next =
        document.getElementById(
            "nextSlide"
        );


    if (!slides.length) {

        return;

    }


    function showSlide(index) {

        currentSlide =
            (
                index + slides.length
            ) % slides.length;


        slides.forEach(
            (slide, i) => {

                slide.classList.toggle(
                    "active",
                    i === currentSlide
                );

            }
        );


        dots.forEach(
            (dot, i) => {

                dot.classList.toggle(
                    "active",
                    i === currentSlide
                );

            }
        );

    }


    window.NovaSlider =
        {
            next: () => {

                showSlide(
                    currentSlide + 1
                );

            },

            previous: () => {

                showSlide(
                    currentSlide - 1
                );

            },

            goTo: index => {

                showSlide(index);

            }
        };


    if (prev) {

        prev.addEventListener(
            "click",
            () => {

                showSlide(
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

                showSlide(
                    currentSlide + 1
                );

                restartSlider();

            }
        );

    }


    dots.forEach(
        dot => {

            dot.addEventListener(
                "click",
                () => {

                    const index =
                        Number(
                            dot.dataset.slideTo
                        ) || 0;

                    showSlide(index);

                    restartSlider();

                }
            );

        }
    );


    slider.addEventListener(
        "mouseenter",
        stopSlider
    );


    slider.addEventListener(
        "mouseleave",
        startSlider
    );


    slider.addEventListener(
        "touchstart",
        stopSlider,
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


    showSlide(0);

    startSlider();


    function startSlider() {

        stopSlider();

        sliderTimer =
            setInterval(
                () => {

                    showSlide(
                        currentSlide + 1
                    );

                },
                5000
            );

    }


    function stopSlider() {

        if (sliderTimer) {

            clearInterval(
                sliderTimer
            );

            sliderTimer = null;

        }

    }


    function restartSlider() {

        startSlider();

    }

}


/* =========================================================
   HERO / SCROLL BUTTONS
========================================================= */

function setupScrollButtons() {

    document
        .querySelectorAll(
            "[data-scroll-products]"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    scrollToProducts();

                }
            );

        });


    const viewAll =
        document.getElementById(
            "viewAllBtn"
        );


    if (viewAll) {

        viewAll.addEventListener(
            "click",
            () => {

                clearFilters();

                scrollToProducts();

            }
        );

    }

}


function scrollToProducts() {

    const products =
        document.getElementById(
            "products"
        );


    if (!products) {

        return;

    }


    products.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });


    setMobileNavActive(
        "home"
    );

}


function scrollToCategories() {

    const categories =
        document.getElementById(
            "categories"
        );


    if (!categories) {

        return;

    }


    categories.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });

}


function scrollToTop() {

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });

}


/* =========================================================
   ACCOUNT
========================================================= */

function showAccountMessage() {

    showToast(
        "بخش حساب کاربری به‌زودی فعال می‌شود."
    );

}


/* =========================================================
   REALTIME SUPABASE
========================================================= */

function setupRealtime() {

    if (!supabaseClient) {

        return;

    }


    try {

        supabaseClient
            .channel(
                "nova-products-realtime"
            )
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

        console.error(
            "Realtime error:",
            error
        );

    }

}


/* =========================================================
   SEARCH / HEADER EXTRA BEHAVIOR
========================================================= */

function setupHeader() {

    const searchInput =
        document.getElementById(
            "searchInput"
        );


    const headerFavorites =
        document.getElementById(
            "headerFavoritesBtn"
        );


    const headerAccount =
        document.getElementById(
            "headerAccountBtn"
        );


    /*
     * On mobile, tapping search field
     * keeps it usable.
     */

    if (searchInput) {

        searchInput.addEventListener(
            "focus",
            () => {

                searchInput
                    .closest(".search-box")
                    ?.classList.add("active");

            }
        );

    }


    /*
     * Header favorite button is also
     * connected here as a fallback.
     */

    if (
        headerFavorites &&
        !headerFavorites.dataset.ready
    ) {

        headerFavorites.dataset.ready =
            "true";

    }


    if (
        headerAccount &&
        !headerAccount.dataset.ready
    ) {

        headerAccount.dataset.ready =
            "true";

    }

}


/* =========================================================
   TOAST
========================================================= */

function showToast(message) {

    const toast =
        document.getElementById(
            "toast"
        );

    const toastMessage =
        document.getElementById(
            "toastMessage"
        );


    if (!toast || !toastMessage) {

        return;

    }


    toastMessage.textContent =
        String(message);


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
            2600
        );

}


/* =========================================================
   NUMBER / PRICE FORMAT
========================================================= */

function formatNumber(value) {

    const number =
        Number(value) || 0;


    return number.toLocaleString(
        "fa-IR"
    );

}


function formatPrice(value) {

    const number =
        Number(value) || 0;


    return (
        number.toLocaleString("fa-IR") +
        " تومان"
    );

}


/* =========================================================
   DOM HELPER
========================================================= */

function setText(
    id,
    value
) {

    const element =
        document.getElementById(id);


    if (element) {

        element.textContent =
            value;

    }

}


/* =========================================================
   HTML ESCAPING
========================================================= */

function escapeHtml(value) {

    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");

}


function escapeAttribute(value) {

    return escapeHtml(value);

}


/* =========================================================
   SUPABASE REALTIME START
========================================================= */

setTimeout(
    setupRealtime,
    1000
);


/* =========================================================
   PUBLIC API
========================================================= */

window.NovaStore = {

    loadProducts,

    addToCart,

    removeFromCart,

    increaseCartQuantity,

    decreaseCartQuantity,

    toggleFavorite,

    openCart,

    closeCart,

    openFavorites,

    closeFavorites,

    selectCategory,

    clearFilters,

    scrollToProducts

};
