// Show register form
function showRegister() {
    document.getElementById("loginBox").classList.add("hidden");
    document.getElementById("registerBox").classList.remove("hidden");
}

// Show login form
function showLogin() {
    document.getElementById("registerBox").classList.add("hidden");
    document.getElementById("loginBox").classList.remove("hidden");
}

// Get users from LocalStorage
function getUsers() {
    return JSON.parse(localStorage.getItem("users")) || [];
}

// Register new user
function register() {
    const username = document.getElementById("regUsername").value.trim();
    const email = document.getElementById("regEmail").value.trim();
    const password = document.getElementById("regPassword").value.trim();

    if (!username || !email || !password) {
        alert("All fields are required");
        return;
    }

    const users = getUsers();

    // Check if username already exists
    if (users.some(user => user.username === username)) {
        alert("Username already exists");
        return;
    }

    users.push({ username, email, password });
    localStorage.setItem("users", JSON.stringify(users));

    alert("Registration successful!");
    showLogin();
}

// Login user
function login() {
    const username = document.getElementById("loginUsername").value.trim();
    const password = document.getElementById("loginPassword").value.trim();

    const users = getUsers();

    const user = users.find(
        user => user.username === username && user.password === password
    );

    if (!user) {
        alert("Invalid username or password");
        return;
    }

    // Save logged-in user
    localStorage.setItem("loggedInUser", username);

    alert("Login successful!");

    // Redirect to main app
    window.location.href = "index.html";
}
