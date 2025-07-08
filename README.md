# Huella BLE Manager PWA

Aplicación web progresiva (PWA) para la gestión y control de dispositivos Huella mediante Bluetooth Low Energy (BLE).

## Características

- 🔌 **Conexión BLE directa** con dispositivos ESP32S3
- 📱 **PWA instalable** en dispositivos móviles y desktop
- 🌙 **Tema claro/oscuro** persistente
- 📊 **Visualización en tiempo real** de datos del acelerómetro
- 💾 **Almacenamiento local** con IndexedDB
- 🔒 **Autenticación por PIN** de 6 dígitos
- 📤 **Exportación de datos** en formato CSV

## Requisitos

- Navegador compatible con Web Bluetooth API (Chrome/Edge en Android, Chrome/Edge en Windows/Mac)
- Conexión HTTPS (requerido para Web Bluetooth)
- Dispositivo Huella con firmware BLE habilitado

## Instalación

### Opción 1: Azure Web App (Recomendado)

1. Desplegar en Azure Web Apps
2. Configurar HTTPS automático
3. La PWA estará disponible en `https://tu-app.azurewebsites.net`

### Opción 2: Servidor Local

```bash
# Clonar repositorio
git clone [tu-repositorio]

# Instalar servidor HTTPS local
npm install -g http-server

# Generar certificados SSL
openssl req -newkey rsa:2048 -new -nodes -x509 -days 3650 -keyout key.pem -out cert.pem

# Iniciar servidor
http-server -S -C cert.pem -K key.pem -p 443
```

## Uso

### Primera Conexión

1. **Escanear dispositivos**: Click en el botón flotante de Bluetooth
2. **Seleccionar dispositivo**: Elegir dispositivo que empiece con "HUELLA_"
3. **Autenticación**: Ingresar PIN de 6 dígitos (default: 123456)
4. **Sincronizar**: El dispositivo se sincronizará automáticamente

### Panel de Control

- **StandBy**: Pone el dispositivo en modo de espera (permite editar configuración)
- **Continuar**: Reanuda la operación normal
- **Reiniciar**: Reinicia el dispositivo
- **Sincronizar**: Actualiza información del dispositivo

### Configuración (Solo en modo StandBy)

- Nombre del dispositivo
- Frecuencia de muestreo (62.5, 125, 250, 500 Hz)
- Intervalo de archivos (1-60 minutos)
- Factores de calibración (X, Y, Z)
- Configuración WiFi (SSID y contraseña)

### Streaming de Datos

1. Ir a la pestaña "Datos"
2. Seleccionar duración (10, 20, 30, 60 segundos)
3. Click en "Iniciar"
4. Los datos se mostrarán en tiempo real en el gráfico
5. Click en "Exportar datos" para descargar CSV

## Estructura del Proyecto

```
huella-ble-pwa/
├── index.html              # Página principal
├── manifest.json           # Manifiesto PWA
├── service-worker.js       # Service Worker
├── web.config             # Configuración IIS/Azure
├── favicon.svg            # Icono vectorial
├── css/
│   ├── app.css           # Estilos de la aplicación
│   └── theme.css         # Sistema de temas
├── js/
│   ├── app.js            # Lógica principal
│   ├── ble-service.js    # Servicio BLE
│   ├── storage-service.js # IndexedDB
│   └── chart-service.js  # Gráficos
└── icon-*.png            # Iconos PWA

```

## Características BLE

### UUIDs del Servicio

```javascript
SERVICE_UUID = '12345678-1234-5678-1234-56789abcdef0'
```

### Características

- **CMD** (Write): Envío de comandos
- **STATUS** (Read/Notify): Estado del dispositivo
- **DATA** (Notify): Streaming de datos
- **CONFIG** (Read/Write): Configuración
- **INFO** (Read): Información del dispositivo
- **PARAMS** (Read/Write): Parámetros editables
- **SYNC** (Read): Sincronización completa

### Comandos Soportados

```json
// Autenticación
{ "cmd": "AUTH", "pin": "123456" }

// Control
{ "cmd": "START" }
{ "cmd": "STOP" }
{ "cmd": "STANDBY" }
{ "cmd": "RESTART" }
{ "cmd": "CONTINUE" }

// Streaming
{ "cmd": "STREAM_START", "duration": 10 }
{ "cmd": "STREAM_STOP" }

// Información
{ "cmd": "GET_INFO" }
{ "cmd": "GET_CONFIG" }
{ "cmd": "SET_CONFIG", "config": {...} }
```

## Almacenamiento Local

La aplicación utiliza IndexedDB para almacenar:

- **Dispositivos recientes**: Historial de conexiones
- **Datos de streaming**: Últimas lecturas del acelerómetro
- **Configuraciones**: Respaldo de configuraciones
- **Logs**: Registro de eventos

## Seguridad

- Autenticación por PIN de 6 dígitos
- Timeout de sesión (30 minutos)
- Comunicación encriptada BLE
- HTTPS obligatorio

## Troubleshooting

### "Web Bluetooth no soportado"
- Usar Chrome/Edge en Android o desktop
- Verificar que el sitio use HTTPS

### "No se encuentra el dispositivo"
- Verificar que el Bluetooth esté activado
- Confirmar que el dispositivo esté publicitando
- Revisar que el nombre empiece con "HUELLA_"

### "Error de autenticación"
- Verificar PIN correcto (default: 123456)
- Reiniciar el dispositivo si es necesario

### "Desconexión frecuente"
- Mantener el dispositivo cerca (< 10m)
- Evitar interferencias WiFi/Bluetooth
- Verificar batería del dispositivo

## Desarrollo

### Requisitos de desarrollo
- Node.js 18+
- Certificados SSL para desarrollo local
- Dispositivo Android o Chrome en desktop

### Modificar configuración BLE
Editar UUIDs en `js/ble-service.js`

### Agregar nuevos comandos
1. Definir comando en firmware
2. Agregar en `js/ble-service.js`
3. Implementar UI en `js/app.js`

## Soporte

Para soporte técnico o reportar problemas:
- GitHub Issues: [tu-repositorio]/issues
- Email: soporte@ctim.com.mx

## Licencia

Copyright © 2024 CTIM / SymbIoT Technologies
Todos los derechos reservados.