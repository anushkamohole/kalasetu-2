import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import Home from './pages/Home'
import ArtisanApp from './pages/ArtisanApp'
import ScanPage from './pages/ScanPage'
import ArtSnapPage from './pages/ArtSnapPage'
import ArtformDetails from './pages/ArtformDetails'
import './index.css'

export default function App() {
  return (
    <Router>
      <Navbar />
      {/* pt-[60px] accounts for the fixed navbar height */}
      <div style={{ paddingTop: '60px' }}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/artisan/*" element={<ArtisanApp />} />
          <Route path="/scan/:artifactId" element={<ScanPage />} />
          <Route path="/artsnap" element={<ArtSnapPage />} />
          <Route path="/artform/:slug" element={<ArtformDetails />} />
        </Routes>
      </div>
    </Router>
  )
}
