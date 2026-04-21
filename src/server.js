import express from "express"; //framework
import dotenv from "dotenv";
import cors from "cors"; 
import routerUser from './routers/User_routes.js'
import routerWhats from './routers/Whats_routes.js'
import cloudinary from 'cloudinary'
import http from "http"
import conversacionesRoutes from "./routers/Conversaciones_routes.js";
import feedbackRoutes from './routers/FeedBack_routes.js';




//Inicializaciones
const app = express()
dotenv.config()


//app.set('port', process.env.CLOUDINARY || 3000) //process es paara datos sensibles
const corsOptions = {
  origin: [
    process.env.FRONTEND_URL,
    'http://localhost:5173',
    'http://localhost:3000',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:3000'
  ],
  methods: ["GET", "POST", "PUT", "DELETE",'PATCH', "OPTIONS"],
  credentials: true,
};

//cloudinary para la base de datos
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
})

app.use(cors(corsOptions));


app.use(express.json()); //guarda la informacion del frontend en un archivo json para procesar el backend
app.use(express.urlencoded({ extended: true }));

//Configuraciones
app.set('port', process.env.PORT || 3000) 

// Rutas 
app.get('/',(req,res)=>{
    res.send("Server Jezt funcionando correctamente")
})

// Rutas para mensajes
app.use(routerWhats);

// Nueva ruta unificada para usuarios
app.use(routerUser)

// Rutas para conversaciones
app.use(conversacionesRoutes);

// Rutas para quejas o sugerencias
app.use(feedbackRoutes);

const server = http.createServer(app);

// Manejo de una ruta que no sea encontrada
app.use((req,res)=>res.status(404).send("Endpoint no encontrado - 404"))

//Exportar la instancia
export  { app, server }

