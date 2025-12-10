import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import MapView from './pages/MapView';
import Dashboard from './pages/Dashboard';
import ReportIncident from './pages/ReportIncident';
import { AlertCircle, Menu, X } from 'lucide-react';

function App() {
  const [activeView, setActiveView] = useState('map');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleNavClick = (view) => {
    setActiveView(view);
    setMobileMenuOpen(false);
  };

  return (
    <Router>
      <div className="h-screen flex flex-col">
        {/* Header */}
        <header className="bg-crisis-red text-white shadow-lg z-50">
          <div className="container mx-auto px-3 sm:px-4 lg:px-6">
            <div className="flex items-center justify-between py-3 sm:py-4">
              {/* Logo */}
              <div className="flex items-center space-x-2 sm:space-x-3 flex-shrink-0">
                <AlertCircle className="w-6 h-6 sm:w-8 sm:h-8" />
                <div>
                  <h1 className="text-lg sm:text-xl md:text-2xl font-bold">CrisisFlow</h1>
                  <p className="hidden sm:block text-xs md:text-sm text-red-100">AI-Powered Disaster Response</p>
                </div>
              </div>
              
              {/* Desktop Navigation */}
              <nav className="hidden lg:flex space-x-2 xl:space-x-4">
                <Link
                  to="/"
                  className={`px-3 xl:px-4 py-2 rounded-lg transition text-sm xl:text-base ${
                    activeView === 'map'
                      ? 'bg-white text-crisis-red'
                      : 'text-white hover:bg-red-700'
                  }`}
                  onClick={() => handleNavClick('map')}
                >
                  Map View
                </Link>
                <Link
                  to="/dashboard"
                  className={`px-3 xl:px-4 py-2 rounded-lg transition text-sm xl:text-base ${
                    activeView === 'dashboard'
                      ? 'bg-white text-crisis-red'
                      : 'text-white hover:bg-red-700'
                  }`}
                  onClick={() => handleNavClick('dashboard')}
                >
                  Dashboard
                </Link>
                <Link
                  to="/report"
                  className="px-3 xl:px-4 py-2 bg-white text-crisis-red rounded-lg hover:bg-red-50 transition font-semibold text-sm xl:text-base"
                  onClick={() => handleNavClick('report')}
                >
                  Report Incident
                </Link>
              </nav>

              {/* Mobile Menu Button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden p-2 rounded-lg hover:bg-red-700 transition"
                aria-label="Toggle menu"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>

            {/* Mobile Navigation */}
            {mobileMenuOpen && (
              <nav className="lg:hidden pb-4 space-y-2">
                <Link
                  to="/"
                  className={`block px-4 py-3 rounded-lg transition ${
                    activeView === 'map'
                      ? 'bg-white text-crisis-red'
                      : 'text-white hover:bg-red-700'
                  }`}
                  onClick={() => handleNavClick('map')}
                >
                  🗺️ Map View
                </Link>
                <Link
                  to="/dashboard"
                  className={`block px-4 py-3 rounded-lg transition ${
                    activeView === 'dashboard'
                      ? 'bg-white text-crisis-red'
                      : 'text-white hover:bg-red-700'
                  }`}
                  onClick={() => handleNavClick('dashboard')}
                >
                  📊 Dashboard
                </Link>
                <Link
                  to="/report"
                  className="block px-4 py-3 bg-white text-crisis-red rounded-lg hover:bg-red-50 transition font-semibold"
                  onClick={() => handleNavClick('report')}
                >
                  🚨 Report Incident
                </Link>
              </nav>
            )}
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-hidden">
          <Routes>
            <Route path="/" element={<MapView />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/report" element={<ReportIncident />} />
          </Routes>
        </main>

        {/* Footer */}
        <footer className="bg-gray-800 text-white py-2 px-3 text-center text-xs sm:text-sm">
          <p className="truncate">CrisisFlow © 2025 | AI-Powered Disaster Response System</p>
        </footer>
      </div>
    </Router>
  );
}

export default App;
