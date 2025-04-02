from sqlalchemy import Column, Integer, String, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from app.database import Base
from typing import List
from pydantic import BaseModel, EmailStr
from pydantic.config import ConfigDict
from typing import Optional

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
        
    cedula = Column(String, primary_key=True, index=True)  # Cédula como clave principal
    nombre = Column(String, nullable=False)
    telefono = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    direccion_empleado = Column(String, nullable=False)
    contraseña_login = Column(String, nullable=False)
    tipo_usuario_rol = Column(Integer, ForeignKey("roles.id_rol"), nullable=False)
    
    # Relaciones
    rol = relationship("Rol", back_populates="usuarios")
    funcionalidades = relationship("UsuarioFuncionalidad", 
                                 back_populates="usuario",
                                 cascade="all, delete-orphan")
    
    @property
    def funcionalidades_activas(self):
        """Retorna lista de funcionalidades activas del usuario"""
        return [f.funcionalidad for f in self.funcionalidades if f.estado]
    
    def tiene_funcionalidad(self, nombre_funcionalidad):
        """Verifica si el usuario tiene una funcionalidad específica activa"""
        return any(f.funcionalidad.nombre == nombre_funcionalidad and f.estado 
                  for f in self.funcionalidades)
    
    def activar_funcionalidad(self, funcionalidad_id):
        """Activa una funcionalidad para el usuario"""
        for f in self.funcionalidades:
            if f.funcionalidad_id == funcionalidad_id:
                f.estado = True
                break
    
    def desactivar_funcionalidad(self, funcionalidad_id):
        """Desactiva una funcionalidad para el usuario"""
        for f in self.funcionalidades:
            if f.funcionalidad_id == funcionalidad_id:
                f.estado = False
                break


# Tabla de Funcionalidades
class Funcionalidad(Base):
    __tablename__ = "funcionalidades"
    
    id_funcionalidad = Column(Integer, primary_key=True, index=True)
    nombre = Column(String, unique=True, index=True, nullable=False)
    
    # Relación con Usuarios
    usuarios = relationship("UsuarioFuncionalidad", 
                          back_populates="funcionalidad",
                          cascade="all, delete-orphan")
    
    @property
    def usuarios_activos(self):
        """Retorna lista de usuarios que tienen activa esta funcionalidad"""
        return [uf.usuario for uf in self.usuarios if uf.estado]


# Tabla intermedia Usuario - Funcionalidad
class UsuarioFuncionalidad(Base):
    __tablename__ = "usuario_funcionalidad"
    
    usuario_cedula = Column(String, 
                          ForeignKey("usuarios.cedula", ondelete="CASCADE"), 
                          primary_key=True)
    funcionalidad_id = Column(Integer, 
                            ForeignKey("funcionalidades.id_funcionalidad", ondelete="CASCADE"), 
                            primary_key=True)
    estado = Column(Boolean, default=True, nullable=False)

    # Relaciones
    usuario = relationship("Usuario", back_populates="funcionalidades")
    funcionalidad = relationship("Funcionalidad", back_populates="usuarios")

# Esquema base para usuarios
class UserBase(BaseModel):
    nombre: str
    cedula: str
    telefono: str
    email: EmailStr
    direccion_empleado: str
    tipo_usuario_rol: int

# Esquema para creación de usuarios
class UserCreate(UserBase):
    contraseña_login: str
    funcionalidades: Optional[List[int]] = []

# Esquema para actualización de usuarios
class UserUpdate(BaseModel):
    nombre: Optional[str] = None
    cedula: Optional[str] = None
    telefono: Optional[str] = None
    email: Optional[EmailStr] = None
    direccion_empleado: Optional[str] = None
    contraseña_login: Optional[str] = None
    tipo_usuario_rol: Optional[int] = None
    funcionalidades: Optional[List[int]] = None

    model_config = ConfigDict(from_attributes=True)

# Agregar esquema para respuesta de funcionalidades
class FuncionalidadResponse(BaseModel):
    id_funcionalidad: int
    nombre: str

    model_config = ConfigDict(from_attributes=True)

# Esquema para respuesta de usuarios
class UserResponse(BaseModel):
    nombre: str
    cedula: str
    telefono: str
    email: EmailStr
    direccion_empleado: str
    tipo_usuario_rol: int

    model_config = ConfigDict(from_attributes=True)
