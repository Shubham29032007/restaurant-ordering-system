import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import AdminLayout from './pages/admin/AdminLayout';
import MenuManager from './pages/admin/MenuManager';
import TableManager from './pages/admin/TableManager';
import QrSheet from './pages/admin/QrSheet';
import StaffManager from './pages/admin/StaffManager';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        {/* Phase 2: Admin Surface */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<Navigate to="/admin/menu" replace />} />
          <Route path="menu" element={<MenuManager />} />
          <Route path="tables" element={<TableManager />} />
          <Route path="qr-sheet" element={<QrSheet />} />
          <Route path="staff" element={<StaffManager />} />
        </Route>

        {/* Phase 3-6 surfaces (placeholders for future phases) */}
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
