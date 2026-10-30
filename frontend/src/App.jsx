import { Route, Routes } from 'react-router-dom';

import AppLayout from './components/AppLayout.jsx';
import AboutPage from './pages/AboutPage.jsx';
import LandingPage from './pages/LandingPage.jsx';
import NotFoundPage from './pages/NotFoundPage.jsx';
import ProcessingPage from './pages/ProcessingPage.jsx';
import ResultsPage from './pages/ResultsPage.jsx';
import UploadPage from './pages/UploadPage.jsx';

/**
 * App
 * Route table only. Layout chrome lives in AppLayout; each screen owns its
 * own content. Adding a screen means adding one <Route> here.
 */
export default function App() {
  return (
    <AppLayout>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/analyze" element={<UploadPage />} />
        <Route path="/analyzing" element={<ProcessingPage />} />
        <Route path="/results" element={<ResultsPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </AppLayout>
  );
}
