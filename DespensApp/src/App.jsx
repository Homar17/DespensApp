import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

// Importación de componentes y vistas
import Auth from './pages/Auth';
import BottomNav from './components/BottomNav';
import Inventario from './pages/Inventario';
import ListaCompras from './pages/ListaCompras';
import Recetas from './pages/Recetas';

export default function App() {
  const [usuarioId, setUsuarioId] = useState(null);

  // Al cargar la app, revisamos si ya hay una sesión guardada
  useEffect(() => {
    const sesionGuardada = localStorage.getItem('despensapp_user_id');
    if (sesionGuardada) {
      setUsuarioId(parseInt(sesionGuardada));
    }
  }, []);

  const handleCerrarSesion = () => {
    localStorage.removeItem('despensapp_user_id');
    localStorage.removeItem('despensapp_user_name');
    setUsuarioId(null);
  };

  // Si no hay usuario, retornamos la pantalla de bloqueo
  if (!usuarioId) {
    return <Auth onLoginSuccess={(id) => setUsuarioId(id)} />;
  }

  // Si hay usuario, renderizamos la app normal con las rutas
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-50 pb-20">

        <main className="max-w-md mx-auto bg-white min-h-screen shadow-sm relative">

          {/* Top bar de sesión pegajosa en la parte superior */}
          <div className="bg-white p-4 shadow-sm flex justify-between items-center z-40 sticky top-0 border-b border-gray-100">
            <span className="font-bold text-gray-800">
              Hola, {localStorage.getItem('despensapp_user_name')}
            </span>
            <button
              onClick={handleCerrarSesion}
              className="text-sm text-red-500 font-medium hover:text-red-700 transition-colors"
            >
              Cerrar sesión
            </button>
          </div>

          {/* Vistas dinámicas según la URL */}
          <Routes>
            <Route path="/" element={<Inventario />} />
            <Route path="/compras" element={<ListaCompras />} />
            <Route path="/recetas" element={<Recetas />} />
          </Routes>

        </main>

        {/* Barra de navegación siempre visible al fondo */}
        <BottomNav />

      </div>
    </BrowserRouter>
  );
}