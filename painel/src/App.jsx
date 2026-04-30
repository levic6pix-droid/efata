import { SpeedInsights } from '@vercel/speed-insights/react';
import AdminPanelPage from './pages/AdminPanelPage';

function App() {
  return (
    <>
      <AdminPanelPage />
      <SpeedInsights />
    </>
  );
}

export default App;