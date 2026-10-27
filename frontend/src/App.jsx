import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import Movements from './pages/Movements';
import Team from './pages/Team';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        
        {/* Rotas Protegidas com Layout de Sidebar Corporativa */}
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute>
              <Layout>
                <Dashboard />
              </Layout>
            </ProtectedRoute>
          } 
        />

        <Route 
          path="/produtos" 
          element={
            <ProtectedRoute>
              <Layout>
                <Products />
              </Layout>
            </ProtectedRoute>
          } 
        />

        <Route 
          path="/movimentacoes" 
          element={
            <ProtectedRoute>
              <Layout>
                <Movements />
              </Layout>
            </ProtectedRoute>
          } 
        />

        {/* Gestão de Equipe: Rota EXCLUSIVA para Administradores */}
        <Route 
          path="/equipe" 
          element={
            <ProtectedRoute roleRequired="ADMIN">
              <Layout>
                <Team />
              </Layout>
            </ProtectedRoute>
          } 
        />

        {/* Rota Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
