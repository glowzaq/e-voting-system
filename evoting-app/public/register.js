class RegisterService {
    constructor(apiUrl) {
        this.apiUrl = apiUrl;
    }

    async register(firstName, lastName, nationalId, email, password) {
        const response = await fetch(`${this.apiUrl}/register`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ firstName, lastName, nationalId, email, password }),
        });

        return response.json();
    }
}

const registerService = new RegisterService("http://localhost:3000");

document.getElementById("registerForm").addEventListener("submit", async function (e) {
    e.preventDefault();

    const firstName = document.getElementById("firstName").value.trim();
    const lastName = document.getElementById("lastName").value.trim();
    const email = document.getElementById("email").value.trim();
    const nationalId = document.getElementById("nationalId").value.trim();
    const dob = document.getElementById("dob").value;
    const password = document.getElementById("password").value;
    const confirmPassword = document.getElementById("confirmPassword").value;

    try {
        if (password !== confirmPassword) {
            return alerts.error("Passwords do not match.");
        }

        if (!/^\d{10}$/.test(nationalId)) {
            return alerts.error("National ID must be exactly 10 digits.");
        }

        if (dob) {
            const birthDate = new Date(dob);
            const today = new Date();
            let age = today.getFullYear() - birthDate.getFullYear();
            const monthDiff = today.getMonth() - birthDate.getMonth();
            if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
                age--;
            }
            if (age < 18) {
                return alerts.error("You must be at least 18 years old to register.");
            }
        }

        const response = await fetch("http://localhost:3000/register", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                firstName,
                lastName,
                nationalId,
                email,
                password,
            }),
        });

        const data = await response.json();

        if (!response.ok) {
            return alerts.error(data.error || "Registration failed.");
        }

        const loginResponse = await fetch("http://localhost:3000/login", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ email, password }),
        });

        const loginData = await loginResponse.json();

        if (loginResponse.ok && loginData.user) {
            localStorage.setItem("loggedInUser", JSON.stringify(loginData.user));
            await alerts.success(`Registration successful!<br>Your Voter ID: <strong>${data.voterId}</strong><br>Redirecting to dashboard...`);
            window.location.href = "/dashboard";
            return;
        }

        await alerts.success(`Registration successful!<br>Your Voter ID: <strong>${data.voterId}</strong><br>Redirecting to login...`);
        window.location.href = "/login.html";
    } catch (error) {
        console.error(error);
        alerts.error("Server error. Please try again.");
    }
});
