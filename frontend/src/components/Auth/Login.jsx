import { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import axios from "../../api/axios";
import { AuthContext } from "../../context/AuthContext";
import "../../styles/auth.css"; 

export default function Login() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  // Validation function
  const validateForm = () => {
    const newErrors = {};

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
      const { data } = await axios.post("/auth/login", form);
      
      // Correct parsing from backend response
      login(data.data, data.data.accessToken);
      
      setSuccessMessage("Login successful! Redirecting...");
      
      // Redirect after brief delay
      setTimeout(() => {
        navigate("/dashboard");
      }, 800);

    } catch (err) {
      setErrors({ 
        submit: err.response?.data?.message || "Login failed. Please try again." 
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <form className="auth-form" onSubmit={handleSubmit} noValidate>
        <h2>Welcome Back</h2>
        <p>Sign in to your chat account</p>

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
              type="email"
              name="email"
              placeholder="Enter your email"
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
              placeholder="Enter your password"
              value={form.password}
              onChange={handleChange}
              className={errors.password ? "error" : ""}
              disabled={isLoading}
              required
            />
            {errors.password && <span className="error-message">{errors.password}</span>}
          </div>
        </div>

        <button 
          type="submit" 
          disabled={isLoading}
          className={isLoading ? "loading" : ""}
        >
          {isLoading ? "Signing In..." : "Sign In"}
        </button>

        <p>
          Don't have an account? <span onClick={() => !isLoading && navigate("/register")} style={{ cursor: isLoading ? "not-allowed" : "pointer" }}>
            Register here
          </span>
        </p>
      </form>
    </div>
  );
}
