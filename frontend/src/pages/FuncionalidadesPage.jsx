import React, { useEffect, useState } from "react";
import { jwtDecode } from "jwt-decode";
import { useNavigate } from "react-router-dom";

export default function FuncionalidadesPage() {
  const [usuarios, setUsuarios] = useState([]);
  const [funcionalidades, setFuncionalidades] = useState([]);
  const [asignaciones, setAsignaciones] = useState({}); // { "cedula-funcionalidad_id": true/false }
  const navigate = useNavigate();

  const token = localStorage.getItem("token");
  const decoded = token ? jwtDecode(token) : null;

  useEffect(() => {
    if (!token || !decoded || decoded.role !== 1) {
      navigate("/");
      return;
    }

    const fetchData = async () => {
      try {
        const [usersRes, funcionesRes, asignacionesRes] = await Promise.all([
          fetch("http://localhost:8000/api/users", {
            headers: { Authorization: `Bearer ${token}` }
          }),
          fetch("http://localhost:8000/api/funcionalidades", {
            headers: { Authorization: `Bearer ${token}` }
          }),
          fetch("http://localhost:8000/api/funcionalidades/asignaciones", {
            headers: { Authorization: `Bearer ${token}` }
          })
        ]);

        const [usersData, funcionesData, asignacionesData] = await Promise.all([
          usersRes.json(),
          funcionesRes.json(),
          asignacionesRes.json()
        ]);

        setUsuarios(usersData);
        setFuncionalidades(funcionesData);

        const nuevasAsignaciones = {};
        asignacionesData.forEach(({ cedula, funcionalidad_id, estado }) => {
          nuevasAsignaciones[`${cedula}-${funcionalidad_id}`] = estado;
        });
        setAsignaciones(nuevasAsignaciones);
      } catch (error) {
        console.error("Error cargando datos:", error);
      }
    };

    fetchData();
  }, [token]);

  const handleCheckboxChange = async (cedula, funcionalidad_id, estado) => {
    setAsignaciones({
      ...asignaciones,
      [`${cedula}-${funcionalidad_id}`]: estado,
    });

    try {
      await fetch(`http://localhost:8000/api/users/${cedula}/funcionalidad`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ funcionalidad_id, estado }),
      });
    } catch (error) {
      console.error("Error actualizando funcionalidad:", error);
    }
  };

  return (
    <div className="funcionalidades-container">
      <h2>Gestión de Funcionalidades por Usuario</h2>
      <table className="funcionalidades-table">
        <thead>
          <tr>
            <th>Cédula</th>
            <th>Nombre</th>
            {funcionalidades.map((f) => (
              <th key={f.id_funcionalidad}>{f.nombre}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {usuarios.map((u) => (
            <tr key={u.cedula}>
              <td>{u.cedula}</td>
              <td>{u.nombre}</td>
              {funcionalidades.map((f) => {
                const key = `${u.cedula}-${f.id_funcionalidad}`;
                return (
                  <td key={key}>
                    <input
                      type="checkbox"
                      checked={!!asignaciones[key]}
                      onChange={(e) =>
                        handleCheckboxChange(u.cedula, f.id_funcionalidad, e.target.checked)
                      }
                    />
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
