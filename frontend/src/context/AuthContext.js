import React, { createContext, useState, useContext } from 'react';

const AUTH_STORAGE_KEY = 'user';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem(AUTH_STORAGE_KEY);
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const login = (userData) => {
    setUser(userData);
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(userData));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem(AUTH_STORAGE_KEY);
  };

  const value = {
    user,
    login,
    logout,
    isAuthenticated: !!user,
    userId: user?.id,
    userRole: user?.role?.roleName,
    branchId: user?.branch?.id,
    username: user?.username,
    fullName: user?.fullName
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
