/* =====================================================
   NOVA STORE
   MAIN SCRIPT
===================================================== */


/* =====================================================
   SUPABASE
===================================================== */

let products = [];

let cart =
    JSON.parse(
        localStorage.getItem("novaCart") || "[]"
    );

let favorites =
    JSON.parse(
        localStorage.getItem("novaFavorites") || "[]"
    );

let currentCategory = "all";


/* =====================================================
   ELEMENTS
===================================================== */

const productsGrid =
    document.getElementById("productsGrid");

const searchInput =
    document.getElementById("searchInput");

const cartButton =
    document.getElementById("cartButton");

const favoritesButton =
    document.getElementById("favoritesButton");

const cartCount =
    document.getElementById("cartCount");

const favoriteCount =
    document.getElementById("favoriteCount");

const cartModal =
    document.getElementById("cartModal");

const favoritesModal =
    document.getElementById("favoritesModal");

const productModal =
    document.getElementById("productModal");

const cartItems =
    document.getElementById("cartItems");

const favoritesItems =
    document.getElementById("favoritesItems");

const cartTotal =
    document.getElementById("cartTotal");

const mobileMenu =
    document.getElementById("mobileMenu");

const menuButton =
    document.getElementById("menuButton");

const showAllButton =
    document.getElementById("showAllProducts");

const toast =
    document.getElementById("toast");


/* =====================================================
   LOAD PRODUCTS
===================================================== */

async function loadProducts() {

    if (!productsGrid) return;

    productsGrid.innerHTML = `
        <div class="loading">

            <div class="spinner"></div>

            <p>
                در حال دریافت محصولات...
            </p>

        </div>
    `;


    try {

        const { data, error } =
            await window.supabaseClient
                .from("products")
                .select("*")
                .order(
                    "created_at",
                    {
                        ascending: false
                    }
                );


        if (error) {
            throw error;
        }


        products = data || [];


        renderProducts(products);

        updateCounts();

    }

    catch (error) {

        console.error(error);

        productsGrid.innerHTML = `
            <div class="loading">

                <strong>
                    دریافت محصولات انجام نشد
                </strong>

                <p>
                    صفحه را دوباره باز کنید.
                </p>

            </div>
        `;
    }
}


/* =====================================================
   RENDER PRODUCTS
===================================================== */

function renderProducts(list) {

    if (!productsGrid) return;


    if (!list || !list.length) {

        productsGrid.innerHTML = `
            <div class="loading">

                <strong>
                    محصولی پیدا نشد
                </strong>

                <p>
                    محصول دیگری را امتحان کنید.
                </p>

            </div>
        `;

        return;
    }


    productsGrid.innerHTML =
        list.map(product => {

            const id =
                Number(product.id);

            const isFavorite =
                favorites.includes(id);


            const price =
                Number(product.price || 0);

            const oldPrice =
                Number(product.old_price || 0);


            return `

                <article class="product-card">


                    <!-- IMAGE -->

                    <div class="product-image-wrap">


                        <img
                            class="product-image"
                            src="${safeImage(product.image)}"
                            alt="${escapeHTML(product.name || "محصول")}"
                            loading="lazy"
                        >


                        <!-- BADGES -->

                        <div class="product-badges">

                            ${
                                product.is_new
                                ?
                                `
                                <span class="product-badge badge-new">
                                    جدید
                                </span>
                                `
                                :
                                ""
                            }


                            ${
                                product.discount
                                ?
                                `
                                <span class="product-badge badge-discount">
                                    ${escapeHTML(
                                        String(product.discount)
                                    )}
                                </span>
                                `
                                :
                                ""
                            }

                        </div>


                        <!-- FAVORITE -->

                        <button
                            class="
                                favorite-button
                                ${isFavorite ? "active" : ""}
                            "
                            onclick="toggleFavorite(${id})"
                            aria-label="علاقه‌مندی"
                        >
                            ${isFavorite ? "♥" : "♡"}
                        </button>

                    </div>



                    <!-- INFO -->

                    <div class="product-info">


                        <span class="product-category">
                            ${escapeHTML(
                                normalizeCategory(
                                    product.category
                                )
                            )}
                        </span>


                        <h3>
                            ${escapeHTML(
                                product.name ||
                                "محصول بدون نام"
                            )}
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
                                ${formatPrice(price)}
                                تومان
                            </strong>


                            ${
                                oldPrice > price
                                ?
                                `
                                <span class="old-price">
                                    ${formatPrice(oldPrice)}
                                    تومان
                                </span>
                                `
                                :
                                ""
                            }

                        </div>


                        <button
                            class="add-to-cart"
                            onclick="addToCart(${id})"
                        >
                            🛒
                            افزودن به سبد
                        </button>

                    </div>

                </article>

            `;

        }).join("");
}


/* =====================================================
   CATEGORY NORMALIZER
===================================================== */

function normalizeCategory(category) {

    const value =
        String(category || "")
            .trim()
            .toLowerCase();


    if (
        value.includes("دیجیتال") ||
        value.includes("گوشی") ||
        value.includes("موبایل") ||
        value.includes("کامپیوتر") ||
        value.includes("لپ تاپ") ||
        value.includes("لپ‌تاپ") ||
        value.includes("لپتاپ") ||
        value.includes("مانیتور") ||
        value.includes("تبلت")
    ) {

        return "دیجیتال";
    }


    return category || "سایر";
}


/* =====================================================
   CATEGORY FILTER
===================================================== */

function filterCategory(category) {

    currentCategory =
        category || "all";


    if (currentCategory === "all") {

        renderProducts(products);

        return;
    }


    let filtered =
        products.filter(product => {

            const original =
                String(
                    product.category || ""
                )
                .trim()
                .toLowerCase();


            const normalized =
                normalizeCategory(
                    product.category
                );


            if (category === "دیجیتال") {

                return (
                    normalized === "دیجیتال" ||
                    original.includes("دیجیتال") ||
                    original.includes("گوشی") ||
                    original.includes("موبایل") ||
                    original.includes("کامپیوتر") ||
                    original.includes("لپ") ||
                    original.includes("مانیتور") ||
                    original.includes("تبلت")
                );
            }


            return (
                normalized === category ||
                original ===
                String(category).toLowerCase()
            );

        });


    renderProducts(filtered);


    document
        .getElementById("products")
        ?.scrollIntoView({
            behavior: "smooth"
        });
}


/* =====================================================
   CATEGORY BUTTONS
===================================================== */

document
    .querySelectorAll(".category-card")
    .forEach(button => {

        button.addEventListener(
            "click",
            function() {

                const category =
                    this.dataset.category;

                filterCategory(category);

            }
        );

    });


/* =====================================================
   SHOW ALL
===================================================== */

showAllButton?.addEventListener(
    "click",
    function() {

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
);


/* =====================================================
   SEARCH
===================================================== */

searchInput?.addEventListener(
    "input",
    searchProducts
);


function searchProducts() {

    const query =
        String(
            searchInput?.value || ""
        )
        .trim()
        .toLowerCase();


    let result =
        [...products];


    if (
        currentCategory !== "all"
    ) {

        result =
            result.filter(product => {

                const category =
                    String(
                        product.category || ""
                    )
                    .toLowerCase();


                if (
                    currentCategory === "دیجیتال"
                ) {

                    return (
                        category.includes("دیجیتال") ||
                        category.includes("گوشی") ||
                        category.includes("موبایل") ||
                        category.includes("کامپیوتر") ||
                        category.includes("لپ") ||
                        category.includes("مانیتور") ||
                        category.includes("تبلت")
                    );
                }


                return (
                    category ===
                    currentCategory.toLowerCase()
                );
            });
    }


    if (query) {

        result =
            result.filter(product => {

                const name =
                    String(
                        product.name || ""
                    )
                    .toLowerCase();


                const description =
                    String(
                        product.description ||
                        ""
                    )
                    .toLowerCase();


                const category =
                    String(
                        product.category ||
                        ""
                    )
                    .toLowerCase();


                return (
                    name.includes(query) ||
                    description.includes(query) ||
                    category.includes(query)
                );

            });
    }


    renderProducts(result);
}


/* =====================================================
   FAVORITES
===================================================== */

function toggleFavorite(id) {

    id = Number(id);


    const index =
        favorites.indexOf(id);


    if (index === -1) {

        favorites.push(id);

        showToast(
            "❤️ به علاقه‌مندی‌ها اضافه شد"
        );

    }

    else {

        favorites.splice(index, 1);

        showToast(
            "از علاقه‌مندی‌ها حذف شد"
        );
    }


    localStorage.setItem(
        "novaFavorites",
        JSON.stringify(favorites)
    );


    updateCounts();


    searchProducts();


    if (
        favoritesModal?.classList.contains(
            "active"
        )
    ) {

        renderFavorites();
    }
}


/* =====================================================
   RENDER FAVORITES
===================================================== */

function renderFavorites() {

    if (!favoritesItems) return;


    const favoriteProducts =
        products.filter(product =>
            favorites.includes(
                Number(product.id)
            )
        );


    if (!favoriteProducts.length) {

        favoritesItems.innerHTML = `

            <div class="empty-box">

                <strong>
                    ❤️ هنوز محصولی ندارید
                </strong>

                محصولاتی که قلب می‌زنید
                اینجا نمایش داده می‌شوند.

            </div>

        `;

        return;
    }


    favoritesItems.innerHTML =
        favoriteProducts.map(product => {

            const id =
                Number(product.id);


            return `

                <div class="favorite-product">

                    <img
                        src="${safeImage(product.image)}"
                        alt="${escapeHTML(product.name || "")}"
                    >


                    <div class="favorite-product-info">

                        <strong>
                            ${escapeHTML(
                                product.name ||
                                "محصول"
                            )}
                        </strong>


                        <span>
                            ${formatPrice(
                                Number(
                                    product.price || 0
                                )
                            )}
                            تومان
                        </span>


                        <button
                            class="favorite-add"
                            onclick="addToCart(${id})"
                        >
                            افزودن به سبد
                        </button>

                    </div>

                </div>

            `;

        }).join("");
}


/* =====================================================
   CART
===================================================== */

function addToCart(id) {

    id = Number(id);


    const product =
        products.find(
            product =>
                Number(product.id) === id
        );


    if (!product) return;


    const existing =
        cart.find(
            item =>
                Number(item.id) === id
        );


    if (existing) {

        existing.quantity += 1;

    }

    else {

        cart.push({
            id: id,
            quantity: 1
        });

    }


    saveCart();

    updateCounts();

    showToast(
        "🛒 محصول به سبد خرید اضافه شد"
    );
}


/* =====================================================
   CHANGE QUANTITY
===================================================== */

function changeQuantity(id, amount) {

    id = Number(id);


    const item =
        cart.find(
            item =>
                Number(item.id) === id
        );


    if (!item) return;


    item.quantity += amount;


    if (item.quantity <= 0) {

        removeFromCart(id);

        return;
    }


    saveCart();

    updateCounts();

    renderCart();
}


/* =====================================================
   REMOVE CART
===================================================== */

function removeFromCart(id) {

    id = Number(id);


    cart =
        cart.filter(
            item =>
                Number(item.id) !== id
        );


    saveCart();

    updateCounts();

    renderCart();

    showToast(
        "محصول از سبد حذف شد"
    );
}


/* =====================================================
   SAVE CART
===================================================== */

function saveCart() {

    localStorage.setItem(
        "novaCart",
        JSON.stringify(cart)
    );
}


/* =====================================================
   RENDER CART
===================================================== */

function renderCart() {

    if (!cartItems) return;


    if (!cart.length) {

        cartItems.innerHTML = `

            <div class="empty-box">

                <strong>
                    🛒 سبد خرید خالی است
                </strong>

                هنوز محصولی به سبد
                اضافه نکرده‌اید.

            </div>

        `;


        if (cartTotal) {

            cartTotal.textContent =
                "۰ تومان";
        }

        return;
    }


    let total = 0;


    cartItems.innerHTML =
        cart.map(item => {

            const product =
                products.find(
                    product =>
                        Number(product.id) ===
                        Number(item.id)
                );


            if (!product) return "";


            const price =
                Number(
                    product.price || 0
                );


            const quantity =
                Number(
                    item.quantity || 1
                );


            total +=
                price * quantity;


            return `

                <div class="cart-item">


                    <img
                        class="cart-item-image"
                        src="${safeImage(product.image)}"
                        alt="${escapeHTML(product.name || "")}"
                    >


                    <div class="cart-item-info">

                        <strong>
                            ${escapeHTML(
                                product.name ||
                                "محصول"
                            )}
                        </strong>


                        <span class="cart-item-price">

                            ${formatPrice(price)}
                            تومان

                        </span>


                        <div class="quantity-control">

                            <button
                                onclick="changeQuantity(${product.id}, -1)"
                            >
                                −
                            </button>


                            <span class="quantity-number">
                                ${quantity}
                            </span>


                            <button
                                onclick="changeQuantity(${product.id}, 1)"
                            >
                                +
                            </button>

                        </div>

                    </div>


                    <button
                        class="remove-cart"
                        onclick="removeFromCart(${product.id})"
                        title="حذف"
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


/* =====================================================
   COUNTERS
===================================================== */

function updateCounts() {


    const cartNumber =
        cart.reduce(
            (total, item) =>
                total +
                Number(item.quantity || 0),
            0
        );


    if (cartCount) {

        cartCount.textContent =
            cartNumber;


        cartCount.style.display =
            cartNumber > 0
                ? "flex"
                : "none";
    }


    if (favoriteCount) {

        favoriteCount.textContent =
            favorites.length;


        favoriteCount.style.display =
            favorites.length > 0
                ? "flex"
                : "none";
    }
}


/* =====================================================
   CART BUTTON
===================================================== */

cartButton?.addEventListener(
    "click",
    function() {

        renderCart();

        openModal("cartModal");

    }
);


/* =====================================================
   FAVORITES BUTTON
===================================================== */

favoritesButton?.addEventListener(
    "click",
    function() {

        renderFavorites();

        openModal(
            "favoritesModal"
        );

    }
);


/* =====================================================
   MODALS
===================================================== */

function openModal(id) {

    const modal =
        document.getElementById(id);


    if (!modal) return;


    modal.classList.add("active");

    document.body.style.overflow =
        "hidden";
}


function closeModal(id) {

    const modal =
        document.getElementById(id);


    if (!modal) return;


    modal.classList.remove("active");


    if (
        !document.querySelector(
            ".modal.active"
        )
    ) {

        document.body.style.overflow =
            "";
    }
}


/* CLICK OUTSIDE */

document
    .querySelectorAll(".modal")
    .forEach(modal => {

        modal.addEventListener(
            "click",
            function(event) {

                if (
                    event.target === modal
                ) {

                    closeModal(
                        modal.id
                    );
                }

            }
        );

    });


/* ESC */

document.addEventListener(
    "keydown",
    function(event) {

        if (
            event.key !== "Escape"
        ) {
            return;
        }


        document
            .querySelectorAll(
                ".modal.active"
            )
            .forEach(modal => {

                closeModal(
                    modal.id
                );

            });

    }
);


/* =====================================================
   PRODUCT MODAL
===================================================== */

function openProduct(id) {

    id = Number(id);


    const product =
        products.find(
            product =>
                Number(product.id) === id
        );


    if (!product) return;


    const content =
        document.getElementById(
            "productModalContent"
        );


    if (!content) return;


    const price =
        Number(
            product.price || 0
        );


    content.innerHTML = `

        <img
            src="${safeImage(product.image)}"
            alt="${escapeHTML(product.name || "")}"
        >


        <div>

            <span class="product-category">
                ${escapeHTML(
                    normalizeCategory(
                        product.category
                    )
                )}
            </span>


            <h2
                style="
                    margin:8px 0 12px;
                    font-size:20px;
                "
            >
                ${escapeHTML(
                    product.name ||
                    "محصول"
                )}
            </h2>


            <p
                style="
                    color:#888;
                    font-size:12px;
                    line-height:2;
                    margin-bottom:18px;
                "
            >
                ${escapeHTML(
                    product.description ||
                    product.text ||
                    "توضیحی برای این محصول ثبت نشده است."
                )}
            </p>


            <div
                style="
                    color:#7047e8;
                    font-size:18px;
                    font-weight:bold;
                    margin-bottom:15px;
                "
            >
                ${formatPrice(price)}
                تومان
            </div>


            <button
                class="add-to-cart"
                style="height:45px"
                onclick="
                    addToCart(${id});
                    closeModal('productModal');
                "
            >
                🛒
                افزودن به سبد خرید
            </button>

        </div>

    `;


    openModal(
        "productModal"
    );
}


/* =====================================================
   HERO
===================================================== */

function scrollToProducts() {

    document
        .getElementById("products")
        ?.scrollIntoView({
            behavior: "smooth"
        });
}


/* =====================================================
   MOBILE MENU
===================================================== */

menuButton?.addEventListener(
    "click",
    function() {

        if (!mobileMenu) return;


        const opened =
            mobileMenu.style.display ===
            "block";


        mobileMenu.style.display =
            opened
                ? "none"
                : "block";
    }
);


document
    .querySelectorAll(
        ".mobile-menu a"
    )
    .forEach(link => {

        link.addEventListener(
            "click",
            function() {

                mobileMenu.style.display =
                    "none";

            }
        );

    });


/* =====================================================
   CHECKOUT
===================================================== */

function checkoutMessage() {

    if (!cart.length) {

        showToast(
            "سبد خرید شما خالی است"
        );

        return;
    }


    showToast(
        "فرایند پرداخت در مرحله بعد اضافه می‌شود"
    );
}


/* =====================================================
   TOAST
===================================================== */

function showToast(message) {

    if (!toast) return;


    toast.textContent =
        message;


    toast.classList.add(
        "show"
    );


    clearTimeout(
        window.novaToastTimer
    );


    window.novaToastTimer =
        setTimeout(
            function() {

                toast.classList.remove(
                    "show"
                );

            },
            2200
        );
}


/* =====================================================
   HELPERS
===================================================== */

function formatPrice(number) {

    return Number(
        number || 0
    ).toLocaleString(
        "fa-IR"
    );
}


function escapeHTML(value) {

    return String(
        value ?? ""
    )
    .replace(
        /&/g,
        "&amp;"
    )
    .replace(
        /</g,
        "&lt;"
    )
    .replace(
        />/g,
        "&gt;"
    )
    .replace(
        /"/g,
        "&quot;"
    )
    .replace(
        /'/g,
        "&#039;"
    );
}


function safeImage(image) {

    if (
        image &&
        typeof image === "string" &&
        image.trim()
    ) {

        return escapeHTML(
            image.trim()
        );
    }


    return "https://via.placeholder.com/600x600/f2f2f5/777?text=NOVA";
}


/* =====================================================
   CLEAN OLD CART ITEMS
===================================================== */

function cleanCart() {

    cart =
        cart.filter(item =>
            products.some(
                product =>
                    Number(product.id) ===
                    Number(item.id)
            )
        );


    saveCart();
}


/* =====================================================
   INITIALIZE
===================================================== */

async function initNovaStore() {

    updateCounts();

    await loadProducts();

    cleanCart();

    updateCounts();
}


initNovaStore();
