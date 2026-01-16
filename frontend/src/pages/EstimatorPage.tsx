import { useState } from 'react';
import { 
  Calculator, 
  Server, 
  Database, 
  HardDrive, 
  Network,
  Loader2,
  AlertCircle,
  DollarSign,
  Calendar
} from 'lucide-react';
import clsx from 'clsx';
import type { 
  CloudProvider, 
  ComputeSize, 
  StorageType, 
  DatabaseType,
  EstimateResponse,
  EstimatorFormState
} from '../types';
import { 
  PROVIDER_METADATA, 
  COMPUTE_SIZE_LABELS, 
  STORAGE_TYPE_LABELS,
  DATABASE_TYPE_LABELS,
  defaultFormState 
} from '../types';
import { estimateFull, buildEstimateRequest } from '../services/api';

export default function EstimatorPage() {
  const [formState, setFormState] = useState<EstimatorFormState>(defaultFormState);
  const [result, setResult] = useState<EstimateResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateForm = <K extends keyof EstimatorFormState>(
    key: K, 
    value: EstimatorFormState[K]
  ) => {
    setFormState(prev => ({ ...prev, [key]: value }));
  };

  const handleEstimate = async () => {
    setLoading(true);
    setError(null);
    try {
      const request = buildEstimateRequest(formState.provider, formState);
      const response = await estimateFull(request);
      setResult(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get estimate');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 animate-fade-in">
      {/* Header */}
      <div className="mb-10">
        <h1 className="text-3xl sm:text-4xl font-display font-bold text-white mb-4">
          Cost Estimator
        </h1>
        <p className="text-slate-400 max-w-2xl">
          Configure your cloud resources and get an instant cost estimate. 
          Select your provider and customize the resources you need.
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Configuration Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Provider Selection */}
          <div className="card">
            <h2 className="font-display text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Calculator className="w-5 h-5 text-cloud-400" />
              Select Provider
            </h2>
            <div className="grid grid-cols-3 gap-3">
              {(Object.keys(PROVIDER_METADATA) as CloudProvider[]).map((provider) => {
                const meta = PROVIDER_METADATA[provider];
                return (
                  <button
                    key={provider}
                    onClick={() => updateForm('provider', provider)}
                    className={clsx(
                      'p-4 rounded-lg border-2 transition-all duration-200',
                      formState.provider === provider
                        ? 'border-cloud-500 bg-cloud-600/10'
                        : 'border-slate-700 hover:border-slate-600 bg-slate-800/50'
                    )}
                  >
                    <div 
                      className="w-4 h-4 rounded-full mx-auto mb-2"
                      style={{ backgroundColor: meta.color }}
                    />
                    <div className="text-sm font-medium text-white">{provider.toUpperCase()}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Compute */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-lg font-semibold text-white flex items-center gap-2">
                <Server className="w-5 h-5 text-cloud-400" />
                Compute
              </h2>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formState.includeCompute}
                  onChange={(e) => updateForm('includeCompute', e.target.checked)}
                  className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-cloud-500 focus:ring-cloud-500"
                />
                <span className="text-sm text-slate-400">Include</span>
              </label>
            </div>
            
            {formState.includeCompute && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-slate-400 mb-2">Instance Size</label>
                  <select
                    value={formState.computeSize}
                    onChange={(e) => updateForm('computeSize', e.target.value as ComputeSize)}
                    className="select-field"
                  >
                    {Object.entries(COMPUTE_SIZE_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-slate-400 mb-2">Quantity</label>
                    <input
                      type="number"
                      min={1}
                      max={100}
                      value={formState.computeQuantity}
                      onChange={(e) => updateForm('computeQuantity', parseInt(e.target.value) || 1)}
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-slate-400 mb-2">Hours/Month</label>
                    <input
                      type="number"
                      min={1}
                      max={744}
                      value={formState.computeHours}
                      onChange={(e) => updateForm('computeHours', parseInt(e.target.value) || 730)}
                      className="input-field"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Storage */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-lg font-semibold text-white flex items-center gap-2">
                <HardDrive className="w-5 h-5 text-cloud-400" />
                Storage
              </h2>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formState.includeStorage}
                  onChange={(e) => updateForm('includeStorage', e.target.checked)}
                  className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-cloud-500 focus:ring-cloud-500"
                />
                <span className="text-sm text-slate-400">Include</span>
              </label>
            </div>
            
            {formState.includeStorage && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-slate-400 mb-2">Storage Type</label>
                  <select
                    value={formState.storageType}
                    onChange={(e) => updateForm('storageType', e.target.value as StorageType)}
                    className="select-field"
                  >
                    {Object.entries(STORAGE_TYPE_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-2">Size (GB)</label>
                  <input
                    type="number"
                    min={1}
                    max={100000}
                    value={formState.storageSize}
                    onChange={(e) => updateForm('storageSize', parseInt(e.target.value) || 100)}
                    className="input-field"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Database */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-lg font-semibold text-white flex items-center gap-2">
                <Database className="w-5 h-5 text-cloud-400" />
                Database
              </h2>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formState.includeDatabase}
                  onChange={(e) => updateForm('includeDatabase', e.target.checked)}
                  className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-cloud-500 focus:ring-cloud-500"
                />
                <span className="text-sm text-slate-400">Include</span>
              </label>
            </div>
            
            {formState.includeDatabase && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-slate-400 mb-2">Database Type</label>
                  <select
                    value={formState.databaseType}
                    onChange={(e) => updateForm('databaseType', e.target.value as DatabaseType)}
                    className="select-field"
                  >
                    {Object.entries(DATABASE_TYPE_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-2">Hours/Month</label>
                  <input
                    type="number"
                    min={1}
                    max={744}
                    value={formState.databaseHours}
                    onChange={(e) => updateForm('databaseHours', parseInt(e.target.value) || 730)}
                    className="input-field"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Networking */}
          <div className="card">
            <h2 className="font-display text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Network className="w-5 h-5 text-cloud-400" />
              Networking
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-slate-400 mb-2">Data Transfer Out (GB/Month)</label>
                <input
                  type="number"
                  min={0}
                  max={100000}
                  value={formState.dataTransferGb}
                  onChange={(e) => updateForm('dataTransferGb', parseInt(e.target.value) || 0)}
                  className="input-field"
                />
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formState.includeLoadBalancer}
                  onChange={(e) => updateForm('includeLoadBalancer', e.target.checked)}
                  className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-cloud-500 focus:ring-cloud-500"
                />
                <span className="text-sm text-slate-400">Include Load Balancer</span>
              </label>
            </div>
          </div>

          {/* Estimate Button */}
          <button
            onClick={handleEstimate}
            disabled={loading}
            className="btn-primary w-full flex items-center justify-center gap-2 text-lg"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Calculating...
              </>
            ) : (
              <>
                <Calculator className="w-5 h-5" />
                Calculate Estimate
              </>
            )}
          </button>

          {/* Error */}
          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center gap-3 text-red-400">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              {error}
            </div>
          )}
        </div>

        {/* Results Panel */}
        <div className="lg:col-span-1">
          <div className="card sticky top-24">
            <h2 className="font-display text-lg font-semibold text-white mb-6 flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-cloud-400" />
              Cost Estimate
            </h2>

            {result ? (
              <div className="space-y-6">
                {/* Provider Badge */}
                <div className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: PROVIDER_METADATA[result.provider as CloudProvider].color }}
                  />
                  <span className="text-slate-300">{result.provider_display_name}</span>
                </div>

                {/* Monthly Cost */}
                <div className="p-4 bg-cloud-600/10 border border-cloud-600/20 rounded-lg">
                  <div className="text-sm text-slate-400 mb-1">Monthly Cost</div>
                  <div className="text-3xl font-display font-bold text-cloud-400">
                    {formatCurrency(result.total_monthly_cost)}
                  </div>
                </div>

                {/* Annual Cost */}
                <div className="p-4 bg-slate-800/50 rounded-lg">
                  <div className="flex items-center gap-2 text-sm text-slate-400 mb-1">
                    <Calendar className="w-4 h-4" />
                    Annual Cost
                  </div>
                  <div className="text-2xl font-display font-semibold text-white">
                    {formatCurrency(result.total_annual_cost)}
                  </div>
                </div>

                {/* Breakdown */}
                {result.breakdown.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium text-slate-400 mb-3">Cost Breakdown</h3>
                    <div className="space-y-2">
                      {result.breakdown.map((item, index) => (
                        <div 
                          key={index}
                          className="flex items-center justify-between py-2 border-b border-slate-800 last:border-0"
                        >
                          <span className="text-sm text-slate-300">{item.item}</span>
                          <span className="text-sm font-mono text-slate-400">
                            {formatCurrency(item.monthly_cost)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-12 text-slate-500">
                <Calculator className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Configure your resources and click "Calculate Estimate" to see costs</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
