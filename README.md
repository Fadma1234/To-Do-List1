# To-Do List (Full-Stack with Auth)

A full-stack to-do list application with authentication. Built with JavaScript, Node.js, Express, SQLite, and vanilla frontend.

## Features

- **Authentication**: Register and sign in with email/password
- **Tasks**: Create, mark as done, and delete tasks
- **Check/uncheck**: Click the checkbox to toggle task completion
- **Per-user data**: Each user sees only their own tasks

## Tech Stack

- **Backend**: Node.js, Express
- **Database**: SQLite (better-sqlite3)
- **Auth**: JWT + bcrypt
- **Frontend**: HTML, CSS, vanilla JavaScript

## Setup

1. Install dependencies:

```bash
npm install
```

2. Create a `.env` file (optional, defaults work for development):

```
JWT_SECRET=your-secret-key
PORT=3000
```

3. Start the server:

```bash
npm start
```

4. Open http://localhost:3000 in your browser.

## Usage

1. **Sign up** with email and password (min 6 characters)
2. **Sign in** if you already have an account
3. **Add tasks** using the input field
4. **Check tasks** by clicking the checkbox when done
5. **Delete tasks** by clicking the × button
6. **Logout** when finished
