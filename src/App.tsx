import { Navigate, Route, Routes } from 'react-router-dom';
import Layout from './Layout';
import ToolPage from './pages/ToolPage';
import PointsPage from './pages/PointsPage';
import { machines } from './machines';

export default function App() {
  return (
    <Routes>
      <Route path="/:machineId" element={<Layout />}>
        <Route index element={<Navigate to="tool" replace />} />
        <Route path="tool" element={<ToolPage />} />
        <Route path="points" element={<PointsPage />} />
      </Route>
      <Route path="*" element={<Navigate to={`/${machines[0].id}/tool`} replace />} />
    </Routes>
  );
}
