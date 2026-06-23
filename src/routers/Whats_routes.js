// Whatsapp_routes.js
import { verificarTokenJWT } from '../middlewares/JWT.js'
import { Router } from "express";
import upload from "../middlewares/Upload.js";

import { enviarMensaje, getQR, getStatus, logout, listaMensajes, deleteMessage,  } from "../controllers/Whatsapp_controller.js";

const router = Router();

// Obtener QR para escanear
router.get("/qr", verificarTokenJWT, obtenerQR);

// Estado del cliente
router.get("/status", verificarTokenJWT, obtenerStatus);

// Enviar mensajes con archivos opcionales
router.post("/enviar-mensaje", verificarTokenJWT, upload.array("files"), enviarMensaje);

router.get("/listarmensajes", verificarTokenJWT, listaMensajes);
router.delete("/mensajes/:id", verificarTokenJWT, eliminarMensaje);


// Logout
router.get("/logout", verificarTokenJWT, logout);

export default router;
