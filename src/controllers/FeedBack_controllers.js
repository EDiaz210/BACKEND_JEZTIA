import Feedback from '../models/FeedBack.js';

// Función utilitaria para estandarizar la validación de texto corto
const validarTexto = (texto, nombreCampo) => {
  const limpio = texto ? texto.trim() : '';
  if (!limpio) return { error: `La ${nombreCampo} es obligatoria y no puede estar vacía.` };
  if (/\d/.test(limpio)) return { error: `La ${nombreCampo} no puede contener números.` };
  if (limpio.length > 100) return { error: `La ${nombreCampo} no puede superar los 100 caracteres. Enviaste: ${limpio.length}` };
  return { valor: limpio };
};

// Crear nuevo feedback (Solo Estudiante)
const createFeedback = async (req, res) => {
  try {
    if (!req.userBDD || req.userBDD.rol !== 'estudiante') {
      return res.status(403).json({ status: 'error', msg: 'Solo los estudiantes pueden crear feedbacks' });
    }

    const { description, category } = req.body;
    const validacion = validarTexto(description, 'descripción');
    if (validacion.error) return res.status(400).json({ status: 'error', msg: validacion.error });

    // Payload seguro: Evita inyección de campos no permitidos
    const feedback = await Feedback.create({
      category,
      description: validacion.valor,
      studentId: req.userBDD._id,
      studentName: req.userBDD.nombre
    });

    res.status(201).json({ status: 'success', msg: 'Feedback creado exitosamente', data: feedback });
  } catch (error) {
    res.status(500).json({ status: 'error', msg: error.message });
  }
};

// Obtener todos los feedbacks (Admin y Pasante)
const getAllFeedbacks = async (req, res) => {
  try {
    if (!req.userBDD || (req.userBDD.rol !== 'administrador' && req.userBDD.rol !== 'pasante')) {
      return res.status(403).json({ status: 'error', msg: 'No tienes permiso para ver todos los feedbacks' });
    }

    const feedbacks = await Feedback.find()
      .populate('studentId', 'nombre email')
      .sort({ createdAt: -1 });

    res.status(200).json({ status: 'success', results: feedbacks.length, data: feedbacks });
  } catch (error) {
    res.status(500).json({ status: 'error', msg: error.message });
  }
};

// Obtener feedbacks del estudiante logueado (Solo para Estudiante)
const getMyFeedbacks = async (req, res) => {
  try {
    if (!req.userBDD || req.userBDD.rol !== 'estudiante') {
      return res.status(403).json({ status: 'error', msg: 'Solo los estudiantes pueden ver sus propios feedbacks' });
    }

    const feedbacks = await Feedback.find({ studentId: req.userBDD._id }).sort({ createdAt: -1 });

    res.status(200).json({ status: 'success', results: feedbacks.length, data: feedbacks });
  } catch (error) {
    res.status(500).json({ status: 'error', msg: error.message });
  }
};

// Obtener feedback por ID (con permisos según rol)
const getFeedback = async (req, res) => {
  try {
    if (!req.userBDD) return res.status(401).json({ status: 'error', msg: 'No autenticado' });

    const feedback = await Feedback.findById(req.params.id).populate('studentId', 'nombre email');
    if (!feedback) return res.status(404).json({ status: 'error', msg: 'Feedback no encontrado' });

    if (req.userBDD.rol === 'estudiante') {
      const studentIdStr = feedback.studentId?._id?.toString() || feedback.studentId?.toString();
      if (studentIdStr !== req.userBDD._id.toString()) {
        return res.status(403).json({ status: 'error', msg: 'No tienes permiso para ver este feedback' });
      }
    }
    
    res.status(200).json({ status: 'success', data: feedback });
  } catch (error) {
    res.status(500).json({ status: 'error', msg: error.message });
  }
};

// Responder a un feedback (Solo Administrador)
const respondToFeedback = async (req, res) => {
  try {
    if (!req.userBDD || req.userBDD.rol !== 'administrador') {
      return res.status(403).json({ status: 'error', msg: 'Solo los administradores pueden responder a los feedbacks' });
    }
    
    const validacion = validarTexto(req.body.responseText, 'respuesta');
    if (validacion.error) return res.status(400).json({ status: 'error', msg: validacion.error });

    const feedback = await Feedback.findByIdAndUpdate(
      req.params.id,
      {
        $set: {
          'response.text': validacion.valor,
          'response.respondedBy': req.userBDD.nombre,
          'response.responseDate': new Date(),
          status: 'Respondido'
        }
      },
      { new: true, runValidators: true }
    ).populate('studentId', 'nombre email');

    if (!feedback) return res.status(404).json({ status: 'error', msg: 'Feedback no encontrado' });

    res.status(200).json({ status: 'success', msg: 'Se ha respondido el feedback', data: feedback });
  } catch (error) {
    res.status(500).json({ status: 'error', msg: error.message });
  }
};

// Actualizar estado (Solo Administrador)
const updateFeedbackStatus = async (req, res) => {
  try {
    if (!req.userBDD || req.userBDD.rol !== 'administrador') {
      return res.status(403).json({ status: 'error', msg: 'Solo los administradores pueden cambiar el estado' });
    }

    const { status } = req.body;
    if (!['Pendiente', 'Respondido'].includes(status)) {
      return res.status(400).json({ status: 'error', msg: 'Estado no válido. Solo se permiten: Pendiente, Respondido' });
    }

    const feedback = await Feedback.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    ).populate('studentId', 'nombre email');

    if (!feedback) return res.status(404).json({ status: 'error', msg: 'Feedback no encontrado' });

    res.status(200).json({ status: 'success', msg: 'Estado actualizado', data: feedback });
  } catch (error) {
    res.status(500).json({ status: 'error', msg: error.message });
  }
};

// Eliminar feedback (Solo Administrador)
const deleteFeedback = async (req, res) => {
  try {
    if (!req.userBDD || req.userBDD.rol !== 'administrador') {
      return res.status(403).json({ status: 'error', msg: 'Solo los administradores pueden eliminar feedbacks' });
    }

    const feedback = await Feedback.findByIdAndDelete(req.params.id);
    if (!feedback) return res.status(404).json({ status: 'error', msg: 'Feedback no encontrado' });

    res.status(200).json({ status: 'success', msg: 'Feedback eliminado con éxito' });
  } catch (error) {
    res.status(500).json({ status: 'error', msg: error.message });
  }
};

// Filtrar feedbacks por categoría (Quejas o Sugerencias)
const getFeedbacksByCategory = async (req, res) => {
  try {
    if (!req.userBDD) return res.status(401).json({ status: 'error', msg: 'No tienes autorización' });

    const { category } = req.query;
    if (category && !['Queja', 'Sugerencia'].includes(category)) {
      return res.status(400).json({ status: 'error', msg: 'Categoría no válida. Solo se permiten: Queja, Sugerencia' });
    }

    let filter = {};
    if (category) filter.category = category;

    if (req.userBDD.rol === 'estudiante') {
      filter.studentId = req.userBDD._id;
    } else if (req.userBDD.rol !== 'administrador' && req.userBDD.rol !== 'pasante') {
      return res.status(403).json({ status: 'error', msg: 'Rol no autorizado para esta acción' });
    }

    const feedbacks = await Feedback.find(filter).populate('studentId', 'nombre email').sort({ createdAt: -1 });

    res.status(200).json({ status: 'success', results: feedbacks.length, data: feedbacks });
  } catch (error) {
    res.status(500).json({ status: 'error', msg: error.message });
  }
};

export {
  createFeedback,
  getAllFeedbacks,
  getMyFeedbacks,
  getFeedback,
  respondToFeedback,
  updateFeedbackStatus,
  deleteFeedback,
  getFeedbacksByCategory
};