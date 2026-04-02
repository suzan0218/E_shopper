(function ($) {
    "use strict";

    const API_BASE = "http://localhost:8080/api";
    const CART_KEY = "eshopper_cart";
    const SHIPPING_FEE = 10;

    const page = (window.location.pathname.split("/").pop() || "index.html").toLowerCase();

    function formatPrice(value) {
        return "$" + Number(value || 0).toFixed(2);
    }

    function parseNumber(value, fallback) {
        const parsed = Number(value);
        return Number.isFinite(parsed) ? parsed : fallback;
    }

    function getStoredUser() {
        try {
            const raw = localStorage.getItem("eshopper_user");
            return raw ? JSON.parse(raw) : null;
        } catch (error) {
            return null;
        }
    }

    function isAdminUser(user) {
        if (!user || typeof user !== "object") {
            return false;
        }

        const roleValue = (user.role || user.userRole || "").toString().toLowerCase();
        if (roleValue.includes("admin")) {
            return true;
        }

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

    function initAuthLinks() {
        const navWrap = document.querySelector(".navbar-nav.ml-auto.py-0");
        if (!navWrap) {
            return;
        }

        const token = localStorage.getItem("eshopper_auth_token");
        const user = getStoredUser();

        if (!token) {
            navWrap.innerHTML = ""
                + '<a href="login.html" class="nav-item nav-link">Login</a>'
                + '<a href="register.html" class="nav-item nav-link">Register</a>';
            return;
        }

        const adminLink = isAdminUser(user)
            ? '<a href="admin.html" class="nav-item nav-link">Admin</a>'
            : "";
        const displayName = (user && (user.fullName || user.name || user.email)) ? (user.fullName || user.name || user.email) : "My Account";

        navWrap.innerHTML = ""
            + adminLink
            + `<a href="#" class="nav-item nav-link">${displayName}</a>`
            + '<a href="#" class="nav-item nav-link" id="logoutLink">Logout</a>';

        const logoutLink = document.getElementById("logoutLink");
        if (logoutLink) {
            logoutLink.addEventListener("click", (event) => {
                event.preventDefault();
                localStorage.removeItem("eshopper_auth_token");
                localStorage.removeItem("eshopper_user");
                window.location.href = "login.html";
            });
        }
    }

    function getCart() {
        try {
            const raw = localStorage.getItem(CART_KEY);
            const parsed = raw ? JSON.parse(raw) : [];
            return Array.isArray(parsed) ? parsed : [];
        } catch (error) {
            return [];
        }
    }

    function setCart(cart) {
        localStorage.setItem(CART_KEY, JSON.stringify(cart));
        updateCartBadge();
    }

    function addToCart(product, qty) {
        const quantity = Math.max(1, parseInt(qty, 10) || 1);
        const cart = getCart();
        const existing = cart.find((item) => item.id === product.id);

        if (existing) {
            const stock = parseInt(product.stock || existing.stock || 9999, 10);
            existing.quantity = Math.min(existing.quantity + quantity, stock);
        } else {
            cart.push({
                id: product.id,
                name: product.name,
                imageUrl: product.imageUrl,
                price: parseNumber(product.price, 0),
                quantity,
                stock: parseInt(product.stock || 9999, 10)
            });
        }

        setCart(cart);
    }

    function updateCartBadge() {
        const count = getCart().reduce((sum, item) => sum + item.quantity, 0);
        const cartButtons = document.querySelectorAll("a.btn.border");

        cartButtons.forEach((button) => {
            const icon = button.querySelector("i");
            const badge = button.querySelector("span.badge");
            if (!icon || !badge) {
                return;
            }

            if (icon.classList.contains("fa-shopping-cart")) {
                badge.textContent = String(count);
                button.setAttribute("href", "cart.html");
            }

            if (icon.classList.contains("fa-heart")) {
                button.setAttribute("href", "#");
            }
        });
    }

    function fetchJson(path, options) {
        return fetch(API_BASE + path, options).then(async (response) => {
            const payload = await response.json().catch(() => ({}));
            if (!response.ok) {
                throw new Error(payload.message || "Request failed");
            }
            return payload;
        });
    }

    function getProductCard(product, cols) {
        const originalPriceHtml = product.originalPrice && Number(product.originalPrice) > Number(product.price)
            ? `<h6 class="text-muted ml-2"><del>${formatPrice(product.originalPrice)}</del></h6>`
            : "";

        return `
            <div class="${cols}">
                <div class="card product-item border-0 mb-4">
                    <div class="card-header product-img position-relative overflow-hidden bg-transparent border p-0">
                        <img class="img-fluid w-100" src="${product.imageUrl || "img/product-1.jpg"}" alt="${product.name}">
                    </div>
                    <div class="card-body border-left border-right text-center p-0 pt-4 pb-3">
                        <h6 class="text-truncate mb-3">${product.name}</h6>
                        <div class="d-flex justify-content-center">
                            <h6>${formatPrice(product.price)}</h6>${originalPriceHtml}
                        </div>
                    </div>
                    <div class="card-footer d-flex justify-content-between bg-light border">
                        <a href="detail.html?id=${product.id}" class="btn btn-sm text-dark p-0"><i class="fas fa-eye text-primary mr-1"></i>View Detail</a>
                        <a href="#" class="btn btn-sm text-dark p-0 js-add-to-cart" data-id="${product.id}"><i class="fas fa-shopping-cart text-primary mr-1"></i>Add To Cart</a>
                    </div>
                </div>
            </div>
        `;
    }

    function bindAddToCart(container, productsById) {
        container.querySelectorAll(".js-add-to-cart").forEach((button) => {
            button.addEventListener("click", (event) => {
                event.preventDefault();
                const id = Number(button.getAttribute("data-id"));
                const product = productsById.get(id);
                if (!product) {
                    return;
                }
                addToCart(product, 1);
                alert("Added to cart");
            });
        });
    }

    async function initNavbarCategories() {
        const nav = document.querySelector("#navbar-vertical .navbar-nav");
        if (!nav) return;

        const categories = await fetchJson("/categories");
        if (!Array.isArray(categories) || !categories.length) return;

        nav.innerHTML = categories.map((category) => (
            `<a href="shop.html?categoryId=${category.id}" class="nav-item nav-link">${category.name}</a>`
        )).join("");
    }

    function initCommonUi() {
        $(document).ready(function () {
            function toggleNavbarMethod() {
                if ($(window).width() > 992) {
                    $('.navbar .dropdown').on('mouseover', function () {
                        $('.dropdown-toggle', this).trigger('click');
                    }).on('mouseout', function () {
                        $('.dropdown-toggle', this).trigger('click').blur();
                    });
                } else {
                    $('.navbar .dropdown').off('mouseover').off('mouseout');
                }
            }
            toggleNavbarMethod();
            $(window).resize(toggleNavbarMethod);
        });

        $(window).scroll(function () {
            if ($(this).scrollTop() > 100) {
                $('.back-to-top').fadeIn('slow');
            } else {
                $('.back-to-top').fadeOut('slow');
            }
        });
        $('.back-to-top').click(function () {
            $('html, body').animate({ scrollTop: 0 }, 1500, 'easeInOutExpo');
            return false;
        });

        if ($('.vendor-carousel').length) {
            $('.vendor-carousel').owlCarousel({
                loop: true,
                margin: 29,
                nav: false,
                autoplay: true,
                smartSpeed: 1000,
                responsive: { 0: { items: 2 }, 576: { items: 3 }, 768: { items: 4 }, 992: { items: 5 }, 1200: { items: 6 } }
            });
        }

        if ($('.related-carousel').length) {
            $('.related-carousel').owlCarousel({
                loop: true,
                margin: 29,
                nav: false,
                autoplay: true,
                smartSpeed: 1000,
                responsive: { 0: { items: 1 }, 576: { items: 2 }, 768: { items: 3 }, 992: { items: 4 } }
            });
        }
    }

    async function initShopPage() {
        const root = document.querySelector(".col-lg-9 .row.pb-3");
        if (!root) return;

        const topBar = root.querySelector(".col-12.pb-1");
        const searchInput = topBar.querySelector("input.form-control");
        const searchForm = searchInput.closest("form");
        const sortMenu = topBar.querySelector(".dropdown-menu");
        const sortButton = topBar.querySelector("#triggerId");

        sortMenu.innerHTML = ""
            + '<a class="dropdown-item" href="#" data-sort="id,desc">Latest</a>'
            + '<a class="dropdown-item" href="#" data-sort="reviewCount,desc">Popularity</a>'
            + '<a class="dropdown-item" href="#" data-sort="rating,desc">Best Rating</a>'
            + '<a class="dropdown-item" href="#" data-sort="price,asc">Price: Low to High</a>'
            + '<a class="dropdown-item" href="#" data-sort="price,desc">Price: High to Low</a>';

        const initialCategoryId = Number(new URLSearchParams(window.location.search).get("categoryId"));
        const state = {
            page: 0,
            size: 9,
            sort: "id,desc",
            search: "",
            categoryId: Number.isFinite(initialCategoryId) ? initialCategoryId : null,
            minPrice: null,
            maxPrice: null
        };

        function getSelectedPriceRange() {
            const ranges = [
                { id: "price-1", min: 0, max: 100 },
                { id: "price-2", min: 100, max: 200 },
                { id: "price-3", min: 200, max: 300 },
                { id: "price-4", min: 300, max: 400 },
                { id: "price-5", min: 400, max: 500 }
            ];
            const selected = ranges.find((range) => {
                const checkbox = document.getElementById(range.id);
                return checkbox && checkbox.checked;
            });
            return selected || null;
        }

        ["price-1", "price-2", "price-3", "price-4", "price-5"].forEach((id) => {
            const checkbox = document.getElementById(id);
            if (!checkbox) return;
            checkbox.addEventListener("change", () => {
                if (checkbox.checked) {
                    ["price-all", "price-1", "price-2", "price-3", "price-4", "price-5"].forEach((otherId) => {
                        if (otherId !== id) {
                            const other = document.getElementById(otherId);
                            if (other) other.checked = false;
                        }
                    });
                }
                state.page = 0;
                loadProducts();
            });
        });

        const allPrice = document.getElementById("price-all");
        if (allPrice) {
            allPrice.addEventListener("change", () => {
                if (allPrice.checked) {
                    ["price-1", "price-2", "price-3", "price-4", "price-5"].forEach((id) => {
                        const c = document.getElementById(id);
                        if (c) c.checked = false;
                    });
                }
                state.page = 0;
                loadProducts();
            });
        }

        sortMenu.querySelectorAll(".dropdown-item").forEach((item) => {
            item.addEventListener("click", (event) => {
                event.preventDefault();
                state.sort = item.getAttribute("data-sort");
                state.page = 0;
                sortButton.textContent = item.textContent;
                loadProducts();
            });
        });

        searchForm.addEventListener("submit", (event) => {
            event.preventDefault();
            state.search = searchInput.value.trim();
            state.page = 0;
            loadProducts();
        });

        async function loadProducts() {
            const range = getSelectedPriceRange();
            state.minPrice = range ? range.min : null;
            state.maxPrice = range ? range.max : null;

            const query = new URLSearchParams();
            query.set("page", String(state.page));
            query.set("size", String(state.size));
            query.set("sort", state.sort);
            if (state.search) query.set("search", state.search);
            if (state.categoryId !== null) query.set("categoryId", String(state.categoryId));
            if (state.minPrice !== null) query.set("minPrice", String(state.minPrice));
            if (state.maxPrice !== null) query.set("maxPrice", String(state.maxPrice));

            const data = await fetchJson(`/products?${query.toString()}`);
            const products = data.content || [];
            const productsById = new Map(products.map((p) => [p.id, p]));

            root.innerHTML = "";
            root.appendChild(topBar);

            if (!products.length) {
                const empty = document.createElement("div");
                empty.className = "col-12";
                empty.innerHTML = "<div class='alert alert-warning'>No products found.</div>";
                root.appendChild(empty);
                return;
            }

            const cardsHtml = products.map((p) => getProductCard(p, "col-lg-4 col-md-6 col-sm-12 pb-1")).join("");
            const temp = document.createElement("div");
            temp.innerHTML = cardsHtml;
            Array.from(temp.children).forEach((child) => root.appendChild(child));

            const pagination = document.createElement("div");
            pagination.className = "col-12 pb-1";

            const totalPages = data.totalPages || 1;
            let pagesHtml = "";
            for (let i = 0; i < totalPages; i += 1) {
                pagesHtml += `<li class="page-item ${i === state.page ? "active" : ""}"><a class="page-link" href="#" data-page="${i}">${i + 1}</a></li>`;
            }

            pagination.innerHTML = `
                <nav aria-label="Page navigation">
                  <ul class="pagination justify-content-center mb-3">
                    <li class="page-item ${state.page === 0 ? "disabled" : ""}">
                      <a class="page-link" href="#" data-page="${state.page - 1}" aria-label="Previous"><span aria-hidden="true">&laquo;</span></a>
                    </li>
                    ${pagesHtml}
                    <li class="page-item ${state.page >= totalPages - 1 ? "disabled" : ""}">
                      <a class="page-link" href="#" data-page="${state.page + 1}" aria-label="Next"><span aria-hidden="true">&raquo;</span></a>
                    </li>
                  </ul>
                </nav>
            `;
            root.appendChild(pagination);

            pagination.querySelectorAll("a.page-link").forEach((link) => {
                link.addEventListener("click", (event) => {
                    event.preventDefault();
                    const newPage = parseInt(link.getAttribute("data-page"), 10);
                    if (!Number.isFinite(newPage) || newPage < 0 || newPage >= totalPages || newPage === state.page) {
                        return;
                    }
                    state.page = newPage;
                    loadProducts();
                });
            });

            bindAddToCart(root, productsById);
        }

        await loadProducts();
    }

    async function initDetailPage() {
        const query = new URLSearchParams(window.location.search);
        const id = query.get("id") || "1";

        const title = document.querySelector(".col-lg-7.pb-5 h3.font-weight-semi-bold");
        if (!title) return;

        const priceElement = document.querySelector(".col-lg-7.pb-5 h3.font-weight-semi-bold.mb-4");
        const description = document.querySelector(".col-lg-7.pb-5 p.mb-4");
        const addButton = document.querySelector(".col-lg-7.pb-5 button.btn.btn-primary.px-3");
        const qtyInput = document.querySelector(".col-lg-7.pb-5 .quantity input");
        const carouselInner = document.querySelector("#product-carousel .carousel-inner");

        const product = await fetchJson(`/products/${id}`);

        title.textContent = product.name;
        priceElement.textContent = formatPrice(product.price);
        description.textContent = product.description || "No description available.";

        if (carouselInner) {
            carouselInner.innerHTML = `
                <div class="carousel-item active"><img class="w-100 h-100" src="${product.imageUrl || "img/product-1.jpg"}" alt="${product.name}"></div>
                <div class="carousel-item"><img class="w-100 h-100" src="${product.imageUrl || "img/product-1.jpg"}" alt="${product.name}"></div>
                <div class="carousel-item"><img class="w-100 h-100" src="${product.imageUrl || "img/product-1.jpg"}" alt="${product.name}"></div>
            `;
        }

        if (addButton) {
            addButton.addEventListener("click", () => {
                addToCart(product, parseInt(qtyInput.value, 10) || 1);
                alert("Added to cart");
            });
        }

        const relatedWrap = document.querySelector(".related-carousel");
        if (relatedWrap) {
            const data = await fetchJson("/products?size=8&sort=rating,desc");
            const related = (data.content || []).filter((p) => p.id !== product.id).slice(0, 6);
            const byId = new Map(related.map((p) => [p.id, p]));

            relatedWrap.innerHTML = related.map((p) => `
                <div class="card product-item border-0">
                    <div class="card-header product-img position-relative overflow-hidden bg-transparent border p-0">
                        <img class="img-fluid w-100" src="${p.imageUrl || "img/product-1.jpg"}" alt="${p.name}">
                    </div>
                    <div class="card-body border-left border-right text-center p-0 pt-4 pb-3">
                        <h6 class="text-truncate mb-3">${p.name}</h6>
                        <div class="d-flex justify-content-center">
                            <h6>${formatPrice(p.price)}</h6>
                        </div>
                    </div>
                    <div class="card-footer d-flex justify-content-between bg-light border">
                        <a href="detail.html?id=${p.id}" class="btn btn-sm text-dark p-0"><i class="fas fa-eye text-primary mr-1"></i>View Detail</a>
                        <a href="#" class="btn btn-sm text-dark p-0 js-add-to-cart" data-id="${p.id}"><i class="fas fa-shopping-cart text-primary mr-1"></i>Add To Cart</a>
                    </div>
                </div>
            `).join("");

            if (relatedWrap.classList.contains("owl-loaded")) {
                relatedWrap.classList.remove("owl-loaded");
                relatedWrap.outerHTML = relatedWrap.outerHTML;
            }

            $('.related-carousel').owlCarousel({
                loop: true,
                margin: 29,
                nav: false,
                autoplay: true,
                smartSpeed: 1000,
                responsive: { 0: { items: 1 }, 576: { items: 2 }, 768: { items: 3 }, 992: { items: 4 } }
            });

            bindAddToCart(document, byId);
        }
    }

    function renderCartSummary(root, subtotal) {
        const shipping = subtotal > 0 ? SHIPPING_FEE : 0;
        const total = subtotal + shipping;

        const values = root.querySelectorAll(".card-body h6.font-weight-medium, .card-footer h5.font-weight-bold");
        if (values.length >= 5) {
            values[1].textContent = formatPrice(subtotal);
            values[3].textContent = formatPrice(shipping);
            values[4].textContent = formatPrice(total);
        }

        return { shipping, total };
    }

    function initCartPage() {
        const tbody = document.querySelector("table tbody.align-middle");
        if (!tbody) return;

        const summaryCard = document.querySelector(".card.border-secondary.mb-5");
        const proceedBtn = summaryCard ? summaryCard.querySelector("button.btn.btn-block") : null;
        if (proceedBtn) {
            proceedBtn.addEventListener("click", () => {
                window.location.href = "checkout.html";
            });
        }

        function render() {
            const cart = getCart();
            tbody.innerHTML = "";

            if (!cart.length) {
                tbody.innerHTML = "<tr><td colspan='5' class='text-center'>Your cart is empty</td></tr>";
                renderCartSummary(summaryCard, 0);
                return;
            }

            let subtotal = 0;
            cart.forEach((item) => {
                const lineTotal = item.price * item.quantity;
                subtotal += lineTotal;

                const row = document.createElement("tr");
                row.innerHTML = `
                    <td class="align-middle"><img src="${item.imageUrl || "img/product-1.jpg"}" alt="" style="width: 50px;"> ${item.name}</td>
                    <td class="align-middle">${formatPrice(item.price)}</td>
                    <td class="align-middle">
                        <div class="input-group quantity mx-auto" style="width: 100px;">
                            <div class="input-group-btn">
                                <button class="btn btn-sm btn-primary btn-minus"><i class="fa fa-minus"></i></button>
                            </div>
                            <input type="text" class="form-control form-control-sm bg-secondary text-center" value="${item.quantity}">
                            <div class="input-group-btn">
                                <button class="btn btn-sm btn-primary btn-plus"><i class="fa fa-plus"></i></button>
                            </div>
                        </div>
                    </td>
                    <td class="align-middle">${formatPrice(lineTotal)}</td>
                    <td class="align-middle"><button class="btn btn-sm btn-primary btn-remove"><i class="fa fa-times"></i></button></td>
                `;

                row.querySelector(".btn-minus").addEventListener("click", () => {
                    item.quantity = Math.max(1, item.quantity - 1);
                    setCart(cart);
                    render();
                });

                row.querySelector(".btn-plus").addEventListener("click", () => {
                    item.quantity = Math.min(item.quantity + 1, item.stock || 9999);
                    setCart(cart);
                    render();
                });

                row.querySelector(".btn-remove").addEventListener("click", () => {
                    const next = cart.filter((c) => c.id !== item.id);
                    setCart(next);
                    render();
                });

                tbody.appendChild(row);
            });

            renderCartSummary(summaryCard, subtotal);
        }

        render();
    }

    function findFormValueByLabel(section, labelText) {
        const groups = section.querySelectorAll(".form-group");
        for (let i = 0; i < groups.length; i += 1) {
            const label = groups[i].querySelector("label");
            const input = groups[i].querySelector("input, select, textarea");
            if (label && input && label.textContent.trim().toLowerCase() === labelText.toLowerCase()) {
                return (input.value || "").trim();
            }
        }
        return "";
    }

    function initCheckoutPage() {
        const placeOrderBtn = document.querySelector(".card-footer .btn.btn-lg.btn-block");
        if (!placeOrderBtn) return;

        const billingSection = document.querySelector(".col-lg-8 .mb-4");
        const orderCard = document.querySelector(".col-lg-4 .card.border-secondary.mb-5");

        function renderOrderPreview() {
            const cart = getCart();
            const productsArea = orderCard.querySelector(".card-body");
            if (!productsArea) return;

            const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
            const shipping = subtotal > 0 ? SHIPPING_FEE : 0;
            const total = subtotal + shipping;

            const productsHtml = cart.length
                ? cart.map((item) => `<div class="d-flex justify-content-between"><p>${item.name} x ${item.quantity}</p><p>${formatPrice(item.price * item.quantity)}</p></div>`).join("")
                : "<p>Your cart is empty</p>";

            productsArea.innerHTML = `
                <h5 class="font-weight-medium mb-3">Products</h5>
                ${productsHtml}
                <hr class="mt-0">
                <div class="d-flex justify-content-between mb-3 pt-1"><h6 class="font-weight-medium">Subtotal</h6><h6 class="font-weight-medium">${formatPrice(subtotal)}</h6></div>
                <div class="d-flex justify-content-between"><h6 class="font-weight-medium">Shipping</h6><h6 class="font-weight-medium">${formatPrice(shipping)}</h6></div>
            `;

            const totalWrap = orderCard.querySelector(".card-footer.border-secondary.bg-transparent");
            if (totalWrap) {
                totalWrap.innerHTML = `<div class="d-flex justify-content-between mt-2"><h5 class="font-weight-bold">Total</h5><h5 class="font-weight-bold">${formatPrice(total)}</h5></div>`;
            }
        }

        renderOrderPreview();

        placeOrderBtn.addEventListener("click", async () => {
            const cart = getCart();
            if (!cart.length) {
                alert("Cart is empty");
                return;
            }

            const firstName = findFormValueByLabel(billingSection, "First Name");
            const lastName = findFormValueByLabel(billingSection, "Last Name");
            const email = findFormValueByLabel(billingSection, "E-mail");
            const phone = findFormValueByLabel(billingSection, "Mobile No");
            const address1 = findFormValueByLabel(billingSection, "Address Line 1");
            const address2 = findFormValueByLabel(billingSection, "Address Line 2");
            const country = findFormValueByLabel(billingSection, "Country");
            const city = findFormValueByLabel(billingSection, "City");
            const state = findFormValueByLabel(billingSection, "State");
            const zip = findFormValueByLabel(billingSection, "ZIP Code");

            if (!firstName || !email || !phone || !address1) {
                alert("Please fill required billing fields");
                return;
            }

            const payload = {
                customerName: `${firstName} ${lastName}`.trim(),
                email,
                phone,
                addressLine: [address1, address2, city, state, zip, country].filter(Boolean).join(", "),
                notes: "Order from frontend checkout",
                items: cart.map((item) => ({ productId: item.id, quantity: item.quantity }))
            };

            try {
                placeOrderBtn.disabled = true;
                const response = await fetchJson("/orders", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload)
                });
                localStorage.removeItem(CART_KEY);
                updateCartBadge();
                alert(`Order placed successfully. Order ID: ${response.orderId}`);
                window.location.href = "shop.html";
            } catch (error) {
                alert(error.message || "Unable to place order");
            } finally {
                placeOrderBtn.disabled = false;
            }
        });
    }

    async function initIndexPage() {
        const sections = document.querySelectorAll(".container-fluid.pt-5 .row.px-xl-5.pb-3");
        if (sections.length < 3) return;

        const categoryRow = sections[0];
        const trandyRow = sections[1];
        const arrivedRow = sections[2];

        const [categoriesData, trendyData, arrivedData] = await Promise.all([
            fetchJson("/categories"),
            fetchJson("/products?size=8&sort=rating,desc"),
            fetchJson("/products?size=8&sort=id,desc")
        ]);

        const categories = (categoriesData || []).slice(0, 6);
        categoryRow.innerHTML = categories.map((cat, index) => `
            <div class="col-lg-4 col-md-6 pb-1">
                <div class="cat-item d-flex flex-column border mb-4" style="padding: 30px;">
                    <p class="text-right">Products</p>
                    <a href="shop.html" class="cat-img position-relative overflow-hidden mb-3">
                        <img class="img-fluid" src="img/cat-${(index % 6) + 1}.jpg" alt="${cat.name}">
                    </a>
                    <h5 class="font-weight-semi-bold m-0">${cat.name}</h5>
                </div>
            </div>
        `).join("");

        const trendyProducts = trendyData.content || [];
        const arrivedProducts = arrivedData.content || [];
        const byId = new Map([...trendyProducts, ...arrivedProducts].map((p) => [p.id, p]));

        trandyRow.innerHTML = trendyProducts.slice(0, 8).map((p) => getProductCard(p, "col-lg-3 col-md-6 col-sm-12 pb-1")).join("");
        arrivedRow.innerHTML = arrivedProducts.slice(0, 8).map((p) => getProductCard(p, "col-lg-3 col-md-6 col-sm-12 pb-1")).join("");

        bindAddToCart(document, byId);
    }

    async function initPage() {
        updateCartBadge();
        initCommonUi();
        initAuthLinks();

        try {
            await initNavbarCategories();
            if (page === "index.html" || page === "") await initIndexPage();
            if (page === "shop.html") await initShopPage();
            if (page === "detail.html") await initDetailPage();
            if (page === "cart.html") initCartPage();
            if (page === "checkout.html") initCheckoutPage();
        } catch (error) {
            console.error(error);
            const message = (error && error.message) ? error.message : "Unexpected API error";
            alert(`API request failed: ${message}. Backend base URL: ${API_BASE}`);
        }
    }

    initPage();
})(jQuery);
