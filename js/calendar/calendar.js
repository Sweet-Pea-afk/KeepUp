/**
 * Módulo de Calendário
 * 
 * Lógica principal de renderização e gerenciamento
 * do calendário visual.
 */

import { dataManager } from '../data/data.js';
import { 
    formatMonthYear, 
    getFirstDayOfMonth, 
    getDaysInMonth, 
    getDayOfWeek,
    isToday 
} from '../utils/utils.js';

/**
 * Classe responsável pela lógica do calendário
 */
export class CalendarManager {
    constructor() {
        this.currentDate = new Date();
        this.viewYear = this.currentDate.getFullYear();
        this.viewMonth = this.currentDate.getMonth();
    }

    /**
     * Inicializa o calendário
     */
    init() {
        // Restaura estado da URL se existir (Req. 7 - History API)
        const savedState = dataManager.restoreFromHistory();
        if (savedState) {
            this.viewYear = savedState.year;
            this.viewMonth = savedState.month;
        }
        this.render();
    }

    /**
     * Renderiza o calendário completo
     */
    render() {
        this.renderHeader();
        this.renderGrid();
    }

    /**
     * Renderiza o cabeçalho com navegação de meses
     */
    renderHeader() {
        const headerDate = new Date(this.viewYear, this.viewMonth, 1);
        const monthYearText = formatMonthYear(headerDate);
        
        const currentMonthEl = document.getElementById('currentMonth');
        if (currentMonthEl) {
            currentMonthEl.textContent = monthYearText;
        }
    }

    /**
     * Renderiza o grid do calendário
     */
    renderGrid() {
        const grid = document.getElementById('calendarGrid');
        if (!grid) return;

        grid.innerHTML = '';

        const firstDayOfMonth = getFirstDayOfMonth(new Date(this.viewYear, this.viewMonth, 1));
        const daysInMonth = getDaysInMonth(new Date(this.viewYear, this.viewMonth, 1));
        const today = new Date();

        // Obtém o primeiro dia da semana (0 = Domingo)
        const startDayOfWeek = getDayOfWeek(firstDayOfMonth);

        // Dias do mês anterior (preenchimento)
        const daysInPrevMonth = getDaysInMonth(new Date(this.viewYear, this.viewMonth, 0));
        for (let i = startDayOfWeek - 1; i >= 0; i--) {
            const day = daysInPrevMonth - i;
            const date = new Date(this.viewYear, this.viewMonth - 1, day);
            this.createDayCell(date, grid, true);
        }

        // Dias do mês atual
        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(this.viewYear, this.viewMonth, day);
            const isTodayDate = isToday(date);
            this.createDayCell(date, grid, false, isTodayDate);
        }

        // Dias do próximo mês (preenchimento) - completar até 42 células (6 semanas)
        const totalCells = startDayOfWeek + daysInMonth;
        const remainingCells = 42 - totalCells;
        
        for (let day = 1; day <= remainingCells; day++) {
            const date = new Date(this.viewYear, this.viewMonth + 1, day);
            this.createDayCell(date, grid, true);
        }
    }

    /**
     * Cria uma célula de dia no grid
     * @param {Date} date - Data
     * @param {HTMLElement} grid - Container do grid
     * @param {boolean} isOtherMonth - Se é de outro mês
     * @param {boolean} isTodayDate - Se é hoje
     */
    createDayCell(date, grid, isOtherMonth, isTodayDate = false) {
        const cell = document.createElement('div');
        cell.className = 'calendar-day';
        
        if (isOtherMonth) {
            cell.classList.add('other-month');
        }
        
        if (isTodayDate) {
            cell.classList.add('today');
        }

        // Verifica se é feriado
        const holiday = dataManager.getHolidayForDate(date);
        if (holiday) {
            cell.classList.add('is-holiday');
            cell.setAttribute('data-holiday', holiday.name);
            cell.setAttribute('data-holiday-name', holiday.name);
        }

        // Adiciona data para clique
        const dateKey = dataManager.getDateKey(date);
        cell.setAttribute('data-date', dateKey);

        // Número do dia
        const dayNumber = document.createElement('div');
        dayNumber.className = 'day-number';
        dayNumber.textContent = date.getDate();
        cell.appendChild(dayNumber);

        // Marcações - agora permitidas em qualquer dia!
        const marks = dataManager.getMarksForDate(date);
        
        if (marks.length > 0) {
            cell.classList.add('has-markers');
            const markersContainer = this.createMarkersContainer(marks);
            cell.appendChild(markersContainer);
        }

        // Accessibility
        cell.setAttribute('role', 'button');
        cell.setAttribute('tabindex', '0');
        const holidayLabel = holiday ? `, ${holiday.name}` : '';
        cell.setAttribute('aria-label', `Dia ${date.getDate()}, ${date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}${holidayLabel}`);

        grid.appendChild(cell);
    }

    /**
     * Adiciona ou remove uma marcação
     * @param {Date} date - Data
     * @param {string} colorId - ID da cor
     */
    toggleMark(date, colorId) {
        try {
            if (dataManager.hasMark(date, colorId)) {
                dataManager.removeMark(date, colorId);
            } else {
                dataManager.addMark(date, colorId);
            }
            this.renderGrid();
        } catch (error) {
            alert(error.message);
        }
    }

    /**
     * Cria o container de marcadores para uma célula
     * @param {Array} marks - Lista de marcações
     * @returns {HTMLElement} Container de marcadores
     */
    createMarkersContainer(marks) {
        const container = document.createElement('div');
        container.className = 'day-markers';

        marks.forEach(mark => {
            const markerSection = document.createElement('div');
            markerSection.className = 'day-marker-section';
            markerSection.style.backgroundColor = mark.colorValue;
            
            // Calculate text color for high contrast
            const textColor = this.getContrastColor(mark.colorValue);
            markerSection.style.color = textColor;

            const labelEl = document.createElement('span');
            labelEl.className = 'day-marker-label';
            labelEl.textContent = mark.colorName;
            markerSection.title = mark.colorName;
            
            markerSection.appendChild(labelEl);
            container.appendChild(markerSection);
        });

        return container;
    }

    /**
     * Calculates high-contrast text color (white or black) based on background
     * @param {string} hexColor - Background color in hex
     * @returns {string} White or black based on contrast
     */
    getContrastColor(hexColor) {
        // Remove hash if present
        const hex = hexColor.replace('#', '');
        
        // Parse RGB values
        const r = parseInt(hex.substring(0, 2), 16);
        const g = parseInt(hex.substring(2, 4), 16);
        const b = parseInt(hex.substring(4, 6), 16);
        
        // Calculate luminance
        const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
        
        // Return black for light backgrounds, white for dark backgrounds
        return luminance > 0.5 ? '#1f2937' : '#ffffff';
    }

    /**
     * Navega para o mês anterior
     */
    prevMonth() {
        this.viewMonth--;
        if (this.viewMonth < 0) {
            this.viewMonth = 11;
            this.viewYear--;
        }
        // Atualiza History API (Req. 7)
        dataManager.updateHistoryState(this.viewYear, this.viewMonth);
        this.render();
    }

    /**
     * Navega para o próximo mês
     */
    nextMonth() {
        this.viewMonth++;
        if (this.viewMonth > 11) {
            this.viewMonth = 0;
            this.viewYear++;
        }
        // Atualiza History API (Req. 7)
        dataManager.updateHistoryState(this.viewYear, this.viewMonth);
        this.render();
    }

    /**
     * Vai para o mês atual
     */
    goToToday() {
        const today = new Date();
        this.viewYear = today.getFullYear();
        this.viewMonth = today.getMonth();
        // Atualiza History API (Req. 7)
        dataManager.updateHistoryState(this.viewYear, this.viewMonth);
        this.render();
    }

    /**
     * Vai para um mês específico
     * @param {number} year - Ano
     * @param {number} month - Mês (0-11)
     */
    goToMonth(year, month) {
        this.viewYear = year;
        this.viewMonth = month;
        this.render();
    }

    /**
     * Obtém o mês e ano atuais
     * @returns {object} Objeto com year e month
     */
    getCurrentView() {
        return {
            year: this.viewYear,
            month: this.viewMonth
        };
    }

    /**
     * Verifica se a visualização atual é o mês atual
     * @returns {boolean} True se for o mês atual
     */
    isCurrentView() {
        const today = new Date();
        return this.viewYear === today.getFullYear() && this.viewMonth === today.getMonth();
    }

    /**
     * Atualiza a visualização (re-renderiza)
     */
    refresh() {
        this.render();
    }
}

// Exporta uma instância única do gerenciador de calendário
export const calendarManager = new CalendarManager();

