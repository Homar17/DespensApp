from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List
from decimal import Decimal
from datetime import date
from sqlalchemy import cast, Date
import bcrypt

import models
import schemas
from database import engine, SessionLocal

# Funciones de seguridad nativas con bcrypt (sin passlib)
def obtener_hash_contrasena(contrasena: str) -> str:
    salt = bcrypt.gensalt()
    contrasena_bytes = contrasena.encode('utf-8')
    hash_bytes = bcrypt.hashpw(contrasena_bytes, salt)
    return hash_bytes.decode('utf-8')

def verificar_contrasena(contrasena_plana: str, contrasena_hasheada: str) -> bool:
    contrasena_plana_bytes = contrasena_plana.encode('utf-8')
    contrasena_hasheada_bytes = contrasena_hasheada.encode('utf-8')
    return bcrypt.checkpw(contrasena_plana_bytes, contrasena_hasheada_bytes)

models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="DespensApp API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
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
            id_unidad=item.id_unidad,
            calorias_por_100=item.calorias_por_100,
            proteina_por_100=item.proteina_por_100,
            carbs_por_100=item.carbs_por_100,
            grasas_por_100=item.grasas_por_100
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
    db_usuario = db.query(models.Usuario).filter(models.Usuario.user_name == usuario.user_name).first()
    if db_usuario:
        raise HTTPException(status_code=400, detail="El nombre de usuario ya está registrado")

    nuevo_usuario = models.Usuario(
        nombre=usuario.nombre,
        user_name=usuario.user_name,
        contrasena=obtener_hash_contrasena(usuario.contrasena)
    )
    db.add(nuevo_usuario)
    db.commit()
    db.refresh(nuevo_usuario)
    return nuevo_usuario


# --- ENDPOINTS PARA INVENTARIO ---

@app.post("/inventario/", response_model=schemas.Inventario)
def registrar_inventario(item: schemas.InventarioBase, db: Session = Depends(get_db)):
    db_inventario = db.query(models.Inventario).filter(
        models.Inventario.id_usuario == item.id_usuario,
        models.Inventario.id_ingrediente == item.id_ingrediente
    ).first()

    if db_inventario:
        db_inventario.cantidad_actual += item.cantidad_actual
    else:
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
    return db.query(models.Inventario).filter(models.Inventario.id_usuario == id_usuario).all()


# --- ENDPOINTS PARA LISTA DE COMPRAS ---

@app.post("/compras/", response_model=schemas.ListaCompra)
def agregar_a_lista(item: schemas.ListaCompraCreate, db: Session = Depends(get_db)):
    db_item = db.query(models.ListaCompra).filter(
        models.ListaCompra.id_usuario == item.id_usuario,
        models.ListaCompra.id_ingrediente == item.id_ingrediente
    ).first()

    if db_item:
        db_item.cantidad_comprar += item.cantidad_comprar
        db_item.comprado = False 
    else:
        db_item = models.ListaCompra(
            id_usuario=item.id_usuario,
            id_ingrediente=item.id_ingrediente,
            cantidad_comprar=item.cantidad_comprar
        )
        db.add(db_item)

    db.commit()
    db.refresh(db_item)
    return db_item

@app.get("/compras/{id_usuario}", response_model=List[schemas.ListaCompra])
def obtener_lista_compras(id_usuario: int, db: Session = Depends(get_db)):
    return db.query(models.ListaCompra).filter(models.ListaCompra.id_usuario == id_usuario).all()

@app.put("/compras/{id_usuario}/{id_ingrediente}", response_model=schemas.ListaCompra)
def actualizar_estado_compra(id_usuario: int, id_ingrediente: int, estado: schemas.ListaCompraUpdate, db: Session = Depends(get_db)):
    db_item = db.query(models.ListaCompra).filter(
        models.ListaCompra.id_usuario == id_usuario,
        models.ListaCompra.id_ingrediente == id_ingrediente
    ).first()
    
    if not db_item:
        raise HTTPException(status_code=404, detail="El ingrediente no está en la lista de compras")
        
    if estado.comprado and not db_item.comprado:
        db_inventario = db.query(models.Inventario).filter(
            models.Inventario.id_usuario == id_usuario,
            models.Inventario.id_ingrediente == id_ingrediente
        ).first()
        
        if db_inventario:
            db_inventario.cantidad_actual += db_item.cantidad_comprar
        else:
            nuevo_inventario = models.Inventario(
                id_usuario=id_usuario,
                id_ingrediente=id_ingrediente,
                cantidad_actual=db_item.cantidad_comprar
            )
            db.add(nuevo_inventario)
            
    elif not estado.comprado and db_item.comprado:
        db_inventario = db.query(models.Inventario).filter(
            models.Inventario.id_usuario == id_usuario,
            models.Inventario.id_ingrediente == id_ingrediente
        ).first()
        
        if db_inventario:
            db_inventario.cantidad_actual -= db_item.cantidad_comprar
            if db_inventario.cantidad_actual < 0:
                db_inventario.cantidad_actual = 0

    db_item.comprado = estado.comprado
    if estado.cantidad_comprar is not None:
        db_item.cantidad_comprar = estado.cantidad_comprar
        
    db.commit()
    db.refresh(db_item)
    return db_item


# --- ENDPOINTS PARA RECETAS Y CONSUMO ---

@app.post("/recetas/", response_model=schemas.Receta, status_code=status.HTTP_201_CREATED)
def crear_receta(receta: schemas.RecetaCreate, db: Session = Depends(get_db)):
    nueva_receta = models.Receta(
        nombre=receta.nombre,
        procedimiento=receta.procedimiento,
        tiempo_prep=receta.tiempo_prep
    )
    db.add(nueva_receta)
    db.commit()
    db.refresh(nueva_receta)
    return nueva_receta

@app.get("/recetas/", response_model=List[schemas.Receta])
def obtener_recetas(db: Session = Depends(get_db)):
    return db.query(models.Receta).all()

@app.post("/recetas/{id_receta}/ingredientes/", response_model=schemas.RecetaIngrediente, status_code=status.HTTP_201_CREATED)
def agregar_ingrediente_receta(id_receta: int, ingrediente: schemas.RecetaIngredienteCreate, db: Session = Depends(get_db)):
    nuevo_req = models.RecetaIngrediente(
        id_receta=id_receta,
        id_ingrediente=ingrediente.id_ingrediente,
        cantidad_necesaria=ingrediente.cantidad_necesaria
    )
    db.add(nuevo_req)
    db.commit()
    db.refresh(nuevo_req)
    return nuevo_req

@app.post("/recetas/{id_receta}/cocinar/")
def cocinar_receta(id_receta: int, id_usuario: int, db: Session = Depends(get_db)):
    receta = db.query(models.Receta).filter(models.Receta.id == id_receta).first()
    if not receta:
        raise HTTPException(status_code=404, detail="Receta no encontrada")

    ingredientes_receta = db.query(models.RecetaIngrediente).filter(models.RecetaIngrediente.id_receta == id_receta).all()
    if not ingredientes_receta:
        raise HTTPException(status_code=400, detail="La receta no tiene ingredientes registrados")

    total_cal = Decimal('0.0')
    total_prot = Decimal('0.0')
    total_carb = Decimal('0.0')
    total_gras = Decimal('0.0')

    for req in ingredientes_receta:
        db_ingrediente = req.ingrediente
        if db_ingrediente.unidad.nombre.lower() in ['gr', 'ml']:
            factor = req.cantidad_necesaria / Decimal('100.0')
        else:
            factor = req.cantidad_necesaria

        total_cal += db_ingrediente.calorias_por_100 * factor
        total_prot += db_ingrediente.proteina_por_100 * factor
        total_carb += db_ingrediente.carbs_por_100 * factor
        total_gras += db_ingrediente.grasas_por_100 * factor

        inventario = db.query(models.Inventario).filter(
            models.Inventario.id_usuario == id_usuario,
            models.Inventario.id_ingrediente == req.id_ingrediente
        ).first()

        if inventario:
            inventario.cantidad_actual -= req.cantidad_necesaria
            
            if inventario.cantidad_actual <= 0:
                inventario.cantidad_actual = 0
                item_compra = db.query(models.ListaCompra).filter(
                    models.ListaCompra.id_usuario == id_usuario,
                    models.ListaCompra.id_ingrediente == req.id_ingrediente
                ).first()

                if item_compra:
                    item_compra.cantidad_comprar += req.cantidad_necesaria
                    item_compra.comprado = False
                else:
                    nuevo_item = models.ListaCompra(
                        id_usuario=id_usuario,
                        id_ingrediente=req.id_ingrediente,
                        cantidad_comprar=req.cantidad_necesaria 
                    )
                    db.add(nuevo_item)
        
        else:
            item_compra = db.query(models.ListaCompra).filter(
                models.ListaCompra.id_usuario == id_usuario,
                models.ListaCompra.id_ingrediente == req.id_ingrediente
            ).first()

            if item_compra:
                item_compra.cantidad_comprar += req.cantidad_necesaria
                item_compra.comprado = False
            else:
                nuevo_item = models.ListaCompra(
                    id_usuario=id_usuario,
                    id_ingrediente=req.id_ingrediente,
                    cantidad_comprar=req.cantidad_necesaria
                )
                db.add(nuevo_item)

    nuevo_historial = models.HistorialConsumo(
        id_usuario=id_usuario,
        id_receta=id_receta,
        total_calorias=total_cal,
        total_proteina=total_prot,
        total_carbs=total_carb,
        total_grasas=total_gras
    )
    db.add(nuevo_historial)

    db.commit()
    return {"mensaje": "Inventario actualizado y consumo nutricional registrado exitosamente."}

@app.delete("/recetas/{id_receta}/ingredientes/{id_ingrediente}", status_code=status.HTTP_200_OK)
def eliminar_ingrediente_receta(id_receta: int, id_ingrediente: int, db: Session = Depends(get_db)):
    db_registro = db.query(models.RecetaIngrediente).filter(
        models.RecetaIngrediente.id_receta == id_receta,
        models.RecetaIngrediente.id_ingrediente == id_ingrediente
    ).first()
    
    if not db_registro:
        raise HTTPException(status_code=404, detail="Ingrediente no encontrado en esta receta")
        
    db.delete(db_registro)
    db.commit()
    return {"mensaje": "Ingrediente eliminado de la receta exitosamente"}


# --- ENDPOINTS DE AUTENTICACIÓN Y USUARIO ---

@app.post("/login/", response_model=schemas.Usuario)
def login_usuario(credenciales: schemas.UsuarioLogin, db: Session = Depends(get_db)):
    db_usuario = db.query(models.Usuario).filter(models.Usuario.user_name == credenciales.user_name).first()

    if not db_usuario or not verificar_contrasena(credenciales.contrasena, db_usuario.contrasena):
        raise HTTPException(status_code=401, detail="Usuario o contraseña incorrectos")

    return db_usuario


# --- ENDPOINTS PARA NUTRICIÓN E HISTORIAL ---

@app.get("/nutricion/hoy/{id_usuario}", response_model=List[schemas.HistorialConsumo])
def obtener_nutricion_hoy(id_usuario: int, db: Session = Depends(get_db)):
    hoy = date.today()
    
    consumos = db.query(models.HistorialConsumo).filter(
        models.HistorialConsumo.id_usuario == id_usuario,
        cast(models.HistorialConsumo.fecha_hora, Date) == hoy
    ).all()
    
    return consumos