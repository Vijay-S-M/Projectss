// script.js

const API_URL = "http://127.0.0.1:8000";

let tables = [];
let foods = [];
let cart = [];
let selectedTable = null;
let selectedCategory = "ALL";

document.addEventListener("DOMContentLoaded", () => {
    loadTables();
    loadFoods();
});

async function loadTables() {
    try {
        const response = await fetch(`${API_URL}/tables`);

        if (!response.ok) {
            throw new Error("Failed to load tables");
        }

        tables = await response.json();
        renderTables();

    } catch (error) {
        console.error(error);

        document.getElementById("tablesContainer").innerHTML = `
            <div class="loading">
                ❌ Unable to load tables
            </div>
        `;
    }
}

function renderTables() {
    const container = document.getElementById("tablesContainer");

    container.innerHTML = "";

    tables.forEach(table => {
        const available = table.status === "AVAILABLE";

        const card = document.createElement("div");

        card.className =
            `table-card ${available ? "" : "occupied"}
             ${selectedTable?.id === table.id ? "selected" : ""}`;

        card.innerHTML = `
            <div class="table-icon">🪑</div>

            <div class="table-number">
                ${table.table_number}
            </div>

            <div class="table-state">
                ${available ? "AVAILABLE" : "OCCUPIED"}
            </div>
        `;

        if (available) {
            card.onclick = () => selectTable(table);
        }

        container.appendChild(card);
    });
}

function selectTable(table) {
    selectedTable = table;

    document.getElementById("selectedTableText").textContent =
        `Table ${table.table_number}`;

    document.querySelector(".status-dot").style.background =
        "#2e9d62";

    renderTables();

    showToast(`Table ${table.table_number} selected`);

    document.getElementById("menu").scrollIntoView({
        behavior: "smooth"
    });
}

async function loadFoods() {
    try {
        const response = await fetch(`${API_URL}/foods`);

        if (!response.ok) {
            throw new Error("Failed to load foods");
        }

        foods = await response.json();

        renderFoods();

    } catch (error) {
        console.error(error);

        document.getElementById("foodsContainer").innerHTML = `
            <div class="loading">
                ❌ Unable to load menu
            </div>
        `;
    }
}

function getFoodEmoji(food) {
    const name = food.name.toLowerCase();

    if (name.includes("biryani")) return "🍛";
    if (name.includes("chicken")) return "🍗";
    if (name.includes("mutton")) return "🥩";
    if (name.includes("fries")) return "🍟";
    if (name.includes("rice")) return "🍚";
    if (name.includes("coca")) return "🥤";
    if (name.includes("juice")) return "🍹";
    if (name.includes("ice")) return "🍨";

    return "🍽️";
}

function normalizeCategory(food) {
    const category = food.category.toUpperCase();
    const name = food.name.toLowerCase();

    if (category.includes("BIRYANI") || name.includes("biryani")) {
        return "BIRYANI";
    }

    if (
        category.includes("STARTER") ||
        name.includes("chicken 65") ||
        name.includes("fries")
    ) {
        return "STARTERS";
    }

    if (
        category.includes("RICE") ||
        name.includes("fried rice")
    ) {
        return "RICE";
    }

    if (
        category.includes("DRINK") ||
        name.includes("juice") ||
        name.includes("coca")
    ) {
        return "DRINKS";
    }

    if (
        category.includes("DESSERT") ||
        name.includes("ice cream")
    ) {
        return "DESSERTS";
    }

    return category;
}

function renderFoods() {
    const container = document.getElementById("foodsContainer");

    const searchText =
        document.getElementById("searchInput").value
            .toLowerCase()
            .trim();

    const filtered = foods.filter(food => {

        const matchesSearch =
            food.name.toLowerCase().includes(searchText);

        const matchesCategory =
            selectedCategory === "ALL" ||
            normalizeCategory(food) === selectedCategory;

        return matchesSearch && matchesCategory;
    });

    if (filtered.length === 0) {
        container.innerHTML = `
            <div class="loading">
                😔 No food found
            </div>
        `;
        return;
    }

    container.innerHTML = filtered.map(food => {

        const image = food.image
            ? `images/${food.image}`
            : null;

        return `
            <div class="food-card">

                <div class="food-image">

                    ${
                        image
                        ?
                        `<img
                            src="${image}"
                            alt="${food.name}"
                            onerror="this.style.display='none';this.nextElementSibling.style.display='block';"
                        >`
                        : ""
                    }

                    <div
                        class="food-fallback"
                        style="display:${image ? "none" : "block"}"
                    >
                        ${getFoodEmoji(food)}
                    </div>

                </div>

                <div class="food-info">

                    <div class="food-category">
                        ${food.category}
                    </div>

                    <div class="food-name">
                        ${food.name}
                    </div>

                    <div class="food-bottom">

                        <div class="food-price">
                            ₹${Number(food.price).toFixed(2)}
                        </div>

                        <button
                            class="add-btn"
                            onclick="addToCart(${food.id})"
                        >
                            +
                        </button>

                    </div>

                </div>

            </div>
        `;
    }).join("");
}

function filterCategory(category, button) {
    selectedCategory = category;

    document.querySelectorAll(".category")
        .forEach(btn => btn.classList.remove("active"));

    button.classList.add("active");

    renderFoods();
}

function searchFoods() {
    renderFoods();
}

function addToCart(foodId) {

    const food = foods.find(item => item.id === foodId);

    if (!food) return;

    const existing = cart.find(item => item.id === foodId);

    if (existing) {
        existing.quantity++;
    } else {
        cart.push({
            ...food,
            quantity: 1
        });
    }

    updateCart();

    showToast(`${food.name} added to cart`);
}

function removeFromCart(foodId) {

    const item = cart.find(item => item.id === foodId);

    if (!item) return;

    item.quantity--;

    if (item.quantity <= 0) {
        cart = cart.filter(item => item.id !== foodId);
    }

    updateCart();
}

function increaseQuantity(foodId) {

    const item = cart.find(item => item.id === foodId);

    if (item) {
        item.quantity++;
    }

    updateCart();
}

function updateCart() {

    const count = cart.reduce(
        (total, item) => total + item.quantity,
        0
    );

    const subtotal = cart.reduce(
        (total, item) =>
            total + Number(item.price) * item.quantity,
        0
    );

    const gst = subtotal * 0.05;
    const total = subtotal + gst;

    document.getElementById("cartCount").textContent = count;

    document.getElementById("floatingCartCount").textContent =
        count;

    document.getElementById("floatingCartTotal").textContent =
        `₹${total.toFixed(2)}`;

    document.getElementById("subtotal").textContent =
        `₹${subtotal.toFixed(2)}`;

    document.getElementById("gst").textContent =
        `₹${gst.toFixed(2)}`;

    document.getElementById("grandTotal").textContent =
        `₹${total.toFixed(2)}`;

    renderCartItems();
}

function renderCartItems() {

    const container = document.getElementById("cartItems");
    const emptyCart = document.getElementById("emptyCart");
    const placeOrderBtn = document.getElementById("placeOrderBtn");

    if (cart.length === 0) {

        container.innerHTML = "";

        emptyCart.style.display = "block";

        placeOrderBtn.disabled = true;

        return;
    }

    emptyCart.style.display = "none";

    placeOrderBtn.disabled = false;

    container.innerHTML = cart.map(item => {

        const image = item.image
            ? `images/${item.image}`
            : null;

        return `
            <div class="cart-item">

                <div class="cart-item-image">

                    ${
                        image
                        ?
                        `<img
                            src="${image}"
                            onerror="this.style.display='none';this.nextElementSibling.style.display='block';"
                        >`
                        : ""
                    }

                    <span
                        style="display:${image ? "none" : "block"}"
                    >
                        ${getFoodEmoji(item)}
                    </span>

                </div>

                <div class="cart-item-info">

                    <strong>
                        ${item.name}
                    </strong>

                    <small>
                        ₹${Number(item.price).toFixed(2)}
                    </small>

                </div>

                <div class="quantity">

                    <button
                        onclick="removeFromCart(${item.id})"
                    >
                        −
                    </button>

                    <strong>
                        ${item.quantity}
                    </strong>

                    <button
                        onclick="increaseQuantity(${item.id})"
                    >
                        +
                    </button>

                </div>

            </div>
        `;
    }).join("");
}

function openCart() {
    document.getElementById("cartModal")
        .classList.add("show");
}

function closeCart() {
    document.getElementById("cartModal")
        .classList.remove("show");
}

async function placeOrder() {

    if (!selectedTable) {
        showToast("Please select a table first");
        closeCart();

        document.querySelector(".table-section")
            .scrollIntoView({
                behavior: "smooth"
            });

        return;
    }

    if (cart.length === 0) {
        showToast("Your cart is empty");
        return;
    }

    const button = document.getElementById("placeOrderBtn");

    button.disabled = true;
    button.textContent = "Placing Order...";

    const payload = {
        table_id: selectedTable.id,

        items: cart.map(item => ({
            food_id: item.id,
            quantity: item.quantity
        }))
    };

    try {

        const response = await fetch(
            `${API_URL}/orders`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(payload)
            }
        );

        if (!response.ok) {
            const error = await response.json();
            throw new Error(
                error.detail || "Order failed"
            );
        }

        const order = await response.json();

        const total = Number(order.total_amount);

        document.getElementById("successTable")
            .textContent = selectedTable.table_number;

        document.getElementById("successTotal")
            .textContent = `₹${total.toFixed(2)}`;

        cart = [];

        updateCart();

        closeCart();

        document.getElementById("successModal")
            .classList.add("show");

        await loadTables();

    } catch (error) {

        console.error(error);

        showToast(error.message);

    } finally {

        button.disabled = cart.length === 0;

        button.textContent = "Place Order →";
    }
}

function closeSuccess() {
    document.getElementById("successModal")
        .classList.remove("show");
}

function showToast(message) {

    const toast = document.getElementById("toast");

    toast.textContent = message;

    toast.classList.add("show");

    setTimeout(() => {
        toast.classList.remove("show");
    }, 2500);
}

window.addEventListener("click", event => {

    if (event.target === document.getElementById("cartModal")) {
        closeCart();
    }

    if (event.target === document.getElementById("successModal")) {
        closeSuccess();
    }

});