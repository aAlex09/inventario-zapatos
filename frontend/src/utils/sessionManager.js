/**
 * Set up a handler to clear authentication on tab/window close
 */
export const setupAutoLogout = () => {
  // Variable para determinar si estamos navegando internamente
  let isNavigatingWithin = false;
  
  // Configurar un listener para la navegación interna
  const handleBeforeNavigate = () => {
    isNavigatingWithin = true;
    // Resetear el estado después de un breve período
    setTimeout(() => {
      isNavigatingWithin = false;
    }, 500);
  };

  // Handler para cuando el usuario intenta cerrar pestaña/ventana
  const handleBeforeUnload = () => {
    // Solo limpiar si no estamos navegando internamente
    if (!isNavigatingWithin) {
      localStorage.removeItem("token");
    }
  };

  // Agregar event listeners
  window.addEventListener('beforeunload', handleBeforeUnload);
  
  // Añadir event listener para detectar navegación interna
  document.body.addEventListener('click', (e) => {
    // Verificar si se hizo clic en un enlace o botón que podría navegar
    if (e.target.tagName === 'A' || 
        e.target.tagName === 'BUTTON' || 
        e.target.closest('a') || 
        e.target.closest('button')) {
      handleBeforeNavigate();
    }
  });

  // Retornar función para eliminar los listeners (limpieza)
  return () => {
    window.removeEventListener('beforeunload', handleBeforeUnload);
    document.body.removeEventListener('click', handleBeforeNavigate);
  };
};