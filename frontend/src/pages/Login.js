import React, { useState } from 'react';
import './Login.css';
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useAuth } from '../context/AuthContext';  // Add this import

function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [jobRole, setJobRole] = useState('');
  const navigate = useNavigate();
  const { login } = useAuth();  // Add this line

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Map UI 'Chashire' to backend 'Cashier' if selected, otherwise keep as is
    const roleToSend = jobRole === "Chashire" ? "Cashier" : jobRole;

    const loginData = {
      username: username,
      password: password,
      role: {
        roleName: roleToSend
      }
    };

    try {
      const response = await axios.post(
        "http://localhost:8081/salon-app/api/users/login",
        loginData
      );

      alert("Login successful!");

      // Store user data in context
      login(response.data);

      console.log("Logged in user:", response.data);

      // Redirect based on role
      if (response.data.role.roleName === "Owner") {
        navigate("/admin-dashboard");
      }
      else if (response.data.role.roleName === "Branch Manager") {
        navigate("/branch-dashboard");
      }
      else if (response.data.role.roleName === "Reception") {
        navigate("/reception-dashboard");
      }
      else if (response.data.role.roleName === "Product Manager") {
        navigate("/pm-dashboard");
      }
      // Backend returns 'Cashier', but we also handle 'Chashire' just in case
      else if (response.data.role.roleName === "Cashier" || response.data.role.roleName === "Chashire") {
        navigate("/cashier");
      }

    } catch (error) {
      console.error("Login error:", error);
      alert("Invalid username, password or role!");
    }
  };

  return (
    <div className="login-page-wrapper">
      <div className="login-container">
        <form onSubmit={handleSubmit}>
          <label htmlFor="jobRole">Job Role</label>
          {/* ... form content ... */}
          <select
            id="jobRole"
            value={jobRole}
            onChange={e => setJobRole(e.target.value)}
            required
          >
            <option value="">Select your job role</option>
            <option value="Owner">Owner</option>
            <option value="Branch Manager">Branch Manager</option>
            <option value="Reception">Reception</option>
            <option value="Product Manager">Product Manager</option>
            <option value="Chashire">Chashire</option>
          </select><br />

          <label htmlFor="username">Username</label>
          <input
            type="text"
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          /><br />

          <label htmlFor="password">Password</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          /><br />

          <button type="submit">Login</button>
        </form>
      </div>
    </div>
  );
}

export default Login;