const loggedInUser = JSON.parse(localStorage.getItem("loggedInUser"));

const loginButton = document.getElementById("loginButton");
const registerButton = document.getElementById("registerButton");
const dashboardButton = document.getElementById("dashboardButton");

const heroLoginButton = document.getElementById("heroLoginButton");
const heroRegisterButton = document.getElementById("heroRegisterButton");

const footerLoginButton = document.getElementById("footerLoginButton");
const footerRegisterButton = document.getElementById("footerRegisterButton");

if (footerLoginButton) {
    footerLoginButton.addEventListener("click", goToLogin);
}

if (footerRegisterButton) {
    footerRegisterButton.addEventListener("click", goToRegister);
}
if (loggedInUser && dashboardButton) {
    dashboardButton.classList.remove("d-none");
}

function goToLogin() {
    window.location.href = "/login.html";
}

function goToRegister() {
    window.location.href = "/register.html";
}

function goToDashboard() {
    window.location.href = "/dashboard";
}

if (loginButton) {
    loginButton.addEventListener("click", goToLogin);
}

if (registerButton) {
    registerButton.addEventListener("click", goToRegister);
}

if (dashboardButton) {
    dashboardButton.addEventListener("click", goToDashboard);
}

if (heroLoginButton) {
    heroLoginButton.addEventListener("click", goToLogin);
}

if (heroRegisterButton) {
    heroRegisterButton.addEventListener("click", goToRegister);
}