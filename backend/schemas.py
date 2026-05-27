from pydantic import BaseModel, ConfigDict
from decimal import Decimal
from typing import Optional

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
    # ESTA ES LA LÍNEA QUE FALTABA
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