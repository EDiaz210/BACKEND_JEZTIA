/**
 * Local Auth Strategy para WhatsApp Web.js
 * Almacena sesiones en memoria en producción (Render)
 * En desarrollo local, persiste a disco en .wwebjs_auth
 */
import pkg from 'whatsapp-web.js';
const { LocalAuth } = pkg;
import path from 'path';
import fs from 'fs';

// Almacenamiento en memoria (temporal)
const inMemoryStore = {};

// Detectar si está en producción
const isProduction = process.env.NODE_ENV === 'production';

export class LocalAuthStrategy extends LocalAuth {
  constructor(clientId = 'default') {
    const finalDir = path.join(process.cwd(), '.wwebjs_auth');
    
    // No pasar dataPath - evitar que cree directorio
    super({ clientId });
    
    this.clientId = clientId;
    this.finalDir = finalDir;
    this.isAuthenticated = false;
    this.isProduction = isProduction;
  }

  async getClientData(clientId) {
    // En producción, siempre usar memoria
    if (this.isProduction) {
      return inMemoryStore[clientId] || null;
    }
    
    // En desarrollo, si ya está autenticado y existe el archivo, usar disco
    if (this.isAuthenticated && fs.existsSync(this.finalDir)) {
      const filePath = path.join(this.finalDir, `${clientId}.json`);
      if (fs.existsSync(filePath)) {
        return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      }
    }
    
    // Si no, usar memoria
    return inMemoryStore[clientId] || null;
  }

  async setClientData(clientId, data) {
    // Guardar en memoria siempre
    inMemoryStore[clientId] = data;
    
    // En desarrollo y si está autenticado, también guardar a disco
    if (!this.isProduction && this.isAuthenticated) {
      try {
        this.ensureDirectory();
        const filePath = path.join(this.finalDir, `${clientId}.json`);
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
      } catch (err) {
        console.warn('[Local Auth] No se pudo guardar a disco:', err.message);
      }
    }
  }

  async deleteClientData(clientId) {
    delete inMemoryStore[clientId];
    
    // En desarrollo, también eliminar del disco
    if (!this.isProduction && fs.existsSync(this.finalDir)) {
      const filePath = path.join(this.finalDir, `${clientId}.json`);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
  }

  ensureDirectory() {
    // No intentar crear directorio en producción
    if (this.isProduction) return;
    
    if (!fs.existsSync(this.finalDir)) {
      try {
        fs.mkdirSync(this.finalDir, { recursive: true });
        console.log(`[Local Auth] Directorio de sesión creado: ${this.finalDir}`);
      } catch (err) {
        console.warn('[Local Auth] No se pudo crear directorio:', err.message);
      }
    }
  }

  markAsAuthenticated() {
    this.isAuthenticated = true;
    
    if (this.isProduction) {
      console.log('[Local Auth] Autenticado en PRODUCCIÓN (memoria solamente)');
      return;
    }
    
    // En desarrollo, crear directorio y migrar datos
    this.ensureDirectory();
    
    try {
      Object.entries(inMemoryStore).forEach(([clientId, data]) => {
        const filePath = path.join(this.finalDir, `${clientId}.json`);
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
      });
      console.log('[Local Auth] Datos migrados a disco');
    } catch (err) {
      console.warn('[Local Auth] Error migrando datos:', err.message);
    }
  }
}

export default LocalAuthStrategy;
