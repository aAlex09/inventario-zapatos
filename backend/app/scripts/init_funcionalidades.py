from app.database import SessionLocal
from app.models import Funcionalidad

def init_funcionalidades():
    db = SessionLocal()
    try:
        # Lista de funcionalidades básicas
        funcionalidades = [
            {"id_funcionalidad": 1, "nombre": "Gestionar Usuarios"},
            {"id_funcionalidad": 2, "nombre": "Gestionar Inventario"},
            {"id_funcionalidad": 3, "nombre": "Gestionar Ventas"},
            {"id_funcionalidad": 4, "nombre": "Ver Reportes"},
            # Agregar más funcionalidades según necesites
        ]
        
        for func_data in funcionalidades:
            func = db.query(Funcionalidad).filter(
                Funcionalidad.id_funcionalidad == func_data["id_funcionalidad"]
            ).first()
            
            if not func:
                new_func = Funcionalidad(**func_data)
                db.add(new_func)
        
        db.commit()
        print("✅ Funcionalidades inicializadas correctamente")
    except Exception as e:
        print(f"❌ Error inicializando funcionalidades: {str(e)}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    init_funcionalidades()