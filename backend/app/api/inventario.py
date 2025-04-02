from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database import SessionLocal
from app.models import Producto, Usuario
from app.schemas import ProductoCreate, ProductoUpdate, ProductoResponse
from app.api.auth import get_db, get_current_user, check_functionality

router = APIRouter()

# Ruta que requiere autenticación y la funcionalidad "Gestionar Inventario"
@router.post("/productos", response_model=ProductoResponse)
def create_producto(
    producto: ProductoCreate, 
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(check_functionality("Gestionar Inventario"))
):
    """Crear un nuevo producto (requiere funcionalidad 'Gestionar Inventario')"""
    existing_product = db.query(Producto).filter(Producto.codigo == producto.codigo).first()
    if existing_product:
        raise HTTPException(status_code=400, detail="Ya existe un producto con este código")
    
    new_product = Producto(**producto.model_dump())
    db.add(new_product)
    db.commit()
    db.refresh(new_product)
    return new_product

# Ruta que solo requiere autenticación (cualquier usuario autenticado puede ver productos)
@router.get("/productos", response_model=List[ProductoResponse])
def get_productos(
    skip: int = 0, 
    limit: int = 100,
    codigo: Optional[str] = None,
    nombre: Optional[str] = None,
    talla: Optional[str] = None,
    marca: Optional[str] = None,
    categoria: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)  # Solo requiere autenticación
):
    """Get products with optional filters"""
    query = db.query(Producto)
    
    if codigo:
        query = query.filter(Producto.codigo.ilike(f"%{codigo}%"))
    if nombre:
        query = query.filter(Producto.nombre.ilike(f"%{nombre}%"))
    if talla:
        query = query.filter(Producto.talla == talla)
    if marca:
        query = query.filter(Producto.marca.ilike(f"%{marca}%"))
    if categoria:
        query = query.filter(Producto.categoria.ilike(f"%{categoria}%"))
    
    productos = query.filter(Producto.activo == True).offset(skip).limit(limit).all()
    return productos

@router.get("/productos/{producto_id}", response_model=ProductoResponse)
def get_producto(producto_id: int, db: Session = Depends(get_db)):
    """Get a specific product by ID"""
    producto = db.query(Producto).filter(Producto.id_producto == producto_id).first()
    if not producto:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    return producto

@router.put("/productos/{producto_id}", response_model=ProductoResponse)
def update_producto(
    producto_id: int, 
    producto: ProductoUpdate, 
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(check_functionality("Gestionar Inventario"))
):
    """Update a product"""
    db_producto = db.query(Producto).filter(Producto.id_producto == producto_id).first()
    if not db_producto:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    
    # Si se actualiza el código, verificar que no exista otro producto con ese código
    if producto.codigo and producto.codigo != db_producto.codigo:
        existing = db.query(Producto).filter(Producto.codigo == producto.codigo).first()
        if existing:
            raise HTTPException(status_code=400, detail="Ya existe un producto con este código")
    
    # Actualizar el producto con los campos no nulos
    producto_data = producto.model_dump(exclude_unset=True)
    for key, value in producto_data.items():
        setattr(db_producto, key, value)
    
    db.commit()
    db.refresh(db_producto)
    return db_producto

@router.delete("/productos/{producto_id}")
def delete_producto(
    producto_id: int, 
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(check_functionality("Gestionar Inventario"))
):
    """Delete a product (soft delete)"""
    producto = db.query(Producto).filter(Producto.id_producto == producto_id).first()
    if not producto:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    
    producto.activo = False
    db.commit()
    return {"message": "Producto eliminado correctamente"}