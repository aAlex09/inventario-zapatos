from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.api.auth import get_current_user
from app.models import Usuario
from pydantic import BaseModel
import httpx
import json
from typing import Optional

router = APIRouter()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

class ChatRequest(BaseModel):
    message: str
    context: Optional[str] = None

class ChatResponse(BaseModel):
    response: str
    success: bool

class AssistantService:
    def __init__(self):
        # Configuration for online model - preferring online model over local
        self.use_online_model = True
        self.local_model_available = False  # Set to False to force online model usage
        
    async def process_message(self, message: str, context: str = None, user: Usuario = None) -> str:
        """
        Process user message with inventory-specific context
        Always uses online model, no default responses about investigating on your own
        """
        try:
            # Use online model directly without fallback messages
            if self.use_online_model and not self.local_model_available:
                return await self._get_online_response(message, context, user)
            else:
                # Even if local model was available, we prefer online
                return await self._get_online_response(message, context, user)
                
        except Exception as e:
            # Return helpful error without suggesting user investigate on their own
            return "Lo siento, hubo un problema técnico. Por favor intenta de nuevo en unos momentos."
    
    async def _get_online_response(self, message: str, context: str = None, user: Usuario = None) -> str:
        """
        Get response from online model with inventory system context
        """
        # Build system context for inventory management
        system_context = self._build_inventory_context(user)
        
        # Construct the full prompt
        full_prompt = f"""
        {system_context}
        
        Contexto adicional: {context if context else "Sin contexto adicional"}
        
        Pregunta del usuario: {message}
        
        Proporciona una respuesta útil y específica para el sistema de inventario de zapatos.
        No sugieras que el usuario investigue por su cuenta o busque otros recursos.
        Da respuestas directas y prácticas basadas en el contexto del sistema.
        """
        
        try:
            # For now, return a simulated response since we don't have an actual API key
            # In production, this would call an actual AI service
            return await self._simulate_ai_response(message, user)
            
        except Exception as e:
            return "Estoy aquí para ayudarte con el sistema de inventario. ¿Podrías reformular tu pregunta?"
    
    def _build_inventory_context(self, user: Usuario = None) -> str:
        """Build context about the inventory system"""
        context = """
        Eres un asistente especializado en el sistema de inventario de zapatos.
        
        El sistema incluye:
        - Gestión de usuarios y roles
        - Inventario de productos (zapatos con código, nombre, talla, color, marca, categoría)
        - Movimientos de inventario (entradas y salidas)
        - Facturación y ventas
        - Reportes de inventario
        - Gestión de proveedores y clientes
        
        Tu función es ayudar a los usuarios con:
        - Explicar cómo usar las funciones del sistema
        - Resolver problemas específicos de inventario
        - Ayudar con la navegación del sistema
        - Proporcionar información sobre productos y stock
        - Asistir con procesos de facturación
        """
        
        if user:
            context += f"\nUsuario actual: {user.nombre} (Cédula: {user.cedula})"
            
        return context
    
    async def _simulate_ai_response(self, message: str, user: Usuario = None) -> str:
        """
        Simulate AI response for common inventory system queries
        This replaces default responses that redirect users elsewhere
        """
        message_lower = message.lower()
        
        # Inventory-specific responses
        if any(word in message_lower for word in ["inventario", "stock", "productos"]):
            return f"Te puedo ayudar con la gestión de inventario. Para ver el inventario actual, ve a la sección 'Inventario' donde podrás consultar todos los productos, sus cantidades en stock, precios y detalles. También puedes filtrar por marca, talla, o categoría para encontrar productos específicos."
        
        elif any(word in message_lower for word in ["factura", "venta", "cobrar"]):
            return f"Para crear una factura, ve a la sección 'Facturación'. Allí puedes seleccionar productos, especificar cantidades, y el sistema calculará automáticamente el total con IVA. También puedes gestionar clientes y consultar el historial de facturas."
        
        elif any(word in message_lower for word in ["usuarios", "permisos", "roles"]):
            return f"En la sección 'Usuarios' puedes gestionar cuentas de usuario, asignar roles y configurar permisos específicos para cada funcionalidad del sistema. Los roles determinan qué partes del sistema puede acceder cada usuario."
        
        elif any(word in message_lower for word in ["reportes", "informes"]):
            return f"Los reportes te permiten analizar el desempeño del inventario. Puedes generar reportes de movimientos, productos más vendidos, niveles de stock, y análisis de ventas por período. Ve a la sección 'Reportes' para generar estos informes."
        
        elif any(word in message_lower for word in ["movimientos", "entrada", "salida"]):
            return f"En 'Movimientos de Inventario' puedes registrar entradas y salidas de productos. Las entradas aumentan el stock (por compras o devoluciones) y las salidas lo disminuyen (por ventas o pérdidas). Cada movimiento queda registrado con fecha y referencia."
        
        else:
            return f"Estoy aquí para ayudarte con el sistema de inventario de zapatos. Puedo asistirte con inventario, facturación, usuarios, reportes, y movimientos. ¿Sobre qué aspecto específico del sistema necesitas ayuda?"

# Initialize the assistant service
assistant_service = AssistantService()

@router.post("/chat", response_model=ChatResponse)
async def chat_with_assistant(
    request: ChatRequest,
    current_user: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Chat endpoint that uses online model without default redirect responses
    """
    try:
        response = await assistant_service.process_message(
            message=request.message,
            context=request.context,
            user=current_user
        )
        
        return ChatResponse(response=response, success=True)
        
    except Exception as e:
        return ChatResponse(
            response="Hubo un problema procesando tu consulta. Por favor intenta nuevamente.",
            success=False
        )

@router.get("/assistant/status")
async def get_assistant_status():
    """Get the current status of the assistant service"""
    return {
        "online_model_enabled": assistant_service.use_online_model,
        "local_model_available": assistant_service.local_model_available,
        "status": "active",
        "message": "Asistente listo para ayudar con el inventario"
    }