// Módulo de Interface - UI e modais

import { dataManager } from '../data/data.js';
import { calendarManager } from '../calendar/calendar.js';
import { formatDateReadable, COLOR_MAP } from '../utils/utils.js';

export class UIManager {
    constructor() {
        this.selectedColorId = null;
        this.selectedDate = null;
        this.noteColorId = null; // Cor selecionada para adicionar anotação
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
        // Colorwheel
        this.colorWheel = getEl('colorWheel');
        this.colorWheelPreview = getEl('colorWheelPreview');
        // Anotações
        this.noteInput = getEl('noteInput');
        this.saveNoteBtn = getEl('saveNoteBtn');
        this.addNoteSection = getEl('addNoteSection');
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
        
        // Evento do Colorwheel
        this.colorWheel?.addEventListener('input', (e) => this.handleColorWheelChange(e));

        // Evento de salvar anotação
        this.saveNoteBtn?.addEventListener('click', () => this.saveNote());
        this.noteInput?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.saveNote();
        });

        // Listener direto no grid para capturar cliques nos dias
        this.calendarGrid?.addEventListener('click', (e) => {
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
        // Se há uma cor selecionada, adiciona/remove marcação
        if (this.selectedColorId) {
            try {
                if (dataManager.hasMark(date, this.selectedColorId)) {
                    dataManager.removeMark(date, this.selectedColorId);
                } else {
                    dataManager.addMark(date, this.selectedColorId);
                }
                calendarManager.refresh();
            } catch (error) {
                alert(error.message);
            }
        } else {
            // Se nenhuma cor está selecionada, abre o modal de detalhes
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
        // Inicializa colorwheel
        if (this.colorWheel) {
            this.colorWheel.value = '#3b82f6';
            if (this.colorWheelPreview) {
                this.colorWheelPreview.style.backgroundColor = '#3b82f6';
            }
        }
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

    /**
     * Trata mudança no colorwheel nativo
     */
    handleColorWheelChange(event) {
        const colorValue = event.target.value;
        this.newColorValueInput.value = colorValue;
        // Atualiza preview
        if (this.colorWheelPreview) {
            this.colorWheelPreview.style.backgroundColor = colorValue;
        }
        // Limpa seleção das cores predefinidas
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
            // Atualiza a UI do calendário para refletir a nova legenda
            calendarManager.refresh();
            this.renderColorsList();
            this.renderUserColors();
        }
    }

    handleDeleteColor(colorId) {
        if (confirm('Tem certeza que deseja excluir esta cor?')) {
            dataManager.deleteColor(colorId);
            // Atualiza a UI do calendário para remover as marcações da cor deletada
            calendarManager.refresh();
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

    /**
     * Salva uma anotação para a cor selecionada
     */
    saveNote() {
        if (!this.selectedDate || !this.noteColorId) return;
        const note = this.noteInput.value.trim();
        dataManager.setMarkNote(this.selectedDate, this.noteColorId, note || null);
        this.noteInput.value = '';
        this.noteColorId = null;
        this.renderDayMarks(dataManager.getMarksForDate(this.selectedDate));
    }

    renderDayMarks(marks) {
        if (marks.length === 0) {
            this.dayMarkers.innerHTML = '';
            this.dayEmpty.classList.remove('hidden');
            this.addNoteSection?.classList.add('hidden');
            return;
        }
        this.dayEmpty.classList.add('hidden');

        // Mostra seção de anotações se houver pelo menos uma marcação
        this.addNoteSection?.classList.remove('hidden');

        this.dayMarkers.innerHTML = marks.map(mark => `
            <div class="day-mark-item" style="border-left: 4px solid ${mark.colorValue}">
                <span class="mark-color" style="background-color: ${mark.colorValue}"></span>
                <div class="mark-info flex-1">
                    <span class="mark-name" style="color: ${mark.colorValue}">${mark.colorName}</span>
                    ${mark.note ? `<p class="text-xs text-gray-500 mt-1">📝 ${mark.note}</p>` : ''}
                </div>
                <button class="add-note-btn text-xs text-primary-600 hover:text-primary-800 ml-2" 
                    data-color-id="${mark.colorId}" title="Adicionar anotação">
                    ✏️
                </button>
            </div>
        `).join('');

        // Bind eventos para botões de anotação
        this.dayMarkers.querySelectorAll('.add-note-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.openNoteForMark(btn.dataset.colorId);
            });
        });
    }

    /**
     * Abre campo de anotação para uma marcação específica
     */
    openNoteForMark(colorId) {
        this.noteColorId = colorId;
        const currentNote = dataManager.getMarkNote(this.selectedDate, colorId);
        this.noteInput.value = currentNote || '';
        this.noteInput.focus();
        this.noteInput.placeholder = 'Digite uma anotação para esta marcação...';
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

