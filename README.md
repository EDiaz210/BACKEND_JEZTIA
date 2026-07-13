# Sistema de Mensajería Automatizada ESFOT (Backend)

![NodeJS](https://img.shields.io/badge/node.js-6DA55F?style=for-the-badge&logo=node.js&logoColor=white)
![Express.js](https://img.shields.io/badge/express.js-%23404d59.svg?style=for-the-badge&logo=express&logoColor=%2361DAFB)
![FastAPI](https://img.shields.io/badge/FastAPI-005571?style=for-the-badge&logo=fastapi&logoColor=white)
![Python](https://img.shields.io/badge/python-3670A0?style=for-the-badge&logo=python&logoColor=ffdd54)

Este repositorio contiene el backend principal desarrollado para el Sistema Web de Mensajería Automatizada. Proporciona la API REST central, gestiona la lógica de negocio y la persistencia de datos de la ESFOT, actuando como el orquestador que comunica la interfaz con el microservicio de Inteligencia Artificial y las plataformas de mensajería.## Características del Backend

El backend está diseñado bajo una arquitectura modular y orientada a servicios que gestiona:* **Orquestación del Chatbot (Conexión con Microservicio):** Intermediario y pasarela de comunicación hacia el microservicio externo desarrollado en Python y FastAPI para el procesamiento de consultas académicas y extracurriculares con IA.* **Control de Mensajería y WhatsApp:** Endpoints y controladores dedicados a la gestión, envío, recepción y registro de flujos de mensajes reflejados en el dashboard de WhatsApp.* **Recepción y Registro de Feedbacks:** Endpoints diseñados para capturar de forma segura las quejas y sugerencias enviadas por los usuarios para la mejora del sistema.* **Motor de Respuestas Dinámicas:** Endpoints CRUD para alimentar y gestionar las bases de conocimientos de preguntas y respuestas (`QnA`) consumidas por el bot.* **Autenticación Robusta y Control de Acceso (RBAC):** Sistema seguro de inicio de sesión y middlewares de verificación para actualizar perfiles y restringir rutas según el rol asignado (Administrador, Pasante, Estudiante).## Tecnologías y Herramientas* **Entorno de Ejecución:** Node.js para un backend escalable y de alto rendimiento basado en eventos.* **Framework:** Express.js para la construcción y enrutamiento de la API REST principal.* **Seguridad y Autenticación:** JSON Web Tokens (JWT) para sesiones seguras y encriptación de credenciales.* **Seguridad de Red:** Implementación de CORS y validación de variables de entorno (`dotenv`).* **Arquitectura:** Integración con microservicio externo (Python / FastAPI) para tareas de IA.* **Base de Datos:** MongoDB Atlas utilizando Mongoose como ODM para la persistencia de datos, usuarios y configuración de respuestas.## Estructura del Proyecto```bash
BACKEND_...STER
└── src
    ├── config
    ├── controllers
    ├── helpers
    ├── middlewares
    ├── models
    ├── routers
    ├── utils
    ├── database.js
    ├── index.js
    └── server.js
├── .env.example
├── .gitignore
├── .nodemon.json
├── fix.whatsapp.js
├── package-lock.json
└── package.json
```## Recursos importantes| Recurso | Enlace || :--- | :--- || Formulario F_AA_233 | [Acceder al formulario](https://esfot.epn.edu.ec/) || Formulario F_AA_234 | [Acceder al formulario](https://esfot.epn.edu.ec/) || Formulario F_AA_236 | [Acceder al formulario](https://esfot.epn.edu.ec/) || Documento de tesis | [Ver documento](https://esfot.epn.edu.ec/) || Certificado IA | [Ver documento](https://esfot.epn.edu.ec/) || Turnitin | [Ver documento](https://esfot.epn.edu.ec/) || Video demostrativo | [Ver video](https://esfot.epn.edu.ec/) |## Aplicación en producciónPuedes acceder a la plataforma desplegada a través del siguiente enlace:
👉 [https://grupo-moreno.onrender.com](https://grupo-moreno.onrender.com)## Patrón arquitectónicoLa arquitectura del backend interactúa directamente con Render para el despliegue, Cloudinary para multimedia, MongoDB Atlas para persistencia y automatizaciones mediante webhooks con n8n.![Arquitectura Backend](./arquitectura.png)## Roles del sistema### Administrador* Inicio de sesióngestión de perfil* Gestión de vendedores y clientes* Gestión de categorías* Visualización de estadísticas y reporte de ventas* Gestión de quejas y/o sugerencias* Recomendaciones automatizadas mediante N8N### Vendedor* Inicio de sesión y gestión de perfil* Gestión de productos e inventario* Visualización de ventas realizadas* Gestión de pedidos pendientes* Recomendaciones al administrador### Cliente* Registro e inicio de sesión* Gestión de perfil* Visualización del catálogo de productos y categorías* Gestión del carrito de compras* Proceso de pago (efectivo, transferencia o tarjeta)* Gestión de quejas y/o sugerencias![Diagrama de Roles](./roles.png)## Pasos de InstalaciónSigue estos pasos para levantar el entorno de desarrollo de forma local:```bash
# 1. Clonar el repositorio
git clone https://github.com/alessia-23/grupo_moreno.git

# 2. Ingresar al directorio del proyecto
cd grupo_moreno

# 3. Instalar las dependencias de Node.js
npm install

# 4. Configurar el entorno local
cp .env.example .env
# Edita el archivo .env e introduce tus credenciales de MongoDB Atlas y claves secretas JWT

# 5. Ejecutar la aplicación en modo desarrollo
npm run dev
```## Autora**Alessia de los Ángeles Pérez Palacios**
* Correo institucional: [alessia.perez@epn.edu.ec](mailto:alessia.perez@epn.edu.ec)**Director de Tesis:** Ing. Byron Gustavo Loarte Cajamarca, MSc.
* Correo institucional: [byron.loarteb@epn.edu.ec](mailto:byron.loarteb@epn.edu.ec)**Año:** 2026
