/**
 * Set up a handler to clear authentication on tab/window close
 */
export const setupAutoLogout = () => {
  // Handler for when user tries to close tab/window
  const handleBeforeUnload = () => {
    // Clear token and authentication data
    localStorage.removeItem("token");
  };

  // Add event listener for tab/window close
  window.addEventListener('beforeunload', handleBeforeUnload);

  // Return function to remove listener (for cleanup)
  return () => {
    window.removeEventListener('beforeunload', handleBeforeUnload);
  };
};