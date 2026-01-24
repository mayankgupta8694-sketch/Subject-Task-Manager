console.log("BACKEND script.js loaded");

let currentSubjectId = null;
let editTaskId = null;

/* ---------------- PAGE LOAD ---------------- */
document.addEventListener("DOMContentLoaded", () => {
    loadSubjects();
});

/* ---------------- SUBJECTS ---------------- */
function loadSubjects() {
    fetch("/api/subjects")
        .then(res => res.json())
        .then(data => {
            const list = document.getElementById("subjectList");
            list.innerHTML = "";

            data.subjects.forEach(subject => {
                const li = document.createElement("li");

                li.innerHTML = `
                    <div class="subject-header">
                        <strong style="cursor:pointer"
                            onclick="selectSubject(${subject.id}, '${subject.name}')">
                            ${subject.name}
                        </strong>
                        <button class="subject-delete"
                            onclick="deleteSubject(${subject.id})">
                            Delete
                        </button>
                    </div>

                    <div class="progress-bar">
                        <div class="progress" style="width:${subject.progress}%"></div>
                    </div>
                    <small>${subject.progress}% completed</small>
                `;

                list.appendChild(li);
            });
        });
}

window.addSubject = async function () {
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
};

function deleteSubject(id) {
    fetch(`/api/subjects/${id}`, { method: "DELETE" })
        .then(() => {
            currentSubjectId = null;
            document.getElementById("taskList").innerHTML = "";
            document.getElementById("taskTitle").innerText = "Tasks";
            loadSubjects();
        });
}

/* ---------------- TASKS ---------------- */
function selectSubject(id, name) {
    currentSubjectId = id;
    document.getElementById("taskTitle").innerText = `Tasks for ${name}`;
    loadTasks();
}

function loadTasks() {
    if (!currentSubjectId) return;

    const searchText =
        document.getElementById("searchInput").value.toLowerCase();
    const selectedDate =
        document.getElementById("calendarFilter").value;

    fetch(`/api/tasks/${currentSubjectId}`)
        .then(res => res.json())
        .then(data => {
            let tasks = data.tasks;

            if (searchText) {
                tasks = tasks.filter(t =>
                    t.name.toLowerCase().includes(searchText)
                );
            }

            if (selectedDate) {
                tasks = tasks.filter(t =>
                    t.deadline === selectedDate
                );
            }

            const priorityOrder = { High: 1, Medium: 2, Low: 3 };
            tasks.sort((a, b) => {
                if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
                    return priorityOrder[a.priority] - priorityOrder[b.priority];
                }
                return new Date(a.deadline) - new Date(b.deadline);
            });

            const list = document.getElementById("taskList");
            list.innerHTML = "";

            tasks.forEach(task => {
                const li = document.createElement("li");
                li.className = "task-item";
                if (task.completed) li.classList.add("completed");

                li.innerHTML = `
                    <strong>${task.name}</strong><br>
                    Deadline: ${task.deadline}<br>
                    Priority: ${task.priority}<br>

                    <button onclick="toggleTask(${task.id}, ${!task.completed})">
                        ${task.completed ? "Undo" : "Done"}
                    </button>

                    <button onclick="startEditTask(
                        ${task.id},
                        '${task.name}',
                        '${task.deadline}',
                        '${task.priority}'
                    )">Edit</button>

                    <button onclick="deleteTask(${task.id})">Delete</button>
                `;

                list.appendChild(li);
            });
        });
}

window.addTask = function () {
    if (!currentSubjectId) {
        alert("Select a subject first");
        return;
    }

    const name = document.getElementById("taskName").value.trim();
    const deadline = document.getElementById("taskDeadline").value;
    const priority = document.getElementById("taskPriority").value;

    if (!name || !deadline || !priority) {
        alert("Fill all fields");
        return;
    }

    /* EDIT MODE */
    if (editTaskId) {
        fetch(`/api/tasks/edit/${editTaskId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name, deadline, priority })
        })
        .then(() => {
            editTaskId = null;
            clearTaskInputs();
            loadTasks();
            loadSubjects();
        });
        return;
    }

    /* ADD MODE */
    fetch(`/api/tasks/${currentSubjectId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, deadline, priority })
    })
    .then(() => {
        clearTaskInputs();
        loadTasks();
        loadSubjects();
    });
};

function startEditTask(id, name, deadline, priority) {
    editTaskId = id;
    document.getElementById("taskName").value = name;
    document.getElementById("taskDeadline").value = deadline;
    document.getElementById("taskPriority").value = priority;
}

function toggleTask(id, completed) {
    fetch(`/api/tasks/update/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completed })
    })
    .then(() => {
        loadTasks();
        loadSubjects();
    });
}

function deleteTask(id) {
    fetch(`/api/tasks/delete/${id}`, { method: "DELETE" })
        .then(() => {
            loadTasks();
            loadSubjects();
        });
}

function clearTaskInputs() {
    document.getElementById("taskName").value = "";
    document.getElementById("taskDeadline").value = "";
    document.getElementById("taskPriority").value = "";
}
