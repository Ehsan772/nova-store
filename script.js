/* =========================================================
   NOVA STORE
   COMPLETE STOREFRONT SCRIPT
   Supabase + Products + Cart + Favorites + Search + Filter
========================================================= */


/* =========================================================
   SUPABASE
========================================================= */

const SUPABASE_URL =
    "https://zwtbrgsphgjyczdibldj.supabase.co";

/*
   کلید Publishable فعلی خودت را همینجا نگه دار.
   کلید فعلی فایل قبلی‌ات را حذف نکن.
*/
const SUPABASE_PUBLISHABLE_KEY =
    "sb_publishable_rU0rSsuonmSoDYzK9-S1ig_uNPkAOha";


const supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY
);


/* =========================================================
   GLOBAL STATE
========================================================= */

let allProducts = [];
let filteredProducts = [];

let cart = JSON.parse(
    localStorage.getItem("nova_cart") || "[]"
);

let favorites = JSON.parse(
    localStorage.getItem("nova_favorites") || "[]"
);

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

    if (
        value === null ||
        value === undefined
    ) {
        return "";
    }

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


function formatPrice(price) {

    if (
        price === null ||
        price === undefined ||
        price === ""
    ) {
        return "تماس بگیرید";
    }

    const number = Number(price);

    if (Number.isNaN(number)) {
        return escapeHTML(price);
    }

    return (
        new Intl.NumberFormat("fa-IR").format(number) +
        " تومان"
    );
}


/* =========================================================
   CART
========================================================= */

function saveCart() {

    localStorage.setItem(
        "nova_cart",
        JSON.stringify(cart)
    );
}


function updateCartCount() {

    const count = cart.reduce(
        (total, item) =>
            total + Number(item.quantity || 1),
        0
    );

    const selectors = [
        "#cartCount",
        ".cart-count",
        ".mobile-cart-count",
        "[data-cart-count]"
    ];

    selectors.forEach(selector => {

        $$(selector).forEach(element => {

            element.textContent = count;

        });

    });
}


function addToCart(productId) {

    const product = allProducts.find(
        item =>
            String(item.id) ===
            String(productId)
    );

    if (!product) return;


    const existing = cart.find(
        item =>
            String(item.id) ===
            String(product.id)
    );


    if (existing) {

        existing.quantity =
            Number(existing.quantity || 1) + 1;

    } else {

        cart.push({

            id: product.id,

            name: product.name,

            price: product.price,

            image: product.image || "",

            quantity: 1

        });

    }


    saveCart();

    updateCartCount();

    showMessage(
        "محصول به سبد خرید اضافه شد"
    );
}


function removeFromCart(productId) {

    cart = cart.filter(
        item =>
            String(item.id) !==
            String(productId)
    );

    saveCart();

    updateCartCount();
}


function changeCartQuantity(
    productId,
    change
) {

    const item = cart.find(
        product =>
            String(product.id) ===
            String(productId)
    );

    if (!item) return;


    item.quantity =
        Number(item.quantity || 1) +
        Number(change);


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
        id =>
            String(id) ===
            String(productId)
    );
}


function toggleFavorite(productId) {

    const index =
        favorites.findIndex(
            id =>
                String(id) ===
                String(productId)
        );


    if (index >= 0) {

        favorites.splice(index, 1);

        showMessage(
            "از علاقه‌مندی‌ها حذف شد"
        );

    } else {

        favorites.push(productId);

        showMessage(
            "به علاقه‌مندی‌ها اضافه شد"
        );

    }


    saveFavorites();

    renderProducts();
}


/* =========================================================
   LOAD PRODUCTS
========================================================= */

async function loadProducts() {

    const container =
        $("#productsContainer") ||
        $(".products-grid") ||
        $(".product-grid") ||
        document.querySelector(
            "[data-products]"
        );


    if (!container) {

        console.warn(
            "Nova: products container not found."
        );

        return;
    }


    container.innerHTML = `
        <div class="products-loading">
            در حال دریافت محصولات...
        </div>
    `;


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

            console.error(
                "Nova Supabase Error:",
                error
            );

            showProductsError(
                container,
                error
            );

            return;
        }


        allProducts =
            Array.isArray(data)
                ? data
                : [];


        filteredProducts =
            [...allProducts];


        renderCategories();

        filterProducts();

    } catch (error) {

        console.error(
            "Nova Unexpected Error:",
            error
        );

        showProductsError(
            container,
            error
        );
    }
}


/* =========================================================
   PRODUCTS ERROR
========================================================= */

function showProductsError(
    container,
    error
) {

    container.innerHTML = `
        <div class="products-error">

            <div class="error-icon">
                ⚠️
            </div>

            <strong>
                خطا در دریافت محصولات
            </strong>

            <p>
                اتصال به فروشگاه انجام نشد.
            </p>

            <button
                type="button"
                onclick="loadProducts()"
            >
                تلاش مجدد
            </button>

        </div>
    `;

    console.error(
        "Nova error message:",
        error?.message
    );
}


/* =========================================================
   FILTER PRODUCTS
========================================================= */

function filterProducts() {

    const normalizedSearch =
        searchTerm
            .trim()
            .toLowerCase();


    filteredProducts =
        allProducts.filter(product => {

            const productCategory =
                String(
                    product.category || ""
                ).trim();


            const categoryMatch =
                currentCategory === "all" ||
                productCategory ===
                    currentCategory;


            const searchableText =
                `
                ${product.name || ""}
                ${product.description || ""}
                ${product.category || ""}
                `
                .toLowerCase();


            const searchMatch =
                !normalizedSearch ||
                searchableText.includes(
                    normalizedSearch
                );


            return (
                categoryMatch &&
                searchMatch
            );
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
        document.querySelector(
            "[data-products]"
        );


    if (!container) return;


    if (!filteredProducts.length) {

        container.innerHTML = `
            <div class="products-empty">

                <div class="empty-icon">
                    🛍️
                </div>

                <strong>
                    محصولی پیدا نشد
                </strong>

                <p>
                    دسته‌بندی یا عبارت جستجو را تغییر دهید.
                </p>

            </div>
        `;

        return;
    }


    container.innerHTML =
        filteredProducts
            .map(product => {

                const favorite =
                    isFavorite(product.id);


                /* -------------------------
                   IMAGE
                ------------------------- */

                const hasImage =
                    product.image &&
                    String(
                        product.image
                    ).trim() !== "";


                const imageHTML =
                    hasImage

                        ? `
                            <img
                                src="${escapeHTML(product.image)}"
                                alt="${escapeHTML(
                                    product.name ||
                                    "محصول"
                                )}"
                                loading="lazy"
                                onerror="
                                    this.style.display='none';
                                    this.parentElement.classList.add('no-image');
                                "
                            >
                          `

                        : `
                            <div class="product-placeholder">
                                🛍️
                            </div>
                          `;


                /* -------------------------
                   DISCOUNT
                ------------------------- */

                let discountHTML = "";


                if (
                    product.discount !== null &&
                    product.discount !== undefined &&
                    product.discount !== ""
                ) {

                    discountHTML = `
                        <span class="discount-badge">
                            ${escapeHTML(
                                product.discount
                            )}٪ تخفیف
                        </span>
                    `;

                }


                /* -------------------------
                   NEW
                ------------------------- */

                const newHTML =
                    product.is_new

                        ? `
                            <span class="new-badge">
                                جدید
                            </span>
                          `

                        : "";


                /* -------------------------
                   OLD PRICE
                ------------------------- */

                let oldPriceHTML = "";


                if (
                    product.old_price !== null &&
                    product.old_price !== undefined &&
                    product.old_price !== "" &&
                    Number(product.old_price) >
                        Number(product.price || 0)
                ) {

                    oldPriceHTML = `
                        <span class="old-price">
                            ${formatPrice(
                                product.old_price
                            )}
                        </span>
                    `;
                }


                /* -------------------------
                   DESCRIPTION
                ------------------------- */

                const descriptionHTML =
                    product.description

                        ? `
                            <p class="product-description">
                                ${escapeHTML(
                                    product.description
                                )}
                            </p>
                          `

                        : `
                            <p class="product-description empty-description">
                                توضیحات محصول
                            </p>
                          `;


                /* -------------------------
                   CARD
                ------------------------- */

                return `
                    <article
                        class="product-card"
                        data-product-id="${escapeHTML(
                            product.id
                        )}"
                    >

                        <div class="product-image">

                            ${imageHTML}


                            <div class="product-badges">

                                ${discountHTML}

                                ${newHTML}

                            </div>


                            <button
                                class="
                                    favorite-btn
                                    ${
                                        favorite
                                            ? "active"
                                            : ""
                                    }
                                "
                                type="button"
                                onclick="
                                    toggleFavorite(
                                        '${escapeHTML(
                                            product.id
                                        )}'
                                    )
                                "
                                aria-label="
                                    ${
                                        favorite
                                            ? "حذف از علاقه‌مندی‌ها"
                                            : "افزودن به علاقه‌مندی‌ها"
                                    }
                                "
                            >
                                ${
                                    favorite
                                        ? "♥"
                                        : "♡"
                                }
                            </button>

                        </div>


                        <div class="product-info">

                            <div class="product-category">
                                ${escapeHTML(
                                    product.category ||
                                    "محصول"
                                )}
                            </div>


                            <h3 class="product-title">
                                ${escapeHTML(
                                    product.name ||
                                    "محصول"
                                )}
                            </h3>


                            ${descriptionHTML}


                            <div class="product-price">

                                <div class="current-price">
                                    ${formatPrice(
                                        product.price
                                    )}
                                </div>

                                ${oldPriceHTML}

                            </div>


                            <button
                                class="add-to-cart"
                                type="button"
                                onclick="
                                    addToCart(
                                        '${escapeHTML(
                                            product.id
                                        )}'
                                    )
                                "
                            >
                                افزودن به سبد خرید
                            </button>

                        </div>

                    </article>
                `;

            })
            .join("");
}


/* =========================================================
   CATEGORY FILTER
========================================================= */

function renderCategories() {

    const cards =
        $$(".category-card");


    if (!cards.length) return;


    cards.forEach(card => {

        const title =
            card.querySelector(
                ".category-info h3"
            );


        if (!title) return;


        const categoryName =
            title.textContent.trim();


        card.dataset.category =
            categoryName;


        /*
         * جلوگیری از چند بار ثبت شدن event
         */

        card.onclick = () => {

            currentCategory =
                categoryName;


            cards.forEach(item => {

                item.classList.remove(
                    "active"
                );

            });


            card.classList.add(
                "active"
            );


            filterProducts();


            const productsSection =
                $("#products") ||
                $(".products-section");


            if (productsSection) {

                productsSection.scrollIntoView({
                    behavior: "smooth",
                    block: "start"
                });

            }

        };

    });


    /*
     * حالت «همه»
     *
     * اگر دکمه/کارت مخصوص همه در HTML وجود داشته باشد.
     */

    $$(
        '[data-category="all"]'
    ).forEach(button => {

        button.onclick = () => {

            currentCategory =
                "all";


            cards.forEach(item => {

                item.classList.remove(
                    "active"
                );

            });


            button.classList.add(
                "active"
            );


            filterProducts();

        };

    });
}


/* =========================================================
   SEARCH
========================================================= */

function setupSearch() {

    const input =
        $("#searchInput") ||
        $(".search-input") ||
        document.querySelector(
            "[data-search]"
        );


    if (!input) return;


    input.addEventListener(
        "input",
        event => {

            searchTerm =
                event.target.value.trim();


            filterProducts();

        }
    );
}


/* =========================================================
   VIEW ALL
========================================================= */

function setupViewAll() {

    $$(
        ".view-all, [data-view-all]"
    ).forEach(button => {

        button.addEventListener(
            "click",
            event => {

                event.preventDefault();


                currentCategory =
                    "all";


                searchTerm =
                    "";


                const input =
                    $("#searchInput") ||
                    $(".search-input") ||
                    document.querySelector(
                        "[data-search]"
                    );


                if (input) {

                    input.value = "";

                }


                $$(
                    ".category-card"
                ).forEach(card => {

                    card.classList.remove(
                        "active"
                    );

                });


                $$(
                    '[data-category="all"]'
                ).forEach(button => {

                    button.classList.add(
                        "active"
                    );

                });


                filterProducts();


                const productsSection =
                    $("#products") ||
                    $(".products-section");


                if (productsSection) {

                    productsSection.scrollIntoView({
                        behavior: "smooth"
                    });

                }

            }
        );

    });
}


/* =========================================================
   MESSAGE
========================================================= */

function showMessage(message) {

    let element =
        $("#novaMessage");


    if (!element) {

        element =
            document.createElement(
                "div"
            );


        element.id =
            "novaMessage";


        element.className =
            "nova-message";


        document.body.appendChild(
            element
        );

    }


    element.textContent =
        message;


    element.classList.add(
        "show"
    );


    clearTimeout(
        element._timer
    );


    element._timer =
        setTimeout(() => {

            element.classList.remove(
                "show"
            );

        }, 2200);
}


/* =========================================================
   HERO SLIDER
========================================================= */

function setupHeroSlider() {

    const slides =
        $$(".hero-slide");


    const dots =
        $$(".hero-dot, .slider-dot");


    if (!slides.length) return;


    function showSlide(index) {

        currentSlide =
            (
                index +
                slides.length
            ) %
            slides.length;


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


    function nextSlide() {

        showSlide(
            currentSlide + 1
        );

    }


    function previousSlide() {

        showSlide(
            currentSlide - 1
        );

    }


    const nextButton =
        $(".hero-next") ||
        $(".slider-next") ||
        $("[data-slider-next]");


    const prevButton =
        $(".hero-prev") ||
        $(".slider-prev") ||
        $("[data-slider-prev]");


    if (nextButton) {

        nextButton.addEventListener(
            "click",
            nextSlide
        );

    }


    if (prevButton) {

        prevButton.addEventListener(
            "click",
            previousSlide
        );

    }


    dots.forEach(
        (dot, index) => {

            dot.addEventListener(
                "click",
                () => {

                    showSlide(index);

                }
            );

        }
    );


    function startAutoPlay() {

        clearInterval(
            slideTimer
        );


        slideTimer =
            setInterval(
                () => {

                    nextSlide();

                },
                5000
            );

    }


    const hero =
        $(".hero-slider") ||
        $(".hero");


    if (hero) {

        hero.addEventListener(
            "mouseenter",
            () => {

                clearInterval(
                    slideTimer
                );

            }
        );


        hero.addEventListener(
            "mouseleave",
            () => {

                startAutoPlay();

            }
        );

    }


    let touchStartX = 0;


    if (hero) {

        hero.addEventListener(
            "touchstart",
            event => {

                touchStartX =
                    event.touches[0]
                        .clientX;

            },
            {
                passive: true
            }
        );


        hero.addEventListener(
            "touchend",
            event => {

                const touchEndX =
                    event.changedTouches[0]
                        .clientX;


                const difference =
                    touchStartX -
                    touchEndX;


                if (
                    Math.abs(
                        difference
                    ) > 50
                ) {

                    if (
                        difference > 0
                    ) {

                        nextSlide();

                    } else {

                        previousSlide();

                    }

                }

            },
            {
                passive: true
            }
        );

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


    if (
        !menuButton ||
        !menu
    ) {
        return;
    }


    menuButton.addEventListener(
        "click",
        () => {

            menu.classList.toggle(
                "active"
            );

            menuButton.classList.toggle(
                "active"
            );

        }
    );
}


/* =========================================================
   ACCOUNT / SHOP BUTTONS
========================================================= */

function setupButtons() {

    $$(
        "[data-account]"
    ).forEach(button => {

        button.addEventListener(
            "click",
            () => {

                const account =
                    $("#account") ||
                    $(".account-section");


                if (account) {

                    account.scrollIntoView({
                        behavior: "smooth"
                    });

                }

            }
        );

    });


    $$(
        "[data-shop]"
    ).forEach(button => {

        button.addEventListener(
            "click",
            () => {

                const products =
                    $("#products") ||
                    $(".products-section");


                if (products) {

                    products.scrollIntoView({
                        behavior: "smooth"
                    });

                }

            }
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

            if (
                event.key === "/" &&
                document.activeElement.tagName !==
                    "INPUT" &&
                document.activeElement.tagName !==
                    "TEXTAREA"
            ) {

                event.preventDefault();


                const search =
                    $("#searchInput") ||
                    $(".search-input") ||
                    document.querySelector(
                        "[data-search]"
                    );


                if (search) {

                    search.focus();

                }

            }


            if (
                event.key ===
                "Escape"
            ) {

                const menu =
                    $(".mobile-menu") ||
                    $(".mobile-nav") ||
                    $("[data-mobile-nav]");


                if (menu) {

                    menu.classList.remove(
                        "active"
                    );

                }

            }

        }
    );
}


/* =========================================================
   REALTIME
========================================================= */

function setupRealtime() {

    supabaseClient
        .channel(
            "nova-products-channel"
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
}


/* =========================================================
   MOBILE PRODUCT SWIPE
========================================================= */

function setupProductSwipe() {

    const grid =
        $(".products-grid");


    if (!grid) return;


    let startX = 0;


    grid.addEventListener(
        "touchstart",
        event => {

            startX =
                event.touches[0]
                    .clientX;

        },
        {
            passive: true
        }
    );


    grid.addEventListener(
        "touchend",
        event => {

            const endX =
                event.changedTouches[0]
                    .clientX;


            const difference =
                startX - endX;


            if (
                Math.abs(
                    difference
                ) < 40
            ) {
                return;
            }


            const card =
                grid.querySelector(
                    ".product-card"
                );


            if (!card) return;


            const distance =
                card.offsetWidth + 12;


            grid.scrollBy({

                left:
                    difference > 0
                        ? distance
                        : -distance,

                behavior: "smooth"

            });

        },
        {
            passive: true
        }
    );
}


/* =========================================================
   INITIALIZE
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    async () => {

        updateCartCount();

        setupSearch();

        setupViewAll();

        setupHeroSlider();

        setupMobileMenu();

        setupButtons();

        setupKeyboard();

        setupProductSwipe();

        await loadProducts();

        setupRealtime();

    }
);
