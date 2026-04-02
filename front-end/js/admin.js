(function () {
    "use strict";

    function normalizeApiBase(value) {
        return String(value || "").trim().replace(/\/+$/, "");
    }

    function collectApiBases() {
        const configured = normalizeApiBase(window.ESHOPPER_API_BASE);
        const stored = normalizeApiBase(localStorage.getItem("eshopper_api_base"));
        const origin = window.location.origin;

        return [configured, stored, `${origin}/api`, `${origin}/demo/api`, "http://localhost:8080/api", "http://127.0.0.1:8080/api"]
            .filter(Boolean)
            .filter((item, index, list) => list.indexOf(item) === index);
    }

    let API_BASE = collectApiBases()[0];

    const state = {
        products: [],
        orders: [],
        users: []
    };

    function showMessage(type, text) {
        const wrap = document.getElementById("adminMessage");
        if (!wrap) return;
        wrap.innerHTML = `<div class="alert alert-${type} mb-0">${text}</div>`;
    }

    function getStoredUser() {
        try {
            const raw = localStorage.getItem("eshopper_user");
            return raw ? JSON.parse(raw) : null;
        } catch (error) {
            return null;
        }
    }

    function getToken() {
        return localStorage.getItem("eshopper_auth_token") || "";
    }

    function isAdminUser(user) {
        if (!user || typeof user !== "object") return false;

        const roleValue = (user.role || user.userRole || "").toString().toLowerCase();
        if (roleValue.includes("admin")) return true;

        if (Array.isArray(user.roles) && user.roles.some((role) => String(role).toLowerCase().includes("admin"))) {
            return true;
        }

        if (Array.isArray(user.authorities) && user.authorities.some((authority) => {
            const value = (authority && authority.authority) ? authority.authority : authority;
            return String(value).toLowerCase().includes("admin");
        })) {
            return true;
        }

        return false;
    }

    function money(value) {
        return "$" + Number(value || 0).toFixed(2);
    }

    function normalizeCollection(payload) {
        if (Array.isArray(payload)) return payload;
        if (payload && Array.isArray(payload.content)) return payload.content;
        if (payload && Array.isArray(payload.data)) return payload.data;
        if (payload && Array.isArray(payload.items)) return payload.items;
        return [];
    }

    async function request(path, options) {
        const token = getToken();
        const headers = {
            Accept: "application/json",
            ...(options && options.headers ? options.headers : {})
        };

        if (!(options && options.skipContentType) && !(headers["Content-Type"])) {
            headers["Content-Type"] = "application/json";
        }

        if (token) {
            headers.Authorization = `Bearer ${token}`;
        }

        const bases = collectApiBases();
        if (API_BASE) {
            bases.sort((a, b) => (a === API_BASE ? -1 : (b === API_BASE ? 1 : 0)));
        }

        let lastError = null;
        for (let i = 0; i < bases.length; i += 1) {
            const base = bases[i];
            try {
                const response = await fetch(base + path, {
                    ...(options || {}),
                    headers
                });

                if (response.status === 204) {
                    API_BASE = base;
                    localStorage.setItem("eshopper_api_base", base);
                    return null;
                }

                const payload = await response.json().catch(() => ({}));
                if (!response.ok) {
                    const message = (payload && payload.message) ? payload.message : `Request failed (${response.status})`;
                    const error = new Error(message);
                    error.status = response.status;
                    throw error;
                }

                API_BASE = base;
                localStorage.setItem("eshopper_api_base", base);
                return payload;
            } catch (error) {
                lastError = error;
                const status = error && error.status;
                const canTryNext = !status || status === 404 || status === 405;
                if (!canTryNext || i === bases.length - 1) {
                    break;
                }
            }
        }

        const reason = (lastError && lastError.message) ? lastError.message : "Unable to connect to backend";
        throw new Error(`${reason}. Checked API bases: ${bases.join(", ")}`);
    }

    async function requestFirst(paths, options) {
        let lastError = null;

        for (let i = 0; i < paths.length; i += 1) {
            try {
                return await request(paths[i], options);
            } catch (error) {
                lastError = error;
                if (error.status !== 404 && error.status !== 405) {
                    throw error;
                }
            }
        }

        throw lastError || new Error("No matching endpoint found");
    }

    function renderTopUser() {
        const user = getStoredUser();
        const target = document.getElementById("adminTopUser");
        if (!target) return;

        const name = (user && (user.fullName || user.name || user.email)) ? (user.fullName || user.name || user.email) : "Admin";
        target.innerHTML = `<span class="text-dark px-2"><i class="fas fa-user-shield mr-2"></i>${name}</span>`;
    }

    function renderMetrics() {
        document.getElementById("metricProducts").textContent = String(state.products.length);
        document.getElementById("metricOrders").textContent = String(state.orders.length);

        const totalRevenue = state.orders.reduce((sum, order) => {
            const value = Number(order.totalAmount || order.total || order.amount || 0);
            return sum + (Number.isFinite(value) ? value : 0);
        }, 0);

        document.getElementById("metricRevenue").textContent = money(totalRevenue);
    }

    function setProductForm(product) {
        document.getElementById("productId").value = product ? (product.id || "") : "";
        document.getElementById("productName").value = product ? (product.name || "") : "";
        document.getElementById("productPrice").value = product ? Number(product.price || 0) : "";
        document.getElementById("productStock").value = product ? Number(product.stock || 0) : "";
        document.getElementById("productCategoryId").value = product ? (product.categoryId || (product.category && product.category.id) || "") : "";
        document.getElementById("productImageUrl").value = product ? (product.imageUrl || "") : "";
        document.getElementById("productDescription").value = product ? (product.description || "") : "";
    }

    function renderProducts() {
        const tbody = document.getElementById("productsTableBody");
        if (!tbody) return;

        if (!state.products.length) {
            tbody.innerHTML = "<tr><td colspan='5' class='text-center'>No products found</td></tr>";
            return;
        }

        tbody.innerHTML = state.products.map((product) => `
            <tr>
                <td>${product.id || "-"}</td>
                <td>${product.name || "-"}</td>
                <td>${money(product.price)}</td>
                <td>${Number(product.stock || 0)}</td>
                <td>
                    <button class="btn btn-sm btn-outline-primary js-edit-product" data-id="${product.id}">Edit</button>
                    <button class="btn btn-sm btn-outline-danger js-delete-product" data-id="${product.id}">Delete</button>
                </td>
            </tr>
        `).join("");

        tbody.querySelectorAll(".js-edit-product").forEach((button) => {
            button.addEventListener("click", () => {
                const id = Number(button.getAttribute("data-id"));
                const product = state.products.find((item) => Number(item.id) === id);
                if (!product) return;
                setProductForm(product);
                showMessage("info", `Editing product #${id}`);
            });
        });

        tbody.querySelectorAll(".js-delete-product").forEach((button) => {
            button.addEventListener("click", async () => {
                const id = Number(button.getAttribute("data-id"));
                if (!Number.isFinite(id)) return;

                const ok = window.confirm("Delete this product?");
                if (!ok) return;

                try {
                    await requestFirst([
                        `/products/${id}`,
                        `/admin/products/${id}`
                    ], { method: "DELETE" });
                    showMessage("success", `Product #${id} deleted`);
                    await loadProducts();
                    renderMetrics();
                } catch (error) {
                    showMessage("danger", error.message || "Unable to delete product");
                }
            });
        });
    }

    function renderOrders() {
        const tbody = document.getElementById("ordersTableBody");
        if (!tbody) return;

        if (!state.orders.length) {
            tbody.innerHTML = "<tr><td colspan='5' class='text-center'>No orders found</td></tr>";
            return;
        }

        tbody.innerHTML = state.orders.map((order) => {
            const statusRaw = String(order.status || "pending");
            const status = statusRaw.toLowerCase();
            const badgeClass = status === "delivered" || status === "completed"
                ? "success"
                : (status === "cancelled" || status === "failed" ? "danger" : "warning");
            const itemCount = Array.isArray(order.items) ? order.items.length : (order.itemCount || 0);

            return `
                <tr>
                    <td>${order.id || "-"}</td>
                    <td>${order.customerName || order.userName || order.email || "-"}</td>
                    <td>${money(order.totalAmount || order.total || 0)}</td>
                    <td><span class="admin-badge ${badgeClass}">${statusRaw}</span></td>
                    <td>${itemCount}</td>
                </tr>
            `;
        }).join("");
    }

    function renderUsers() {
        const tbody = document.getElementById("usersTableBody");
        if (!tbody) return;

        if (!state.users.length) {
            tbody.innerHTML = "<tr><td colspan='4' class='text-center'>No users found</td></tr>";
            return;
        }

        tbody.innerHTML = state.users.map((user) => {
            let role = user.role || user.userRole || "USER";
            if (!role && Array.isArray(user.roles) && user.roles.length) {
                role = user.roles.join(", ");
            }

            return `
                <tr>
                    <td>${user.id || "-"}</td>
                    <td>${user.fullName || user.name || "-"}</td>
                    <td>${user.email || "-"}</td>
                    <td>${role}</td>
                </tr>
            `;
        }).join("");
    }

    async function loadProducts() {
        const payload = await requestFirst([
            "/products?size=200&sort=id,desc",
            "/admin/products?size=200&sort=id,desc",
            "/products"
        ]);
        state.products = normalizeCollection(payload);
        renderProducts();
    }

    async function loadOrders() {
        const payload = await requestFirst([
            "/orders?size=200&sort=id,desc",
            "/admin/orders?size=200&sort=id,desc",
            "/orders"
        ]);
        state.orders = normalizeCollection(payload);
        renderOrders();
    }

    async function loadUsers() {
        const payload = await requestFirst([
            "/users?size=200&sort=id,desc",
            "/admin/users?size=200&sort=id,desc",
            "/users"
        ]);
        state.users = normalizeCollection(payload);
        renderUsers();
    }

    function bindPanelTabs() {
        const buttons = Array.from(document.querySelectorAll(".tab-button"));

        buttons.forEach((button) => {
            button.addEventListener("click", () => {
                const panelId = button.getAttribute("data-panel");
                if (!panelId) return;

                buttons.forEach((item) => item.classList.remove("active"));
                button.classList.add("active");

                ["productsPanel", "ordersPanel", "usersPanel"].forEach((id) => {
                    const panel = document.getElementById(id);
                    if (!panel) return;
                    panel.classList.toggle("panel-hidden", id !== panelId);
                });
            });
        });
    }

    function bindActions() {
        const logoutLink = document.getElementById("adminLogoutLink");
        if (logoutLink) {
            logoutLink.addEventListener("click", (event) => {
                event.preventDefault();
                localStorage.removeItem("eshopper_auth_token");
                localStorage.removeItem("eshopper_user");
                window.location.href = "login.html";
            });
        }

        const productForm = document.getElementById("productForm");
        if (productForm) {
            productForm.addEventListener("submit", async (event) => {
                event.preventDefault();

                const id = Number(document.getElementById("productId").value);
                const payload = {
                    name: document.getElementById("productName").value.trim(),
                    price: Number(document.getElementById("productPrice").value),
                    stock: Number(document.getElementById("productStock").value),
                    categoryId: Number(document.getElementById("productCategoryId").value) || null,
                    imageUrl: document.getElementById("productImageUrl").value.trim(),
                    description: document.getElementById("productDescription").value.trim()
                };

                if (!payload.name || !Number.isFinite(payload.price) || !Number.isFinite(payload.stock)) {
                    showMessage("danger", "Name, price and stock are required.");
                    return;
                }

                const saveButton = document.getElementById("saveProductBtn");
                saveButton.disabled = true;

                try {
                    if (Number.isFinite(id) && id > 0) {
                        await requestFirst([
                            `/products/${id}`,
                            `/admin/products/${id}`
                        ], {
                            method: "PUT",
                            body: JSON.stringify(payload)
                        });
                        showMessage("success", `Product #${id} updated`);
                    } else {
                        await requestFirst([
                            "/products",
                            "/admin/products"
                        ], {
                            method: "POST",
                            body: JSON.stringify(payload)
                        });
                        showMessage("success", "Product created");
                    }

                    setProductForm(null);
                    await loadProducts();
                    renderMetrics();
                } catch (error) {
                    showMessage("danger", error.message || "Unable to save product");
                } finally {
                    saveButton.disabled = false;
                }
            });
        }

        const clearProductBtn = document.getElementById("clearProductBtn");
        if (clearProductBtn) {
            clearProductBtn.addEventListener("click", () => {
                setProductForm(null);
                showMessage("info", "Product form cleared");
            });
        }

        const refreshProductsBtn = document.getElementById("refreshProductsBtn");
        if (refreshProductsBtn) {
            refreshProductsBtn.addEventListener("click", async () => {
                try {
                    await loadProducts();
                    renderMetrics();
                    showMessage("success", "Products refreshed");
                } catch (error) {
                    showMessage("danger", error.message || "Unable to load products");
                }
            });
        }

        const refreshOrdersBtn = document.getElementById("refreshOrdersBtn");
        if (refreshOrdersBtn) {
            refreshOrdersBtn.addEventListener("click", async () => {
                try {
                    await loadOrders();
                    renderMetrics();
                    showMessage("success", "Orders refreshed");
                } catch (error) {
                    showMessage("danger", error.message || "Unable to load orders");
                }
            });
        }

        const refreshUsersBtn = document.getElementById("refreshUsersBtn");
        if (refreshUsersBtn) {
            refreshUsersBtn.addEventListener("click", async () => {
                try {
                    await loadUsers();
                    showMessage("success", "Users refreshed");
                } catch (error) {
                    showMessage("danger", error.message || "Unable to load users");
                }
            });
        }
    }

    async function bootstrap() {
        const token = getToken();
        const user = getStoredUser();

        if (!token) {
            window.location.href = "login.html";
            return;
        }

        if (!isAdminUser(user)) {
            showMessage("danger", "Admin access only.");
            setTimeout(() => {
                window.location.href = "index.html";
            }, 1200);
            return;
        }

        renderTopUser();
        bindPanelTabs();
        bindActions();

        try {
            await Promise.all([loadProducts(), loadOrders(), loadUsers()]);
            renderMetrics();
            showMessage("success", "Admin panel loaded");
        } catch (error) {
            showMessage("danger", error.message || "Failed to load admin data");
        }
    }

    document.addEventListener("DOMContentLoaded", bootstrap);
})();
