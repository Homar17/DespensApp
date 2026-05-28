from pydantic import BaseModel, ConfigDict
from decimal import Decimal
from typing import Optional, List
from datetime import datetime

# --- UNIDAD DE MEDIDA ---

class UnidadMedidaBase(BaseModel):
    nombre: str

class UnidadMedidaCreate(UnidadMedidaBase):
    pass

class UnidadMedida(UnidadMedidaBase):
    id: int
    model_config = ConfigDict(from_attributes=True)


# --- INGREDIENTE ---

class IngredienteBase(BaseModel):
    nombre: str
    id_unidad: int
    calorias_por_100: Decimal = Decimal('0.00')
    proteina_por_100: Decimal = Decimal('0.00')
    carbs_por_100: Decimal = Decimal('0.00')
    grasas_por_100: Decimal = Decimal('0.00')

class IngredienteCreate(IngredienteBase):
    pass

class Ingrediente(IngredienteBase):
    id: int
    unidad: Optional[UnidadMedida] = None
    model_config = ConfigDict(from_attributes=True)


# --- INVENTARIO ---

class InventarioBase(BaseModel):
    id_usuario: int
    id_ingrediente: int
    cantidad_actual: Decimal

class InventarioUpdate(BaseModel):
    cantidad_actual: Decimal

class Inventario(InventarioBase):
    ingrediente: Optional[Ingrediente] = None 
    model_config = ConfigDict(from_attributes=True)


# --- USUARIO ---

class UsuarioBase(BaseModel):
    nombre: str
    user_name: str

class UsuarioCreate(UsuarioBase):
    contrasena: str

class Usuario(UsuarioBase):
    id: int
    model_config = ConfigDict(from_attributes=True)


# --- LISTA DE COMPRAS ---

class ListaCompraBase(BaseModel):
    id_usuario: int
    id_ingrediente: int
    cantidad_comprar: Decimal

class ListaCompraCreate(ListaCompraBase):
    pass

class ListaCompraUpdate(BaseModel):
    comprado: bool
    cantidad_comprar: Optional[Decimal] = None

class ListaCompra(ListaCompraBase):
    comprado: bool
    ignorar: bool
    ingrediente: Optional[Ingrediente] = None
    
    model_config = ConfigDict(from_attributes=True)


# --- RECETAS E INGREDIENTES DE RECETA ---

class RecetaIngredienteBase(BaseModel):
    id_ingrediente: int
    cantidad_necesaria: Decimal

class RecetaIngredienteCreate(RecetaIngredienteBase):
    pass

class RecetaIngrediente(RecetaIngredienteBase):
    id: int
    id_receta: int
    ingrediente: Optional[Ingrediente] = None
    model_config = ConfigDict(from_attributes=True)


class RecetaBase(BaseModel):
    nombre: str
    procedimiento: Optional[str] = None
    tiempo_prep: Optional[int] = None

class RecetaCreate(RecetaBase):
    pass

class Receta(RecetaBase):
    id: int
    ingredientes: List[RecetaIngrediente] = []
    model_config = ConfigDict(from_attributes=True)


class UsuarioLogin(BaseModel):
    user_name: str
    contrasena: str


# --- HISTORIAL DE CONSUMO ---

class HistorialConsumoBase(BaseModel):
    id_usuario: int
    id_receta: Optional[int] = None
    total_calorias: Decimal
    total_proteina: Decimal
    total_carbs: Decimal
    total_grasas: Decimal

class HistorialConsumo(HistorialConsumoBase):
    id: int
    fecha_hora: datetime
    receta: Optional[RecetaBase] = None
    model_config = ConfigDict(from_attributes=True)