from sqlalchemy import Column, Integer, String, Text, ForeignKey, Boolean, Numeric, DateTime
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from database import Base

class Usuario(Base):
    __tablename__ = "usuarios"

    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(50), nullable=False)
    user_name = Column(String(50), unique=True, index=True, nullable=False)
    contrasena = Column(String(255), nullable=False)

    # Relaciones
    inventarios = relationship("Inventario", back_populates="usuario")
    listas_compras = relationship("ListaCompra", back_populates="usuario")
    historial = relationship("HistorialConsumo", back_populates="usuario")


class UnidadMedida(Base):
    __tablename__ = "unidades_medida"

    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(5), unique=True, nullable=False)

    # Relaciones
    ingredientes = relationship("Ingrediente", back_populates="unidad")


class Ingrediente(Base):
    __tablename__ = "ingredientes"

    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(50), nullable=False)
    id_unidad = Column(Integer, ForeignKey("unidades_medida.id"), nullable=False)
    
    # Nuevas columnas nutricionales (valores por cada 100gr/ml o 1 pza)
    calorias_por_100 = Column(Numeric(8, 2), default=0.00)
    proteina_por_100 = Column(Numeric(8, 2), default=0.00)
    carbs_por_100 = Column(Numeric(8, 2), default=0.00)
    grasas_por_100 = Column(Numeric(8, 2), default=0.00)

    # Relaciones
    unidad = relationship("UnidadMedida", back_populates="ingredientes")
    recetas = relationship("RecetaIngrediente", back_populates="ingrediente")
    inventarios = relationship("Inventario", back_populates="ingrediente")
    listas_compras = relationship("ListaCompra", back_populates="ingrediente")


class Receta(Base):
    __tablename__ = "recetas"

    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(100), nullable=False)
    procedimiento = Column(Text, nullable=False)
    tiempo_prep = Column(Integer, nullable=True)

    # Relaciones
    ingredientes = relationship("RecetaIngrediente", back_populates="receta")
    historial = relationship("HistorialConsumo", back_populates="receta")


class RecetaIngrediente(Base):
    __tablename__ = "recetas_ingredientes"

    id = Column(Integer, primary_key=True, index=True)
    id_receta = Column(Integer, ForeignKey("recetas.id"), nullable=False)
    id_ingrediente = Column(Integer, ForeignKey("ingredientes.id"), nullable=False)
    cantidad_necesaria = Column(Numeric(8, 2), nullable=False)

    # Relaciones
    receta = relationship("Receta", back_populates="ingredientes")
    ingrediente = relationship("Ingrediente", back_populates="recetas")


class Inventario(Base):
    __tablename__ = "inventarios"

    id_usuario = Column(Integer, ForeignKey("usuarios.id"), primary_key=True)
    id_ingrediente = Column(Integer, ForeignKey("ingredientes.id"), primary_key=True)
    cantidad_actual = Column(Numeric(8, 2), default=0.00, nullable=False)

    # Relaciones
    usuario = relationship("Usuario", back_populates="inventarios")
    ingrediente = relationship("Ingrediente", back_populates="inventarios")


class ListaCompra(Base):
    __tablename__ = "listas_compras"

    id_usuario = Column(Integer, ForeignKey("usuarios.id"), primary_key=True)
    id_ingrediente = Column(Integer, ForeignKey("ingredientes.id"), primary_key=True)
    cantidad_comprar = Column(Numeric(8, 2), default=0.00, nullable=False)
    comprado = Column(Boolean, default=False, nullable=False)
    ignorar = Column(Boolean, default=False, nullable=False)

    # Relaciones
    usuario = relationship("Usuario", back_populates="listas_compras")
    ingrediente = relationship("Ingrediente", back_populates="listas_compras")


class HistorialConsumo(Base):
    __tablename__ = "historial_consumo"

    id = Column(Integer, primary_key=True, index=True)
    id_usuario = Column(Integer, ForeignKey("usuarios.id"), nullable=False)
    id_receta = Column(Integer, ForeignKey("recetas.id"), nullable=True)
    fecha_hora = Column(DateTime(timezone=True), server_default=func.now())
    
    # Totales calculados en el momento del consumo
    total_calorias = Column(Numeric(8, 2), default=0.00)
    total_proteina = Column(Numeric(8, 2), default=0.00)
    total_carbs = Column(Numeric(8, 2), default=0.00)
    total_grasas = Column(Numeric(8, 2), default=0.00)

    # Relaciones ORM añadidas para facilitar consultas cruzadas
    usuario = relationship("Usuario", back_populates="historial")
    receta = relationship("Receta", back_populates="historial")