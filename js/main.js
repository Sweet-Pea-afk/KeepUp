/**
 * Main Entry Point - Calendário com Login por Usuário
 */
import { calendarManager } from './calendar/calendar.js';
import { uiManager } from './ui/ui.js';
import { dataManager } from './data/data.js';

class CalendarApp {
    constructor() {
        this.isInitialized = false;
    }

    init() {
        if (this.isInitialized) return;

        try {
            this.setupAuth();
            this.setupStrictMode();
            this.setupGlobalListeners();
            this.isInitialized = true;
            console.log('✅ Calendário inicializado');
        } catch (error) {
            console.error('❌ Erro ao inicializar:', error);
        }
    }

    // ===========================
    // Auth - Login por Usuário
    // ===========================

    setupAuth() {
        if (dataManager.isLoggedIn()) {
            this.showApp();
        } else {
            this.showLogin();
        }

        // Formulário de login
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleLogin();
            });
        }

        // Botão "Continuar sem login"
        const skipBtn = document.getElementById('skipLoginBtn');
        if (skipBtn) {
            skipBtn.addEventListener('click', () => this.handleSkipLogin());
        }

        // Botão de logout (usuário logado)
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => this.handleLogout());
        }

        // Botão de login (usuário anônimo)
        const loginBtn = document.getElementById('loginBtn');
        if (loginBtn) {
            loginBtn.addEventListener('click', () => this.showLogin());
        }
    }

    handleLogin() {
        const email = document.getElementById('loginEmail')?.value?.trim();
        const password = document.getElementById('loginPassword')?.value;
        const errorEl = document.getElementById('loginError');

        if (!email || !password) {
            errorEl.textContent = 'Preencha email e senha';
            errorEl.classList.remove('hidden');
            return;
        }

        // Hide app content first to prevent showing old/anonymous data
        document.getElementById('appContent')?.classList.add('hidden');
        
        // Login do usuário
        dataManager.login(email);
        this.showApp();
    }

    handleSkipLogin() {
        // Continuar sem login - usa dados temporários
        // Clear calendar first to prevent showing old user data
        calendarManager.clearRender();
        
        dataManager.skipLogin();
        this.showApp();
    }

    handleLogout() {
        // Faz logout - volta para modo anônimo
        dataManager.logout();
        
        // Clear calendar UI immediately to prevent showing old data
        calendarManager.clearRender();
        
        // Hide app content first, then show login
        document.getElementById('appContent')?.classList.add('hidden');
        document.getElementById('loginScreen')?.classList.remove('hidden');
        
        // Update auth buttons
        const logoutBtn = document.getElementById('logoutBtn');
        const loginBtn = document.getElementById('loginBtn');
        if (logoutBtn) logoutBtn.classList.add('hidden');
        if (loginBtn) loginBtn.classList.remove('hidden');
        
        // Clear login form
        document.getElementById('loginError')?.classList.add('hidden');
        document.getElementById('loginForm')?.reset();
    }

    showLogin() {
        document.getElementById('loginScreen')?.classList.remove('hidden');
        document.getElementById('appContent')?.classList.add('hidden');
        document.getElementById('loginError')?.classList.add('hidden');
        document.getElementById('loginForm')?.reset();
    }

    showApp() {
        document.getElementById('loginScreen')?.classList.add('hidden');
        document.getElementById('appContent')?.classList.remove('hidden');

        // Atualiza botões baseado no estado
        const logoutBtn = document.getElementById('logoutBtn');
        const loginBtn = document.getElementById('loginBtn');

        if (dataManager.isLoggedIn()) {
            // Usuário logado
            if (logoutBtn) logoutBtn.classList.remove('hidden');
            if (loginBtn) loginBtn.classList.add('hidden');
        } else {
            // Usuário anônimo
            if (logoutBtn) logoutBtn.classList.add('hidden');
            if (loginBtn) loginBtn.classList.remove('hidden');
        }

        this.initializeUI();
    }

    setupStrictMode() {
        'use strict';
    }

    setupGlobalListeners() {
        document.addEventListener('keydown', (e) => this.handleKeyNavigation(e));
        window.addEventListener('resize', () => {});
        document.addEventListener('dblclick', (e) => {
            if (e.target.closest('.calendar-day')) e.preventDefault();
        });
    }

    initializeUI() {
        // Carrega feriados primeiro, depois inicializa a UI
        this.loadHolidays().then(() => {
            uiManager.init();
        });
    }

    // ===========================
    // Feriados (Req. 5, 6)
    // ===========================

    async loadHolidays() {
        const year = new Date().getFullYear();
        this.showLoading(true);

        try {
            // Usa o método com fallback integrado
            const dados = await dataManager.loadHolidaysWithFallback(year);
            
            if (dados && dados.length > 0) {
                console.log(`✅ ${dados.length} feriados carregados para ${year}`);
            } else {
                console.log('⚠️ Nenhum feriado encontrado');
            }
        } catch (error) {
            console.error('❌ Erro ao carregar feriados:', error.message);
        } finally {
            this.showLoading(false);
        }
    }

    showLoading(show) {
        const indicator = document.getElementById('loadingIndicator');
        if (indicator) {
            show ? indicator.classList.remove('hidden') : indicator.classList.add('hidden');
        }
    }

    showError(message) {
        const errorEl = document.getElementById('errorMessage');
        if (errorEl) {
            errorEl.textContent = message;
            errorEl.classList.remove('hidden');
            setTimeout(() => errorEl.classList.add('hidden'), 5000);
        }
    }

    handleKeyNavigation(event) {
        if (event.key === 'Escape') {
            uiManager.closeDayModal();
            uiManager.closeColorsModal();
        }
        if (event.key === 'ArrowLeft' && !event.target.matches('input, textarea')) {
            calendarManager.prevMonth();
        } else if (event.key === 'ArrowRight' && !event.target.matches('input, textarea')) {
            calendarManager.nextMonth();
        } else if (event.key === 'Home' && !event.target.matches('input, textarea')) {
            calendarManager.goToToday();
        }
    }
}

// Inicializa
const app = new CalendarApp();

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => app.init());
} else {
    app.init();
}

window.CalendarApp = app;
window.calendarManager = calendarManager;
window.dataManager = dataManager;
window.uiManager = uiManager;

