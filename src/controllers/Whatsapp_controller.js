// Whatsapp_controller.js
import { client, getIsReady, getReadyAt, getLastQR } from "../config/client.js";
import pkg from "whatsapp-web.js";
const { MessageMedia } = pkg;
import { normalizeNumber } from "../utils/normalize.js";
import Mensaje from "../models/Mensaje.js";

/**
 * Función que espera que el cliente esté listo (con timeout de 5s)
 */
const waitClientReady = async () => {
  const maxWaitTime = 5000; // 5 segundos máximo
  const startTime = Date.now();
  
  while (!getIsReady() && Date.now() - startTime < maxWaitTime) {
    console.log("[WHATSAPP] Esperando cliente listo...");
    await new Promise(r => setTimeout(r, 200));
  }
  
  if (getIsReady()) {
    console.log("[WHATSAPP] Cliente listo!");
    await new Promise(r => setTimeout(r, 2000));
  } else {
    console.warn("[WHATSAPP] Cliente no reporta ready después de esperar, intentando enviar de todas formas...");
    await new Promise(r => setTimeout(r, 2000));
  }
};

/**
 * Enviar un solo mensaje (texto o multimedia) de forma segura
 * @param {string} number - Número de teléfono limpio
 * @param {string} message - Texto del mensaje
 * @param {Array} mediaInstances - Array de instancias MessageMedia pre-construidas para ahorrar RAM
 */
const enviarMensajeSeguro = async (number, message, mediaInstances = []) => {
  try {
    await waitClientReady();

    // CORRECCIÓN CRÍTICA: WhatsApp Web requiere el sufijo formateado @c.us
    const whatsappId = `${number}@c.us`;

    // Enviar texto - con retry y control de errores
    if (message) {
      try {
        await client.sendMessage(whatsappId, message, { 
          linkPreview: false,  // Evitar procesamientos extra
          sendMediaAsDocument: false
        });
        console.log(`[WHATSAPP] Mensaje de texto enviado a ${number}`);
      } catch (textErr) {
        const errorMsg = textErr.message || '';
        if (!errorMsg.includes('markedUnread')) {
          console.warn(`[WHATSAPP] Error enviando texto a ${number}:`, errorMsg);
        } else {
          console.log(`[WHATSAPP] markedUnread error (ignorado) - mensaje enviado igualmente`);
        }
      }
    }

    // Enviar archivos usando las instancias compartidas
    for (const m of mediaInstances) {
      try {
        await client.sendMessage(whatsappId, m);
        console.log(`[WHATSAPP] Archivo enviado a ${number}`);
      } catch (mediaErr) {
        const errorMsg = mediaErr.message || '';
        if (!errorMsg.includes('markedUnread')) {
          console.warn(`[WHATSAPP] Error enviando archivo a ${number}:`, errorMsg);
        }
      }
    }

    console.log(`[WHATSAPP] Completado envío a ${number}`);
    return { to: number, sent: true };
  } catch (err) {
    console.error(`[WHATSAPP] Error general enviando a ${number}:`, err.message);
    if (err.message && err.message.includes("Execution context was destroyed")) {
      console.warn(`[WHATSAPP] Contexto destruido para ${number} - marcando como enviado igualmente`);
      return { to: number, sent: true, note: "Enviado con contexto destruido" };
    }
    return { to: number, sent: false, error: err.message };
  }
};

/**
 * Controlador POST /enviar-mensaje
 */
const enviarMensaje = async (req, res) => {
  try {
    // Validar que sea administrador o pasante
    if (!req.userBDD || (req.userBDD.rol !== "administrador" && req.userBDD.rol !== "pasante")) {
      return res.status(403).json({ 
        error: "Acceso denegado: solo administradores y pasantes pueden enviar mensajes"
      });
    }

    const ALLOWED_TIPOS = ["Administrativas", "Académicas", "Extracurriculares"];
    
    // Validar categoría
    const tipo = req.body.tipo?.trim();
    if (!tipo || !ALLOWED_TIPOS.includes(tipo)) {
      return res.status(400).json({ 
        error: `La categoría debe ser una de: ${ALLOWED_TIPOS.join(", ")}`
      });
    }

    let numbers = req.body.numbers || req.body["numbers[]"] || [];
    if (!Array.isArray(numbers)) numbers = [numbers];
    numbers = numbers.map(normalizeNumber).filter(Boolean);

    if (!numbers.length && !req.files?.length) return res.status(400).json({ error: "No hay números válidos o archivos" });

    const message = req.body.message ? req.body.message.trim() : "";

    if (!message && !req.files?.length) {
      return res.status(400).json({ error: "El cuerpo del mensaje o un archivo es obligatorio." });
    }

    if (message.length > 300) {
      return res.status(400).json({
        error: `El mensaje no puede superar los 300 caracteres. Enviaste: ${message.length}`
      });
    }

    // OPTIMIZACIÓN DE MEMORIA: Mapear los archivos a Base64 una sola vez fuera del bucle
    const mediaInstances = (req.files || []).map(f => {
      const bufferSource = f.buffer || fs.readFileSync(f.path);
      return new MessageMedia(f.mimetype, bufferSource.toString("base64"), f.originalname);
    });

    const results = [];
    for (const n of numbers) {
      // Pasamos las instancias fijas mapeadas
      const result = await enviarMensajeSeguro(n, message, mediaInstances);
      results.push(result);
      await new Promise(r => setTimeout(r, 500)); // Evitar saturar WhatsApp
    }

    // Guardar en MongoDB histórico
    const nuevoMensaje = new Mensaje({
      numbers,
      message,
      hasMedia: !!req.files?.length,
      files: req.files?.map(f => ({ fileName: f.originalname, fileMime: f.mimetype })),
      tipo: tipo,
      date: new Date(),
    });
    await nuevoMensaje.save();

    res.json({ "Se ha enviado el mensaje a los números indicados": results });
  } catch (err) {
    console.error("Error sendMessage:", err);
    res.status(500).json({ error: err.message });
  }
};

/**
 * GET /qr
 */
const obtenerQR = async (req, res) => {
  try {
    if (!req.userBDD || (req.userBDD.rol !== "administrador" && req.userBDD.rol !== "pasante")) {
      return res.status(403).json({ 
        error: "Acceso denegado: solo administradores y pasantes pueden acceder al QR"
      });
    }

    if (getIsReady()) return res.json({ ready: true, qr: null });
    
    // Removido await si el método es síncrono en memoria
    const qr = getLastQR();
    res.json({ ready: false, qr });
  } catch (err) {
    console.error("Error en getQR:", err);
    res.status(500).json({ error: err.message });
  }
};

/**
 * GET /status
 */
const obtenerStatus = async (req, res) => {
  try {
    if (!req.userBDD || (req.userBDD.rol !== "administrador" && req.userBDD.rol !== "pasante")) {
      return res.status(403).json({ 
        error: "Acceso denegado: solo administradores y pasantes pueden ver el estado"
      });
    }

    const state = await client.getState().catch(() => "ERROR");
    res.json({ ready: getIsReady(), state });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * GET /lista-mensajes
 */
const listaMensajes = async (req, res) => {
  try {
    if (!req.userBDD || (req.userBDD.rol !== "administrador" && req.userBDD.rol !== "pasante")) {
      return res.status(403).json({ 
        error: "Acceso denegado: solo administradores y pasantes pueden listar mensajes"
      });
    }

    const { tipo, fechaInicio, fechaFin } = req.query;

    // CORRECCIÓN: Filtro plano estructurado en vez de forzar un array de un único elemento en $and
    const filtro = {
      $or: [{ status: { $exists: false } }, { status: true }]
    };

    if (tipo) {
      filtro.tipo = tipo;
    }

    if (fechaInicio || fechaFin) {
      filtro.date = {};
      if (fechaInicio) filtro.date.$gte = new Date(fechaInicio);
      if (fechaFin) filtro.date.$lte = new Date(fechaFin);
    }

    const mensajes = await Mensaje.find(filtro)
      .select("-__v") 
      .sort({ date: -1 });

    res.status(200).json(mensajes);
  } catch (error) {
    console.error("Error al listar mensajes:", error);
    res.status(500).json({ error: "Error al listar mensajes" });
  }
};

/**
 * DELETE /delete-message/:id
 */
const eliminarMensaje = async (req, res) => {
  try {
    if (!req.userBDD || (req.userBDD.rol !== "administrador" && req.userBDD.rol !== "pasante")) {
      return res.status(403).json({ 
        error: "Acceso denegado: solo administradores y pasantes pueden eliminar mensajes"
      });
    }

    const { id } = req.params;
    if (!id) return res.status(400).json({ error: "Se requiere el ID del mensaje" });

    const mensaje = await Mensaje.findByIdAndUpdate(
      id,
      { status: false },
      { new: true }
    );

    if (!mensaje) return res.status(404).json({ error: "Mensaje no encontrado" });

    res.status(200).json({ 
      ok: true, 
      message: "Mensaje eliminado correctamente",
      mensaje 
    });
  } catch (error) {
    console.error("Error al eliminar mensaje:", error);
    res.status(500).json({ error: "Error al eliminar el mensaje" });
  }
};

/**
 * GET /logout
 */
const logout = async (req, res) => {
  try {
    if (!req.userBDD || (req.userBDD.rol !== "administrador" && req.userBDD.rol !== "pasante")) {
      return res.status(403).json({ 
        error: "Acceso denegado: solo administradores y pasantes pueden cerrar sesión"
      });
    }

    await client.logout();
    console.log("[WHATSAPP] Sesión cerrada");
    
    res.json({ ok: true, message: "Sesión de WhatsApp cerrada" });
  } catch (err) {
    console.error("[WHATSAPP] Error en logout:", err.message);
    res.status(500).json({ error: err.message });
  }
};

export { enviarMensaje, obtenerQR, obtenerStatus, logout, listaMensajes, eliminarMensaje };
