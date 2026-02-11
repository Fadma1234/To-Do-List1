const API_BASE = '';

// DOM elements
const authSection = document.getElementById('auth-section');
const todoSection = document.getElementById('todo-section');
const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');
const authError = document.getElementById('auth-error');
const toggleAuth = document.getElementById('toggle-auth');
const toggleText = document.getElementById('toggle-text');
const addTaskForm = document.getElementById('add-task-form');
const taskInput = document.getElementById('task-input');
const taskList = document.getElementById('task-list');
const userEmail = document.getElementById('user-email');
const logoutBtn = document.getElementById('logout-btn');

// State
let token = localStorage.getItem('token');
let user = JSON.parse(localStorage.getItem('user') || 'null');

// Toggle between login and register
let showingLogin = true;

function showAuthError(msg) {
  authError.textContent = msg;
  authError.classList.add('visible');
}

function clearAuthError() {
  authError.textContent = '';
  authError.classList.remove('visible');
}

function setAuthToggle() {
  if (showingLogin) {
    toggleText.textContent = "Don't have an account? ";
    toggleAuth.textContent = 'Sign up';
    registerForm.classList.add('hidden');
    loginForm.classList.remove('hidden');
  } else {
    toggleText.textContent = 'Already have an account? ';
    toggleAuth.textContent = 'Sign in';
    loginForm.classList.add('hidden');
    registerForm.classList.remove('hidden');
  }
}

toggleAuth.addEventListener('click', () => {
  showingLogin = !showingLogin;
  clearAuthError();
  setAuthToggle();
});

// Auth: Login
loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  clearAuthError();
  const email = document.getElementById('login-email').value;
  const password = document.getElementById('login-password').value;

  try {
    const res = await fetch(`${API_BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();

    if (!res.ok) {
      showAuthError(data.error || 'Login failed');
      return;
    }

    token = data.token;
    user = data.user;
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    showTodo();
    loadTasks();
  } catch (err) {
    showAuthError('Connection error. Try again.');
  }
});

// Auth: Register
registerForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  clearAuthError();
  const email = document.getElementById('register-email').value;
  const password = document.getElementById('register-password').value;

  try {
    const res = await fetch(`${API_BASE}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();

    if (!res.ok) {
      showAuthError(data.error || 'Registration failed');
      return;
    }

    token = data.token;
    user = data.user;
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    showTodo();
    loadTasks();
  } catch (err) {
    showAuthError('Connection error. Try again.');
  }
});

// Logout
logoutBtn.addEventListener('click', () => {
  token = null;
  user = null;
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  showAuth();
});

function showAuth() {
  authSection.classList.remove('hidden');
  todoSection.classList.add('hidden');
  setAuthToggle();
}

function showTodo() {
  authSection.classList.add('hidden');
  todoSection.classList.remove('hidden');
  userEmail.textContent = user?.email || '';
}

// API helper
function api(endpoint, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers
  };
  return fetch(`${API_BASE}${endpoint}`, { ...options, headers });
}

// Tasks
async function loadTasks() {
  try {
    const res = await api('/api/tasks');
    if (res.status === 401) {
      logoutBtn.click();
      return;
    }
    const tasks = await res.json();
    renderTasks(tasks);
  } catch {
    taskList.innerHTML = '<li class="empty-state"><p>Could not load tasks.</p></li>';
  }
}

function renderTasks(tasks) {
  if (!tasks.length) {
    taskList.innerHTML = '<li class="empty-state"><p>No tasks yet.</p><p>Add one above!</p></li>';
    return;
  }

  taskList.innerHTML = tasks.map(
    (task) => `
    <li class="task-item ${task.done ? 'done' : ''}" data-id="${task.id}">
      <input type="checkbox" class="task-checkbox" ${task.done ? 'checked' : ''} aria-label="Mark as ${task.done ? 'undone' : 'done'}">
      <span class="task-title">${escapeHtml(task.title)}</span>
      <button type="button" class="task-delete" aria-label="Delete task">×</button>
    </li>
  `
  ).join('');
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

async function handleCheckbox(e) {
  if (!e.target.classList.contains('task-checkbox')) return;

  const li = e.target.closest('.task-item');
  const id = li.dataset.id;
  const done = e.target.checked;

  try {
    const res = await api(`/api/tasks/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ done })
    });
    if (res.ok) {
      li.classList.toggle('done', done);
    } else {
      e.target.checked = !done;
    }
  } catch {
    e.target.checked = !done;
  }
}

async function handleDelete(e) {
  if (!e.target.classList.contains('task-delete')) return;

  const li = e.target.closest('.task-item');
  const id = li.dataset.id;

  try {
    const res = await api(`/api/tasks/${id}`, { method: 'DELETE' });
    if (res.ok) {
      li.remove();
    }
  } catch {
    // ignore
  }
}

// Add task
addTaskForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const title = taskInput.value.trim();
  if (!title) return;

  taskInput.value = '';

  try {
    const res = await api('/api/tasks', {
      method: 'POST',
      body: JSON.stringify({ title })
    });

    if (!res.ok) {
      const data = await res.json();
      alert(data.error || 'Failed to add task');
      return;
    }

    const task = await res.json();
    const tasks = [...Array.from(taskList.querySelectorAll('.task-item')).map((li) => ({
      id: Number(li.dataset.id),
      title: li.querySelector('.task-title').textContent,
      done: li.classList.contains('done')
    }))];

    if (taskList.querySelector('.empty-state')) {
      tasks.length = 0;
    }
    tasks.unshift(task);
    renderTasks(tasks);
  } catch {
    alert('Connection error. Try again.');
  }
});

// Event delegation for task list (attach once)
taskList.addEventListener('change', handleCheckbox);
taskList.addEventListener('click', handleDelete);

// Init
if (token && user) {
  showTodo();
  loadTasks();
} else {
  showAuth();
}
