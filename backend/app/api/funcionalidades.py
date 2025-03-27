from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.database import SessionLocal
from app.models import Usuario, Funcionalidad, UsuarioFuncionalidad
from app.schemas import FuncionalidadResponse, UsuarioFuncionalidadCreate, UsuarioFuncionalidadUpdate
from app.api.auth import get_db

router = APIRouter()

@router.get("/users/{cedula}/funcionalidades", response_model=List[FuncionalidadResponse])
def get_user_funcionalidades(cedula: str, db: Session = Depends(get_db)):
    """Get all functionalities associated with a user by their cedula"""
    # Check if user exists
    user = db.query(Usuario).filter(Usuario.cedula == cedula).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    
    # Get the user's functionalities with estado = True (enabled)
    funcionalidades = (
        db.query(Funcionalidad)
        .join(UsuarioFuncionalidad)
        .filter(UsuarioFuncionalidad.usuario_cedula == cedula)
        .filter(UsuarioFuncionalidad.estado == True)
        .all()
    )
    
    return funcionalidades

@router.post("/users/{cedula}/funcionalidades/{id_funcionalidad}")
def assign_funcionalidad(
    cedula: str, 
    id_funcionalidad: int, 
    db: Session = Depends(get_db)
):
    """Assign a functionality to a user"""
    # Check if user exists
    user = db.query(Usuario).filter(Usuario.cedula == cedula).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    
    # Check if functionality exists
    funcionalidad = db.query(Funcionalidad).filter(Funcionalidad.id_funcionalidad == id_funcionalidad).first()
    if not funcionalidad:
        raise HTTPException(status_code=404, detail="Funcionalidad no encontrada")
    
    # Check if the assignment already exists
    existing = (
        db.query(UsuarioFuncionalidad)
        .filter(UsuarioFuncionalidad.usuario_cedula == cedula)
        .filter(UsuarioFuncionalidad.funcionalidad_id == id_funcionalidad)
        .first()
    )
    
    if existing:
        # If exists and disabled, enable it
        if not existing.estado:
            existing.estado = True
            db.commit()
            return {"message": "Funcionalidad habilitada para el usuario"}
        else:
            raise HTTPException(status_code=400, detail="La funcionalidad ya está asignada al usuario")
    
    # If not exists, create the relationship
    new_assignment = UsuarioFuncionalidad(
        usuario_cedula=cedula,
        funcionalidad_id=id_funcionalidad,
        estado=True
    )
    
    db.add(new_assignment)
    db.commit()
    
    return {"message": "Funcionalidad asignada al usuario"}

@router.delete("/users/{cedula}/funcionalidades/{id_funcionalidad}")
def remove_funcionalidad(
    cedula: str, 
    id_funcionalidad: int, 
    db: Session = Depends(get_db)
):
    """Remove a functionality from a user (disable it)"""
    # Check if user exists
    user = db.query(Usuario).filter(Usuario.cedula == cedula).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    
    # Find the assignment
    assignment = (
        db.query(UsuarioFuncionalidad)
        .filter(UsuarioFuncionalidad.usuario_cedula == cedula)
        .filter(UsuarioFuncionalidad.funcionalidad_id == id_funcionalidad)
        .first()
    )
    
    if not assignment:
        raise HTTPException(status_code=404, detail="Funcionalidad no asignada al usuario")
    
    # Set estado to False (disable)
    assignment.estado = False
    db.commit()
    
    return {"message": "Funcionalidad deshabilitada para el usuario"}

@router.get("/funcionalidades", response_model=List[FuncionalidadResponse])
def get_all_funcionalidades(db: Session = Depends(get_db)):
    """Get all available functionalities in the system"""
    return db.query(Funcionalidad).all()