from pydantic import BaseModel, EmailStr, ConfigDict
from typing import Optional

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
    contraseña_login: str

class UserUpdate(BaseModel):
    nombre: Optional[str] = None
    # No incluimos cedula aquí, porque es la PK y no se debe actualizar
    telefono: Optional[str] = None
    email: Optional[EmailStr] = None
    direccion_empleado: Optional[str] = None
    contraseña_login: Optional[str] = None
    tipo_usuario_rol: Optional[int] = None

class UserResponse(UserBase):
    # Cambiamos id_usuario por cedula
    
    model_config = ConfigDict(from_attributes=True)

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
