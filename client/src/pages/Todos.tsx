import React, { useState, useEffect } from 'react';
import './Todos.css';

interface Todo {
  id: string;
  title: string;
  completed: boolean;
}

const Todos: React.FC = () => {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [newTodoTitle, setNewTodoTitle] = useState('');
  const [editingTodo, setEditingTodo] = useState<Todo | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Fetch all todos
  const fetchTodos = async () => {
    setIsLoading(true);
    setError('');
    try {
      const response = await fetch('/api/todos');
      if (!response.ok) {
        throw new Error('Failed to fetch todos');
      }
      const data = await response.json();
      setTodos(data);
    } catch (err) {
      setError('Error fetching todos');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  // Create a new todo
  const handleCreateTodo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTodoTitle.trim()) return;
    
    setIsLoading(true);
    setError('');
    try {
      const response = await fetch('/api/todos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: newTodoTitle,
          completed: false,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to create todo');
      }
      
      const newTodo = await response.json();
      setTodos([...todos, newTodo]);
      setNewTodoTitle('');
    } catch (err) {
      setError('Error creating todo');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  // Toggle todo completed status
  const handleToggleComplete = async (todo: Todo) => {
    setIsLoading(true);
    setError('');
    try {
      const response = await fetch(`/api/todos/${todo.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          completed: !todo.completed,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update todo');
      }
      
      setTodos(todos.map(t => 
        t.id === todo.id ? { ...t, completed: !t.completed } : t
      ));
    } catch (err) {
      setError('Error updating todo');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  // Begin editing a todo
  const startEditing = (todo: Todo) => {
    console.log('Starting edit for todo:', todo);
    setEditingTodo(todo);
    setEditTitle(todo.title);
  };

  // Cancel editing
  const cancelEditing = () => {
    console.log('Canceling edit');
    setEditingTodo(null);
    setEditTitle('');
  };

  // Save edited todo
  const handleUpdateTodo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTodo || !editTitle.trim()) return;
    
    console.log('Updating todo:', editingTodo.id, 'with title:', editTitle);
    setIsLoading(true);
    setError('');
    try {
      const response = await fetch(`/api/todos/${editingTodo.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: editTitle,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update todo');
      }
      
      setTodos(todos.map(t => 
        t.id === editingTodo.id ? { ...t, title: editTitle } : t
      ));
      cancelEditing();
    } catch (err) {
      setError('Error updating todo');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  // Delete a todo
  const handleDeleteTodo = async (id: string) => {
    setIsLoading(true);
    setError('');
    try {
      const response = await fetch(`/api/todos/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete todo');
      }
      
      setTodos(todos.filter(t => t.id !== id));
    } catch (err) {
      setError('Error deleting todo');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch todos on component mount
  useEffect(() => {
    fetchTodos();
  }, []);

  return (
    <div className="todos-container">
      <h1 className="todos-title">Todo List</h1>
      
      {/* Create Todo Form */}
      <form onSubmit={handleCreateTodo} className="create-todo-form">
        <div className="form-group">
          <input
            type="text"
            value={newTodoTitle}
            onChange={(e) => setNewTodoTitle(e.target.value)}
            placeholder="Add a new todo"
            className="todo-input"
            required
          />
          <button 
            type="submit" 
            className="button button-primary"
            disabled={isLoading}
          >
            Add
          </button>
        </div>
      </form>
      
      {/* Error Message */}
      {error && <div className="error-message">{error}</div>}
      
      {/* Loading Indicator */}
      {isLoading && <div className="loading">Loading...</div>}
      
      {/* Todo List */}
      <ul className="todo-list">
        {todos.map((todo, index) => (
          <li key={todo.id || `todo-${index}`}>
            {editingTodo?.id === todo.id ? (
              <form key={`edit-form-${todo.id}`} onSubmit={handleUpdateTodo} className="edit-form">
                <input
                  key={`edit-input-${todo.id}`}
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="todo-input"
                  autoFocus
                  required
                />
                <button key={`save-btn-${todo.id}`} type="submit" className="button button-primary">
                  Save
                </button>
                <button 
                  key={`cancel-btn-${todo.id}`}
                  type="button" 
                  onClick={cancelEditing}
                  className="button button-secondary"
                >
                  Cancel
                </button>
              </form>
            ) : (
              <div key={`todo-content-${todo.id}`} className="todo-content">
                <div key={`todo-left-${todo.id}`} className="todo-left">
                  <input
                    key={`checkbox-${todo.id}`}
                    type="checkbox"
                    checked={todo.completed}
                    onChange={() => handleToggleComplete(todo)}
                    className="todo-checkbox"
                  />
                  <span key={`title-${todo.id}`} className={`todo-title ${todo.completed ? 'completed' : ''}`}>
                    {todo.title}
                  </span>
                </div>
                <div key={`todo-right-${todo.id}`} className="todo-actions">
                  <button 
                    key={`edit-btn-${todo.id}`}
                    onClick={() => startEditing(todo)}
                    className="button button-warning"
                  >
                    Edit
                  </button>
                  <button 
                    key={`delete-btn-${todo.id}`}
                    onClick={() => handleDeleteTodo(todo.id)}
                    className="button button-danger"
                  >
                    Delete
                  </button>
                </div>
              </div>
            )}
          </li>
        ))}
        {todos.length === 0 && !isLoading && (
          <li key="empty-state" className="loading">No todos yet. Add one above!</li>
        )}
      </ul>
    </div>
  );
};

export default Todos;
