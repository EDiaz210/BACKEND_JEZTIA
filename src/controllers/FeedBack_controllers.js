import Feedback from '../models/FeedBack.js';

// Crear nuevo feedback (Solo Estudiante)
const createFeedback = async (req, res) => {
  try {
    if (!req.userBDD || req.userBDD.rol !== 'estudiante') {
      return res.status(403).json({
        status: 'error',
        message: 'Solo los estudiantes pueden crear feedbacks'
      });
    }

    const { description } = req.body;

    if (!description || description.trim() === '') {
      return res.status(400).json({
        status: 'error',
        message: 'La descripción es obligatoria y no puede estar vacía.'
      });
    }

    if (/\d/.test(description)) {
      return res.status(400).json({
        status: 'error',
        message: 'La descripción no puede contener números.'
      });
    }

    if (description.trim().length > 100) {
      return res.status(400).json({
        status: 'error',
        message: `La descripción no puede superar los 100 caracteres. Enviaste: ${description.trim().length}`
      });
    }

    const feedbackData = {
      ...req.body,
      description: description.trim(),
      studentId: req.userBDD._id,
      studentName: req.userBDD.nombre
    };
    
    const feedback = await Feedback.create(feedbackData);
    // Cambiado a 201 (Created)
    res.status(201).json({ msg: 'Feedback creado exitosamente', feedback });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Obtener todos los feedbacks (Admin y Pasante)
const getAllFeedbacks = async (req, res) => {
  try {
    if (!req.userBDD || (req.userBDD.rol !== 'administrador' && req.userBDD.rol !== 'pasante')) {
      return res.status(403).json({
        message: 'No tienes permiso para ver todos los feedbacks'
      });
    }
    const feedbacks = await Feedback.find()
      .populate('studentId', 'nombre email')
      .sort({ createdAt: -1 });
    res.status(200).json({
      results: feedbacks.length,
      data: { "Feedbacks Encontrados": feedbacks }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Obtener feedbacks del estudiante logueado (Solo para Estudiante)
const getMyFeedbacks = async (req, res) => {
  try {
    if (!req.userBDD || req.userBDD.rol !== 'estudiante') {
      return res.status(403).json({
        message: 'Solo los estudiantes pueden ver sus propios feedbacks'
      });
    }
    const feedbacks = await Feedback.find({ studentId: req.userBDD._id})
      .sort({ createdAt: -1 });
    res.status(200).json({
      results: feedbacks.length,
      data: { "Feedbacks Propios Encontrados": feedbacks }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Obtener feedback por ID (con permisos según rol)
const getFeedback = async (req, res) => {
  try {
    if (!req.userBDD) {
      return res.status(401).json({ message: 'No autenticado' });
    }

    const feedback = await Feedback.findById(req.params.id)
      .populate('studentId', 'nombre email');

    if (!feedback) {
      return res.status(404).json({ message: 'Feedback no encontrado' });
    }

    // Solución al Bug de verificación de permisos
    if (req.userBDD.rol === 'estudiante') {
      const studentIdStr = feedback.studentId?._id?.toString() || feedback.studentId?.toString();
      
      if (studentIdStr !== req.userBDD._id.toString()) {
        return res.status(403).json({
          message: 'No tienes permiso para ver este feedback'
        });
      }
    }
    
    // Admin y Pasante pueden ver cualquier feedback sin restricción
    res.status(200).json({
      data: { "Feedback encontrado con éxito": feedback }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Responder a un feedback (Solo Administrador)
const respondToFeedback = async (req, res) => {
  try {
    if (!req.userBDD || req.userBDD.rol !== 'administrador') {
      return res.status(403).json({
        message: 'Solo los administradores pueden responder a los feedbacks'
      });
    }
    
    const responseTextLimpia = req.body.responseText ? req.body.responseText.trim() : '';

    if (!responseTextLimpia) {
      return res.status(400).json({
        status: 'error',
        message: 'La respuesta es obligatoria y no puede estar vacía.'
      });
    }

    if (/\d/.test(responseTextLimpia)) {
      return res.status(400).json({
        status: 'error',
        message: 'La respuesta no puede contener números.'
      });
    }

    if (responseTextLimpia.length > 100) {
      return res.status(400).json({
        status: 'error',
        message: `La respuesta no puede superar los 100 caracteres. Enviaste: ${responseTextLimpia.length}`
      });
    }

    const feedback = await Feedback.findByIdAndUpdate(
      req.params.id,
      {
        $set: {
          'response.text': responseTextLimpia,
          'response.respondedBy': req.userBDD.nombre,
          'response.responseDate': new Date(),
          status: 'Respondido'
        }
      },
      { new: true, runValidators: true }
    ).populate('studentId', 'nombre email');

    if (!feedback) {
      return res.status(404).json({ message: 'Feedback no encontrado' });
    }

    res.status(200).json({
      data: { "Se ha respondido el feedback": feedback }
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: error.message
    });
  }
};

// Actualizar estado (Solo Administrador)
const updateFeedbackStatus = async (req, res) => {
  try {
    if (!req.userBDD || req.userBDD.rol !== 'administrador') {
      return res.status(403).json({
        message: 'Solo los administradores pueden cambiar el estado'
      });
    }
    const { status } = req.body;
    if (!['Pendiente', 'Respondido'].includes(status)) {
      return res.status(400).json({
        message: 'Estado no válido. Solo se permiten: Pendiente, Respondido'
      });
    }
    const feedback = await Feedback.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    ).populate('studentId', 'nombre email');

    if (!feedback) {
      return res.status(404).json({ message: 'Feedback no encontrado' });
    }

    res.status(200).json({
      data: { "Se ha cambiado con éxito el estado del Feedback": feedback }
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Eliminar feedback (Solo Administrador)
const deleteFeedback = async (req, res) => {
  try {
    if (!req.userBDD || req.userBDD.rol !== 'administrador') {
      return res.status(403).json({
        message: 'Solo los administradores pueden eliminar feedbacks'
      });
    }
    const feedback = await Feedback.findByIdAndDelete(req.params.id);
    if (!feedback) {
      return res.status(404).json({ message: 'Feedback no encontrado' });
    }
    res.status(200).json({ message: 'Feedback eliminado con éxito' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Filtrar feedbacks por categoría (Quejas o Sugerencias)
const getFeedbacksByCategory = async (req, res) => {
  try {
    if (!req.userBDD) {
      return res.status(401).json({ message: 'No tienes autorización' });
    }

    const { category } = req.query;
    if (category && !['Queja', 'Sugerencia'].includes(category)) {
      return res.status(400).json({
        status: 'error',
        message: 'Categoría no válida. Solo se permiten: Queja, Sugerencia'
      });
    }

    let filter = {};
    if (category) {
      filter.category = category;
    }

    // Control estricto de roles para la consulta filtrada
    if (req.userBDD.rol === 'estudiante') {
      filter.studentId = req.userBDD._id;
    } else if (req.userBDD.rol !== 'administrador' && req.userBDD.rol !== 'pasante') {
      return res.status(403).json({ message: 'Rol no autorizado para esta acción' });
    }

    const feedbacks = await Feedback.find(filter)
      .populate('studentId', 'nombre email')
      .sort({ createdAt: -1 });

    res.status(200).json({
      data: {
        message: `Estos son los Feedbacks de la categoria ${category || 'todas'}`,
        feedbacks: feedbacks
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
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
