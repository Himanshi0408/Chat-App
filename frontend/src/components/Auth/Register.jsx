import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "../../api/axios";
import AuthLayout from "./AuthLayout";
import "../../styles/auth.css";

export default function Register() {
  const [form, setForm] = useState({ name: "", email: "", password: "", confirmPassword: "" });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const navigate = useNavigate();

  // Validation function
  const validateForm = () => {
    const newErrors = {};

    if (!form.name) {
      newErrors.name = "Name is required";
    } else if (form.name.length < 2) {
      newErrors.name = "Name must be at least 2 characters";
    }

    if (!form.email) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      newErrors.email = "Please enter a valid email";
    }

    if (!form.password) {
      newErrors.password = "Password is required";
    } else if (form.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    if (!form.confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password";
    } else if (form.password !== form.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    return newErrors;
  };

  // Handle input change
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: "" }));
    }
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccessMessage("");

    // Validate form
    const newErrors = validateForm();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsLoading(true);
    try {
      await axios.post("/auth/register", {
        name: form.name,
        email: form.email,
        password: form.password
      });

      setSuccessMessage("Registration successful! Redirecting to login...");
      
      // Reset form
      setForm({ name: "", email: "", password: "", confirmPassword: "" });

      // Redirect after brief delay
      setTimeout(() => {
        navigate("/login");
      }, 1200);

    } catch (err) {
      setErrors({ 
        submit: err.response?.data?.message || "Registration failed. Please try again." 
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout>
      <form className="auth-form" onSubmit={handleSubmit} noValidate>
        <h2>Create Account</h2>
        <p>Join us to start chatting with friends</p>

        {successMessage && (
          <div className="success-message show">{successMessage}</div>
        )}

        {errors.submit && (
          <div style={{ 
            color: '#e74c3c', 
            marginBottom: '15px', 
            padding: '10px', 
            backgroundColor: '#ffe6e6',
            borderRadius: '8px',
            fontSize: '13px'
          }}>
            {errors.submit}
          </div>
        )}

        <div className="auth-inputs">
          <div>
            <input
              type="text"
              name="name"
              placeholder="Full name"
              value={form.name}
              onChange={handleChange}
              className={errors.name ? "error" : ""}
              disabled={isLoading}
              required
            />
            {errors.name && <span className="error-message">{errors.name}</span>}
          </div>

          <div>
            <input
              type="email"
              name="email"
              placeholder="Email address"
              value={form.email}
              onChange={handleChange}
              onBlur={(e) => {
                if (e.target.value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.target.value)) {
                  setErrors(prev => ({ ...prev, email: "Invalid email format" }));
                }
              }}
              className={errors.email ? "error" : ""}
              disabled={isLoading}
              required
            />
            {errors.email && <span className="error-message">{errors.email}</span>}
          </div>

          <div>
            <input
              type="password"
              name="password"
              placeholder="Password (minimum 6 characters)"
              value={form.password}
              onChange={handleChange}
              className={errors.password ? "error" : ""}
              disabled={isLoading}
              required
            />
            {errors.password && <span className="error-message">{errors.password}</span>}
          </div>

          <div>
            <input
              type="password"
              name="confirmPassword"
              placeholder="Confirm password"
              value={form.confirmPassword}
              onChange={handleChange}
              className={errors.confirmPassword ? "error" : ""}
              disabled={isLoading}
              required
            />
            {errors.confirmPassword && <span className="error-message">{errors.confirmPassword}</span>}
          </div>
        </div>

        <button 
          type="submit" 
          disabled={isLoading}
          className={isLoading ? "loading" : ""}
        >
          {isLoading ? "Creating Account..." : "Sign Up"}
        </button>

        <p>
          Already have an account? <span onClick={() => !isLoading && navigate("/login")} style={{ cursor: isLoading ? "not-allowed" : "pointer" }}>
            Login here
          </span>
        </p>
      </form>
    </AuthLayout>
  );
}
