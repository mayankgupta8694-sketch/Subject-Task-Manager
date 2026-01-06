// ---------- SUBJECT LOGIC ----------
const subjectInput = document.getElementById("subjectInput");
const addSubjectBtn = document.getElementById("addSubjectBtn");
const subjectList = document.getElementById("subjectList");

const subjectSection = document.getElementById("subjectSection");
const taskSection = document.getElementById("taskSection");
const currentSubjectHeading = document.getElementById("currentSubject");

let currentSubject = null;

// ---------- TASK ELEMENTS ----------
const taskNameInput = document.getElementById("taskName");
const deadlineInput = document.getElementById("deadline");
const priorityInput = document.getElementById("priority");
const addTaskBtn = document.getElementById("addTaskBtn");
const backBtn = document.getElementById("backBtn");

const searchInput = document.getElementById("searchInput");
const calendarFilter = document.getElementById("calendarFilter");

const highTasks = document.getElementById("highTasks");
const mediumTasks = document.getElementById("mediumTasks");
const lowTasks = document.getElementById("lowTasks");
const completedTasks = document.getElementById("completedTasks");

let editTaskId = null;

// ---------- STORAGE ----------
function getData() {
    return JSON.parse(localStorage.getItem("subjectData")) || {};
}

function saveData(data) {
    localStorage.setItem("subjectData", JSON.stringify(data));
}

// ---------- SUBJECT FUNCTIONS ----------
addSubjectBtn.onclick = () => {
    const subject = subjectInput.value.trim();
    if (!subject) return;

    const data = getData();
    if (!data[subject]) data[subject] = [];

    saveData(data);
    subjectInput.value = "";
    renderSubjects();
};

function renderSubjects() {
    subjectList.innerHTML = "";
    const data = getData();

    Object.keys(data).forEach(subject => {
        const tasks = data[subject];
        const total = tasks.length;
        const completed = tasks.filter(t => t.completed).length;
        const percent = total === 0 ? 0 : Math.round((completed / total) * 100);

        const li = document.createElement("li");

        li.innerHTML = `
            <div class="subject-header">
                <strong>${subject}</strong>
                <button class="subject-delete">Delete</button>
            </div>

            <div class="progress-bar">
                <div class="progress" style="width: ${percent}%"></div>
            </div>

            <small>${percent}% completed</small>
        `;

        // Open subject (click on name / progress area)
        li.onclick = () => openSubject(subject);

        // Delete subject
        li.querySelector(".subject-delete").onclick = (e) => {
            e.stopPropagation(); // prevent opening subject
            deleteSubject(subject);
        };

        subjectList.appendChild(li);
    });
}

function deleteSubject(subject) {
    const confirmDelete = confirm(
        `Are you sure you want to delete "${subject}" and all its tasks?`
    );

    if (!confirmDelete) return;

    const data = getData();
    delete data[subject];
    saveData(data);
    renderSubjects();
}


function openSubject(subject) {
    currentSubject = subject;
    currentSubjectHeading.textContent = subject;
    subjectSection.classList.add("hidden");
    taskSection.classList.remove("hidden");
    renderTasks();
}

backBtn.onclick = () => {
    taskSection.classList.add("hidden");
    subjectSection.classList.remove("hidden");
};

// ---------- TASK LOGIC ----------
addTaskBtn.onclick = () => {
    const name = taskNameInput.value.trim();
    const deadline = deadlineInput.value;
    const priority = priorityInput.value;
   

    if (!name || !deadline || !priority) return;

    const data = getData();

    if (editTaskId === null) {
        data[currentSubject].push({
            id: Date.now(),
            name,
            deadline,
            priority,
            completed: false
        });
    } else {
        data[currentSubject] = data[currentSubject].map(t => {
            if (t.id === editTaskId) {
                t.name = name;
                t.deadline = deadline;
                t.priority = priority;
            }
            return t;
        });
        editTaskId = null;
        addTaskBtn.textContent = "Add Task";
    }

    saveData(data);
    clearInputs();
    renderTasks();
    renderSubjects();
};

searchInput.oninput = renderTasks;
calendarFilter.onchange = renderTasks;

// ---------- RENDER TASKS ----------
function renderTasks() {
    highTasks.innerHTML = "";
    mediumTasks.innerHTML = "";
    lowTasks.innerHTML = "";
    completedTasks.innerHTML = "";

    const data = getData();
    const tasks = data[currentSubject] || [];

    const searchText = searchInput.value.toLowerCase();
    const selectedDate = calendarFilter.value;

    tasks.forEach(task => {
        if (searchText && !task.name.toLowerCase().includes(searchText)) return;
        if (selectedDate && task.deadline !== selectedDate) return;

        if (task.completed) {
            completedTasks.appendChild(createCompletedTask(task));
            return;
        }

        const el = createActiveTask(task);
        if (task.priority === "High") highTasks.appendChild(el);
        else if (task.priority === "Medium") mediumTasks.appendChild(el);
        else lowTasks.appendChild(el);
    });
}

// ---------- TASK UI ----------
function createActiveTask(task) {
    const li = document.createElement("li");
    li.className = "task-item";

    li.innerHTML = `
        <strong>${task.name}</strong><br>
        ${task.deadline}<br>
        Priority: ${task.priority}<br>
        <button class="complete-btn">Done</button>
        <button class="edit-btn">Edit</button>
        <button class="delete-btn">Delete</button>
    `;

    li.querySelector(".complete-btn").onclick = () => toggleComplete(task.id);
    li.querySelector(".edit-btn").onclick = () => editTask(task);
    li.querySelector(".delete-btn").onclick = () => deleteTask(task.id);

    return li;
}

function createCompletedTask(task) {
    const li = document.createElement("li");
    li.className = "task-item completed";

    li.innerHTML = `
        <strong>${task.name}</strong><br>
        ${task.deadline}<br>
        <button class="complete-btn">Undo</button>
        <button class="delete-btn">Delete</button>
    `;

    li.querySelector(".complete-btn").onclick = () => toggleComplete(task.id);
    li.querySelector(".delete-btn").onclick = () => deleteTask(task.id);

    return li;
}

// ---------- ACTIONS ----------
function toggleComplete(id) {
    const data = getData();
    data[currentSubject] = data[currentSubject].map(t => {
        if (t.id === id) t.completed = !t.completed;
        return t;
    });
    saveData(data);
    renderTasks();
    renderSubjects(); 
}

function deleteTask(id) {
    const data = getData();
    data[currentSubject] = data[currentSubject].filter(t => t.id !== id);
    saveData(data);
    renderTasks();
    renderSubjects(); 
}

function editTask(task) {
    taskNameInput.value = task.name;
    deadlineInput.value = task.deadline;
    priorityInput.value = task.priority;
    editTaskId = task.id;
    addTaskBtn.textContent = "Update Task";
}

function clearInputs() {
    taskNameInput.value = "";
    deadlineInput.value = "";
    priorityInput.value = "";
}

// ---------- INIT ----------
renderSubjects();
