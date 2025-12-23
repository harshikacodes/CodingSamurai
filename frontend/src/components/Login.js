import React, { useState, useContext } from "react";
import axios from "axios";
import {
  ComputerDesktopIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";
import { AuthContext } from "../context/AuthContext";
import { API_ENDPOINTS } from "../config/config";

const Login = () => {
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    rememberMe: false,
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { login } = useContext(AuthContext);

  /** Handle input changes */
  const handleChange = (e) => {
    const { name, type, checked, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  /** Handle login form submit */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const { username, password } = formData;
      const response = await axios.post(API_ENDPOINTS.AUTH.LOGIN, {
        username,
        password,
      });

      const { accessToken, refreshToken, user } = response.data;
      login(user, accessToken, refreshToken);

      if (formData.rememberMe) {
        localStorage.setItem("refreshToken", refreshToken);
      } else {
        sessionStorage.setItem("refreshToken", refreshToken);
      }
    } catch (err) {
      if (err.response) {
        setError(err.response.data?.error || "Invalid username or password");
      } else if (err.request) {
        setError("No response from server. Please try again.");
      } else {
        setError("Something went wrong. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 to-blue-200">
      <div className="bg-white shadow-xl rounded-2xl p-8 w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="flex justify-center mb-4">
            <div className="bg-blue-100 p-3 rounded-full">
              <ComputerDesktopIcon className="w-10 h-10 text-blue-600" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-gray-800">DSA Samurai</h1>
          <p className="text-gray-500">Sign in to track your progress</p>
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-center p-3 mb-4 text-sm text-red-700 bg-red-100 rounded-lg">
            <ExclamationTriangleIcon className="w-5 h-5 mr-2" />
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Username */}
          <div>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleChange}
              required
              autoFocus
              placeholder="Username"
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-400 focus:outline-none"
            />
          </div>

          {/* Password */}
          <div>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              placeholder="Password"
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-400 focus:outline-none"
            />
          </div>

          {/* Remember me */}
          <div className="flex items-center">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                id="rememberMe"
                name="rememberMe"
                checked={formData.rememberMe}
                onChange={handleChange}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
              />
              <span className="text-sm text-gray-600">Remember me</span>
            </label>
          </div>

          {/* Submit button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center items-center py-2 px-4 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 transition disabled:opacity-70"
          >
            {loading ? (
              <>
                <span className="loading-spinner mr-2"></span>
                Signing in...
              </>
            ) : (
              "Sign In"
            )}
          </button>
        </form>

        {/* Footer */}
        <div className="mt-6 text-center text-sm text-gray-500">
          Secure • Fast • Modern
        </div>
      </div>
    </div>
  );
};

export default Login;
