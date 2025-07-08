// utils.js - Funciones utilitarias para Huella BLE

const Utils = {
    // Formatear fecha
    formatDate(timestamp) {
        const date = new Date(timestamp);
        const now = new Date();
        const diff = now - date;
        
        if (diff < 60000) return 'Hace un momento';
        if (diff < 3600000) return `Hace ${Math.floor(diff / 60000)} minutos`;
        if (diff < 86400000) return `Hace ${Math.floor(diff / 3600000)} horas`;
        if (diff < 604800000) return `Hace ${Math.floor(diff / 86400000)} días`;
        
        return date.toLocaleDateString('es-MX', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    },
    
    // Formatear uptime
    formatUptime(milliseconds) {
        if (!milliseconds) return '-';
        
        const seconds = Math.floor(milliseconds / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);
        
        if (days > 0) {
            return `${days}d ${hours % 24}h ${minutes % 60}m`;
        } else if (hours > 0) {
            return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
        } else if (minutes > 0) {
            return `${minutes}m ${seconds % 60}s`;
        } else {
            return `${seconds}s`;
        }
    },
    
    // Formatear bytes
    formatBytes(bytes, decimals = 2) {
        if (bytes === 0) return '0 Bytes';
        
        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    },
    
    // Vibración del dispositivo
    vibrate(pattern = 50) {
        if ('vibrate' in navigator) {
            navigator.vibrate(pattern);
        }
    },
    
    // Mostrar notificación toast
    showToast(message, type = 'info', duration = 3000) {
        // Crear contenedor si no existe
        let toastContainer = document.getElementById('toast-container');
        if (!toastContainer) {
            toastContainer = document.createElement('div');
            toastContainer.id = 'toast-container';
            toastContainer.className = 'toast-container position-fixed top-0 end-0 p-3';
            toastContainer.style.zIndex = '1050';
            document.body.appendChild(toastContainer);
        }
        
        // Determinar icono y color según tipo
        let icon, bgClass;
        switch (type) {
            case 'success':
                icon = 'bi-check-circle-fill';
                bgClass = 'bg-success';
                break;
            case 'error':
                icon = 'bi-x-circle-fill';
                bgClass = 'bg-danger';
                break;
            case 'warning':
                icon = 'bi-exclamation-triangle-fill';
                bgClass = 'bg-warning';
                break;
            default:
                icon = 'bi-info-circle-fill';
                bgClass = 'bg-info';
        }
        
        // Crear toast
        const toastId = 'toast-' + Date.now();
        const toastHtml = `
            <div id="${toastId}" class="toast align-items-center text-white ${bgClass} border-0" role="alert">
                <div class="d-flex">
                    <div class="toast-body">
                        <i class="bi ${icon} me-2"></i>${message}
                    </div>
                    <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
                </div>
            </div>
        `;
        
        toastContainer.insertAdjacentHTML('beforeend', toastHtml);
        
        // Mostrar toast
        const toastElement = document.getElementById(toastId);
        const toast = new bootstrap.Toast(toastElement, {
            delay: duration
        });
        toast.show();
        
        // Eliminar del DOM cuando se oculte
        toastElement.addEventListener('hidden.bs.toast', () => {
            toastElement.remove();
        });
        
        // Vibrar si es error
        if (type === 'error') {
            this.vibrate([100, 50, 100]);
        }
    },
    
    // Exportar datos a CSV
    exportToCSV(data, filename = 'huella_data.csv') {
        if (!data || data.length === 0) {
            this.showToast('No hay datos para exportar', 'warning');
            return;
        }
        
        // Obtener headers
        const headers = Object.keys(data[0]);
        
        // Crear CSV
        let csv = headers.join(',') + '\n';
        
        data.forEach(row => {
            const values = headers.map(header => {
                const value = row[header];
                // Escapar valores que contengan comas
                if (typeof value === 'string' && value.includes(',')) {
                    return `"${value}"`;
                }
                return value;
            });
            csv += values.join(',') + '\n';
        });
        
        // Crear blob y descargar
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        URL.revokeObjectURL(url);
        
        this.showToast('Datos exportados exitosamente', 'success');
    },
    
    // Exportar datos a JSON
    exportToJSON(data, filename = 'huella_data.json') {
        const json = JSON.stringify(data, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.click();
        
        URL.revokeObjectURL(url);
    },
    
    // Copiar al portapapeles
    async copyToClipboard(text) {
        try {
            if (navigator.clipboard) {
                await navigator.clipboard.writeText(text);
            } else {
                // Fallback para navegadores antiguos
                const textArea = document.createElement('textarea');
                textArea.value = text;
                textArea.style.position = 'fixed';
                textArea.style.left = '-999999px';
                document.body.appendChild(textArea);
                textArea.select();
                document.execCommand('copy');
                document.body.removeChild(textArea);
            }
            this.showToast('Copiado al portapapeles', 'success');
        } catch (error) {
            this.showToast('Error al copiar', 'error');
        }
    },
    
    // Validar formato de dirección IP
    validateIP(ip) {
        const pattern = /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
        return pattern.test(ip);
    },
    
    // Validar formato de factor de calibración
    validateCalibrationFactor(factor) {
        const pattern = /^-?\d+(\.\d+)?([eE][+-]?\d+)?$/;
        return pattern.test(factor);
    },
    
    // Solicitar Wake Lock (mantener pantalla activa)
    async requestWakeLock() {
        if ('wakeLock' in navigator) {
            try {
                const wakeLock = await navigator.wakeLock.request('screen');
                console.log('Wake Lock activado');
                
                // Re-adquirir si la página vuelve a ser visible
                document.addEventListener('visibilitychange', async () => {
                    if (document.visibilityState === 'visible') {
                        await navigator.wakeLock.request('screen');
                    }
                });
                
                return wakeLock;
            } catch (error) {
                console.error('Wake Lock error:', error);
            }
        }
        return null;
    },
    
    // Liberar Wake Lock
    async releaseWakeLock(wakeLock) {
        if (wakeLock) {
            await wakeLock.release();
            console.log('Wake Lock liberado');
        }
    },
    
    // Detectar si es dispositivo móvil
    isMobile() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    },
    
    // Detectar si es PWA instalada
    isPWA() {
        return window.matchMedia('(display-mode: standalone)').matches ||
               window.navigator.standalone ||
               document.referrer.includes('android-app://');
    },
    
    // Solicitar permisos de notificación
    async requestNotificationPermission() {
        if ('Notification' in window) {
            const permission = await Notification.requestPermission();
            return permission === 'granted';
        }
        return false;
    },
    
    // Mostrar notificación del sistema
    showNotification(title, options = {}) {
        if ('Notification' in window && Notification.permission === 'granted') {
            const notification = new Notification(title, {
                icon: '/icon-192.png',
                badge: '/icon-96.png',
                vibrate: [200, 100, 200],
                ...options
            });
            
            notification.onclick = () => {
                window.focus();
                notification.close();
            };
            
            return notification;
        }
    },
    
    // Generar timestamp para nombres de archivo
    getTimestamp() {
        const now = new Date();
        return now.getFullYear() +
               String(now.getMonth() + 1).padStart(2, '0') +
               String(now.getDate()).padStart(2, '0') + '_' +
               String(now.getHours()).padStart(2, '0') +
               String(now.getMinutes()).padStart(2, '0') +
               String(now.getSeconds()).padStart(2, '0');
    },
    
    // Debounce function
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },
    
    // Throttle function
    throttle(func, limit) {
        let inThrottle;
        return function(...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }
};

// Hacer disponible globalmente
window.Utils = Utils;

// Shortcuts globales
window.showSuccess = (msg) => Utils.showToast(msg, 'success');
window.showError = (msg) => Utils.showToast(msg, 'error');
window.showWarning = (msg) => Utils.showToast(msg, 'warning');
window.showInfo = (msg) => Utils.showToast(msg, 'info');