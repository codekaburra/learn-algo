import { Route, Routes } from 'react-router-dom';
import Nav from '../components/Nav';
import Background from '../components/Background';
import HomePage from './HomePage';
import CatalogPage from './CatalogPage';
import AlgoPage from './AlgoPage';
import ExercisePage from './ExercisePage';

export default function App() {
  return (
    <>
      <Background />
      <Nav />
      <main>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/academy" element={<CatalogPage />} />
          <Route path="/academy/:slug" element={<AlgoPage />} />
          <Route path="/exercise" element={<ExercisePage />} />
          <Route path="*" element={<HomePage />} />
        </Routes>
      </main>
    </>
  );
}
