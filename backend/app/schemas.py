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
