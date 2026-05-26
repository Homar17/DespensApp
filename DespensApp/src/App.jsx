import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import BottomNav from './components/BottomNav';
import Inventario from './pages/Inventario';
import ListaCompras from './pages/ListaCompras';
import Recetas from './pages/Recetas';

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-50 pb-20"> {/* pb-20 evita que el contenido quede oculto bajo la barra */}
        {/* Aquí va el contenido dinámico de cada página */}
        <main className="max-w-md mx-auto bg-white min-h-screen shadow-sm">
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

export default App;