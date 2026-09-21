/* =========================================================
   NAVA STORE
   Main JavaScript
========================================================= */

document.addEventListener("DOMContentLoaded", () => {

    /* =====================================================
       GLOBAL ELEMENTS
    ====================================================== */

    const body = document.body;

    const toast = document.getElementById("toast");

    const searchForm = document.querySelector(".search-form");
    const searchInput = document.getElementById("searchInput");

    const productsSection = document.getElementById("products");

    const productCards = document.querySelectorAll(".product-card");

    const cartButtons = document.querySelectorAll(
        ".cart-button, .add-to-cart"
    );

    const favoriteButtons = document.querySelectorAll(
        ".favorite-button"
    );


    /* =====================================================
       CART
    ====================================================== */

    let cartCount = 3;

    const cartCountDesktop = document.querySelector(".cart-count");
    const cartCountMobile = document.querySelector(".mobile-cart-count");


    function updateCartCount() {

        if (cartCountDesktop) {
            cartCountDesktop.textContent = cartCount;
        }

        if (cartCountMobile) {
            cartCountMobile.textContent = cartCount;
        }
    }


    function showToast(message) {

        if (!toast) return;

        toast.textContent = message;

        toast.classList.add("show");

        clearTimeout(window.toastTimer);

        window.toastTimer = setTimeout(() => {

            toast.classList.remove("show");

        }, 2200);
    }


    /* =====================================================
       ADD TO CART
    ====================================================== */

    document.querySelectorAll(".add-to-cart").forEach(button => {

        button.addEventListener("click", function () {

            cartCount++;

            updateCartCount();

            showToast("محصول با موفقیت به سبد خرید اضافه شد ✓");

            const originalText = this.childNodes[0];

            this.style.transform = "scale(0.97)";

            setTimeout(() => {
                this.style.transform = "";
            }, 120);

        });

    });


    /* =====================================================
       CART BUTTON
    ====================================================== */

    document.querySelectorAll(".cart-button").forEach(button => {

        button.addEventListener("click", event => {

            event.preventDefault();

            showToast(
                `سبد خرید شما ${cartCount} محصول دارد 🛒`
            );

        });

    });


    /* =====================================================
       FAVORITES
    ====================================================== */

    favoriteButtons.forEach(button => {

        button.dataset.favorite = "false";

        button.addEventListener("click", function () {

            const isFavorite =
                this.dataset.favorite === "true";

            if (isFavorite) {

                this.dataset.favorite = "false";

                this.textContent = "♡";

                this.style.color = "";

                showToast(
                    "محصول از علاقه‌مندی‌ها حذف شد"
                );

            } else {

                this.dataset.favorite = "true";

                this.textContent = "♥";

                this.style.color = "#f04462";

                showToast(
                    "محصول به علاقه‌مندی‌ها اضافه شد ❤️"
                );

            }

        });

    });


    /* =====================================================
       SEARCH
    ====================================================== */

    if (searchForm && searchInput) {

        searchForm.addEventListener("submit", event => {

            event.preventDefault();

            const searchValue =
                searchInput.value.trim().toLowerCase();

            if (!searchValue) {

                showToast(
                    "لطفاً نام محصول را وارد کنید"
                );

                searchInput.focus();

                return;
            }


            let foundProducts = 0;


            productCards.forEach(card => {

                const title =
                    card.querySelector("h3");

                if (!title) return;

                const productName =
                    title.textContent
                        .trim()
                        .toLowerCase();


                if (
                    productName.includes(searchValue)
                ) {

                    card.style.display = "";

                    foundProducts++;

                } else {

                    card.style.display = "none";

                }

            });


            productsSection?.scrollIntoView({
                behavior: "smooth",
                block: "start"
            });


            if (foundProducts > 0) {

                showToast(
                    `${foundProducts} محصول پیدا شد ✓`
                );

            } else {

                showToast(
                    "محصولی با این نام پیدا نشد"
                );

            }

        });


        /* Clear search */

        searchInput.addEventListener(
            "input",
            function () {

                if (this.value.trim() === "") {

                    productCards.forEach(card => {

                        card.style.display = "";

                    });

                }

            }
        );

    }


    /* =====================================================
       CATEGORY BUTTONS
    ====================================================== */

    const categoryCards =
        document.querySelectorAll(".category-card");


    categoryCards.forEach(category => {

        category.addEventListener("click", event => {

            event.preventDefault();

            const categoryName =
                category.querySelector("h3")?.textContent.trim();

            if (!categoryName) return;


            if (
                categoryName.includes("تخفیف")
            ) {

                showToast(
                    "محصولات تخفیف‌دار در حال نمایش هستند 🔥"
                );

                productsSection?.scrollIntoView({
                    behavior: "smooth",
                    block: "start"
                });

                return;
            }


            showToast(
                `دسته «${categoryName}» انتخاب شد`
            );

        });

    });


    /* =====================================================
       VIEW ALL BUTTONS
    ====================================================== */

    document.querySelectorAll(".view-all").forEach(link => {

        link.addEventListener("click", event => {

            event.preventDefault();

            productsSection?.scrollIntoView({
                behavior: "smooth",
                block: "start"
            });

        });

    });


    /* =====================================================
       HERO SLIDER
    ====================================================== */

    const heroSlides =
        document.querySelectorAll(".hero-slide");

    const sliderDots =
        document.querySelectorAll(".slider-dot");

    const prevButton =
        document.querySelector(".slider-prev");

    const nextButton =
        document.querySelector(".slider-next");


    let currentSlide = 0;

    let sliderTimer;


    function showSlide(index) {

        if (!heroSlides.length) return;


        if (index >= heroSlides.length) {
            currentSlide = 0;
        }

        else if (index < 0) {
            currentSlide =
                heroSlides.length - 1;
        }

        else {
            currentSlide = index;
        }


        heroSlides.forEach((slide, i) => {

            if (i === currentSlide) {

                slide.style.display = "grid";

                slide.classList.add("active");

            } else {

                slide.style.display = "none";

                slide.classList.remove("active");

            }

        });


        sliderDots.forEach((dot, i) => {

            dot.classList.toggle(
                "active",
                i === currentSlide
            );

        });

    }


    function nextSlide() {

        showSlide(currentSlide + 1);

        restartSlider();

    }


    function previousSlide() {

        showSlide(currentSlide - 1);

        restartSlider();

    }


    function startSlider() {

        if (heroSlides.length <= 1) return;

        sliderTimer = setInterval(() => {

            showSlide(currentSlide + 1);

        }, 5000);

    }


    function restartSlider() {

        clearInterval(sliderTimer);

        startSlider();

    }


    if (heroSlides.length) {

        showSlide(0);

        startSlider();

    }


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


    sliderDots.forEach((dot, index) => {

        dot.addEventListener("click", () => {

            showSlide(index);

            restartSlider();

        });

    });


    /* =====================================================
       TOUCH / SWIPE SLIDER
    ====================================================== */

    const heroSlider =
        document.querySelector(".hero-slider");


    let touchStartX = 0;
    let touchEndX = 0;


    if (heroSlider) {

        heroSlider.addEventListener(
            "touchstart",
            event => {

                touchStartX =
                    event.changedTouches[0].screenX;

            },
            { passive: true }
        );


        heroSlider.addEventListener(
            "touchend",
            event => {

                touchEndX =
                    event.changedTouches[0].screenX;

                handleSwipe();

            },
            { passive: true }
        );

    }


    function handleSwipe() {

        const distance =
            touchEndX - touchStartX;


        if (Math.abs(distance) < 50) {
            return;
        }


        /*
           چون صفحه RTL است:
           حرکت انگشت به چپ = اسلاید بعدی
           حرکت انگشت به راست = اسلاید قبلی
        */

        if (distance < 0) {

            nextSlide();

        } else {

            previousSlide();

        }

    }


    /* =====================================================
       PAUSE SLIDER ON HOVER
    ====================================================== */

    if (heroSlider) {

        heroSlider.addEventListener(
            "mouseenter",
            () => {

                clearInterval(sliderTimer);

            }
        );


        heroSlider.addEventListener(
            "mouseleave",
            () => {

                startSlider();

            }
        );

    }


    /* =====================================================
       MOBILE NAVIGATION
    ====================================================== */

    const mobileNavItems =
        document.querySelectorAll(".mobile-nav-item");


    mobileNavItems.forEach(item => {

        item.addEventListener("click", event => {

            event.preventDefault();


            mobileNavItems.forEach(nav => {

                nav.classList.remove("active");

            });


            item.classList.add("active");


            const text =
                item.querySelector("span")?.textContent.trim();


            if (!text) return;


            if (text === "خانه") {

                window.scrollTo({
                    top: 0,
                    behavior: "smooth"
                });

                return;
            }


            if (text === "سبد خرید") {

                showToast(
                    `سبد خرید شما ${cartCount} محصول دارد 🛒`
                );

                return;
            }


            if (text === "علاقه‌مندی‌ها") {

                showToast(
                    "محصولات مورد علاقه شما ❤️"
                );

                return;
            }


            if (text === "دسته‌بندی‌ها") {

                document
                    .querySelector(".categories-section")
                    ?.scrollIntoView({
                        behavior: "smooth"
                    });

                return;
            }


            if (text === "پروفایل") {

                showToast(
                    "صفحه ورود و پروفایل به‌زودی فعال می‌شود"
                );

            }

        });

    });


    /* =====================================================
       ACCOUNT
    ====================================================== */

    const accountLink =
        document.querySelector(".account-link");


    if (accountLink) {

        accountLink.addEventListener(
            "click",
            event => {

                event.preventDefault();

                showToast(
                    "صفحه ورود و ثبت‌نام به‌زودی فعال می‌شود"
                );

            }
        );

    }


    /* =====================================================
       HERO PRIMARY BUTTON
    ====================================================== */

    const heroButton =
        document.querySelector(".primary-button");


    if (heroButton) {

        heroButton.addEventListener(
            "click",
            event => {

                event.preventDefault();

                productsSection?.scrollIntoView({
                    behavior: "smooth",
                    block: "start"
                });

            }
        );

    }


    /* =====================================================
       HEADER SHOP BUTTON
    ====================================================== */

    const shopButton =
        document.querySelector(".header-shop-button");


    if (shopButton) {

        shopButton.addEventListener(
            "click",
            event => {

                event.preventDefault();

                productsSection?.scrollIntoView({
                    behavior: "smooth",
                    block: "start"
                });

            }
        );

    }


    /* =====================================================
       KEYBOARD SHORTCUT
    ====================================================== */

    document.addEventListener(
        "keydown",
        event => {

            /*
             Ctrl + K
             focus search
            */

            if (
                (event.ctrlKey || event.metaKey) &&
                event.key.toLowerCase() === "k"
            ) {

                event.preventDefault();

                searchInput?.focus();

            }


            /*
             Escape
             clear search
            */

            if (event.key === "Escape") {

                if (searchInput) {

                    searchInput.value = "";

                    productCards.forEach(card => {

                        card.style.display = "";

                    });

                }

            }

        }
    );


    /* =====================================================
       IMAGE / PRODUCT HOVER
    ====================================================== */

    productCards.forEach(card => {

        card.addEventListener(
            "mouseenter",
            () => {

                card.classList.add("is-hovered");

            }
        );


        card.addEventListener(
            "mouseleave",
            () => {

                card.classList.remove("is-hovered");

            }
        );

    });


    /* =====================================================
       UPDATE INITIAL CART
    ====================================================== */

    updateCartCount();


    /* =====================================================
       PAGE LOADED
    ====================================================== */

    body.classList.add("page-ready");

});
