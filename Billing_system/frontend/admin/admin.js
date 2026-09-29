const API_URL = "http://127.0.0.1:8000";

let currentTableId = null;
let currentPaymentMethod = null;
let allTablesData = [];


// =========================================
// PAGE NAVIGATION
// =========================================

function showPage(page, element) {

    document.querySelectorAll(".page").forEach(p => {
        p.classList.remove("active-page");
    });

    document.querySelectorAll(".nav-item").forEach(item => {
        item.classList.remove("active");
    });

    document.getElementById(page + "Page").classList.add("active-page");

    if (element) {
        element.classList.add("active");
    }

    const titles = {
        dashboard: "Dashboard",
        tables: "Table Dashboard",
        billing: "Cash Counter"
    };

    document.getElementById("pageTitle").textContent = titles[page];

    if (page === "dashboard") {
        loadDashboard();
    }

    if (page === "tables") {
        loadTables();
    }

    if (page === "billing") {
        loadBilling();
    }
}


function showPageById(page) {

    const buttons = document.querySelectorAll(".nav-item");

    buttons.forEach(btn => {

        if (
            btn.textContent
                .toLowerCase()
                .includes(page === "tables" ? "tables" : "billing")
        ) {
            showPage(page, btn);
        }
    });
}


// =========================================
// INITIAL LOAD
// =========================================

document.addEventListener("DOMContentLoaded", () => {

    setCurrentDate();

    loadDashboard();

});


// =========================================
// DATE
// =========================================

function setCurrentDate() {

    const date = new Date();

    document.getElementById("currentDate").textContent =
        date.toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric"
        });
}


// =========================================
// LOAD DASHBOARD
// =========================================

async function loadDashboard() {

    try {

        const response = await fetch(
            `${API_URL}/admin/tables`
        );

        if (!response.ok) {
            throw new Error("Failed to load tables");
        }

        const tables = await response.json();

        allTablesData = tables;

        updateDashboardStats(tables);

        renderTables(
            tables,
            document.getElementById("dashboardTables"),
            6
        );

    } catch (error) {

        console.error(error);

        showToast(
            "Unable to connect to backend"
        );

    }
}


// =========================================
// DASHBOARD STATS
// =========================================

function updateDashboardStats(tables) {

    const total = tables.length;

    const available = tables.filter(
        table => table.status === "AVAILABLE"
    ).length;

    const occupied = tables.filter(
        table => table.status === "OCCUPIED"
    ).length;

    const sales = tables.reduce(
        (sum, table) =>
            sum + Number(table.total_amount || 0),
        0
    );

    document.getElementById("totalTables").textContent = total;

    document.getElementById("availableTables").textContent =
        available;

    document.getElementById("occupiedTables").textContent =
        occupied;

    document.getElementById("activeSales").textContent =
        formatCurrency(sales);
}


// =========================================
// LOAD ALL TABLES
// =========================================

async function loadTables() {

    const container =
        document.getElementById("allTables");

    container.innerHTML =
        `<div class="loading">Loading tables...</div>`;

    try {

        const response = await fetch(
            `${API_URL}/admin/tables`
        );

        if (!response.ok) {
            throw new Error("Failed to load tables");
        }

        const tables = await response.json();

        allTablesData = tables;

        updateTableSummary(tables);

        renderTables(
            tables,
            container
        );

    } catch (error) {

        console.error(error);

        container.innerHTML =
            `<div class="loading">
                Failed to load tables.
            </div>`;

    }
}


// =========================================
// TABLE SUMMARY
// =========================================

function updateTableSummary(tables) {

    const available = tables.filter(
        t => t.status === "AVAILABLE"
    ).length;

    const occupied = tables.filter(
        t => t.status === "OCCUPIED"
    ).length;

    document.getElementById("tableAvailable").textContent =
        available;

    document.getElementById("tableOccupied").textContent =
        occupied;

    document.getElementById("tableTotal").textContent =
        tables.length;
}


// =========================================
// RENDER TABLES
// =========================================

function renderTables(
    tables,
    container,
    limit = null
) {

    if (!tables.length) {

        container.innerHTML =
            `<div class="loading">
                No tables found.
            </div>`;

        return;
    }

    const displayTables =
        limit ? tables.slice(0, limit) : tables;

    container.innerHTML =
        displayTables.map(table => {

            const isOccupied =
                table.status === "OCCUPIED";

            return `

                <div class="table-card ${isOccupied ? "occupied" : "available"}">

                    <div class="table-top">

                        <div class="table-number">
                            ${table.table_number}
                        </div>

                        <span class="status-badge ${isOccupied ? "occupied" : "available"}">
                            ${table.status}
                        </span>

                    </div>

                    <div class="table-info">

                        <div>
                            <span>Orders</span>
                            <strong>
                                ${table.order_count}
                            </strong>
                        </div>

                        <div>
                            <span>Current Bill</span>
                            <strong>
                                ${formatCurrency(table.total_amount)}
                            </strong>
                        </div>

                    </div>

                    <button
                        class="view-table-btn"
                        onclick="viewTable(${table.table_id})">

                        ${isOccupied
                            ? "View Orders →"
                            : "View Table →"}

                    </button>

                </div>
            `;

        }).join("");
}


// =========================================
// VIEW TABLE
// =========================================

async function viewTable(tableId) {

    currentTableId = tableId;

    const table = allTablesData.find(
        t => t.table_id === tableId
    );

    if (!table) return;

    document.getElementById("modalTableNumber")
        .textContent = table.table_number;

    const statusElement =
        document.getElementById("modalStatus");

    statusElement.textContent = table.status;

    statusElement.className =
        `status-badge ${
            table.status === "OCCUPIED"
                ? "occupied"
                : "available"
        }`;

    document.getElementById("tableModal")
        .classList.add("show");

    const ordersContainer =
        document.getElementById("modalOrders");

    ordersContainer.innerHTML =
        `<div class="loading">
            Loading orders...
        </div>`;

    try {

        const response = await fetch(
            `${API_URL}/admin/table/${tableId}/orders`
        );

        const data = await response.json();

        document.getElementById("modalTotal")
            .textContent =
            formatCurrency(data.total_amount);

        if (!data.orders || !data.orders.length) {

            ordersContainer.innerHTML =
                `<div class="loading">
                    🪑 Table is currently available.
                </div>`;

            return;
        }

        ordersContainer.innerHTML =
            data.orders.map(order => `

                <div class="order-box">

                    <div class="order-box-header">

                        <strong>
                            Order #${order.order_id}
                        </strong>

                        <span class="order-status">
                            ${order.status}
                        </span>

                    </div>

                    ${order.items.map(item => `

                        <div class="order-item">

                            <span>
                                ${item.food_name}
                                × ${item.quantity}
                            </span>

                            <strong>
                                ${formatCurrency(item.item_total)}
                            </strong>

                        </div>

                    `).join("")}

                </div>

            `).join("");

    } catch (error) {

        console.error(error);

        ordersContainer.innerHTML =
            `<div class="loading">
                Failed to load orders.
            </div>`;
    }
}


// =========================================
// CLOSE TABLE MODAL
// =========================================

function closeModal() {

    document.getElementById("tableModal")
        .classList.remove("show");
}


// =========================================
// OPEN BILL
// =========================================

async function openBill() {

    if (!currentTableId) return;

    try {

        const response = await fetch(
            `${API_URL}/admin/table/${currentTableId}/bill`
        );

        const data = await response.json();

        if (!response.ok) {

            showToast(
                data.detail || "Unable to generate bill"
            );

            return;
        }

        renderBill(data);

        closeModal();

        document.getElementById("billModal")
            .classList.add("show");

    } catch (error) {

        console.error(error);

        showToast(
            "Unable to generate bill"
        );

    }
}


// =========================================
// RENDER BILL
// =========================================

function renderBill(data) {

    document.getElementById("billTableNumber")
        .textContent =
        `Table ${data.table_number}`;

    const itemsContainer =
        document.getElementById("billItems");

    itemsContainer.innerHTML =
        data.items.map(item => `

            <div class="bill-item">

                <span>
                    ${item.food_name}
                </span>

                <span class="qty">
                    × ${item.quantity}
                </span>

                <span class="price">
                    ${formatCurrency(item.total)}
                </span>

            </div>

        `).join("");

    document.getElementById("billSubtotal")
        .textContent =
        formatCurrency(data.subtotal);

    document.getElementById("billTax")
        .textContent =
        formatCurrency(data.tax);

    document.getElementById("billService")
        .textContent =
        formatCurrency(data.service_charge);

    document.getElementById("billGrandTotal")
        .textContent =
        formatCurrency(data.grand_total);

    currentPaymentMethod = null;

    document.querySelectorAll(".payment-option")
        .forEach(btn => {
            btn.classList.remove("selected");
        });

    const checkoutBtn =
        document.getElementById("checkoutBtn");

    checkoutBtn.disabled = true;

    checkoutBtn.textContent =
        "🔒 Select Payment Method";
}


// =========================================
// SELECT PAYMENT
// =========================================

function selectPayment(method, button) {

    currentPaymentMethod = method;

    document.querySelectorAll(".payment-option")
        .forEach(btn => {
            btn.classList.remove("selected");
        });

    button.classList.add("selected");

    const checkoutBtn =
        document.getElementById("checkoutBtn");

    checkoutBtn.disabled = false;

    checkoutBtn.textContent =
        `💳 Complete Payment — ${method}`;
}


// =========================================
// COMPLETE CHECKOUT
// =========================================

async function completeCheckout() {

    if (!currentTableId) {

        showToast("No table selected");

        return;
    }

    if (!currentPaymentMethod) {

        showToast(
            "Please select payment method"
        );

        return;
    }

    const checkoutBtn =
        document.getElementById("checkoutBtn");

    checkoutBtn.disabled = true;

    checkoutBtn.textContent =
        "Processing Payment...";

    try {

        const response = await fetch(
            `${API_URL}/admin/checkout/${currentTableId}?payment_method=${currentPaymentMethod}`,
            {
                method: "POST"
            }
        );

        const data = await response.json();

        if (!response.ok) {

            let message =
                data.detail || "Checkout failed";

            if (
                typeof message === "object" &&
                message.message
            ) {
                message = message.message;
            }

            showToast(message);

            checkoutBtn.disabled = false;

            checkoutBtn.textContent =
                `💳 Complete Payment — ${currentPaymentMethod}`;

            return;
        }

        showToast(
            `Payment successful! ${data.table_number} is now available.`
        );

        closeBillModal();

        currentTableId = null;
        currentPaymentMethod = null;

        await loadDashboard();

        await loadTables();

        await loadBilling();

    } catch (error) {

        console.error(error);

        showToast(
            "Server connection failed"
        );

        checkoutBtn.disabled = false;

        checkoutBtn.textContent =
            "Try Again";

    }
}


// =========================================
// CLOSE BILL MODAL
// =========================================

function closeBillModal() {

    document.getElementById("billModal")
        .classList.remove("show");
}


// =========================================
// BILLING PAGE
// =========================================

async function loadBilling() {

    const container =
        document.getElementById("billingTables");

    container.innerHTML =
        `<div class="loading">
            Loading billing information...
        </div>`;

    try {

        const response = await fetch(
            `${API_URL}/admin/tables`
        );

        const tables = await response.json();

        allTablesData = tables;

        const occupiedTables =
            tables.filter(
                table => table.status === "OCCUPIED"
            );

        if (!occupiedTables.length) {

            container.innerHTML =
                `<div class="loading">
                    🎉 No pending bills.
                    All tables are available.
                </div>`;

            return;
        }

        container.innerHTML =
            occupiedTables.map(table => `

                <div class="billing-card">

                    <div class="billing-card-left">

                        <div class="billing-icon">
                            🧾
                        </div>

                        <div>

                            <h3>
                                ${table.table_number}
                            </h3>

                            <p>
                                ${table.order_count}
                                order(s) waiting for checkout
                            </p>

                        </div>

                    </div>

                    <div class="billing-amount">

                        <span>Total Amount</span>

                        <strong>
                            ${formatCurrency(table.total_amount)}
                        </strong>

                    </div>

                    <button
                        class="bill-btn"
                        onclick="viewTable(${table.table_id})">

                        View Bill →

                    </button>

                </div>

            `).join("");

    } catch (error) {

        console.error(error);

        container.innerHTML =
            `<div class="loading">
                Failed to load billing data.
            </div>`;
    }
}


// =========================================
// CURRENCY
// =========================================

function formatCurrency(amount) {

    return "₹" +
        Number(amount || 0).toLocaleString(
            "en-IN",
            {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            }
        );
}


// =========================================
// TOAST
// =========================================

function showToast(message) {

    const toast =
        document.getElementById("toast");

    document.getElementById("toastMessage")
        .textContent = message;

    toast.classList.add("show");

    setTimeout(() => {

        toast.classList.remove("show");

    }, 3000);
}


// =========================================
// CLOSE MODALS WHEN CLICKING OUTSIDE
// =========================================

window.addEventListener("click", function(event) {

    const tableModal =
        document.getElementById("tableModal");

    const billModal =
        document.getElementById("billModal");

    if (event.target === tableModal) {
        closeModal();
    }

    if (event.target === billModal) {
        closeBillModal();
    }

});