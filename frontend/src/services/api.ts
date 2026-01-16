import type {
  CloudProvider,
  ComputeSize,
  StorageType,
  EstimateResponse,
  ComparisonResponse,
  ProvidersResponse,
  HealthResponse,
  FullEstimateRequest,
} from '../types';

// API base URL - uses proxy in development, direct URL in production
const API_BASE_URL = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_URL) || '/api';

class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

async function fetchApi<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Unknown error' }));
    throw new ApiError(response.status, error.detail || `HTTP ${response.status}`);
  }

  return response.json();
}

// API Functions
export async function getHealth(): Promise<HealthResponse> {
  return fetchApi<HealthResponse>('/health');
}

export async function getProviders(): Promise<ProvidersResponse> {
  return fetchApi<ProvidersResponse>('/providers');
}

export async function getResourceTypes(): Promise<Record<string, unknown>> {
  return fetchApi<Record<string, unknown>>('/resource-types');
}

export async function estimateFull(
  request: FullEstimateRequest
): Promise<EstimateResponse> {
  return fetchApi<EstimateResponse>('/estimate/full', {
    method: 'POST',
    body: JSON.stringify(request),
  });
}

export async function compareProviders(params: {
  compute_size?: ComputeSize;
  storage_gb?: number;
  storage_type?: StorageType;
  hours_per_month?: number;
}): Promise<ComparisonResponse> {
  const searchParams = new URLSearchParams();
  if (params.compute_size) searchParams.set('compute_size', params.compute_size);
  if (params.storage_gb) searchParams.set('storage_gb', params.storage_gb.toString());
  if (params.storage_type) searchParams.set('storage_type', params.storage_type);
  if (params.hours_per_month) searchParams.set('hours_per_month', params.hours_per_month.toString());

  const query = searchParams.toString();
  return fetchApi<ComparisonResponse>(`/compare${query ? `?${query}` : ''}`, {
    method: 'POST',
  });
}

// Helper to build full estimate request from form state
export function buildEstimateRequest(
  provider: CloudProvider,
  formState: {
    includeCompute: boolean;
    computeSize: ComputeSize;
    computeQuantity: number;
    computeHours: number;
    includeStorage: boolean;
    storageType: StorageType;
    storageSize: number;
    includeDatabase: boolean;
    databaseType: string;
    databaseHours: number;
    dataTransferGb: number;
    includeLoadBalancer: boolean;
  }
): FullEstimateRequest {
  const request: FullEstimateRequest = {
    provider,
    data_transfer_gb: formState.dataTransferGb,
    include_load_balancer: formState.includeLoadBalancer,
  };

  if (formState.includeCompute) {
    request.compute = {
      provider,
      size: formState.computeSize,
      hours_per_month: formState.computeHours,
      quantity: formState.computeQuantity,
    };
  }

  if (formState.includeStorage) {
    request.storage = {
      provider,
      storage_type: formState.storageType,
      size_gb: formState.storageSize,
    };
  }

  if (formState.includeDatabase) {
    request.database = {
      provider,
      database_type: formState.databaseType as 'sql' | 'nosql' | 'cache',
      hours_per_month: formState.databaseHours,
    };
  }

  return request;
}

export { ApiError };