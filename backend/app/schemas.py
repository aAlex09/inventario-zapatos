from pydantic import BaseModel, EmailStr, ConfigDict
from typing import Optional, List
from datetime import datetime

# Role schemas
class RoleBase(BaseModel):
    nombre: str

class RoleCreate(RoleBase):
    pass

class RoleResponse(RoleBase):
    id_rol: int
    
    model_config = ConfigDict(from_attributes=True)  # Updated from orm_mode

# User schemas
class UserBase(BaseModel):
    nombre: str
    cedula: str
    telefono: str
    email: EmailStr
    direccion_empleado: str
    tipo_usuario_rol: int

class UserCreate(UserBase):
    contraseña_login: str # revisar contraseña al iniciar sesion

class UserUpdate(BaseModel):
    nombre: Optional[str] = None
    cedula: Optional[str] = None
    telefono: Optional[str] = None
    email: Optional[EmailStr] = None
    direccion_empleado: Optional[str] = None
    contraseña_login: Optional[str] = None  # Optional
    tipo_usuario_rol: Optional[int] = None

class UserResponse(UserBase):
    cedula: str  # Cambiar id_usuario por cedula
    
    model_config = ConfigDict(from_attributes=True)  # Actualización para los diccionarios de configuración

# Login schemas
class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    cedula: str  # Added field

# Esquemas para recuperación de contraseña
class PasswordResetRequest(BaseModel):
    email: EmailStr

class PasswordReset(BaseModel):
    token: str
    password: str

# Functionality schemas
class FuncionalidadBase(BaseModel):
    nombre: str

class FuncionalidadCreate(FuncionalidadBase):
    pass

class FuncionalidadResponse(FuncionalidadBase):
    id_funcionalidad: int
    
    model_config = ConfigDict(from_attributes=True)

# UsuarioFuncionalidad schemas
class UsuarioFuncionalidadBase(BaseModel):
    usuario_cedula: str
    funcionalidad_id: int
    estado: bool = True

class UsuarioFuncionalidadCreate(UsuarioFuncionalidadBase):
    pass

class UsuarioFuncionalidadUpdate(BaseModel):
    estado: bool

class UsuarioFuncionalidadResponse(UsuarioFuncionalidadBase):
    model_config = ConfigDict(from_attributes=True)

# Producto schemas
class ProductoBase(BaseModel):
    codigo: str
    nombre: str
    descripcion: Optional[str] = None
    precio_compra: float
    precio_venta: float
    stock: int
    talla: str
    color: str
    marca: str
    categoria: str
    imagen_url: Optional[str] = None

class ProductoCreate(ProductoBase):
    pass

class ProductoUpdate(BaseModel):
    codigo: Optional[str] = None
    nombre: Optional[str] = None
    descripcion: Optional[str] = None
    precio_compra: Optional[float] = None
    precio_venta: Optional[float] = None
    stock: Optional[int] = None
    talla: Optional[str] = None
    color: Optional[str] = None
    marca: Optional[str] = None
    categoria: Optional[str] = None
    imagen_url: Optional[str] = None
    activo: Optional[bool] = None

class ProductoResponse(ProductoBase):
    id_producto: int
    fecha_ingreso: datetime
    activo: bool
    
    model_config = ConfigDict(from_attributes=True)

# Movimiento schemas
class MovimientoBase(BaseModel):
    id_producto: int
    tipo_movimiento: str
    cantidad: int
    precio_unitario: float  # Asegurarse de incluir este campo
    referencia: Optional[str] = None
    notas: Optional[str] = None

class MovimientoCreate(MovimientoBase):
    pass

class MovimientoResponse(MovimientoBase):
    id_movimiento: int
    usuario_cedula: str
    fecha_movimiento: Optional[datetime] = None
    
    model_config = ConfigDict(from_attributes=True)  # Actualizar a la nueva sintaxis

# Factura schemas
class DetalleFacturaCreate(BaseModel):
    producto_id: int  # Cambiado de id_producto a producto_id
    cantidad: int
    precio_unitario: float
    subtotal: float

class FacturaCreate(BaseModel):
    cliente_id: int
    fecha: str
    subtotal: float
    iva: float
    total: float
    items: List[DetalleFacturaCreate]

# Schema para respuesta de Factura
class DetalleFacturaResponse(BaseModel):
    id_detalle: int
    id_factura: int
    producto_id: int  # Cambiado de id_producto a producto_id para coincidir con el modelo
    cantidad: int
    precio_unitario: float
    subtotal: float
    
    model_config = ConfigDict(from_attributes=True)

class FacturaResponse(BaseModel):
    id_factura: int
    id_cliente: int
    numero_factura: str
    fecha: datetime
    subtotal: float
    iva: float
    total: float
    estado: str
    usuario_cedula: str
    detalles: List[DetalleFacturaResponse] = []
    
    model_config = ConfigDict(from_attributes=True)

class ClienteBase(BaseModel):
    cedula_nit: str
    nombre: str
    telefono: Optional[str] = None
    email: Optional[str] = None
    direccion: Optional[str] = None

class ClienteResponse(ClienteBase):
    id_cliente: int
    
    model_config = ConfigDict(from_attributes=True)
