import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/login';
import Register from './components/register';
import Shortener from './components/shortener';
import Dashboard from './components/dashboard';

function App() {
  return (
    <Routes>
      {/* Redirect from the root path "/" to "/login" */}
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/shortener" element={<Shortener />} />
      <Route path="/dashboard" element={<Dashboard />} />
    </Routes>
  );
}

export default App;