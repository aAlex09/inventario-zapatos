from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timedelta
from app.database import get_db
from app.models import Usuario, MovimientoInventario, Producto
from sqlalchemy import func, case, literal
from app.api.auth import get_current_user

router = APIRouter()

@router.get("/reportes/movimientos")
def get_movimientos_report(
    fecha_inicio: Optional[str] = Query(None),
    fecha_fin: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    try:
        # Convertir fechas si se proporcionan
        start_date = None
        end_date = None
        
        if fecha_inicio:
            start_date = datetime.strptime(fecha_inicio, "%Y-%m-%d")
        if fecha_fin:
            end_date = datetime.strptime(fecha_fin, "%Y-%m-%d") + timedelta(days=1)  # Incluir todo el día final
        
        # Query base para movimientos por tipo
        query_tipo = db.query(
            MovimientoInventario.tipo_movimiento.label("tipo"),
            func.count(MovimientoInventario.id_movimiento).label("cantidad")
        ).group_by(MovimientoInventario.tipo_movimiento)
        
        # Query base para movimientos por usuario
        query_usuario = db.query(
            Usuario.nombre,
            func.count(MovimientoInventario.id_movimiento).label("cantidad")
        ).join(
            Usuario, Usuario.cedula == MovimientoInventario.usuario_cedula
        ).group_by(
            Usuario.nombre
        )
        
        # Aplicar filtros de fecha si se proporcionan
        if start_date and end_date:
            query_tipo = query_tipo.filter(
                MovimientoInventario.fecha_movimiento >= start_date,
                MovimientoInventario.fecha_movimiento <= end_date
            )
            query_usuario = query_usuario.filter(
                MovimientoInventario.fecha_movimiento >= start_date,
                MovimientoInventario.fecha_movimiento <= end_date
            )
        
        # Ejecutar las consultas
        movimientos_por_tipo = query_tipo.all()
        movimientos_por_usuario = query_usuario.all()
        
        # Convertir a diccionarios para la respuesta JSON
        resultado_tipos = [{"tipo": tipo, "cantidad": cantidad} for tipo, cantidad in movimientos_por_tipo]
        resultado_usuarios = [{"nombre": nombre, "cantidad": cantidad} for nombre, cantidad in movimientos_por_usuario]
        
        return {
            "movimientosPorTipo": resultado_tipos,
            "movimientosPorUsuario": resultado_usuarios
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generando el reporte: {str(e)}")

@router.get("/reportes/rentabilidad")
def get_rentabilidad_report(
    fecha_inicio: Optional[str] = Query(None),
    fecha_fin: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    try:
        # Preparar consulta base para productos
        query = db.query(
            Producto.id_producto,
            Producto.codigo,
            Producto.nombre,
            Producto.precio_compra,
            Producto.precio_venta
        )
        
        # Contar movimientos de salida (ventas) por producto
        subq_ventas = db.query(
            MovimientoInventario.id_producto,
            func.sum(MovimientoInventario.cantidad).label('cantidad_vendida')
        ).filter(
            MovimientoInventario.tipo_movimiento == 'SALIDA'
        )
        
        # Aplicar filtros de fecha si se proporcionan
        if fecha_inicio and fecha_fin:
            start_date = datetime.strptime(fecha_inicio, "%Y-%m-%d")
            end_date = datetime.strptime(fecha_fin, "%Y-%m-%d") + timedelta(days=1)
            subq_ventas = subq_ventas.filter(
                MovimientoInventario.fecha_movimiento >= start_date,
                MovimientoInventario.fecha_movimiento <= end_date
            )
        
        # Agrupar ventas por producto
        subq_ventas = subq_ventas.group_by(MovimientoInventario.id_producto).subquery()
        
        # Unir productos con sus ventas
        query = query.outerjoin(
            subq_ventas,
            Producto.id_producto == subq_ventas.c.id_producto
        ).add_columns(
            func.coalesce(subq_ventas.c.cantidad_vendida, 0).label('cantidad_vendida')
        )
        
        # Ejecutar la consulta
        productos = query.all()
        
        # Procesar los resultados
        resultado = []
        for p in productos:
            # Calcular métricas de rentabilidad
            margen_unitario = float(p.precio_venta) - float(p.precio_compra)
            margen_porcentaje = (margen_unitario / float(p.precio_compra) * 100) if float(p.precio_compra) > 0 else 0
            cantidad_vendida = int(p.cantidad_vendida) if p.cantidad_vendida else 0
            rentabilidad_total = margen_unitario * cantidad_vendida
            
            resultado.append({
                "id_producto": p.id_producto,
                "codigo": p.codigo,
                "nombre": p.nombre,
                "precio_compra": float(p.precio_compra),
                "precio_venta": float(p.precio_venta),
                "margen_unitario": margen_unitario,
                "margen_porcentaje": margen_porcentaje,
                "cantidad_vendida": cantidad_vendida,
                "rentabilidad_total": rentabilidad_total
            })
        
        # Ordenar por rentabilidad total de mayor a menor
        resultado = sorted(resultado, key=lambda x: x['rentabilidad_total'], reverse=True)
        
        return {
            "rentabilidadProductos": resultado
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generando el reporte de rentabilidad: {str(e)}")

@router.get("/reportes/inventario")
def get_inventario_report(
    fecha_inicio: Optional[str] = Query(None),
    fecha_fin: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    try:
        # Convertir fechas si se proporcionan
        start_date = None
        end_date = None
        
        if fecha_inicio:
            start_date = datetime.strptime(fecha_inicio, "%Y-%m-%d")
        if fecha_fin:
            end_date = datetime.strptime(fecha_fin, "%Y-%m-%d") + timedelta(days=1)
        
        # Consulta para obtener información de productos
        productos_query = db.query(
            Producto.id_producto,
            Producto.codigo,
            Producto.nombre,
            Producto.stock,
            Producto.fecha_ingreso,
            Producto.categoria
        ).filter(Producto.activo == True)
        
        # Obtener todos los productos
        productos = productos_query.all()
        
        # Preparar resultado
        resultado = []
        
        for producto in productos:
            # Consulta para entradas
            entradas_query = db.query(func.sum(MovimientoInventario.cantidad)).\
                filter(
                    MovimientoInventario.id_producto == producto.id_producto,
                    MovimientoInventario.tipo_movimiento == 'ENTRADA'
                )
            
            # Consulta para salidas
            salidas_query = db.query(func.sum(MovimientoInventario.cantidad)).\
                filter(
                    MovimientoInventario.id_producto == producto.id_producto,
                    MovimientoInventario.tipo_movimiento == 'SALIDA'
                )
            
            # Consulta para última fecha de movimiento
            ultimo_movimiento_query = db.query(func.max(MovimientoInventario.fecha_movimiento)).\
                filter(MovimientoInventario.id_producto == producto.id_producto)
            
            # Aplicar filtros de fecha si se proporcionan
            if start_date and end_date:
                entradas_query = entradas_query.filter(
                    MovimientoInventario.fecha_movimiento >= start_date,
                    MovimientoInventario.fecha_movimiento <= end_date
                )
                salidas_query = salidas_query.filter(
                    MovimientoInventario.fecha_movimiento >= start_date,
                    MovimientoInventario.fecha_movimiento <= end_date
                )
                ultimo_movimiento_query = ultimo_movimiento_query.filter(
                    MovimientoInventario.fecha_movimiento >= start_date,
                    MovimientoInventario.fecha_movimiento <= end_date
                )
            
            # Ejecutar consultas
            total_entradas = entradas_query.scalar() or 0
            total_salidas = salidas_query.scalar() or 0
            ultimo_movimiento = ultimo_movimiento_query.scalar()
            
            # Calcular días desde el último movimiento
            dias_sin_movimiento = None
            if ultimo_movimiento:
                dias_sin_movimiento = (datetime.now() - ultimo_movimiento).days
            else:
                # Si no hay movimientos, usar la fecha de ingreso
                if producto.fecha_ingreso:
                    dias_sin_movimiento = (datetime.now() - producto.fecha_ingreso).days
                else:
                    dias_sin_movimiento = 0
            
            # Calcular rotación (total de salidas dividido por el stock promedio)
            # Nota: evitar división por cero
            stock_promedio = (producto.stock + producto.stock + total_salidas - total_entradas) / 2
            if stock_promedio > 0:
                rotacion = total_salidas / stock_promedio
            else:
                rotacion = 0
            
            # Calcular clasificación de rotación
            clasificacion = "Sin movimiento"
            if rotacion > 0.5:
                clasificacion = "Alta rotación"
            elif rotacion > 0.1:
                clasificacion = "Rotación normal"
            elif rotacion > 0:
                clasificacion = "Baja rotación"
            
            # Alertas de stock
            alerta = None
            if producto.stock == 0:
                alerta = "Sin stock"
            elif producto.stock <= 3:
                alerta = "Stock bajo"
            elif producto.stock >= 20 and dias_sin_movimiento and dias_sin_movimiento > 30:
                alerta = "Sobrestock"
            
            resultado.append({
                "id_producto": producto.id_producto,
                "codigo": producto.codigo,
                "nombre": producto.nombre,
                "categoria": producto.categoria,
                "stock_actual": producto.stock,
                "total_entradas": int(total_entradas),
                "total_salidas": int(total_salidas),
                "rotacion": float(rotacion),
                "clasificacion": clasificacion,
                "dias_sin_movimiento": dias_sin_movimiento,
                "alerta": alerta
            })
        
        # Ordenar por rotación (descendente)
        resultado = sorted(resultado, key=lambda x: x['rotacion'], reverse=True)
        
        return {
            "inventario": resultado
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generando el reporte de inventario: {str(e)}")