function showRegister() {
    document.getElementById("loginBox").classList.add("hidden");
    document.getElementById("registerBox").classList.remove("hidden");
}

function showLogin() {
    document.getElementById("registerBox").classList.add("hidden");
    document.getElementById("loginBox").classList.remove("hidden");
}

function getUsers() {
    return JSON.parse(localStorage.getItem("users")) || [];
}

function register() {
    const username = document.getElementById("regUsername").value.trim();
    const email = document.getElementById("regEmail").value.trim();
    const password = document.getElementById("regPassword").value.trim();

    if (!username || !email || !password) {
        alert("All fields are required");
        return;
    }

    const users = getUsers();

    if (users.some(user => user.username === username)) {
        alert("Username already exists");
        return;
    }

    users.push({ username, email, password });
    localStorage.setItem("users", JSON.stringify(users));

    alert("Registration successful!");
    showLogin();
}


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

    localStorage.setItem("loggedInUser", username);

    alert("Login successful!");

    window.location.href = "index.html";
}
