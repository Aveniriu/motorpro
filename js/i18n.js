// public/js/i18n.js
// Система интернационализации с поддержкой динамической загрузки контента с сервера и продуктов

class I18n {
    constructor() {
        this.currentLang = 'ru';
        this.translations = {};
        this.isLoaded = false;
        this.init();
    }

    async init() {
        const savedLang = localStorage.getItem('motorpro-lang');
        if (savedLang) {
            this.currentLang = savedLang;
        } else {
            const browserLang = navigator.language.split('-')[0];
            if (['ru', 'en', 'zh'].includes(browserLang)) {
                this.currentLang = browserLang;
            }
        }

        await this.loadTranslations();
        this.applyLanguage();
        this.setupLanguageSwitcher();
    }

    async loadTranslations() {
        try {
            const response = await fetch('/content.json');
            if (!response.ok) throw new Error('Не удалось загрузить переводы');
            this.translations = await response.json();
            this.isLoaded = true;
        } catch (err) {
            console.error('Ошибка загрузки переводов:', err);
            this.translations = this.getFallbackTranslations();
            this.isLoaded = true;
        }
    }

    getFallbackTranslations() {
        return {
            ru: { site: { title: 'ООО НПП МоторПро' } },
            en: { site: { title: 'MotorPro LLC' } },
            zh: { site: { title: 'MotorPro有限责任公司' } }
        };
    }

    applyLanguage() {
        if (!this.isLoaded) return;

        document.documentElement.lang = this.currentLang;

        const title = this.getTranslation('site.title');
        if (title) document.title = title;

        // Локализация всех data-i18n элементов
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            const text = this.getTranslation(key);
            if (text && text !== `[${key}]`) {
                el.textContent = text;
            }
        });

        // Рендер динамических секций
        this.renderProducts();
        this.renderCompetitorsTable();

        // Обновление кнопок выбора языка
        document.querySelectorAll('.lang-switcher button').forEach(btn => {
            const lang = btn.getAttribute('data-lang');
            if (lang === this.currentLang) {
                btn.classList.add('active');
                btn.style.background = 'white';
                btn.style.color = '#D35400';
            } else {
                btn.classList.remove('active');
                btn.style.background = '';
                btn.style.color = 'white';
            }
        });

        // Сохранение в localStorage
        localStorage.setItem('motorpro-lang', this.currentLang);
    }

    renderProducts() {
        const container = document.getElementById('slider-container');
        const dotsContainer = document.getElementById('slider-dots');
        const prevBtn = document.getElementById('prev-btn');
        const nextBtn = document.getElementById('next-btn');
        
        if (!container || !dotsContainer || !prevBtn || !nextBtn) return;

        const products = this.translations[this.currentLang]?.products || [];
        if (products.length === 0) {
            container.innerHTML = '<p>Нет продуктов</p>';
            dotsContainer.innerHTML = '';
            return;
        }

        // Генерируем слайды
        container.innerHTML = '';
        dotsContainer.innerHTML = '';

        products.forEach((product, index) => {
            // Создаём слайд
            const slide = document.createElement('div');
            slide.className = 'slider-slide';
            if (index === 0) slide.classList.add('active');

            slide.innerHTML = `
                <h3 style="margin-bottom: 1rem; color: var(--primary-orange);">${product.name || (this.currentLang === 'ru' ? 'Без названия' : this.currentLang === 'en' ? 'No name' : '无名称')}</h3>
                <table class="table table-striped">
                    <tbody>
                        <tr><td>${this.getTranslation('product.dimensions')}</td><td>${product.dimensions || ''}</td></tr>
                        <tr><td>${this.getTranslation('product.weight')}</td><td>${product.weight || ''}</td></tr>
                        <tr><td>${this.getTranslation('product.voltage')}</td><td>${product.voltage || ''}</td></tr>
                        <tr><td>${this.getTranslation('product.speed')}</td><td>${product.speed || ''}</td></tr>
                        <tr><td>${this.getTranslation('product.power')}</td><td>${product.power || ''}</td></tr>
                        <tr><td>${this.getTranslation('product.torque')}</td><td>${product.torque || ''}</td></tr>
                        <tr><td>${this.getTranslation('product.efficiency')}</td><td>${product.efficiency || ''}</td></tr>
                    </tbody>
                </table>
            `;
            container.appendChild(slide);

            // Создаём точку
            const dot = document.createElement('div');
            dot.className = 'slider-dot';
            if (index === 0) dot.classList.add('active');
            dot.addEventListener('click', () => this.goToSlide(index));
            dotsContainer.appendChild(dot);
        });

        // Сохраняем состояние слайдера в экземпляре
        this.currentSlide = 0;
        this.totalSlides = products.length;

        // Обработчики кнопок
        prevBtn.onclick = () => this.goToSlide(this.currentSlide - 1);
        nextBtn.onclick = () => this.goToSlide(this.currentSlide + 1);

        // Обновляем кнопки
        this.updateSliderNav();
    }

renderCompetitorsTable() {
    const tableEl = document.getElementById('competitors-table');
    if (!tableEl) return;

    const data = this.translations[this.currentLang];
    if (!data?.competitorProducts) {
        tableEl.innerHTML = '<tr><td>Таблица не доступна</td></tr>';
        return;
    }

    const products = data.competitorProducts;
    const params = ['dimensions', 'voltage', 'speed', 'torque', 'efficiency', 'weight', 'power'];
    const paramLabels = {
        dimensions: this.getTranslation('competitors.dimensions'),
        voltage: this.getTranslation('competitors.voltage'),
        speed: this.getTranslation('competitors.speed'),
        torque: this.getTranslation('competitors.torque'),
        efficiency: this.getTranslation('competitors.efficiency'),
        weight: this.getTranslation('competitors.weight'),
        power: this.getTranslation('competitors.power')
    };
    const u = data.units || {};
    const locale = this.currentLang === 'ru' ? 'ru-RU' :
                   this.currentLang === 'zh' ? 'zh-CN' : 'en-US';
    const fmt = new Intl.NumberFormat(locale);

    // Начинаем строить HTML
    let html = '<thead><tr>';
    html += `<th>${this.getTranslation('competitors.parameter')}</th>`;
    products.forEach(p => {
        html += `<th>${p.name}</th>`;
    });
    html += '</tr></thead><tbody>';

    params.forEach(param => {
        html += '<tr>';
        html += `<td>${paramLabels[param]}</td>`;
        products.forEach(p => {
            const val = p[param];
            if (val == null) {
                html += '<td>—</td>';
            } else if (param === 'dimensions') {
                html += `<td>${val} ${u.mm || 'mm'}</td>`;
            } else if (param === 'voltage') {
                html += `<td>${fmt.format(val)} ${u.volts || 'V'}</td>`;
            } else if (param === 'speed') {
                html += `<td>${fmt.format(val)} ${u.rpm || 'RPM'}</td>`;
            } else if (param === 'torque') {
                html += `<td>${fmt.format(val)} ${u.millinewton_meters || 'mN·m'}</td>`;
            } else if (param === 'efficiency') {
                html += `<td>${val} ${u.percent || '%'}</td>`;
            } else if (param === 'weight') {
                html += `<td>${fmt.format(val)} ${u.grams || 'g'}</td>`;
            } else if (param === 'power') {
                html += `<td>${fmt.format(val)} ${u.watts || 'W'}</td>`;
            } else {
                html += `<td>${val}</td>`;
            }
        });
        html += '</tr>';
    });

    html += '</tbody>';
    tableEl.innerHTML = html;
}

    // Переключение слайда
    goToSlide(index) {
        if (index < 0) index = this.totalSlides - 1;
        if (index >= this.totalSlides) index = 0;

        // Убираем active у всех
        document.querySelectorAll('.slider-slide').forEach(s => s.classList.remove('active'));
        document.querySelectorAll('.slider-dot').forEach(d => d.classList.remove('active'));

        // Добавляем active к нужным
        document.querySelectorAll('.slider-slide')[index]?.classList.add('active');
        document.querySelectorAll('.slider-dot')[index]?.classList.add('active');

        this.currentSlide = index;
        this.updateSliderNav();
    }

    // Обновление состояния кнопок (для edge cases)
    updateSliderNav() {
        const prevBtn = document.getElementById('prev-btn');
        const nextBtn = document.getElementById('next-btn');
        if (!prevBtn || !nextBtn) return;

        // Если один слайд — кнопки не нужны
        if (this.totalSlides <= 1) {
            prevBtn.style.display = 'none';
            nextBtn.style.display = 'none';
            document.getElementById('slider-dots').style.display = 'none';
        } else {
            prevBtn.style.display = 'block';
            nextBtn.style.display = 'block';
            document.getElementById('slider-dots').style.display = 'flex';
        }
    }

    getTranslation(key) {
        const keys = key.split('.');
        let value = this.translations[this.currentLang];
        for (const k of keys) {
            if (value && value[k] !== undefined) {
                value = value[k];
            } else {
                return `[${key}]`;
            }
        }
        return value;
    }

    setupLanguageSwitcher() {
        document.querySelectorAll('.lang-switcher button').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const lang = e.target.getAttribute('data-lang');
                if (lang && lang !== this.currentLang) {
                    this.currentLang = lang;
                    this.applyLanguage();
                }
            });
        });
    }

    async reloadContent() {
        await this.loadTranslations();
        this.applyLanguage();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.motorproI18n = new I18n();
});