// Simple chart manager for capital evolution
export class ChartManager {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) {
            console.log('Chart canvas not found, chart functionality disabled');
            return null;
        }
        this.ctx = this.canvas.getContext('2d');
    }

    /**
     * Draw a simple chart (placeholder for now)
     */
    drawChart(planData) {
        if (!this.canvas || !this.ctx) {
            return;
        }

        // Simple placeholder chart
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.fillStyle = '#1e293b';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.ctx.fillStyle = '#64748b';
        this.ctx.font = '14px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('Graphique en cours de développement', this.canvas.width / 2, this.canvas.height / 2);
    }
}
