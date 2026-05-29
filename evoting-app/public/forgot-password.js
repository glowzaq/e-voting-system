document.getElementById("forgotPasswordForm").addEventListener("submit", async function (e) {
    e.preventDefault();

    const email = document.getElementById("email").value.trim();
    const nationalId = document.getElementById("nationalId").value.trim();
    const newPassword = document.getElementById("newPassword").value;
    const confirmPassword = document.getElementById("confirmPassword").value;

    if (newPassword !== confirmPassword) {
        return alerts.error("Passwords do not match.");
    }

    if (newPassword.length < 8) {
        return alerts.error("Password must be at least 8 characters.");
    }

    try {
        const response = await fetch("/forgot-password", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ email, nationalId, password: newPassword }),
        });

        const data = await response.json();
        if (!response.ok) {
            return alerts.error(data.error || "Reset failed.");
        }

        await alerts.success("Password reset successful. Redirecting to login...");
        window.location.href = "/login.html";
    } catch (error) {
        console.error(error);
        alerts.error("Server error. Please try again.");
    }
});
