from flask import Flask, render_template, request, redirect, session, url_for, jsonify
from flask_mysqldb import MySQL
import os
from dotenv import load_dotenv
load_dotenv()
import bcrypt




app = Flask(__name__)
app.secret_key = "secret_key_123"

# -------- MYSQL CONFIG --------
app.config['MYSQL_HOST'] = os.getenv('MYSQL_HOST')
app.config['MYSQL_USER'] = os.getenv('MYSQL_USER')
app.config['MYSQL_PASSWORD'] = os.getenv('MYSQL_PASSWORD')
app.config['MYSQL_DB'] = os.getenv('MYSQL_DB')

app.secret_key = os.getenv('SECRET_KEY')
mysql = MySQL(app)

# -------- AUTH PROTECTION --------
@app.before_request
def protect_routes():
    allowed = ['login_page', 'login', 'register', 'static']
    if request.endpoint not in allowed and 'user_id' not in session:
        return redirect(url_for('login_page'))

# -------- AUTH ROUTES --------
@app.route('/')
def login_page():
    return render_template('login.html')


@app.route('/register', methods=['GET', 'POST'])
def register():
    if request.method == 'POST':
        username = request.form['username']
        email = request.form['email']
        password = request.form['password']

        hashed = bcrypt.hashpw(password.encode(), bcrypt.gensalt())

        cur = mysql.connection.cursor()
        cur.execute(
            "INSERT INTO users (username, email, password) VALUES (%s,%s,%s)",
            (username, email, hashed)
        )
        mysql.connection.commit()
        cur.close()

        return redirect(url_for('login_page'))

    return render_template('register.html')


@app.route('/login', methods=['POST'])
def login():
    username = request.form['username']
    password = request.form['password']

    cur = mysql.connection.cursor()
    cur.execute("SELECT * FROM users WHERE username=%s", (username,))
    user = cur.fetchone()
    cur.close()

    if user and bcrypt.checkpw(password.encode(), user[3].encode()):
        session['user_id'] = user[0]
        session['username'] = user[1]
        return redirect(url_for('dashboard'))

    return "Invalid credentials"


@app.route('/logout')
def logout():
    session.clear()
    return redirect(url_for('login_page'))

# -------- DASHBOARD --------
@app.route('/dashboard')
def dashboard():
    return render_template('index.html')

# -------- SUBJECT API --------
@app.route('/api/subjects', methods=['GET', 'POST'])
def subjects_api():
    user_id = session['user_id']
    cur = mysql.connection.cursor()

    if request.method == 'GET':
        cur.execute("""
            SELECT s.id, s.subject_name,
            COUNT(t.id),
            SUM(CASE WHEN t.completed=1 THEN 1 ELSE 0 END)
            FROM subjects s
            LEFT JOIN tasks t ON s.id=t.subject_id
            WHERE s.user_id=%s
            GROUP BY s.id
        """, (user_id,))
        rows = cur.fetchall()
        cur.close()

        subjects = []
        for r in rows:
            total = r[2] or 0
            done = r[3] or 0
            progress = int((done/total)*100) if total else 0
            subjects.append({
                'id': r[0],
                'name': r[1],
                'progress': progress
            })

        return jsonify({'subjects': subjects})

    data = request.get_json()
    cur.execute(
        "INSERT INTO subjects (user_id, subject_name) VALUES (%s,%s)",
        (user_id, data['name'])
    )
    mysql.connection.commit()
    cur.close()

    return jsonify({'message': 'Subject added'})


@app.route('/api/subjects/<int:id>', methods=['DELETE'])
def delete_subject(id):
    cur = mysql.connection.cursor()
    cur.execute("DELETE FROM subjects WHERE id=%s", (id,))
    mysql.connection.commit()
    cur.close()
    return jsonify({'message': 'Deleted'})

# -------- TASK API --------
@app.route('/api/tasks/<int:subject_id>', methods=['GET', 'POST'])
def tasks(subject_id):
    cur = mysql.connection.cursor()

    if request.method == 'GET':
        cur.execute("""
            SELECT id, task_name, deadline, priority, completed
            FROM tasks WHERE subject_id=%s
        """, (subject_id,))
        rows = cur.fetchall()
        cur.close()

        return jsonify({'tasks': [
            {
                'id': r[0],
                'name': r[1],
                'deadline': str(r[2]),
                'priority': r[3],
                'completed': bool(r[4])
            } for r in rows
        ]})

    data = request.get_json()
    cur.execute("""
        INSERT INTO tasks (subject_id, task_name, deadline, priority)
        VALUES (%s,%s,%s,%s)
    """, (subject_id, data['name'], data['deadline'], data['priority']))
    mysql.connection.commit()
    cur.close()

    return jsonify({'message': 'Task added'})


@app.route('/api/tasks/update/<int:id>', methods=['PUT'])
def update_task(id):
    cur = mysql.connection.cursor()
    cur.execute(
        "UPDATE tasks SET completed=%s WHERE id=%s",
        (request.json['completed'], id)
    )
    mysql.connection.commit()
    cur.close()
    return jsonify({'message': 'Updated'})


@app.route('/api/tasks/edit/<int:id>', methods=['PUT'])
def edit_task(id):
    data = request.json
    cur = mysql.connection.cursor()
    cur.execute("""
        UPDATE tasks SET task_name=%s, deadline=%s, priority=%s
        WHERE id=%s
    """, (data['name'], data['deadline'], data['priority'], id))
    mysql.connection.commit()
    cur.close()
    return jsonify({'message': 'Edited'})


@app.route('/api/tasks/delete/<int:id>', methods=['DELETE'])
def delete_task(id):
    cur = mysql.connection.cursor()
    cur.execute("DELETE FROM tasks WHERE id=%s", (id,))
    mysql.connection.commit()
    cur.close()
    return jsonify({'message': 'Deleted'})


if __name__ == "__main__":
    app.run(debug=True)
