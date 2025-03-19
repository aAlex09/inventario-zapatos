from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.auth import router as auth_router
from app.api.users import router as users_router
from app.database import engine, Base
from app.init_db import init_db  # Import the initialization function
import logging

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI()

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # Frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# crea las tablas si no existen
Base.metadata.create_all(bind=engine)

# Inicializa la base de datos
try:
    init_db()
    logger.info("Database initialized successfully")
except Exception as e:
    logger.error(f"Error initializing database: {str(e)}")

@app.get("/") # Ruta raíz
def read_root():
    return {"message": "API del Inventario de Zapatos corriendo"}

# Include routers
app.include_router(auth_router, prefix="/api")
app.include_router(users_router, prefix="/api")