import { Routes, Route } from 'react-router-dom'
import Login from './components/login'
import Register from './components/register'
import Shortener from './components/shortener'
import Dashboard from './components/dashboard'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Shortener />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/dashboard" element={<Dashboard />} />
    </Routes>
  )
}

export default App
