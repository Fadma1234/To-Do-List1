# To-Do List (Full-Stack with Convex)

A full-stack to-do list application with authentication. Built with JavaScript, Vite, and Convex backend.

## Features

- **Authentication**: Register and sign in with email/password
- **Tasks**: Create, mark as done, and delete tasks
- **Check/uncheck**: Click the checkbox to toggle task completion
- **Per-user data**: Each user sees only their own tasks
- **Convex backend**: Real-time database with serverless functions

## Tech Stack

- **Backend**: Convex (schema, queries, mutations, actions)
- **Auth**: bcrypt password hashing + session tokens
- **Frontend**: HTML, CSS, vanilla JavaScript
- **Bundler**: Vite

## Setup

1. Install dependencies:

```bash
npm install
```

2. Start the Convex dev server (will prompt you to create a project on first run):

```bash
npx convex dev
```

3. In a separate terminal, start the Vite frontend:

```bash
npm run dev:frontend
```

Or run both together:

```bash
npm run dev
```

4. Open http://localhost:3000 in your browser.

## Project Structure

```
├── convex/
│   ├── schema.ts          # Database schema (users, sessions, tasks)
│   ├── auth.ts            # Auth actions (register, login)
│   ├── authHelpers.ts     # Internal auth queries/mutations
│   └── tasks.ts           # Task queries & mutations
├── src/
│   ├── main.js            # Frontend app logic
│   └── style.css          # Styles
├── index.html             # Entry HTML
├── package.json
└── vite.config.js
```

## Usage

1. **Sign up** with email and password (min 6 characters)
2. **Sign in** if you already have an account
3. **Add tasks** using the input field
4. **Check tasks** by clicking the checkbox when done
5. **Delete tasks** by clicking the x button
6. **Logout** when finished
