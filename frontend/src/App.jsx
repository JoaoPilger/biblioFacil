import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import Login from './pages/login_cadastro/login'
import Cadastro from './pages/login_cadastro/cadastro'
import PageInicial from './pages/page_inicial/page_inicial'
import AdicionarLivro from './pages/adicionar_livro/add_livro'
import EditarLivro from './pages/editar_livro/edit_livro'
<<<<<<< HEAD
import ResultadoBusca from './pages/resultado_busca'
=======
import Resultado from './pages/resultado_busca/resultado_busca'
import Livro from './pages/livro/livro'
>>>>>>> 7b95c0a8e903052fda5fda03cb8d232b09113eda
import './App.css'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<PageInicial />} />
        <Route path="/login" element={<Login />} />
        <Route path="/cadastro" element={<Cadastro />} />
        <Route path="/adicionar-livro" element={<AdicionarLivro />} />
        <Route path="/editar-livro/:id" element={<EditarLivro />} />
<<<<<<< HEAD
        <Route path="/resultado_busca" element={<ResultadoBusca />} />
=======
        <Route path="/resultado_busca" element={<Resultado />}/>
        <Route path="/livro/:id" element={<Livro />}/>
>>>>>>> 7b95c0a8e903052fda5fda03cb8d232b09113eda
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App