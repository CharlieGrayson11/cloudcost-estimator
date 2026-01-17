import { useState, useEffect } from 'react';
import { BarChart3, Loader2, Trophy, TrendingDown, Info } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import type { 
  CloudProvider, 
  ComputeSize, 
  StorageType, 
  DatabaseType,
  DatabaseTier,
  ComparisonResponse,
  InstanceTypesResponse,
  StorageServicesResponse,
  DatabaseServicesResponse,
} from '../types';
import { PROVIDER_METADATA, RESOURCE_TYPE_LABELS } from '../types';
import { compareProviders, getInstanceTypes, getStorageServices, getDatabaseServices } from '../services/api';

const CHART_COLORS = {
  aws: '#f97316',
  azure: '#3b82f6',
  gcp: '#ef4444',
};

export default function ComparePage() {
  // Form state
  const [computeSize, setComputeSize] = useState<ComputeSize>('medium');
  const [storageType, setStorageType] = useState<StorageType>('standard');
  const [storageGb, setStorageGb] = useState(100);
  const [hoursPerMonth, setHoursPerMonth] = useState(730);
  const [includeDatabase, setIncludeDatabase] = useState(false);
  const [databaseType, setDatabaseType] = useState<DatabaseType>('sql');
  const [databaseTier, setDatabaseTier] = useState<DatabaseTier>('standard');

  // Results
  const [result, setResult] = useState<ComparisonResponse | null>(null);
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

  const handleCompare = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await compareProviders({
        compute_size: computeSize,
        storage_type: storageType,
        storage_gb: storageGb,
        hours_per_month: hoursPerMonth,
        include_database: includeDatabase,
        database_type: includeDatabase ? databaseType : undefined,
        database_tier: includeDatabase ? databaseTier : undefined,
      });
      setResult(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to compare providers');
    } finally {
      setLoading(false);
    }
  };

  const chartData = result?.estimates.map((estimate) => ({
    name: estimate.provider.toUpperCase(),
    cost: estimate.total_monthly_cost,
    provider: estimate.provider,
  }));

  const sortedEstimates = result?.estimates
    .slice()
    .sort((a, b) => a.total_monthly_cost - b.total_monthly_cost);

  // Get generic resource type label for table headers
  const getResourceLabel = (resourceType?: string): string => {
    if (!resourceType) return 'Resource';
    return RESOURCE_TYPE_LABELS[resourceType] || resourceType;
  };

  // Labels for dropdown options
  const computeSizeLabels: Record<string, string> = {
    small: 'Small',
    medium: 'Medium',
    large: 'Large',
    xlarge: 'X-Large',
  };

  const storageTypeLabels: Record<string, string> = {
    standard: 'Standard',
    premium: 'Premium',
    archive: 'Archive',
  };

  const databaseTypeLabels: Record<string, string> = {
    sql: 'SQL',
    nosql: 'NoSQL',
    cache: 'Cache',
  };

  const databaseTierLabels: Record<string, string> = {
    basic: 'Basic',
    standard: 'Standard',
    premium: 'Premium',
  };

  // Get available options from API
  const computeSizes = instanceTypes ? Object.keys(instanceTypes['aws'] || {}) as ComputeSize[] : [];
  const storageTypes = storageServices ? Object.keys(storageServices['aws'] || {}) as StorageType[] : [];
  const databaseTypes = databaseServices ? Object.keys(databaseServices['aws'] || {}) as DatabaseType[] : [];

  return (
    <div className="max-w-6xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Compare Providers</h1>
        <p className="text-slate-400">Live pricing comparison across AWS, Azure, and GCP</p>
      </div>

      {/* Configuration */}
      <div className="card mb-8">
        <h2 className="text-lg font-semibold text-white mb-4">Configuration</h2>
        
        {/* Compute & Storage Row */}
        <div className="grid md:grid-cols-4 gap-4 mb-4">
          <div>
            <label className="block text-sm text-slate-400 mb-1">Compute Size</label>
            <select
              value={computeSize}
              onChange={(e) => setComputeSize(e.target.value as ComputeSize)}
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

          <div>
            <label className="block text-sm text-slate-400 mb-1">Storage Type</label>
            <select
              value={storageType}
              onChange={(e) => setStorageType(e.target.value as StorageType)}
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
                  <option value="standard">Standard</option>
                  <option value="premium">Premium</option>
                  <option value="archive">Archive</option>
                </>
              )}
            </select>
          </div>

          <div>
            <label className="block text-sm text-slate-400 mb-1">Storage (GB)</label>
            <input
              type="number"
              min="1"
              value={storageGb}
              onChange={(e) => setStorageGb(parseInt(e.target.value) || 100)}
              className="input-field"
            />
          </div>

          <div>
            <label className="block text-sm text-slate-400 mb-1">Hours/Month</label>
            <input
              type="number"
              min="1"
              max="744"
              value={hoursPerMonth}
              onChange={(e) => setHoursPerMonth(parseInt(e.target.value) || 730)}
              className="input-field"
            />
          </div>
        </div>

        {/* Database Toggle */}
        <div className="border-t border-slate-700 pt-4 mt-4">
          <label className="flex items-center gap-2 mb-4">
            <input
              type="checkbox"
              checked={includeDatabase}
              onChange={(e) => setIncludeDatabase(e.target.checked)}
              className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-cloud-blue focus:ring-cloud-blue"
            />
            <span className="text-slate-300 font-medium">Include Database</span>
          </label>

          {includeDatabase && (
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-slate-400 mb-1">Database Type</label>
                <select
                  value={databaseType}
                  onChange={(e) => setDatabaseType(e.target.value as DatabaseType)}
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
                      <option value="sql">SQL</option>
                      <option value="nosql">NoSQL</option>
                      <option value="cache">Cache</option>
                    </>
                  )}
                </select>
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-1">Performance Tier</label>
                <select
                  value={databaseTier}
                  onChange={(e) => setDatabaseTier(e.target.value as DatabaseTier)}
                  className="select-field"
                >
                  <option value="basic">{databaseTierLabels.basic}</option>
                  <option value="standard">{databaseTierLabels.standard}</option>
                  <option value="premium">{databaseTierLabels.premium}</option>
                </select>
              </div>
            </div>
          )}
        </div>

        <button
          onClick={handleCompare}
          disabled={loading}
          className="btn-primary mt-4 flex items-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Fetching Live Prices...
            </>
          ) : (
            <>
              <BarChart3 className="w-5 h-5" />
              Compare Providers
            </>
          )}
        </button>
      </div>

      {error && (
        <div className="card border-red-500/50 bg-red-500/10 mb-6">
          <p className="text-red-400">{error}</p>
        </div>
      )}

      {result && (
        <>
          {/* Savings Banner */}
          {result.potential_savings > 0 && (
            <div className="card border-green-500/50 bg-green-500/10 mb-6">
              <div className="flex items-center gap-3">
                <TrendingDown className="w-6 h-6 text-green-400" />
                <div>
                  <p className="text-green-400 font-semibold">
                    Potential Monthly Savings: ${result.potential_savings.toFixed(2)}
                  </p>
                  <p className="text-green-400/70 text-sm">
                    by choosing {result.cheapest_provider.toUpperCase()} over the most expensive option
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Chart */}
          <div className="card mb-6">
            <h2 className="text-lg font-semibold text-white mb-4">Monthly Cost Comparison</h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="name" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" tickFormatter={(value) => `$${value}`} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1e293b',
                      border: '1px solid #334155',
                      borderRadius: '8px',
                    }}
                    formatter={(value: number) => [`$${value.toFixed(2)}`, 'Monthly Cost']}
                  />
                  <Bar dataKey="cost" radius={[4, 4, 0, 0]}>
                    {chartData?.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={CHART_COLORS[entry.provider as keyof typeof CHART_COLORS]}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Provider Cards */}
          <div className="grid md:grid-cols-3 gap-4 mb-6">
            {sortedEstimates?.map((estimate, index) => (
              <div
                key={estimate.provider}
                className={`card relative ${
                  index === 0
                    ? `${PROVIDER_METADATA[estimate.provider as CloudProvider].borderColor} border-2`
                    : ''
                }`}
              >
                {index === 0 && (
                  <div className="absolute -top-3 left-4 px-2 py-1 bg-yellow-500 text-yellow-900 text-xs font-bold rounded flex items-center gap-1">
                    <Trophy className="w-3 h-3" />
                    Best Value
                  </div>
                )}

                <div className="flex items-center justify-between mb-4 mt-2">
                  <h3
                    className={`text-lg font-semibold ${
                      PROVIDER_METADATA[estimate.provider as CloudProvider].color
                    }`}
                  >
                    {estimate.provider.toUpperCase()}
                  </h3>
                  <p className="text-2xl font-bold text-white">
                    ${estimate.total_monthly_cost.toFixed(2)}
                  </p>
                </div>

                <p className="text-sm text-slate-400 mb-3">{estimate.provider_display_name}</p>

                {/* Pricing Source */}
                {estimate.pricing_note && (
                  <div className="mb-3 p-2 bg-slate-800/50 rounded flex items-start gap-2">
                    <Info className="w-3 h-3 text-slate-500 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-slate-500">{estimate.pricing_note}</p>
                  </div>
                )}

                {/* Service breakdown */}
                <div className="space-y-2">
                  {estimate.breakdown.map((item, idx) => (
                    <div key={idx} className="flex justify-between text-sm">
                      <div className="flex-1 min-w-0 pr-2">
                        <span className="text-slate-400 text-xs block">
                          {getResourceLabel(item.resource_type)}
                        </span>
                        <span className="text-slate-300 block truncate" title={item.item}>
                          {item.item}
                        </span>
                      </div>
                      <span className="text-slate-300 whitespace-nowrap">${item.monthly_cost.toFixed(2)}</span>
                    </div>
                  ))}
                </div>

                <div className="mt-4 pt-4 border-t border-slate-700">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Annual Estimate</span>
                    <span className="text-white font-medium">
                      ${estimate.total_annual_cost.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Detailed Breakdown Table */}
          <div className="card">
            <h2 className="text-lg font-semibold text-white mb-4">Detailed Breakdown</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-700">
                    <th className="text-left py-3 px-4 text-slate-400 font-medium">Resource</th>
                    {result.estimates.map((estimate) => (
                      <th
                        key={estimate.provider}
                        className={`text-right py-3 px-4 font-medium ${
                          PROVIDER_METADATA[estimate.provider as CloudProvider].color
                        }`}
                      >
                        {estimate.provider.toUpperCase()}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {result.estimates[0]?.breakdown.map((_, idx) => {
                    const resourceType = result.estimates[0].breakdown[idx]?.resource_type;
                    
                    return (
                      <tr key={idx} className="border-b border-slate-700/50">
                        <td className="py-3 px-4">
                          <span className="text-slate-300 font-medium">
                            {getResourceLabel(resourceType)}
                          </span>
                        </td>
                        {result.estimates.map((estimate) => {
                          const item = estimate.breakdown[idx];
                          return (
                            <td key={estimate.provider} className="text-right py-3 px-4">
                              <span className="text-white block">
                                ${item?.monthly_cost.toFixed(2) || '0.00'}
                              </span>
                              <span className="text-slate-500 text-xs block truncate max-w-[150px]" title={item?.item}>
                                {item?.item}
                              </span>
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                  <tr className="font-semibold bg-slate-800/30">
                    <td className="py-3 px-4 text-white">Total Monthly</td>
                    {result.estimates.map((estimate) => (
                      <td
                        key={estimate.provider}
                        className={`text-right py-3 px-4 ${
                          estimate.provider === result.cheapest_provider
                            ? 'text-green-400'
                            : 'text-white'
                        }`}
                      >
                        ${estimate.total_monthly_cost.toFixed(2)}
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {!result && !error && (
        <div className="card text-center py-12">
          <BarChart3 className="w-12 h-12 text-slate-600 mx-auto mb-4" />
          <p className="text-slate-400">
            Configure your resources and click "Compare Providers"
          </p>
          <p className="text-sm text-slate-500 mt-2">
            Live prices from Azure Retail API, AWS Price List API, and GCP Billing API
          </p>
        </div>
      )}
    </div>
  );
}