// server.js - Backend completo actualizado con mejoras
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const nodemailer = require('nodemailer');
const PDFDocument = require('pdfkit');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 1000;

app.use(cors());
app.use(express.json());

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

// ==================== FUNCIONES AUXILIARES ====================

function generarCodigo() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let codigo = '';
  for (let i = 0; i < 4; i++) {
    codigo += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return codigo;
}

function validarHora(hora) {
  const [h, m] = hora.split(':').map(Number);
  const minutos = h * 60 + m;
  const min1840 = 18 * 60 + 40;
  const min2200 = 22 * 60;
  return minutos >= min1840 && minutos <= min2200;
}

async function esProfesor(email) {
  const result = await pool.query(
    'SELECT id, nombre FROM profesores_reservas WHERE LOWER(email) = LOWER($1)',
    [email]
  );
  return result.rows.length > 0 ? result.rows[0] : null;
}

async function contarCupos(fecha) {
  const result = await pool.query(
    'SELECT COUNT(*) as total FROM inscripciones WHERE fecha = $1',
    [fecha]
  );
  return parseInt(result.rows[0].total);
}

async function contarInscripcionesPorEmail(email, fecha) {
  const result = await pool.query(
    'SELECT COUNT(*) as total FROM inscripciones WHERE LOWER(email) = LOWER($1) AND fecha = $2',
    [email, fecha]
  );
  return parseInt(result.rows[0].total);
}

async function fechaBloqueada(fecha) {
  const result = await pool.query(
    'SELECT id, motivo FROM fechas_bloqueadas WHERE fecha = $1',
    [fecha]
  );
  return result.rows.length > 0 ? result.rows[0] : null;
}

async function enviarEmailAlumno(datos, codigo) {
  try {
    await transporter.sendMail({
      from: process.env.SMTP_USER,
      to: datos.email,
      subject: '✅ Tu Inscripción al Laboratorio está Confirmada',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f7fa; margin: 0; padding: 20px; }
            .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center; }
            .header h1 { color: white; margin: 0; font-size: 28px; font-weight: bold; }
            .header p { color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px; }
            .content { padding: 40px 30px; }
            .success-icon { width: 80px; height: 80px; background: #10b981; border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center; font-size: 40px; }
            .greeting { text-align: center; color: #1f2937; font-size: 18px; margin-bottom: 10px; }
            .greeting strong { color: #667eea; font-size: 20px; }
            .message { text-align: center; color: #6b7280; font-size: 15px; line-height: 1.6; margin-bottom: 30px; }
            .code-section { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 12px; text-align: center; margin: 30px 0; }
            .code-label { color: rgba(255,255,255,0.95); font-size: 14px; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 15px; font-weight: 600; }
            .code-box { background: white; padding: 25px; border-radius: 8px; margin: 15px 0; }
            .code { color: #667eea; font-size: 56px; font-weight: bold; letter-spacing: 12px; font-family: 'Courier New', monospace; margin: 0; line-height: 1; }
            .code-warning { color: rgba(255,255,255,0.95); font-size: 14px; margin-top: 15px; display: flex; align-items: center; justify-content: center; gap: 8px; }
            .code-warning-icon { font-size: 20px; }
            .details-section { background: #f9fafb; padding: 25px; border-radius: 12px; margin: 25px 0; }
            .details-title { color: #1f2937; font-size: 16px; font-weight: 600; margin-bottom: 15px; text-align: center; }
            .detail-row { display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #e5e7eb; }
            .detail-row:last-child { border-bottom: none; }
            .detail-label { color: #6b7280; font-size: 14px; font-weight: 500; }
            .detail-value { color: #1f2937; font-size: 14px; font-weight: 600; }
            .instructions { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 20px; border-radius: 8px; margin-top: 25px; }
            .instructions-title { color: #92400e; font-size: 15px; font-weight: 600; margin-bottom: 10px; display: flex; align-items: center; gap: 8px; }
            .instructions-text { color: #92400e; font-size: 14px; line-height: 1.6; margin: 0; }
            .instructions ul { margin: 10px 0; padding-left: 20px; }
            .instructions li { margin: 5px 0; }
            .footer { background: #f9fafb; padding: 25px; text-align: center; }
            .footer p { margin: 5px 0; color: #6b7280; font-size: 13px; }
            .divider { height: 1px; background: #e5e7eb; margin: 25px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>✅ Inscripción Confirmada</h1>
              <p>Tu lugar está reservado</p>
            </div>
            
            <div class="content">
              <div class="success-icon">✓</div>
              
              <p class="greeting">¡Hola <strong>${datos.nombre}</strong>!</p>
              <p class="message">
                Tu inscripción al laboratorio ha sido <strong>confirmada exitosamente</strong>.<br>
                Hemos reservado tu lugar para la fecha y hora que seleccionaste.
              </p>

              <div class="code-section">
                <div class="code-label">Tu Código de Inscripción</div>
                <div class="code-box">
                  <div class="code">${codigo}</div>
                </div>
                <div class="code-warning">
                  <span class="code-warning-icon">⚠️</span>
                  <span><strong>Importante:</strong> Guarda este código para cancelar si es necesario</span>
                </div>
              </div>

              <div class="details-section">
                <div class="details-title">📋 Detalles de tu Reserva</div>
                <div class="detail-row">
                  <span class="detail-label">📅 Fecha</span>
                  <span class="detail-value">${new Date(datos.fecha).toLocaleDateString('es-AR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">🕐 Hora</span>
                  <span class="detail-value">${datos.hora} hs</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">👤 Nombre Completo</span>
                  <span class="detail-value">${datos.nombre} ${datos.apellido}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">📚 Año</span>
                  <span class="detail-value">${datos.anio}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">📧 Email</span>
                  <span class="detail-value">${datos.email}</span>
                </div>
              </div>

              <div class="instructions">
                <div class="instructions-title">
                  <span>💡</span>
                  <span>Instrucciones Importantes</span>
                </div>
                <div class="instructions-text">
                  <ul>
                    <li><strong>Llega puntual:</strong> Preséntate en el laboratorio a la hora indicada</li>
                    <li><strong>Guarda tu código:</strong> El código <strong>${codigo}</strong> es necesario para cancelar tu inscripción</li>
                    <li><strong>Para cancelar:</strong> Ingresa tu código en la sección "Cancelar Inscripción" del sistema</li>
                    <li><strong>Consultas:</strong> Si tienes dudas, contacta al administrador del laboratorio</li>
                  </ul>
                </div>
              </div>

              <div class="divider"></div>

              <p style="text-align: center; color: #6b7280; font-size: 14px; margin: 20px 0;">
                ¡Te esperamos en el laboratorio! 🔬
              </p>
            </div>
            
            <div class="footer">
              <p style="font-weight: 600; color: #4b5563;">Sistema de Gestión de Inscripciones</p>
              <p>Laboratorio Académico</p>
              <p style="margin-top: 15px; font-size: 12px;">© ${new Date().getFullYear()} - Este es un correo automático, no responder</p>
            </div>
          </div>
        </body>
        </html>
      `
    });
  } catch (err) {
    console.error('Error enviando email al alumno:', err);
  }
}

async function crearNotificacion(tipo, datos, esProfesor = false) {
  try {
    await pool.query(
      `INSERT INTO notificaciones (tipo, nombre, apellido, email, fecha, hora, es_profesor)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [tipo, datos.nombre, datos.apellido, datos.email, datos.fecha, datos.hora, esProfesor]
    );
  } catch (err) {
    console.error('Error creando notificación:', err);
  }
}

// ==================== INICIALIZACIÓN DE BD ====================

async function initDB() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    await client.query(`
      CREATE TABLE IF NOT EXISTS inscripciones (
        id SERIAL PRIMARY KEY,
        nombre VARCHAR(100) NOT NULL,
        apellido VARCHAR(100) NOT NULL,
        email VARCHAR(255) NOT NULL,
        anio VARCHAR(50) NOT NULL,
        fecha DATE NOT NULL,
        hora TIME NOT NULL,
        codigo_inscripcion VARCHAR(4) UNIQUE NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS configuracion_admin (
        id SERIAL PRIMARY KEY,
        codigo_acceso VARCHAR(4) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Usar código de admin desde variable de entorno o default '1234'
    const codigoAdmin = process.env.ADMIN_PASSWORD || '1234';
    const adminExists = await client.query('SELECT id FROM configuracion_admin LIMIT 1');
    if (adminExists.rows.length === 0) {
      await client.query('INSERT INTO configuracion_admin (codigo_acceso) VALUES ($1)', [codigoAdmin]);
      console.log(`Código de admin configurado: ${codigoAdmin}`);
    } else {
      // Actualizar el código si cambió en el .env
      await client.query('UPDATE configuracion_admin SET codigo_acceso = $1 WHERE id = 1', [codigoAdmin]);
      console.log(`Código de admin actualizado desde .env: ${codigoAdmin}`);
    }

    await client.query(`
      CREATE TABLE IF NOT EXISTS profesores_reservas (
        id SERIAL PRIMARY KEY,
        nombre VARCHAR(200) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS fechas_bloqueadas (
        id SERIAL PRIMARY KEY,
        fecha DATE UNIQUE NOT NULL,
        motivo VARCHAR(500) DEFAULT 'Fecha no disponible',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS notificaciones (
        id SERIAL PRIMARY KEY,
        tipo VARCHAR(20) NOT NULL,
        nombre VARCHAR(100) NOT NULL,
        apellido VARCHAR(100) NOT NULL,
        email VARCHAR(255) NOT NULL,
        fecha DATE NOT NULL,
        hora TIME NOT NULL,
        es_profesor BOOLEAN DEFAULT FALSE,
        leida BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await client.query('COMMIT');
    console.log('Base de datos inicializada correctamente');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error inicializando BD:', err);
    throw err;
  } finally {
    client.release();
  }
}

// ==================== RUTAS PÚBLICAS ====================

app.get('/api/inscripciones/fechas-disponibles', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT DISTINCT i.fecha, COUNT(*) as cupos_usados
      FROM inscripciones i
      WHERE i.fecha >= CURRENT_DATE
      GROUP BY i.fecha
      HAVING COUNT(*) < 8
      
      UNION
      
      SELECT CURRENT_DATE + INTERVAL '1 day' * generate_series(0, 30) as fecha, 0 as cupos_usados
      WHERE NOT EXISTS (
        SELECT 1 FROM fechas_bloqueadas fb 
        WHERE fb.fecha = CURRENT_DATE + INTERVAL '1 day' * generate_series(0, 30)
      )
      ORDER BY fecha
    `);
    
    res.json({ fechas: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener fechas' });
  }
});

app.post('/api/inscripciones', async (req, res) => {
  const { nombre, apellido, email, anio, fecha, hora } = req.body;

  try {
    if (!validarHora(hora)) {
      return res.status(400).json({ error: 'La hora debe estar entre 18:40 y 22:00' });
    }

    const fechaBlock = await fechaBloqueada(fecha);
    if (fechaBlock) {
      return res.status(400).json({ error: `Esta fecha está bloqueada: ${fechaBlock.motivo}` });
    }

    const cuposActuales = await contarCupos(fecha);
    const profesor = await esProfesor(email);

    // Si es profesor, reserva todos los cupos
    if (profesor) {
      if (cuposActuales > 0) {
        return res.status(400).json({ error: 'Ya hay inscripciones para esta fecha' });
      }
      const codigo = generarCodigo();
      for (let i = 0; i < 8; i++) {
        const codigoTemp = i === 0 ? codigo : generarCodigo();
        await pool.query(
          `INSERT INTO inscripciones (nombre, apellido, email, anio, fecha, hora, codigo_inscripcion)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [profesor.nombre, apellido, email, anio, fecha, hora, codigoTemp]
        );
      }
      await enviarEmailAlumno({ nombre: profesor.nombre, apellido, email, anio, fecha, hora }, codigo);
      await crearNotificacion('nueva', { nombre: profesor.nombre, apellido, email, fecha, hora }, true);
      return res.json({ message: 'Reserva completa realizada', codigo });
    }

    // Validar: un alumno solo puede inscribirse 1 vez por día
    const inscripcionesExistentes = await contarInscripcionesPorEmail(email, fecha);
    if (inscripcionesExistentes > 0) {
      return res.status(400).json({ error: 'Ya tienes una inscripción para esta fecha' });
    }

    // Inscripción normal
    if (cuposActuales >= 8) {
      return res.status(400).json({ error: 'No hay cupos disponibles para esta fecha' });
    }

    const codigo = generarCodigo();
    await pool.query(
      `INSERT INTO inscripciones (nombre, apellido, email, anio, fecha, hora, codigo_inscripcion)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [nombre, apellido, email, anio, fecha, hora, codigo]
    );

    await enviarEmailAlumno({ nombre, apellido, email, anio, fecha, hora }, codigo);
    await crearNotificacion('nueva', { nombre, apellido, email, fecha, hora });

    res.json({ message: 'Inscripción exitosa', codigo });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al procesar la inscripción' });
  }
});

app.delete('/api/inscripciones/:codigo', async (req, res) => {
  const { codigo } = req.params;

  try {
    // Primero buscar la inscripción con ese código
    const inscripcion = await pool.query(
      'SELECT * FROM inscripciones WHERE codigo_inscripcion = $1',
      [codigo]
    );

    if (inscripcion.rows.length === 0) {
      return res.status(404).json({ error: 'Código de inscripción inválido' });
    }

    const datos = inscripcion.rows[0];
    
    // Verificar si es un profesor
    const profesor = await esProfesor(datos.email);
    
    if (profesor) {
      // Si es profesor, eliminar todas sus inscripciones de esa fecha
      const result = await pool.query(
        'DELETE FROM inscripciones WHERE LOWER(email) = LOWER($1) AND fecha = $2 RETURNING *',
        [datos.email, datos.fecha]
      );

      await crearNotificacion('baja', {
        nombre: datos.nombre,
        apellido: datos.apellido,
        email: datos.email,
        fecha: datos.fecha,
        hora: datos.hora
      }, profesor !== null);

      return res.json({ 
        message: 'Inscripciones canceladas exitosamente',
        eliminadas: result.rows.length
      });
    } else {
      // Si es alumno regular, solo eliminar su inscripción
      await pool.query(
        'DELETE FROM inscripciones WHERE codigo_inscripcion = $1',
        [codigo]
      );

      await crearNotificacion('baja', {
        nombre: datos.nombre,
        apellido: datos.apellido,
        email: datos.email,
        fecha: datos.fecha,
        hora: datos.hora
      });

      return res.json({ 
        message: 'Inscripción cancelada exitosamente',
        eliminadas: 1
      });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al cancelar inscripción' });
  }
});

// ==================== RUTAS ADMIN ====================

app.post('/api/admin/login', async (req, res) => {
  const { codigo } = req.body;

  try {
    const result = await pool.query(
      'SELECT id FROM configuracion_admin WHERE codigo_acceso = $1',
      [codigo]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Código incorrecto' });
    }

    res.json({ message: 'Acceso concedido' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error en el login' });
  }
});

app.get('/api/admin/verificar-profesor', async (req, res) => {
  const { email } = req.query;
  try {
    const profesor = await esProfesor(email);
    res.json({ esProfesor: profesor !== null });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al verificar profesor' });
  }
});

app.get('/api/admin/notificaciones', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM notificaciones ORDER BY created_at DESC LIMIT 100'
    );
    res.json({ notificaciones: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener notificaciones' });
  }
});

app.patch('/api/admin/notificaciones/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('UPDATE notificaciones SET leida = TRUE WHERE id = $1', [id]);
    res.json({ message: 'Notificación marcada como leída' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al actualizar notificación' });
  }
});

app.patch('/api/admin/notificaciones/marcar-todas', async (req, res) => {
  try {
    await pool.query('UPDATE notificaciones SET leida = TRUE WHERE leida = FALSE');
    res.json({ message: 'Todas las notificaciones marcadas como leídas' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al actualizar notificaciones' });
  }
});

app.get('/api/admin/inscripciones', async (req, res) => {
  const { fecha } = req.query;

  try {
    const result = await pool.query(
      `SELECT id, nombre, apellido, email, anio, fecha, hora, codigo_inscripcion as codigo
       FROM inscripciones
       WHERE fecha = $1
       ORDER BY hora ASC`,
      [fecha]
    );

    const cuposUsados = result.rows.length;

    res.json({
      inscripciones: result.rows,
      cupos: { usados: cuposUsados, total: 8 }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener inscripciones' });
  }
});

app.post('/api/admin/inscripciones', async (req, res) => {
  const { nombre, apellido, email, anio, fecha, hora } = req.body;

  try {
    if (!validarHora(hora)) {
      return res.status(400).json({ error: 'La hora debe estar entre 18:40 y 22:00' });
    }

    const cuposActuales = await contarCupos(fecha);
    const profesor = await esProfesor(email);

    if (profesor) {
      if (cuposActuales > 0) {
        return res.status(400).json({ error: 'Ya hay inscripciones para esta fecha' });
      }
      const codigo = generarCodigo();
      for (let i = 0; i < 8; i++) {
        const codigoTemp = i === 0 ? codigo : generarCodigo();
        await pool.query(
          `INSERT INTO inscripciones (nombre, apellido, email, anio, fecha, hora, codigo_inscripcion)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [profesor.nombre, apellido, email, anio, fecha, hora, codigoTemp]
        );
      }
      await enviarEmailAlumno({ nombre: profesor.nombre, apellido, email, anio, fecha, hora }, codigo);
      await crearNotificacion('nueva', { nombre: profesor.nombre, apellido, email, fecha, hora }, true);
      return res.json({ message: 'Reserva completa realizada', codigo });
    }

    const inscripcionesExistentes = await contarInscripcionesPorEmail(email, fecha);
    if (inscripcionesExistentes > 0) {
      return res.status(400).json({ error: 'Este email ya tiene una inscripción para esta fecha' });
    }

    if (cuposActuales >= 8) {
      return res.status(400).json({ error: 'No hay cupos disponibles' });
    }

    const codigo = generarCodigo();
    await pool.query(
      `INSERT INTO inscripciones (nombre, apellido, email, anio, fecha, hora, codigo_inscripcion)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [nombre, apellido, email, anio, fecha, hora, codigo]
    );

    await enviarEmailAlumno({ nombre, apellido, email, anio, fecha, hora }, codigo);
    await crearNotificacion('nueva', { nombre, apellido, email, fecha, hora });

    res.json({ message: 'Inscripción registrada', codigo });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al registrar inscripción' });
  }
});

app.get('/api/admin/verificar-profesor', async (req, res) => {
  const { email } = req.query;
  try {
    const profesor = await esProfesor(email);
    res.json({ esProfesor: profesor !== null });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al verificar profesor' });
  }
});

app.delete('/api/admin/inscripciones/profesor', async (req, res) => {
  const { email, fecha } = req.query;

  try {
    // Verificar si es profesor antes de eliminar
    const esProf = await esProfesor(email);
    
    const result = await pool.query(
      'DELETE FROM inscripciones WHERE LOWER(email) = LOWER($1) AND fecha = $2 RETURNING *',
      [email, fecha]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'No se encontraron inscripciones' });
    }

    const datos = result.rows[0];
    await crearNotificacion('baja', {
      nombre: datos.nombre,
      apellido: datos.apellido,
      email: datos.email,
      fecha: datos.fecha,
      hora: datos.hora
    }, esProf !== null);

    res.json({ 
      message: `Se eliminaron ${result.rows.length} inscripciones del profesor`,
      eliminadas: result.rows.length
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al eliminar inscripciones del profesor' });
  }
});

app.delete('/api/admin/inscripciones/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      'DELETE FROM inscripciones WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Inscripción no encontrada' });
    }

    const datos = result.rows[0];

    await crearNotificacion('baja', {
      nombre: datos.nombre,
      apellido: datos.apellido,
      email: datos.email,
      fecha: datos.fecha,
      hora: datos.hora
    }, await esProfesor(datos.email) !== null);

    res.json({ message: 'Inscripción eliminada' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al eliminar inscripción' });
  }
});

app.get('/api/admin/reporte-pdf', async (req, res) => {
  const { fecha } = req.query;

  try {
    const result = await pool.query(
      `SELECT nombre, apellido, email, anio, fecha, hora, codigo_inscripcion
       FROM inscripciones
       WHERE fecha = $1
       ORDER BY hora ASC`,
      [fecha]
    );

    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=inscripciones_${fecha}.pdf`);

    doc.pipe(res);

    // Header moderno
    doc.rect(0, 0, doc.page.width, 100).fill('#667eea');
    doc.fillColor('white')
       .fontSize(28)
       .font('Helvetica-Bold')
       .text('Reporte de Inscripciones', 50, 30);
    doc.fontSize(14)
       .font('Helvetica')
       .text(`Fecha: ${fecha}`, 50, 65);

    doc.moveDown(3);

    // Información general
    doc.fillColor('#4b5563')
       .fontSize(12)
       .text(`Total de inscripciones: ${result.rows.length}/8`, 50, 120);
    doc.text(`Generado: ${new Date().toLocaleString('es-AR')}`, 50, 140);

    doc.moveDown(2);

    // Línea separadora
    doc.strokeColor('#e5e7eb').lineWidth(1).moveTo(50, 180).lineTo(545, 180).stroke();

    let yPos = 200;

    result.rows.forEach((insc, idx) => {
      if (yPos > 700) {
        doc.addPage();
        yPos = 50;
      }

      // Card para cada inscripción
      doc.roundedRect(50, yPos, 495, 90, 5).fillAndStroke('#f9fafb', '#e5e7eb');
      
      doc.fillColor('#1f2937')
         .fontSize(14)
         .font('Helvetica-Bold')
         .text(`${idx + 1}. ${insc.nombre} ${insc.apellido}`, 65, yPos + 15);
      
      doc.fillColor('#6b7280')
         .fontSize(10)
         .font('Helvetica')
         .text(`Email: ${insc.email}`, 65, yPos + 35);
      
      doc.text(`Año: ${insc.anio}`, 65, yPos + 50);
      doc.text(`Hora: ${insc.hora}`, 65, yPos + 65);
      
      doc.fillColor('#667eea')
         .fontSize(12)
         .font('Helvetica-Bold')
         .text(`Código: ${insc.codigo_inscripcion}`, 400, yPos + 35);

      yPos += 105;
    });

    // Footer
    const footerY = doc.page.height - 50;
    doc.fontSize(10)
       .fillColor('#9ca3af')
       .text('Sistema de Gestión de Inscripciones | Laboratorio', 50, footerY, { align: 'center' });

    doc.end();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al generar PDF' });
  }
});

app.get('/api/admin/fechas-bloqueadas', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM fechas_bloqueadas ORDER BY fecha ASC');
    res.json({ fechas: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener fechas bloqueadas' });
  }
});

app.post('/api/admin/fechas-bloqueadas', async (req, res) => {
  const { fecha, motivo } = req.body;

  try {
    await pool.query(
      'INSERT INTO fechas_bloqueadas (fecha, motivo) VALUES ($1, $2)',
      [fecha, motivo || 'Fecha no disponible']
    );
    res.json({ message: 'Fecha bloqueada' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al bloquear fecha' });
  }
});

app.delete('/api/admin/fechas-bloqueadas/:fecha', async (req, res) => {
  const { fecha } = req.params;

  try {
    await pool.query('DELETE FROM fechas_bloqueadas WHERE fecha = $1', [fecha]);
    res.json({ message: 'Fecha desbloqueada' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al desbloquear fecha' });
  }
});

app.get('/api/admin/profesores', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM profesores_reservas ORDER BY nombre ASC');
    res.json({ profesores: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener profesores' });
  }
});

app.post('/api/admin/profesores', async (req, res) => {
  const { nombre, email } = req.body;

  try {
    await pool.query(
      'INSERT INTO profesores_reservas (nombre, email) VALUES ($1, $2)',
      [nombre, email]
    );
    res.json({ message: 'Profesor agregado' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al agregar profesor' });
  }
});

app.delete('/api/admin/profesores/:id', async (req, res) => {
  const { id } = req.params;

  try {
    await pool.query('DELETE FROM profesores_reservas WHERE id = $1', [id]);
    res.json({ message: 'Profesor eliminado' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al eliminar profesor' });
  }
});

// ==================== INICIO DEL SERVIDOR ====================

initDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Servidor corriendo en puerto ${PORT}`);
  });
}).catch(err => {
  console.error('Error fatal al iniciar:', err);
  process.exit(1);
});
