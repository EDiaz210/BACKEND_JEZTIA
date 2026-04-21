// Whatsapp_routes.js
import { verificarTokenJWT } from '../middlewares/JWT.js'
import { Router } from "express";
import upload from "../middlewares/Upload.js";

import { sendMessage, getQR, getStatus, logout, listaMensajes, deleteMessage, sendMessageN8N } from "../controllers/Whatsapp_controller.js";

const router = Router();

// Obtener QR para escanear
router.get("/qr", verificarTokenJWT, getQR);

// Estado del cliente
router.get("/status", verificarTokenJWT, getStatus);

// Enviar mensajes con archivos opcionales
router.post("/send-message", verificarTokenJWT, upload.array("files"), sendMessage);

router.get("/listarmensajes", verificarTokenJWT, listaMensajes);
router.delete("/mensajes/:id", verificarTokenJWT, deleteMessage);
router.post("/send-message-n8n", sendMessageN8N);

// Logout
router.get("/logout", verificarTokenJWT, logout);

export default router;
