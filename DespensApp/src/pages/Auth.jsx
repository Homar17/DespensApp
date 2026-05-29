import React, { useState } from 'react';
import { User, Lock, ArrowRight, UserPlus } from 'lucide-react';

export default function Auth({ onLoginSuccess }) {
    const [isLogin, setIsLogin] = useState(true);
    const [cargando, setCargando] = useState(false);
    const [error, setError] = useState('');

    // Form states
    const [nombre, setNombre] = useState('');
    const [userName, setUserName] = useState('');
    const [contrasena, setContrasena] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setCargando(true);

        const url = isLogin ? `${import.meta.env.VITE_API_URL}/login/` : `${import.meta.env.VITE_API_URL}/usuarios/`;

        const payload = isLogin
            ? { user_name: userName, contrasena: contrasena }
            : { nombre: nombre, user_name: userName, contrasena: contrasena };

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const data = await response.json();

            if (response.ok) {
                // Guardamos el ID del usuario en el navegador
                localStorage.setItem('despensapp_user_id', data.id);
                localStorage.setItem('despensapp_user_name', data.nombre);
                // Notificamos a App.jsx que el login fue exitoso
                onLoginSuccess(data.id);
            } else {
                setError(data.detail || 'Ocurrió un error en la autenticación');
            }
        } catch (err) {
            setError('Error al conectar con el servidor');
        } finally {
            setCargando(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center p-5">
            <div className="w-full max-w-md bg-white rounded-3xl shadow-xl overflow-hidden">

                {/* Cabecera */}
                <div className="bg-blue-600 p-8 text-center text-white">
                    <h1 className="text-3xl font-bold mb-2">DespensApp</h1>
                    <p className="text-blue-100 text-sm">
                        {isLogin ? 'Bienvenido de nuevo a tu cocina' : 'Comienza a organizar tu alacena'}
                    </p>
                </div>

                {/* Formulario */}
                <div className="p-8">
                    {error && (
                        <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm text-center mb-6 border border-red-100">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        {!isLogin && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre completo</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <User className="text-gray-400" size={18} />
                                    </div>
                                    <input
                                        type="text" required={!isLogin}
                                        className="w-full pl-10 pr-3 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-gray-700"
                                        placeholder="Ej. Juan Pérez"
                                        value={nombre} onChange={(e) => setNombre(e.target.value)}
                                    />
                                </div>
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre de usuario</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <UserPlus className="text-gray-400" size={18} />
                                </div>
                                <input
                                    type="text" required
                                    className="w-full pl-10 pr-3 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-gray-700"
                                    placeholder="Ej. juanperez123"
                                    value={userName} onChange={(e) => setUserName(e.target.value)}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Lock className="text-gray-400" size={18} />
                                </div>
                                <input
                                    type="password" required
                                    className="w-full pl-10 pr-3 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-gray-700"
                                    placeholder="••••••••"
                                    value={contrasena} onChange={(e) => setContrasena(e.target.value)}
                                />
                            </div>
                        </div>

                        <button
                            type="submit" disabled={cargando}
                            className="w-full bg-gray-900 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 active:scale-95 transition-all mt-6 disabled:bg-gray-400"
                        >
                            {cargando ? 'Procesando...' : isLogin ? 'Ingresar' : 'Crear cuenta'}
                            {!cargando && <ArrowRight size={18} />}
                        </button>
                    </form>

                    {/* Toggle Login/Registro */}
                    <div className="mt-8 text-center">
                        <button
                            type="button"
                            onClick={() => {
                                setIsLogin(!isLogin);
                                setError('');
                            }}
                            className="text-sm text-gray-500 hover:text-blue-600 font-medium transition-colors"
                        >
                            {isLogin
                                ? '¿No tienes cuenta? Regístrate aquí'
                                : '¿Ya tienes cuenta? Inicia sesión'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}