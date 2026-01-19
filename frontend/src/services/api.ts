// v3.3 - Force rebuild
import type {
  CloudProvider,
  ComputeSize,
  StorageType,
  DatabaseType,
  DatabaseTier,
  EstimateResponse,
  ComparisonResponse,
  ProvidersResponse,
  HealthResponse,
  FullEstimateRequest,
  EstimatorFormState,
  InstanceTypesResponse,
  StorageServicesResponse,
  DatabaseServicesResponse,
} from '../types';

// API base URL - uses environment variable or falls back to /api for nginx proxy
const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

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
  
  try {
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
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(500, 'Network error - please check your connection');
  }
}

// API Functions
export async function getHealth(): Promise<HealthResponse> {
  return fetchApi<HealthResponse>('/health');
}

export async function getProviders(): Promise<ProvidersResponse> {
  return fetchApi<ProvidersResponse>('/providers');
}

export async function getInstanceTypes(): Promise<InstanceTypesResponse> {
  return fetchApi<InstanceTypesResponse>('/instance-types');
}

export async function getStorageServices(): Promise<StorageServicesResponse> {
  return fetchApi<StorageServicesResponse>('/storage-services');
}

export async function getDatabaseServices(): Promise<DatabaseServicesResponse> {
  return fetchApi<DatabaseServicesResponse>('/database-services');
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
  include_database?: boolean;
  database_type?: DatabaseType;
  database_tier?: DatabaseTier;
}): Promise<ComparisonResponse> {
  const searchParams = new URLSearchParams();
  if (params.compute_size) searchParams.set('compute_size', params.compute_size);
  if (params.storage_gb) searchParams.set('storage_gb', params.storage_gb.toString());
  if (params.storage_type) searchParams.set('storage_type', params.storage_type);
  if (params.hours_per_month) searchParams.set('hours_per_month', params.hours_per_month.toString());
  if (params.include_database) searchParams.set('include_database', 'true');
  if (params.database_type) searchParams.set('database_type', params.database_type);
  if (params.database_tier) searchParams.set('database_tier', params.database_tier);

  const query = searchParams.toString();
  return fetchApi<ComparisonResponse>(`/compare${query ? `?${query}` : ''}`, {
    method: 'POST',
  });
}

// Helper to build full estimate request from form state
export function buildEstimateRequest(
  provider: CloudProvider,
  formState: EstimatorFormState
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
      database_type: formState.databaseType,
      tier: formState.databaseTier,
      storage_gb: formState.databaseStorageGb,
      backup_retention_days: formState.databaseBackupDays,
    };
  }

  return request;
}

export { ApiError };