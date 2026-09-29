// ======================================================
// FOODHUB CHEF DASHBOARD
// ======================================================

const API_BASE_URL = "http://127.0.0.1:8000";


// ======================================================
// GLOBAL DATA
// ======================================================

let allOrders = [];
let allTables = [];


// ======================================================
// PAGE NAVIGATION
// ======================================================

function showPage(pageName) {

    const pages = document.querySelectorAll(".page");

    pages.forEach(page => {
        page.classList.remove("active-page");
    });


    const navItems = document.querySelectorAll(".nav-item");

    navItems.forEach(item => {
        item.classList.remove("active");
    });


    if (pageName === "dashboard") {

        document
            .getElementById("dashboardPage")
            .classList.add("active-page");

        document
            .querySelector('[data-page="dashboard"]')
            .classList.add("active");

        loadOrders();
        loadTables();

    }


    else if (pageName === "orders") {

        document
            .getElementById("ordersPage")
            .classList.add("active-page");

        document
            .querySelector('[data-page="orders"]')
            .classList.add("active");

        loadOrders();

    }


    else if (pageName === "tables") {

        document
            .getElementById("tablesPage")
            .classList.add("active-page");

        document
            .querySelector('[data-page="tables"]')
            .classList.add("active");

        loadTables();

    }

}


// ======================================================
// LOAD ORDERS
// ======================================================

async function loadOrders() {

    const loading =
        document.getElementById("loading");

    const container =
        document.getElementById("ordersContainer");

    const emptyState =
        document.getElementById("emptyState");


    if (loading) {
        loading.classList.remove("hidden");
    }


    if (container) {
        container.innerHTML = "";
    }


    if (emptyState) {
        emptyState.classList.add("hidden");
    }


    try {

        const response = await fetch(
            `${API_BASE_URL}/chef/orders`
        );


        if (!response.ok) {

            throw new Error(
                `Server returned ${response.status}`
            );

        }


        const orders = await response.json();


        console.log("Chef Orders:", orders);


        allOrders = Array.isArray(orders)
            ? orders
            : [];


        updateStatistics(allOrders);

        renderOrders(allOrders);

        renderRecentOrders(allOrders);

        renderTablesFromOrders();


    }

    catch (error) {

        console.error(
            "Error loading chef orders:",
            error
        );


        if (loading) {
            loading.classList.add("hidden");
        }


        if (container) {

            container.innerHTML = `
                <div class="error-card">

                    <div class="error-icon">
                        ⚠️
                    </div>

                    <h2>Unable to Load Orders</h2>

                    <p>
                        Make sure your FastAPI server is running
                        at ${API_BASE_URL}
                    </p>

                    <button onclick="loadOrders()">
                        🔄 Try Again
                    </button>

                </div>
            `;

        }

    }

}


// ======================================================
// RENDER ORDERS
// ======================================================

function renderOrders(orders) {

    const loading =
        document.getElementById("loading");

    const container =
        document.getElementById("ordersContainer");

    const emptyState =
        document.getElementById("emptyState");


    if (loading) {
        loading.classList.add("hidden");
    }


    if (!orders || orders.length === 0) {

        if (container) {
            container.innerHTML = "";
        }

        if (emptyState) {
            emptyState.classList.remove("hidden");
        }

        return;

    }


    if (emptyState) {
        emptyState.classList.add("hidden");
    }


    container.innerHTML = "";


    orders.forEach(order => {

        container.appendChild(
            createOrderCard(order)
        );

    });

}


// ======================================================
// CREATE ORDER CARD
// ======================================================

function createOrderCard(order) {

    const card =
        document.createElement("div");

    card.className = "order-card";


    const status =
        String(order.status || "NEW")
            .toUpperCase();


    const statusClass =
        status.toLowerCase();


    const foodItems =
        Array.isArray(order.items)
            ? order.items.map(item => {

                return `

                    <div class="food-item">

                        <div class="food-info">

                            <div class="food-icon">
                                🍽️
                            </div>

                            <div>

                                <div class="food-name">
                                    ${escapeHTML(item.food_name)}
                                </div>

                                <div class="food-quantity">
                                    Quantity:
                                    ${item.quantity}
                                </div>

                            </div>

                        </div>

                        <div class="food-price">
                            ₹${Number(item.price).toFixed(2)}
                        </div>

                    </div>

                `;

            }).join("")

            : "<p>No food items</p>";


    card.innerHTML = `

        <div class="order-header">

            <div>

                <div class="order-number">
                    Order #${order.order_id}
                </div>

                <span class="table-badge">
                    🪑 Table
                    ${escapeHTML(order.table_number)}
                </span>

            </div>

            <span
                class="status-badge status-${statusClass}"
            >
                ${status}
            </span>

        </div>


        <div class="order-body">

            <div class="food-list">

                ${foodItems}

            </div>


            <div class="order-footer">

                <div class="total-row">

                    <span>
                        Order Total
                    </span>

                    <strong>
                        ₹${Number(
                            order.total_amount || 0
                        ).toFixed(2)}
                    </strong>

                </div>


                <div class="status-buttons">

                    <button
                        class="status-btn new ${
                            status === "NEW"
                                ? "active"
                                : ""
                        }"
                        onclick="
                            changeStatus(
                                ${order.order_id},
                                'NEW'
                            )
                        "
                    >
                        🆕 New
                    </button>


                    <button
                        class="status-btn preparing ${
                            status === "PREPARING"
                                ? "active"
                                : ""
                        }"
                        onclick="
                            changeStatus(
                                ${order.order_id},
                                'PREPARING'
                            )
                        "
                    >
                        🔥 Preparing
                    </button>


                    <button
                        class="status-btn ready ${
                            status === "READY"
                                ? "active"
                                : ""
                        }"
                        onclick="
                            changeStatus(
                                ${order.order_id},
                                'READY'
                            )
                        "
                    >
                        ✅ Ready
                    </button>


                    <button
                        class="status-btn delivered ${
                            status === "DELIVERED"
                                ? "active"
                                : ""
                        }"
                        onclick="
                            changeStatus(
                                ${order.order_id},
                                'DELIVERED'
                            )
                        "
                    >
                        🚚 Delivered
                    </button>

                </div>

            </div>

        </div>

    `;


    return card;

}


// ======================================================
// CHANGE ORDER STATUS
// ======================================================

async function changeStatus(
    orderId,
    newStatus
) {

    try {

        const url =
            `${API_BASE_URL}/orders/${orderId}/status` +
            `?status=${encodeURIComponent(newStatus)}`;


        const response =
            await fetch(url, {

                method: "PUT",

                headers: {
                    "Accept": "application/json"
                }

            });


        if (!response.ok) {

            const errorText =
                await response.text();

            console.error(
                "Server error:",
                errorText
            );

            throw new Error(
                `Status update failed: ${response.status}`
            );

        }


        const result =
            await response.json();


        console.log(
            "Status updated:",
            result
        );


        showToast(
            `Order #${orderId} → ${newStatus}`
        );


        await loadOrders();

        await loadTables();

    }


    catch (error) {

        console.error(
            "Status update error:",
            error
        );


        showToast(
            "❌ Failed to update order status"
        );

    }

}


// ======================================================
// UPDATE ORDER STATISTICS
// ======================================================

function updateStatistics(orders) {

    let newOrders = 0;

    let preparing = 0;

    let ready = 0;

    let delivered = 0;


    orders.forEach(order => {

        const status =
            String(order.status || "")
                .toUpperCase();


        if (status === "NEW") {

            newOrders++;

        }

        else if (status === "PREPARING") {

            preparing++;

        }

        else if (status === "READY") {

            ready++;

        }

        else if (status === "DELIVERED") {

            delivered++;

        }

    });


    setText(
        "newCount",
        newOrders
    );


    setText(
        "preparingCount",
        preparing
    );


    setText(
        "readyCount",
        ready
    );


    setText(
        "deliveredCount",
        delivered
    );

}


// ======================================================
// LOAD TABLES
// ======================================================

async function loadTables() {

    const container =
        document.getElementById("tablesContainer");

    const loading =
        document.getElementById("tableLoading");


    if (loading) {
        loading.classList.remove("hidden");
    }


    try {

        const response =
            await fetch(
                `${API_BASE_URL}/tables`
            );


        if (!response.ok) {

            throw new Error(
                `Server returned ${response.status}`
            );

        }


        const tables =
            await response.json();


        console.log(
            "Restaurant Tables:",
            tables
        );


        allTables =
            Array.isArray(tables)
                ? tables
                : [];


        updateTableStatistics(
            allTables
        );


        renderTables(
            allTables
        );

    }


    catch (error) {

        console.error(
            "Error loading tables:",
            error
        );


        if (container) {

            container.innerHTML = `

                <div class="error-card">

                    <div class="error-icon">
                        ⚠️
                    </div>

                    <h2>Unable to Load Tables</h2>

                    <p>
                        Make sure the FastAPI
                        <strong>/tables</strong>
                        endpoint is working.
                    </p>

                    <button onclick="loadTables()">
                        🔄 Try Again
                    </button>

                </div>

            `;

        }

    }

    finally {

        if (loading) {
            loading.classList.add("hidden");
        }

    }

}


// ======================================================
// UPDATE TABLE STATISTICS
// ======================================================

function updateTableStatistics(tables) {

    const available =
        tables.filter(
            table =>
                String(table.status)
                    .toUpperCase() === "AVAILABLE"
        ).length;


    const occupied =
        tables.filter(
            table =>
                String(table.status)
                    .toUpperCase() !== "AVAILABLE"
        ).length;


    const total =
        tables.length;


    setText(
        "tableAvailable",
        available
    );


    setText(
        "tableOccupied",
        occupied
    );


    setText(
        "tableTotal",
        total
    );


    setText(
        "availableTableCount",
        available
    );


    setText(
        "occupiedTableCount",
        occupied
    );


    setText(
        "totalTableCount",
        total
    );

}


// ======================================================
// RENDER TABLES
// ======================================================

function renderTables(tables) {

    const container =
        document.getElementById(
            "tablesContainer"
        );


    if (!container) {
        return;
    }


    container.innerHTML = "";


    if (!tables || tables.length === 0) {

        container.innerHTML = `

            <div class="empty-state">

                <div class="empty-icon">
                    🪑
                </div>

                <h2>No Tables Found</h2>

                <p>
                    No restaurant tables are available.
                </p>

            </div>

        `;

        return;

    }


    tables.forEach(table => {

        const card =
            createTableCard(table);

        container.appendChild(card);

    });

}


// ======================================================
// CREATE TABLE CARD
// ======================================================

function createTableCard(table) {

    const card =
        document.createElement("div");


    const status =
        String(table.status || "AVAILABLE")
            .toUpperCase();


    const isAvailable =
        status === "AVAILABLE";


    card.className =
        `table-card ${
            isAvailable
                ? "table-available"
                : "table-occupied"
        }`;


    const tableOrders =
        allOrders.filter(order => {

            return String(
                order.table_number
            ).toUpperCase() === String(
                table.table_number
            ).toUpperCase();

        });


    const activeOrders =
        tableOrders.filter(order => {

            return String(
                order.status
            ).toUpperCase() !== "DELIVERED";

        });


    const totalAmount =
        tableOrders.reduce(
            (sum, order) => {

                return sum +
                    Number(
                        order.total_amount || 0
                    );

            },
            0
        );


    card.innerHTML = `

        <div class="table-card-top">

            <div class="table-chair">
                🪑
            </div>

            <span
                class="table-status ${
                    isAvailable
                        ? "available"
                        : "occupied"
                }"
            >
                ${
                    isAvailable
                        ? "AVAILABLE"
                        : "OCCUPIED"
                }
            </span>

        </div>


        <div class="table-number">
            ${escapeHTML(table.table_number)}
        </div>


        <div class="table-info">

            <div>

                <span>
                    Active Orders
                </span>

                <strong>
                    ${activeOrders.length}
                </strong>

            </div>


            <div>

                <span>
                    Orders
                </span>

                <strong>
                    ${tableOrders.length}
                </strong>

            </div>

        </div>


        <div class="table-total">

            <span>
                Current Total
            </span>

            <strong>
                ₹${totalAmount.toFixed(2)}
            </strong>

        </div>


        <button
            class="view-table-btn"
            onclick="
                openTableDetails(
                    ${table.id}
                )
            "
        >
            👁 View Table
        </button>

    `;


    return card;

}


// ======================================================
// TABLE DETAILS
// ======================================================

function openTableDetails(tableId) {

    const table =
        allTables.find(
            t => Number(t.id) === Number(tableId)
        );


    if (!table) {

        showToast(
            "❌ Table information not found"
        );

        return;

    }


    const tableOrders =
        allOrders.filter(order => {

            return String(
                order.table_number
            ).toUpperCase() === String(
                table.table_number
            ).toUpperCase();

        });


    const content =
        document.getElementById(
            "tableModalContent"
        );


    const isAvailable =
        String(table.status)
            .toUpperCase() === "AVAILABLE";


    let ordersHTML = "";


    if (tableOrders.length === 0) {

        ordersHTML = `

            <div class="modal-empty">

                <div>
                    🍽️
                </div>

                <p>
                    No orders for this table.
                </p>

            </div>

        `;

    }

    else {

        ordersHTML =
            tableOrders.map(order => {

                return `

                    <div class="modal-order">

                        <div class="modal-order-header">

                            <strong>
                                Order #${order.order_id}
                            </strong>

                            <span
                                class="status-badge status-${String(
                                    order.status
                                ).toLowerCase()}"
                            >
                                ${order.status}
                            </span>

                        </div>


                        <div class="modal-foods">

                            ${
                                (order.items || [])
                                    .map(item => `
                                        <div>
                                            ${escapeHTML(
                                                item.food_name
                                            )}
                                            ×
                                            ${item.quantity}
                                        </div>
                                    `)
                                    .join("")
                            }

                        </div>


                        <div class="modal-order-total">

                            <span>
                                Total
                            </span>

                            <strong>
                                ₹${Number(
                                    order.total_amount || 0
                                ).toFixed(2)}
                            </strong>

                        </div>

                    </div>

                `;

            }).join("");

    }


    content.innerHTML = `

        <div class="modal-title">

            <div class="modal-table-icon">
                🪑
            </div>

            <div>

                <h2>
                    Table ${escapeHTML(
                        table.table_number
                    )}
                </h2>

                <span
                    class="${
                        isAvailable
                            ? "modal-available"
                            : "modal-occupied"
                    }"
                >
                    ${
                        isAvailable
                            ? "🟢 Available"
                            : "🔴 Occupied"
                    }
                </span>

            </div>

        </div>


        <div class="modal-section">

            <h3>
                Orders
            </h3>

            ${ordersHTML}

        </div>

    `;


    document
        .getElementById("tableModal")
        .classList.remove("hidden");

}


// ======================================================
// CLOSE TABLE MODAL
// ======================================================

function closeTableModal(event) {

    if (
        event &&
        event.target !==
        document.getElementById("tableModal")
    ) {

        return;

    }


    document
        .getElementById("tableModal")
        .classList.add("hidden");

}


// ======================================================
// RECENT ORDERS
// ======================================================

function renderRecentOrders(orders) {

    const container =
        document.getElementById(
            "recentOrdersContainer"
        );


    if (!container) {
        return;
    }


    const recent =
        orders.slice(0, 5);


    if (recent.length === 0) {

        container.innerHTML = `

            <div class="recent-empty">
                🍳 No orders yet
            </div>

        `;

        return;

    }


    container.innerHTML =
        recent.map(order => {

            const status =
                String(
                    order.status || "NEW"
                ).toUpperCase();


            return `

                <div
                    class="recent-order"
                    onclick="showPage('orders')"
                >

                    <div class="recent-order-icon">
                        🍽️
                    </div>


                    <div class="recent-order-info">

                        <strong>
                            Order #${order.order_id}
                        </strong>

                        <span>
                            🪑 Table
                            ${escapeHTML(
                                order.table_number
                            )}
                        </span>

                    </div>


                    <div class="recent-order-right">

                        <span
                            class="status-badge status-${status.toLowerCase()}"
                        >
                            ${status}
                        </span>

                        <strong>
                            ₹${Number(
                                order.total_amount || 0
                            ).toFixed(2)}
                        </strong>

                    </div>

                </div>

            `;

        }).join("");

}


// ======================================================
// SEARCH / FILTER
// ======================================================

function filterOrders() {

    const searchInput =
        document.getElementById(
            "orderSearch"
        );


    const statusInput =
        document.getElementById(
            "statusFilter"
        );


    const search =
        searchInput
            ? searchInput.value
                .trim()
                .toLowerCase()
            : "";


    const selectedStatus =
        statusInput
            ? statusInput.value
            : "ALL";


    const filtered =
        allOrders.filter(order => {

            const orderId =
                String(
                    order.order_id
                ).toLowerCase();


            const table =
                String(
                    order.table_number
                ).toLowerCase();


            const status =
                String(
                    order.status
                ).toUpperCase();


            const matchesSearch =
                orderId.includes(search) ||
                table.includes(search);


            const matchesStatus =
                selectedStatus === "ALL" ||
                status === selectedStatus;


            return (
                matchesSearch &&
                matchesStatus
            );

        });


    renderOrders(filtered);

}


// ======================================================
// RENDER TABLES USING CURRENT ORDERS
// ======================================================

function renderTablesFromOrders() {

    if (
        allTables &&
        allTables.length > 0
    ) {

        renderTables(allTables);

    }

}


// ======================================================
// REFRESH EVERYTHING
// ======================================================

async function refreshAll() {

    showToast(
        "🔄 Refreshing dashboard..."
    );


    await loadOrders();

    await loadTables();


    showToast(
        "✅ Dashboard updated"
    );

}


// ======================================================
// TOAST
// ======================================================

function showToast(message) {

    const toast =
        document.getElementById("toast");


    if (!toast) {
        return;
    }


    toast.textContent = message;


    toast.classList.add("show");


    setTimeout(() => {

        toast.classList.remove("show");

    }, 2500);

}


// ======================================================
// SAFE TEXT
// ======================================================

function escapeHTML(value) {

    const div =
        document.createElement("div");


    div.textContent =
        value ?? "";


    return div.innerHTML;

}


// ======================================================
// SET TEXT HELPER
// ======================================================

function setText(
    elementId,
    value
) {

    const element =
        document.getElementById(
            elementId
        );


    if (element) {

        element.textContent =
            value;

    }

}


// ======================================================
// AUTO REFRESH
// ======================================================

setInterval(() => {

    loadOrders();

    loadTables();

}, 10000);


// ======================================================
// INITIAL LOAD
// ======================================================

document.addEventListener(
    "DOMContentLoaded",
    () => {

        loadOrders();

        loadTables();

    }
);