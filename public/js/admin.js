// public/js/admin.js — логика админ-панели с поддержкой продуктов

class AdminPanel {
    constructor() {
        this.password = null;
        this.currentContent = null;
        this.init();
    }

    init() {
        this.loginBtn = document.getElementById('login-btn');
        this.saveBtn = document.getElementById('save-btn');
        this.logoutBtn = document.getElementById('logout-btn');
        this.addProductBtn = document.getElementById('add-product-ru');

        this.loginSection = document.getElementById('login-section');
        this.editSection = document.getElementById('edit-section');

        this.loginStatus = document.getElementById('login-status');
        this.saveStatus = document.getElementById('save-status');

        this.loginBtn?.addEventListener('click', () => this.login());
        this.saveBtn?.addEventListener('click', () => this.saveContent());
        this.logoutBtn?.addEventListener('click', () => this.logout());
        this.addProductBtn?.addEventListener('click', () => this.addProductForm());

        this.loginSection.style.display = 'block';
    }

    async login() {
        const passwordInput = document.getElementById('password');
        const password = passwordInput.value.trim();

        if (!password) {
            this.showStatus(this.loginStatus, 'Введите пароль', 'error');
            return;
        }

        try {
            const response = await fetch('/api/content', {
                headers: { 'Authorization': `Bearer ${password}` }
            });

            if (response.ok) {
                this.currentContent = await response.json();
                this.password = password;
                this.fillForm();
                this.loginSection.style.display = 'none';
                this.editSection.style.display = 'block';
                this.showStatus(this.loginStatus, 'Успешный вход!', 'success');
            } else {
                const err = await response.json();
                this.showStatus(this.loginStatus, err.error || 'Ошибка входа', 'error');
            }
        } catch (err) {
            this.showStatus(this.loginStatus, 'Не удаётся подключиться к серверу', 'error');
        }
    }

    fillForm() {
        const ru = this.currentContent.ru;

        document.getElementById('problem-title-ru').value = ru.problem?.title || '';
        document.getElementById('problem-desc-ru').value = ru.problem?.description || '';
        document.getElementById('problem-items-ru').value = (ru.problem?.items || []).join('\n');

        this.renderProducts();
    }

    renderProducts() {
        const container = document.getElementById('products-list-ru');
        const products = this.currentContent.ru.products || [];
        container.innerHTML = '';

        products.forEach((product, index) => {
            const card = document.createElement('div');
            card.className = 'product-card';
            card.innerHTML = `
                <div class="form-group">
                    <label>Название</label>
                    <input type="text" class="product-name" value="${this.escapeHtml(product.name || '')}">
                </div>
                <div class="form-group">
                    <label>Размеры</label>
                    <input type="text" class="product-dimensions" value="${this.escapeHtml(product.dimensions || '')}">
                </div>
                <div class="form-group">
                    <label>Масса</label>
                    <input type="text" class="product-weight" value="${this.escapeHtml(product.weight || '')}">
                </div>
                <div class="form-group">
                    <label>Напряжение</label>
                    <input type="text" class="product-voltage" value="${this.escapeHtml(product.voltage || '')}">
                </div>
                <div class="form-group">
                    <label>Скорость</label>
                    <input type="text" class="product-speed" value="${this.escapeHtml(product.speed || '')}">
                </div>
                <div class="form-group">
                    <label>Мощность</label>
                    <input type="text" class="product-power" value="${this.escapeHtml(product.power || '')}">
                </div>
                <div class="form-group">
                    <label>Крутящий момент</label>
                    <input type="text" class="product-torque" value="${this.escapeHtml(product.torque || '')}">
                </div>
                <div class="form-group">
                    <label>КПД</label>
                    <input type="text" class="product-efficiency" value="${this.escapeHtml(product.efficiency || '')}">
                </div>
                <button class="delete-product" data-index="${index}">Удалить</button>
            `;
            container.appendChild(card);
        });

        // Обработчики удаления
        container.querySelectorAll('.delete-product').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const index = parseInt(e.target.dataset.index);
                this.currentContent.ru.products.splice(index, 1);
                this.renderProducts();
            });
        });
    }

    addProductForm() {
        const newProduct = {
            id: 'product-' + Date.now(),
            name: '',
            dimensions: '',
            weight: '',
            voltage: '',
            speed: '',
            power: '',
            torque: '',
            efficiency: ''
        };
        this.currentContent.ru.products = this.currentContent.ru.products || [];
        this.currentContent.ru.products.push(newProduct);
        this.renderProducts();
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    async saveContent() {
        // Сохраняем тексты
        const ru = this.currentContent.ru;
        ru.problem = ru.problem || {};
        ru.problem.title = document.getElementById('problem-title-ru').value;
        ru.problem.description = document.getElementById('problem-desc-ru').value;
        ru.problem.items = document.getElementById('problem-items-ru').value
            .split('\n')
            .map(line => line.trim())
            .filter(line => line);

        // Сохраняем продукты из форм
        const cards = document.querySelectorAll('#products-list-ru .product-card');
        ru.products = Array.from(cards).map(card => ({
            id: ru.products[Array.from(cards).indexOf(card)]?.id || 'product-' + Date.now(),
            name: card.querySelector('.product-name').value,
            dimensions: card.querySelector('.product-dimensions').value,
            weight: card.querySelector('.product-weight').value,
            voltage: card.querySelector('.product-voltage').value,
            speed: card.querySelector('.product-speed').value,
            power: card.querySelector('.product-power').value,
            torque: card.querySelector('.product-torque').value,
            efficiency: card.querySelector('.product-efficiency').value
        }));

        try {
            const response = await fetch('/api/content', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.password}`
                },
                body: JSON.stringify(this.currentContent)
            });

            if (response.ok) {
                this.showStatus(this.saveStatus, 'Все изменения сохранены!', 'success');
                if (window.opener?.motorproI18n?.reloadContent) {
                    window.opener.motorproI18n.reloadContent();
                }
            } else {
                const err = await response.json();
                this.showStatus(this.saveStatus, err.error || 'Ошибка сохранения', 'error');
            }
        } catch (err) {
            this.showStatus(this.saveStatus, 'Не удалось сохранить: ' + err.message, 'error');
        }
    }

    logout() {
        this.password = null;
        this.currentContent = null;
        this.loginSection.style.display = 'block';
        this.editSection.style.display = 'none';
        document.getElementById('password').value = '';
    }

    showStatus(element, text, type) {
        element.textContent = text;
        element.className = `status ${type}`;
        element.style.display = 'block';
        setTimeout(() => {
            element.style.display = 'none';
        }, 5000);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new AdminPanel();
});