/**
 * Local Auth Strategy para WhatsApp Web.js
 * Almacena y recupera sesiones de WhatsApp localmente en el disco
 * ✅ Almacenamiento local sin dependencias de MongoDB
 */
import pkg from 'whatsapp-web.js';
const { LocalAuth } = pkg;
import path from 'path';
import fs from 'fs';

export class LocalAuthStrategy extends LocalAuth {
  constructor(clientId = 'default') {
    // Usar directorio local para almacenar sesiones
    const baseDir = path.join(process.cwd(), '.wwebjs_auth');
    super({ clientId, dataPath: baseDir });
    this.clientId = clientId;
    
    // Crear directorio si no existe
    if (!fs.existsSync(baseDir)) {
      fs.mkdirSync(baseDir, { recursive: true });
      console.log(`[Local Auth] Directorio de sesión creado: ${baseDir}`);
    }
  }
}

export default LocalAuthStrategy;
