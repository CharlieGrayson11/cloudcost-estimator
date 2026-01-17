import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import App from '../App';
import EstimatorPage from '../pages/EstimatorPage';
import ComparePage from '../pages/ComparePage';
import * as api from '../services/api';
import type { CloudProvider, EstimateResponse, ComparisonResponse } from '../types';

vi.mock('../services/api');

const renderWithRouter = (component: React.ReactElement) => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};

const mockInstanceTypes = {
  aws: {
    small: { type: 't3.micro', vcpu: 2, memory: '1 GiB' },
    medium: { type: 't3.small', vcpu: 2, memory: '2 GiB' },
  },
  azure: {
    small: { type: 'Standard_B1s', vcpu: 1, memory: '1 GiB' },
    medium: { type: 'Standard_B2s', vcpu: 2, memory: '4 GiB' },
  },
  gcp: {
    small: { type: 'e2-micro', vcpu: 0.25, memory: '1 GiB' },
    medium: { type: 'e2-small', vcpu: 0.5, memory: '2 GiB' },
  },
};

describe('App', () => {
  it('renders without crashing', () => {
    renderWithRouter(<App />);
    expect(screen.getByText('CloudCost')).toBeInTheDocument();
  });

  it('shows navigation links', () => {
    renderWithRouter(<App />);
    expect(screen.getByRole('link', { name: /home/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /estimator/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /compare/i })).toBeInTheDocument();
  });
});

describe('EstimatorPage', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(api.getInstanceTypes).mockResolvedValue(mockInstanceTypes);
  });

  it('renders the estimator form', () => {
    renderWithRouter(<EstimatorPage />);
    expect(screen.getByText('Cost Estimator')).toBeInTheDocument();
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

    const calculateButton = screen.getByRole('button', { name: /calculate estimate/i });
    fireEvent.click(calculateButton);

    await waitFor(() => {
      expect(screen.getByText('$17.48')).toBeInTheDocument();
    });
  });
});

describe('ComparePage', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('renders the comparison form', () => {
    renderWithRouter(<ComparePage />);
    expect(screen.getByText('Compare Providers')).toBeInTheDocument();
  });

  it('displays comparison results with provider-specific service names', async () => {
    const mockResponse: ComparisonResponse = {
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

    vi.mocked(api.compareProviders).mockResolvedValue(mockResponse);

    renderWithRouter(<ComparePage />);

    const compareButton = screen.getByRole('button', { name: /compare providers/i });
    fireEvent.click(compareButton);

    await waitFor(() => {
      expect(screen.getByText('Best Value')).toBeInTheDocument();
      // Check that provider-specific names appear in cards
      expect(screen.getByText('Amazon S3 Standard')).toBeInTheDocument();
    });
  });
});

describe('Navigation', () => {
  it('navigates to estimator page', async () => {
    renderWithRouter(<App />);

    const estimatorLink = screen.getByRole('link', { name: /estimator/i });
    fireEvent.click(estimatorLink);

    await waitFor(() => {
      expect(screen.getByText('Cost Estimator')).toBeInTheDocument();
    });
  });

  it('navigates to compare page', async () => {
    renderWithRouter(<App />);

    const compareLink = screen.getByRole('link', { name: /compare/i });
    fireEvent.click(compareLink);

    await waitFor(() => {
      expect(screen.getByText('Compare Providers')).toBeInTheDocument();
    });
  });
});