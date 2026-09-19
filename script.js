let cart = [];

function addToCart(productName) {

    cart.push(productName);

    document.getElementById("cart-count").textContent = cart.length;

    alert("✅ " + productName + " به سبد خرید اضافه شد");
}


function openCart() {

    const modal = document.getElementById("cart-modal");
    const items = document.getElementById("cart-items");

    modal.style.display = "flex";

    if (cart.length === 0) {

        items.innerHTML = "<p>سبد خرید خالی است.</p>";

        return;
    }

    items.innerHTML = "";

    cart.forEach(function(product) {

        const item = document.createElement("p");

        item.textContent = "🛍️ " + product;

        item.style.padding = "10px";
        item.style.borderBottom = "1px solid #eee";

        items.appendChild(item);

    });
}


function closeCart() {

    document.getElementById("cart-modal").style.display = "none";

}


function searchProducts() {

    const search =
        document.getElementById("search").value.toLowerCase();

    const products =
        document.querySelectorAll(".product");

    products.forEach(function(product) {

        const text =
            product.textContent.toLowerCase();

        if (text.includes(search)) {

            product.style.display = "block";

        } else {

            product.style.display = "none";

        }

    });
}