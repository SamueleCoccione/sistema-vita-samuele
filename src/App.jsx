import { BrowserRouter, Routes, Route } from 'react-router-dom';
import NavBar from './components/NavBar';
import Dashboard from './pages/Dashboard';
import CorpoMente from './pages/CorpoMente';
import MoneyLavoro from './pages/MoneyLavoro';
import Relazioni from './pages/Relazioni';
import Liberta from './pages/Liberta';
import ProgettoDigitale from './pages/ProgettoDigitale';

export default function App() {
  return (
    <BrowserRouter>
      <div className="global-grain" />
      <NavBar />
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
