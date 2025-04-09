from sqlalchemy import Column, Integer, String, ForeignKey, Boolean, Float, DateTime, Numeric, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base

# Tabla de Roles
class Rol(Base):
    __tablename__ = "roles"
    
    id_rol = Column(Integer, primary_key=True, index=True)
    nombre = Column(String, unique=True, index=True)
    descripcion = Column(String, nullable=True)
    # Relación con Usuarios
    usuarios = relationship("Usuario", back_populates="rol")


# Tabla de Usuarios
class Usuario(Base):
    __tablename__ = "usuarios"
        
    cedula = Column(String, primary_key=True, index=True)  # Cédula como PK
    nombre = Column(String)
    telefono = Column(String)
    email = Column(String, unique=True, index=True)
    direccion_empleado = Column(String)
    contraseña_login = Column(String)
    tipo_usuario_rol = Column(Integer, ForeignKey("roles.id_rol"))
    
    # Relaciones
    rol = relationship("Rol", back_populates="usuarios")
    funcionalidades = relationship("UsuarioFuncionalidad", back_populates="usuario")
    movimientos = relationship("MovimientoInventario", back_populates="usuario")


# Tabla de Funcionalidades
class Funcionalidad(Base):
    __tablename__ = "funcionalidades"
    
    id_funcionalidad = Column(Integer, primary_key=True, index=True)
    nombre = Column(String, unique=True, index=True)  # Ej: "Ver Ventas", "Administrar Usuarios"
    
    # Relación con Usuarios por funcionalidades
    usuarios = relationship("UsuarioFuncionalidad", back_populates="funcionalidad")


# Tabla intermedia Usuario - Funcionalidad
class UsuarioFuncionalidad(Base):
    __tablename__ = "usuario_funcionalidad"
    
    usuario_cedula = Column(String, ForeignKey("usuarios.cedula"), primary_key=True)
    funcionalidad_id = Column(Integer, ForeignKey("funcionalidades.id_funcionalidad"), primary_key=True)
    estado = Column(Boolean, default=True)  # True si la funcionalidad está habilitada

    # Relaciones
    usuario = relationship("Usuario", back_populates="funcionalidades")
    funcionalidad = relationship("Funcionalidad", back_populates="usuarios")


class Producto(Base):
    __tablename__ = "productos"
    
    id_producto = Column(Integer, primary_key=True, index=True)
    codigo = Column(String, unique=True, index=True)
    nombre = Column(String, index=True)
    descripcion = Column(String, nullable=True)
    precio_compra = Column(Float)
    precio_venta = Column(Float)
    stock = Column(Integer)
    talla = Column(String)
    color = Column(String)
    marca = Column(String)
    categoria = Column(String)
    imagen_url = Column(String, nullable=True)
    fecha_ingreso = Column(DateTime, default=func.now())
    activo = Column(Boolean, default=True)
    
    # Relación con Movimientos de Inventario
    movimientos = relationship("MovimientoInventario", back_populates="producto")


class MovimientoInventario(Base):
    __tablename__ = "movimientos_inventario"

    id_movimiento = Column(Integer, primary_key=True, index=True)
    id_producto = Column(Integer, ForeignKey("productos.id_producto"), nullable=False)
    tipo_movimiento = Column(String, nullable=False)  # ENTRADA, SALIDA, AJUSTE
    cantidad = Column(Integer, nullable=False)
    fecha_movimiento = Column(DateTime, default=func.now())
    precio_unitario = Column(Numeric(10, 2), nullable=False)
    usuario_cedula = Column(String, ForeignKey("usuarios.cedula"), nullable=False)
    referencia = Column(String)
    notas = Column(Text)
    
    # Relaciones
    producto = relationship("Producto", back_populates="movimientos")
    usuario = relationship("Usuario", back_populates="movimientos")
