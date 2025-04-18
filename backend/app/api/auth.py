from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, status
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models import Usuario, Funcionalidad, UsuarioFuncionalidad, Rol
from app.schemas import LoginRequest, TokenResponse, PasswordResetRequest, PasswordReset
from passlib.context import CryptContext
from datetime import datetime, timedelta
import secrets
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from jose import jwt, JWTError
from fastapi.security import OAuth2PasswordBearer

SECRET_KEY = "supersecretkey"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30
# Para token de reset de contraseña
RESET_TOKEN_EXPIRE_HOURS = 24

# Configuración del correo (idealmente esto estaría en variables de entorno)
EMAIL_HOST = "smtp.gmail.com"
EMAIL_PORT = 587
EMAIL_USERNAME = "torrehanoi862@gmail.com"  # Actualiza con tu correo
EMAIL_PASSWORD = "gpnm ddrn myel wqrr"  # Actualiza con tu contraseña de app

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

router = APIRouter()

# Diccionario para almacenar tokens de recuperación (en producción usaría base de datos)
password_reset_tokens = {}

# Esquema de autenticación OAuth2
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/login")

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def send_password_reset_email(email: str, reset_token: str, background_tasks: BackgroundTasks):
    # URL de frontend para resetear la contraseña
    reset_url = f"http://localhost:5173/reset-password/{reset_token}"
    
    # Función que será ejecutada en segundo plano
    def send_email():
        try:
            # Configurar email
            message = MIMEMultipart()
            message["From"] = EMAIL_USERNAME
            message["To"] = email
            message["Subject"] = "Recuperación de contraseña - Inventario de Zapatos"
            
            # Cuerpo del correo HTML
            html = f"""
            <html>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                <div style="max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 5px;">
                    <h2 style="color: #6764ff; text-align: center;">Recuperación de Contraseña</h2>
                    <p>Hemos recibido una solicitud para restablecer la contraseña de su cuenta en el sistema de Inventario de Zapatos.</p>
                    <p>Para restablecer su contraseña, haga clic en el siguiente enlace:</p>
                    <p style="text-align: center;">
                        <a href="{reset_url}" 
                           style="background-color: #6764ff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
                            Restablecer Contraseña
                        </a>
                    </p>
                    <p>Si no solicitó restablecer su contraseña, puede ignorar este correo.</p>
                    <p>El enlace expirará en 24 horas.</p>
                    <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
                    <p style="font-size: 12px; color: #777; text-align: center;">
                        Este es un correo automático, por favor no responda a este mensaje.
                    </p>
                </div>
            </body>
            </html>
            """
            
            message.attach(MIMEText(html, "html"))
            
            # Conectar al servidor SMTP
            server = smtplib.SMTP(EMAIL_HOST, EMAIL_PORT)
            server.starttls()
            server.login(EMAIL_USERNAME, EMAIL_PASSWORD)
            server.send_message(message)
            server.quit()
            
            print(f"Correo de recuperación enviado a {email}")
        except Exception as e:
            print(f"Error enviando correo: {str(e)}")
    
    # Ejecutar en segundo plano
    background_tasks.add_task(send_email)

async def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Credenciales inválidas",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        # Decodificar el token
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
        
        # Extraer la cédula del token
        cedula = payload.get("cedula")
        if cedula is None:
            raise credentials_exception
            
        # Buscar el usuario en la base de datos
        user = db.query(Usuario).filter(Usuario.email == email).first()
        if user is None:
            raise credentials_exception
            
        return user
    except JWTError:
        raise credentials_exception

def check_functionality(required_functionality_name: str):
    async def verify_functionality(current_user: Usuario = Depends(get_current_user), db: Session = Depends(get_db)):
        # Buscar si el usuario tiene la funcionalidad requerida
        has_functionality = (
            db.query(UsuarioFuncionalidad)
            .join(Funcionalidad)
            .filter(UsuarioFuncionalidad.usuario_cedula == current_user.cedula)
            .filter(Funcionalidad.nombre == required_functionality_name)
            .filter(UsuarioFuncionalidad.estado == True)
            .first()
        ) is not None
        
        if not has_functionality:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"No tiene permiso para acceder a esta funcionalidad: {required_functionality_name}",
            )
        return current_user
    return verify_functionality

@router.post("/login", response_model=TokenResponse) 
def login(request: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(Usuario).filter(Usuario.email == request.email).first()
    if not user or not pwd_context.verify(request.password, user.contraseña_login):
        raise HTTPException(status_code=401, detail="usuario o contraseña incorrectos")

    # Get the role name
    role = db.query(Rol).filter(Rol.id_rol == user.tipo_usuario_rol).first()
    role_name = role.nombre if role else "Usuario"

    # Include more user data in the token
    token_data = {
        "sub": user.email, 
        "role": user.tipo_usuario_rol,
        "cedula": user.cedula,
        "nombre": user.nombre,
        "rol_nombre": role_name
    }
    token = jwt.encode(token_data, SECRET_KEY, algorithm=ALGORITHM)

    # Return user data in the response
    return {
        "access_token": token, 
        "token_type": "bearer",
        "cedula": user.cedula
    }

@router.post("/request-password-reset") # Ruta para solicitar restablecimiento de contraseña
def request_password_reset(request: PasswordResetRequest, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    # Verificar si el usuario existe
    user = db.query(Usuario).filter(Usuario.email == request.email).first()
    if not user:
        # Por seguridad, no revelamos si el correo existe o no
        return {"message": "Si su correo está registrado, recibirá un enlace para restablecer su contraseña"}
    
    # Generar token único
    reset_token = secrets.token_urlsafe(32)
    
    # Guardar token con tiempo de expiración (24 horas)
    expiry = datetime.now() + timedelta(hours=RESET_TOKEN_EXPIRE_HOURS)
    password_reset_tokens[reset_token] = {"email": request.email, "expiry": expiry}
    
    # Enviar correo con enlace de recuperación
    send_password_reset_email(request.email, reset_token, background_tasks)
    
    return {"message": "Si su correo está registrado, recibirá un enlace para restablecer su contraseña"}

@router.get("/validate-reset-token/{token}") #ruta para validar el token de restablecimiento de contraseña
def validate_reset_token(token: str):
    if token not in password_reset_tokens:
        raise HTTPException(status_code=404, detail="Token no válido")
    
    token_data = password_reset_tokens[token]
    if datetime.now() > token_data["expiry"]:
        # Eliminar token expirado
        del password_reset_tokens[token]
        raise HTTPException(status_code=400, detail="El token ha expirado")
    
    return {"valid": True}

@router.post("/reset-password") # Ruta para restablecer la contraseña
def reset_password_with_token(request: PasswordReset, db: Session = Depends(get_db)):
    if request.token not in password_reset_tokens:
        raise HTTPException(status_code=404, detail="Token no válido")
    
    token_data = password_reset_tokens[request.token]
    if datetime.now() > token_data["expiry"]:
        # Eliminar token expirado
        del password_reset_tokens[request.token]
        raise HTTPException(status_code=400, detail="El token ha expirado")
    
    # Buscar usuario por email
    user = db.query(Usuario).filter(Usuario.email == token_data["email"]).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    
    # Actualizar contraseña
    hashed_password = pwd_context.hash(request.password)
    user.contraseña_login = hashed_password
    db.commit()
    
    # Eliminar token usado
    del password_reset_tokens[request.token]
    
    return {"message": "Contraseña actualizada con éxito"}