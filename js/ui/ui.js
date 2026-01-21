// Módulo de Interface - UI e modais

import { dataManager } from '../data/data.js';
import { calendarManager } from '../calendar/calendar.js';
import { formatDateReadable, COLOR_MAP } from '../utils/utils.js';

export class UIManager {
    constructor() {
        this.selectedColorId = null;
        this.selectedDate = null;
        this.initElements();
        this.bindEvents();
    }

    initElements() {
        const getEl = (id) => document.getElementById(id) || null;

        this.calendarGrid = getEl('calendarGrid');
        this.currentMonthEl = getEl('currentMonth');
        this.prevMonthBtn = getEl('prevMonth');
        this.nextMonthBtn = getEl('nextMonth');
        this.todayBtn = getEl('todayBtn');
        this.userColorsList = getEl('userColorsList');
        this.noColorsMessage = getEl('noColorsMessage');
        this.openColorsManager = getEl('openColorsManager');
        this.addFirstColor = getEl('addFirstColor');
        this.colorsModal = getEl('colorsModal');
        this.colorsModalBackdrop = getEl('colorsModalBackdrop');
        this.closeColorsModalBtn = getEl('closeColorsModal');
        this.colorForm = getEl('colorForm');
        this.colorNameInput = getEl('colorName');
        this.newColorValueInput = getEl('newColorValue');
        this.newColorPicker = getEl('newColorPicker');
        this.colorsList = getEl('colorsList');
        this.dayModal = getEl('dayModal');
        this.modalTitle = getEl('modalTitle');
        this.modalDate = getEl('modalDate');
        this.modalHoliday = getEl('modalHoliday');
        this.modalHolidayName = getEl('modalHolidayName');
        this.dayMarkers = getEl('dayMarkers');
        this.dayEmpty = getEl('dayEmpty');
        this.closeModalBtn = getEl('closeModal');
        this.modalBackdrop = getEl('modalBackdrop');
        this.removeAllMarksBtn = getEl('removeAllMarksBtn');
    }

    bindEvents() {
        this.prevMonthBtn?.addEventListener('click', () => this.navigateMonth(-1));
        this.nextMonthBtn?.addEventListener('click', () => this.navigateMonth(1));
        this.todayBtn?.addEventListener('click', () => this.goToToday());
        this.openColorsManager?.addEventListener('click', () => this.openColorsModal());
        this.addFirstColor?.addEventListener('click', () => this.openColorsModal());
        this.closeColorsModalBtn?.addEventListener('click', () => this.closeColorsModal());
        this.colorsModalBackdrop?.addEventListener('click', () => this.closeColorsModal());
        this.colorForm?.addEventListener('submit', (e) => this.handleColorSubmit(e));
        this.newColorPicker?.addEventListener('click', (e) => this.handleNewColorSelect(e));
        this.closeModalBtn?.addEventListener('click', () => this.closeDayModal());
        this.modalBackdrop?.addEventListener('click', () => this.closeDayModal());
        this.removeAllMarksBtn?.addEventListener('click', () => this.removeAllMarks());

        document.addEventListener('click', (e) => {
            const dayCell = e.target.closest('.calendar-day');
            if (dayCell && dayCell.hasAttribute('data-date')) {
                // Corrige problema de timezone criando data a partir dos componentes
                const dateStr = dayCell.getAttribute('data-date');
                const [year, month, day] = dateStr.split('-').map(Number);
                const date = new Date(year, month - 1, day);
                this.handleDayClick(date);
            }
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeDayModal();
                this.closeColorsModal();
            }
        });
    }

    handleDayClick(date) {
        const selectedColorId = this.selectedColorId;
        if (selectedColorId) {
            try {
                if (dataManager.hasMark(date, selectedColorId)) {
                    dataManager.removeMark(date, selectedColorId);
                } else {
                    dataManager.addMark(date, selectedColorId);
                }
                calendarManager.refresh();
            } catch (error) {
                alert(error.message);
            }
        } else {
            this.openDayModal(date);
        }
    }

    // Cores do usuário
    renderUserColors() {
        if (!this.userColorsList || !this.noColorsMessage) return;
        
        const colors = dataManager.getAllColors();

        if (colors.length === 0) {
            this.userColorsList.classList.add('hidden');
            this.noColorsMessage.classList.remove('hidden');
            return;
        }

        this.userColorsList.classList.remove('hidden');
        this.noColorsMessage.classList.add('hidden');

        this.userColorsList.innerHTML = colors.map(color => {
            const isSelected = this.selectedColorId === color.id;
            return `
                <div class="user-color-item ${isSelected ? 'selected' : ''}" data-color-id="${color.id}">
                    <span class="color-preview" style="background-color: ${color.color}"></span>
                    <span class="color-name">${color.name}</span>
                </div>
            `;
        }).join('');

        this.userColorsList.querySelectorAll('.user-color-item').forEach(item => {
            item.addEventListener('click', () => {
                this.selectColor(item.dataset.colorId);
            });
        });
    }

    selectColor(colorId) {
        this.selectedColorId = this.selectedColorId === colorId ? null : colorId;
        this.renderUserColors();
    }

    // Modal de cores
    openColorsModal() {
        if (!this.colorsModal) return;
        this.renderColorsList();
        this.colorForm.reset();
        this.newColorValueInput.value = '';
        this.updateNewColorSelection();
        this.colorsModal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
        setTimeout(() => this.colorNameInput?.focus(), 100);
    }

    closeColorsModal() {
        if (!this.colorsModal) return;
        this.colorsModal.classList.add('hidden');
        document.body.style.overflow = '';
    }

    renderColorsList() {
        const colors = dataManager.getAllColors();
        if (colors.length === 0) {
            this.colorsList.innerHTML = '<p class="text-sm text-gray-400 text-center py-4">Nenhuma cor cadastrada</p>';
            return;
        }

        this.colorsList.innerHTML = colors.map(color => `
            <div class="color-list-item" data-color-id="${color.id}">
                <span class="color-preview" style="background-color: ${color.color}"></span>
                <div class="color-info">
                    <div class="color-name">${color.name}</div>
                    <div class="color-hex">${color.color}</div>
                </div>
                <div class="color-actions">
                    <button class="action-btn edit-btn" data-color-id="${color.id}" title="Editar">✏️</button>
                    <button class="action-btn delete-btn" data-color-id="${color.id}" title="Excluir">🗑️</button>
                </div>
            </div>
        `).join('');

        this.colorsList.querySelectorAll('.edit-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.openEditColorModal(btn.dataset.colorId);
            });
        });

        this.colorsList.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.handleDeleteColor(btn.dataset.colorId);
            });
        });
    }

    handleNewColorSelect(event) {
        const button = event.target.closest('.color-option');
        if (!button) return;
        this.newColorValueInput.value = button.dataset.color;
        this.updateNewColorSelection();
    }

    updateNewColorSelection() {
        if (!this.newColorPicker) return;
        this.newColorPicker.querySelectorAll('.color-option').forEach(btn => {
            btn.classList.toggle('selected', btn.dataset.color === this.newColorValueInput.value);
        });
    }

    handleColorSubmit(event) {
        event.preventDefault();
        const name = this.colorNameInput.value.trim();
        const colorName = this.newColorValueInput.value;

        if (!name) return alert('Digite um título para a cor');
        if (!colorName) return alert('Selecione uma cor');

        // Converte nome para hexadecimal
        const colorValue = COLOR_MAP[colorName] || colorName;

        dataManager.addColor(name, colorValue);
        this.colorForm.reset();
        this.newColorValueInput.value = '';
        this.updateNewColorSelection();
        this.renderColorsList();
        this.renderUserColors();
    }

    openEditColorModal(colorId) {
        const color = dataManager.getColorById(colorId);
        if (!color) return;
        const newName = prompt('Novo título da cor:', color.name);
        if (newName && newName.trim()) {
            dataManager.updateColor(colorId, { name: newName.trim() });
            this.renderColorsList();
            this.renderUserColors();
        }
    }

    handleDeleteColor(colorId) {
        if (confirm('Tem certeza que deseja excluir esta cor?')) {
            dataManager.deleteColor(colorId);
            this.renderColorsList();
            this.renderUserColors();
            if (this.selectedColorId === colorId) this.selectedColorId = null;
        }
    }

    // Modal de detalhes do dia
    openDayModal(date) {
        if (!this.dayModal || !date) return;
        this.selectedDate = date;
        if (this.modalTitle) this.modalTitle.textContent = 'Detalhes do Dia';
        if (this.modalDate) this.modalDate.textContent = formatDateReadable(date);

        // Exibe informações do feriado se aplicável
        const holiday = dataManager.getHolidayForDate(date);
        if (holiday && this.modalHoliday && this.modalHolidayName) {
            this.modalHolidayName.textContent = holiday.name;
            this.modalHoliday.classList.remove('hidden');
        } else if (this.modalHoliday) {
            this.modalHoliday.classList.add('hidden');
        }

        this.renderDayMarks(dataManager.getMarksForDate(date));
        this.dayModal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
    }

    closeDayModal() {
        if (!this.dayModal) return;
        this.dayModal.classList.add('hidden');
        document.body.style.overflow = '';
        this.selectedDate = null;
    }

    // Remove todos os marcadores do dia
    removeAllMarks() {
        if (!this.selectedDate) return;
        if (confirm('Tem certeza que deseja remover TODOS os marcadores deste dia?')) {
            dataManager.removeAllMarksForDate(this.selectedDate);
            calendarManager.refresh();
            this.renderDayMarks(dataManager.getMarksForDate(this.selectedDate));
        }
    }

    renderDayMarks(marks) {
        if (marks.length === 0) {
            this.dayMarkers.innerHTML = '';
            this.dayEmpty.classList.remove('hidden');
            return;
        }
        this.dayEmpty.classList.add('hidden');
        this.dayMarkers.innerHTML = marks.map(mark => `
            <div class="day-mark-item" style="border-left: 4px solid ${mark.colorValue}">
                <span class="mark-color" style="background-color: ${mark.colorValue}"></span>
                <span class="mark-name" style="color: ${mark.colorValue}">${mark.colorName}</span>
            </div>
        `).join('');
    }

    // Navegação
    navigateMonth(direction) {
        if (direction < 0) calendarManager.prevMonth();
        else calendarManager.nextMonth();
    }

    goToToday() {
        calendarManager.goToToday();
    }

    init() {
        calendarManager.init();
        this.renderUserColors();
    }
}

export const uiManager = new UIManager();

