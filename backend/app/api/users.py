from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database import SessionLocal
from app.models import Usuario, Rol, Funcionalidad, UsuarioFuncionalidad
from app.schemas import UserCreate, UserUpdate, UserResponse, RoleResponse, FuncionalidadResponse, ActualizarFuncionalidadesRequest,UsuarioUpdateRequest
from passlib.context import CryptContext
from app.api.auth import get_db
import logging


router = APIRouter()
logger = logging.getLogger(__name__)
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto") #se define la encriptacion con bcrypt


# Get para todos los usuarios
@router.get("/users", response_model=List[UserResponse])
def get_users(db: Session = Depends(get_db)):
    users = db.query(Usuario).all()
    return users

# Get para un solo usuario de la lista
@router.get("/users/{cedula}", response_model=UserResponse)
def get_user(cedula: str, db: Session = Depends(get_db)):
    user = db.query(Usuario).filter(Usuario.cedula == cedula).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    return user

# Create user
@router.post("/users", response_model=UserResponse)
def create_user(user: UserCreate, db: Session = Depends(get_db)):
    # Check if email already exists
    db_user = db.query(Usuario).filter(Usuario.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="El correo electrónico ya está registrado")
    
    # Check if cedula already exists
    db_user = db.query(Usuario).filter(Usuario.cedula == user.cedula).first()
    if db_user:
        raise HTTPException(status_code=400, detail="La cédula ya está registrada")
    
    # Check if role exists
    role = db.query(Rol).filter(Rol.id_rol == user.tipo_usuario_rol).first()
    if not role:
        raise HTTPException(status_code=400, detail="El rol especificado no existe")
    
    # Crea nuevo usuario en la base de datos
    hashed_password = pwd_context.hash(user.contraseña_login)
    new_user = Usuario(
        nombre=user.nombre,
        cedula=user.cedula,
        telefono=user.telefono,
        email=user.email,
        direccion_empleado=user.direccion_empleado,
        contraseña_login=hashed_password,
        tipo_usuario_rol=user.tipo_usuario_rol
    )
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    return new_user

@router.put("/users/{cedula}", response_model=UserResponse)
def update_user(cedula: str, user_update: UserUpdate, db: Session = Depends(get_db)):
    db_user = db.query(Usuario).filter(Usuario.cedula == cedula).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    
    try:
        # Verificar email duplicado solo si se está actualizando
        if user_update.email and user_update.email != db_user.email:
            existing_user = db.query(Usuario).filter(
                Usuario.email == user_update.email,
                Usuario.cedula != cedula
            ).first()
            if existing_user:
                raise HTTPException(
                    status_code=400, 
                    detail="El correo electrónico ya está registrado"
                )
        
        # Actualizar campos básicos si están presentes
        update_data = user_update.dict(exclude_unset=True)
        for key, value in update_data.items():
            if key == "contraseña_login" and value:
                value = pwd_context.hash(value)
            if value is not None and key != "funcionalidades":
                setattr(db_user, key, value)
        
        # Actualizar funcionalidades si se proporcionan
        if user_update.funcionalidades is not None:
            # Eliminar funcionalidades existentes
            db.query(UsuarioFuncionalidad).filter(
                UsuarioFuncionalidad.usuario_cedula == cedula
            ).delete()
            
            # Agregar nuevas funcionalidades
            for func_id in user_update.funcionalidades:
                nueva_func = UsuarioFuncionalidad(
                    usuario_cedula=cedula,
                    funcionalidad_id=func_id,
                    estado=True
                )
                db.add(nueva_func)
        
        db.commit()
        db.refresh(db_user)
        return db_user
        
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Error actualizando usuario: {str(e)}"
        )

# Delete user
@router.delete("/users/{cedula}", status_code=204)
def delete_user(cedula: str, db: Session = Depends(get_db)):
    db_user = db.query(Usuario).filter(Usuario.cedula == cedula).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    
    db.delete(db_user)
    db.commit()
    return {"status": "Usuario eliminado exitosamente"}

# Get all roles
@router.get("/roles", response_model=List[RoleResponse])
def get_roles(db: Session = Depends(get_db)):
    roles = db.query(Rol).all()
    return roles

# Agregar endpoint para obtener funcionalidades
@router.get("/users/{cedula}/funcionalidades", response_model=List[FuncionalidadResponse])
def get_user_funcionalidades(cedula: str, db: Session = Depends(get_db)):
    # Obtener todas las funcionalidades disponibles
    todas_funcionalidades = db.query(Funcionalidad).distinct().all()
    
    # Obtener las funcionalidades activas del usuario usando subconsulta
    funcionalidades_usuario = (
        db.query(UsuarioFuncionalidad)
        .filter(UsuarioFuncionalidad.usuario_cedula == cedula)
        .distinct()
        .all()
    )
    
    # Crear un diccionario para mapear las funcionalidades activas
    funcionalidades_activas = {
        f.funcionalidad_id: f.estado 
        for f in funcionalidades_usuario
    }
    
    # Preparar la respuesta sin duplicados
    resultado = []
    seen = set()  # Para trackear funcionalidades ya agregadas
    
    for func in todas_funcionalidades:
        if func.id_funcionalidad not in seen:
            seen.add(func.id_funcionalidad)
            resultado.append({
                "id_funcionalidad": func.id_funcionalidad,
                "nombre": func.nombre,
                "estado": funcionalidades_activas.get(func.id_funcionalidad, False)
            })
    
    return resultado

@router.get("/users/{cedula}/funcionalidades-activas", response_model=List[FuncionalidadResponse])
def get_user_funcionalidades_activas(cedula: str, db: Session = Depends(get_db)):
    # Usar distinct para evitar duplicados y hacer un join más específico
    funcionalidades = (
        db.query(Funcionalidad)
        .join(UsuarioFuncionalidad)
        .filter(
            UsuarioFuncionalidad.usuario_cedula == cedula,
            UsuarioFuncionalidad.estado == True
        )
        .distinct()
        .all()
    )
    
    # Convertir a formato de respuesta
    return [
        {
            "id_funcionalidad": func.id_funcionalidad,
            "nombre": func.nombre
        }
        for func in funcionalidades
    ]


# Agregar este endpoint
@router.get("/funcionalidades", response_model=List[FuncionalidadResponse])
def get_funcionalidades(db: Session = Depends(get_db)):
    funcionalidades = db.query(Funcionalidad).distinct().all()
    return funcionalidades



@router.put("/users/{cedula}")
def update_user(cedula: str, request: UsuarioUpdateRequest, db: Session = Depends(get_db)):
    db_user = db.query(Usuario).filter(Usuario.cedula == cedula).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    # Actualizar campos básicos
    for key, value in request.dict(exclude_unset=True).items():
        if key != "funcionalidades":  # evitamos asignar funcionalidades aquí
            setattr(db_user, key, value)

    # ✅ Actualizar funcionalidades solo si vienen en el request
    if "funcionalidades" in request.dict():
        funcionalidades_ids = request.funcionalidades

        # Eliminar anteriores
        db.query(UsuarioFuncionalidad).filter(
            UsuarioFuncionalidad.usuario_cedula == cedula
        ).delete()

        # Insertar nuevas
        for func_id in funcionalidades_ids:
            nueva = UsuarioFuncionalidad(
                usuario_cedula=cedula,
                funcionalidad_id=func_id,
                estado=True
            )
            db.add(nueva)

    db.commit()
    return {"message": "Usuario actualizado correctamente"}

@router.put("/users/{cedula}/funcionalidades")
def actualizar_funcionalidades_usuario(
    cedula: str, 
    request: ActualizarFuncionalidadesRequest, 
    db: Session = Depends(get_db)
):
    db_user = db.query(Usuario).filter(Usuario.cedula == cedula).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    try:
        # Eliminar funcionalidades existentes
        db.query(UsuarioFuncionalidad).filter(
            UsuarioFuncionalidad.usuario_cedula == cedula
        ).delete()

        # Insertar nuevos registros con estado correspondiente
        for func in request.funcionalidades:
            nueva_func = UsuarioFuncionalidad(
                usuario_cedula=cedula,
                funcionalidad_id=func.id_funcionalidad,
                estado=func.estado
            )
            db.add(nueva_func)

        db.commit()
        return {"message": "Funcionalidades actualizadas correctamente"}
    
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500, 
            detail=f"Error actualizando funcionalidades: {str(e)}"
        )

