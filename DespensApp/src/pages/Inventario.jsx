import React, { useState, useEffect } from 'react';
import { Plus, X, Minus } from 'lucide-react';

export default function Inventario() {
    // Estados de datos
    const [inventario, setInventario] = useState([]);
    const [catalogoIngredientes, setCatalogoIngredientes] = useState([]);
    const [cargando, setCargando] = useState(true);

    // Estados de la interfaz (Bottom Sheet)
    const [isSheetOpen, setIsSheetOpen] = useState(false);
    const [modo, setModo] = useState('agregar'); // 'agregar' o 'retirar'
    const [formIngredienteId, setFormIngredienteId] = useState('');
    const [formCantidad, setFormCantidad] = useState('');

    // LECTURA DINÁMICA DEL USUARIO LOGUEADO
    const ID_USUARIO = parseInt(localStorage.getItem('despensapp_user_id'));

    useEffect(() => {
        cargarDatos();
    }, []);

    const cargarDatos = async () => {
        setCargando(true);
        try {
            const [resInventario, resIngredientes] = await Promise.all([
                fetch(`${import.meta.env.VITE_API_URL}/inventario/${ID_USUARIO}`),
                fetch(`${import.meta.env.VITE_API_URL}/ingredientes/`)
            ]);

            if (resInventario.ok && resIngredientes.ok) {
                setInventario(await resInventario.json());
                setCatalogoIngredientes(await resIngredientes.json());
            }
        } catch (error) {
            console.error("Error al conectar con el backend:", error);
        } finally {
            setCargando(false);
        }
    };

    // FILTRO VISUAL: Solo mostramos elementos que tengan más de 0
    const inventarioVisible = inventario.filter(item => item.cantidad_actual > 0);

    const formatearCantidad = (cantidad, unidad) => {
        const cant = parseFloat(cantidad);
        if (unidad === 'gr' && cant >= 1000) return `${(cant / 1000).toFixed(2)} kg`;
        if (unidad === 'ml' && cant >= 1000) return `${(cant / 1000).toFixed(2)} L`;
        return `${cant} ${unidad}`;
    };

    const handleAccionStock = async (e) => {
        e.preventDefault();
        if (!formIngredienteId || !formCantidad) return;

        let cantidadIngresada = parseFloat(formCantidad);
        const idIngredienteInt = parseInt(formIngredienteId);

        // Candado 1: Prevenir que metan un 0 o número negativo manualmente
        if (cantidadIngresada <= 0) {
            alert("Por favor ingresa una cantidad mayor a 0.");
            return;
        }

        let cantidadMandar = cantidadIngresada;

        // Validaciones si estamos en modo "retirar"
        if (modo === 'retirar') {
            const itemExistente = inventario.find(item => item.id_ingrediente === idIngredienteInt);
            
            if (!itemExistente || itemExistente.cantidad_actual <= 0) {
                alert("No tienes este ingrediente en tu inventario para retirar.");
                return;
            }
            if (cantidadMandar > itemExistente.cantidad_actual) {
                alert(`No puedes retirar más de lo que tienes. Tienes ${itemExistente.cantidad_actual}.`);
                return;
            }
            // Convertimos la cantidad a negativo para que el backend la reste
            cantidadMandar = -Math.abs(cantidadMandar);
        } else {
            // Si es agregar, nos aseguramos de que sea positivo
            cantidadMandar = Math.abs(cantidadMandar);
        }

        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/inventario/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id_usuario: ID_USUARIO,
                    id_ingrediente: idIngredienteInt,
                    cantidad_actual: cantidadMandar
                })
            });

            if (response.ok) {
                setIsSheetOpen(false);
                setFormIngredienteId('');
                setFormCantidad('');
                cargarDatos();
            }
        } catch (error) {
            console.error("Error al actualizar stock:", error);
        }
    };

    // Función para abrir el menú directamente en modo retirar desde un item
    const abrirParaRetirar = (idIngrediente) => {
        setModo('retirar');
        setFormIngredienteId(idIngrediente.toString());
        setIsSheetOpen(true);
    };

    if (cargando) {
        return (
            <div className="flex justify-center items-center h-full mt-20">
                <p className="text-gray-500 font-medium">Cargando alacena...</p>
            </div>
        );
    }

    return (
        <div className="relative min-h-screen pb-20">
            <div className="p-5">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800">Mi Alacena</h2>
                        <p className="text-sm text-gray-500">Ingredientes disponibles</p>
                    </div>
                    <button
                        onClick={() => { setModo('agregar'); setFormIngredienteId(''); setIsSheetOpen(true); }}
                        className="bg-blue-600 text-white p-3 rounded-full shadow-md hover:bg-blue-700 active:scale-95 transition-all"
                    >
                        <Plus size={24} />
                    </button>
                </div>

                {/* Usamos inventarioVisible en lugar de inventario completo */}
                {inventarioVisible.length === 0 ? (
                    <div className="text-center mt-20 p-6 bg-gray-50 rounded-2xl border border-dashed border-gray-300">
                        <p className="text-gray-500">Tu inventario está vacío.</p>
                    </div>
                ) : (
                    <div className="grid gap-3">
                        {inventarioVisible.map((item) => (
                            <div
                                key={item.id_ingrediente}
                                className="bg-white border border-gray-100 p-4 rounded-2xl shadow-sm flex justify-between items-center"
                            >
                                <div>
                                    <h3 className="font-semibold text-gray-800 text-lg">
                                        {item.ingrediente.nombre}
                                    </h3>
                                    <span className="bg-blue-50 text-blue-700 px-3 py-1 rounded-lg text-sm font-bold tracking-wide mt-1 inline-block">
                                        {formatearCantidad(item.cantidad_actual, item.ingrediente.unidad.nombre)}
                                    </span>
                                </div>
                                
                                <button 
                                    onClick={() => abrirParaRetirar(item.id_ingrediente)}
                                    className="bg-red-50 text-red-500 p-2 rounded-xl hover:bg-red-100 active:scale-95 transition-all"
                                >
                                    <Minus size={20} />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {isSheetOpen && (
                <div
                    className="fixed inset-0 bg-black/40 z-40 transition-opacity"
                    onClick={() => setIsSheetOpen(false)}
                />
            )}

            <div
                className={`fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white rounded-t-3xl p-6 z-50 transform transition-transform duration-300 ease-in-out ${isSheetOpen ? 'translate-y-0' : 'translate-y-full'
                    }`}
            >
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold text-gray-800">Gestionar Stock</h3>
                    <button onClick={() => setIsSheetOpen(false)} className="text-gray-400 hover:text-gray-600">
                        <X size={24} />
                    </button>
                </div>

                <div className="flex bg-gray-100 rounded-xl p-1 mb-6">
                    <button
                        type="button"
                        onClick={() => setModo('agregar')}
                        className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${modo === 'agregar' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500'}`}
                    >
                        Agregar
                    </button>
                    <button
                        type="button"
                        onClick={() => setModo('retirar')}
                        className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${modo === 'retirar' ? 'bg-white text-red-600 shadow-sm' : 'text-gray-500'}`}
                    >
                        Retirar
                    </button>
                </div>

                <form onSubmit={handleAccionStock} className="space-y-4 pb-8">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Ingrediente</label>
                        <select
                            className="w-full bg-gray-50 border border-gray-200 text-gray-800 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 outline-none"
                            value={formIngredienteId}
                            onChange={(e) => setFormIngredienteId(e.target.value)}
                            required
                        >
                            <option value="" disabled>Selecciona un ingrediente...</option>
                            {modo === 'retirar' 
                                ? inventarioVisible.map(item => (
                                    <option key={item.id_ingrediente} value={item.id_ingrediente}>
                                        {item.ingrediente.nombre} (Disp: {item.cantidad_actual})
                                    </option>
                                  ))
                                : catalogoIngredientes.map(ing => (
                                    <option key={ing.id} value={ing.id}>
                                        {ing.nombre} (en {ing.unidad.nombre})
                                    </option>
                                  ))
                            }
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            {modo === 'agregar' ? 'Cantidad a agregar' : 'Cantidad a retirar'}
                        </label>
                        <input
                            type="number"
                            step="0.01"
                            min="0.01" /* Candado 2: Bloqueo nativo del input HTML */
                            className="w-full bg-gray-50 border border-gray-200 text-gray-800 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 outline-none"
                            placeholder="Ej. 1500 (para 1.5kg)"
                            value={formCantidad}
                            onChange={(e) => setFormCantidad(e.target.value)}
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        className={`w-full text-white font-bold rounded-xl p-4 mt-4 shadow-md transition-all ${
                            modo === 'agregar' ? 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800' : 'bg-red-600 hover:bg-red-700 active:bg-red-800'
                        }`}
                    >
                        {modo === 'agregar' ? 'Guardar en Alacena' : 'Retirar de Alacena'}
                    </button>
                </form>
            </div>
        </div>
    );
}