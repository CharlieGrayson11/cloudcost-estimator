#!/bin/bash
# CloudCost Estimator - Deployment Script
# This script handles the full deployment process

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
ENVIRONMENT=${1:-dev}
IMAGE_TAG=${2:-latest}

echo -e "${GREEN}============================================${NC}"
echo -e "${GREEN}  CloudCost Estimator Deployment Script${NC}"
echo -e "${GREEN}============================================${NC}"
echo ""
echo -e "Environment: ${YELLOW}${ENVIRONMENT}${NC}"
echo -e "Image Tag: ${YELLOW}${IMAGE_TAG}${NC}"
echo ""

# Check prerequisites
echo -e "${YELLOW}Checking prerequisites...${NC}"

if ! command -v docker &> /dev/null; then
    echo -e "${RED}Error: Docker is not installed${NC}"
    exit 1
fi

if ! command -v terraform &> /dev/null; then
    echo -e "${RED}Error: Terraform is not installed${NC}"
    exit 1
fi

if ! command -v az &> /dev/null; then
    echo -e "${RED}Error: Azure CLI is not installed${NC}"
    exit 1
fi

echo -e "${GREEN}✓ All prerequisites satisfied${NC}"
echo ""

# Run tests
echo -e "${YELLOW}Running tests...${NC}"
echo ""

# Backend tests
echo "Running backend tests..."
cd backend
python -m pytest test_main.py -v --tb=short
if [ $? -ne 0 ]; then
    echo -e "${RED}Backend tests failed!${NC}"
    exit 1
fi
cd ..

# Frontend tests (if node_modules exists)
if [ -d "frontend/node_modules" ]; then
    echo "Running frontend tests..."
    cd frontend
    npm run test -- --run
    if [ $? -ne 0 ]; then
        echo -e "${RED}Frontend tests failed!${NC}"
        exit 1
    fi
    cd ..
fi

echo -e "${GREEN}✓ All tests passed${NC}"
echo ""

# Build Docker images
echo -e "${YELLOW}Building Docker images...${NC}"
echo ""

docker-compose build

echo -e "${GREEN}✓ Docker images built successfully${NC}"
echo ""

# Deploy infrastructure
echo -e "${YELLOW}Deploying infrastructure...${NC}"
echo ""

cd infrastructure

# Initialize Terraform
terraform init

# Validate configuration
terraform validate

# Plan changes
echo "Planning infrastructure changes..."
terraform plan \
    -var-file="environments/${ENVIRONMENT}.tfvars" \
    -var="image_tag=${IMAGE_TAG}" \
    -out=tfplan

# Apply changes (with confirmation)
read -p "Do you want to apply these changes? (y/N) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    terraform apply tfplan
    
    echo ""
    echo -e "${GREEN}============================================${NC}"
    echo -e "${GREEN}  Deployment Complete!${NC}"
    echo -e "${GREEN}============================================${NC}"
    echo ""
    echo "Deployment URLs:"
    echo -e "  Frontend: ${GREEN}$(terraform output -raw frontend_url)${NC}"
    echo -e "  Backend:  ${GREEN}$(terraform output -raw backend_url)${NC}"
else
    echo -e "${YELLOW}Deployment cancelled${NC}"
fi

cd ..
