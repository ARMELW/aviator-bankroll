// Main application module
import IndexedDBManager from './db.js';
import { ChartManager } from './chart.js';

class AviatorBankrollApp {
    constructor() {
        this.db = new IndexedDBManager();
        this.chartManager = new ChartManager('capital-chart');
        this.planData = null;
        
        // DOM elements
        this.elements = {
            configSection: document.getElementById('config-section'),
            configForm: document.getElementById('config-form'),
            planInfo: document.getElementById('plan-info'),
            dailyEntry: document.getElementById('daily-entry'),
            dailyForm: document.getElementById('daily-form'),
            chartSection: document.getElementById('chart-section'),
            historySection: document.getElementById('history-section'),
            actionsSection: document.getElementById('actions-section'),
            resetBtn: document.getElementById('reset-plan'),
            dailyStatus: document.getElementById('daily-status')
        };
    }

    /**
     * Initialize the application
     */
    async init() {
        try {
            await this.db.init();
            await this.loadPlanData();
            this.setupEventListeners();
            
            if (this.planData) {
                this.showPlanView();
            } else {
                this.showConfigView();
            }
        } catch (error) {
            console.error('Failed to initialize app:', error);
            alert('Erreur lors de l\'initialisation de l\'application');
        }
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        this.elements.configForm.addEventListener('submit', (e) => this.handleConfigSubmit(e));
        this.elements.dailyForm.addEventListener('submit', (e) => this.handleDailySubmit(e));
        this.elements.resetBtn.addEventListener('click', () => this.handleReset());
    }

    /**
     * Load plan data from database
     */
    async loadPlanData() {
        this.planData = await this.db.getPlanData();
    }

    /**
     * Handle configuration form submission
     */
    async handleConfigSubmit(e) {
        e.preventDefault();
        
        const initialCapital = parseFloat(document.getElementById('initial-capital').value);
        const targetCapital = parseFloat(document.getElementById('target-capital').value);
        const durationDays = parseInt(document.getElementById('duration-days').value);
        const stopLoss = parseFloat(document.getElementById('stop-loss').value);

        if (targetCapital <= initialCapital) {
            alert('L\'objectif final doit être supérieur au capital initial');
            return;
        }

        // Calculate daily growth rate needed
        const totalGrowth = targetCapital / initialCapital;
        const dailyRate = (Math.pow(totalGrowth, 1 / durationDays) - 1) * 100;

        this.planData = {
            initialCapital,
            targetCapital,
            durationDays,
            stopLoss,
            dailyRate,
            currentCapital: initialCapital,
            history: [],
            startDate: new Date().toISOString()
        };

        await this.db.savePlanData(this.planData);
        this.showPlanView();
    }

    /**
     * Handle daily entry form submission
     */
    async handleDailySubmit(e) {
        e.preventDefault();
        
        const amount = parseFloat(document.getElementById('daily-amount').value);
        const newCapital = this.planData.currentCapital + amount;

        // Check stop loss
        if (amount < 0 && Math.abs(amount) > this.planData.stopLoss) {
            this.showStatus('error', `⚠️ STOP LOSS DÉPASSÉ! Perte de ${Math.abs(amount).toFixed(2)}€ > ${this.planData.stopLoss.toFixed(2)}€`);
        }

        // Add to history
        const entry = {
            amount,
            capitalBefore: this.planData.currentCapital,
            capitalAfter: newCapital,
            date: new Date().toISOString()
        };

        this.planData.history.push(entry);
        this.planData.currentCapital = newCapital;

        await this.db.savePlanData(this.planData);
        
        // Calculate if ahead or behind
        const daysElapsed = this.planData.history.length;
        const theoreticalCapital = this.planData.initialCapital * Math.pow(1 + this.planData.dailyRate / 100, daysElapsed);
        const difference = newCapital - theoreticalCapital;

        let statusType = 'success';
        let statusMessage = `✅ Enregistré! Capital actuel: ${newCapital.toFixed(2)}€`;
        
        if (difference > 0) {
            statusMessage += ` (En avance de ${difference.toFixed(2)}€)`;
            statusType = 'success';
        } else if (difference < 0) {
            statusMessage += ` (En retard de ${Math.abs(difference).toFixed(2)}€)`;
            statusType = 'warning';
        }

        // Check if target reached
        if (newCapital >= this.planData.targetCapital) {
            statusMessage += '\n🎉 OBJECTIF ATTEINT! Félicitations!';
            statusType = 'success';
        }

        this.showStatus(statusType, statusMessage);
        
        // Reset form
        document.getElementById('daily-amount').value = '';
        
        // Update display
        this.updatePlanInfo();
        this.updateChart();
        this.updateHistory();
    }

    /**
     * Handle reset button click
     */
    async handleReset() {
        if (confirm('Êtes-vous sûr de vouloir réinitialiser le plan? Toutes les données seront supprimées.')) {
            await this.db.deleteAllData();
            this.planData = null;
            this.showConfigView();
        }
    }

    /**
     * Show configuration view
     */
    showConfigView() {
        this.elements.configSection.style.display = 'block';
        this.elements.planInfo.style.display = 'none';
        this.elements.dailyEntry.style.display = 'none';
        this.elements.chartSection.style.display = 'none';
        this.elements.historySection.style.display = 'none';
        this.elements.actionsSection.style.display = 'none';
    }

    /**
     * Show plan view with data
     */
    showPlanView() {
        this.elements.configSection.style.display = 'none';
        this.elements.planInfo.style.display = 'block';
        this.elements.dailyEntry.style.display = 'block';
        this.elements.chartSection.style.display = 'block';
        this.elements.historySection.style.display = 'block';
        this.elements.actionsSection.style.display = 'block';

        this.updatePlanInfo();
        this.updateChart();
        this.updateHistory();
    }

    /**
     * Update plan information display
     */
    updatePlanInfo() {
        const daysElapsed = this.planData.history.length;
        const daysRemaining = Math.max(0, this.planData.durationDays - daysElapsed);
        
        // Calculate daily goal based on current capital
        const remainingGrowth = this.planData.targetCapital / this.planData.currentCapital;
        const adjustedDailyRate = daysRemaining > 0 
            ? (Math.pow(remainingGrowth, 1 / daysRemaining) - 1) * 100 
            : 0;
        const dailyGoal = this.planData.currentCapital * (adjustedDailyRate / 100);

        // Calculate progress percentage
        const totalGain = this.planData.currentCapital - this.planData.initialCapital;
        const targetGain = this.planData.targetCapital - this.planData.initialCapital;
        const progressPercent = (totalGain / targetGain) * 100;

        document.getElementById('info-initial-capital').textContent = this.planData.initialCapital.toFixed(2) + '€';
        document.getElementById('info-current-capital').textContent = this.planData.currentCapital.toFixed(2) + '€';
        document.getElementById('info-target-capital').textContent = this.planData.targetCapital.toFixed(2) + '€';
        document.getElementById('info-daily-rate').textContent = this.planData.dailyRate.toFixed(2) + '%';
        document.getElementById('info-daily-goal').textContent = dailyGoal.toFixed(2) + '€';
        document.getElementById('info-days-remaining').textContent = daysRemaining + ' / ' + this.planData.durationDays;
        document.getElementById('info-progress').textContent = progressPercent.toFixed(1) + '%';
        document.getElementById('info-stop-loss').textContent = this.planData.stopLoss.toFixed(2) + '€';

        // Update progress bar
        const progressFill = document.getElementById('progress-fill');
        progressFill.style.width = Math.min(100, progressPercent) + '%';
    }

    /**
     * Update chart
     */
    updateChart() {
        this.chartManager.drawChart(this.planData);
    }

    /**
     * Update history display
     */
    updateHistory() {
        const historyList = document.getElementById('history-list');
        historyList.innerHTML = '';

        if (!this.planData.history || this.planData.history.length === 0) {
            historyList.innerHTML = '<p style="text-align: center; color: #999;">Aucun historique</p>';
            return;
        }

        // Display in reverse order (most recent first)
        const sortedHistory = [...this.planData.history].reverse();
        
        sortedHistory.forEach((entry, index) => {
            const date = new Date(entry.date);
            const dayNumber = this.planData.history.length - index;
            
            const historyItem = document.createElement('div');
            historyItem.className = 'history-item';
            
            const amountClass = entry.amount >= 0 ? 'positive' : 'negative';
            const amountSign = entry.amount >= 0 ? '+' : '';
            
            historyItem.innerHTML = `
                <div>
                    <div class="history-date">Jour ${dayNumber} - ${date.toLocaleDateString('fr-FR')}</div>
                    <div class="history-details">
                        Capital: ${entry.capitalBefore.toFixed(2)}€ → ${entry.capitalAfter.toFixed(2)}€
                    </div>
                </div>
                <div class="history-amount ${amountClass}">
                    ${amountSign}${entry.amount.toFixed(2)}€
                </div>
            `;
            
            historyList.appendChild(historyItem);
        });
    }

    /**
     * Show status message
     */
    showStatus(type, message) {
        this.elements.dailyStatus.className = `status-message ${type}`;
        this.elements.dailyStatus.textContent = message;
        this.elements.dailyStatus.style.display = 'block';

        // Auto-hide after 10 seconds
        setTimeout(() => {
            this.elements.dailyStatus.style.display = 'none';
        }, 10000);
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    const app = new AviatorBankrollApp();
    app.init();
});
