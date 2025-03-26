from app.database import SessionLocal
from app.models import Rol, Usuario
from passlib.context import CryptContext
import sqlalchemy as sa

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def init_db():
    db = SessionLocal()
    
    try:
        # Create roles if they don't exist
        roles = [
            {"id_rol": 1, "nombre": "Administrador"},
            {"id_rol": 2, "nombre": "Vendedor"},
            {"id_rol": 3, "nombre": "Bodeguero"},
        ]
        
        for role_data in roles:
            role = db.query(Rol).filter(Rol.id_rol == role_data["id_rol"]).first()
            if not role:
                new_role = Rol(**role_data)
                db.add(new_role)
                db.flush()  # Flush to get the ID if needed
        
        # Check if admin user already exists
        admin = db.query(Usuario).filter(
            sa.or_(
                Usuario.email == "admin@sistema.com",
                Usuario.cedula == "1234567890"
            )
        ).first()
        
        if not admin:
            admin_user = Usuario(
                cedula="1234567890",  # Aquí cedula es la PK
                nombre="Administrador",
                telefono="0987654321",
                email="admin@sistema.com",
                direccion_empleado="Dirección Administrador",
                contraseña_login=pwd_context.hash("admin123"),
                tipo_usuario_rol=1  # Admin role
            )
            db.add(admin_user)
        
        db.commit()
    except Exception as e:
        db.rollback()
        print(f"Error initializing database: {str(e)}")
    finally:
        db.close()

if __name__ == "__main__":
    init_db()
    print("Base de datos inicializada con roles y usuario administrador.")