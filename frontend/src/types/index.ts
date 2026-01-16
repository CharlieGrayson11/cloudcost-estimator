// Cloud Provider Types
export type CloudProvider = 'aws' | 'azure' | 'gcp';

export type ComputeSize = 'small' | 'medium' | 'large' | 'xlarge';

export type StorageType = 'standard' | 'premium' | 'archive';

export type DatabaseType = 'sql' | 'nosql' | 'cache';

// API Request Types
export interface ComputeEstimateRequest {
  provider: CloudProvider;
  size: ComputeSize;
  hours_per_month: number;
  quantity: number;
}

export interface StorageEstimateRequest {
  provider: CloudProvider;
  storage_type: StorageType;
  size_gb: number;
}

export interface DatabaseEstimateRequest {
  provider: CloudProvider;
  database_type: DatabaseType;
  hours_per_month: number;
}

export interface FullEstimateRequest {
  provider: CloudProvider;
  compute?: ComputeEstimateRequest;
  storage?: StorageEstimateRequest;
  database?: DatabaseEstimateRequest;
  data_transfer_gb: number;
  include_load_balancer: boolean;
}

// API Response Types
export interface CostBreakdown {
  item: string;
  unit_cost: number;
  quantity: number;
  monthly_cost: number;
}

export interface EstimateResponse {
  provider: CloudProvider;
  provider_display_name: string;
  breakdown: CostBreakdown[];
  total_monthly_cost: number;
  total_annual_cost: number;
  currency: string;
}

export interface ComparisonResponse {
  estimates: EstimateResponse[];
  cheapest_provider: CloudProvider;
  potential_savings: number;
}

export interface ProviderInfo {
  name: string;
  regions: string[];
}

export interface ProvidersResponse {
  aws: ProviderInfo;
  azure: ProviderInfo;
  gcp: ProviderInfo;
}

export interface HealthResponse {
  status: string;
  version: string;
}

// UI State Types
export interface EstimatorFormState {
  provider: CloudProvider;
  // Compute
  includeCompute: boolean;
  computeSize: ComputeSize;
  computeQuantity: number;
  computeHours: number;
  // Storage
  includeStorage: boolean;
  storageType: StorageType;
  storageSize: number;
  // Database
  includeDatabase: boolean;
  databaseType: DatabaseType;
  databaseHours: number;
  // Networking
  dataTransferGb: number;
  includeLoadBalancer: boolean;
}

export const defaultFormState: EstimatorFormState = {
  provider: 'aws',
  includeCompute: true,
  computeSize: 'medium',
  computeQuantity: 1,
  computeHours: 730,
  includeStorage: true,
  storageType: 'standard',
  storageSize: 100,
  includeDatabase: false,
  databaseType: 'sql',
  databaseHours: 730,
  dataTransferGb: 0,
  includeLoadBalancer: false,
};

// Provider metadata
export const PROVIDER_METADATA: Record<CloudProvider, {
  name: string;
  color: string;
  bgColor: string;
  borderColor: string;
  icon: string;
}> = {
  aws: {
    name: 'Amazon Web Services',
    color: '#FF9900',
    bgColor: 'bg-aws/20',
    borderColor: 'border-aws/30',
    icon: '☁️',
  },
  azure: {
    name: 'Microsoft Azure',
    color: '#0078D4',
    bgColor: 'bg-azure/20',
    borderColor: 'border-azure/30',
    icon: '⬡',
  },
  gcp: {
    name: 'Google Cloud Platform',
    color: '#4285F4',
    bgColor: 'bg-gcp/20',
    borderColor: 'border-gcp/30',
    icon: '◈',
  },
};

export const COMPUTE_SIZE_LABELS: Record<ComputeSize, string> = {
  small: 'Small (1 vCPU, 1GB RAM)',
  medium: 'Medium (2 vCPU, 4GB RAM)',
  large: 'Large (4 vCPU, 8GB RAM)',
  xlarge: 'X-Large (8 vCPU, 16GB RAM)',
};

export const STORAGE_TYPE_LABELS: Record<StorageType, string> = {
  standard: 'Standard (General Purpose)',
  premium: 'Premium (High Performance)',
  archive: 'Archive (Cold Storage)',
};

export const DATABASE_TYPE_LABELS: Record<DatabaseType, string> = {
  sql: 'SQL (Relational)',
  nosql: 'NoSQL (Document/Key-Value)',
  cache: 'Cache (In-Memory)',
};
