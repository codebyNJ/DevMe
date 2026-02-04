// Todo functionality for Dev Dashboard
class TodoManager {
    constructor() {
        this.todos = [];
        this.initialize();
    }

    initialize() {
        this.loadTodos();
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Add todo on button click
        const addTodoBtn = document.getElementById('add-todo');
        if (addTodoBtn) {
            addTodoBtn.addEventListener('click', () => this.addTodo());
        }

        // Add todo on Enter key
        const todoInput = document.getElementById('todo-input');
        if (todoInput) {
            todoInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') this.addTodo();
            });
        }
    }

    addTodo() {
        const todoInput = document.getElementById('todo-input');
        const text = todoInput.value.trim();
        
        if (text) {
            const todo = {
                id: Date.now(),
                text,
                completed: false,
                createdAt: new Date().toISOString()
            };
            
            this.todos.unshift(todo);
            this.saveTodos();
            this.renderTodos();
            todoInput.value = '';
        }
    }
    
    toggleTodo(id) {
        this.todos = this.todos.map(todo => 
            todo.id === id ? { ...todo, completed: !todo.completed } : todo
        );
        
        // Sort todos: incomplete first, then completed
        this.todos.sort((a, b) => {
            if (a.completed === b.completed) return 0;
            return a.completed ? 1 : -1;
        });
        
        this.saveTodos();
        this.renderTodos();
    }
    
    deleteTodo(id) {
        this.todos = this.todos.filter(todo => todo.id !== id);
        this.saveTodos();
        this.renderTodos();
    }
    
    editTodo(id, newText) {
        const text = newText.trim();
        if (text) {
            this.todos = this.todos.map(todo => 
                todo.id === id ? { ...todo, text } : todo
            );
            this.saveTodos();
        }
    }
    
    saveTodos() {
        localStorage.setItem('todos', JSON.stringify(this.todos));
    }
    
    loadTodos() {
        const savedTodos = localStorage.getItem('todos');
        if (savedTodos) {
            try {
                this.todos = JSON.parse(savedTodos);
                this.renderTodos();
            } catch (e) {
                console.error('Failed to parse todos', e);
            }
        }
    }
    
    renderTodos() {
        const todoList = document.getElementById('todo-list');
        if (!todoList) return;
        
        todoList.innerHTML = this.todos.map(todo => `
            <div class="todo-item ${todo.completed ? 'completed' : ''}" data-id="${todo.id}">
                <input type="checkbox" ${todo.completed ? 'checked' : ''} class="todo-checkbox">
                <span class="todo-text" contenteditable="true">${this.escapeHtml(todo.text)}</span>
                <div class="todo-actions">
                    <button class="delete-todo" title="Delete">✕</button>
                </div>
            </div>
        `).join('');
        
        // Add event listeners for the new todo items
        document.querySelectorAll('.todo-checkbox').forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                const id = parseInt(e.target.closest('.todo-item').dataset.id);
                this.toggleTodo(id);
            });
        });
        
        document.querySelectorAll('.delete-todo').forEach(button => {
            button.addEventListener('click', (e) => {
                const id = parseInt(e.target.closest('.todo-item').dataset.id);
                this.deleteTodo(id);
            });
        });
        
        document.querySelectorAll('.todo-text').forEach(span => {
            span.addEventListener('blur', (e) => {
                const id = parseInt(e.target.closest('.todo-item').dataset.id);
                this.editTodo(id, e.target.textContent);
            });
            
            span.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    e.target.blur();
                }
            });
        });
    }
    
    escapeHtml(unsafe) {
        return unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }
}

// Initialize Todo Manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.todoManager = new TodoManager();
});
