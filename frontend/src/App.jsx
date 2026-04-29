import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import Login from './pages/login_cadastro/login'
import Cadastro from './pages/login_cadastro/cadastro'
import PageInicial from './pages/page_inicial/page_inicial'
import AdicionarLivro from './pages/adicionar_livro/add_livro'
import EditarLivro from './pages/editar_livro/edit_livro'
import Resultado from './pages/resultado_busca/resultado_busca'
import Livro from './pages/livro/livro'
import './App.css'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<PageInicial />} />
        <Route path="/login" element={<Login />} />
        <Route path="/cadastro" element={<Cadastro />} />
        <Route path="/adicionar-livro" element={<AdicionarLivro />} />
        <Route path="/editar/:id" element={<EditarLivro />} />
        <Route path="/resultado_busca" element={<Resultado />}/>
        <Route path="/livro/:id" element={<Livro />}/>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App