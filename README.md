# Sistema de Mensajería Automatizada ESFOT (Backend)

![NodeJS](https://img.shields.io/badge/node.js-6DA55F?style=for-the-badge&logo=node.js&logoColor=white)
![Express.js](https://img.shields.io/badge/express.js-%23404d59.svg?style=for-the-badge&logo=express&logoColor=%2361DAFB)
![FastAPI](https://img.shields.io/badge/FastAPI-005571?style=for-the-badge&logo=fastapi&logoColor=white)
![Python](https://img.shields.io/badge/python-3670A0?style=for-the-badge&logo=python&logoColor=ffdd54)

Este repositorio contiene el backend principal desarrollado para el Sistema Web de Mensajería Automatizada. Proporciona la API REST central, gestiona la lógica de negocio y la persistencia de datos de la ESFOT, actuando como el orquestador que comunica la interfaz con el microservicio de Inteligencia Artificial y las plataformas de mensajería.

## Características del Backend

El backend está diseñado bajo una arquitectura modular y orientada a servicios que gestiona:

* **Orquestación del Chatbot (Conexión con Microservicio):** Intermediario y pasarela de comunicación hacia el microservicio externo desarrollado en Python y FastAPI para el procesamiento de consultas académicas y extracurriculares con IA.
* **Control de Mensajería y WhatsApp:** Endpoints y controladores dedicados a la gestión, envío, recepción y registro de flujos de mensajes reflejados en el dashboard de WhatsApp.
* **Recepción y Registro de Feedbacks:** Endpoints diseñados para capturar de forma segura las quejas y sugerencias enviadas por los usuarios para la mejora del sistema.
* **Motor de Respuestas Dinámicas:** Endpoints CRUD para alimentar y gestionar las bases de conocimientos de preguntas y respuestas (`QnA`) consumidas por el bot.
* **Autenticación Robusta y Control de Acceso (RBAC):** Sistema seguro de inicio de sesión y middlewares de verificación para actualizar perfiles y restringir rutas según el rol asignado (Administrador, Pasante, Estudiante).

## Tecnologías y Herramientas

* **Entorno de Ejecución:** Node.js para un backend escalable y de alto rendimiento basado en eventos.
* **Framework:** Express.js para la construcción y enrutamiento de la API REST principal.
* **Seguridad y Autenticación:** JSON Web Tokens (JWT) para sesiones seguras y encriptación de credenciales.
* **Seguridad de Red:** Implementation de CORS y validación de variables de entorno (`dotenv`).
* **Arquitectura:** Integración con microservicio externo (Python / FastAPI) para tareas de IA.
* **Base de Datos:** MongoDB Atlas utilizando Mongoose como ODM para la persistencia de datos, usuarios y configuración de respuestas.

## Estructura del Proyecto

```bash
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
