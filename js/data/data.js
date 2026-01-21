// Módulo de Dados - Gerenciamento de cores, marcações e APIs por usuário

import { generateId, generateStorageKey, COLOR_MAP } from '../utils/utils.js';

// Chaves do localStorage
const USERS_STORAGE_KEY = generateStorageKey('users');
const CURRENT_USER_KEY = generateStorageKey('current_user');

export class DataManager {
    constructor() {
        this.currentUser = null;
        this.userColors = new Map();      // Cores do usuário atual
        this.dayMarks = new Map();         // Marcações do usuário atual
        this.tempColors = new Map();       // Cores temporárias (não logado)
        this.tempMarks = new Map();        // Marcações temporárias (não logado)
        this.loadCurrentUser();
    }

    // ===========================
    // Gerenciamento de Usuários
    // ===========================

    loadCurrentUser() {
        try {
            const stored = localStorage.getItem(CURRENT_USER_KEY);
            if (stored) {
                this.currentUser = JSON.parse(stored);
                this.loadUserData(this.currentUser.email);
            } else {
                // Modo anônimo - usa dados temporários
                this.userColors = this.tempColors;
                this.dayMarks = this.tempMarks;
            }
        } catch (error) {
            console.error('Erro ao carregar usuário:', error);
            this.currentUser = null;
        }
    }

    saveCurrentUser(email) {
        this.currentUser = { email, loginAt: new Date().toISOString() };
        localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(this.currentUser));
    }

    clearCurrentUser() {
        this.currentUser = null;
        localStorage.removeItem(CURRENT_USER_KEY);
    }

    // Carrega dados de um usuário específico do localStorage
    loadUserData(email) {
        if (!email) return;

        try {
            const usersData = localStorage.getItem(USERS_STORAGE_KEY);
            const users = usersData ? JSON.parse(usersData) : {};

            if (users[email]) {
                this.userColors = new Map(Object.entries(users[email].colors || {}));
                this.dayMarks = new Map();
                const marksObj = users[email].marks || {};
                for (const [dateKey, marksObjData] of Object.entries(marksObj)) {
                    this.dayMarks.set(dateKey, new Map(Object.entries(marksObjData)));
                }
                this.migrateColors();
            } else {
                this.userColors = new Map();
                this.dayMarks = new Map();
            }
        } catch (error) {
            console.error('Erro ao carregar dados do usuário:', error);
            this.userColors = new Map();
            this.dayMarks = new Map();
        }
    }

    // Salva dados do usuário atual no localStorage
    saveUserData() {
        if (!this.currentUser || !this.currentUser.email) return;

        try {
            const usersData = localStorage.getItem(USERS_STORAGE_KEY);
            const users = usersData ? JSON.parse(usersData) : {};

            users[this.currentUser.email] = {
                colors: Object.fromEntries(this.userColors),
                marks: {}
            };

            for (const [dateKey, marks] of this.dayMarks) {
                users[this.currentUser.email].marks[dateKey] = Object.fromEntries(marks);
            }

            localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
        } catch (error) {
            console.error('Erro ao salvar dados do usuário:', error);
        }
    }

    // ===========================
    // Login/Logout
    // ===========================

    // Faz login - descarta dados temporários e carrega dados do usuário
    login(email) {
        if (!email || email.trim() === '') {
            throw new Error('Email é obrigatório');
        }

        // Limpa dados temporários (não logado)
        this.tempColors.clear();
        this.tempMarks.clear();

        // Configura novo usuário
        this.saveCurrentUser(email.trim());
        this.loadUserData(email.trim());
    }

    // Faz logout - volta para modo anônimo com dados temporários
    logout() {
        // Limpa usuário atual
        this.clearCurrentUser();

        // Configura dados temporários vazios para modo anônimo
        this.userColors = this.tempColors;
        this.dayMarks = this.tempMarks;
        this.userColors.clear();
        this.dayMarks.clear();
    }

    // Continuar sem login - usa dados temporários
    skipLogin() {
        this.currentUser = null;
        this.userColors = this.tempColors;
        this.dayMarks = this.tempMarks;
    }

    isLoggedIn() {
        return this.currentUser !== null && !!this.currentUser.email;
    }

    isAnonymous() {
        return !this.currentUser;
    }

    // ===========================
    // Cores
    // ===========================

    migrateColors() {
        let needsSave = false;
        for (const [id, color] of this.userColors) {
            if (color.color && !color.color.startsWith('#')) {
                const hexValue = COLOR_MAP[color.color];
                if (hexValue) {
                    color.color = hexValue;
                    needsSave = true;
                }
            }
        }
        if (needsSave) {
            this.saveColorsToStorage();
        }
    }

    loadColorsFromStorage() {
        if (this.currentUser && this.currentUser.email) {
            this.loadUserData(this.currentUser.email);
        }
    }

    saveColorsToStorage() {
        this.saveUserData();
    }

    addColor(name, color) {
        const colorObj = {
            id: generateId(),
            name: name.trim(),
            color: color,
            createdAt: new Date().toISOString()
        };
        this.userColors.set(colorObj.id, colorObj);
        this.saveColorsToStorage();
        return colorObj;
    }

    updateColor(colorId, updates) {
        const color = this.userColors.get(colorId);
        if (!color) return null;
        const updated = { ...color, ...updates, updatedAt: new Date().toISOString() };
        this.userColors.set(colorId, updated);
        this.saveColorsToStorage();
        return updated;
    }

    deleteColor(colorId) {
        const result = this.userColors.delete(colorId);
        if (result) {
            for (const [dateKey, marks] of this.dayMarks) {
                if (marks.has(colorId)) {
                    marks.delete(colorId);
                    if (marks.size === 0) this.dayMarks.delete(dateKey);
                }
            }
            this.saveColorsToStorage();
            this.saveMarksToStorage();
        }
        return result;
    }

    getAllColors() {
        return Array.from(this.userColors.values());
    }

    getColorById(colorId) {
        return this.userColors.get(colorId) || null;
    }

    hasColors() {
        return this.userColors.size > 0;
    }

    // ===========================
    // Marcações
    // ===========================

    getDateKey(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    loadMarksFromStorage() {
        if (this.currentUser && this.currentUser.email) {
            this.loadUserData(this.currentUser.email);
        }
    }

    saveMarksToStorage() {
        this.saveUserData();
    }

    loadFromStorage() {
        this.loadColorsFromStorage();
        this.loadMarksFromStorage();
    }

    addMark(date, colorId) {
        if (!date || !colorId) throw new Error('Data e ID da cor são obrigatórios');

        const dateKey = this.getDateKey(date);
        if (!this.dayMarks.has(dateKey)) this.dayMarks.set(dateKey, new Map());
        const marksForDate = this.dayMarks.get(dateKey);

        if (marksForDate.size >= 4) throw new Error('Máximo de 4 marcações por dia');
        if (marksForDate.has(colorId)) throw new Error('Cor já marcada neste dia');

        const color = this.userColors.get(colorId);
        if (!color) throw new Error('Cor não encontrada');

        const mark = { colorId, colorName: color.name, colorValue: color.color, createdAt: new Date().toISOString() };
        marksForDate.set(colorId, mark);
        this.saveMarksToStorage();
        return mark;
    }

    getMarksForDate(date) {
        if (!date) return [];
        const dateKey = this.getDateKey(date);
        const marksForDate = this.dayMarks.get(dateKey);
        if (!marksForDate || marksForDate.size === 0) return [];

        const marks = [];
        for (const [colorId, mark] of marksForDate) {
            const color = this.userColors.get(colorId);
            if (color) {
                marks.push({ ...mark, colorId, colorName: color.name, colorValue: color.color });
            } else {
                marks.push({ ...mark, colorId, colorName: 'Cor removida', colorValue: '#9ca3af' });
            }
        }
        return marks;
    }

    getMarksForMonth(year, month) {
        const monthStr = String(month + 1).padStart(2, '0');
        const marks = [];
        for (const [dateKey, marksForDate] of this.dayMarks) {
            if (dateKey.startsWith(`${year}-${monthStr}`)) {
                for (const [colorId, mark] of marksForDate) {
                    const color = this.userColors.get(colorId);
                    if (color) marks.push({ date: dateKey, colorId, colorName: color.name, colorValue: color.color });
                }
            }
        }
        return marks;
    }

    removeMark(date, colorId) {
        const dateKey = this.getDateKey(date);
        const marksForDate = this.dayMarks.get(dateKey);
        if (!marksForDate) return false;
        const result = marksForDate.delete(colorId);
        if (result) {
            if (marksForDate.size === 0) this.dayMarks.delete(dateKey);
            this.saveMarksToStorage();
        }
        return result;
    }

    removeAllMarksForDate(date) {
        const dateKey = this.getDateKey(date);
        if (!this.dayMarks.has(dateKey)) return false;
        this.dayMarks.delete(dateKey);
        this.saveMarksToStorage();
        return true;
    }

    hasMark(date, colorId) {
        return this.dayMarks.get(this.getDateKey(date))?.has(colorId) || false;
    }

    countMarks(date) {
        return this.dayMarks.get(this.getDateKey(date))?.size || 0;
    }

    canAddMark(date) {
        return this.countMarks(date) < 4;
    }

    // ===========================
    // Limpeza
    // ===========================

    clearAll() {
        this.userColors.clear();
        this.dayMarks.clear();
        this.tempColors.clear();
        this.tempMarks.clear();
        localStorage.removeItem(USERS_STORAGE_KEY);
        localStorage.removeItem(CURRENT_USER_KEY);
    }

    // ===========================
    // Array Methods (Req. 2)
    // ===========================

    getColorsSortedByName() {
        return this.getAllColors().sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
    }

    getMarksThisWeek() {
        const today = new Date();
        const weekAgo = new Date(today);
        weekAgo.setDate(weekAgo.getDate() - 7);
        return this.getAllMarks().filter(mark => {
            const d = new Date(mark.date);
            return d >= weekAgo && d <= today;
        });
    }

    getAllMarks() {
        const marks = [];
        for (const [dateKey, marksForDate] of this.dayMarks) {
            for (const [colorId, mark] of marksForDate) {
                const color = this.userColors.get(colorId);
                if (color) marks.push({ date: dateKey, colorId, colorName: color.name, colorValue: color.color });
            }
        }
        return marks;
    }

    getMarksCountByColor() {
        return this.getAllMarks().reduce((acc, mark) => {
            const existing = acc.find(c => c.colorId === mark.colorId);
            if (existing) existing.count++;
            else acc.push({ colorId: mark.colorId, colorName: mark.colorName, colorValue: mark.colorValue, count: 1 });
            return acc;
        }, []);
    }

    // ===========================
    // APIs HTML5 (Req. 5, 6, 7)
    // ===========================

    updateHistoryState(year, month) {
        const url = `?month=${year}-${String(month + 1).padStart(2, '0')}`;
        history.pushState({ year, month }, '', url);
    }

    restoreFromHistory() {
        const params = new URLSearchParams(window.location.search);
        const monthParam = params.get('month');
        if (monthParam && monthParam.includes('-')) {
            const [year, month] = monthParam.split('-').map(Number);
            return { year, month: month - 1 };
        }
        return null;
    }

    loadHolidaysWithPromise(year) {
        return new Promise((resolve, reject) => {
            fetch(`https://brasilapi.com.br/api/feriados/v1/${year}`)
                .then(r => { if (!r.ok) throw new Error('Falha'); return r.json(); })
                .then(d => resolve(d))
                .catch(e => reject(e));
        });
    }

    async loadHolidaysWithAsync(year) {
        try {
            const r = await fetch(`https://brasilapi.com.br/api/feriados/v1/${year}`);
            if (!r.ok) throw new Error(`Erro: ${r.status}`);
            return await r.json();
        } catch (e) {
            console.warn('Aviso:', e.message);
            return [];
        }
    }
}

export const dataManager = new DataManager();

