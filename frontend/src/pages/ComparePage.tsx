import { useState } from 'react';
import { 
  GitCompare, 
  Loader2, 
  AlertCircle,
  TrendingDown,
  CheckCircle,
  DollarSign
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import clsx from 'clsx';
import type { ComputeSize, StorageType, ComparisonResponse } from '../types';
import { COMPUTE_SIZE_LABELS, STORAGE_TYPE_LABELS, PROVIDER_METADATA } from '../types';
import { compareProviders } from '../services/api';

const PROVIDER_COLORS = {
  aws: '#FF9900',
  azure: '#0078D4',
  gcp: '#4285F4',
};

export default function ComparePage() {
  const [computeSize, setComputeSize] = useState<ComputeSize>('medium');
  const [storageGb, setStorageGb] = useState(100);
  const [storageType, setStorageType] = useState<StorageType>('standard');
  const [hoursPerMonth, setHoursPerMonth] = useState(730);
  
  const [result, setResult] = useState<ComparisonResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCompare = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await compareProviders({
        compute_size: computeSize,
        storage_gb: storageGb,
        storage_type: storageType,
        hours_per_month: hoursPerMonth,
      });
      setResult(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to compare providers');
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

  const chartData = result?.estimates.map(estimate => ({
    name: estimate.provider.toUpperCase(),
    provider: estimate.provider,
    cost: estimate.total_monthly_cost,
    isCheapest: estimate.provider === result.cheapest_provider,
  })) || [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 animate-fade-in">
      {/* Header */}
      <div className="mb-10">
        <h1 className="text-3xl sm:text-4xl font-display font-bold text-white mb-4">
          Compare Providers
        </h1>
        <p className="text-slate-400 max-w-2xl">
          Compare the same configuration across AWS, Azure, and GCP to find 
          the most cost-effective option for your needs.
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Configuration */}
        <div className="lg:col-span-1 space-y-6">
          <div className="card">
            <h2 className="font-display text-lg font-semibold text-white mb-6 flex items-center gap-2">
              <GitCompare className="w-5 h-5 text-cloud-400" />
              Configuration
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-slate-400 mb-2">Compute Size</label>
                <select
                  value={computeSize}
                  onChange={(e) => setComputeSize(e.target.value as ComputeSize)}
                  className="select-field"
                >
                  {Object.entries(COMPUTE_SIZE_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-2">Storage Type</label>
                <select
                  value={storageType}
                  onChange={(e) => setStorageType(e.target.value as StorageType)}
                  className="select-field"
                >
                  {Object.entries(STORAGE_TYPE_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-2">Storage Size (GB)</label>
                <input
                  type="number"
                  min={1}
                  max={100000}
                  value={storageGb}
                  onChange={(e) => setStorageGb(parseInt(e.target.value) || 100)}
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-2">Hours/Month</label>
                <input
                  type="number"
                  min={1}
                  max={744}
                  value={hoursPerMonth}
                  onChange={(e) => setHoursPerMonth(parseInt(e.target.value) || 730)}
                  className="input-field"
                />
              </div>

              <button
                onClick={handleCompare}
                disabled={loading}
                className="btn-primary w-full flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Comparing...
                  </>
                ) : (
                  <>
                    <GitCompare className="w-5 h-5" />
                    Compare Providers
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Savings Card */}
          {result && (
            <div className="card bg-gradient-to-br from-green-900/20 to-green-800/10 border-green-800/30">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                  <TrendingDown className="w-5 h-5 text-green-400" />
                </div>
                <div>
                  <div className="text-sm text-slate-400">Potential Savings</div>
                  <div className="text-xl font-display font-bold text-green-400">
                    {formatCurrency(result.potential_savings)}/mo
                  </div>
                </div>
              </div>
              <p className="text-sm text-slate-400">
                By choosing {result.cheapest_provider.toUpperCase()} over the most expensive option
              </p>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center gap-3 text-red-400">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              {error}
            </div>
          )}
        </div>

        {/* Results */}
        <div className="lg:col-span-2 space-y-6">
          {result ? (
            <>
              {/* Chart */}
              <div className="card">
                <h3 className="font-display text-lg font-semibold text-white mb-6">
                  Monthly Cost Comparison
                </h3>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                      <XAxis 
                        type="number" 
                        stroke="#94a3b8"
                        tickFormatter={(value) => `$${value}`}
                      />
                      <YAxis 
                        type="category" 
                        dataKey="name" 
                        stroke="#94a3b8"
                        width={60}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#1e293b',
                          border: '1px solid #334155',
                          borderRadius: '8px',
                        }}
                        formatter={(value: number) => [formatCurrency(value), 'Monthly Cost']}
                      />
                      <Bar dataKey="cost" radius={[0, 4, 4, 0]}>
                        {chartData.map((entry) => (
                          <Cell 
                            key={entry.provider}
                            fill={PROVIDER_COLORS[entry.provider as keyof typeof PROVIDER_COLORS]}
                            opacity={entry.isCheapest ? 1 : 0.6}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Provider Cards */}
              <div className="grid md:grid-cols-3 gap-4">
                {result.estimates
                  .sort((a, b) => a.total_monthly_cost - b.total_monthly_cost)
                  .map((estimate, index) => {
                    const isCheapest = estimate.provider === result.cheapest_provider;
                    const meta = PROVIDER_METADATA[estimate.provider as keyof typeof PROVIDER_METADATA];
                    
                    return (
                      <div
                        key={estimate.provider}
                        className={clsx(
                          'card relative overflow-hidden',
                          isCheapest && 'ring-2 ring-green-500/50'
                        )}
                      >
                        {isCheapest && (
                          <div className="absolute top-0 right-0 bg-green-500 text-white text-xs font-medium px-3 py-1 rounded-bl-lg flex items-center gap-1">
                            <CheckCircle className="w-3 h-3" />
                            Best Value
                          </div>
                        )}
                        
                        <div className="flex items-center gap-2 mb-4">
                          <div 
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: meta.color }}
                          />
                          <span className="font-display font-semibold text-white">
                            {estimate.provider.toUpperCase()}
                          </span>
                        </div>

                        <div className="mb-4">
                          <div className="text-sm text-slate-400 mb-1">Monthly</div>
                          <div className="text-2xl font-display font-bold text-white">
                            {formatCurrency(estimate.total_monthly_cost)}
                          </div>
                        </div>

                        <div>
                          <div className="text-sm text-slate-400 mb-1">Annual</div>
                          <div className="text-lg font-mono text-slate-300">
                            {formatCurrency(estimate.total_annual_cost)}
                          </div>
                        </div>

                        {/* Rank indicator */}
                        <div className="absolute bottom-4 right-4 text-4xl font-display font-bold text-slate-800">
                          #{index + 1}
                        </div>
                      </div>
                    );
                  })}
              </div>

              {/* Detailed Breakdown */}
              <div className="card">
                <h3 className="font-display text-lg font-semibold text-white mb-6 flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-cloud-400" />
                  Detailed Breakdown
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-slate-800">
                        <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">Provider</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">Resource</th>
                        <th className="text-right py-3 px-4 text-sm font-medium text-slate-400">Unit Cost</th>
                        <th className="text-right py-3 px-4 text-sm font-medium text-slate-400">Quantity</th>
                        <th className="text-right py-3 px-4 text-sm font-medium text-slate-400">Monthly</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.estimates.map((estimate) =>
                        estimate.breakdown.map((item, itemIndex) => (
                          <tr 
                            key={`${estimate.provider}-${itemIndex}`}
                            className="border-b border-slate-800/50 hover:bg-slate-800/30"
                          >
                            {itemIndex === 0 && (
                              <td 
                                className="py-3 px-4 text-sm font-medium text-white"
                                rowSpan={estimate.breakdown.length}
                              >
                                <div className="flex items-center gap-2">
                                  <div 
                                    className="w-2 h-2 rounded-full"
                                    style={{ 
                                      backgroundColor: PROVIDER_COLORS[estimate.provider as keyof typeof PROVIDER_COLORS] 
                                    }}
                                  />
                                  {estimate.provider.toUpperCase()}
                                </div>
                              </td>
                            )}
                            <td className="py-3 px-4 text-sm text-slate-300">{item.item}</td>
                            <td className="py-3 px-4 text-sm text-slate-400 text-right font-mono">
                              ${item.unit_cost.toFixed(4)}
                            </td>
                            <td className="py-3 px-4 text-sm text-slate-400 text-right font-mono">
                              {item.quantity.toLocaleString()}
                            </td>
                            <td className="py-3 px-4 text-sm text-white text-right font-mono">
                              {formatCurrency(item.monthly_cost)}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          ) : (
            <div className="card flex flex-col items-center justify-center py-24 text-center">
              <GitCompare className="w-16 h-16 text-slate-700 mb-6" />
              <h3 className="text-xl font-display font-semibold text-white mb-2">
                Ready to Compare
              </h3>
              <p className="text-slate-400 max-w-md">
                Configure your desired resources and click "Compare Providers" to see 
                a side-by-side cost comparison across all major cloud platforms.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
