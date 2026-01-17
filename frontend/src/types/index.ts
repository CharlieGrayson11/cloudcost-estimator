// CloudCost Estimator - TypeScript Type Definitions v3.2
// Matches backend v3.2 with real service names for all providers

export type CloudProvider = 'aws' | 'azure' | 'gcp';
export type ComputeSize = 'small' | 'medium' | 'large' | 'xlarge';
export type StorageType = 'standard' | 'premium' | 'archive';
export type DatabaseType = 'sql' | 'nosql' | 'cache';
export type DatabaseTier = 'basic' | 'standard' | 'premium';

// Request Types
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
  tier: DatabaseTier;
  storage_gb: number;
  backup_retention_days: number;
}

export interface FullEstimateRequest {
  provider: CloudProvider;
  compute?: ComputeEstimateRequest;
  storage?: StorageEstimateRequest;
  database?: DatabaseEstimateRequest;
  data_transfer_gb?: number;
  include_load_balancer?: boolean;
}

// Response Types
export interface CostBreakdown {
  item: string;
  unit_cost: number;
  quantity: number;
  monthly_cost: number;
  pricing_source: string;
  service_name?: string;   // Full service name (e.g., "Amazon S3 Standard")
  resource_type?: string;  // Generic type (e.g., "compute", "storage", "database")
}

export interface EstimateResponse {
  provider: CloudProvider;
  provider_display_name: string;
  breakdown: CostBreakdown[];
  total_monthly_cost: number;
  total_annual_cost: number;
  currency: string;
  last_updated: string;
  pricing_note: string;
}

export interface ComparisonResponse {
  estimates: EstimateResponse[];
  cheapest_provider: CloudProvider;
  potential_savings: number;
}

export interface HealthResponse {
  status: string;
  version: string;
  pricing_api_status: {
    azure: string;
    aws: string;
    gcp: string;
  };
}

export interface ProvidersResponse {
  [key: string]: {
    name: string;
    regions: string[];
  };
}

export interface InstanceTypeInfo {
  type: string;
  vcpu: number;
  memory: string;
}

export interface StorageServiceInfo {
  name: string;
  sku: string;
}

export interface DatabaseServiceInfo {
  name: string;
  sku: string;
}

export interface InstanceTypesResponse {
  [provider: string]: {
    [size: string]: InstanceTypeInfo;
  };
}

export interface StorageServicesResponse {
  [provider: string]: {
    [type: string]: StorageServiceInfo;
  };
}

export interface DatabaseServicesResponse {
  [provider: string]: {
    [type: string]: DatabaseServiceInfo;
  };
}

// UI Helper Types
export interface ProviderMetadata {
  name: string;
  color: string;
  bgColor: string;
  borderColor: string;
}

export const PROVIDER_METADATA: Record<CloudProvider, ProviderMetadata> = {
  aws: {
    name: 'Amazon Web Services',
    color: 'text-orange-400',
    bgColor: 'bg-orange-500/20',
    borderColor: 'border-orange-500/50',
  },
  azure: {
    name: 'Microsoft Azure',
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/20',
    borderColor: 'border-blue-500/50',
  },
  gcp: {
    name: 'Google Cloud Platform',
    color: 'text-red-400',
    bgColor: 'bg-red-500/20',
    borderColor: 'border-red-500/50',
  },
};

// Generic labels for comparison table
export const RESOURCE_TYPE_LABELS: Record<string, string> = {
  compute: 'Compute',
  storage: 'Storage',
  database: 'Database',
  database_storage: 'Database Storage',
  networking: 'Networking',
};

// Form State
export interface EstimatorFormState {
  provider: CloudProvider;
  includeCompute: boolean;
  computeSize: ComputeSize;
  computeQuantity: number;
  computeHours: number;
  includeStorage: boolean;
  storageType: StorageType;
  storageSize: number;
  includeDatabase: boolean;
  databaseType: DatabaseType;
  databaseTier: DatabaseTier;
  databaseStorageGb: number;
  databaseBackupDays: number;
  dataTransferGb: number;
  includeLoadBalancer: boolean;
}

export const defaultFormState: EstimatorFormState = {
  provider: 'azure',
  includeCompute: true,
  computeSize: 'medium',
  computeQuantity: 1,
  computeHours: 730,
  includeStorage: true,
  storageType: 'standard',
  storageSize: 100,
  includeDatabase: false,
  databaseType: 'sql',
  databaseTier: 'standard',
  databaseStorageGb: 20,
  databaseBackupDays: 7,
  dataTransferGb: 0,
  includeLoadBalancer: false,
};