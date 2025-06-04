from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import desc
from typing import List
from datetime import datetime
from app.database import get_db
from app.models import Factura, DetalleFactura, Cliente, Producto, MovimientoInventario, Usuario
from app.schemas import FacturaCreate, FacturaResponse
from app.api.auth import get_current_user, check_functionality

router = APIRouter()

@router.post("/facturas", response_model=FacturaResponse)
def create_factura(
    factura_create: FacturaCreate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(check_functionality("Facturacion"))
):
    """Crear nueva factura y registrar movimientos de inventario"""
    try:
        # Verificar que el cliente existe
        cliente = db.query(Cliente).filter(Cliente.id_cliente == factura_create.cliente_id).first()
        if not cliente:
            raise HTTPException(status_code=404, detail="Cliente no encontrado")
        
        # Generar número de factura (formato: 000001, 000002, etc.)
        last_factura = db.query(Factura).order_by(desc(Factura.id_factura)).first()
        if last_factura:
            next_num = int(last_factura.numero_factura) + 1
        else:
            next_num = 1
        numero_factura = f"{next_num:06d}"
        
        # Crear la factura en memoria (sin commit todavía)
        db_factura = Factura(
            numero_factura=numero_factura,
            fecha=factura_create.fecha,
            id_cliente=factura_create.cliente_id,
            subtotal=factura_create.subtotal,
            iva=factura_create.iva,
            total=factura_create.total,
            estado="EMITIDA",
            usuario_cedula=current_user.cedula
        )
        
        db.add(db_factura)
        db.flush()  # Asigna ID pero no hace commit todavía
        
        # Lista para almacenar movimientos
        movimientos = []
        
        # Procesar cada ítem de la factura
        for item in factura_create.items:
            # Verificar que el producto existe y tiene stock suficiente
            producto = db.query(Producto).filter(Producto.id_producto == item.producto_id).first()
            
            if not producto:
                # Hacer rollback y lanzar excepción
                db.rollback()
                raise HTTPException(status_code=404, detail=f"Producto con ID {item.producto_id} no encontrado")
            
            if producto.stock < item.cantidad:
                # Hacer rollback y lanzar excepción
                db.rollback()
                raise HTTPException(
                    status_code=400, 
                    detail=f"Stock insuficiente para '{producto.nombre}'. Disponible: {producto.stock}, Solicitado: {item.cantidad}"
                )
            
            # Crear el detalle de factura
            detalle = DetalleFactura(
                id_factura=db_factura.id_factura,
                producto_id=item.producto_id,
                cantidad=item.cantidad,
                precio_unitario=item.precio_unitario,
                subtotal=item.subtotal
            )
            db.add(detalle)
            
            # Reducir el stock del producto
            producto.stock -= item.cantidad
            
            # Crear registro de movimiento
            movimiento = MovimientoInventario(
                id_producto=item.producto_id,
                tipo_movimiento="SALIDA",
                cantidad=item.cantidad,
                precio_unitario=item.precio_unitario,
                usuario_cedula=current_user.cedula,
                fecha_movimiento=datetime.now(),
                referencia=f"Factura #{numero_factura}",
                notas=f"Venta realizada. Cliente: {cliente.nombre}"
            )
            
            movimientos.append(movimiento)
        
        # Agregar todos los movimientos a la sesión
        for movimiento in movimientos:
            db.add(movimiento)
        
        # Ahora sí hacer commit de toda la transacción
        db.commit()
        
        # Refrescar la factura para incluir los detalles en la respuesta
        db.refresh(db_factura)
        
        return db_factura
        
    except Exception as e:
        db.rollback()
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(
            status_code=500, 
            detail=f"Error al crear la factura: {str(e)}"
        )

@router.get("/facturas", response_model=List[FacturaResponse])
def listar_facturas(
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(check_functionality("Facturacion"))
):
    """Listar todas las facturas"""
    try:
        # Incluimos joinedload para cargar también los datos del cliente
        facturas = db.query(Factura).options(
            joinedload(Factura.cliente)
        ).order_by(Factura.id_factura.desc()).all()
        
        return facturas
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al listar facturas: {str(e)}")

@router.get("/facturas/{factura_id}", response_model=FacturaResponse)
def obtener_factura(
    factura_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(check_functionality("Facturacion"))
):
    """Obtener detalle de una factura específica"""
    try:
        # Usamos join para cargar la información del cliente y los detalles con sus productos
        factura = db.query(Factura).options(
            joinedload(Factura.cliente),  # Cargar datos del cliente
            joinedload(Factura.detalles).joinedload(DetalleFactura.producto)  # Cargar detalles y productos
        ).filter(Factura.id_factura == factura_id).first()
        
        if not factura:
            raise HTTPException(status_code=404, detail="Factura no encontrada")
        
        return factura
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=f"Error al obtener la factura: {str(e)}")

@router.put("/facturas/{id_factura}/anular")
def anular_factura(
    id_factura: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(check_functionality("Facturacion"))
):
    # Buscar la factura
    factura = db.query(Factura).filter(Factura.id_factura == id_factura).first()
    if not factura:
        raise HTTPException(status_code=404, detail="Factura no encontrada")
    
    # Verificar que no esté ya anulada
    if factura.estado == "ANULADA":
        raise HTTPException(status_code=400, detail="La factura ya está anulada")
    
    # Obtener detalles
    detalles = db.query(DetalleFactura).filter(DetalleFactura.id_factura == id_factura).all()
    
    # Por cada detalle, devolver el stock y registrar movimiento
    for detalle in detalles:
        producto = db.query(Producto).filter(Producto.id_producto == detalle.producto_id).first()
        if producto:
            # Devolver al inventario
            producto.stock += detalle.cantidad
            
            # Registrar movimiento de entrada
            movimiento = MovimientoInventario(
                id_producto=detalle.producto_id,
                tipo_movimiento="ENTRADA",
                cantidad=detalle.cantidad,
                precio_unitario=detalle.precio_unitario,
                usuario_cedula=current_user.cedula,
                fecha_movimiento=datetime.now(),
                referencia=f"Anulación Factura #{factura.numero_factura}",
                notas="Anulación de venta"
            )
            db.add(movimiento)
    
    # Cambiar estado de la factura
    factura.estado = "ANULADA"
    
    # Commit
    db.commit()
    
    return {"message": "Factura anulada correctamente"}