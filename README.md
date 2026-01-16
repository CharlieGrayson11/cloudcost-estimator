# CloudCost Estimator

[![CI/CD Pipeline](https://github.com/yourusername/cloudcost-estimator/actions/workflows/ci-cd.yml/badge.svg)](https://github.com/yourusername/cloudcost-estimator/actions/workflows/ci-cd.yml)
[![codecov](https://codecov.io/gh/yourusername/cloudcost-estimator/branch/main/graph/badge.svg)](https://codecov.io/gh/yourusername/cloudcost-estimator)

A modern web application for estimating and comparing cloud resource costs across AWS, Azure, and GCP. Built with DevOps best practices including automated CI/CD, Infrastructure as Code, and containerization.

## 🎯 Features

- **Cost Estimation**: Calculate costs for compute, storage, database, and networking resources
- **Provider Comparison**: Side-by-side cost comparison across AWS, Azure, and GCP
- **Interactive Dashboard**: Real-time cost visualization with charts
- **API-First Design**: RESTful API with comprehensive documentation

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Azure Cloud                          │
│  ┌─────────────────────────────────────────────────────┐   │
│  │           Azure Container Apps Environment           │   │
│  │  ┌─────────────────┐    ┌─────────────────────┐    │   │
│  │  │    Frontend     │    │      Backend        │    │   │
│  │  │  (React/Nginx)  │───▶│     (FastAPI)       │    │   │
│  │  │   Port: 8080    │    │    Port: 8000       │    │   │
│  │  └─────────────────┘    └─────────────────────┘    │   │
│  └─────────────────────────────────────────────────────┘   │
│                              │                              │
│  ┌───────────────────────────┴───────────────────────────┐ │
│  │              Azure Container Registry                  │ │
│  │         (Docker Images: frontend, backend)            │ │
│  └───────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                              ▲
                              │ Deploy
┌─────────────────────────────┴───────────────────────────────┐
│                    GitHub Actions CI/CD                      │
│  ┌──────┐  ┌──────┐  ┌───────┐  ┌───────┐  ┌─────────────┐ │
│  │ Lint │─▶│ Test │─▶│ Scan  │─▶│ Build │─▶│   Deploy    │ │
│  └──────┘  └──────┘  └───────┘  └───────┘  └─────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

## 🛠️ Tech Stack

### Frontend
- React 18 with TypeScript
- Tailwind CSS for styling
- Recharts for data visualization
- Vite for build tooling

### Backend
- Python 3.11
- FastAPI framework
- Pydantic for validation
- Uvicorn ASGI server

### DevOps
- Docker & Docker Compose
- GitHub Actions CI/CD
- Terraform for IaC
- Azure Container Apps

## 🚀 Quick Start

### Prerequisites
- Docker and Docker Compose
- Node.js 20+ (for local development)
- Python 3.11+ (for local development)
- Azure CLI (for deployment)
- Terraform 1.5+ (for infrastructure)

### Local Development with Docker

```bash
# Clone the repository
git clone https://github.com/yourusername/cloudcost-estimator.git
cd cloudcost-estimator

# Start all services
docker-compose up -d

# Access the application
# Frontend: http://localhost:3000
# Backend API: http://localhost:8000
# API Docs: http://localhost:8000/docs
```

### Local Development without Docker

```bash
# Backend
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload

# Frontend (in another terminal)
cd frontend
npm install
npm run dev
```

## 📁 Project Structure

```
cloudcost-estimator/
├── backend/
│   ├── main.py              # FastAPI application
│   ├── test_main.py         # Backend tests
│   ├── requirements.txt     # Python dependencies
│   └── Dockerfile           # Backend container
├── frontend/
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── pages/           # Page components
│   │   ├── services/        # API services
│   │   ├── types/           # TypeScript types
│   │   └── test/            # Frontend tests
│   ├── package.json
│   ├── Dockerfile           # Frontend container
│   └── nginx.conf           # Nginx configuration
├── infrastructure/
│   ├── main.tf              # Terraform main config
│   ├── variables.tf         # Terraform variables
│   ├── outputs.tf           # Terraform outputs
│   └── environments/        # Environment configs
├── .github/
│   └── workflows/
│       └── ci-cd.yml        # GitHub Actions pipeline
├── docker-compose.yml       # Local development
└── README.md
```

## 🔄 CI/CD Pipeline

The CI/CD pipeline implements the following stages:

1. **Lint & Code Quality**: ESLint, Black, Ruff, TypeScript checking
2. **Testing**: pytest, Vitest with coverage reporting
3. **Security Scanning**: Dependency audit, Gitleaks, Trivy
4. **Build**: Multi-stage Docker builds
5. **Infrastructure Validation**: Terraform format, validate, plan
6. **Deploy**: Terraform apply to Azure Container Apps

### Pipeline Triggers
- Push to `main` → Deploy to Production
- Push to `develop` → Deploy to Development
- Pull Requests → Lint, Test, Security Scan only
- Manual dispatch → Choose target environment

## 🏭 Infrastructure as Code

### Deploy Infrastructure

```bash
cd infrastructure

# Initialize Terraform
terraform init

# Plan changes
terraform plan -var-file="environments/dev.tfvars"

# Apply changes
terraform apply -var-file="environments/dev.tfvars"
```

### Required Azure Resources
- Resource Group
- Container Registry
- Container Apps Environment
- Log Analytics Workspace

## 🔒 Security

- Non-root container users
- Dependency vulnerability scanning
- Secret scanning with Gitleaks
- Container image scanning with Trivy
- CORS configuration
- Security headers in Nginx

## 📊 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |
| GET | `/providers` | List cloud providers |
| GET | `/resource-types` | List resource types |
| POST | `/estimate/compute` | Compute cost estimate |
| POST | `/estimate/storage` | Storage cost estimate |
| POST | `/estimate/full` | Full infrastructure estimate |
| POST | `/compare` | Compare providers |

## 🧪 Testing

```bash
# Backend tests
cd backend
pytest test_main.py -v --cov=main

# Frontend tests
cd frontend
npm run test

# With coverage
npm run test:coverage
```

## 📚 DevOps Principles Applied

This project demonstrates several key DevOps principles:

### 1. Version Control (Git)
- All code tracked in Git
- Branching strategy: main (prod), develop (dev), feature branches
- Pull request reviews required

### 2. Continuous Integration
- Automated testing on every push
- Code quality checks (linting, formatting)
- Security scanning integrated

### 3. Continuous Delivery
- Automated deployment pipelines
- Environment-specific configurations
- Rollback capabilities

### 4. Infrastructure as Code
- Terraform for all infrastructure
- Version-controlled configurations
- Reproducible environments

### 5. Containerization
- Docker for consistent environments
- Multi-stage builds for optimization
- Non-root users for security

### 6. Monitoring & Observability
- Azure Log Analytics integration
- Health check endpoints
- Container App metrics

## 📖 References

- [The DevOps Handbook](https://itrevolution.com/the-devops-handbook/) - Gene Kim et al.
- [Continuous Delivery](https://continuousdelivery.com/) - Jez Humble & David Farley
- [Infrastructure as Code](https://infrastructure-as-code.com/) - Kief Morris
- [Azure Well-Architected Framework](https://docs.microsoft.com/azure/architecture/framework/)
- [Terraform Azure Provider Docs](https://registry.terraform.io/providers/hashicorp/azurerm/latest/docs)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)

## 📄 License

MIT License - see [LICENSE](LICENSE) for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request
