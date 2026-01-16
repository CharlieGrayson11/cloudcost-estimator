import { Link } from 'react-router-dom';
import { 
  Calculator, 
  GitCompare, 
  Cloud, 
  DollarSign, 
  Zap,
  Shield,
  ArrowRight
} from 'lucide-react';

const features = [
  {
    icon: Calculator,
    title: 'Accurate Estimates',
    description: 'Get precise cost estimates based on real pricing data from AWS, Azure, and GCP.',
  },
  {
    icon: GitCompare,
    title: 'Easy Comparison',
    description: 'Compare costs across providers side-by-side to make informed decisions.',
  },
  {
    icon: Zap,
    title: 'Instant Results',
    description: 'No sign-up required. Get estimates in seconds with our fast, responsive API.',
  },
  {
    icon: Shield,
    title: 'Always Updated',
    description: 'Pricing data regularly updated to reflect the latest cloud provider rates.',
  },
];

const providers = [
  { name: 'AWS', color: '#FF9900', description: 'Amazon Web Services' },
  { name: 'Azure', color: '#0078D4', description: 'Microsoft Azure' },
  { name: 'GCP', color: '#4285F4', description: 'Google Cloud Platform' },
];

export default function HomePage() {
  return (
    <div className="animate-fade-in">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Background effects */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-96 h-96 bg-cloud-600/20 rounded-full blur-3xl" />
          <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-cloud-800/20 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32">
          <div className="text-center max-w-4xl mx-auto">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cloud-600/10 border border-cloud-600/20 text-cloud-400 text-sm font-medium mb-8 animate-slide-up">
              <Cloud className="w-4 h-4" />
              Cloud Cost Estimation Tool
            </div>

            {/* Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-display font-bold text-white mb-6 animate-slide-up animate-delay-100">
              Estimate Cloud Costs{' '}
              <span className="gradient-text">Before You Deploy</span>
            </h1>

            {/* Subheadline */}
            <p className="text-lg sm:text-xl text-slate-400 mb-10 max-w-2xl mx-auto animate-slide-up animate-delay-200">
              Compare pricing across AWS, Azure, and GCP. Make data-driven decisions 
              about your cloud infrastructure with accurate cost projections.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-slide-up animate-delay-300">
              <Link to="/estimator" className="btn-primary flex items-center gap-2 text-lg">
                <Calculator className="w-5 h-5" />
                Start Estimating
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link to="/compare" className="btn-secondary flex items-center gap-2 text-lg">
                <GitCompare className="w-5 h-5" />
                Compare Providers
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Providers Section */}
      <section className="py-16 border-t border-b border-slate-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-slate-500 mb-8 font-medium">
            Supporting major cloud providers
          </p>
          <div className="flex flex-wrap items-center justify-center gap-8 lg:gap-16">
            {providers.map((provider) => (
              <div 
                key={provider.name}
                className="flex items-center gap-3 text-slate-400 hover:text-white transition-colors"
              >
                <div 
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: provider.color }}
                />
                <span className="font-display text-lg font-medium">{provider.name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-display font-bold text-white mb-4">
              Why Use CloudCost Estimator?
            </h2>
            <p className="text-slate-400 max-w-2xl mx-auto">
              Built for developers who need quick, reliable cost estimates to make 
              informed infrastructure decisions.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div 
                  key={feature.title}
                  className="card-hover group animate-slide-up"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="w-12 h-12 rounded-lg bg-cloud-600/20 flex items-center justify-center mb-4 group-hover:bg-cloud-600/30 transition-colors">
                    <Icon className="w-6 h-6 text-cloud-400" />
                  </div>
                  <h3 className="font-display text-lg font-semibold text-white mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-slate-400 text-sm">
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-24 border-t border-slate-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="stat-card">
              <DollarSign className="w-10 h-10 text-cloud-400 mb-4" />
              <div className="text-4xl font-display font-bold text-white mb-2">3</div>
              <div className="text-slate-400">Cloud Providers</div>
            </div>
            <div className="stat-card">
              <Calculator className="w-10 h-10 text-cloud-400 mb-4" />
              <div className="text-4xl font-display font-bold text-white mb-2">5+</div>
              <div className="text-slate-400">Resource Types</div>
            </div>
            <div className="stat-card">
              <Zap className="w-10 h-10 text-cloud-400 mb-4" />
              <div className="text-4xl font-display font-bold text-white mb-2">&lt;100ms</div>
              <div className="text-slate-400">Response Time</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="card relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-cloud-600/10 to-cloud-800/10" />
            <div className="relative z-10 py-8">
              <h2 className="text-2xl sm:text-3xl font-display font-bold text-white mb-4">
                Ready to optimize your cloud spending?
              </h2>
              <p className="text-slate-400 mb-8 max-w-xl mx-auto">
                Start estimating costs now and make smarter infrastructure decisions.
              </p>
              <Link to="/estimator" className="btn-primary inline-flex items-center gap-2">
                Get Started
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
