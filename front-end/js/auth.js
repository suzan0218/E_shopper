(function () {
    function normalizeApiBase(value) {
        return String(value || "").trim().replace(/\/+$/, "");
    }

    function collectApiBases() {
        const configured = normalizeApiBase(window.ESHOPPER_API_BASE);
        const stored = normalizeApiBase(localStorage.getItem("eshopper_api_base"));
        const origin = window.location.origin;

        return [configured, stored, `${origin}/api`, `${origin}/demo/api`, "http://localhost:8080/api", "http://127.0.0.1:8080/api"]
            .filter(Boolean)
            .filter(function (item, index, list) {
                return list.indexOf(item) === index;
            });
    }

    let API_BASE = collectApiBases()[0];

    function isAdminUser(user) {
        if (!user || typeof user !== "object") {
            return false;
        }

        const roleValue = (user.role || user.userRole || "").toString().toLowerCase();
        if (roleValue.includes("admin")) {
            return true;
        }

        if (Array.isArray(user.roles) && user.roles.some(function (role) {
            return String(role).toLowerCase().includes("admin");
        })) {
            return true;
        }

        if (Array.isArray(user.authorities) && user.authorities.some(function (authority) {
            const value = (authority && authority.authority) ? authority.authority : authority;
            return String(value).toLowerCase().includes("admin");
        })) {
            return true;
        }

        return false;
    }

    function showMessage(type, text) {
        const container = document.getElementById("authMessage");
        if (!container) {
            return;
        }

        container.innerHTML = "<div class='alert alert-" + type + "'>" + text + "</div>";
    }

    async function parseResponse(response) {
        const payload = await response.json().catch(() => ({}));
        if (!response.ok) {
            const error = new Error(payload.message || ("Request failed (" + response.status + ")"));
            error.status = response.status;
            throw error;
        }
        return payload;
    }

    async function requestWithFallback(path, options) {
        const bases = collectApiBases();
        if (API_BASE) {
            bases.sort(function (a, b) {
                return a === API_BASE ? -1 : (b === API_BASE ? 1 : 0);
            });
        }

        let lastError = null;
        for (let i = 0; i < bases.length; i += 1) {
            const base = bases[i];
            try {
                const response = await fetch(base + path, options);
                const payload = await parseResponse(response);
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
        throw new Error(reason + ". Checked API bases: " + bases.join(", "));
    }

    async function submitLogin(event) {
        event.preventDefault();

        const email = document.getElementById("email").value.trim();
        const password = document.getElementById("password").value;
        const button = document.getElementById("loginButton");

        button.disabled = true;
        showMessage("info", "Signing in...");

        try {
            const payload = await requestWithFallback("/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: email, password: password })
            });

            if (payload.token) {
                localStorage.setItem("eshopper_auth_token", payload.token);
            }

            if (payload.user) {
                localStorage.setItem("eshopper_user", JSON.stringify(payload.user));
            }

            const adminUser = isAdminUser(payload.user);
            showMessage("success", payload.message || "Login successful. Redirecting...");
            setTimeout(function () {
                window.location.href = adminUser ? "admin.html" : "index.html";
            }, 900);
        } catch (error) {
            showMessage("danger", error.message || "Login failed");
        } finally {
            button.disabled = false;
        }
    }

    async function submitRegister(event) {
        event.preventDefault();

        const name = document.getElementById("name").value.trim();
        const email = document.getElementById("email").value.trim();
        const password = document.getElementById("password").value;
        const confirmPassword = document.getElementById("confirmPassword").value;
        const button = document.getElementById("registerButton");

        if (password !== confirmPassword) {
            showMessage("danger", "Passwords do not match.");
            return;
        }

        button.disabled = true;
        showMessage("info", "Creating account...");

        try {
            const payload = await requestWithFallback("/auth/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: name,
                    fullName: name,
                    email: email,
                    password: password
                })
            });

            showMessage("success", payload.message || "Registration successful. Redirecting to login...");
            setTimeout(function () {
                window.location.href = "login.html";
            }, 1000);
        } catch (error) {
            showMessage("danger", error.message || "Registration failed");
        } finally {
            button.disabled = false;
        }
    }

    document.addEventListener("DOMContentLoaded", function () {
        const loginForm = document.getElementById("loginForm");
        const registerForm = document.getElementById("registerForm");

        if (loginForm) {
            loginForm.addEventListener("submit", submitLogin);
        }

        if (registerForm) {
            registerForm.addEventListener("submit", submitRegister);
        }
    });
})();
