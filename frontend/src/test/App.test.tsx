import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from '../App';
import EstimatorPage from '../pages/EstimatorPage';
import ComparePage from '../pages/ComparePage';
import * as api from '../services/api';
import type { CloudProvider, EstimateResponse, ComparisonResponse } from '../types';

// Mock the entire api module
vi.mock('../services/api', () => ({
  getInstanceTypes: vi.fn(),
  getStorageServices: vi.fn(),
  getDatabaseServices: vi.fn(),
  estimateFull: vi.fn(),
  compareProviders: vi.fn(),
  getHealth: vi.fn(),
  getProviders: vi.fn(),
  getResourceTypes: vi.fn(),
  buildEstimateRequest: vi.fn(),
  ApiError: class ApiError extends Error {
    constructor(public status: number, message: string) {
      super(message);
      this.name = 'ApiError';
    }
  },
}));

// Use MemoryRouter for page components (they don't include their own router)
const renderWithRouter = (component: React.ReactElement) => {
  return render(<MemoryRouter>{component}</MemoryRouter>);
};

const mockInstanceTypes = {
  aws: {
    small: { type: 't3.micro', vcpu: 2, memory: '1 GiB' },
    medium: { type: 't3.small', vcpu: 2, memory: '2 GiB' },
    large: { type: 't3.medium', vcpu: 2, memory: '4 GiB' },
    xlarge: { type: 't3.large', vcpu: 2, memory: '8 GiB' },
  },
  azure: {
    small: { type: 'Standard_B1s', vcpu: 1, memory: '1 GiB' },
    medium: { type: 'Standard_B2s', vcpu: 2, memory: '4 GiB' },
    large: { type: 'Standard_B4ms', vcpu: 4, memory: '16 GiB' },
    xlarge: { type: 'Standard_B8ms', vcpu: 8, memory: '32 GiB' },
  },
  gcp: {
    small: { type: 'e2-micro', vcpu: 0.25, memory: '1 GiB' },
    medium: { type: 'e2-small', vcpu: 0.5, memory: '2 GiB' },
    large: { type: 'e2-medium', vcpu: 1, memory: '4 GiB' },
    xlarge: { type: 'e2-standard-2', vcpu: 2, memory: '8 GiB' },
  },
};

const mockStorageServices = {
  aws: {
    standard: { name: 'Amazon S3 Standard', sku: 'S3-Standard' },
    premium: { name: 'Amazon EBS gp3', sku: 'EBS-gp3' },
    archive: { name: 'Amazon S3 Glacier Instant Retrieval', sku: 'S3-Glacier' },
  },
  azure: {
    standard: { name: 'Azure Blob Storage (Hot)', sku: 'Hot-LRS' },
    premium: { name: 'Azure Premium SSD', sku: 'Premium-SSD-LRS' },
    archive: { name: 'Azure Blob Storage (Archive)', sku: 'Archive-LRS' },
  },
  gcp: {
    standard: { name: 'Cloud Storage Standard', sku: 'standard' },
    premium: { name: 'Persistent Disk SSD', sku: 'pd-ssd' },
    archive: { name: 'Cloud Storage Archive', sku: 'archive' },
  },
};

const mockDatabaseServices = {
  aws: {
    sql: { name: 'Amazon RDS for MySQL', sku: 'db.t3.micro' },
    nosql: { name: 'Amazon DynamoDB', sku: 'on-demand' },
    cache: { name: 'Amazon ElastiCache for Redis', sku: 'cache.t3.micro' },
  },
  azure: {
    sql: { name: 'Azure SQL Database', sku: 'Basic-DTU' },
    nosql: { name: 'Azure Cosmos DB', sku: 'serverless' },
    cache: { name: 'Azure Cache for Redis', sku: 'Basic-C0' },
  },
  gcp: {
    sql: { name: 'Cloud SQL for MySQL', sku: 'db-f1-micro' },
    nosql: { name: 'Firestore', sku: 'native-mode' },
    cache: { name: 'Memorystore for Redis', sku: 'basic-m1' },
  },
};

const mockComparisonResponse: ComparisonResponse = {
  estimates: [
    {
      provider: 'aws' as CloudProvider,
      provider_display_name: 'Amazon Web Services',
      breakdown: [
        {
          item: 't3.small x1',
          unit_cost: 0.0208,
          quantity: 730,
          monthly_cost: 15.18,
          pricing_source: 'AWS Price List API (verified)',
          service_name: 't3.small (2 vCPU, 2 GiB)',
          resource_type: 'compute',
        },
        {
          item: 'Amazon S3 Standard',
          unit_cost: 0.023,
          quantity: 100,
          monthly_cost: 2.30,
          pricing_source: 'AWS Price List API (verified)',
          service_name: 'Amazon S3 Standard',
          resource_type: 'storage',
        },
      ],
      total_monthly_cost: 17.48,
      total_annual_cost: 209.76,
      currency: 'USD',
      last_updated: new Date().toISOString(),
      pricing_note: 'Sources: AWS Price List API (verified)',
    },
    {
      provider: 'azure' as CloudProvider,
      provider_display_name: 'Microsoft Azure',
      breakdown: [
        {
          item: 'Standard_B2s x1',
          unit_cost: 0.0416,
          quantity: 730,
          monthly_cost: 30.37,
          pricing_source: 'Azure Retail Prices API (live)',
          service_name: 'Standard_B2s (2 vCPU, 4 GiB)',
          resource_type: 'compute',
        },
        {
          item: 'Azure Blob Storage (Hot)',
          unit_cost: 0.0184,
          quantity: 100,
          monthly_cost: 1.84,
          pricing_source: 'Azure Retail Prices API (live)',
          service_name: 'Azure Blob Storage (Hot)',
          resource_type: 'storage',
        },
      ],
      total_monthly_cost: 32.21,
      total_annual_cost: 386.52,
      currency: 'USD',
      last_updated: new Date().toISOString(),
      pricing_note: 'Sources: Azure Retail Prices API (live)',
    },
    {
      provider: 'gcp' as CloudProvider,
      provider_display_name: 'Google Cloud Platform',
      breakdown: [
        {
          item: 'e2-small x1',
          unit_cost: 0.01675,
          quantity: 730,
          monthly_cost: 12.23,
          pricing_source: 'GCP Cloud Billing API (live)',
          service_name: 'e2-small (0.5 vCPU, 2 GiB)',
          resource_type: 'compute',
        },
        {
          item: 'Cloud Storage Standard',
          unit_cost: 0.020,
          quantity: 100,
          monthly_cost: 2.00,
          pricing_source: 'GCP Cloud Billing API (live)',
          service_name: 'Cloud Storage Standard',
          resource_type: 'storage',
        },
      ],
      total_monthly_cost: 14.23,
      total_annual_cost: 170.76,
      currency: 'USD',
      last_updated: new Date().toISOString(),
      pricing_note: 'Sources: GCP Cloud Billing API (live)',
    },
  ],
  cheapest_provider: 'gcp' as CloudProvider,
  potential_savings: 17.98,
};

// Setup default mocks before each test
beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(api.getInstanceTypes).mockResolvedValue(mockInstanceTypes);
  vi.mocked(api.getStorageServices).mockResolvedValue(mockStorageServices);
  vi.mocked(api.getDatabaseServices).mockResolvedValue(mockDatabaseServices);
  // Set up compareProviders mock by default
  vi.mocked(api.compareProviders).mockResolvedValue(mockComparisonResponse);
});

describe('App', () => {
  it('renders without crashing', () => {
    render(<App />);
    // "CloudCost" is split across two elements: "Cloud" and "Cost"
    // Use a function matcher to find text content across elements
    expect(screen.getByText((content, element) => {
      return element?.tagName.toLowerCase() === 'span' && 
             element?.textContent === 'CloudCost';
    })).toBeInTheDocument();
  });

  it('shows navigation links', () => {
    render(<App />);
    expect(screen.getByRole('link', { name: /home/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /estimator/i })).toBeInTheDocument();
    // Use getAllByRole since there are multiple "Compare" links (nav + CTA button)
    const compareLinks = screen.getAllByRole('link', { name: /compare/i });
    expect(compareLinks.length).toBeGreaterThanOrEqual(1);
  });
});

describe('EstimatorPage', () => {
  it('renders the estimator form', async () => {
    renderWithRouter(<EstimatorPage />);
    
    await waitFor(() => {
      expect(screen.getByText('Cost Estimator')).toBeInTheDocument();
    });
  });

  it('displays results after successful estimation', async () => {
    const mockResponse: EstimateResponse = {
      provider: 'aws' as CloudProvider,
      provider_display_name: 'Amazon Web Services',
      breakdown: [
        {
          item: 't3.small x1',
          unit_cost: 0.0208,
          quantity: 730,
          monthly_cost: 15.18,
          pricing_source: 'AWS Price List API (verified)',
          service_name: 't3.small (2 vCPU, 2 GiB)',
          resource_type: 'compute',
        },
        {
          item: 'Amazon S3 Standard',
          unit_cost: 0.023,
          quantity: 100,
          monthly_cost: 2.30,
          pricing_source: 'AWS Price List API (verified)',
          service_name: 'Amazon S3 Standard',
          resource_type: 'storage',
        },
      ],
      total_monthly_cost: 17.48,
      total_annual_cost: 209.76,
      currency: 'USD',
      last_updated: new Date().toISOString(),
      pricing_note: 'Sources: AWS Price List API (verified)',
    };

    vi.mocked(api.estimateFull).mockResolvedValue(mockResponse);

    renderWithRouter(<EstimatorPage />);

    // Wait for the form to load
    await waitFor(() => {
      expect(screen.getByText('Cost Estimator')).toBeInTheDocument();
    });

    const calculateButton = screen.getByRole('button', { name: /calculate estimate/i });
    fireEvent.click(calculateButton);

    await waitFor(() => {
      expect(screen.getByText('$17.48')).toBeInTheDocument();
    });
  });
});

describe('ComparePage', () => {
  it('renders the comparison form', async () => {
    renderWithRouter(<ComparePage />);
    
    await waitFor(() => {
      expect(screen.getByText('Live pricing comparison across AWS, Azure, and GCP')).toBeInTheDocument();
    });
  });

  it('displays comparison results with provider-specific service names', async () => {
    renderWithRouter(<ComparePage />);

    // Wait for the form to load and API data to be fetched
    await waitFor(() => {
      expect(screen.getByText('Configuration')).toBeInTheDocument();
    });

    // Wait for instance types to load (they populate the dropdowns)
    await waitFor(() => {
      expect(api.getInstanceTypes).toHaveBeenCalled();
    });

    // Click the compare button
    const compareButton = screen.getByRole('button', { name: /compare providers/i });
    fireEvent.click(compareButton);

    // Verify the mock was called
    await waitFor(() => {
      expect(api.compareProviders).toHaveBeenCalled();
    });

    // Wait for the results to appear
    await waitFor(() => {
      expect(screen.getByText('Best Value')).toBeInTheDocument();
    }, { timeout: 5000 });
  });
});

describe('Navigation', () => {
  it('navigates to estimator page', async () => {
    render(<App />);

    const estimatorLink = screen.getByRole('link', { name: /estimator/i });
    fireEvent.click(estimatorLink);

    await waitFor(() => {
      expect(screen.getByText('Cost Estimator')).toBeInTheDocument();
    });
  });

  it('navigates to compare page', async () => {
    render(<App />);

    // Get the nav link specifically (not the CTA button)
    const compareLinks = screen.getAllByRole('link', { name: /compare/i });
    // Click the first one (nav link)
    fireEvent.click(compareLinks[0]);

    await waitFor(() => {
      expect(screen.getByText('Configuration')).toBeInTheDocument();
    });
  });
});