// ble-service.js - Servicio de comunicación BLE

const BLEService = {
    // UUIDs
    SERVICE_UUID: '12345678-1234-5678-1234-56789abcdef0',
    CHAR_CMD_UUID: '12345678-1234-5678-1234-56789abcdef1',
    CHAR_STATUS_UUID: '12345678-1234-5678-1234-56789abcdef2',
    CHAR_DATA_UUID: '12345678-1234-5678-1234-56789abcdef3',
    CHAR_CONFIG_UUID: '12345678-1234-5678-1234-56789abcdef4',
    CHAR_INFO_UUID: '12345678-1234-5678-1234-56789abcdef5',
    CHAR_PARAMS_UUID: '12345678-1234-5678-1234-56789abcdef6',
    CHAR_SYNC_UUID: '12345678-1234-5678-1234-56789abcdef7',
    
    // Estado
    device: null,
    server: null,
    service: null,
    characteristics: {},
    isAuthenticated: false,
    onDisconnected: null,
    
    // Scan for devices
    async scan() {
        try {
            const device = await navigator.bluetooth.requestDevice({
                filters: [{
                    namePrefix: 'HUELLA_'
                }],
                optionalServices: [this.SERVICE_UUID]
            });
            
            return device;
        } catch (error) {
            console.error('BLE Scan error:', error);
            throw error;
        }
    },
    
    // Connect to device
    async connect(device) {
        try {
            this.device = device;
            this.server = await device.gatt.connect();
            this.service = await this.server.getPrimaryService(this.SERVICE_UUID);
            
            // Get all characteristics
            this.characteristics.cmd = await this.service.getCharacteristic(this.CHAR_CMD_UUID);
            this.characteristics.status = await this.service.getCharacteristic(this.CHAR_STATUS_UUID);
            this.characteristics.data = await this.service.getCharacteristic(this.CHAR_DATA_UUID);
            this.characteristics.config = await this.service.getCharacteristic(this.CHAR_CONFIG_UUID);
            this.characteristics.info = await this.service.getCharacteristic(this.CHAR_INFO_UUID);
            this.characteristics.params = await this.service.getCharacteristic(this.CHAR_PARAMS_UUID);
            this.characteristics.sync = await this.service.getCharacteristic(this.CHAR_SYNC_UUID);
            
            // Setup notifications
            await this.characteristics.status.startNotifications();
            this.characteristics.status.addEventListener('characteristicvaluechanged', 
                this.handleStatusNotification.bind(this));
            
            await this.characteristics.data.startNotifications();
            this.characteristics.data.addEventListener('characteristicvaluechanged', 
                this.handleDataNotification.bind(this));
            
            // Handle disconnection
            device.addEventListener('gattserverdisconnected', this.handleDisconnection.bind(this));
            
            return true;
        } catch (error) {
            console.error('BLE Connect error:', error);
            throw error;
        }
    },
    
    // Disconnect
    disconnect() {
        if (this.device && this.device.gatt.connected) {
            this.device.gatt.disconnect();
        }
        this.cleanup();
    },
    
    // Send authentication PIN
    async authenticate(pin) {
        try {
            const command = {
                cmd: 'AUTH',
                pin: pin
            };
            
            await this.sendCommand(command);
            
            // Wait for response
            return new Promise((resolve) => {
                const timeout = setTimeout(() => {
                    resolve(false);
                }, 5000);
                
                this.authCallback = (authenticated) => {
                    clearTimeout(timeout);
                    this.isAuthenticated = authenticated;
                    resolve(authenticated);
                };
            });
        } catch (error) {
            console.error('BLE Auth error:', error);
            return false;
        }
    },
    
    // Send command
    async sendCommand(commandObj) {
        if (!this.characteristics.cmd) {
            throw new Error('No command characteristic available');
        }
        
        try {
            const encoder = new TextEncoder();
            const json = JSON.stringify(commandObj);
            const data = encoder.encode(json);
            
            // BLE has 512 byte limit, check size
            if (data.length > 512) {
                throw new Error('Command too large for BLE');
            }
            
            await this.characteristics.cmd.writeValueWithResponse(data);
            return true;
        } catch (error) {
            console.error('BLE Send command error:', error);
            throw error;
        }
    },
    
    // Get device status
    async getStatus() {
        if (!this.characteristics.status) {
            throw new Error('No status characteristic available');
        }
        
        try {
            const value = await this.characteristics.status.readValue();
            const decoder = new TextDecoder();
            const json = decoder.decode(value);
            return JSON.parse(json);
        } catch (error) {
            console.error('BLE Get status error:', error);
            throw error;
        }
    },
    
    // Get device info
    async getDeviceInfo() {
        if (!this.characteristics.info) {
            throw new Error('No info characteristic available');
        }
        
        try {
            const value = await this.characteristics.info.readValue();
            const decoder = new TextDecoder();
            const json = decoder.decode(value);
            return JSON.parse(json);
        } catch (error) {
            console.error('BLE Get info error:', error);
            throw error;
        }
    },
    
    // Get configuration
    async getConfiguration() {
        if (!this.characteristics.config) {
            throw new Error('No config characteristic available');
        }
        
        try {
            const value = await this.characteristics.config.readValue();
            const decoder = new TextDecoder();
            const json = decoder.decode(value);
            return JSON.parse(json);
        } catch (error) {
            console.error('BLE Get config error:', error);
            throw error;
        }
    },
    
    // Set configuration
    async setConfiguration(config) {
        if (!this.characteristics.config) {
            throw new Error('No config characteristic available');
        }
        
        try {
            const encoder = new TextEncoder();
            const json = JSON.stringify(config);
            const data = encoder.encode(json);
            
            if (data.length > 512) {
                throw new Error('Configuration too large for BLE');
            }
            
            await this.characteristics.config.writeValueWithResponse(data);
            return true;
        } catch (error) {
            console.error('BLE Set config error:', error);
            throw error;
        }
    },
    
    // Start streaming
    async startStreaming(duration, callback) {
        this.streamCallback = callback;
        
        const command = {
            cmd: 'STREAM_START',
            duration: duration
        };
        
        return await this.sendCommand(command);
    },
    
    // Stop streaming
    async stopStreaming() {
        const command = {
            cmd: 'STREAM_STOP'
        };
        
        this.streamCallback = null;
        return await this.sendCommand(command);
    },
    
    // Handle status notifications
    handleStatusNotification(event) {
        try {
            const value = event.target.value;
            const decoder = new TextDecoder();
            const json = decoder.decode(value);
            const status = JSON.parse(json);
            
            console.log('Status notification:', status);
            
            // Check for authentication response
            if (status.status === 'AUTH_OK' && this.authCallback) {
                this.authCallback(true);
            } else if (status.status === 'AUTH_FAIL' && this.authCallback) {
                this.authCallback(false);
            }
            
            // Update global status if needed
            if (window.updateDeviceStatus) {
                window.updateDeviceStatus(status);
            }
        } catch (error) {
            console.error('Error handling status notification:', error);
        }
    },
    
    // Handle data notifications
    handleDataNotification(event) {
        try {
            const value = event.target.value;
            const decoder = new TextDecoder();
            const json = decoder.decode(value);
            const data = JSON.parse(json);
            
            // Call streaming callback if active
            if (this.streamCallback) {
                this.streamCallback(data);
            }
        } catch (error) {
            console.error('Error handling data notification:', error);
        }
    },
    
    // Handle disconnection
    handleDisconnection() {
        console.log('BLE Device disconnected');
        this.cleanup();
        
        if (this.onDisconnected) {
            this.onDisconnected();
        }
    },
    
    // Cleanup
    cleanup() {
        this.device = null;
        this.server = null;
        this.service = null;
        this.characteristics = {};
        this.isAuthenticated = false;
        this.authCallback = null;
        this.streamCallback = null;
    },
    
    // Check if connected
    isConnected() {
        return this.device && this.device.gatt.connected;
    },
    
    // Utility: Send simple command
    async sendSimpleCommand(cmd) {
        return await this.sendCommand({ cmd: cmd });
    }
};