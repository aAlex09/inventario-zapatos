from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database import SessionLocal
from app.models import Usuario, Rol
from app.schemas import UserCreate, UserUpdate, UserResponse, RoleResponse
from passlib.context import CryptContext
from app.api.auth import get_db

router = APIRouter()

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto") #se define la encriptacion con bcrypt

# Get para todos los usuarios
@router.get("/users", response_model=List[UserResponse])
def get_users(db: Session = Depends(get_db)):
    users = db.query(Usuario).all()
    return users

# Get para un solo usuario de la lista
@router.get("/users/{user_id}", response_model=UserResponse)
def get_user(user_id: int, db: Session = Depends(get_db)):
    user = db.query(Usuario).filter(Usuario.id_usuario == user_id).first()
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

# Update user
@router.put("/users/{user_id}", response_model=UserResponse)
def update_user(user_id: int, user_update: UserUpdate, db: Session = Depends(get_db)):
    # encontrar al usuario en la base de datos
    db_user = db.query(Usuario).filter(Usuario.id_usuario == user_id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    
    # Chequea si el email ya esta registrado
    if user_update.email and user_update.email != db_user.email:
        existing_user = db.query(Usuario).filter(Usuario.email == user_update.email).first()
        if existing_user:
            raise HTTPException(status_code=400, detail="El correo electrónico ya está registrado")
    
    # chequea si la cedula esta registrada
    if user_update.cedula and user_update.cedula != db_user.cedula:
        existing_user = db.query(Usuario).filter(Usuario.cedula == user_update.cedula).first()
        if existing_user:
            raise HTTPException(status_code=400, detail="La cédula ya está registrada")
    
    #checkea si el rol especificado existe
    if user_update.tipo_usuario_rol:
        role = db.query(Rol).filter(Rol.id_rol == user_update.tipo_usuario_rol).first()
        if not role:
            raise HTTPException(status_code=400, detail="El rol especificado no existe")
    
    # Update user data
    for key, value in user_update.dict(exclude_unset=True).items():
        if key == "contraseña_login" and value:  # solo actualiza la contraseña si el usuario lo ingresa
            value = pwd_context.hash(value)
        if value is not None:  # Only update fields that are provided
            setattr(db_user, key, value)
    
    db.commit()
    db.refresh(db_user)
    
    return db_user

# Delete user
@router.delete("/users/{user_id}", status_code=204)
def delete_user(user_id: int, db: Session = Depends(get_db)):
    db_user = db.query(Usuario).filter(Usuario.id_usuario == user_id).first()
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