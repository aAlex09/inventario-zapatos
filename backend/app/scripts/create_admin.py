from sqlalchemy.orm import Session
from passlib.context import CryptContext
from app.database import SessionLocal
from app.models import Usuario, Rol

# Configurar el contexto de encriptación
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def create_admin_user():
    db = SessionLocal()
    try:
        # Verificar si existe el rol de administrador (id_rol = 1)
        admin_role = db.query(Rol).filter(Rol.id_rol == 1).first()
        
        # Si no existe el rol, crearlo
        if not admin_role:
            admin_role = Rol(
                id_rol=1,
                nombre="Administrador",
                descripcion="Usuario con todos los permisos del sistema"
            )
            db.add(admin_role)
            db.commit()
            print("✅ Rol de administrador creado correctamente")
        
        # Verificar si el usuario admin ya existe
        admin_user = db.query(Usuario).filter(Usuario.email == "admin@sistema.com").first()
        
        if admin_user:
            print("❗ El usuario administrador ya existe")
            return
        
        # Crear el usuario administrador
        hashed_password = pwd_context.hash("admin123")
        
        new_admin = Usuario(
            nombre="Administrador del Sistema",
            cedula="12345678888890",
            telefono="3001234567",
            email="admin@sistema.com",
            direccion_empleado="Oficina Principal",
            contraseña_login=hashed_password,
            tipo_usuario_rol=1  # ID del rol de administrador
        )
        
        db.add(new_admin)
        db.commit()
        print("✅ Usuario administrador creado correctamente")
        print("📧 Email: admin@sistema.com")
        print("🔑 Contraseña: admin123")
        
    except Exception as e:
        db.rollback()
        print(f"❌ Error al crear el usuario administrador: {str(e)}")
    finally:
        db.close()

if __name__ == "__main__":
    create_admin_user()