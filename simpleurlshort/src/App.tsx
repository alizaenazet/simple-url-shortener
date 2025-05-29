import { Routes, Route } from 'react-router-dom'
import Login from './components/login'
import Register from './components/register'
import Shortener from './components/shortener'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Shortener />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
    </Routes>
  )
}

export default App
