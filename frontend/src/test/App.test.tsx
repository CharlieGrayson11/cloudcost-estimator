import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import App from '../App';
import EstimatorPage from '../pages/EstimatorPage';
import ComparePage from '../pages/ComparePage';
import * as api from '../services/api';
import type { CloudProvider, EstimateResponse, ComparisonResponse } from '../types';

// Mock the API module
vi.mock('../services/api');

const renderWithRouter = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  );
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
    expect(screen.getByRole('link', { name: /about/i })).toBeInTheDocument();
  });
});

describe('EstimatorPage', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('renders the estimator form', () => {
    renderWithRouter(<EstimatorPage />);
    expect(screen.getByText('Cost Estimator')).toBeInTheDocument();
    expect(screen.getByText('Select Provider')).toBeInTheDocument();
    expect(screen.getByText('Compute')).toBeInTheDocument();
    expect(screen.getByText('Storage')).toBeInTheDocument();
  });

  it('allows selecting different providers', () => {
    renderWithRouter(<EstimatorPage />);
    const awsButton = screen.getByRole('button', { name: /aws/i });
    const azureButton = screen.getByRole('button', { name: /azure/i });
    const gcpButton = screen.getByRole('button', { name: /gcp/i });
    
    expect(awsButton).toBeInTheDocument();
    expect(azureButton).toBeInTheDocument();
    expect(gcpButton).toBeInTheDocument();
  });

  it('shows calculate button', () => {
    renderWithRouter(<EstimatorPage />);
    expect(screen.getByRole('button', { name: /calculate estimate/i })).toBeInTheDocument();
  });

  it('displays results after successful estimation', async () => {
    const mockResponse: EstimateResponse = {
      provider: 'aws' as CloudProvider,
      provider_display_name: 'Amazon Web Services',
      breakdown: [
        { item: 'Compute (medium)', unit_cost: 0.0464, quantity: 730, monthly_cost: 33.87 }
      ],
      total_monthly_cost: 33.87,
      total_annual_cost: 406.44,
      currency: 'USD',
    };

    vi.mocked(api.estimateFull).mockResolvedValue(mockResponse);

    renderWithRouter(<EstimatorPage />);
    
    const calculateButton = screen.getByRole('button', { name: /calculate estimate/i });
    fireEvent.click(calculateButton);

    await waitFor(() => {
      expect(screen.getByText('$33.87')).toBeInTheDocument();
    });
  });

  it('handles errors gracefully', async () => {
    vi.mocked(api.estimateFull).mockRejectedValue(new Error('API Error'));

    renderWithRouter(<EstimatorPage />);
    
    const calculateButton = screen.getByRole('button', { name: /calculate estimate/i });
    fireEvent.click(calculateButton);

    await waitFor(() => {
      expect(screen.getByText('API Error')).toBeInTheDocument();
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
    expect(screen.getByText('Configuration')).toBeInTheDocument();
  });

  it('shows compare button', () => {
    renderWithRouter(<ComparePage />);
    expect(screen.getByRole('button', { name: /compare providers/i })).toBeInTheDocument();
  });

  it('displays comparison results', async () => {
    const mockResponse: ComparisonResponse = {
      estimates: [
        {
          provider: 'aws' as CloudProvider,
          provider_display_name: 'Amazon Web Services',
          breakdown: [{ item: 'Compute', unit_cost: 0.05, quantity: 730, monthly_cost: 36.5 }],
          total_monthly_cost: 36.5,
          total_annual_cost: 438,
          currency: 'USD',
        },
        {
          provider: 'azure' as CloudProvider,
          provider_display_name: 'Microsoft Azure',
          breakdown: [{ item: 'Compute', unit_cost: 0.04, quantity: 730, monthly_cost: 29.2 }],
          total_monthly_cost: 29.2,
          total_annual_cost: 350.4,
          currency: 'USD',
        },
        {
          provider: 'gcp' as CloudProvider,
          provider_display_name: 'Google Cloud Platform',
          breakdown: [{ item: 'Compute', unit_cost: 0.03, quantity: 730, monthly_cost: 21.9 }],
          total_monthly_cost: 21.9,
          total_annual_cost: 262.8,
          currency: 'USD',
        },
      ],
      cheapest_provider: 'gcp' as CloudProvider,
      potential_savings: 14.6,
    };

    vi.mocked(api.compareProviders).mockResolvedValue(mockResponse);

    renderWithRouter(<ComparePage />);
    
    const compareButton = screen.getByRole('button', { name: /compare providers/i });
    fireEvent.click(compareButton);

    await waitFor(() => {
      expect(screen.getByText('Best Value')).toBeInTheDocument();
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

  it('navigates to about page', async () => {
    renderWithRouter(<App />);
    
    const aboutLink = screen.getByRole('link', { name: /about/i });
    fireEvent.click(aboutLink);

    await waitFor(() => {
      expect(screen.getByText('About This Project')).toBeInTheDocument();
    });
  });
});