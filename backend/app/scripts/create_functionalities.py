import os
import sys

# Add the parent directory to the Python path so that 'app' module can be found
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))

from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models import Funcionalidad, UsuarioFuncionalidad, Usuario

def create_basic_functionalities():
    db = SessionLocal()
    try:
        # Define basic functionalities
        basic_functionalities = [
            {"id_funcionalidad": 1, "nombre": "Administrar Usuarios"},
            {"id_funcionalidad": 2, "nombre": "Gestionar Inventario"},
            {"id_funcionalidad": 3, "nombre": "Realizar Ventas"},
            {"id_funcionalidad": 4, "nombre": "Ver Reportes"},
            {"id_funcionalidad": 5, "nombre": "Gestionar Proveedores"},
            {"id_funcionalidad": 6, "nombre": "Administrar Configuración"},
        ]
        
        # Create functionalities if they don't exist
        for func_data in basic_functionalities:
            func = db.query(Funcionalidad).filter(Funcionalidad.id_funcionalidad == func_data["id_funcionalidad"]).first()
            if not func:
                new_func = Funcionalidad(**func_data)
                db.add(new_func)
                print(f"✅ Created functionality: {func_data['nombre']}")
        
        # Commit changes
        db.commit()
        
        # FUNCTION TO ASSIGN FUNCTIONALITIES TO A USER BY THEIR CEDULA
        def assign_functionalities_to_user(user_cedula):
            user = db.query(Usuario).filter(Usuario.cedula == user_cedula).first()
            if user:
                # Get all functionalities
                all_funcs = db.query(Funcionalidad).all()
                
                for func in all_funcs:
                    # Check if the assignment already exists
                    existing = (
                        db.query(UsuarioFuncionalidad)
                        .filter(UsuarioFuncionalidad.usuario_cedula == user_cedula)
                        .filter(UsuarioFuncionalidad.funcionalidad_id == func.id_funcionalidad)
                        .first()
                    )
                    
                    if not existing:
                        new_assignment = UsuarioFuncionalidad(
                            usuario_cedula=user_cedula,
                            funcionalidad_id=func.id_funcionalidad,
                            estado=True
                        )
                        db.add(new_assignment)
                        print(f"✅ Assigned {func.nombre} to user with cedula {user_cedula}")
                
                db.commit()
                return True
            else:
                print(f"❌ User with cedula {user_cedula} not found")
                return False
        
        # Assign all functionalities to the admin user (if exists)
        admin_user = db.query(Usuario).filter(Usuario.email == "admin@sistema.com").first()
        
        if admin_user:
            assign_functionalities_to_user(admin_user.cedula)
        
        # Assign all functionalities to the specific user with cedula 198309823
        assign_functionalities_to_user("198309823")
        
    except Exception as e:
        db.rollback()
        print(f"❌ Error creating functionalities: {str(e)}")
    finally:
        db.close()

if __name__ == "__main__":
    create_basic_functionalities()
    print("Initialization completed.")