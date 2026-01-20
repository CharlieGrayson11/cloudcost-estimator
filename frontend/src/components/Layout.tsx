import { ReactNode, useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Cloud, Menu, X, Calculator, GitCompare, Info, Home, Activity, AlertCircle } from 'lucide-react';
import clsx from 'clsx';
import { getHealth } from '../services/api';

interface LayoutProps {
  children: ReactNode;
}

interface ApiStatus {
  version: string;
  status: 'healthy' | 'degraded' | 'unavailable' | 'loading';
  pricingApis: {
    azure: string;
    aws: string;
    gcp: string;
  } | null;
}

const navItems = [
  { path: '/', label: 'Home', icon: Home },
  { path: '/estimator', label: 'Estimator', icon: Calculator },
  { path: '/compare', label: 'Compare', icon: GitCompare },
  { path: '/about', label: 'About', icon: Info },
];

export default function Layout({ children }: LayoutProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  
  // API Status state
  const [apiStatus, setApiStatus] = useState<ApiStatus>({
    version: '-',
    status: 'loading',
    pricingApis: null,
  });

  // Fetch API health status
  useEffect(() => {
    const checkHealth = async () => {
      try {
        const health = await getHealth();
        setApiStatus({
          version: health.version,
          status: health.status === 'healthy' ? 'healthy' : 'degraded',
          pricingApis: health.pricing_api_status,
        });
      } catch (error) {
        setApiStatus({
          version: '-',
          status: 'unavailable',
          pricingApis: null,
        });
      }
    };

    checkHealth();
    
    // Refresh health status every 60 seconds
    const interval = setInterval(checkHealth, 60000);
    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
      case 'live':
        return 'text-green-400';
      case 'degraded':
      case 'cached':
        return 'text-yellow-400';
      default:
        return 'text-red-400';
    }
  };

  const getStatusDotColor = (status: string) => {
    switch (status) {
      case 'live':
        return 'bg-green-400';
      case 'cached':
      case 'degraded':
        return 'bg-yellow-400';
      case 'no API key':
        return 'bg-slate-500';
      default:
        return 'bg-red-400';
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-slate-950/80 backdrop-blur-lg border-b border-slate-800">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-3 group">
              <div className="relative">
                <Cloud className="w-8 h-8 text-cloud-500 group-hover:text-cloud-400 transition-colors" />
                <div className="absolute inset-0 bg-cloud-500/20 blur-lg group-hover:bg-cloud-400/30 transition-colors" />
              </div>
              <span className="font-display text-xl font-semibold text-white">
                Cloud<span className="text-cloud-400">Cost</span>
              </span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={clsx(
                      'flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200',
                      isActive
                        ? 'bg-cloud-600/20 text-cloud-400 border border-cloud-600/30'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800'
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    {item.label}
                  </Link>
                );
              })}
            </div>

            {/* Mobile menu button */}
            <button
              className="md:hidden p-2 text-slate-400 hover:text-white"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </nav>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-slate-800 bg-slate-950/95 backdrop-blur-lg">
            <div className="px-4 py-4 space-y-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={clsx(
                      'flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all duration-200',
                      isActive
                        ? 'bg-cloud-600/20 text-cloud-400 border border-cloud-600/30'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800'
                    )}
                  >
                    <Icon className="w-5 h-5" />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-1">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 bg-slate-950/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            {/* App name */}
            <div className="flex items-center gap-2 text-slate-500">
              <Cloud className="w-5 h-5" />
              <span className="font-display">CloudCost Estimator</span>
            </div>

            {/* API Status */}
            <div className="flex flex-wrap items-center justify-center gap-3 text-xs text-slate-500">
              {/* Version */}
              <div className="flex items-center gap-1.5">
                <span>Version:</span>
                <span className="text-slate-300 font-mono">
                  {apiStatus.version !== '-' ? `v${apiStatus.version}` : '-'}
                </span>
              </div>

              <span className="text-slate-700">|</span>

              {/* API Status */}
              <div className="flex items-center gap-1.5">
                {apiStatus.status === 'loading' ? (
                  <Activity className="w-3 h-3 text-slate-400 animate-pulse" />
                ) : apiStatus.status === 'healthy' ? (
                  <Activity className="w-3 h-3 text-green-400" />
                ) : (
                  <AlertCircle className="w-3 h-3 text-red-400" />
                )}
                <span>API:</span>
                <span className={getStatusColor(apiStatus.status)}>
                  {apiStatus.status === 'loading' 
                    ? 'Checking... ' 
                    : apiStatus.status.charAt(0).toUpperCase() + apiStatus.status.slice(1)}
                </span>
              </div>

              {/* Pricing API Status - visible on medium screens and up */}
              {apiStatus.pricingApis && (
                <>
                  <span className="text-slate-700 hidden sm:inline">|</span>
                  <div className="hidden sm:flex items-center gap-3">
                    <span className="flex items-center gap-1">
                      <span className={clsx('w-1.5 h-1.5 rounded-full', getStatusDotColor(apiStatus.pricingApis.aws))} />
                      <span>AWS</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <span className={clsx('w-1.5 h-1.5 rounded-full', getStatusDotColor(apiStatus.pricingApis.azure))} />
                      <span>Azure</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <span className={clsx('w-1.5 h-1.5 rounded-full', getStatusDotColor(apiStatus.pricingApis.gcp))} />
                      <span>GCP</span>
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}