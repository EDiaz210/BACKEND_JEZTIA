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

```

# Recursos Importantes

| Recurso | Enlace |
|----------|---------|
| Formulario F_AA_233 | [Acceder al formulario](#) |
| Formulario F_AA_234 | [Acceder al formulario](#) |
| Formulario F_AA_236 | [Acceder al formulario](#) |
| Documento de tesis | [Ver documento](#) |
| Certificado IA | [Ver documento](#) |
| Turnitin | [Ver documento](#) |
| Video demostrativo | [Ver video](#) |

> **Nota:** Reemplaza los enlaces (`#`) por las URLs correspondientes.

---

# Aplicación en Producción

Puedes acceder a la plataforma desplegada mediante el siguiente enlace:

👉 **https://backend-jeztia.onrender.com/**

> Cambia este enlace si corresponde al despliegue del Sistema ESFOT.

---

# Arquitectura del Sistema

El backend está desplegado en **Render** y se integra con diversos servicios externos para ofrecer una solución escalable y desacoplada.

### Componentes principales

- **Frontend Web** para la administración del sistema.
- **Backend Node.js + Express** como API principal.
- **Microservicio de IA** desarrollado con **Python + FastAPI**.
- **MongoDB Atlas** para la persistencia de datos.
- **Cloudinary** para almacenamiento multimedia.
- **WhatsApp API** para la mensajería.
- **n8n** para automatización mediante Webhooks.

```
Frontend
     │
     ▼
Backend (Node.js + Express)
     │
     ├────────► MongoDB Atlas
     │
     ├────────► Microservicio IA (FastAPI)
     │
     ├────────► Cloudinary
     │
     ├────────► WhatsApp API
     │
     └────────► n8n Webhooks
```

---

# Roles del Sistema

## Administrador

- Inicio de sesión.
- Gestión de perfil.
- Administración de usuarios.
- Gestión de preguntas y respuestas (QnA).
- Gestión de feedbacks.
- Monitoreo del chatbot.
- Visualización del dashboard de WhatsApp.
- Administración de la base de conocimientos.

## Pasante

- Inicio de sesión.
- Gestión de perfil.
- Administración de preguntas frecuentes.
- Gestión de respuestas del chatbot.
- Registro de información académica.

## Estudiante

- Acceso al chatbot.
- Consulta de información académica.
- Consulta de información extracurricular.
- Envío de sugerencias.
- Envío de quejas.
- Interacción mediante WhatsApp.

---

# Instalación

Sigue estos pasos para ejecutar el proyecto localmente.

```bash
# 1. Clonar el repositorio
git clone https://github.com/EDiaz210/BACKEND_JEZTIA.git

# 2. Entrar al proyecto
cd backend

# 3. Instalar dependencias
npm install

# 4. Configurar variables de entorno
cp .env.example .env

# Editar el archivo .env con:
# - MongoDB Atlas
# - JWT_SECRET
# - Variables del microservicio IA
# - Variables de WhatsApp
```

Ejecutar en modo desarrollo:

```bash
npm run dev
```

Ejecutar en producción:

```bash
npm start
```

---

# Autores

### Autora

**Elkin Javier Diaz Catucuamba**

📧 elkin.diaz@epn.edu.ec

### Director de Tesis

**Ing. Byron Gustavo Loarte Cajamarca, MSc.**

📧 byron.loarteb@epn.edu.ec

**Año:** 2026
