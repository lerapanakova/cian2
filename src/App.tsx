import { Routes, Route } from 'react-router-dom';
import { UIKitPage } from './pages/UIKitPage';
import { MortgagePage } from './pages/MortgagePage';
export default function App() {
  return (
    <Routes>
      <Route path="/mortgage" element={<MortgagePage />} />
      <Route path="*" element={<UIKitPage />} />
    </Routes>
  );
}
