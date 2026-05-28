import React, { useState, useEffect } from 'react';
import { Plus, X } from 'lucide-react';

export default function Inventario() {
    // Estados de datos
    const [inventario, setInventario] = useState([]);
    const [catalogoIngredientes, setCatalogoIngredientes] = useState([]);
    const [cargando, setCargando] = useState(true);

    // Estados de la interfaz (Bottom Sheet)
    const [isSheetOpen, setIsSheetOpen] = useState(false);
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
                fetch(`http://localhost:8000/inventario/${ID_USUARIO}`),
                fetch(`http://localhost:8000/ingredientes/`)
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

    const formatearCantidad = (cantidad, unidad) => {
        const cant = parseFloat(cantidad);
        if (unidad === 'gr' && cant >= 1000) return `${(cant / 1000).toFixed(2)} kg`;
        if (unidad === 'ml' && cant >= 1000) return `${(cant / 1000).toFixed(2)} L`;
        return `${cant} ${unidad}`;
    };

    const handleAgregarStock = async (e) => {
        e.preventDefault();
        if (!formIngredienteId || !formCantidad) return;

        try {
            const response = await fetch('http://localhost:8000/inventario/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id_usuario: ID_USUARIO,
                    id_ingrediente: parseInt(formIngredienteId),
                    cantidad_actual: parseFloat(formCantidad)
                })
            });

            if (response.ok) {
                setIsSheetOpen(false);
                setFormIngredienteId('');
                setFormCantidad('');
                cargarDatos();
            }
        } catch (error) {
            console.error("Error al guardar stock:", error);
        }
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
                        onClick={() => setIsSheetOpen(true)}
                        className="bg-blue-600 text-white p-3 rounded-full shadow-md hover:bg-blue-700 active:scale-95 transition-all"
                    >
                        <Plus size={24} />
                    </button>
                </div>

                {inventario.length === 0 ? (
                    <div className="text-center mt-20 p-6 bg-gray-50 rounded-2xl border border-dashed border-gray-300">
                        <p className="text-gray-500">Tu inventario está vacío.</p>
                    </div>
                ) : (
                    <div className="grid gap-3">
                        {inventario.map((item) => (
                            <div
                                key={item.id_ingrediente}
                                className="bg-white border border-gray-100 p-4 rounded-2xl shadow-sm flex justify-between items-center"
                            >
                                <h3 className="font-semibold text-gray-800 text-lg">
                                    {item.ingrediente.nombre}
                                </h3>
                                <div className="bg-blue-50 text-blue-700 px-4 py-2 rounded-xl font-bold tracking-wide">
                                    {formatearCantidad(item.cantidad_actual, item.ingrediente.unidad.nombre)}
                                </div>
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
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold text-gray-800">Agregar Stock</h3>
                    <button onClick={() => setIsSheetOpen(false)} className="text-gray-400 hover:text-gray-600">
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleAgregarStock} className="space-y-4 pb-8">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Ingrediente</label>
                        <select
                            className="w-full bg-gray-50 border border-gray-200 text-gray-800 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 outline-none"
                            value={formIngredienteId}
                            onChange={(e) => setFormIngredienteId(e.target.value)}
                            required
                        >
                            <option value="" disabled>Selecciona un ingrediente...</option>
                            {catalogoIngredientes.map(ing => (
                                <option key={ing.id} value={ing.id}>
                                    {ing.nombre} (en {ing.unidad.nombre})
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Cantidad (en unidad base)
                        </label>
                        <input
                            type="number"
                            step="0.01"
                            className="w-full bg-gray-50 border border-gray-200 text-gray-800 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 outline-none"
                            placeholder="Ej. 1500 (para 1.5kg)"
                            value={formCantidad}
                            onChange={(e) => setFormCantidad(e.target.value)}
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        className="w-full bg-blue-600 text-white font-bold rounded-xl p-4 mt-4 shadow-md active:bg-blue-700"
                    >
                        Guardar en Alacena
                    </button>
                </form>
            </div>
        </div>
    );
}