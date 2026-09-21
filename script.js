/* =====================================================
   NOVA STORE - SCRIPT.JS
===================================================== */

document.addEventListener("DOMContentLoaded", function () {

  /* =====================================================
     SLIDER
  ===================================================== */

  const slides = document.querySelectorAll(".hero-slide");
  const dots = document.querySelectorAll(".slider-dots .dot");

  const nextButton = document.getElementById("nextSlide");
  const prevButton = document.getElementById("prevSlide");

  let currentSlide = 0;
  let sliderTimer;


  /* نمایش اسلاید */

  function showSlide(index) {

    if (slides.length === 0) {
      return;
    }

    if (index >= slides.length) {
      index = 0;
    }

    if (index < 0) {
      index = slides.length - 1;
    }

    currentSlide = index;


    /* حذف active از همه اسلایدها */

    slides.forEach(function (slide) {
      slide.classList.remove("active");
    });


    /* حذف active از نقطه‌ها */

    dots.forEach(function (dot) {
      dot.classList.remove("active");
    });


    /* فعال کردن اسلاید */

    slides[currentSlide].classList.add("active");


    /* فعال کردن نقطه */

    if (dots[currentSlide]) {
      dots[currentSlide].classList.add("active");
    }

  }


  /* اسلاید بعدی */

  function nextSlide() {
    showSlide(currentSlide + 1);
    restartSlider();
  }


  /* اسلاید قبلی */

  function previousSlide() {
    showSlide(currentSlide - 1);
    restartSlider();
  }


  /* تایمر اسلایدر */

  function startSlider() {

    clearInterval(sliderTimer);

    sliderTimer = setInterval(function () {

      showSlide(currentSlide + 1);

    }, 5000);

  }


  /* شروع دوباره تایمر */

  function restartSlider() {

    clearInterval(sliderTimer);

    startSlider();

  }


  /* دکمه بعدی */

  if (nextButton) {

    nextButton.addEventListener("click", function () {

      nextSlide();

    });

  }


  /* دکمه قبلی */

  if (prevButton) {

    prevButton.addEventListener("click", function () {

      previousSlide();

    });

  }


  /* کلیک روی نقطه‌ها */

  dots.forEach(function (dot, index) {

    dot.addEventListener("click", function () {

      showSlide(index);

      restartSlider();

    });

  });


  /* شروع اسلایدر */

  if (slides.length > 0) {

    showSlide(0);

    startSlider();

  }



  /* =====================================================
     توقف اسلایدر هنگام نگه داشتن موس
  ===================================================== */

  const heroSlider = document.getElementById("heroSlider");

  if (heroSlider) {

    heroSlider.addEventListener("mouseenter", function () {

      clearInterval(sliderTimer);

    });


    heroSlider.addEventListener("mouseleave", function () {

      startSlider();

    });

  }



  /* =====================================================
     SWIPE برای موبایل
  ===================================================== */

  let touchStartX = 0;
  let touchEndX = 0;


  if (heroSlider) {

    heroSlider.addEventListener(
      "touchstart",
      function (event) {

        touchStartX = event.changedTouches[0].screenX;

      },
      { passive: true }
    );


    heroSlider.addEventListener(
      "touchend",
      function (event) {

        touchEndX = event.changedTouches[0].screenX;

        handleSwipe();

      },
      { passive: true }
    );

  }


  function handleSwipe() {

    const distance = touchEndX - touchStartX;

    if (Math.abs(distance) < 50) {
      return;
    }


    /* در RTL جهت مناسب اسلایدر */

    if (distance > 0) {

      previousSlide();

    } else {

      nextSlide();

    }

  }



  /* =====================================================
     SHOPPING CART
  ===================================================== */

  const cartCount = document.getElementById("cartCount");

  const addCartButtons = document.querySelectorAll(".add-cart");

  let cartItems = 0;


  /* گرفتن تعداد قبلی از حافظه مرورگر */

  const savedCart = localStorage.getItem("novaCartCount");

  if (savedCart !== null) {

    cartItems = parseInt(savedCart, 10);

    if (isNaN(cartItems)) {
      cartItems = 0;
    }

  }


  /* نمایش تعداد سبد */

  function updateCart() {

    if (cartCount) {

      cartCount.textContent = cartItems;

      if (cartItems > 0) {

        cartCount.classList.add("has-items");

      } else {

        cartCount.classList.remove("has-items");

      }

    }


    localStorage.setItem(
      "novaCartCount",
      cartItems
    );

  }


  updateCart();


  /* افزودن محصول */

  addCartButtons.forEach(function (button) {

    button.addEventListener("click", function () {

      cartItems++;

      updateCart();


      /* متن اصلی دکمه */

      const originalText = button.innerHTML;


      button.classList.add("added");

      button.innerHTML =
        '✓ اضافه شد';


      /* برگرداندن دکمه */

      setTimeout(function () {

        button.innerHTML = originalText;

        button.classList.remove("added");

      }, 1200);

    });

  });



  /* =====================================================
     HEART / FAVORITE
  ===================================================== */

  const heartButtons = document.querySelectorAll(".heart");


  heartButtons.forEach(function (button) {

    button.addEventListener("click", function () {

      button.classList.toggle("liked");


      const icon = button.querySelector("i");

      if (!icon) {
        return;
      }


      if (button.classList.contains("liked")) {

        icon.classList.remove("fa-regular");

        icon.classList.add("fa-solid");

      } else {

        icon.classList.remove("fa-solid");

        icon.classList.add("fa-regular");

      }

    });

  });



  /* =====================================================
     SEARCH
  ===================================================== */

  const searchInput = document.querySelector(
    ".search-box input"
  );

  const productCards = document.querySelectorAll(
    ".product-card"
  );


  if (searchInput) {

    searchInput.addEventListener(
      "input",
      function () {

        const searchText =
          searchInput.value
            .trim()
            .toLowerCase();


        productCards.forEach(function (product) {

          const productName =
            product
              .querySelector("h3")
              ?.textContent
              .toLowerCase() || "";


          if (
            searchText === "" ||
            productName.includes(searchText)
          ) {

            product.style.display = "";

          } else {

            product.style.display = "none";

          }

        });

      }
    );

  }



  /* =====================================================
     SEARCH با ENTER
  ===================================================== */

  if (searchInput) {

    searchInput.addEventListener(
      "keydown",
      function (event) {

        if (event.key === "Enter") {

          event.preventDefault();

          searchInput.blur();

        }

      }
    );

  }



  /* =====================================================
     SMOOTH SCROLL
  ===================================================== */

  const internalLinks = document.querySelectorAll(
    'a[href^="#"]'
  );


  internalLinks.forEach(function (link) {

    link.addEventListener("click", function (event) {

      const targetId =
        link.getAttribute("href");


      if (
        !targetId ||
        targetId === "#"
      ) {

        return;

      }


      const target =
        document.querySelector(targetId);


      if (target) {

        event.preventDefault();


        target.scrollIntoView({
          behavior: "smooth",
          block: "start"
        });

      }

    });

  });



  /* =====================================================
     HEADER هنگام اسکرول
  ===================================================== */

  const header =
    document.querySelector(".site-header");


  window.addEventListener(
    "scroll",
    function () {

      if (!header) {
        return;
      }


      if (window.scrollY > 30) {

        header.classList.add("scrolled");

      } else {

        header.classList.remove("scrolled");

      }

    },
    { passive: true }
  );



  /* =====================================================
     جلوگیری از کلیک خالی روی لینک‌های #
  ===================================================== */

  const emptyLinks =
    document.querySelectorAll('a[href="#"]');


  emptyLinks.forEach(function (link) {

    link.addEventListener("click", function (event) {

      event.preventDefault();

    });

  });



  /* =====================================================
     نمایش پیام ساده برای ورود / سبد
  ===================================================== */

  const loginButton =
    document.querySelector(".login");


  if (loginButton) {

    loginButton.addEventListener(
      "click",
      function (event) {

        event.preventDefault();

        alert(
          "بخش ورود و ثبت‌نام به‌زودی فعال می‌شود."
        );

      }
    );

  }



  /* =====================================================
     CART BUTTON
  ===================================================== */

  const cartButton =
    document.querySelector(".cart");


  if (cartButton) {

    cartButton.addEventListener(
      "click",
      function (event) {

        event.preventDefault();

        if (cartItems === 0) {

          alert(
            "سبد خرید شما خالی است."
          );

        } else {

          alert(
            "تعداد محصولات سبد خرید: " +
            cartItems
          );

        }

      }
    );

  }



  /* =====================================================
     LAZY LOAD IMAGES
  ===================================================== */

  const images =
    document.querySelectorAll("img");


  images.forEach(function (image) {

    image.loading = "lazy";

  });



  /* =====================================================
     فعال کردن لینک شبکه‌های اجتماعی
  ===================================================== */

  const socialLinks =
    document.querySelectorAll(
      ".social-links a"
    );


  socialLinks.forEach(function (link) {

    link.addEventListener(
      "click",
      function () {

        /*
          لینک‌های واقعی تلگرام،
          اینستاگرام و یوتیوب را
          بعداً می‌توانی جایگزین کنی.
        */

      }
    );

  });


  /* =====================================================
     پایان
  ===================================================== */

  console.log(
    "Nova Store - Website Loaded Successfully"
  );

});
