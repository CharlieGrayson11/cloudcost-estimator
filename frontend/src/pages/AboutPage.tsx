import { 
  Code2, 
  GitBranch, 
  Container, 
  Cloud,
  Shield,
  Zap,
  CheckCircle,
  ExternalLink
} from 'lucide-react';

const techStack = [
  {
    category: 'Frontend',
    items: [
      { name: 'React 18', description: 'UI library' },
      { name: 'TypeScript', description: 'Type safety' },
      { name: 'Tailwind CSS', description: 'Styling' },
      { name: 'Vite', description: 'Build tool' },
      { name: 'Recharts', description: 'Visualization' },
    ],
  },
  {
    category: 'Backend',
    items: [
      { name: 'Python 3.11', description: 'Runtime' },
      { name: 'FastAPI', description: 'API framework' },
      { name: 'Pydantic', description: 'Validation' },
      { name: 'Uvicorn', description: 'ASGI server' },
    ],
  },
  {
    category: 'DevOps',
    items: [
      { name: 'Docker', description: 'Containerization' },
      { name: 'GitHub Actions', description: 'CI/CD' },
      { name: 'Terraform', description: 'IaC' },
      { name: 'Azure', description: 'Cloud platform' },
    ],
  },
];

const devopsPrinciples = [
  {
    icon: GitBranch,
    title: 'Version Control',
    description: 'All code is version controlled with Git, enabling collaboration, code review, and change tracking.',
  },
  {
    icon: Container,
    title: 'Containerization',
    description: 'Docker containers ensure consistency across development, testing, and production environments.',
  },
  {
    icon: Zap,
    title: 'CI/CD Pipeline',
    description: 'Automated testing, building, and deployment through GitHub Actions for rapid, reliable releases.',
  },
  {
    icon: Code2,
    title: 'Infrastructure as Code',
    description: 'Terraform defines all infrastructure, enabling reproducible and auditable deployments.',
  },
  {
    icon: Shield,
    title: 'Security First',
    description: 'Non-root containers, dependency scanning, and secure secrets management built into the pipeline.',
  },
  {
    icon: Cloud,
    title: 'Cloud Native',
    description: 'Designed for Azure Container Apps with auto-scaling and managed infrastructure.',
  },
];

const references = [
  {
    title: 'The DevOps Handbook',
    author: 'Gene Kim et al.',
    description: 'Foundational DevOps practices and principles',
    url: 'https://itrevolution.com/the-devops-handbook/',
  },
  {
    title: 'Continuous Delivery',
    author: 'Jez Humble & David Farley',
    description: 'Reliable software releases through build, test, and deployment automation',
    url: 'https://continuousdelivery.com/',
  },
  {
    title: 'Infrastructure as Code',
    author: 'Kief Morris',
    description: 'Managing servers in the cloud',
    url: 'https://infrastructure-as-code.com/',
  },
  {
    title: 'Azure Well-Architected Framework',
    author: 'Microsoft',
    description: 'Best practices for building on Azure',
    url: 'https://docs.microsoft.com/azure/architecture/framework/',
  },
];

export default function AboutPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 animate-fade-in">
      {/* Header */}
      <div className="mb-16 max-w-3xl">
        <h1 className="text-3xl sm:text-4xl font-display font-bold text-white mb-4">
          About This Project
        </h1>
        <p className="text-lg text-slate-400">
          CloudCost Estimator is a demonstration of modern DevOps practices, 
          built to showcase automated deployment pipelines, infrastructure as code, 
          and cloud-native architecture.
        </p>
      </div>

      {/* DevOps Principles */}
      <section className="mb-20">
        <h2 className="text-2xl font-display font-bold text-white mb-8">
          DevOps Principles Applied
        </h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {devopsPrinciples.map((principle) => {
            const Icon = principle.icon;
            return (
              <div key={principle.title} className="card-hover group">
                <div className="w-12 h-12 rounded-lg bg-cloud-600/20 flex items-center justify-center mb-4 group-hover:bg-cloud-600/30 transition-colors">
                  <Icon className="w-6 h-6 text-cloud-400" />
                </div>
                <h3 className="font-display text-lg font-semibold text-white mb-2">
                  {principle.title}
                </h3>
                <p className="text-slate-400 text-sm">
                  {principle.description}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Tech Stack */}
      <section className="mb-20">
        <h2 className="text-2xl font-display font-bold text-white mb-8">
          Technology Stack
        </h2>
        <div className="grid md:grid-cols-3 gap-6">
          {techStack.map((stack) => (
            <div key={stack.category} className="card">
              <h3 className="font-display text-lg font-semibold text-cloud-400 mb-4">
                {stack.category}
              </h3>
              <ul className="space-y-3">
                {stack.items.map((item) => (
                  <li key={item.name} className="flex items-center gap-3">
                    <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                    <div>
                      <span className="text-white font-medium">{item.name}</span>
                      <span className="text-slate-500 text-sm ml-2">— {item.description}</span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* Pipeline Overview */}
      <section className="mb-20">
        <h2 className="text-2xl font-display font-bold text-white mb-8">
          CI/CD Pipeline Overview
        </h2>
        <div className="card">
          <div className="flex flex-wrap items-center justify-between gap-4">
            {[
              { step: 1, label: 'Code Push', status: 'Git commit triggers workflow' },
              { step: 2, label: 'Lint & Test', status: 'Run automated tests' },
              { step: 3, label: 'Build', status: 'Create Docker images' },
              { step: 4, label: 'Scan', status: 'Security vulnerability check' },
              { step: 5, label: 'Deploy', status: 'Push to Azure Container Apps' },
            ].map((item, index, arr) => (
              <div key={item.step} className="flex items-center gap-4">
                <div className="text-center">
                  <div className="w-12 h-12 rounded-full bg-cloud-600/20 flex items-center justify-center mb-2 border-2 border-cloud-600/50">
                    <span className="font-display font-bold text-cloud-400">{item.step}</span>
                  </div>
                  <div className="text-sm font-medium text-white">{item.label}</div>
                  <div className="text-xs text-slate-500">{item.status}</div>
                </div>
                {index < arr.length - 1 && (
                  <div className="hidden md:block w-8 h-0.5 bg-slate-700" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* References */}
      <section>
        <h2 className="text-2xl font-display font-bold text-white mb-8">
          References & Citations
        </h2>
        <div className="grid md:grid-cols-2 gap-6">
          {references.map((ref) => (
            <a
              key={ref.title}
              href={ref.url}
              target="_blank"
              rel="noopener noreferrer"
              className="card-hover group block"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="font-display text-lg font-semibold text-white mb-1 group-hover:text-cloud-400 transition-colors">
                    {ref.title}
                  </h3>
                  <p className="text-sm text-slate-500 mb-2">{ref.author}</p>
                  <p className="text-slate-400 text-sm">{ref.description}</p>
                </div>
                <ExternalLink className="w-5 h-5 text-slate-600 group-hover:text-cloud-400 transition-colors flex-shrink-0" />
              </div>
            </a>
          ))}
        </div>
      </section>
    </div>
  );
}
