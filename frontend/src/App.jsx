import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/login_cadastro/login'
import Cadastro from './pages/login_cadastro/cadastro'
import Resultado from './pages/resultado_busca'
import Livro from './pages/livro'
import PageInicial from './pages/page_inicial/page_inicial.jsx'
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
    <div className="home-container">
      <p className="welcome-text">Olá, {user.nome}.</p>
      <p className="user-info">E-mail: {user.email}</p>
      <p className="user-info">Tipo: {tipoLabel(user.tipo)}</p>
      
      <button
        type="button"
        className="btn-logout"
        onClick={() => {
          localStorage.removeItem(USER_KEY)
          localStorage.removeItem('biblioFacil_token')
          window.location.href = '/login'
        }}
      >
        Sair
      </button>

      <p className="login-link-container">
        <Link to="/login" className="login-link">Ir para login</Link>
      </p>
    </div>
  )
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<PageInicial />} />
        <Route path="/login" element={<Login />} />
        <Route path="/cadastro" element={<Cadastro />} />
        <Route path="*" element={<Navigate to="/" replace />} />
        <Route path="/resultado_busca" element={<Resultado />}/>
        <Route path="/livro" element={<Livro />}/>
      </Routes>
    </BrowserRouter>
  )
}

export default App