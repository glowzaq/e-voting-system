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
    const password = document.getElementById("password").value;
    const confirmPassword = document.getElementById("confirmPassword").value;

    const message = document.getElementById("registerMessage");

    try {
        // validate password match
        if (password !== confirmPassword) {
            message.textContent = "Passwords do not match";
            message.className = "text-danger mt-3";
            return;
        }

        // validate national ID (exactly 10 digits)
        if (!/^\d{10}$/.test(nationalId)) {
            message.textContent = "National ID must be exactly 10 digits";
            message.className = "text-danger mt-3";
            return;
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
            message.textContent = data.error || "Registration failed";
            message.className = "text-danger mt-3";
            return;
        }

        message.innerHTML = `
            Registration successful!<br>
            Your Voter ID: <strong>${data.voterId}</strong>
    `;
        message.className = "text-success mt-3";

    } catch (error) {
        console.error(error);

        message.textContent = "Server error. Please try again.";
        message.className = "text-danger mt-3";
    }
});