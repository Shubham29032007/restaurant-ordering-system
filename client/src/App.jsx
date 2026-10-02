import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        {/* Phase 2+ surfaces — placeholders only */}
        <Route path="/admin/*"   element={<div className="p-8 text-white">Admin — Phase 2</div>} />
        <Route path="/kitchen"   element={<div className="p-8 text-white">Kitchen — Phase 5</div>} />
        <Route path="/staff"     element={<div className="p-8 text-white">Staff — Phase 6</div>} />
        <Route path="/kiosk"     element={<div className="p-8 text-white">Kiosk — Phase 4</div>} />
        <Route path="/board"     element={<div className="p-8 text-white">Board — Phase 6</div>} />
        <Route path="/t/:token"  element={<div className="p-8 text-white">Dine-in — Phase 3</div>} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
