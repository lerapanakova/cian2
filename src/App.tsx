import { Routes, Route } from 'react-router-dom';
import { UIKitPage } from './pages/UIKitPage';
import { MortgagePage } from './pages/MortgagePage';
import { ScenarioMapPage } from './pages/ScenarioMapPage';
export default function App() {
  return (
    <Routes>
      <Route path="/mortgage" element={<MortgagePage />} />
      <Route path="/map" element={<ScenarioMapPage />} />
      <Route path="*" element={<UIKitPage />} />
    </Routes>
  );
}
