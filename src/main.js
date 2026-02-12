import { ConvexHttpClient } from "convex/browser";
import { anyApi } from "convex/server";

// Initialize Convex client
const CONVEX_URL = import.meta.env.VITE_CONVEX_URL;
if (!CONVEX_URL) {
  console.warn("VITE_CONVEX_URL not set. Run 'npx convex dev' to configure.");
}
const client = CONVEX_URL ? new ConvexHttpClient(CONVEX_URL) : null;

function requireClient() {
  if (!client) {
    throw new Error(
      "Backend not connected. Run 'npx convex dev' in your terminal first, then restart Vite."
    );
  }
  return client;
}

// DOM elements
const authSection = document.getElementById("auth-section");
const todoSection = document.getElementById("todo-section");
const loginForm = document.getElementById("login-form");
const registerForm = document.getElementById("register-form");
const authError = document.getElementById("auth-error");
const toggleAuth = document.getElementById("toggle-auth");
const toggleText = document.getElementById("toggle-text");
const addTaskForm = document.getElementById("add-task-form");
const taskInput = document.getElementById("task-input");
const taskList = document.getElementById("task-list");
const userEmail = document.getElementById("user-email");
const logoutBtn = document.getElementById("logout-btn");

// State
let token = localStorage.getItem("token");
let user = JSON.parse(localStorage.getItem("user") || "null");

// Toggle between login and register
let showingLogin = true;

function showAuthError(msg) {
  authError.textContent = msg;
  authError.classList.add("visible");
}

function clearAuthError() {
  authError.textContent = "";
  authError.classList.remove("visible");
}

function setAuthToggle() {
  if (showingLogin) {
    toggleText.textContent = "Don't have an account? ";
    toggleAuth.textContent = "Sign up";
    registerForm.classList.add("hidden");
    loginForm.classList.remove("hidden");
  } else {
    toggleText.textContent = "Already have an account? ";
    toggleAuth.textContent = "Sign in";
    loginForm.classList.add("hidden");
    registerForm.classList.remove("hidden");
  }
}

toggleAuth.addEventListener("click", () => {
  showingLogin = !showingLogin;
  clearAuthError();
  setAuthToggle();
});

// Auth: Login
loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  clearAuthError();
  const email = document.getElementById("login-email").value;
  const password = document.getElementById("login-password").value;

  try {
    const data = await requireClient().action(anyApi.auth.login, { email, password });
    token = data.token;
    user = data.user;
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(user));
    showTodo();
    loadTasks();
  } catch (err) {
    showAuthError(err.message || "Login failed");
  }
});

// Auth: Register
registerForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  clearAuthError();
  const email = document.getElementById("register-email").value;
  const password = document.getElementById("register-password").value;

  try {
    const data = await requireClient().action(anyApi.auth.register, { email, password });
    token = data.token;
    user = data.user;
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(user));
    showTodo();
    loadTasks();
  } catch (err) {
    showAuthError(err.message || "Registration failed");
  }
});

// Logout
logoutBtn.addEventListener("click", () => {
  token = null;
  user = null;
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  showAuth();
});

function showAuth() {
  authSection.classList.remove("hidden");
  todoSection.classList.add("hidden");
  setAuthToggle();
}

function showTodo() {
  authSection.classList.add("hidden");
  todoSection.classList.remove("hidden");
  userEmail.textContent = user?.email || "";
}

// Tasks
async function loadTasks() {
  try {
    const tasks = await requireClient().query(anyApi.tasks.list, { token });
    renderTasks(tasks);
  } catch (err) {
    if (err.message?.includes("Authentication required")) {
      logoutBtn.click();
      return;
    }
    taskList.innerHTML =
      '<li class="empty-state"><p>Could not load tasks.</p></li>';
  }
}

function renderTasks(tasks) {
  if (!tasks.length) {
    taskList.innerHTML =
      '<li class="empty-state"><p>No tasks yet.</p><p>Add one above!</p></li>';
    return;
  }

  taskList.innerHTML = tasks
    .map(
      (task) => `
    <li class="task-item ${task.done ? "done" : ""}" data-id="${task._id}">
      <input type="checkbox" class="task-checkbox" ${task.done ? "checked" : ""} aria-label="Mark as ${task.done ? "undone" : "done"}">
      <span class="task-title">${escapeHtml(task.title)}</span>
      <button type="button" class="task-delete" aria-label="Delete task">&times;</button>
    </li>
  `
    )
    .join("");
}

function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

async function handleCheckbox(e) {
  if (!e.target.classList.contains("task-checkbox")) return;

  const li = e.target.closest(".task-item");
  const taskId = li.dataset.id;
  const done = e.target.checked;

  try {
    await requireClient().mutation(anyApi.tasks.toggleDone, { token, taskId, done });
    li.classList.toggle("done", done);
  } catch {
    e.target.checked = !done;
  }
}

async function handleDelete(e) {
  if (!e.target.classList.contains("task-delete")) return;

  const li = e.target.closest(".task-item");
  const taskId = li.dataset.id;

  try {
    await requireClient().mutation(anyApi.tasks.remove, { token, taskId });
    li.remove();
    // Check if list is now empty
    if (!taskList.querySelector(".task-item")) {
      taskList.innerHTML =
        '<li class="empty-state"><p>No tasks yet.</p><p>Add one above!</p></li>';
    }
  } catch {
    // ignore
  }
}

// Add task
addTaskForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const title = taskInput.value.trim();
  if (!title) return;

  taskInput.value = "";

  try {
    await requireClient().mutation(anyApi.tasks.create, { token, title });
    await loadTasks();
  } catch (err) {
    alert(err.message || "Failed to add task");
  }
});

// Event delegation for task list (attach once)
taskList.addEventListener("change", handleCheckbox);
taskList.addEventListener("click", handleDelete);

// Init
if (token && user) {
  showTodo();
  loadTasks();
} else {
  showAuth();
}
