import React from 'react';
import { NavLink } from 'react-router-dom';
import { PackageSearch, ShoppingCart, BookOpen } from 'lucide-react';

export default function BottomNav() {
    return (
        <nav className="fixed bottom-0 w-full bg-white border-t border-gray-200 pb-safe">
            <div className="flex justify-around items-center h-16">
                <NavLink to="/" className={({ isActive }) => `flex flex-col items-center ${isActive ? 'text-blue-600' : 'text-gray-500'}`}>
                    <PackageSearch size={24} />
                    <span className="text-xs mt-1">Inventario</span>
                </NavLink>

                <NavLink to="/compras" className={({ isActive }) => `flex flex-col items-center ${isActive ? 'text-blue-600' : 'text-gray-500'}`}>
                    <ShoppingCart size={24} />
                    <span className="text-xs mt-1">Compras</span>
                </NavLink>

                <NavLink to="/recetas" className={({ isActive }) => `flex flex-col items-center ${isActive ? 'text-blue-600' : 'text-gray-500'}`}>
                    <BookOpen size={24} />
                    <span className="text-xs mt-1">Recetas</span>
                </NavLink>
            </div>
        </nav>
    );
}