// Chart module for visualizing capital evolution
export class ChartManager {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.padding = 50;
    }

    /**
     * Draw the capital evolution chart
     */
    drawChart(planData) {
        if (!planData || !planData.history || planData.history.length === 0) {
            this.drawEmptyChart();
            return;
        }

        const width = this.canvas.width;
        const height = this.canvas.height;
        
        // Clear canvas
        this.ctx.clearRect(0, 0, width, height);

        // Prepare data points
        const history = planData.history;
        const dataPoints = [
            { day: 0, capital: planData.initialCapital }
        ];

        let capital = planData.initialCapital;
        history.forEach((entry, index) => {
            capital += entry.amount;
            dataPoints.push({ day: index + 1, capital });
        });

        // Calculate theoretical line
        const theoreticalPoints = [];
        const dailyRate = planData.dailyRate / 100;
        for (let day = 0; day <= planData.durationDays; day++) {
            const theoreticalCapital = planData.initialCapital * Math.pow(1 + dailyRate, day);
            theoreticalPoints.push({ day, capital: theoreticalCapital });
        }

        // Find min and max values for scaling
        const allCapitals = [...dataPoints.map(p => p.capital), ...theoreticalPoints.map(p => p.capital)];
        const minCapital = Math.min(...allCapitals) * 0.9;
        const maxCapital = Math.max(...allCapitals, planData.targetCapital) * 1.1;
        const maxDay = planData.durationDays;

        // Draw grid and axes
        this.drawGrid(width, height, minCapital, maxCapital, maxDay);

        // Draw theoretical line
        this.drawLine(theoreticalPoints, minCapital, maxCapital, maxDay, width, height, '#cccccc', 2, true);

        // Draw actual line
        this.drawLine(dataPoints, minCapital, maxCapital, maxDay, width, height, '#667eea', 3);

        // Draw points
        dataPoints.forEach(point => {
            const x = this.padding + (point.day / maxDay) * (width - 2 * this.padding);
            const y = height - this.padding - ((point.capital - minCapital) / (maxCapital - minCapital)) * (height - 2 * this.padding);
            this.drawPoint(x, y, point.capital >= planData.initialCapital ? '#28a745' : '#dc3545');
        });

        // Draw legend
        this.drawLegend(width, height);
    }

    drawGrid(width, height, minCapital, maxCapital, maxDay) {
        this.ctx.strokeStyle = '#e0e0e0';
        this.ctx.lineWidth = 1;
        this.ctx.font = '12px Arial';
        this.ctx.fillStyle = '#666';

        // Horizontal grid lines (capital)
        const capitalSteps = 5;
        for (let i = 0; i <= capitalSteps; i++) {
            const capital = minCapital + (maxCapital - minCapital) * (i / capitalSteps);
            const y = height - this.padding - (i / capitalSteps) * (height - 2 * this.padding);
            
            this.ctx.beginPath();
            this.ctx.moveTo(this.padding, y);
            this.ctx.lineTo(width - this.padding, y);
            this.ctx.stroke();

            // Y-axis labels
            this.ctx.fillText(capital.toFixed(0) + '€', 5, y + 4);
        }

        // Vertical grid lines (days)
        const daySteps = Math.min(maxDay, 10);
        for (let i = 0; i <= daySteps; i++) {
            const day = Math.round((maxDay * i) / daySteps);
            const x = this.padding + (day / maxDay) * (width - 2 * this.padding);
            
            this.ctx.beginPath();
            this.ctx.moveTo(x, height - this.padding);
            this.ctx.lineTo(x, this.padding);
            this.ctx.stroke();

            // X-axis labels
            this.ctx.fillText('J' + day, x - 10, height - this.padding + 20);
        }

        // Axes labels
        this.ctx.fillStyle = '#333';
        this.ctx.font = '14px Arial';
        this.ctx.fillText('Jours', width / 2 - 20, height - 10);
        
        this.ctx.save();
        this.ctx.translate(15, height / 2);
        this.ctx.rotate(-Math.PI / 2);
        this.ctx.fillText('Capital (€)', -30, 0);
        this.ctx.restore();
    }

    drawLine(points, minCapital, maxCapital, maxDay, width, height, color, lineWidth, dashed = false) {
        if (points.length < 2) return;

        this.ctx.strokeStyle = color;
        this.ctx.lineWidth = lineWidth;
        
        if (dashed) {
            this.ctx.setLineDash([5, 5]);
        } else {
            this.ctx.setLineDash([]);
        }

        this.ctx.beginPath();
        points.forEach((point, index) => {
            const x = this.padding + (point.day / maxDay) * (width - 2 * this.padding);
            const y = height - this.padding - ((point.capital - minCapital) / (maxCapital - minCapital)) * (height - 2 * this.padding);
            
            if (index === 0) {
                this.ctx.moveTo(x, y);
            } else {
                this.ctx.lineTo(x, y);
            }
        });
        this.ctx.stroke();
        this.ctx.setLineDash([]);
    }

    drawPoint(x, y, color) {
        this.ctx.fillStyle = color;
        this.ctx.beginPath();
        this.ctx.arc(x, y, 5, 0, 2 * Math.PI);
        this.ctx.fill();
        
        this.ctx.strokeStyle = 'white';
        this.ctx.lineWidth = 2;
        this.ctx.stroke();
    }

    drawLegend(width, height) {
        const legendX = width - 150;
        const legendY = this.padding + 10;

        // Actual line
        this.ctx.strokeStyle = '#667eea';
        this.ctx.lineWidth = 3;
        this.ctx.beginPath();
        this.ctx.moveTo(legendX, legendY);
        this.ctx.lineTo(legendX + 30, legendY);
        this.ctx.stroke();
        
        this.ctx.fillStyle = '#333';
        this.ctx.font = '12px Arial';
        this.ctx.fillText('Réel', legendX + 35, legendY + 4);

        // Theoretical line
        this.ctx.strokeStyle = '#cccccc';
        this.ctx.lineWidth = 2;
        this.ctx.setLineDash([5, 5]);
        this.ctx.beginPath();
        this.ctx.moveTo(legendX, legendY + 20);
        this.ctx.lineTo(legendX + 30, legendY + 20);
        this.ctx.stroke();
        this.ctx.setLineDash([]);
        
        this.ctx.fillText('Théorique', legendX + 35, legendY + 24);
    }

    drawEmptyChart() {
        const width = this.canvas.width;
        const height = this.canvas.height;
        
        this.ctx.clearRect(0, 0, width, height);
        this.ctx.fillStyle = '#999';
        this.ctx.font = '20px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('Aucune donnée à afficher', width / 2, height / 2);
        this.ctx.textAlign = 'left';
    }
}
