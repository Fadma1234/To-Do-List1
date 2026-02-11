const express = require('express');
const db = require('../db');
const authMiddleware = require('../middleware/auth');

const router = express.Router();
router.use(authMiddleware);

// Get all tasks for the current user
router.get('/', (req, res) => {
  const tasks = db.prepare(
    'SELECT id, title, done, created_at FROM tasks WHERE user_id = ? ORDER BY created_at DESC'
  ).all(req.userId);
  res.json(tasks);
});

// Create a task
router.post('/', (req, res) => {
  const { title } = req.body;
  if (!title || typeof title !== 'string') {
    return res.status(400).json({ error: 'Title is required' });
  }

  const result = db.prepare(
    'INSERT INTO tasks (user_id, title) VALUES (?, ?)'
  ).run(req.userId, title.trim());

  const task = db.prepare(
    'SELECT id, title, done, created_at FROM tasks WHERE id = ?'
  ).get(result.lastInsertRowid);

  res.status(201).json(task);
});

// Toggle task done status (check/uncheck)
router.patch('/:id', (req, res) => {
  const { id } = req.params;
  const { done } = req.body;

  const task = db.prepare('SELECT * FROM tasks WHERE id = ? AND user_id = ?').get(id, req.userId);
  if (!task) {
    return res.status(404).json({ error: 'Task not found' });
  }

  const newDone = typeof done === 'boolean' ? done : !task.done;
  db.prepare('UPDATE tasks SET done = ? WHERE id = ? AND user_id = ?').run(newDone ? 1 : 0, id, req.userId);

  const updated = db.prepare('SELECT id, title, done, created_at FROM tasks WHERE id = ?').get(id);
  res.json(updated);
});

// Delete a task
router.delete('/:id', (req, res) => {
  const { id } = req.params;
  const result = db.prepare('DELETE FROM tasks WHERE id = ? AND user_id = ?').run(id, req.userId);
  if (result.changes === 0) {
    return res.status(404).json({ error: 'Task not found' });
  }
  res.json({ success: true });
});

module.exports = router;
