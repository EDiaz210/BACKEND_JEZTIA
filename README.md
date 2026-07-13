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
| Formulario F_AA_233 | [Acceder al formulario](https://epnecuador-my.sharepoint.com/:b:/g/personal/elkin_diaz_epn_edu_ec/IQBIGr9LydvuTK7QuV8vYOCSAfvRD7tHZwierMKwBjeAZTY?e=iBomIX) |
| Documento de tesis | [Ver documento](https://epnecuador-my.sharepoint.com/:b:/g/personal/elkin_diaz_epn_edu_ec/IQCAANQVab5qT567M8kgIh6zAQMmE2K3LPaGu6c9mbUhL84?e=A6jroD) |
| Video demostrativo | [Ver video](https://www.youtube.com/watch?v=tc5cQuuCerQ&feature=youtu.be) |


---

# Aplicación en Producción

Puedes acceder a la plataforma desplegada mediante el siguiente enlace:

👉 **https://backend-jeztia.onrender.com/**



---

# Arquitectura del Sistema

El backend está desplegado en **Render** y se integra con diversos servicios externos para ofrecer una solución escalable y desacoplada.

### Componentes principales

- **Backend Node.js + Express** como API principal.
- **Microservicio de IA** desarrollado con **Python + FastAPI**.
- **MongoDB Atlas** para la persistencia de datos.
- **Cloudinary** para almacenamiento multimedia.
- **WhatsApp.js** para la mensajería.

<img width="585" height="417" alt="image" src="https://github.com/user-attachments/assets/6f0987e6-72fb-41dc-8d5c-9e3d0ecfc681" />


---

# Roles del Sistema

## Administrador

- Inicio de sesión.
- Rehabilitar Contraseña.
- Gestión de perfil y contraseña.
- Gestión de usuarios.
- Gestión de Mensajes.
- Gestión de Chatbot con IA.
## Pasante

- Inicio de sesión.
- Rehabilitar Contraseña.
- Gestión de Perfil y Contraseña.
- Gestión de Mensajes.
- Gestión de Chatbot con IA.

## Estudiante

- Registro
- Inicio de sesión.
- Rehabilitar Contraseña.
- Gestión de perfil y contraseña.
- Gestión de Mensajes e historial.
- Gestión de Chatbot con IA.

  <img width="488" height="314" alt="image" src="https://github.com/user-attachments/assets/a02905e2-ede4-4ec0-a7e1-eefe88f768f9" />


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
