import React, { useState, useEffect } from 'react';
import { CheckCircle2, Circle, Plus, X, ArrowLeft, Edit2, Trash2 } from 'lucide-react';

export default function ListaCompras() {
    const [lista, setLista] = useState([]);
    const [catalogoIngredientes, setCatalogoIngredientes] = useState([]);
    const [unidades, setUnidades] = useState([]);
    const [cargando, setCargando] = useState(true);

    const [isSheetOpen, setIsSheetOpen] = useState(false);
    const [formIngredienteId, setFormIngredienteId] = useState('');
    const [formCantidad, setFormCantidad] = useState('');

    const [modoCrearIngrediente, setModoCrearIngrediente] = useState(false);
    const [itemEditando, setItemEditando] = useState(null); 
    
    const [nuevoIngNombre, setNuevoIngNombre] = useState('');
    const [nuevoIngUnidadId, setNuevoIngUnidadId] = useState('');
    const [nuevoIngCalorias, setNuevoIngCalorias] = useState('');
    const [nuevoIngProteina, setNuevoIngProteina] = useState('');
    const [nuevoIngCarbs, setNuevoIngCarbs] = useState('');
    const [nuevoIngGrasas, setNuevoIngGrasas] = useState('');

    const ID_USUARIO = parseInt(localStorage.getItem('despensapp_user_id'));

    useEffect(() => {
        cargarDatos();
    }, []);

    const cargarDatos = async () => {
        setCargando(true);
        try {
            const [resLista, resIngredientes, resUnidades] = await Promise.all([
                fetch(`${import.meta.env.VITE_API_URL}/compras/${ID_USUARIO}`),
                fetch(`${import.meta.env.VITE_API_URL}/ingredientes/`),
                fetch(`${import.meta.env.VITE_API_URL}/unidades/`)
            ]);

            if (resLista.ok && resIngredientes.ok && resUnidades.ok) {
                setLista(await resLista.json());
                setCatalogoIngredientes(await resIngredientes.json());
                setUnidades(await resUnidades.json());
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

    const toggleComprado = async (id_ingrediente, estado_actual) => {
        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/compras/${ID_USUARIO}/${id_ingrediente}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ comprado: !estado_actual })
            });

            if (response.ok) {
                setLista(lista.map(item =>
                    item.id_ingrediente === id_ingrediente ? { ...item, comprado: !estado_actual } : item
                ));
            }
        } catch (error) {
            console.error("Error al actualizar el estado:", error);
        }
    };

    const handleAgregarManual = async (e) => {
        e.preventDefault();
        if (!formIngredienteId || !formCantidad) return;
        
        if (parseFloat(formCantidad) <= 0) {
            alert("La cantidad debe ser mayor a 0");
            return;
        }

        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/compras/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id_usuario: ID_USUARIO,
                    id_ingrediente: parseInt(formIngredienteId),
                    cantidad_comprar: parseFloat(formCantidad)
                })
            });

            if (response.ok) {
                cerrarSheet();
                cargarDatos();
            }
        } catch (error) {
            console.error("Error al agregar a la lista:", error);
        }
    };

    const handleGuardarEdicion = async (e) => {
        e.preventDefault();
        if (!formCantidad || !itemEditando) return;

        if (parseFloat(formCantidad) <= 0) {
            alert("La cantidad debe ser mayor a 0");
            return;
        }

        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/compras/${ID_USUARIO}/${itemEditando.id_ingrediente}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    comprado: itemEditando.comprado,
                    cantidad_comprar: parseFloat(formCantidad) 
                })
            });

            if (response.ok) {
                cerrarSheet();
                cargarDatos();
            }
        } catch (error) {
            console.error("Error al editar la cantidad:", error);
        }
    };

    // Nueva función para eliminar el ingrediente de la lista
    const handleEliminar = async () => {
        if (!itemEditando) return;
        
        // Ventana de confirmación nativa para evitar borrados accidentales
        const confirmar = window.confirm(`¿Seguro que deseas eliminar ${itemEditando.ingrediente.nombre} de tu lista?`);
        if (!confirmar) return;

        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/compras/${ID_USUARIO}/${itemEditando.id_ingrediente}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                cerrarSheet();
                cargarDatos();
            } else {
                alert("Hubo un problema al eliminar el registro.");
            }
        } catch (error) {
            console.error("Error al eliminar:", error);
        }
    };

    const abrirParaEditar = (item) => {
        setItemEditando(item);
        setFormCantidad(item.cantidad_comprar.toString());
        setIsSheetOpen(true);
    };

    const handleCrearIngrediente = async (e) => {
        e.preventDefault();
        if (!nuevoIngNombre || !nuevoIngUnidadId) return;

        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/ingredientes/batch/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify([{
                    nombre: nuevoIngNombre,
                    id_unidad: parseInt(nuevoIngUnidadId),
                    calorias_por_100: parseFloat(nuevoIngCalorias) || 0,
                    proteina_por_100: parseFloat(nuevoIngProteina) || 0,
                    carbs_por_100: parseFloat(nuevoIngCarbs) || 0,
                    grasas_por_100: parseFloat(nuevoIngGrasas) || 0
                }])
            });

            if (response.ok) {
                const nuevosIngredientes = await response.json();
                const resIngredientes = await fetch(`${import.meta.env.VITE_API_URL}/ingredientes/`);
                const catalogoActualizado = await resIngredientes.json();
                
                setCatalogoIngredientes(catalogoActualizado);

                if (nuevosIngredientes.length > 0) {
                    setFormIngredienteId(nuevosIngredientes[0].id);
                }

                setNuevoIngNombre('');
                setNuevoIngUnidadId('');
                setNuevoIngCalorias('');
                setNuevoIngProteina('');
                setNuevoIngCarbs('');
                setNuevoIngGrasas('');
                setModoCrearIngrediente(false);
            }
        } catch (error) {
            console.error("Error al crear el ingrediente:", error);
        }
    };

    const cerrarSheet = () => {
        setIsSheetOpen(false);
        setModoCrearIngrediente(false);
        setItemEditando(null);
        setFormIngredienteId('');
        setFormCantidad('');
        setNuevoIngNombre('');
        setNuevoIngUnidadId('');
        setNuevoIngCalorias('');
        setNuevoIngProteina('');
        setNuevoIngCarbs('');
        setNuevoIngGrasas('');
    };

    if (cargando) {
        return (
            <div className="flex justify-center items-center h-full mt-20">
                <p className="text-gray-500 font-medium">Cargando lista...</p>
            </div>
        );
    }

    const pendientes = lista.filter(item => !item.comprado);
    const comprados = lista.filter(item => item.comprado);

    return (
        <div className="relative min-h-screen pb-20">
            <div className="p-5">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800">Lista de Compras</h2>
                        <p className="text-sm text-gray-500">Lo que falta en la alacena</p>
                    </div>
                    <button
                        onClick={() => setIsSheetOpen(true)}
                        className="bg-blue-600 text-white p-3 rounded-full shadow-md hover:bg-blue-700 active:scale-95 transition-all"
                    >
                        <Plus size={24} />
                    </button>
                </div>

                {lista.length === 0 ? (
                    <div className="text-center mt-20 p-6 bg-gray-50 rounded-2xl border border-dashed border-gray-300">
                        <p className="text-gray-500">Tu lista está vacía.</p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {pendientes.length > 0 && (
                            <div className="space-y-3">
                                <h3 className="font-semibold text-gray-700 mb-2">Por comprar</h3>
                                {pendientes.map((item) => (
                                    <div
                                        key={item.id_ingrediente}
                                        className="bg-white border border-gray-100 p-4 rounded-2xl shadow-sm flex items-center gap-4 cursor-pointer active:scale-[0.98] transition-transform"
                                        onClick={() => toggleComprado(item.id_ingrediente, item.comprado)}
                                    >
                                        <Circle className="text-gray-300 min-w-6" size={24} />
                                        <div className="flex-1">
                                            <h4 className="font-semibold text-gray-800">{item.ingrediente.nombre}</h4>
                                        </div>
                                        <div 
                                            className="flex items-center gap-2 text-blue-600 font-bold bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg active:scale-95 transition-all"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                abrirParaEditar(item);
                                            }}
                                        >
                                            <span>{formatearCantidad(item.cantidad_comprar, item.ingrediente.unidad.nombre)}</span>
                                            <Edit2 size={14} className="opacity-70" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {comprados.length > 0 && (
                            <div className="space-y-3 opacity-60 mt-6">
                                <h3 className="font-semibold text-gray-700 mb-2">En el carrito</h3>
                                {comprados.map((item) => (
                                    <div
                                        key={item.id_ingrediente}
                                        className="bg-gray-50 border border-gray-100 p-4 rounded-2xl flex items-center gap-4 cursor-pointer active:scale-[0.98] transition-transform"
                                        onClick={() => toggleComprado(item.id_ingrediente, item.comprado)}
                                    >
                                        <CheckCircle2 className="text-green-500 min-w-6" size={24} />
                                        <div className="flex-1">
                                            <h4 className="font-medium text-gray-500 line-through">{item.ingrediente.nombre}</h4>
                                        </div>
                                        <div 
                                            className="text-gray-400 font-medium line-through bg-gray-200/50 px-3 py-1.5 rounded-lg hover:bg-gray-200 transition-all"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                abrirParaEditar(item);
                                            }}
                                        >
                                            {formatearCantidad(item.cantidad_comprar, item.ingrediente.unidad.nombre)}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {isSheetOpen && (
                <div
                    className="fixed inset-0 bg-black/40 z-40 transition-opacity"
                    onClick={cerrarSheet}
                />
            )}

            <div
                className={`fixed bottom-0 left-0 right-0 max-h-[90vh] overflow-y-auto max-w-md mx-auto bg-white rounded-t-3xl p-6 z-50 transform transition-transform duration-300 ease-in-out ${isSheetOpen ? 'translate-y-0' : 'translate-y-full'
                    }`}
            >
                <div className="flex justify-between items-center mb-6">
                    {itemEditando ? (
                        <h3 className="text-xl font-bold text-gray-800">Modificar Faltante</h3>
                    ) : modoCrearIngrediente ? (
                        <div className="flex items-center gap-2">
                            <button onClick={() => setModoCrearIngrediente(false)} className="text-gray-400 hover:text-gray-600 p-1">
                                <ArrowLeft size={20} />
                            </button>
                            <h3 className="text-xl font-bold text-gray-800">Nuevo Ingrediente</h3>
                        </div>
                    ) : (
                        <h3 className="text-xl font-bold text-gray-800">Agregar a la lista</h3>
                    )}

                    <button onClick={cerrarSheet} className="text-gray-400 hover:text-gray-600 bg-gray-100 rounded-full p-2">
                        <X size={20} />
                    </button>
                </div>

                {/* Vista 1: Formulario de Edición y Eliminación */}
                {itemEditando ? (
                    <form onSubmit={handleGuardarEdicion} className="space-y-4 pb-8 animate-fade-in">
                        <div>
                            <p className="text-sm font-medium text-gray-500 mb-4">
                                Actualizando cantidad para: <span className="font-bold text-gray-800">{itemEditando.ingrediente.nombre}</span>
                            </p>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Nueva Cantidad ({itemEditando.ingrediente.unidad.nombre})
                            </label>
                            <input
                                type="number"
                                step="0.01"
                                min="0.01"
                                className="w-full bg-gray-50 border border-gray-200 text-gray-800 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 outline-none"
                                placeholder="Ingresa la nueva cantidad"
                                value={formCantidad}
                                onChange={(e) => setFormCantidad(e.target.value)}
                                required
                            />
                        </div>
                        
                        <div className="flex gap-3 mt-4">
                            <button
                                type="button"
                                onClick={handleEliminar}
                                className="flex items-center justify-center gap-2 w-1/3 bg-red-50 text-red-600 font-bold rounded-xl p-4 shadow-sm hover:bg-red-100 active:scale-95 transition-all"
                            >
                                <Trash2 size={20} />
                            </button>
                            <button
                                type="submit"
                                className="w-2/3 bg-blue-600 text-white font-bold rounded-xl p-4 shadow-md active:bg-blue-700 active:scale-95 transition-all"
                            >
                                Actualizar
                            </button>
                        </div>
                    </form>
                
                ) : modoCrearIngrediente ? (
                    <form onSubmit={handleCrearIngrediente} className="space-y-5 pb-8 animate-fade-in">
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del producto</label>
                                <input
                                    type="text"
                                    className="w-full bg-gray-50 border border-gray-200 text-gray-800 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 outline-none"
                                    placeholder="Ej. Pechuga de pollo"
                                    value={nuevoIngNombre}
                                    onChange={(e) => setNuevoIngNombre(e.target.value)}
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Unidad de medida</label>
                                <select
                                    className="w-full bg-gray-50 border border-gray-200 text-gray-800 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 outline-none"
                                    value={nuevoIngUnidadId}
                                    onChange={(e) => setNuevoIngUnidadId(e.target.value)}
                                    required
                                >
                                    <option value="" disabled>Selecciona la unidad base</option>
                                    {unidades.map(u => (
                                        <option key={u.id} value={u.id}>{u.nombre}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <hr className="border-gray-100" />

                        <div>
                            <h4 className="text-sm font-bold text-gray-800 mb-3">Información Nutricional</h4>
                            <p className="text-xs text-gray-500 mb-4">
                                Ingresa los valores por cada <strong>100 gr/ml</strong> o por <strong>1 pieza</strong>.
                            </p>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">Calorías (kcal)</label>
                                    <input
                                        type="number" step="0.1" min="0"
                                        className="w-full bg-orange-50/50 border border-orange-100 text-gray-800 rounded-xl p-2.5 focus:ring-2 focus:ring-orange-400 outline-none"
                                        placeholder="0"
                                        value={nuevoIngCalorias}
                                        onChange={(e) => setNuevoIngCalorias(e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">Proteína (g)</label>
                                    <input
                                        type="number" step="0.1" min="0"
                                        className="w-full bg-blue-50/50 border border-blue-100 text-gray-800 rounded-xl p-2.5 focus:ring-2 focus:ring-blue-400 outline-none"
                                        placeholder="0"
                                        value={nuevoIngProteina}
                                        onChange={(e) => setNuevoIngProteina(e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">Carbohidratos (g)</label>
                                    <input
                                        type="number" step="0.1" min="0"
                                        className="w-full bg-green-50/50 border border-green-100 text-gray-800 rounded-xl p-2.5 focus:ring-2 focus:ring-green-400 outline-none"
                                        placeholder="0"
                                        value={nuevoIngCarbs}
                                        onChange={(e) => setNuevoIngCarbs(e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">Grasas (g)</label>
                                    <input
                                        type="number" step="0.1" min="0"
                                        className="w-full bg-yellow-50/50 border border-yellow-100 text-gray-800 rounded-xl p-2.5 focus:ring-2 focus:ring-yellow-400 outline-none"
                                        placeholder="0"
                                        value={nuevoIngGrasas}
                                        onChange={(e) => setNuevoIngGrasas(e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>

                        <button
                            type="submit"
                            className="w-full bg-gray-900 text-white font-bold rounded-xl p-4 mt-2 shadow-md active:bg-gray-800"
                        >
                            Guardar Ingrediente
                        </button>
                    </form>
                
                {/* Vista 3: Formulario Agregar a la Lista */}
                ) : (
                    <form onSubmit={handleAgregarManual} className="space-y-4 pb-8 animate-fade-in">
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

                            <button
                                type="button"
                                onClick={() => setModoCrearIngrediente(true)}
                                className="text-sm text-blue-600 font-medium mt-2 hover:underline"
                            >
                                ¿No está en la lista? Crear nuevo
                            </button>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Cantidad a comprar
                            </label>
                            <input
                                type="number"
                                step="0.01"
                                min="0.01"
                                className="w-full bg-gray-50 border border-gray-200 text-gray-800 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 outline-none"
                                placeholder="Ej. 1000 (para 1kg)"
                                value={formCantidad}
                                onChange={(e) => setFormCantidad(e.target.value)}
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            className="w-full bg-blue-600 text-white font-bold rounded-xl p-4 mt-4 shadow-md active:bg-blue-700"
                        >
                            Añadir faltante
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
}