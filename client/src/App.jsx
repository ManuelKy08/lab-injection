import { BrowserRouter, Routes, Route, useParams } from 'react-router-dom';
import Navbar from './components/Navbar';
import Landing from './pages/Landing';
import Dashboard from './pages/Dashboard';
import ChallengePage from './pages/ChallengePage';
import { CHALLENGES } from './data/challenges';

// Redirect kategori -> filter manual di landing via anchor; route sederhana.
function KategoriPage() {
  const { id } = useParams();
  const valid = CHALLENGES.filter((c) => c.kategori.toLowerCase().startsWith(id.toLowerCase()));
  if (valid.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <h1 className="text-xl font-bold">Kategori tidak ditemukan</h1>
      </div>
    );
  }
  window.location.hash = 'daftar';
  return <Landing />;
}

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-[var(--color-bg)]">
        <Navbar />
        <main>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/kategori/:id" element={<KategoriPage />} />
            <Route path="/challenge/:id" element={<ChallengePage />} />
            <Route path="*" element={<Landing />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}