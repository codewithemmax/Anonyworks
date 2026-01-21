import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Landing from './pages/Landing';
import Signup from './pages/Signup';
import Login from './pages/Login';
import ForgotPassword from './pages/ForgotPassword';
import Dashboard from './pages/Dashboard';
import Pit from './pages/Pit';
import ViewMessage from './pages/ViewMessage';
import ProtectedRoute from './components/ProtectedRoute';
import { ToastContainer } from './components/Toast';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={
          <ProtectedRoute requireAuth={false}>
            <Landing />
          </ProtectedRoute>
        } />
        <Route path="/signup" element={
          <ProtectedRoute requireAuth={false}>
            <Signup />
          </ProtectedRoute>
        } />
        <Route path="/login" element={
          <ProtectedRoute requireAuth={false}>
            <Login />
          </ProtectedRoute>
        } />
        <Route path="/forgot-password" element={
          <ProtectedRoute requireAuth={false}>
            <ForgotPassword />
          </ProtectedRoute>
        } />
        <Route path="/pit/:id" element={<Pit />} />
        <Route path="/view-message/:pitId" element={
          <ProtectedRoute requireAuth={true}>
            <ViewMessage />
          </ProtectedRoute>
        } />
        <Route path="/dashboard" element={
          <ProtectedRoute requireAuth={true}>
            <Dashboard />
          </ProtectedRoute>
        } />
      </Routes>
      <ToastContainer />
    </BrowserRouter>
  );
}

export default App;
