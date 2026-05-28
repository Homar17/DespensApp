import React, { useState, useEffect } from 'react';
import { BookOpen, Play, Clock, ChevronRight, X, Plus, Trash2, PlusCircle, Flame, Activity } from 'lucide-react';

export default function Recetas() {
    const [recetas, setRecetas] = useState([]);
    const [catalogoIngredientes, setCatalogoIngredientes] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [mensaje, setMensaje] = useState(null);

    const [recetaActiva, setRecetaActiva] = useState(null);

    const [isSheetCrearOpen, setIsSheetCrearOpen] = useState(false);
    const [nuevoNombre, setNuevoNombre] = useState('');
    const [nuevoTiempo, setNuevoTiempo] = useState('');
    const [nuevoProc, setNuevoProc] = useState('');
    const [nuevosIngredientes, setNuevosIngredientes] = useState([]);
    const [tempIngId, setTempIngId] = useState('');
    const [tempCant, setTempCant] = useState('');

    const [modalIngId, setModalIngId] = useState('');
    const [modalCant, setModalCant] = useState('');

    const ID_USUARIO = parseInt(localStorage.getItem('despensapp_user_id'));

    useEffect(() => {
        inicializarDatos();
    }, []);

    const inicializarDatos = async () => {
        try {
            const [resRecetas, resIngredientes] = await Promise.all([
                fetch(`http://localhost:8000/recetas/`),
                fetch(`http://localhost:8000/ingredientes/`)
            ]);

            if (resRecetas.ok) setRecetas(await resRecetas.json());
            if (resIngredientes.ok) setCatalogoIngredientes(await resIngredientes.json());
        } catch (error) {
            console.error("Error al conectar con el backend:", error);
        } finally {
            setCargando(false);
        }
    };

    const cargarRecetas = async (idRecetaAActualizar = null) => {
        try {
            const response = await fetch(`http://localhost:8000/recetas/`);
            if (response.ok) {
                const data = await response.json();
                setRecetas(data);

                if (idRecetaAActualizar) {
                    const recetaActualizada = data.find(r => r.id === idRecetaAActualizar);
                    if (recetaActualizada) {
                        setRecetaActiva(recetaActualizada);
                    }
                }
            }
        } catch (error) {
            console.error("Error al actualizar recetas:", error);
        }
    };

    const formatearCantidad = (cantidad, unidad) => {
        const cant = parseFloat(cantidad);
        if (unidad === 'gr' && cant >= 1000) return `${(cant / 1000).toFixed(2)} kg`;
        if (unidad === 'ml' && cant >= 1000) return `${(cant / 1000).toFixed(2)} L`;
        return `${cant} ${unidad}`;
    };

    // --- NUEVO: FUNCIÓN PARA CALCULAR MACROS DE UNA LISTA DE INGREDIENTES ---
    const calcularMacros = (listaIngredientes) => {
        let cal = 0, prot = 0, carb = 0, gras = 0;

        listaIngredientes.forEach(req => {
            if (!req.ingrediente) return;
            const ing = req.ingrediente;
            const cantidad = parseFloat(req.cantidad_necesaria) || 0;
            const unidadStr = ing.unidad?.nombre?.toLowerCase();

            // Regla de tres dependiendo de la unidad
            const factor = (unidadStr === 'gr' || unidadStr === 'ml') ? (cantidad / 100) : cantidad;

            cal += (parseFloat(ing.calorias_por_100) || 0) * factor;
            prot += (parseFloat(ing.proteina_por_100) || 0) * factor;
            carb += (parseFloat(ing.carbs_por_100) || 0) * factor;
            gras += (parseFloat(ing.grasas_por_100) || 0) * factor;
        });

        return {
            calorias: cal.toFixed(0),
            proteina: prot.toFixed(1),
            carbohidratos: carb.toFixed(1),
            grasas: gras.toFixed(1)
        };
    };

    const handleCocinar = async (id_receta, nombre_receta) => {
        try {
            const response = await fetch(`http://localhost:8000/recetas/${id_receta}/cocinar/?id_usuario=${ID_USUARIO}`, {
                method: 'POST',
            });

            if (response.ok) {
                setMensaje(`Se descontaron los ingredientes de "${nombre_receta}" de tu alacena.`);
                setTimeout(() => setMensaje(null), 4000);
            } else {
                const errData = await response.json();
                alert(`Error: ${errData.detail}`);
            }
        } catch (error) {
            console.error("Error al registrar el consumo:", error);
        }
    };

    const handleAgregarIngredienteExistente = async (e) => {
        e.preventDefault();
        if (!modalIngId || !modalCant || !recetaActiva) return;

        if (recetaActiva.ingredientes.some(i => i.id_ingrediente === parseInt(modalIngId))) {
            alert("Este ingrediente ya forma parte de la receta.");
            return;
        }

        try {
            const response = await fetch(`http://localhost:8000/recetas/${recetaActiva.id}/ingredientes/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id_ingrediente: parseInt(modalIngId),
                    cantidad_necesaria: parseFloat(modalCant)
                })
            });

            if (response.ok) {
                setModalIngId('');
                setModalCant('');
                await cargarRecetas(recetaActiva.id);
            }
        } catch (error) {
            console.error("Error al añadir ingrediente a la receta:", error);
        }
    };

    const handleEliminarIngredienteExistente = async (id_ingrediente) => {
        if (!recetaActiva) return;

        try {
            const response = await fetch(`http://localhost:8000/recetas/${recetaActiva.id}/ingredientes/${id_ingrediente}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                await cargarRecetas(recetaActiva.id);
            }
        } catch (error) {
            console.error("Error al eliminar ingrediente de la receta:", error);
        }
    };

    const handleAgregarIngredienteTemp = () => {
        if (!tempIngId || !tempCant) return;
        const ingCompleto = catalogoIngredientes.find(i => i.id === parseInt(tempIngId));

        if (nuevosIngredientes.some(i => i.id_ingrediente === ingCompleto.id)) {
            alert("Este ingrediente ya está en la receta.");
            return;
        }

        setNuevosIngredientes([...nuevosIngredientes, {
            id_ingrediente: ingCompleto.id,
            ingrediente: ingCompleto, // Se agrega el objeto completo para poder calcular macros al instante
            cantidad_necesaria: parseFloat(tempCant)
        }]);

        setTempIngId('');
        setTempCant('');
    };

    const quitarIngredienteTemp = (id_ingrediente) => {
        setNuevosIngredientes(nuevosIngredientes.filter(i => i.id_ingrediente !== id_ingrediente));
    };

    const handleGuardarReceta = async (e) => {
        e.preventDefault();
        if (nuevosIngredientes.length === 0) {
            alert("Debes agregar al menos un ingrediente a la receta.");
            return;
        }

        try {
            const resReceta = await fetch('http://localhost:8000/recetas/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    nombre: nuevoNombre,
                    tiempo_prep: nuevoTiempo ? parseInt(nuevoTiempo) : null,
                    procedimiento: nuevoProc
                })
            });

            if (resReceta.ok) {
                const recetaCreada = await resReceta.json();

                for (const req of nuevosIngredientes) {
                    await fetch(`http://localhost:8000/recetas/${recetaCreada.id}/ingredientes/`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            id_ingrediente: req.id_ingrediente,
                            cantidad_necesaria: req.cantidad_necesaria
                        })
                    });
                }

                setIsSheetCrearOpen(false);
                setNuevoNombre('');
                setNuevoTiempo('');
                setNuevoProc('');
                setNuevosIngredientes([]);
                cargarRecetas();

                setMensaje(`Receta "${nuevoNombre}" creada con éxito.`);
                setTimeout(() => setMensaje(null), 4000);
            }
        } catch (error) {
            console.error("Error al guardar la receta completa:", error);
        }
    };

    if (cargando) {
        return (
            <div className="flex justify-center items-center h-full mt-20">
                <p className="text-gray-500 font-medium">Cargando recetario...</p>
            </div>
        );
    }

    return (
        <div className="p-5 pb-20 relative min-h-screen">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800">Mis Recetas</h2>
                    <p className="text-sm text-gray-500">Platillos y raciones frecuentes</p>
                </div>
                <button
                    onClick={() => setIsSheetCrearOpen(true)}
                    className="bg-blue-600 text-white p-3 rounded-full shadow-md hover:bg-blue-700 active:scale-95 transition-all"
                >
                    <Plus size={24} />
                </button>
            </div>

            {mensaje && (
                <div className="fixed top-5 left-1/2 transform -translate-x-1/2 w-[90%] bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl shadow-lg z-50 text-sm text-center transition-all">
                    {mensaje}
                </div>
            )}

            {recetas.length === 0 ? (
                <div className="text-center mt-20 p-6 bg-gray-50 rounded-2xl border border-dashed border-gray-300">
                    <BookOpen className="mx-auto text-gray-300 mb-3" size={32} />
                    <p className="text-gray-500">Aún no tienes recetas registradas.</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {recetas.map((receta) => {
                        const macros = calcularMacros(receta.ingredientes);
                        return (
                            <div
                                key={receta.id}
                                onClick={() => setRecetaActiva(receta)}
                                className="bg-white border border-gray-100 rounded-2xl shadow-sm p-4 flex justify-between items-center cursor-pointer active:scale-[0.98] transition-transform"
                            >
                                <div>
                                    <h3 className="font-bold text-lg text-gray-800">{receta.nombre}</h3>

                                    <div className="flex items-center gap-4 mt-2">
                                        {receta.tiempo_prep && (
                                            <div className="flex items-center text-xs text-gray-500 font-medium">
                                                <Clock size={14} className="mr-1 text-gray-400" />
                                                {receta.tiempo_prep} min
                                            </div>
                                        )}
                                        {receta.ingredientes.length > 0 && (
                                            <>
                                                <div className="flex items-center text-xs text-orange-600 font-medium">
                                                    <Flame size={14} className="mr-1" />
                                                    {macros.calorias} kcal
                                                </div>
                                                <div className="flex items-center text-xs text-blue-600 font-medium">
                                                    <Activity size={14} className="mr-1" />
                                                    {macros.proteina} g Prot
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>
                                <ChevronRight className="text-gray-400" size={24} />
                            </div>
                        );
                    })}
                </div>
            )}

            {isSheetCrearOpen && (
                <div className="fixed inset-0 z-50 flex items-end justify-center">
                    <div className="absolute inset-0 bg-black/50" onClick={() => setIsSheetCrearOpen(false)} />
                    <div className="bg-white w-full max-w-md h-[90vh] overflow-y-auto rounded-t-3xl p-6 relative z-10 animate-slide-up flex flex-col">
                        <div className="flex justify-between items-center mb-6 shrink-0">
                            <h3 className="text-xl font-bold text-gray-800">Nueva Receta</h3>
                            <button onClick={() => setIsSheetCrearOpen(false)} className="text-gray-400 bg-gray-100 rounded-full p-2">
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleGuardarReceta} className="flex-1 overflow-y-auto pr-2 space-y-5 pb-10">
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del platillo</label>
                                    <input
                                        type="text" required
                                        className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 outline-none"
                                        value={nuevoNombre} onChange={(e) => setNuevoNombre(e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Tiempo de preparación (minutos)</label>
                                    <input
                                        type="number"
                                        className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 outline-none"
                                        value={nuevoTiempo} onChange={(e) => setNuevoTiempo(e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Procedimiento</label>
                                    <textarea
                                        rows="4" required
                                        className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                                        value={nuevoProc} onChange={(e) => setNuevoProc(e.target.value)}
                                    />
                                </div>
                            </div>

                            <hr className="border-gray-200" />

                            <div>
                                <h4 className="text-sm font-bold text-gray-800 mb-3">Ingredientes Requeridos</h4>
                                <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-4 mb-4">
                                    <div className="grid grid-cols-2 gap-2 mb-2">
                                        <select
                                            className="bg-white border border-gray-200 rounded-lg p-2 text-sm outline-none"
                                            value={tempIngId} onChange={(e) => setTempIngId(e.target.value)}
                                        >
                                            <option value="" disabled>Seleccionar...</option>
                                            {catalogoIngredientes.map(ing => (
                                                <option key={ing.id} value={ing.id}>{ing.nombre} ({ing.unidad.nombre})</option>
                                            ))}
                                        </select>
                                        <input
                                            type="number" step="0.01" placeholder="Cantidad"
                                            className="bg-white border border-gray-200 rounded-lg p-2 text-sm outline-none"
                                            value={tempCant} onChange={(e) => setTempCant(e.target.value)}
                                        />
                                    </div>
                                    <button
                                        type="button" onClick={handleAgregarIngredienteTemp}
                                        className="w-full bg-blue-100 text-blue-700 font-semibold py-2 rounded-lg flex items-center justify-center gap-2 text-sm"
                                    >
                                        <PlusCircle size={16} /> Añadir a la receta
                                    </button>
                                </div>

                                {nuevosIngredientes.length > 0 ? (
                                    <>
                                        <ul className="space-y-2 mb-4">
                                            {nuevosIngredientes.map((req) => (
                                                <li key={req.id_ingrediente} className="flex justify-between items-center bg-gray-50 border border-gray-200 rounded-lg p-3">
                                                    <span className="text-sm text-gray-700 font-medium">{req.ingrediente.nombre}</span>
                                                    <div className="flex items-center gap-3">
                                                        <span className="text-sm font-bold text-blue-700">{req.cantidad_necesaria} {req.ingrediente.unidad.nombre}</span>
                                                        <button type="button" onClick={() => quitarIngredienteTemp(req.id_ingrediente)} className="text-red-400 hover:text-red-600">
                                                            <Trash2 size={18} />
                                                        </button>
                                                    </div>
                                                </li>
                                            ))}
                                        </ul>

                                        <div className="bg-gray-50 rounded-xl p-3 grid grid-cols-4 gap-2 text-center mb-2">
                                            <div>
                                                <p className="text-[10px] text-gray-500 font-semibold uppercase">Kcal</p>
                                                <p className="font-bold text-sm text-orange-600">{calcularMacros(nuevosIngredientes).calorias}</p>
                                            </div>
                                            <div>
                                                <p className="text-[10px] text-gray-500 font-semibold uppercase">Prot</p>
                                                <p className="font-bold text-sm text-blue-600">{calcularMacros(nuevosIngredientes).proteina}g</p>
                                            </div>
                                            <div>
                                                <p className="text-[10px] text-gray-500 font-semibold uppercase">Carb</p>
                                                <p className="font-bold text-sm text-green-600">{calcularMacros(nuevosIngredientes).carbohidratos}g</p>
                                            </div>
                                            <div>
                                                <p className="text-[10px] text-gray-500 font-semibold uppercase">Grasa</p>
                                                <p className="font-bold text-sm text-yellow-600">{calcularMacros(nuevosIngredientes).grasas}g</p>
                                            </div>
                                        </div>
                                    </>
                                ) : (
                                    <p className="text-xs text-center text-gray-400 py-2">No has agregado ingredientes.</p>
                                )}
                            </div>

                            <button
                                type="submit"
                                className="w-full bg-gray-900 text-white font-bold py-4 rounded-xl shadow-md active:bg-black mt-6"
                            >
                                Guardar Receta Completa
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {recetaActiva && (
                <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
                    <div className="absolute inset-0 bg-black/50" onClick={() => setRecetaActiva(null)} />
                    <div className="bg-white w-full max-w-md max-h-[85vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl p-6 relative z-10 animate-slide-up shadow-2xl flex flex-col">

                        <button onClick={() => setRecetaActiva(null)} className="absolute top-5 right-5 text-gray-400 bg-gray-100 rounded-full p-2 z-20">
                            <X size={20} />
                        </button>

                        <div className="overflow-y-auto pr-1 space-y-6 pb-4">
                            <div>
                                <h3 className="font-bold text-2xl text-gray-800 pr-10 leading-tight">{recetaActiva.nombre}</h3>
                                {recetaActiva.tiempo_prep && (
                                    <div className="flex items-center text-gray-500 mt-2 font-medium text-sm">
                                        <Clock size={16} className="mr-1.5" />{recetaActiva.tiempo_prep} minutos
                                    </div>
                                )}
                            </div>

                            {recetaActiva.ingredientes.length > 0 && (
                                <div className="grid grid-cols-4 gap-2 bg-gray-50 border border-gray-100 rounded-2xl p-3 text-center">
                                    <div>
                                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wide">Calorías</p>
                                        <p className="font-bold text-lg text-orange-600">{calcularMacros(recetaActiva.ingredientes).calorias}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wide">Proteína</p>
                                        <p className="font-bold text-lg text-blue-600">{calcularMacros(recetaActiva.ingredientes).proteina}g</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wide">Carbs</p>
                                        <p className="font-bold text-lg text-green-600">{calcularMacros(recetaActiva.ingredientes).carbohidratos}g</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wide">Grasas</p>
                                        <p className="font-bold text-lg text-yellow-600">{calcularMacros(recetaActiva.ingredientes).grasas}g</p>
                                    </div>
                                </div>
                            )}

                            <div>
                                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Procedimiento</h4>
                                {recetaActiva.procedimiento ? (
                                    <p className="text-sm text-gray-700 whitespace-pre-line leading-relaxed">{recetaActiva.procedimiento}</p>
                                ) : (
                                    <p className="text-sm text-gray-400 italic">Sin procedimiento detallado.</p>
                                )}
                            </div>

                            <div className="bg-gray-50 border border-gray-100 rounded-2xl p-4">
                                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Ingredientes requeridos</h4>
                                {recetaActiva.ingredientes.length === 0 ? (
                                    <p className="text-sm text-gray-500 italic">Sin ingredientes asignados actualmente.</p>
                                ) : (
                                    <ul className="space-y-3">
                                        {recetaActiva.ingredientes.map((req) => (
                                            <li key={req.id} className="flex justify-between items-center text-sm border-b border-gray-200/60 pb-3 last:border-0 last:pb-0">
                                                <span className="text-gray-700 font-medium">{req.ingrediente?.nombre}</span>
                                                <div className="flex items-center gap-3">
                                                    <span className="font-bold text-blue-700 bg-blue-100/50 px-3 py-1 rounded-lg">
                                                        {formatearCantidad(req.cantidad_necesaria, req.ingrediente?.unidad?.nombre)}
                                                    </span>
                                                    <button
                                                        onClick={() => handleEliminarIngredienteExistente(req.id_ingrediente)}
                                                        className="text-gray-300 hover:text-red-500 transition-colors p-1"
                                                        title="Eliminar ingrediente de la receta"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>

                            <div className="border border-dashed border-gray-200 rounded-2xl p-4">
                                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">¿Olvidaste un ingrediente? Añádelo aquí</h4>
                                <form onSubmit={handleAgregarIngredienteExistente} className="grid grid-cols-2 gap-2">
                                    <select
                                        required
                                        className="bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-sm outline-none w-full text-gray-700"
                                        value={modalIngId} onChange={(e) => setModalIngId(e.target.value)}
                                    >
                                        <option value="" disabled>Seleccionar...</option>
                                        {catalogoIngredientes.map(ing => (
                                            <option key={ing.id} value={ing.id}>{ing.nombre} ({ing.unidad.nombre})</option>
                                        ))}
                                    </select>
                                    <div className="flex gap-1">
                                        <input
                                            type="number" step="0.01" placeholder="Cant." required
                                            className="bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-sm outline-none w-full text-gray-700"
                                            value={modalCant} onChange={(e) => setModalCant(e.target.value)}
                                        />
                                        <button
                                            type="submit"
                                            className="bg-gray-800 text-white px-3 rounded-xl hover:bg-gray-900 active:scale-95 transition-transform flex items-center justify-center"
                                        >
                                            <Plus size={18} />
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>

                        <button
                            onClick={() => {
                                handleCocinar(recetaActiva.id, recetaActiva.nombre);
                                setRecetaActiva(null);
                            }}
                            disabled={recetaActiva.ingredientes.length === 0}
                            className="w-full bg-blue-600 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 active:bg-blue-700 disabled:bg-gray-300 transition-colors shadow-lg shadow-blue-200 shrink-0 mt-2"
                        >
                            <Play size={20} /> Cocinar esto
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}