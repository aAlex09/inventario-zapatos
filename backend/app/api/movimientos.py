from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime

from app.models import MovimientoInventario, Producto, Usuario
from app.schemas import MovimientoCreate, MovimientoResponse
from app.api.auth import get_db, get_current_user, check_functionality

router = APIRouter()

@router.post("/movimientos", response_model=MovimientoResponse)
def create_movimiento(
    movimiento: MovimientoCreate, 
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(check_functionality("Bodega"))
):
    # Create the movement record
    db_movimiento = MovimientoInventario(
        id_producto=movimiento.id_producto,
        tipo_movimiento=movimiento.tipo_movimiento,
        cantidad=movimiento.cantidad,
        precio_unitario=movimiento.precio_unitario,  # Asegúrate de incluir este campo
        usuario_cedula=current_user.cedula,
        referencia=movimiento.referencia,
        notas=movimiento.notas,
        fecha_movimiento=datetime.now()  # Establecer explícitamente la fecha actual
    )
    
    # Update producto stock
    producto = db.query(Producto).filter(Producto.id_producto == movimiento.id_producto).first()
    if not producto:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    
    # Adjust stock based on movement type
    if movimiento.tipo_movimiento == "ENTRADA":
        producto.stock += movimiento.cantidad
    elif movimiento.tipo_movimiento == "SALIDA":
        if producto.stock < movimiento.cantidad:
            raise HTTPException(status_code=400, detail="Stock insuficiente")
        producto.stock -= movimiento.cantidad
    elif movimiento.tipo_movimiento == "AJUSTE":
        producto.stock = movimiento.cantidad
    
    db.add(db_movimiento)    
    db.commit()
    db.refresh(db_movimiento)
    return db_movimiento


@router.get("/movimientos", response_model=List[MovimientoResponse])
def get_movimientos(
    producto_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    query = db.query(MovimientoInventario)
    if producto_id:
        query = query.filter(MovimientoInventario.id_producto == producto_id)
    
    return query.order_by(MovimientoInventario.fecha_movimiento.desc()).all()