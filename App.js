import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import PrivateRoute from './components/PrivateRoute';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import DesignEditor from './components/DesignEditor';
import Navbar from './components/Navbar';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Register from './components/Register';

function AppRoutes() {
  const { loading } = useAuth();

  if (loading) {
    return <div className="flex justify-center items-center h-screen"><div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-[var(--cursor-accent)]"></div></div>;
  }

  return (
    <Router>
      <div className="min-h-screen bg-[var(--cursor-bg)] text-[var(--cursor-text)]">
        <Navbar />
        <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
          <div className="max-w-7xl mx-auto">
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route
                path="/dashboard"
                element={
                  <PrivateRoute>
                    <div className="animate-slide-up">
                      <Dashboard />
                    </div>
                  </PrivateRoute>
                }
              />
              <Route
                path="/design/:id"
                element={
                  <PrivateRoute>
                    <div className="animate-slide-up">
                      <DesignEditor />
                    </div>
                  </PrivateRoute>
                }
              />
              <Route
                path="/design/new"
                element={
                  <PrivateRoute>
                    <div className="animate-slide-up">
                      <DesignEditor />
                    </div>
                  </PrivateRoute>
                }
              />
              <Route path="/" element={<Navigate to="/login" />} />
            </Routes>
          </div>
        </main>
        <ToastContainer
          position="top-right"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="dark"
        />
        <footer className="mt-auto py-6 border-t border-[var(--cursor-border)]">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center text-sm text-[var(--cursor-text)] opacity-75">
              © {new Date().getFullYear()} Room Canvas. All rights reserved.
            </div>
          </div>
        </footer>
      </div>
    </Router>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}

export default App; 