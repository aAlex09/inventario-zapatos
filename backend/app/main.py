from fastapi import FastAPI
from app.api.auth import router as auth_router
from app.database import engine, Base

app = FastAPI()

Base.metadata.create_all(bind=engine)

@app.get("/")
def read_root():
    return {"message": "API del Inventario de Zapatos corriendo"}

app.include_router(auth_router, prefix="/api")