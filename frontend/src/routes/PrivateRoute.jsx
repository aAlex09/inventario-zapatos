import React, { useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import Assistant from "../components/Assistant";

export default function PrivateRoute({ children }) {
    const token = localStorage.getItem("token");
    const [userData, setUserData] = useState(null);
    
    useEffect(() => {
        if (token) {
            try {
                const decoded = jwtDecode(token);
                setUserData(decoded);
            } catch (error) {
                console.error('Error decoding token:', error);
                // Clear invalid token
                localStorage.removeItem("token");
            }
        }
    }, [token]);

    if (!token) {
        return <Navigate to="/" />;
    }

    return (
        <>
            {children}
            <Assistant userData={userData} />
        </>
    );
}
