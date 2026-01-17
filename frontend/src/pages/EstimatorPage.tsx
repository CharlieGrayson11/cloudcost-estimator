import { useState, useEffect } from 'react';
import { Calculator, Server, Database, HardDrive, Globe, Loader2, Info, Cpu } from 'lucide-react';
import type {
  CloudProvider,
  ComputeSize,
  StorageType,
  DatabaseType,
  DatabaseTier,
  EstimateResponse,
  EstimatorFormState,
  InstanceTypesResponse,
  StorageServicesResponse,
  DatabaseServicesResponse,
} from '../types';
import { PROVIDER_METADATA, defaultFormState } from '../types';
import { estimateFull, buildEstimateRequest, getInstanceTypes, getStorageServices, getDatabaseServices } from '../services/api';

export default function EstimatorPage() {
  const [formState, setFormState] = useState<EstimatorFormState>(defaultFormState);
  const [result, setResult] = useState<EstimateResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Service data from API
  const [instanceTypes, setInstanceTypes] = useState<InstanceTypesResponse | null>(null);
  const [storageServices, setStorageServices] = useState<StorageServicesResponse | null>(null);
  const [databaseServices, setDatabaseServices] = useState<DatabaseServicesResponse | null>(null);

  // Fetch service info on mount
  useEffect(() => {
    getInstanceTypes()
      .then(setInstanceTypes)
      .catch((err) => console.error('Failed to load instance types:', err));
    
    getStorageServices()
      .then(setStorageServices)
      .catch((err) => console.error('Failed to load storage services:', err));
    
    getDatabaseServices()
      .then(setDatabaseServices)
      .catch((err) => console.error('Failed to load database services:', err));
  }, []);

  const updateForm = (updates: Partial<EstimatorFormState>) => {
    setFormState((prev) => ({ ...prev, ...updates }));
  };

  const handleCalculate = async () => {
    setLoading(true);
    setError(null);

    try {
      const request = buildEstimateRequest(formState.provider, formState);
      const response = await estimateFull(request);
      setResult(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to calculate estimate');
    } finally {
      setLoading(false);
    }
  };

  // Get current service info for selected provider
  const getInstanceInfo = () => instanceTypes?.[formState.provider]?.[formState.computeSize];
  const getStorageInfo = () => storageServices?.[formState.provider]?.[formState.storageType];
  const getDatabaseInfo = () => databaseServices?.[formState.provider]?.[formState.databaseType];

  const instanceInfo = getInstanceInfo();
  const storageInfo = getStorageInfo();
  const databaseInfo = getDatabaseInfo();

  // Get available sizes/types from API data
  const computeSizes = instanceTypes ? Object.keys(instanceTypes[formState.provider] || {}) as ComputeSize[] : [];
  const storageTypes = storageServices ? Object.keys(storageServices[formState.provider] || {}) as StorageType[] : [];
  const databaseTypes = databaseServices ? Object.keys(databaseServices[formState.provider] || {}) as DatabaseType[] : [];

  // Labels for dropdown options
  const computeSizeLabels: Record<string, string> = {
    small: 'Small',
    medium: 'Medium',
    large: 'Large',
    xlarge: 'X-Large',
  };

  const storageTypeLabels: Record<string, string> = {
    standard: 'Standard (Object Storage)',
    premium: 'Premium (Block Storage)',
    archive: 'Archive (Cold Storage)',
  };

  const databaseTypeLabels: Record<string, string> = {
    sql: 'SQL (Relational)',
    nosql: 'NoSQL (Document/Key-Value)',
    cache: 'Cache (In-Memory)',
  };

  const databaseTierLabels: Record<string, string> = {
    basic: 'Basic (Dev/Test)',
    standard: 'Standard (Production)',
    premium: 'Premium (High Performance)',
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Cost Estimator</h1>
        <p className="text-slate-400">Configure your resources and get real-time pricing from cloud provider APIs</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Configuration Panel */}
        <div className="space-y-6">
          {/* Provider Selection */}
          <div className="card">
            <h2 className="text-lg font-semibold text-white mb-4">Select Provider</h2>
            <div className="grid grid-cols-3 gap-3">
              {(Object.keys(PROVIDER_METADATA) as CloudProvider[]).map((provider) => (
                <button
                  key={provider}
                  onClick={() => updateForm({ provider })}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    formState.provider === provider
                      ? `${PROVIDER_METADATA[provider].bgColor} ${PROVIDER_METADATA[provider].borderColor}`
                      : 'border-slate-700 hover:border-slate-600'
                  }`}
                >
                  <span
                    className={`font-semibold ${
                      formState.provider === provider
                        ? PROVIDER_METADATA[provider].color
                        : 'text-slate-300'
                    }`}
                  >
                    {provider.toUpperCase()}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Compute Configuration */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Server className="w-5 h-5 text-cloud-blue" />
                <h2 className="text-lg font-semibold text-white">Compute</h2>
              </div>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formState.includeCompute}
                  onChange={(e) => updateForm({ includeCompute: e.target.checked })}
                  className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-cloud-blue focus:ring-cloud-blue"
                />
                <span className="text-sm text-slate-400">Include</span>
              </label>
            </div>

            {formState.includeCompute && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Instance Size</label>
                  <select
                    value={formState.computeSize}
                    onChange={(e) => updateForm({ computeSize: e.target.value as ComputeSize })}
                    className="select-field"
                  >
                    {computeSizes.length > 0 ? (
                      computeSizes.map((size) => (
                        <option key={size} value={size}>
                          {computeSizeLabels[size] || size}
                        </option>
                      ))
                    ) : (
                      <>
                        <option value="small">Small</option>
                        <option value="medium">Medium</option>
                        <option value="large">Large</option>
                        <option value="xlarge">X-Large</option>
                      </>
                    )}
                  </select>
                </div>

                {/* Show actual instance type for selected provider */}
                {instanceInfo && (
                  <div className="p-3 bg-slate-800/50 rounded-lg flex items-start gap-2">
                    <Cpu className="w-4 h-4 text-cloud-blue mt-0.5 flex-shrink-0" />
                    <div className="text-sm">
                      <p className="text-slate-300 font-medium">{instanceInfo.type}</p>
                      <p className="text-slate-500">{instanceInfo.vcpu} vCPU, {instanceInfo.memory}</p>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-slate-400 mb-1">Quantity</label>
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={formState.computeQuantity}
                      onChange={(e) => updateForm({ computeQuantity: parseInt(e.target.value) || 1 })}
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-slate-400 mb-1">Hours/Month</label>
                    <input
                      type="number"
                      min="1"
                      max="744"
                      value={formState.computeHours}
                      onChange={(e) => updateForm({ computeHours: parseInt(e.target.value) || 730 })}
                      className="input-field"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Storage Configuration */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <HardDrive className="w-5 h-5 text-cloud-blue" />
                <h2 className="text-lg font-semibold text-white">Storage</h2>
              </div>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formState.includeStorage}
                  onChange={(e) => updateForm({ includeStorage: e.target.checked })}
                  className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-cloud-blue focus:ring-cloud-blue"
                />
                <span className="text-sm text-slate-400">Include</span>
              </label>
            </div>

            {formState.includeStorage && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Storage Type</label>
                  <select
                    value={formState.storageType}
                    onChange={(e) => updateForm({ storageType: e.target.value as StorageType })}
                    className="select-field"
                  >
                    {storageTypes.length > 0 ? (
                      storageTypes.map((type) => (
                        <option key={type} value={type}>
                          {storageTypeLabels[type] || type}
                        </option>
                      ))
                    ) : (
                      <>
                        <option value="standard">Standard (Object Storage)</option>
                        <option value="premium">Premium (Block Storage)</option>
                        <option value="archive">Archive (Cold Storage)</option>
                      </>
                    )}
                  </select>
                </div>

                {/* Show actual storage service for selected provider */}
                {storageInfo && (
                  <div className="p-3 bg-slate-800/50 rounded-lg flex items-start gap-2">
                    <HardDrive className="w-4 h-4 text-cloud-blue mt-0.5 flex-shrink-0" />
                    <div className="text-sm">
                      <p className="text-slate-300 font-medium">{storageInfo.name}</p>
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm text-slate-400 mb-1">Size (GB)</label>
                  <input
                    type="number"
                    min="1"
                    max="100000"
                    value={formState.storageSize}
                    onChange={(e) => updateForm({ storageSize: parseInt(e.target.value) || 100 })}
                    className="input-field"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Database Configuration */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Database className="w-5 h-5 text-cloud-blue" />
                <h2 className="text-lg font-semibold text-white">Database</h2>
              </div>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formState.includeDatabase}
                  onChange={(e) => updateForm({ includeDatabase: e.target.checked })}
                  className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-cloud-blue focus:ring-cloud-blue"
                />
                <span className="text-sm text-slate-400">Include</span>
              </label>
            </div>

            {formState.includeDatabase && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Database Type</label>
                  <select
                    value={formState.databaseType}
                    onChange={(e) => updateForm({ databaseType: e.target.value as DatabaseType })}
                    className="select-field"
                  >
                    {databaseTypes.length > 0 ? (
                      databaseTypes.map((type) => (
                        <option key={type} value={type}>
                          {databaseTypeLabels[type] || type}
                        </option>
                      ))
                    ) : (
                      <>
                        <option value="sql">SQL (Relational)</option>
                        <option value="nosql">NoSQL (Document/Key-Value)</option>
                        <option value="cache">Cache (In-Memory)</option>
                      </>
                    )}
                  </select>
                </div>

                {/* Show actual database service for selected provider */}
                {databaseInfo && (
                  <div className="p-3 bg-slate-800/50 rounded-lg flex items-start gap-2">
                    <Database className="w-4 h-4 text-cloud-blue mt-0.5 flex-shrink-0" />
                    <div className="text-sm">
                      <p className="text-slate-300 font-medium">{databaseInfo.name}</p>
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm text-slate-400 mb-1">Performance Tier</label>
                  <select
                    value={formState.databaseTier}
                    onChange={(e) => updateForm({ databaseTier: e.target.value as DatabaseTier })}
                    className="select-field"
                  >
                    <option value="basic">{databaseTierLabels.basic}</option>
                    <option value="standard">{databaseTierLabels.standard}</option>
                    <option value="premium">{databaseTierLabels.premium}</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-slate-400 mb-1">Storage (GB)</label>
                    <input
                      type="number"
                      min="1"
                      max="10000"
                      value={formState.databaseStorageGb}
                      onChange={(e) => updateForm({ databaseStorageGb: parseInt(e.target.value) || 20 })}
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-slate-400 mb-1">Backup (Days)</label>
                    <input
                      type="number"
                      min="1"
                      max="35"
                      value={formState.databaseBackupDays}
                      onChange={(e) => updateForm({ databaseBackupDays: parseInt(e.target.value) || 7 })}
                      className="input-field"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Networking */}
          <div className="card">
            <div className="flex items-center gap-2 mb-4">
              <Globe className="w-5 h-5 text-cloud-blue" />
              <h2 className="text-lg font-semibold text-white">Networking</h2>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-slate-400 mb-1">Data Transfer Out (GB)</label>
                <input
                  type="number"
                  min="0"
                  max="100000"
                  value={formState.dataTransferGb}
                  onChange={(e) => updateForm({ dataTransferGb: parseInt(e.target.value) || 0 })}
                  className="input-field"
                />
              </div>

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formState.includeLoadBalancer}
                  onChange={(e) => updateForm({ includeLoadBalancer: e.target.checked })}
                  className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-cloud-blue focus:ring-cloud-blue"
                />
                <span className="text-slate-300">Include Load Balancer</span>
              </label>
            </div>
          </div>

          {/* Calculate Button */}
          <button
            onClick={handleCalculate}
            disabled={loading}
            className="btn-primary w-full flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Fetching Live Prices...
              </>
            ) : (
              <>
                <Calculator className="w-5 h-5" />
                Calculate Estimate
              </>
            )}
          </button>
        </div>

        {/* Results Panel */}
        <div>
          {error && (
            <div className="card border-red-500/50 bg-red-500/10 mb-6">
              <p className="text-red-400">{error}</p>
            </div>
          )}

          {result && (
            <div className="card sticky top-4">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-lg font-semibold text-white">Estimate Results</h2>
                  <p className={`text-sm ${PROVIDER_METADATA[result.provider as CloudProvider].color}`}>
                    {result.provider_display_name}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold text-cloud-blue">
                    ${result.total_monthly_cost.toFixed(2)}
                  </p>
                  <p className="text-sm text-slate-400">per month</p>
                </div>
              </div>

              {/* Pricing Source Info */}
              {result.pricing_note && (
                <div className="mb-4 p-3 bg-slate-800/50 rounded-lg flex items-start gap-2">
                  <Info className="w-4 h-4 text-cloud-blue mt-0.5 flex-shrink-0" />
                  <div className="text-sm">
                    <p className="text-slate-300">{result.pricing_note}</p>
                    <p className="text-slate-500 text-xs mt-1">
                      Last updated: {new Date(result.last_updated).toLocaleString()}
                    </p>
                  </div>
                </div>
              )}

              {/* Cost Breakdown */}
              <div className="space-y-3 mb-6">
                <h3 className="text-sm font-medium text-slate-400">Cost Breakdown</h3>
                {result.breakdown.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between py-2 border-b border-slate-700/50"
                  >
                    <div>
                      <p className="text-slate-300">{item.item}</p>
                      <p className="text-xs text-slate-500">
                        ${item.unit_cost.toFixed(4)} × {item.quantity.toLocaleString()} units
                      </p>
                      <p className="text-xs text-slate-600">{item.pricing_source}</p>
                    </div>
                    <p className="text-white font-medium">${item.monthly_cost.toFixed(2)}</p>
                  </div>
                ))}
              </div>

              {/* Annual Cost */}
              <div className="pt-4 border-t border-slate-700">
                <div className="flex items-center justify-between">
                  <p className="text-slate-400">Annual Estimate</p>
                  <p className="text-xl font-bold text-white">
                    ${result.total_annual_cost.toFixed(2)}
                  </p>
                </div>
              </div>
            </div>
          )}

          {!result && !error && (
            <div className="card text-center py-12">
              <Calculator className="w-12 h-12 text-slate-600 mx-auto mb-4" />
              <p className="text-slate-400">
                Configure your resources and click "Calculate Estimate"
              </p>
              <p className="text-sm text-slate-500 mt-2">
                Prices fetched live from Azure, AWS, and GCP APIs
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}