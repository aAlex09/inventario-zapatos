from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware  # Add this import
from app.api.auth import router as auth_router
from app.database import engine, Base

app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # Frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

Base.metadata.create_all(bind=engine)

@app.get("/")
def read_root():
    return {"message": "API del Inventario de Zapatos corriendo"}

app.include_router(auth_router, prefix="/api")