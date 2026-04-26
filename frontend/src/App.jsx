import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/login_cadastro/login'
import Cadastro from './pages/login_cadastro/cadastro'
import Resultado from './pages/resultado_busca'
import Livro from './pages/livro'
import PageInicial from './pages/page_inicial/page_inicial.jsx'
import './App.css'

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