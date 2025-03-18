import React from "react";

export default function Login() {
  return (
    <div style={{ textAlign: "center", marginTop: "50px" }}>
      <h1>Bienvenido al Sistema salchichon</h1>
      <p>Por favor, inicia sesión</p>
      <input type="text" placeholder="Correo" /><br /><br />
      <input type="password" placeholder="Contraseña" /><br /><br />
      <button>Entrar</button>
    </div>
  );
}
