from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# URL directa de la base de datos (reemplaza con tus credenciales)
DATABASE_URL = "postgresql://postgres:123456789@localhost:5432/inventario"

# Crear el motor de SQLAlchemy
engine = create_engine(DATABASE_URL)

# Crear una sesión local
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Crear la base para los modelos
Base = declarative_base()

# Función para obtener una sesión de base de datos
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
