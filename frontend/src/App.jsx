import { SpeedInsights } from '@vercel/speed-insights/react';
import StorefrontPage from './pages/StorefrontPage';

function App() {
  return (
    <>
      <StorefrontPage />
      <SpeedInsights />
    </>
  );
}

export default App;