from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os
from app.database import engine
from app.models import Base
from app.api import users, auth, funcionalidades, inventario, movimientos, reportes, facturas, clientes

app = FastAPI(title="Inventario API")

# Configurar CORS
origins = [
    "http://localhost:3000",
    "http://localhost:5173",
    # Agrega aquí otros orígenes permitidos
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# crea las tablas si no existen
Base.metadata.create_all(bind=engine)

@app.get("/")
def read_root():
    return {"message": "API de Inventario de Zapatos"}

# Incluir los routers
app.include_router(auth.router, prefix="/api", tags=["auth"])
app.include_router(users.router, prefix="/api", tags=["users"])
app.include_router(funcionalidades.router, prefix="/api", tags=["funcionalidades"])
app.include_router(inventario.router, prefix="/api", tags=["inventario"])
app.include_router(movimientos.router, prefix="/api", tags=["movimientos"])
app.include_router(reportes.router, prefix="/api", tags=["reportes"])
app.include_router(facturas.router, prefix="/api", tags=["facturas"])
app.include_router(clientes.router, prefix="/api", tags=["clientes"])