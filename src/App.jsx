import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import NavBar from './components/NavBar';
import Login from './components/Login';
import Dashboard from './pages/Dashboard';
import CorpoMente from './pages/CorpoMente';
import MoneyLavoro from './pages/MoneyLavoro';
import Relazioni from './pages/Relazioni';
import Liberta from './pages/Liberta';
import ProgettoDigitale from './pages/ProgettoDigitale';

export default function App() {
  const { user, loading, login, logout } = useAuth();

  if (loading) return (
    <div style={{
      minHeight: '100vh', background: 'var(--bg)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: 12, color: 'var(--text3)', letterSpacing: '0.08em',
    }}>
      <div className="global-grain" />
    </div>
  );

  if (!user) return <Login login={login} />;

  return (
    <BrowserRouter>
      <div className="global-grain" />
      <NavBar logout={logout} />
      <main>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/corpo-mente" element={<CorpoMente />} />
          <Route path="/money-lavoro" element={<MoneyLavoro />} />
          <Route path="/relazioni" element={<Relazioni />} />
          <Route path="/liberta" element={<Liberta />} />
          <Route path="/progetto-digitale" element={<ProgettoDigitale />} />
        </Routes>
      </main>
    </BrowserRouter>
  );
}
