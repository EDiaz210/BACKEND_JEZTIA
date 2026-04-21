// client.js - WhatsApp Web.js con almacenamiento local
import pkg from "whatsapp-web.js";
const { Client, MessageMedia } = pkg;
import qrcode from "qrcode";
import LocalAuthStrategy from "./localAuth.js";
import os from "os";
import path from "path";
import fs from "fs";
import { globSync } from "glob";

let lastQR = null;
let readyAt = null;

// Crear instancia de autenticación local
const localAuth = new LocalAuthStrategy("default");

// Función para encontrar Chrome en el sistema
const findChromePath = () => {
  // Primero intentar variable de entorno
  if (process.env.CHROME_BIN && fs.existsSync(process.env.CHROME_BIN)) {
    console.log(`[PUPPETEER] Chrome encontrado en CHROME_BIN: ${process.env.CHROME_BIN}`);
    return process.env.CHROME_BIN;
  }

  // En Render, buscar en el directorio de caché
  const cacheDir = process.env.PUPPETEER_CACHE_DIR || 
    path.join(process.env.HOME || os.homedir(), ".cache", "puppeteer");
  
  try {
    const chromePaths = globSync(`${cacheDir}/chrome/linux-*/chrome-linux64/chrome`);
    if (chromePaths.length > 0) {
      console.log(`[PUPPETEER] Chrome encontrado en caché: ${chromePaths[0]}`);
      return chromePaths[0];
    }
  } catch (e) {
    console.warn(`[PUPPETEER] Error buscando Chrome en caché:`, e.message);
  }

  console.log(`[PUPPETEER] No se especifica executablePath - Puppeteer intentará descargar`);
  return undefined;
};

// Configurar ruta de caché para Render
const cacheDir = process.env.PUPPETEER_CACHE_DIR || 
  path.join(process.env.HOME || os.homedir(), ".cache", "puppeteer");

const client = new Client({
  authStrategy: localAuth, // Usar autenticación local
  puppeteer: {
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-gpu",
      "--disable-blink-features=AutomationControlled",
      "--disable-cache",
      "--disable-application-cache",
      "--disable-offline",
      "--disk-cache-size=1",
      "--single-process=false",
      "--disable-background-timer-throttling",
      "--disable-renderer-backgrounding",
      "--disable-backgrounding-occluded-windows",
    ],
    timeout: 60000,
    executablePath: findChromePath(),
    cacheDirectory: cacheDir,
  },
  bypassCSP: true,
});

// ---------------------- EVENTOS ----------------------

client.on("qr", async (qr) => {
  try {
    lastQR = await qrcode.toDataURL(qr);
    console.log("[WHATSAPP] QR generado. Escanea en /qr");
  } catch (err) {
    console.error("[WHATSAPP] Error generando QR:", err.message);
  }
});

client.on("authenticated", async (session) => {
  console.log("[WHATSAPP] Sesión autenticada correctamente");
  if (!readyAt) {
    readyAt = Date.now();
    console.log("[WHATSAPP] Cliente marcado como listo");
  }
});

client.on("ready", async () => {
  readyAt = Date.now();
  console.log("[WHATSAPP] Cliente listo y conectado");

  // Inyectar protección contra markedUnread
  try {
    await client.pupPage.evaluateOnNewDocument(() => {
      window.Store = window.Store || {};
      const originalSendSeen = window.Store.sendSeen;
      if (typeof originalSendSeen === 'function') {
        window.Store.sendSeen = function() {
          try {
            if (this && this.markedUnread !== undefined) {
              return originalSendSeen.apply(this, arguments);
            }
          } catch (e) {
            console.warn('[PROTECTION] sendSeen error:', e.message);
          }
          return Promise.resolve();
        };
      }
    });
    console.log("[WHATSAPP] Protección markedUnread inyectada");
  } catch (err) {
    console.warn("[WHATSAPP] Error inyectando protección:", err.message);
  }
});

client.on("auth_failure", (err) => {
  console.error("[WHATSAPP] Fallo de autenticación:", err);
});

client.on("disconnected", (reason) => {
  console.warn("[WHATSAPP] Cliente desconectado:", reason);
  readyAt = null;
});

client.on("change_state", async (state) => {
  console.log("[WHATSAPP] Cambio de estado:", state);
  if (state === "CONNECTED" && !readyAt) {
    readyAt = Date.now();
    console.log("[WHATSAPP] Cliente conectado (desde change_state)");
  }
});

client.on("error", (err) => {
  console.error("[WHATSAPP ERROR]", err.message);
});

process.on("unhandledRejection", (reason) => {
  if (reason && reason.message && reason.message.includes("Execution context was destroyed")) {
    console.warn("[WHATSAPP] Contexto de ejecución destruido (normal), continuando...");
  } else {
    console.error("[UNHANDLED REJECTION]", reason);
  }
});

// ---------------------- FUNCIONES ----------------------

const getIsReady = () => {
  return !!readyAt;
};

const getReadyAt = () => readyAt;

const getLastQR = async () => {
  return lastQR || null;
};

// Inicializar cliente
console.log("[WHATSAPP] Inicializando cliente...");
client.initialize();
console.log("[WHATSAPP] Cliente inicializado. Esperando autenticación...");

export { client, getIsReady, getReadyAt, getLastQR };
