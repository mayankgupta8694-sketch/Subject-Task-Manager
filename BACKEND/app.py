import os
from flask import Flask, render_template, request, redirect, url_for, session, jsonify
import pymysql
import bcrypt

# VERY IMPORTANT for compatibility
pymysql.install_as_MySQLdb()

app = Flask(__name__)
app.secret_key = os.environ.get("SECRET_KEY", "dev_secret_key")

# -------------------------
# DATABASE CONNECTION
# -------------------------
def get_db_connection():
    return pymysql.connect(
        host=os.environ.get("MYSQLHOST"),
        user=os.environ.get("MYSQLUSER"),
        password=os.environ.get("MYSQLPASSWORD"),
        database=os.environ.get("MYSQLDATABASE"),
        port=int(os.environ.get("MYSQLPORT", 3306)),
        cursorclass=pymysql.cursors.DictCursor
    )

# -------------------------
# CREATE TABLES (AUTO)
# -------------------------
def init_db():
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(100) UNIQUE NOT NULL,
        email VARCHAR(150) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL
    )
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS subjects (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT,
        name VARCHAR(100),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS tasks (
        id INT AUTO_INCREMENT PRIMARY KEY,
        subject_id INT,
        title VARCHAR(200),
        deadline DATE,
        priority VARCHAR(20),
        completed BOOLEAN DEFAULT FALSE,
        FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE
    )
    """)

    conn.commit()
    conn.close()

# Run once at startup
init_db()

# -------------------------
# AUTH ROUTES
# -------------------------
@app.route("/", methods=["GET", "POST"])
@app.route("/login", methods=["GET", "POST"])
def login():
    if request.method == "POST":
        username = request.form["username"]
        password = request.form["password"]

        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM users WHERE username=%s", (username,))
        user = cursor.fetchone()
        conn.close()

        if user and bcrypt.checkpw(password.encode(), user["password"].encode()):
            session["user_id"] = user["id"]
            session["username"] = user["username"]
            return redirect(url_for("dashboard"))

        return "Invalid credentials"

    return render_template("login.html")


@app.route("/register", methods=["GET", "POST"])
def register():
    if request.method == "POST":
        username = request.form["username"]
        email = request.form["email"]
        password = bcrypt.hashpw(
            request.form["password"].encode(), bcrypt.gensalt()
        ).decode()

        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute(
            "INSERT INTO users (username, email, password) VALUES (%s,%s,%s)",
            (username, email, password)
        )
        conn.commit()
        conn.close()

        return redirect(url_for("login"))

    return render_template("register.html")


@app.route("/logout")
def logout():
    session.clear()
    return redirect(url_for("login"))

# -------------------------
# DASHBOARD
# -------------------------
@app.route("/dashboard")
def dashboard():
    if "user_id" not in session:
        return redirect(url_for("login"))
    return render_template("index.html", username=session["username"])

# -------------------------
# SUBJECT APIs
# -------------------------
@app.route("/api/subjects", methods=["GET", "POST"])
def subjects():
    if "user_id" not in session:
        return jsonify({"error": "Unauthorized"}), 401

    conn = get_db_connection()
    cursor = conn.cursor()

    if request.method == "POST":
        name = request.json["name"]
        cursor.execute(
            "INSERT INTO subjects (user_id, name) VALUES (%s,%s)",
            (session["user_id"], name)
        )
        conn.commit()

    cursor.execute(
        "SELECT * FROM subjects WHERE user_id=%s",
        (session["user_id"],)
    )
    data = cursor.fetchall()
    conn.close()

    return jsonify(data)

# -------------------------
# TASK APIs
# -------------------------
@app.route("/api/tasks/<int:subject_id>", methods=["GET", "POST"])
def tasks(subject_id):
    if "user_id" not in session:
        return jsonify({"error": "Unauthorized"}), 401

    conn = get_db_connection()
    cursor = conn.cursor()

    if request.method == "POST":
        data = request.json
        cursor.execute("""
            INSERT INTO tasks (subject_id, title, deadline, priority)
            VALUES (%s,%s,%s,%s)
        """, (subject_id, data["title"], data["deadline"], data["priority"]))
        conn.commit()

    cursor.execute(
        "SELECT * FROM tasks WHERE subject_id=%s ORDER BY priority DESC, deadline ASC",
        (subject_id,)
    )
    tasks = cursor.fetchall()
    conn.close()

    return jsonify(tasks)

# -------------------------
# MARK TASK DONE
# -------------------------
@app.route("/api/task/done/<int:task_id>", methods=["POST"])
def mark_done(task_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        "UPDATE tasks SET completed=TRUE WHERE id=%s",
        (task_id,)
    )
    conn.commit()
    conn.close()
    return jsonify({"success": True})

# -------------------------
# DELETE TASK
# -------------------------
@app.route("/api/task/delete/<int:task_id>", methods=["DELETE"])
def delete_task(task_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM tasks WHERE id=%s", (task_id,))
    conn.commit()
    conn.close()
    return jsonify({"success": True})

# -------------------------
# RUN (Render uses gunicorn)
# -------------------------
if __name__ == "__main__":
    app.run()
