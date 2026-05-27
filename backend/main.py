from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List

import models
import schemas
from database import engine, SessionLocal

models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="DespensApp API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@app.get("/")
def read_root():
    return {"mensaje": "Backend de DespensApp funcionando correctamente y base de datos inicializada"}


# --- ENDPOINTS PARA UNIDADES DE MEDIDA ---

@app.post("/unidades/", response_model=schemas.UnidadMedida, status_code=status.HTTP_201_CREATED)
def crear_unidad(unidad: schemas.UnidadMedidaCreate, db: Session = Depends(get_db)):
    db_unidad_existente = db.query(models.UnidadMedida).filter(models.UnidadMedida.nombre == unidad.nombre).first()
    if db_unidad_existente:
        raise HTTPException(status_code=400, detail="La unidad de medida ya está registrada")
    
    nuevo_modelo = models.UnidadMedida(nombre=unidad.nombre)
    db.add(nuevo_modelo)
    db.commit()
    db.refresh(nuevo_modelo)
    return nuevo_modelo


@app.get("/unidades/", response_model=List[schemas.UnidadMedida])
def obtener_unidades(db: Session = Depends(get_db)):
    return db.query(models.UnidadMedida).all()


# --- ENDPOINTS PARA INGREDIENTES ---

@app.post("/ingredientes/batch/", response_model=List[schemas.Ingrediente], status_code=status.HTTP_201_CREATED)
def crear_multiples_ingredientes(ingredientes: List[schemas.IngredienteCreate], db: Session = Depends(get_db)):
    nuevos_ingredientes = []
    
    for item in ingredientes:
        db_unidad = db.query(models.UnidadMedida).filter(models.UnidadMedida.id == item.id_unidad).first()
        if not db_unidad:
            continue 
            
        db_ingrediente_existente = db.query(models.Ingrediente).filter(models.Ingrediente.nombre == item.nombre).first()
        if db_ingrediente_existente:
            continue 
            
        nuevo_ingrediente = models.Ingrediente(
            nombre=item.nombre,
            id_unidad=item.id_unidad
        )
        db.add(nuevo_ingrediente)
        nuevos_ingredientes.append(nuevo_ingrediente)
        
    db.commit()
    
    for ingrediente in nuevos_ingredientes:
        db.refresh(ingrediente)
        
    return nuevos_ingredientes

@app.get("/ingredientes/", response_model=List[schemas.Ingrediente])
def obtener_ingredientes(db: Session = Depends(get_db)):
    return db.query(models.Ingrediente).all()

# --- ENDPOINTS PARA USUARIOS ---

@app.post("/usuarios/", response_model=schemas.Usuario, status_code=status.HTTP_201_CREATED)
def crear_usuario(usuario: schemas.UsuarioCreate, db: Session = Depends(get_db)):
    # Verificar si el nombre de usuario ya existe
    db_usuario = db.query(models.Usuario).filter(models.Usuario.user_name == usuario.user_name).first()
    if db_usuario:
        raise HTTPException(status_code=400, detail="El nombre de usuario ya está registrado")
        
    nuevo_usuario = models.Usuario(
        nombre=usuario.nombre,
        user_name=usuario.user_name,
        contrasena=usuario.contrasena 
    )
    db.add(nuevo_usuario)
    db.commit()
    db.refresh(nuevo_usuario)
    return nuevo_usuario

# --- ENDPOINTS PARA INVENTARIO ---

@app.post("/inventario/", response_model=schemas.Inventario)
def registrar_inventario(item: schemas.InventarioBase, db: Session = Depends(get_db)):
    # Buscar si el usuario ya tiene este ingrediente registrado
    db_inventario = db.query(models.Inventario).filter(
        models.Inventario.id_usuario == item.id_usuario,
        models.Inventario.id_ingrediente == item.id_ingrediente
    ).first()

    if db_inventario:
        # Si existe, sumamos la cantidad nueva al stock actual
        db_inventario.cantidad_actual += item.cantidad_actual
    else:
        # Si no existe, creamos el registro en la tabla
        db_inventario = models.Inventario(
            id_usuario=item.id_usuario,
            id_ingrediente=item.id_ingrediente,
            cantidad_actual=item.cantidad_actual
        )
        db.add(db_inventario)

    db.commit()
    db.refresh(db_inventario)
    return db_inventario

@app.get("/inventario/{id_usuario}", response_model=List[schemas.Inventario])
def obtener_inventario(id_usuario: int, db: Session = Depends(get_db)):
    # Devuelve todos los ingredientes que el usuario tiene en stock
    return db.query(models.Inventario).filter(models.Inventario.id_usuario == id_usuario).all()