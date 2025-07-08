// chart-service.js - Servicio de gráficos con Chart.js

const ChartService = {
    chart: null,
    maxDataPoints: 500,
    displayMode: 'raw', // 'raw' or 'g'
    isPaused: false,
    
    // Default calibration factors
    calFactors: {
        x: 3.814697266E-06,
        y: 3.814697266E-06,
        z: 3.814697266E-06
    },
    
    // Initialize chart
    init(canvasId) {
        const ctx = document.getElementById(canvasId).getContext('2d');
        
        this.chart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [
                    {
                        label: 'Eje X',
                        data: [],
                        borderColor: 'rgb(255, 99, 132)',
                        backgroundColor: 'rgba(255, 99, 132, 0.1)',
                        borderWidth: 2,
                        pointRadius: 0,
                        tension: 0.1
                    },
                    {
                        label: 'Eje Y',
                        data: [],
                        borderColor: 'rgb(75, 192, 192)',
                        backgroundColor: 'rgba(75, 192, 192, 0.1)',
                        borderWidth: 2,
                        pointRadius: 0,
                        tension: 0.1
                    },
                    {
                        label: 'Eje Z',
                        data: [],
                        borderColor: 'rgb(54, 162, 235)',
                        backgroundColor: 'rgba(54, 162, 235, 0.1)',
                        borderWidth: 2,
                        pointRadius: 0,
                        tension: 0.1
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: {
                    mode: 'index',
                    intersect: false,
                },
                plugins: {
                    title: {
                        display: true,
                        text: 'Datos del Acelerómetro'
                    },
                    legend: {
                        position: 'top',
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                let label = context.dataset.label || '';
                                if (label) {
                                    label += ': ';
                                }
                                const value = context.parsed.y;
                                if (ChartService.displayMode === 'raw') {
                                    label += value.toFixed(0) + ' bits';
                                } else {
                                    label += value.toExponential(3) + ' g';
                                }
                                return label;
                            }
                        }
                    },
                    zoom: {
                        zoom: {
                            wheel: {
                                enabled: true,
                            },
                            pinch: {
                                enabled: true
                            },
                            mode: 'x',
                        },
                        pan: {
                            enabled: true,
                            mode: 'x',
                        }
                    }
                },
                scales: {
                    x: {
                        type: 'linear',
                        position: 'bottom',
                        title: {
                            display: true,
                            text: 'Muestra'
                        }
                    },
                    y: {
                        title: {
                            display: true,
                            text: this.displayMode === 'raw' ? 'Valor (bits)' : 'Aceleración (g)'
                        }
                    }
                }
            }
        });
    },
    
    // Set calibration factors
    setCalibrationFactors(calX, calY, calZ) {
        this.calFactors.x = parseFloat(calX) || this.calFactors.x;
        this.calFactors.y = parseFloat(calY) || this.calFactors.y;
        this.calFactors.z = parseFloat(calZ) || this.calFactors.z;
    },
    
    // Toggle display mode
    toggleDisplayMode() {
        this.displayMode = this.displayMode === 'raw' ? 'g' : 'raw';
        
        // Update Y axis label
        this.chart.options.scales.y.title.text = 
            this.displayMode === 'raw' ? 'Valor (bits)' : 'Aceleración (g)';
        
        // Recalculate all data
        this.recalculateData();
    },
    
    // Add data point
    addData(x, y, z, skipUpdate = false) {
        if (this.isPaused) return;
        
        const labels = this.chart.data.labels;
        const dataX = this.chart.data.datasets[0].data;
        const dataY = this.chart.data.datasets[1].data;
        const dataZ = this.chart.data.datasets[2].data;
        
        // Add new point
        const sampleNumber = labels.length > 0 ? labels[labels.length - 1] + 1 : 0;
        labels.push(sampleNumber);
        
        // Store raw values
        dataX.push({ raw: x, converted: x * this.calFactors.x });
        dataY.push({ raw: y, converted: y * this.calFactors.y });
        dataZ.push({ raw: z, converted: z * this.calFactors.z });
        
        // Limit data points
        if (labels.length > this.maxDataPoints) {
            labels.shift();
            dataX.shift();
            dataY.shift();
            dataZ.shift();
        }
        
        if (!skipUpdate) {
            this.updateChart();
        }
    },
    
    // Add multiple data points
    addBatchData(dataArray) {
        dataArray.forEach((data, index) => {
            this.addData(data.x, data.y, data.z, true);
        });
        this.updateChart();
    },
    
    // Update chart display
    updateChart() {
        // Update displayed values based on mode
        const datasets = this.chart.data.datasets;
        
        datasets[0].data = datasets[0].data.map(d => 
            this.displayMode === 'raw' ? d.raw : d.converted
        );
        datasets[1].data = datasets[1].data.map(d => 
            this.displayMode === 'raw' ? d.raw : d.converted
        );
        datasets[2].data = datasets[2].data.map(d => 
            this.displayMode === 'raw' ? d.raw : d.converted
        );
        
        this.chart.update('none'); // No animation for performance
    },
    
    // Recalculate all data
    recalculateData() {
        const datasets = this.chart.data.datasets;
        
        // Recalculate converted values with current calibration factors
        datasets[0].data.forEach(d => {
            if (typeof d === 'object') {
                d.converted = d.raw * this.calFactors.x;
            }
        });
        datasets[1].data.forEach(d => {
            if (typeof d === 'object') {
                d.converted = d.raw * this.calFactors.y;
            }
        });
        datasets[2].data.forEach(d => {
            if (typeof d === 'object') {
                d.converted = d.raw * this.calFactors.z;
            }
        });
        
        this.updateChart();
    },
    
    // Clear chart
    clear() {
        this.chart.data.labels = [];
        this.chart.data.datasets.forEach(dataset => {
            dataset.data = [];
        });
        this.chart.update();
    },
    
    // Pause/Resume
    togglePause() {
        this.isPaused = !this.isPaused;
        return this.isPaused;
    },
    
    // Get current data
    getCurrentData() {
        const labels = this.chart.data.labels;
        const datasets = this.chart.data.datasets;
        
        const data = [];
        
        for (let i = 0; i < labels.length; i++) {
            const point = {
                sample: labels[i],
                x: datasets[0].data[i],
                y: datasets[1].data[i],
                z: datasets[2].data[i]
            };
            
            // Include raw values if in converted mode
            if (this.displayMode === 'g' && typeof datasets[0].data[i] === 'object') {
                point.xRaw = datasets[0].data[i].raw;
                point.yRaw = datasets[1].data[i].raw;
                point.zRaw = datasets[2].data[i].raw;
            }
            
            data.push(point);
        }
        
        return data;
    },
    
    // Calculate statistics
    getStatistics() {
        const datasets = this.chart.data.datasets;
        const stats = {};
        
        ['x', 'y', 'z'].forEach((axis, index) => {
            const data = datasets[index].data.map(d => 
                typeof d === 'object' ? (this.displayMode === 'raw' ? d.raw : d.converted) : d
            );
            
            if (data.length > 0) {
                stats[axis] = {
                    min: Math.min(...data),
                    max: Math.max(...data),
                    avg: data.reduce((a, b) => a + b, 0) / data.length,
                    current: data[data.length - 1]
                };
            } else {
                stats[axis] = { min: 0, max: 0, avg: 0, current: 0 };
            }
        });
        
        return stats;
    },
    
    // Export chart as image
    exportAsImage(filename = 'accelerometer_data.png') {
        const url = this.chart.toBase64Image();
        const link = document.createElement('a');
        link.download = filename;
        link.href = url;
        link.click();
    },
    
    // Set max data points
    setMaxDataPoints(max) {
        this.maxDataPoints = max;
        
        // Trim existing data if needed
        const currentLength = this.chart.data.labels.length;
        if (currentLength > max) {
            const toRemove = currentLength - max;
            this.chart.data.labels.splice(0, toRemove);
            this.chart.data.datasets.forEach(dataset => {
                dataset.data.splice(0, toRemove);
            });
            this.chart.update();
        }
    },
    
    // Reset zoom
    resetZoom() {
        if (this.chart.resetZoom) {
            this.chart.resetZoom();
        }
    },
    
    // Destroy chart
    destroy() {
        if (this.chart) {
            this.chart.destroy();
            this.chart = null;
        }
    }
};