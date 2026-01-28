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
        this.holidays = new Map();         // Feriados carregados da API
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
                this.migrateMarks();
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

    /**
     * Migra marcações antigas que têm colorName/colorValue para o novo formato
     * Remove campos desnecessários e mantém apenas colorId
     */
    migrateMarks() {
        let needsSave = false;
        for (const [dateKey, marksForDate] of this.dayMarks) {
            for (const [colorId, mark] of marksForDate) {
                // Verifica se a marcação tem campos que devem ser removidos
                if (mark.hasOwnProperty('colorName') || mark.hasOwnProperty('colorValue')) {
                    // Remove campos desnecessários - serão buscados dinamicamente
                    delete mark.colorName;
                    delete mark.colorValue;
                    needsSave = true;
                }
            }
        }
        if (needsSave) {
            this.saveMarksToStorage();
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

    addMark(date, colorId, note = null) {
        if (!date || !colorId) throw new Error('Data e ID da cor são obrigatórios');

        const dateKey = this.getDateKey(date);
        if (!this.dayMarks.has(dateKey)) this.dayMarks.set(dateKey, new Map());
        const marksForDate = this.dayMarks.get(dateKey);

        if (marksForDate.size >= 4) throw new Error('Máximo de 4 marcações por dia');
        if (marksForDate.has(colorId)) throw new Error('Cor já marcada neste dia');

        const color = this.userColors.get(colorId);
        if (!color) throw new Error('Cor não encontrada');

        // Apenas colorId é armazenado - nome e valor são buscados dinamicamente
        const mark = { 
            colorId, 
            note: note || null,
            createdAt: new Date().toISOString() 
        };
        marksForDate.set(colorId, mark);
        this.saveMarksToStorage();
        return mark;
    }

    /**
     * Define ou atualiza a anotação de uma marcação
     * @param {Date} date - Data
     * @param {string} colorId - ID da cor
     * @param {string|null} note - Anotação (null para remover)
     * @returns {boolean} Sucesso
     */
    setMarkNote(date, colorId, note) {
        const dateKey = this.getDateKey(date);
        const marksForDate = this.dayMarks.get(dateKey);
        if (!marksForDate || !marksForDate.has(colorId)) return false;
        
        const mark = marksForDate.get(colorId);
        mark.note = note;
        mark.updatedAt = new Date().toISOString();
        this.saveMarksToStorage();
        return true;
    }

    /**
     * Obtém a anotação de uma marcação
     * @param {Date} date - Data
     * @param {string} colorId - ID da cor
     * @returns {string|null} Anotação ou null
     */
    getMarkNote(date, colorId) {
        const dateKey = this.getDateKey(date);
        const marksForDate = this.dayMarks.get(dateKey);
        if (!marksForDate || !marksForDate.has(colorId)) return null;
        return marksForDate.get(colorId).note;
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
                // Busca nome e valor dinamicamente da paleta de cores
                marks.push({ ...mark, colorId, colorName: color.name, colorValue: color.color });
            } else {
                // Fallback se a cor foi removida
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
                    if (color) {
                        // Busca nome e valor dinamicamente da paleta de cores
                        marks.push({ date: dateKey, colorId, colorName: color.name, colorValue: color.color });
                    }
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

    getColorsSortedByName() {
        return this.getAllColors().sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
    }

    getMarksThisWeek() {
        const today = new Date();
        // Corrige timezone: usa hora local
        const weekAgo = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 7);
        return this.getAllMarks().filter(mark => {
            // Corrige timezone criando data a partir dos componentes
            const [year, month, day] = mark.date.split('-').map(Number);
            const d = new Date(year, month - 1, day);
            return d >= weekAgo && d <= today;
        });
    }

    getAllMarks() {
        const marks = [];
        for (const [dateKey, marksForDate] of this.dayMarks) {
            for (const [colorId, mark] of marksForDate) {
                const color = this.userColors.get(colorId);
                if (color) {
                    // Busca nome e valor dinamicamente da paleta de cores
                    marks.push({ date: dateKey, colorId, colorName: color.name, colorValue: color.color });
                }
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
    // APIs
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
            fetch(`https://api.invertexto.com/v1/holidays/${year}?token=24373|nxBaHkHrd9Vzj1sZuLvnAiTgKi4mzYxy&state=TO`)
                .then(r => { if (!r.ok) throw new Error('Falha'); return r.json(); })
                .then(d => resolve(d))
                .catch(e => reject(e));
        });
    }

    async loadHolidaysWithAsync(year) {
        try {
            const r = await fetch(`https://api.invertexto.com/v1/holidays/${year}?token=24373|nxBaHkHrd9Vzj1sZuLvnAiTgKi4mzYxy&state=TO`);
            if (!r.ok) throw new Error(`Erro: ${r.status}`);
            return await r.json();
        } catch (e) {
            console.warn('Aviso:', e.message);
            return [];
        }
    }

    // ===========================
    // Feriados (API e Visualização)
    // ===========================

    // Feriados estáticos como fallback (Brasil - 2026)
    FALLBACK_HOLIDAYS_2026 = [
        { date: "2026-01-01", name: "Confraternização Universal", type: "national" },
        { date: "2026-02-17", name: "Carnaval", type: "national" },
        { date: "2026-02-18", name: "Carnaval", type: "national" },
        { date: "2026-02-19", name: "Quarta-feira de Cinzas", type: "national" },
        { date: "2026-04-03", name: "Sexta-feira Santa", type: "national" },
        { date: "2026-04-05", name: "Páscoa", type: "national" },
        { date: "2026-04-21", name: "Tiradentes", type: "national" },
        { date: "2026-05-01", name: "Dia do Trabalho", type: "national" },
        { date: "2026-09-07", name: "Independência do Brasil", type: "national" },
        { date: "2026-10-12", name: "Nossa Senhora Aparecida", type: "national" },
        { date: "2026-10-15", name: "Dia do Professor", type: "optional" },
        { date: "2026-10-20", name: "Dia do Policial Civil", type: "optional" },
        { date: "2026-11-02", name: "Finados", type: "national" },
        { date: "2026-11-15", name: "Proclamação da República", type: "national" },
        { date: "2026-11-20", name: "Consciência Negra", type: "national" },
        { date: "2026-12-24", name: "Véspera de Natal", type: "optional" },
        { date: "2026-12-25", name: "Natal", type: "national" },
        { date: "2026-12-31", name: "Véspera de Ano Novo", type: "optional" }
    ];

    /**
     * Processa e armazena lista de feriados da API
     * @param {Array} holidays - Array de feriados da BrasilAPI
     */
    setHolidays(holidays) {
        this.holidays.clear();
        if (!Array.isArray(holidays)) return;
        
        for (const holiday of holidays) {
            // Formato da API: { date: "2025-01-01", name: "Confraternização Universal", type: "national" }
            this.holidays.set(holiday.date, {
                name: holiday.name,
                type: holiday.type || 'national',
                date: holiday.date
            });
        }
    }

    /**
     * Carrega feriados com fallback para dados estáticos
     * @param {number} year - Ano
     * @returns {Promise<Array>} Array de feriados
     */
    async loadHolidaysWithFallback(year) {
        try {
            // Tenta carregar da API
            const response = await fetch(`https://api.invertexto.com/v1/holidays/${year}?token=24373|nxBaHkHrd9Vzj1sZuLvnAiTgKi4mzYxy&state=TO`);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            const holidays = await response.json();
            this.setHolidays(holidays);
            return holidays;
        } catch (error) {
            console.warn(`API de feriados falhou (${error.message}), usando dados de fallback`);
            // Usa dados de fallback
            const fallbackYear = year === 2026 ? this.FALLBACK_HOLIDAYS_2026 : this.FALLBACK_HOLIDAYS_2026.map(h => ({
                ...h,
                date: h.date.replace('2026', String(year))
            }));
            this.setHolidays(fallbackYear);
            return fallbackYear;
        }
    }

    /**
     * Obtém feriado para uma data específica
     * @param {Date} date - Data
     * @returns {object|null} Feriado ou null
     */
    getHolidayForDate(date) {
        const dateKey = this.getDateKey(date);
        return this.holidays.get(dateKey) || null;
    }

    /**
     * Obtém todos os feriados de um mês
     * @param {number} year - Ano
     * @param {number} month - Mês (0-11)
     * @returns {Array} Array de feriados
     */
    getHolidaysForMonth(year, month) {
        const monthStr = String(month + 1).padStart(2, '0');
        const holidays = [];
        for (const [dateKey, holiday] of this.holidays) {
            if (dateKey.startsWith(`${year}-${monthStr}`)) {
                holidays.push(holiday);
            }
        }
        return holidays;
    }

    /**
     * Verifica se uma data é feriado
     * @param {Date} date - Data
     * @returns {boolean}
     */
    isHoliday(date) {
        return this.holidays.has(this.getDateKey(date));
    }
}

export const dataManager = new DataManager();

