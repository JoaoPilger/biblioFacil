import { BrowserRouter, Routes, Route, Navigate, Link } from 'react-router-dom'
import Login from './pages/login'
import Cadastro from './pages/cadastro'
import './App.css'

const USER_KEY = 'biblioFacil_user'

function tipoLabel(tipo) {
  if (tipo === 'bibliotecario') return 'Bibliotecário'
  if (tipo === 'leitor') return 'Leitor'
  return tipo
}

function Home() {
  const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(USER_KEY) : null
  const user = raw ? JSON.parse(raw) : null
  if (!user) return <Navigate to="/login" replace />
  return (
    <div style={{ padding: 24, fontFamily: 'Lato, sans-serif', background: '#f0e8df', minHeight: '100vh' }}>
      <p style={{ fontSize: '1.1rem', color: '#4a3728' }}>Olá, {user.nome}.</p>
      <p style={{ color: '#7a6555', marginTop: 8 }}>E-mail: {user.email}</p>
      <p style={{ color: '#7a6555' }}>Tipo: {tipoLabel(user.tipo)}</p>
      <button
        type="button"
        style={{
          marginTop: 20,
          padding: '10px 18px',
          background: '#8b3a2a',
          color: '#fdf8f4',
          border: 'none',
          borderRadius: 8,
          cursor: 'pointer',
          fontFamily: 'inherit',
        }}
        onClick={() => {
          localStorage.removeItem(USER_KEY)
          window.location.href = '/login'
        }}
      >
        Sair
      </button>
      <p style={{ marginTop: 24 }}>
        <Link to="/login" style={{ color: '#8b3a2a' }}>Ir para login</Link>
      </p>
    </div>
  )
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/cadastro" element={<Cadastro />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
