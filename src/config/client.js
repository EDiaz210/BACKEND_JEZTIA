// client.js - WhatsApp Web.js con almacenamiento local
import pkg from "whatsapp-web.js";
const { Client, MessageMedia } = pkg;
import qrcode from "qrcode";
import LocalAuthStrategy from "./localAuth.js";

let lastQR = null;
let readyAt = null;
let client = null;
let localAuth = null;
let isInitializing = false;

// Función para inicializar el cliente de forma lazy
function initializeClient() {
  if (client) return client; // Ya está inicializado
  if (isInitializing) return null; // Evitar inicialización doble
  
  isInitializing = true;
  
  // Crear instancia de autenticación local AQUÍ (no al cargar el módulo)
  localAuth = new LocalAuthStrategy("default");

  client = new Client({
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
      "--disable-background-occluded-windows",
      "--headless=new",
      "--disable-extensions",
      "--no-first-run",
      "--remote-debugging-port=9222"
    ],
    timeout: 60000,
  },
  bypassCSP: true,
});

  // ---------------------- EVENTOS ----------------------

  client.on("qr", async (qr) => {
    try {
      // NO crear directorio aquí - solo cuando se escanee el QR (authenticated)
      lastQR = await qrcode.toDataURL(qr);
      console.log("[WHATSAPP] QR generado. Escanea en /qr");
    } catch (err) {
      console.error("[WHATSAPP] Error generando QR:", err.message);
    }
  });

  client.on("authenticated", async (session) => {
    console.log("[WHATSAPP] Sesión autenticada correctamente");
    // Marcar como autenticado y crear directorio aquí
    localAuth.markAsAuthenticated();
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

  // Inicializar cliente
  console.log("[WHATSAPP] Inicializando cliente...");
  client.initialize();
  console.log("[WHATSAPP] Cliente inicializado. Esperando autenticación...");
  
  isInitializing = false;
  return client;
}

// ---------------------- FUNCIONES ----------------------

const getIsReady = () => {
  return !!readyAt;
};

const getReadyAt = () => readyAt;

const getLastQR = async () => {
  return lastQR || null;
};

const getClient = () => {
  if (!client) {
    initializeClient();
  }
  return client;
};

// Función pública para inicializar WhatsApp cuando sea necesario
const initializeWhatsApp = () => {
  return initializeClient();
};

// Exportar función para inicializar manualmente si es necesario
export { getClient, initializeWhatsApp, getIsReady, getReadyAt, getLastQR };

// Para compatibilidad con código existente que importe 'client'
const clientProxy = new Proxy({}, {
  get(target, prop) {
    const c = getClient();
    return c ? c[prop] : undefined;
  }
});

export { clientProxy as client };
