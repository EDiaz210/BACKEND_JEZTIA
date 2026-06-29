import User from "../models/User.js";
import { esNumeroEcuador } from "../utils/normalize.js";
import { crearTokenJWT } from "../middlewares/JWT.js";
import { sendMailToRegister, sendMailToRecoveryPassword } from "../config/nodemailer.js";
import { v2 as cloudinary } from 'cloudinary';
import fs from "fs-extra";
import mongoose from "mongoose";

// RegEx Global
const soloLetrasRegEx = /^[A-Za-zÑñÁáÉéÍíÓóÚúÜü\s]+$/;

// Registro de usuario estudiante
const registro = async (req, res) => {
  try {
    const { nombre, apellido, email, password, username, numero, carrera } = req.body;

    // Validación estricta campo por campo
    if (!nombre || !apellido || !email || !password || !username || !numero || !carrera) {
      return res.status(400).json({ msg: "Debes llenar todos los campos requeridos" });
    }

    const nombreLimpio = nombre.trim();
    const apellidoLimpio = apellido.trim();
    const emailLimpio = email.trim();
    const usernameLimpio = username.trim();
    const numeroLimpio = numero.trim();
    const passwordLimpio = password.trim();

    if (nombreLimpio.length > 50 || apellidoLimpio.length > 50) {
      return res.status(400).json({ msg: "El nombre y el apellido no pueden tener más de 50 caracteres" });
    }
    if (!soloLetrasRegEx.test(nombreLimpio) || !soloLetrasRegEx.test(apellidoLimpio)) {
      return res.status(400).json({ msg: "El nombre y el apellido solo pueden contener letras y espacios" });
    }

    if (usernameLimpio.length > 50) {
      return res.status(400).json({ msg: "El nombre de usuario no puede tener más de 50 caracteres" });
    }

    const emailLower = emailLimpio.toLowerCase();
    if (!emailLower.endsWith("@epn.edu.ec")) {
      return res.status(400).json({ msg: "El correo debe pertenecer al dominio @epn.edu.ec" });
    }

    if (passwordLimpio.length < 14) {
      return res.status(400).json({ msg: "La contraseña debe tener al menos 14 caracteres" });
    }

    const verificarEmailBDD = await User.findOne({ email: new RegExp(`^${emailLower}$`, 'i') });
    if (verificarEmailBDD) {
      return res.status(400).json({ msg: "El email ya se encuentra registrado" });
    }

    const verificarUsername = await User.findOne({ username: usernameLimpio });
    if (verificarUsername) {
      return res.status(400).json({ msg: "El nombre de usuario ya está en uso" });
    }

    if (!esNumeroEcuador(numeroLimpio)) {
      return res.status(400).json({ msg: "El número debe ser de Ecuador" });
    }

    const existeNumero = await User.findOne({ numero: numeroLimpio });
    if (existeNumero) return res.status(400).json({ msg: "El número ya está registrado" });

    const carrerasValidas = ["TSDS", "TSEM", "TSASA", "TSPIM", "TSPA", "TSRT"];
    if (!carrerasValidas.includes(carrera)) {
      return res.status(400).json({ msg: "La carrera seleccionada no es válida" });
    }

    // Instancia limpia mapeada
    const nuevoUsuario = new User({
      nombre: nombreLimpio,
      apellido: apellidoLimpio,
      email: emailLower,
      username: usernameLimpio,
      numero: numeroLimpio,
      carrera,
      rol: "estudiante"
    });

    if (req.files?.imagen) {
      const { secure_url, public_id } = await cloudinary.uploader.upload(req.files.imagen.tempFilePath, { folder: 'Usuarios' });
      nuevoUsuario.avatarUsuario = secure_url;
      nuevoUsuario.avatarUsuarioID = public_id;
      await fs.unlink(req.files.imagen.tempFilePath);
    }

    nuevoUsuario.password = await nuevoUsuario.encryptPassword(passwordLimpio);
    const token = nuevoUsuario.crearToken();
    await sendMailToRegister(emailLower, token);
    await nuevoUsuario.save();

    return res.status(201).json({ msg: "Revisa tu correo electrónico para confirmar tu cuenta" });
  } catch (err) {
    const dupCode = err?.code || err?.errorResponse?.code;
    if (dupCode === 11000) {
      const key = err.keyValue ? Object.keys(err.keyValue)[0] : 'campo';
      return res.status(400).json({ msg: `El ${key} ya está registrado` });
    }
    return res.status(500).json({ msg: 'Ocurrió un error en el servidor' });
  }
};

// Confirmar email
const confirmarEmail = async (req, res) => {
  try {
    if (!req.params.token) return res.status(400).json({ msg: "No se puede validar la cuenta" });
    const userBDD = await User.findOne({ token: req.params.token });
    if (!userBDD?.token) return res.status(404).json({ msg: "La cuenta ya ha sido confirmada" });
    
    userBDD.token = null;
    userBDD.confirmEmail = true;
    await userBDD.save();
    res.status(200).json({ msg: "Token confirmado, ya puedes iniciar sesión" });
  } catch (error) {
    res.status(500).json({ msg: "Error al confirmar email" });
  }
};

// Login
const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ msg: "Debes llenar todos los campos" });

    const emailLower = email.trim().toLowerCase();
    const passwordLimpio = password.trim();

    const userBDD = await User.findOne({ email: emailLower });
    if (!userBDD) return res.status(404).json({ msg: "Usuario no existe" });
    
    // CORRECCIÓN DE SEGURIDAD: Validar baneo activo
    if (userBDD.status === false) {
      return res.status(403).json({ msg: "Tu cuenta se encuentra suspendida por comportamiento inapropiado" });
    }

    const verificarPassword = await userBDD.matchPassword(passwordLimpio);
    if (!verificarPassword) return res.status(401).json({ msg: "Contraseña incorrecta" });

    const token = crearTokenJWT(userBDD._id, userBDD.rol);
    res.status(200).json({ 
      token, 
      nombre: userBDD.nombre, 
      apellido: userBDD.apellido, 
      username: userBDD.username, 
      _id: userBDD._id, 
      rol: userBDD.rol, 
      email: userBDD.email 
    });
  } catch (error) {
    res.status(500).json({ msg: "Error al iniciar sesión" });
  }
};

// Perfil
const perfil = (req, res) => {
  const { token, confirmEmail, createdAt, updatedAt, __v, password, ...datosPerfil } = req.userBDD;
  res.status(200).json(datosPerfil);
};

// Recuperar password
const recuperarPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email || email.trim() === "") return res.status(400).json({ msg: "El email es requerido" });

    const emailLimpio = email.trim().toLowerCase();
    const userBDD = await User.findOne({ email: new RegExp(`^${emailLimpio}$`, "i") });
    if (!userBDD) return res.status(404).json({ msg: "Usuario no registrado" });

    const token = userBDD.crearToken();
    userBDD.token = token;
    await sendMailToRecoveryPassword(userBDD.email, token);
    await userBDD.save();
    res.status(200).json({ msg: "Revisa tu correo electrónico para reestablecer tu cuenta" });
  } catch (error) {
    res.status(500).json({ msg: "Error al procesar recuperación de contraseña" });
  }
};

// Comprobar token de password
const comprobarTokenPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const userBDD = await User.findOne({ token });
    if (!userBDD || userBDD.token !== token) {
      return res.status(404).json({ msg: "No se puede validar la cuenta o el token expiró" });
    }
    res.status(200).json({ msg: "Token confirmado, ya puedes crear tu nuevo password" });
  } catch (error) {
    res.status(500).json({ msg: "Error de servidor al validar token" });
  }
};

// Crear nueva password
const crearNuevaPassword = async (req, res) => {
  try {
    const { password, confirmpassword } = req.body;
    if (!password || !confirmpassword) return res.status(400).json({ msg: "Debes llenar todos los campos" });

    const passwordLimpio = password.trim();
    const confirmpasswordLimpio = confirmpassword.trim();

    if (passwordLimpio.length < 14) {
      return res.status(400).json({ msg: "La contraseña debe tener al menos 14 caracteres" });
    }
    if (passwordLimpio !== confirmpasswordLimpio) {
      return res.status(400).json({ msg: "Las contraseñas no coinciden" });
    }

    const userBDD = await User.findOne({ token: req.params.token });
    if (!userBDD || userBDD.token !== req.params.token) {
      return res.status(404).json({ msg: "Error de validación o token inválido" });
    }

    userBDD.token = null;
    userBDD.password = await userBDD.encryptPassword(passwordLimpio);
    await userBDD.save();
    res.status(200).json({ msg: "Contraseña actualizada con éxito" });
  } catch (error) {
    res.status(500).json({ msg: "Error al reestablecer la contraseña" });
  }
};

// Actualizar perfil 
const updatePerfil = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(404).json({ msg: "ID inválido" });
    if (req.userBDD._id.toString() !== id) return res.status(403).json({ msg: 'No autorizado' });

    const usuario = await User.findById(id);
    if (!usuario) return res.status(404).json({ msg: "Usuario no encontrado" });

    const { nombre, apellido, email, username } = req.body;

    const nomLimpio = nombre.trim();
    const apeLimpio = apellido.trim();
    
    if (nomLimpio.length > 50 || apeLimpio.length > 50) {
      return res.status(400).json({ msg: "El nombre y el apellido no pueden tener más de 50 caracteres" });
    }
    if (!soloLetrasRegEx.test(nomLimpio) || !soloLetrasRegEx.test(apeLimpio)) {
      return res.status(400).json({ msg: "El nombre y el apellido solo pueden contener letras y espacios" });
    }

    if (email) {
      const emailLower = email.toString().toLowerCase().trim();
      if (!emailLower.endsWith("@epn.edu.ec")) return res.status(400).json({ msg: "Debe ser con el dominio @epn.edu.ec" });
      const existeEmail = await User.findOne({ email: new RegExp(`^${emailLower}$`, 'i'), _id: { $ne: id } });
      if (existeEmail) return res.status(400).json({ msg: "El email ya se encuentra registrado" });
      usuario.email = emailLower;
    }
    if (username) {
      const userLimpio = username.trim();
      if (userLimpio.length > 50) {
      return res.status(400).json({ msg: "El nombre de usuario no puede tener más de 50 caracteres" });
      }
      const existeUsername = await User.findOne({ username: userLimpio, _id: { $ne: id } });
      if (existeUsername) return res.status(400).json({ msg: "El nombre de usuario ya está en uso" });
      usuario.username = userLimpio;
    }
    await usuario.save();
    res.status(200).json({ msg: "Perfil actualizado correctamente" });
  } catch (error) {
    res.status(500).json({ msg: 'Error al actualizar perfil' });
  }
};


const eliminarPerfil = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(404).json({ msg: "ID inválido" });
    if (req.userBDD._id.toString() !== id) return res.status(403).json({ msg: 'No autorizado' });

    const usuario = await User.findById(id);
    if (!usuario) return res.status(404).json({ msg: "Usuario no encontrado" });

    await usuario.remove();
    res.status(200).json({ msg: "Perfil eliminado correctamente" });
  } catch (error) {
    res.status(500).json({ msg: 'Error al eliminar perfil' });
  }
};

// Cambiar contraseña 
const updatePassword = async (req, res) => {
  try {
    const { id } = req.params;
    const { presentpassword, newpassword } = req.body;
    if(!presentpassword || !newpassword) return res.status(400).json({ msg: "Debes llenar todos los campos" });

    const usuario = await User.findById(id);
    if (!usuario) return res.status(404).json({ msg: 'Lo sentimos, no existe el usuario' });
    
    const presentpasswordLimpio = presentpassword.trim();
    const newpasswordLimpio = newpassword.trim();

    if (newpasswordLimpio.length < 14) {
      return res.status(400).json({ msg: "La contraseña debe tener al menos 14 caracteres" });
    }
    const verificarPassword = await usuario.matchPassword(presentpasswordLimpio);
    if (!verificarPassword) return res.status(400).json({ msg: "La contraseña actual no es correcta" });
    
    usuario.password = await usuario.encryptPassword(newpasswordLimpio);
    await usuario.save();
    res.status(200).json({ msg: "Contraseña actualizada correctamente" });
  } catch (error) {
    res.status(500).json({ msg: 'Error al actualizar contraseña' });
  }
};

// Actualizar imagen
const updateAvatar = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(404).json({ msg: "ID inválido" });
    if (req.userBDD._id.toString() !== id) return res.status(403).json({ msg: 'No autorizado' });

    const usuario = await User.findById(id);
    if (!usuario) return res.status(404).json({ msg: "Usuario no encontrado" });

    if (usuario.avatarUsuarioID) {
      await cloudinary.uploader.destroy(usuario.avatarUsuarioID);
    }
    
    let secure_url, public_id;
    if (req.file) {
      ({ secure_url, public_id } = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder: "Usuarios", resource_type: "auto" },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        );
        stream.end(req.file.buffer);
      }));
      usuario.avatarUsuario = secure_url;
      usuario.avatarUsuarioID = public_id;
    } else {
      return res.status(400).json({ msg: "No se envió ninguna imagen" });
    }
    await usuario.save();
    res.status(200).json({ msg: "Imagen actualizada correctamente", avatar: secure_url });
  } catch (error) {
    res.status(500).json({ msg: "Error al subir imagen" });
  }
};

// FUNCIONES DEL ADMINISTRADOR
// Registro de Pasante
const registroPasante = async (req, res) => {
  if (!req.userBDD || req.userBDD.rol !== "administrador") {
      return res.status(403).json({ msg: "Acceso denegado" });
    }

  try {
    const { nombre, apellido, email, password, username, numero, carrera } = req.body;

    // Validación estricta campo por campo
    if (!nombre || !apellido || !email || !password || !username || !numero || !carrera) {
      return res.status(400).json({ msg: "Debes llenar todos los campos requeridos" });
    }

    const nombreLimpio = nombre.trim();
    const apellidoLimpio = apellido.trim();
    const emailLimpio = email.trim();
    const usernameLimpio = username.trim();
    const numeroLimpio = numero.trim();
    const passwordLimpio = password.trim();

    if (nombreLimpio.length > 50 || apellidoLimpio.length > 50) {
      return res.status(400).json({ msg: "El nombre y el apellido no pueden tener más de 50 caracteres" });
    }
    if (!soloLetrasRegEx.test(nombreLimpio) || !soloLetrasRegEx.test(apellidoLimpio)) {
      return res.status(400).json({ msg: "El nombre y el apellido solo pueden contener letras y espacios" });
    }

    if (usernameLimpio.length > 50) {
      return res.status(400).json({ msg: "El nombre de usuario no puede tener más de 50 caracteres" });
    }

    const emailLower = emailLimpio.toLowerCase();
    if (!emailLower.endsWith("@epn.edu.ec")) {
      return res.status(400).json({ msg: "El correo debe pertenecer al dominio @epn.edu.ec" });
    }

    if (passwordLimpio.length < 14) {
      return res.status(400).json({ msg: "La contraseña debe tener al menos 14 caracteres" });
    }

    const verificarEmailBDD = await User.findOne({ email: new RegExp(`^${emailLower}$`, 'i') });
    if (verificarEmailBDD) {
      return res.status(400).json({ msg: "El email ya se encuentra registrado" });
    }

    const verificarUsername = await User.findOne({ username: usernameLimpio });
    if (verificarUsername) {
      return res.status(400).json({ msg: "El nombre de usuario ya está en uso" });
    }

    if (!esNumeroEcuador(numeroLimpio)) {
      return res.status(400).json({ msg: "El número debe ser de Ecuador" });
    }

    const existeNumero = await User.findOne({ numero: numeroLimpio });
    if (existeNumero) return res.status(400).json({ msg: "El número ya está registrado" });

    const carrerasValidas = ["TSDS", "TSEM", "TSASA", "TSPIM", "TSPA", "TSRT"];
    if (!carrerasValidas.includes(carrera)) {
      return res.status(400).json({ msg: "La carrera seleccionada no es válida" });
    }

    // Instancia limpia mapeada
    const nuevoUsuario = new User({
      nombre: nombreLimpio,
      apellido: apellidoLimpio,
      email: emailLower,
      username: usernameLimpio,
      numero: numeroLimpio,
      carrera,
      rol: "pasante"
    });

    if (req.files?.imagen) {
      const { secure_url, public_id } = await cloudinary.uploader.upload(req.files.imagen.tempFilePath, { folder: 'Usuarios' });
      nuevoUsuario.avatarUsuario = secure_url;
      nuevoUsuario.avatarUsuarioID = public_id;
      await fs.unlink(req.files.imagen.tempFilePath);
    }

    nuevoUsuario.password = await nuevoUsuario.encryptPassword(passwordLimpio);
    const token = nuevoUsuario.crearToken();
    await sendMailToRegister(emailLower, token);
    await nuevoUsuario.save();

    return res.status(201).json({ msg: "Revisa tu correo electrónico para confirmar tu cuenta" });
  } catch (err) {
    const dupCode = err?.code || err?.errorResponse?.code;
    if (dupCode === 11000) {
      const key = err.keyValue ? Object.keys(err.keyValue)[0] : 'campo';
      return res.status(400).json({ msg: `El ${key} ya está registrado` });
    }
    return res.status(500).json({ msg: 'Ocurrió un error en el servidor' });
  }
};


const cambiarRolPasante = async (req, res) => {
  try {
    if (!req.userBDD || req.userBDD.rol !== "administrador") {
      return res.status(403).json({ msg: "Acceso denegado" });
    }
    const { id } = req.params;
    const usuario = await User.findById(id);
    if (!usuario) return res.status(404).json({ msg: "Usuario no encontrado" });
    if (usuario.rol === "pasante") return res.status(400).json({ msg: "El usuario ya es pasante" });

    usuario.rol = "pasante";
    await usuario.save();
    res.status(200).json({ msg: "Rol actualizado a pasante", usuario });
  } catch (error) {
    res.status(500).json({ msg: "Error al cambiar el rol" });
  }
};

const baneoPasante = async (req, res) => {
  try {
    if (!req.userBDD || req.userBDD.rol !== "administrador") return res.status(403).json({ msg: "Acceso denegado" });
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ msg: "ID no válido" });

    const pasanteBDD = await User.findOne({ _id: id, rol: "pasante" });
    if (!pasanteBDD) return res.status(404).json({ msg: "Pasante no encontrado" });
    if (pasanteBDD.status === false) return res.status(400).json({ msg: "Este Pasante ya se encuentra Baneado" });

    pasanteBDD.status = false;
    await pasanteBDD.save();
    res.status(200).json({ msg: `El Pasante ${pasanteBDD.username} ha sido baneado` });
  } catch (error) {
    res.status(500).json({ msg: "Error al banear pasante" });
  }
};

const listarPasantes = async (req, res) => {
  try {
    if (!req.userBDD || req.userBDD.rol !== "administrador") return res.status(403).json({ msg: "Acceso denegado" });
    const pasantes = await User.find({ rol: "pasante", status: true }).select("-createdAt -updatedAt -__v -password");
    res.status(200).json(pasantes);
  } catch (error) {
    res.status(500).json({ msg: "Error al listar pasantes" });
  }
};

const detallePasante = async (req, res) => {
  try {
    if (!req.userBDD || req.userBDD.rol !== "administrador") return res.status(403).json({ msg: "Acceso denegado" });
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(404).json({ msg: "ID inválido" });

    const pasante = await User.findOne({ _id: id, rol: "pasante" }).select("-createdAt -updatedAt -__v -password");
    if(!pasante) return res.status(404).json({ msg: "Pasante no encontrado" });
    res.status(200).json(pasante);
  } catch (error) {
    res.status(500).json({ msg: "Error al consultar detalles" });
  }
};

const baneoEstudiante = async (req, res) => {
  try {
    if (!req.userBDD || req.userBDD.rol !== "administrador") return res.status(403).json({ msg: "Acceso denegado" });
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ msg: "ID no válido" });

    const estudianteBDD = await User.findOne({ _id: id, rol: "estudiante" });
    if (!estudianteBDD) return res.status(404).json({ msg: "Estudiante no encontrado" });
    if (estudianteBDD.status === false) return res.status(400).json({ msg: "Este Estudiante ya se encuentra Baneado" });

    estudianteBDD.status = false;
    await estudianteBDD.save();
    res.status(200).json({ msg: `El Estudiante ${estudianteBDD.username} ha sido baneado` });
  } catch (error) {
    res.status(500).json({ msg: "Error al banear estudiante" });
  }
};

const listarEstudiantes = async (req, res) => {
  try {
    if (!req.userBDD || (req.userBDD.rol !== "administrador" && req.userBDD.rol !== "pasante")) {
      return res.status(403).json({ msg: "Acceso denegado" });
    }
    const { carrera } = req.query;
    const filtro = { rol: "estudiante", status: true };
    if (carrera && carrera !== "Todos") filtro.carrera = carrera;

    const estudiantes = await User.find(filtro)
      .select("nombre apellido username email numero carrera status _id")
      .sort({ carrera: 1, nombre: 1 });
    res.status(200).json(estudiantes);
  } catch (error) {
    res.status(500).json({ msg: "Error al listar estudiantes" });
  }
};

const detalleEstudiante = async (req, res) => {
  try {
    if (!req.userBDD || req.userBDD.rol !== "administrador") return res.status(403).json({ msg: "Acceso denegado" });
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(404).json({ msg: "ID inválido" });

    const estudiante = await User.findOne({ _id: id, rol: "estudiante" }).select("-createdAt -updatedAt -__v -password");
    if(!estudiante) return res.status(404).json({ msg: "Estudiante no encontrado" });
    res.status(200).json(estudiante);
  } catch (error) {
    res.status(500).json({ msg: "Error al consultar estudiante" });
  }
};

export {
  registro,
  confirmarEmail,
  login,
  perfil,
  recuperarPassword,
  comprobarTokenPassword,
  crearNuevaPassword,
  updatePerfil,
  updatePassword,
  updateAvatar,
  cambiarRolPasante,
  baneoPasante,
  listarPasantes,
  detallePasante,
  baneoEstudiante,
  listarEstudiantes,
  detalleEstudiante, 
  eliminarPerfil,
  registroPasante
};