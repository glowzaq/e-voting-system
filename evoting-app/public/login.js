const loggedInUser = JSON.parse(localStorage.getItem("loggedInUser"));

if (loggedInUser) {
    window.location.href = "/dashboard";
}

class LoginService {
    constructor(apiUrl) {
        this.apiUrl = apiUrl;
    }

    async login(email, password) {
        const response = await fetch(`${this.apiUrl}/login`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ email, password }),
        });

        const data = await response.json();

        if (!response.ok) {
            return {
                error: data.error || "Login failed",
                user: null,
            };
        }

        return {
            error: null,
            user: data.user,
        };
    }
}

const loginService = new LoginService("http://localhost:3000");

document.getElementById("loginForm").addEventListener("submit", async function (e) {
    e.preventDefault();

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;
    const message = document.getElementById("loginMessage");

    const data = await loginService.login(email, password);

    if (data.error) {
        message.textContent = data.error;
        message.className = "mt-3 text-center text-danger";
        return;
    }

    localStorage.setItem("loggedInUser", JSON.stringify(data.user));

    message.textContent = "Login successful. Redirecting...";
    message.className = "mt-3 text-center text-success";

    setTimeout(() => {
        window.location.href = "/dashboard";
    }, 1000);
});