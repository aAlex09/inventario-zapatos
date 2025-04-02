from pydantic import BaseModel, EmailStr, ConfigDict
from typing import Optional, List

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
    funcionalidades: Optional[List[int]] = None  # Agregar esta línea

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

# Esquemas para recuperación de contraseña
class PasswordResetRequest(BaseModel):
    email: EmailStr

class PasswordReset(BaseModel):
    token: str
    password: str

class FuncionalidadResponse(BaseModel):
    id_funcionalidad: int
    nombre: str
    estado: Optional[bool] = None
    
    model_config = ConfigDict(from_attributes=True)

class FuncionalidadEstado(BaseModel):
    id_funcionalidad: int
    estado: bool    

class ActualizarFuncionalidadesRequest(BaseModel):
    funcionalidades: List[FuncionalidadEstado]

class UsuarioUpdateRequest(BaseModel):
    nombre: Optional[str]
    email: Optional[str]
    telefono: Optional[str]
    direccion_empleado: Optional[str]
    contraseña_login: Optional[str]
    tipo_usuario_rol: Optional[int]
    funcionalidades: Optional[List[int]]  # 👈 importante