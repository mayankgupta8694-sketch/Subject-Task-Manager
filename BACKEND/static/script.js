console.log("BACKEND script.js loaded");

let currentSubjectId = null;
let editTaskId = null;

/* ---------------- PAGE LOAD ---------------- */
document.addEventListener("DOMContentLoaded", () => {
    loadSubjects();
});

/* ---------------- SUBJECTS ---------------- */
async function loadSubjects() {
    try {
        const res = await fetch('/api/subjects');
        const data = await res.json();

        if (!data.subjects) {
            console.error("Invalid response:", data);
            return;
        }

        const list = document.getElementById('subjectList');
        list.innerHTML = '';

        data.subjects.forEach(subject => {
            const li = document.createElement('li');

            li.innerHTML = `
                <div class="subject-header">
                    <strong style="cursor:pointer"
                        onclick="selectSubject(${subject.id}, '${subject.name}')">
                        ${subject.name}
                    </strong>
                    <button onclick="deleteSubject(${subject.id})">Delete</button>
                </div>

                <div class="progress-bar">
                    <div class="progress" style="width:${subject.progress}%"></div>
                </div>
                <small>${subject.progress}% completed</small>
            `;

            list.appendChild(li);
        });

    } catch (err) {
        console.error("Load subjects failed:", err);
    }
}

async function addSubject() {
    const input = document.getElementById("subjectInput");
    const name = input.value.trim();

    if (!name) {
        alert("Enter subject name");
        return;
    }

    const res = await fetch("/api/subjects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name })
    });

    if (!res.ok) {
        alert("Failed to add subject");
        return;
    }

    input.value = "";
    loadSubjects();
}

async function deleteSubject(id) {
    await fetch(`/api/subjects/${id}`, { method: "DELETE" });
    currentSubjectId = null;
    document.getElementById("taskList").innerHTML = "";
    loadSubjects();
}

/* ---------------- TASKS ---------------- */
function selectSubject(id, name) {
    currentSubjectId = id;
    document.getElementById("taskTitle").innerText = `Tasks for ${name}`;
    loadTasks();
}

async function loadTasks() {
    if (!currentSubjectId) return;

    const res = await fetch(`/api/tasks/${currentSubjectId}`);
    const data = await res.json();

    const list = document.getElementById("taskList");
    list.innerHTML = "";

    if (!data.tasks) return;

    data.tasks.forEach(task => {
        const li = document.createElement("li");

        li.innerHTML = `
            <strong>${task.name}</strong><br>
            Deadline: ${task.deadline}<br>
            Priority: ${task.priority}<br>

            <button onclick="toggleTask(${task.id}, ${!task.completed})">
                ${task.completed ? "Undo" : "Done"}
            </button>
            <button onclick="startEditTask(${task.id},
                '${task.name}','${task.deadline}','${task.priority}')">
                Edit
            </button>
            <button onclick="deleteTask(${task.id})">Delete</button>
        `;

        list.appendChild(li);
    });
}

async function addTask() {
    const name = document.getElementById("taskName").value;
    const deadline = document.getElementById("taskDeadline").value;
    const priority = document.getElementById("taskPriority").value;

    if (!name || !deadline || !priority || !currentSubjectId) return;

    await fetch(`/api/tasks/${currentSubjectId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, deadline, priority })
    });

    clearTaskInputs();
    loadTasks();
    loadSubjects();
}

function startEditTask(id, name, deadline, priority) {
    editTaskId = id;
    document.getElementById("taskName").value = name;
    document.getElementById("taskDeadline").value = deadline;
    document.getElementById("taskPriority").value = priority;
}

async function toggleTask(id, completed) {
    await fetch(`/api/tasks/update/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completed })
    });

    loadTasks();
    loadSubjects();
}

async function deleteTask(id) {
    await fetch(`/api/tasks/delete/${id}`, { method: "DELETE" });
    loadTasks();
    loadSubjects();
}

function clearTaskInputs() {
    document.getElementById("taskName").value = "";
    document.getElementById("taskDeadline").value = "";
    document.getElementById("taskPriority").value = "";
}
