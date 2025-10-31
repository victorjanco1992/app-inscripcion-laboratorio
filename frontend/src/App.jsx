import React, { useState, useEffect } from 'react';
import { LogIn, LogOut, FileText, Lock, Unlock, UserPlus, Trash2, AlertCircle, CheckCircle, X, Plus, Download, Bell, User } from 'lucide-react';

//const API_URL = 'http://localhost:3000/api';
const API_URL = import.meta.env.VITE_API_URL

export default function LabInscriptionsApp() {
  const [view, setView] = useState('home');
  const [isAdmin, setIsAdmin] = useState(false);
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {!isAdmin ? (
        <PublicView view={view} setView={setView} setIsAdmin={setIsAdmin} />
      ) : (
        <AdminPanel setIsAdmin={setIsAdmin} />
      )}
    </div>
  );
}

function PublicView({ view, setView, setIsAdmin }) {
  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <header className="text-center mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-indigo-900 mb-2">
          Inscripciones a Laboratorio
        </h1>
        <p className="text-gray-600">Sistema de gestión de cupos</p>
      </header>

      {view === 'home' && <HomeMenu setView={setView} setIsAdmin={setIsAdmin} />}
      {view === 'register' && <RegisterForm setView={setView} />}
      {view === 'cancel' && <CancelForm setView={setView} />}
    </div>
  );
}

function HomeMenu({ setView, setIsAdmin }) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <button
        onClick={() => setView('register')}
        className="bg-white p-8 rounded-xl shadow-lg hover:shadow-xl transition-shadow border-2 border-indigo-200 hover:border-indigo-400"
      >
        <UserPlus className="w-12 h-12 text-indigo-600 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-gray-800 mb-2">Nueva Inscripción</h2>
        <p className="text-gray-600 text-sm">Registrarse para usar el laboratorio</p>
      </button>

      <button
        onClick={() => setView('cancel')}
        className="bg-white p-8 rounded-xl shadow-lg hover:shadow-xl transition-shadow border-2 border-red-200 hover:border-red-400"
      >
        <X className="w-12 h-12 text-red-600 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-gray-800 mb-2">Cancelar Inscripción</h2>
        <p className="text-gray-600 text-sm">Dar de baja con tu código</p>
      </button>

      <button
        onClick={() => setIsAdmin(true)}
        className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-8 rounded-xl shadow-lg hover:shadow-xl transition-shadow md:col-span-2"
      >
        <LogIn className="w-12 h-12 mx-auto mb-4" />
        <h2 className="text-xl font-bold mb-2">Acceso Administrador</h2>
        <p className="text-indigo-100 text-sm">Panel de gestión y reportes</p>
      </button>
    </div>
  );
}

function RegisterForm({ setView }) {
  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    email: '',
    anio: '',
    fecha: '',
    hora: ''
  });
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    const [horas, minutos] = formData.hora.split(':').map(Number);
    const horaEnMinutos = horas * 60 + minutos;
    const min1840 = 18 * 60 + 40;
    const min2200 = 22 * 60;

    if (horaEnMinutos < min1840 || horaEnMinutos > min2200) {
      setMessage({ type: 'error', text: 'La hora de asistencia debe estar entre 18:40 y 22:00' });
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`${API_URL}/inscripciones`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await res.json();

      if (res.ok) {
        setMessage({ 
          type: 'success', 
          codigo: data.codigo,
          nombre: formData.nombre,
          fecha: formData.fecha,
          hora: formData.hora
        });
        setFormData({ nombre: '', apellido: '', email: '', anio: '', fecha: '', hora: '' });
      } else {
        setMessage({ type: 'error', text: data.error || 'Error al inscribirse' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Error de conexión con el servidor' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <button onClick={() => setView('home')} className="text-indigo-600 mb-4 flex items-center gap-2 hover:text-indigo-800">
        ← Volver
      </button>

      <h2 className="text-2xl font-bold text-gray-800 mb-6">Nueva Inscripción</h2>

      {message && message.type === 'success' && (
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-green-500 rounded-full p-2">
              <CheckCircle className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-xl font-bold text-green-800">¡Inscripción Exitosa!</h3>
          </div>
          <div className="space-y-3">
            <p className="text-gray-700">Hola <span className="font-semibold text-green-700">{message.nombre}</span>, tu inscripción ha sido confirmada.</p>
            <div className="bg-white rounded-lg p-4 border border-green-200">
              <p className="text-sm text-gray-600 mb-2">Tu código de inscripción:</p>
              <p className="text-3xl font-mono font-bold text-indigo-600 tracking-wider">{message.codigo}</p>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="bg-white rounded-lg p-3 border border-gray-200">
                <p className="text-gray-500">Fecha</p>
                <p className="font-semibold text-gray-800">{message.fecha}</p>
              </div>
              <div className="bg-white rounded-lg p-3 border border-gray-200">
                <p className="text-gray-500">Hora</p>
                <p className="font-semibold text-gray-800">{message.hora}</p>
              </div>
            </div>
            <p className="text-sm text-gray-600 mt-4">
              💡 <span className="font-medium">Guarda este código</span> para cancelar tu inscripción si es necesario.
            </p>
          </div>
        </div>
      )}

      {message && message.type === 'error' && (
        <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4 mb-4">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <p className="text-red-800">{message.text}</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
          <input
            type="text"
            required
            value={formData.nombre}
            onChange={(e) => setFormData({...formData, nombre: e.target.value})}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Apellido</label>
          <input
            type="text"
            required
            value={formData.apellido}
            onChange={(e) => setFormData({...formData, apellido: e.target.value})}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input
            type="email"
            required
            value={formData.email}
            onChange={(e) => setFormData({...formData, email: e.target.value})}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Año que Cursa</label>
          <select
            required
            value={formData.anio}
            onChange={(e) => setFormData({...formData, anio: e.target.value})}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          >
            <option value="">Seleccionar...</option>
            <option value="1º año">1º año</option>
            <option value="2º año">2º año</option>
            <option value="3º año">3º año</option>
            <option value="Finalizó">Finalizó</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Fecha</label>
          <input
            type="date"
            required
            value={formData.fecha}
            onChange={(e) => setFormData({...formData, fecha: e.target.value})}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Hora de Asistencia (18:40 - 22:00)</label>
          <div className="grid grid-cols-2 gap-2">
            <select
              required
              value={formData.hora.split(':')[0] || ''}
              onChange={(e) => {
                const minutos = formData.hora.split(':')[1] || '00';
                setFormData({...formData, hora: `${e.target.value}:${minutos}`});
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Hora</option>
              <option value="18">18</option>
              <option value="19">19</option>
              <option value="20">20</option>
              <option value="21">21</option>
              <option value="22">22</option>
            </select>
            <select
              required
              value={formData.hora.split(':')[1] || ''}
              onChange={(e) => {
                const horas = formData.hora.split(':')[0] || '18';
                setFormData({...formData, hora: `${horas}:${e.target.value}`});
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Min</option>
              <option value="00">00</option>
              <option value="10">10</option>
              <option value="15">15</option>
              <option value="20">20</option>
              <option value="30">30</option>
              <option value="40">40</option>
              <option value="45">45</option>
              <option value="50">50</option>
            </select>
          </div>
          <p className="text-xs text-gray-500 mt-1">Selecciona la hora en que asistirás al laboratorio</p>
          {formData.hora && formData.hora.includes(':') && (
            <p className="text-xs text-indigo-600 mt-1">Hora de asistencia: {formData.hora}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 disabled:bg-gray-400 transition-colors"
        >
          {loading ? 'Procesando...' : 'Confirmar Inscripción'}
        </button>
      </form>
    </div>
  );
}

function CancelForm({ setView }) {
  const [codigo, setCodigo] = useState('');
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [deleteInfo, setDeleteInfo] = useState(null);

  const handleCancel = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    setDeleteInfo(null);

    try {
      const res = await fetch(`${API_URL}/inscripciones/${codigo}`, {
        method: 'DELETE'
      });

      const data = await res.json();

      if (res.ok) {
        if (data.eliminadas && data.eliminadas > 1) {
          setMessage({ type: 'success', text: `¡Inscripciones canceladas exitosamente! Se eliminaron ${data.eliminadas} inscripciones (reserva de profesor).` });
        } else {
          setMessage({ type: 'success', text: '¡Inscripción cancelada exitosamente!' });
        }
        setCodigo('');
      } else {
        setMessage({ type: 'error', text: data.error || 'Código inválido' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Error de conexión' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <button onClick={() => setView('home')} className="text-indigo-600 mb-4 flex items-center gap-2">
        ← Volver
      </button>

      <h2 className="text-2xl font-bold text-gray-800 mb-6">Cancelar Inscripción</h2>

      {message && (
        <div className={`p-4 rounded-lg mb-4 ${message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {message.type === 'success' ? <CheckCircle className="inline w-5 h-5 mr-2" /> : <AlertCircle className="inline w-5 h-5 mr-2" />}
          {message.text}
        </div>
      )}

      <form onSubmit={handleCancel} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Código de Inscripción (4 dígitos)</label>
          <input
            type="text"
            required
            maxLength="4"
            value={codigo}
            onChange={(e) => setCodigo(e.target.value.toUpperCase())}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-center text-2xl font-mono"
            placeholder="XXXX"
          />
        </div>

        <button
          type="submit"
          disabled={loading || codigo.length !== 4}
          className="w-full bg-red-600 text-white py-3 rounded-lg font-semibold hover:bg-red-700 disabled:bg-gray-400 transition-colors"
        >
          {loading ? 'Procesando...' : 'Cancelar Inscripción'}
        </button>
      </form>
    </div>
  );
}

function AdminPanel({ setIsAdmin }) {
  const [authenticated, setAuthenticated] = useState(false);
  const [view, setView] = useState('inscripciones');

  if (!authenticated) {
    return <AdminLogin setAuthenticated={setAuthenticated} setIsAdmin={setIsAdmin} />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-indigo-600 text-white p-4 shadow-lg">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-xl md:text-2xl font-bold">Panel de Administración</h1>
          <button
            onClick={() => setIsAdmin(false)}
            className="flex items-center gap-2 bg-indigo-700 px-4 py-2 rounded-lg hover:bg-indigo-800"
          >
            <LogOut className="w-4 h-4" />
            Salir
          </button>
        </div>
      </header>

      <nav className="bg-white shadow-md">
        <div className="container mx-auto px-4">
          <div className="flex overflow-x-auto">
            <TabButton active={view === 'inscripciones'} onClick={() => setView('inscripciones')}>
              <FileText className="w-4 h-4" />
              Inscripciones
            </TabButton>
            <TabButton active={view === 'notificaciones'} onClick={() => setView('notificaciones')}>
              <Bell className="w-4 h-4" />
              Notificaciones
            </TabButton>
            <TabButton active={view === 'manual'} onClick={() => setView('manual')}>
              <Plus className="w-4 h-4" />
              Registro Manual
            </TabButton>
            <TabButton active={view === 'fechas'} onClick={() => setView('fechas')}>
              <Lock className="w-4 h-4" />
              Bloquear Fechas
            </TabButton>
            <TabButton active={view === 'profesores'} onClick={() => setView('profesores')}>
              <User className="w-4 h-4" />
              Profesores
            </TabButton>
          </div>
        </div>
      </nav>

      <main className="container mx-auto px-4 py-6">
        {view === 'inscripciones' && <InscripcionesView />}
        {view === 'notificaciones' && <NotificacionesView />}
        {view === 'manual' && <ManualRegisterView />}
        {view === 'fechas' && <BlockDatesView />}
        {view === 'profesores' && <ProfessorsView />}
      </main>
    </div>
  );
}

function TabButton({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-3 border-b-2 whitespace-nowrap ${
        active ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-600 hover:text-indigo-600'
      }`}
    >
      {children}
    </button>
  );
}

function AdminLogin({ setAuthenticated, setIsAdmin }) {
  const [codigo, setCodigo] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_URL}/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ codigo })
      });

      if (res.ok) {
        setAuthenticated(true);
      } else {
        setError('Código incorrecto');
      }
    } catch (err) {
      setError('Error de conexión');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-md">
        <LogIn className="w-16 h-16 text-indigo-600 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">Acceso Administrador</h2>

        {error && (
          <div className="bg-red-100 text-red-800 p-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin}>
          <label className="block text-sm font-medium text-gray-700 mb-2">Código de Acceso</label>
          <input
            type="password"
            maxLength="4"
            value={codigo}
            onChange={(e) => setCodigo(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-center text-2xl font-mono mb-4"
            placeholder="****"
          />
          <button
            type="submit"
            className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 mb-3"
          >
            Ingresar
          </button>
        </form>

        <button
          onClick={() => setIsAdmin(false)}
          className="w-full bg-gray-100 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-200 flex items-center justify-center gap-2"
        >
          <X className="w-4 h-4" />
          Volver al Menú Principal
        </button>
      </div>
    </div>
  );
}

function NotificacionesView() {
  const [notificaciones, setNotificaciones] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotificaciones();
  }, []);

  const fetchNotificaciones = async () => {
    try {
      const res = await fetch(`${API_URL}/admin/notificaciones`);
      const data = await res.json();
      setNotificaciones(data.notificaciones || []);
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const marcarComoLeida = async (id) => {
    try {
      await fetch(`${API_URL}/admin/notificaciones/${id}`, {
        method: 'PATCH'
      });
      fetchNotificaciones();
    } catch (err) {
      console.error('Error:', err);
    }
  };

  const marcarTodasLeidas = async () => {
    try {
      await fetch(`${API_URL}/admin/notificaciones/marcar-todas`, {
        method: 'PATCH'
      });
      fetchNotificaciones();
    } catch (err) {
      console.error('Error:', err);
    }
  };

  const noLeidas = notificaciones.filter(n => !n.leida).length;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-gray-800">Notificaciones</h2>
          {noLeidas > 0 && (
            <button
              onClick={marcarTodasLeidas}
              className="text-sm bg-indigo-100 text-indigo-700 px-4 py-2 rounded-lg hover:bg-indigo-200"
            >
              Marcar todas como leídas
            </button>
          )}
        </div>
        {noLeidas > 0 && (
          <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-3 mb-4">
            <p className="text-indigo-800 font-medium">Tienes {noLeidas} notificación{noLeidas > 1 ? 'es' : ''} nueva{noLeidas > 1 ? 's' : ''}</p>
          </div>
        )}
      </div>

      <div className="space-y-3">
        {loading ? (
          <div className="text-center py-8 text-gray-500">Cargando notificaciones...</div>
        ) : notificaciones.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
            No hay notificaciones
          </div>
        ) : (
          notificaciones.map((notif) => (
            <div
              key={notif.id}
              className={`bg-white rounded-lg shadow p-4 ${!notif.leida ? 'border-l-4 border-indigo-500' : ''} ${notif.es_profesor ? 'bg-gradient-to-r from-purple-50 to-indigo-50' : ''}`}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <Bell className={`w-5 h-5 ${!notif.leida ? 'text-indigo-600' : 'text-gray-400'}`} />
                    <span className={`text-sm font-medium ${notif.tipo === 'nueva' ? 'text-green-600' : 'text-red-600'}`}>
                      {notif.tipo === 'nueva' ? 'Nueva Inscripción' : 'Baja de Inscripción'}
                    </span>
                    {!notif.leida && (
                      <span className="bg-indigo-100 text-indigo-700 text-xs px-2 py-1 rounded-full font-medium">
                        Nueva
                      </span>
                    )}
                    {notif.es_profesor && (
                      <span className="bg-purple-600 text-white text-xs px-2 py-1 rounded-full font-medium flex items-center gap-1">
                        <User className="w-3 h-3" />
                        PROFESOR - 8 cupos
                      </span>
                    )}
                  </div>
                  <p className="text-gray-800 font-medium">{notif.nombre} {notif.apellido}</p>
                  <p className="text-sm text-gray-600">{notif.email}</p>
                  <div className="flex gap-4 mt-2 text-sm text-gray-500">
                    <span>📅 {new Date(notif.fecha).toLocaleDateString('es-AR')}</span>
                    <span>🕐 {notif.hora}</span>
                  </div>
                  <p className="text-xs text-gray-400 mt-2">
                    {new Date(notif.created_at).toLocaleDateString('es-AR')} a las {new Date(notif.created_at).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                {!notif.leida && (
                  <button
                    onClick={() => marcarComoLeida(notif.id)}
                    className="text-indigo-600 hover:text-indigo-800 text-sm"
                  >
                    Marcar leída
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function InscripcionesView() {
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);
  const [inscripciones, setInscripciones] = useState([]);
  const [cupos, setCupos] = useState({ usados: 0, total: 8 });

  useEffect(() => {
    fetchInscripciones();
  }, [fecha]);

  const fetchInscripciones = async () => {
    try {
      const res = await fetch(`${API_URL}/admin/inscripciones?fecha=${fecha}`);
      const data = await res.json();
      setInscripciones(data.inscripciones || []);
      setCupos(data.cupos || { usados: 0, total: 8 });
    } catch (err) {
      console.error('Error:', err);
    }
  };

  const handleDelete = async (id, email, fecha) => {
    try {
      // Primero verificar si es profesor
      const resVerificar = await fetch(`${API_URL}/admin/verificar-profesor?email=${encodeURIComponent(email)}`);
      const dataVerificar = await resVerificar.json();
      
      if (dataVerificar.esProfesor) {
        if (!window.confirm('Este email es de un profesor. ¿Eliminar TODAS sus inscripciones (8 cupos) de esta fecha?')) return;
        
        const res = await fetch(`${API_URL}/admin/inscripciones/profesor?email=${encodeURIComponent(email)}&fecha=${fecha}`, { 
          method: 'DELETE' 
        });
        
        if (res.ok) {
          const data = await res.json();
          alert(`Se eliminaron ${data.eliminadas} inscripciones del profesor`);
          fetchInscripciones();
        } else {
          alert('Error al eliminar inscripciones del profesor');
        }
      } else {
        if (!window.confirm('¿Eliminar esta inscripción?')) return;
        
        const res = await fetch(`${API_URL}/admin/inscripciones/${id}`, { method: 'DELETE' });
        if (res.ok) {
          fetchInscripciones();
        } else {
          alert('Error al eliminar');
        }
      }
    } catch (err) {
      console.error('Error:', err);
      alert('Error al eliminar inscripción');
    }
  };

  const handleDownloadPDF = async () => {
    try {
      const res = await fetch(`${API_URL}/admin/reporte-pdf?fecha=${fecha}`);
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `inscripciones_${fecha}.pdf`;
      a.click();
    } catch (err) {
      alert('Error al generar PDF');
    }
  };

  return (
    <div>
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-4">
            <label className="font-medium text-gray-700">Fecha:</label>
            <input
              type="date"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div className="flex items-center gap-4">
            <div className="bg-indigo-100 px-6 py-2 rounded-lg">
              <span className="font-bold text-indigo-900">Cupos: {cupos.usados}/{cupos.total}</span>
            </div>
            <button
              onClick={handleDownloadPDF}
              className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
            >
              <Download className="w-4 h-4" />
              PDF
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Nombre</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Email</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Hora</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Código</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {inscripciones.map((insc) => (
              <tr key={insc.id} className="border-t">
                <td className="px-4 py-3 text-sm">{insc.nombre} {insc.apellido}</td>
                <td className="px-4 py-3 text-sm">{insc.email}</td>
                <td className="px-4 py-3 text-sm">{insc.hora}</td>
                <td className="px-4 py-3 text-sm font-mono">{insc.codigo}</td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => handleDelete(insc.id, insc.email, insc.fecha)}
                    className="text-red-600 hover:text-red-800"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {inscripciones.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No hay inscripciones para esta fecha
          </div>
        )}
      </div>
    </div>
  );
}

function ManualRegisterView() {
  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    email: '',
    anio: '',
    fecha: '',
    hora: ''
  });
  const [message, setMessage] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const [horas, minutos] = formData.hora.split(':').map(Number);
    const horaEnMinutos = horas * 60 + minutos;
    const min1840 = 18 * 60 + 40;
    const min2200 = 22 * 60;

    if (horaEnMinutos < min1840 || horaEnMinutos > min2200) {
      setMessage({ type: 'error', text: 'La hora de asistencia debe estar entre 18:40 y 22:00' });
      return;
    }

    try {
      const res = await fetch(`${API_URL}/admin/inscripciones`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await res.json();

      if (res.ok) {
        setMessage({ type: 'success', text: `Inscripción registrada. Código: ${data.codigo}` });
        setFormData({ nombre: '', apellido: '', email: '', anio: '', fecha: '', hora: '' });
      } else {
        setMessage({ type: 'error', text: data.error });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Error de conexión' });
    }
  };

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-lg shadow p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Registro Manual</h2>

      {message && (
        <div className={`p-4 rounded-lg mb-4 ${message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
            <input
              type="text"
              required
              value={formData.nombre}
              onChange={(e) => setFormData({...formData, nombre: e.target.value})}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Apellido</label>
            <input
              type="text"
              required
              value={formData.apellido}
              onChange={(e) => setFormData({...formData, apellido: e.target.value})}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input
            type="email"
            required
            value={formData.email}
            onChange={(e) => setFormData({...formData, email: e.target.value})}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Año que Cursa</label>
          <select
            required
            value={formData.anio}
            onChange={(e) => setFormData({...formData, anio: e.target.value})}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">Seleccionar...</option>
            <option value="1º año">1º año</option>
            <option value="2º año">2º año</option>
            <option value="3º año">3º año</option>
            <option value="Finalizó">Finalizó</option>
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Fecha</label>
            <input
              type="date"
              required
              value={formData.fecha}
              onChange={(e) => setFormData({...formData, fecha: e.target.value})}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Hora de Asistencia (18:40 - 22:00)</label>
            <div className="grid grid-cols-2 gap-2">
              <select
                required
                value={formData.hora.split(':')[0] || ''}
                onChange={(e) => {
                  const minutos = formData.hora.split(':')[1] || '00';
                  setFormData({...formData, hora: `${e.target.value}:${minutos}`});
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Hora</option>
                <option value="18">18</option>
                <option value="19">19</option>
                <option value="20">20</option>
                <option value="21">21</option>
                <option value="22">22</option>
              </select>
              <select
                required
                value={formData.hora.split(':')[1] || ''}
                onChange={(e) => {
                  const horas = formData.hora.split(':')[0] || '18';
                  setFormData({...formData, hora: `${horas}:${e.target.value}`});
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Min</option>
                <option value="00">00</option>
                <option value="10">10</option>
                <option value="15">15</option>
                <option value="20">20</option>
                <option value="30">30</option>
                <option value="40">40</option>
                <option value="45">45</option>
                <option value="50">50</option>
              </select>
            </div>
          </div>
        </div>

        <button
          type="submit"
          className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700"
        >
          Registrar Inscripción
        </button>
      </form>
    </div>
  );
}

function BlockDatesView() {
  const [fechas, setFechas] = useState([]);
  const [nuevaFecha, setNuevaFecha] = useState('');
  const [motivo, setMotivo] = useState('');

  useEffect(() => {
    fetchFechas();
  }, []);

  const fetchFechas = async () => {
    try {
      const res = await fetch(`${API_URL}/admin/fechas-bloqueadas`);
      const data = await res.json();
      setFechas(data.fechas || []);
    } catch (err) {
      console.error('Error:', err);
    }
  };

  const handleBlock = async (e) => {
    e.preventDefault();
    try {
      await fetch(`${API_URL}/admin/fechas-bloqueadas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          fecha: nuevaFecha,
          motivo: motivo || 'Fecha no disponible'
        })
      });
      setNuevaFecha('');
      setMotivo('');
      fetchFechas();
    } catch (err) {
      alert('Error al bloquear fecha');
    }
  };

  const handleUnblock = async (fecha) => {
    try {
      await fetch(`${API_URL}/admin/fechas-bloqueadas/${fecha}`, {
        method: 'DELETE'
      });
      fetchFechas();
    } catch (err) {
      alert('Error al desbloquear fecha');
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Bloquear Fecha</h2>
        <form onSubmit={handleBlock} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Fecha</label>
            <input
              type="date"
              required
              value={nuevaFecha}
              onChange={(e) => setNuevaFecha(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Motivo (opcional)</label>
            <input
              type="text"
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              placeholder="Ej: Feriado, Mantenimiento..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
            <p className="text-xs text-gray-500 mt-1">Si no especificas un motivo, se usará: &quot;Fecha no disponible&quot;</p>
          </div>
          <button
            type="submit"
            className="w-full bg-red-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-red-700 flex items-center justify-center gap-2"
          >
            <Lock className="w-5 h-5" />
            Bloquear Fecha
          </button>
        </form>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-xl font-bold text-gray-800 mb-4">Fechas Bloqueadas</h3>
        {fechas.length === 0 ? (
          <p className="text-gray-500 text-center py-4">No hay fechas bloqueadas</p>
        ) : (
          <div className="space-y-2">
            {fechas.map((f) => (
              <div key={f.fecha} className="flex justify-between items-start p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div>
                  <p className="font-medium text-gray-800">{f.fecha}</p>
                  <p className="text-sm text-gray-600 mt-1">{f.motivo}</p>
                </div>
                <button
                  onClick={() => handleUnblock(f.fecha)}
                  className="text-green-600 hover:text-green-800 flex items-center gap-2"
                >
                  <Unlock className="w-4 h-4" />
                  Desbloquear
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ProfessorsView() {
  const [profesores, setProfesores] = useState([]);
  const [nuevoEmail, setNuevoEmail] = useState('');
  const [nuevoNombre, setNuevoNombre] = useState('');

  useEffect(() => {
    fetchProfesores();
  }, []);

  const fetchProfesores = async () => {
    try {
      const res = await fetch(`${API_URL}/admin/profesores`);
      const data = await res.json();
      setProfesores(data.profesores || []);
    } catch (err) {
      console.error('Error:', err);
    }
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    try {
      await fetch(`${API_URL}/admin/profesores`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email: nuevoEmail,
          nombre: nuevoNombre
        })
      });
      setNuevoEmail('');
      setNuevoNombre('');
      fetchProfesores();
    } catch (err) {
      alert('Error al agregar profesor');
    }
  };

  const handleDelete = async (id) => {
    try {
      await fetch(`${API_URL}/admin/profesores/${id}`, {
        method: 'DELETE'
      });
      fetchProfesores();
    } catch (err) {
      alert('Error al eliminar profesor');
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Gestión de Profesores</h2>
        <p className="text-sm text-gray-600 mb-6">
          Los emails registrados aquí reservarán automáticamente todos los cupos (8/8) al inscribirse.
        </p>
        <form onSubmit={handleAdd} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del Profesor</label>
            <input
              type="text"
              required
              value={nuevoNombre}
              onChange={(e) => setNuevoNombre(e.target.value)}
              placeholder="Juan Pérez"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              required
              value={nuevoEmail}
              onChange={(e) => setNuevoEmail(e.target.value)}
              placeholder="email@ejemplo.com"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <button
            type="submit"
            className="w-full bg-indigo-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-indigo-700 flex items-center justify-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Agregar Profesor
          </button>
        </form>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-xl font-bold text-gray-800 mb-4">Lista de Profesores</h3>
        {profesores.length === 0 ? (
          <p className="text-gray-500 text-center py-4">No hay profesores registrados</p>
        ) : (
          <div className="space-y-2">
            {profesores.map((p) => (
              <div key={p.id} className="flex justify-between items-center p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div>
                  <p className="font-medium text-gray-800">{p.nombre}</p>
                  <p className="text-sm text-gray-600">{p.email}</p>
                </div>
                <button
                  onClick={() => handleDelete(p.id)}
                  className="text-red-600 hover:text-red-800"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
