from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models import Cliente, Usuario
from app.schemas import ClienteBase, ClienteResponse
from app.api.auth import get_current_user, check_functionality

router = APIRouter()

@router.post("/clientes", response_model=ClienteResponse)
def create_cliente(
    cliente: ClienteBase,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(check_functionality("Facturacion"))
):
    """Create a new client"""
    # Check if client already exists with the same cedula/NIT
    existing_client = db.query(Cliente).filter(Cliente.cedula_nit == cliente.cedula_nit).first()
    if existing_client:
        raise HTTPException(status_code=400, detail="Ya existe un cliente con esta cédula/NIT")
    
    # Create new client
    new_cliente = Cliente(**cliente.model_dump())
    
    db.add(new_cliente)
    db.commit()
    db.refresh(new_cliente)
    
    return new_cliente

@router.get("/clientes", response_model=List[ClienteResponse])
def get_clientes(
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    """Get all clients"""
    clientes = db.query(Cliente).all()
    return clientes

@router.get("/clientes/{cliente_id}", response_model=ClienteResponse)
def get_cliente(
    cliente_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    """Get a client by ID"""
    cliente = db.query(Cliente).filter(Cliente.id_cliente == cliente_id).first()
    if not cliente:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")
    return cliente