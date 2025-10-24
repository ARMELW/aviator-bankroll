// Main application module
import IndexedDBManager from './db.js';
import { ChartManager } from './chart.js';

class AviatorBankrollApp {
    constructor() {
        this.db = new IndexedDBManager();
        
        // Check if chart canvas exists before creating ChartManager
        const chartCanvas = document.getElementById('capital-chart');
        this.chartManager = chartCanvas ? new ChartManager('capital-chart') : null;
        
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
     * Format amount with thousands separator
     */
    formatMoney(amount) {
        return new Intl.NumberFormat('fr-FR').format(Math.round(amount)) + ' Ar';
    }

    /**
     * Initialize the application
     */
    async init() {
        try {
            console.log('Initializing Aviator Bankroll App...');
            await this.db.init();
            await this.loadPlanData();
            this.setupEventListeners();
            
            if (this.planData) {
                console.log('Existing plan found, showing plan view');
                this.showPlanView();
            } else {
                console.log('No existing plan, showing config view');
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
        try {
            const data = await this.db.getPlanData();
            
            // Check if we have valid plan data
            if (data && data.initialCapital && data.targetCapital && data.durationDays) {
                this.planData = data;
                console.log('Plan data loaded:', this.planData);
            } else {
                this.planData = null;
                console.log('No valid plan data found');
            }
        } catch (error) {
            console.error('Error loading plan data:', error);
            this.planData = null;
        }
    }

    /**
     * Handle configuration form submission
     */
    async handleConfigSubmit(e) {
        e.preventDefault();
        
        const initialCapital = parseFloat(document.getElementById('initial-capital').value);
        const targetCapital = parseFloat(document.getElementById('target-capital').value);
        const durationDays = parseInt(document.getElementById('duration-days').value);

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
            dailyRate,
            currentCapital: initialCapital,
            history: [],
            startDate: new Date().toISOString()
        };

        try {
            await this.db.savePlanData(this.planData);
            console.log('Plan data saved:', this.planData);
            this.showPlanView();
        } catch (error) {
            console.error('Error saving plan data:', error);
            alert('Erreur lors de la sauvegarde du plan');
        }
    }

    /**
     * Handle daily entry form submission
     */
    async handleDailySubmit(e) {
        e.preventDefault();
        
        const newTotalCapital = parseFloat(document.getElementById('daily-amount').value);
        
        // Ensure capital is positive
        if (newTotalCapital < 0) {
            this.showStatus('error', '⚠️ Veuillez saisir un capital positif');
            return;
        }

        const previousCapital = this.planData.currentCapital;
        const dailyChange = newTotalCapital - previousCapital; // Peut être négatif (perte)

        // Add to history
        const entry = {
            dailyGain: dailyChange, // Renommé mais garde la même structure
            capitalBefore: previousCapital,
            capitalAfter: newTotalCapital,
            date: new Date().toISOString()
        };

        this.planData.history.push(entry);
        this.planData.currentCapital = newTotalCapital;

        await this.db.savePlanData(this.planData);
        
        // Calculate if ahead or behind theoretical progression
        const daysElapsed = this.planData.history.length;
        const theoreticalCapital = this.planData.initialCapital * Math.pow(1 + this.planData.dailyRate / 100, daysElapsed);
        const difference = newTotalCapital - theoreticalCapital;

        let statusType = 'success';
        let statusMessage;
        
        if (dailyChange >= 0) {
            statusMessage = `✅ Capital mis à jour! Gain du jour: +${this.formatMoney(dailyChange)}`;
        } else {
            statusMessage = `📉 Capital mis à jour! Perte du jour: ${this.formatMoney(dailyChange)}`;
            statusType = 'warning';
        }
        
        // Add progression context
        if (newTotalCapital >= this.planData.targetCapital) {
            statusMessage += '\n🎉 OBJECTIF FINAL ATTEINT! Félicitations!';
            statusType = 'success';
            
            const daysRemaining = Math.max(0, this.planData.durationDays - daysElapsed);
            if (daysRemaining > 0) {
                statusMessage += `\nVous avez ${daysRemaining} jour(s) d'avance!`;
            }
        } else {
            if (difference > 0) {
                statusMessage += ` (En avance de ${this.formatMoney(difference)})`;
                statusType = dailyChange >= 0 ? 'success' : 'warning';
            } else if (difference < 0) {
                statusMessage += ` (En retard de ${this.formatMoney(Math.abs(difference))})`;
                statusType = 'warning';
            }
        }

        this.showStatus(statusType, statusMessage);
        
        // Reset form
        document.getElementById('daily-amount').value = '';
        
        // Update display
        this.updatePlanInfo();
        if (this.chartManager) {
            this.updateChart();
        }
        if (this.elements.historySection) {
            this.updateHistory();
        }
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
        document.getElementById('main-grid').style.display = 'none';
        this.elements.actionsSection.style.display = 'none';
    }

    /**
     * Show plan view with data
     */
    showPlanView() {
        this.elements.configSection.style.display = 'none';
        document.getElementById('main-grid').style.display = 'grid';
        this.elements.actionsSection.style.display = 'block';

        this.updatePlanInfo();
        if (this.chartManager) {
            this.updateChart();
        }
        if (this.elements.historySection) {
            this.updateHistory();
        }
    }

    /**
     * Update plan information display
     */
    updatePlanInfo() {
        const daysElapsed = this.planData.history.length;
        const daysRemaining = Math.max(0, this.planData.durationDays - daysElapsed);
        
        let dailyGoal = 0;
        let adjustedDailyRate = 0;
        
        if (daysRemaining > 0) {
            // Calculate how much growth is still needed
            const remainingGrowth = this.planData.targetCapital / this.planData.currentCapital;
            
            if (remainingGrowth > 1) {
                // Still need to grow
                adjustedDailyRate = (Math.pow(remainingGrowth, 1 / daysRemaining) - 1) * 100;
                dailyGoal = this.planData.currentCapital * (adjustedDailyRate / 100);
            } else {
                // Target already reached or exceeded
                adjustedDailyRate = 0;
                dailyGoal = 0;
            }
        }

        // Calculate progress percentage
        const totalGain = this.planData.currentCapital - this.planData.initialCapital;
        const targetGain = this.planData.targetCapital - this.planData.initialCapital;
        const progressPercent = Math.min(100, (totalGain / targetGain) * 100);

        document.getElementById('info-initial-capital').textContent = this.formatMoney(this.planData.initialCapital);
        document.getElementById('info-current-capital').textContent = this.formatMoney(this.planData.currentCapital);
        document.getElementById('info-target-capital').textContent = this.formatMoney(this.planData.targetCapital);
        document.getElementById('info-daily-rate').textContent = this.planData.dailyRate.toFixed(2) + '%';
        
        // Display daily goal or "Objectif atteint" message
        if (dailyGoal > 0) {
            document.getElementById('info-daily-goal').textContent = this.formatMoney(dailyGoal);
            document.getElementById('info-daily-goal').className = 'text-blue-400 font-semibold';
        } else if (this.planData.currentCapital >= this.planData.targetCapital) {
            document.getElementById('info-daily-goal').textContent = 'Objectif atteint! 🎉';
            document.getElementById('info-daily-goal').className = 'text-green-400 font-semibold';
        } else {
            document.getElementById('info-daily-goal').textContent = 'Maintenir le capital';
            document.getElementById('info-daily-goal').className = 'text-yellow-400 font-semibold';
        }
        
        document.getElementById('info-days-remaining').textContent = daysRemaining + ' / ' + this.planData.durationDays;
        document.getElementById('info-progress').textContent = progressPercent.toFixed(1) + '%';

        // Update progress bar
        const progressFill = document.getElementById('progress-fill');
        progressFill.style.width = progressPercent + '%';
        
        // Change progress bar color if target exceeded
        if (progressPercent >= 100) {
            progressFill.className = 'bg-green-500 h-full rounded-full transition-all';
        } else {
            progressFill.className = 'bg-blue-600 h-full rounded-full transition-all';
        }
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
            
            // Handle both old format (amount) and new format (dailyGain)
            const changeAmount = entry.dailyGain !== undefined ? entry.dailyGain : (entry.amount || 0);
            const isPositive = changeAmount >= 0;
            const amountClass = isPositive ? 'positive' : 'negative';
            const amountSign = isPositive ? '+' : '';
            
            historyItem.innerHTML = `
                <div>
                    <div class="history-date">Jour ${dayNumber} - ${date.toLocaleDateString('fr-FR')}</div>
                    <div class="history-details">
                        Capital: ${this.formatMoney(entry.capitalBefore)} → ${this.formatMoney(entry.capitalAfter)}
                    </div>
                </div>
                <div class="history-amount ${amountClass}">
                    ${amountSign}${this.formatMoney(Math.abs(changeAmount))}
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
