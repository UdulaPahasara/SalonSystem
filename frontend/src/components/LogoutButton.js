import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';

const LogoutButton = () => {
    const { logout, user } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    // Don't show on login page
    if (!user || location.pathname === '/login' || location.pathname === '/') {
        return null;
    }

    const handleLogout = () => {
        if (window.confirm("Are you sure you want to logout?")) {
            logout();
            navigate('/login');
        }
    };

    return (
        <button
            onClick={handleLogout}
            style={{
                position: 'fixed',
                top: '20px',
                right: '20px',
                backgroundColor: '#e74c3c',
                color: 'white',
                border: 'none',
                padding: '10px 20px',
                borderRadius: '5px',
                fontWeight: 'bold',
                cursor: 'pointer',
                zIndex: 1000,
                boxShadow: '0 2px 5px rgba(0,0,0,0.2)'
            }}
        >
            Logout
        </button>
    );
};

export default LogoutButton;
