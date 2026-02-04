// Widget: Todo List
// Task management with local storage persistence

window.DevMeWidgets = window.DevMeWidgets || {};

window.DevMeWidgets['todo-list'] = {
    id: 'todo-list',
    name: 'Todo List',
    description: 'Manage your tasks',
    requires: [],

    todos: [],

    render() {
        return `
            <div class="box" data-widget="todo-list">
                <div class="section-title">Todo List</div>
                <div class="todo-container">
                    <div class="todo-input-container">
                        <input type="text" id="todo-input" placeholder="Add a task..." class="todo-input">
                        <button id="add-todo" class="add-todo-btn">+</button>
                    </div>
                    <div id="todo-list" class="todo-list"></div>
                </div>
            </div>
        `;
    },

    init(container) {
        this.loadTodos();
        this.setupEventListeners();
    },

    setupEventListeners() {
        const addBtn = document.getElementById('add-todo');
        const input = document.getElementById('todo-input');

        if (addBtn) {
            addBtn.addEventListener('click', () => this.addTodo());
        }

        if (input) {
            input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') this.addTodo();
            });
        }
    },

    addTodo() {
        const input = document.getElementById('todo-input');
        const text = input?.value.trim();

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
            if (input) input.value = '';
        }
    },

    toggleTodo(id) {
        this.todos = this.todos.map(todo =>
            todo.id === id ? { ...todo, completed: !todo.completed } : todo
        );

        // Sort: incomplete first
        this.todos.sort((a, b) => {
            if (a.completed === b.completed) return 0;
            return a.completed ? 1 : -1;
        });

        this.saveTodos();
        this.renderTodos();
    },

    deleteTodo(id) {
        this.todos = this.todos.filter(todo => todo.id !== id);
        this.saveTodos();
        this.renderTodos();
    },

    editTodo(id, newText) {
        const text = newText.trim();
        if (text) {
            this.todos = this.todos.map(todo =>
                todo.id === id ? { ...todo, text } : todo
            );
            this.saveTodos();
        }
    },

    saveTodos() {
        localStorage.setItem('todos', JSON.stringify(this.todos));
    },

    loadTodos() {
        const saved = localStorage.getItem('todos');
        if (saved) {
            try {
                this.todos = JSON.parse(saved);
                this.renderTodos();
            } catch (e) {
                console.error('Failed to parse todos', e);
            }
        }
    },

    renderTodos() {
        const list = document.getElementById('todo-list');
        if (!list) return;

        list.innerHTML = this.todos.map(todo => `
            <div class="todo-item ${todo.completed ? 'completed' : ''}" data-id="${todo.id}">
                <input type="checkbox" ${todo.completed ? 'checked' : ''} class="todo-checkbox">
                <span class="todo-text" contenteditable="true">${this.escapeHtml(todo.text)}</span>
                <div class="todo-actions">
                    <button class="delete-todo" title="Delete">&#10005;</button>
                </div>
            </div>
        `).join('');

        // Add event listeners
        list.querySelectorAll('.todo-checkbox').forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                const id = parseInt(e.target.closest('.todo-item').dataset.id);
                this.toggleTodo(id);
            });
        });

        list.querySelectorAll('.delete-todo').forEach(button => {
            button.addEventListener('click', (e) => {
                const id = parseInt(e.target.closest('.todo-item').dataset.id);
                this.deleteTodo(id);
            });
        });

        list.querySelectorAll('.todo-text').forEach(span => {
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
    },

    escapeHtml(unsafe) {
        return unsafe
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    },

    destroy() {
        // Todos are persisted, no cleanup needed
    }
};
