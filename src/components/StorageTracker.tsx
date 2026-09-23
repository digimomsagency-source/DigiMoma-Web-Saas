import React, { useState, useEffect } from "react";
import { DatabaseSizeInfo } from "../types";
import { HardDrive, AlertTriangle, RefreshCw, CheckCircle, ArrowUpRight, Zap } from "lucide-react";

interface StorageTrackerProps {
  onRefreshTrigger?: () => void;
}

export const StorageTracker: React.FC<StorageTrackerProps> = ({ onRefreshTrigger }) => {
  const [data, setData] = useState<DatabaseSizeInfo | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);

  const fetchStorageData = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/db-size");
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error("Failed to fetch database size metrics", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStorageData();
    // Poll every 30 seconds
    const interval = setInterval(fetchStorageData, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleSimulateThreshold = async (sizeMb: number) => {
    try {
      setIsSimulating(true);
      await fetch("/api/admin/set-db-size", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ size_mb: sizeMb }),
      });
      await fetchStorageData();
      if (onRefreshTrigger) onRefreshTrigger();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSimulating(false);
    }
  };

  if (!data) return null;

  const isCritical = data.is_warning || data.usage_percent >= 80;

  return (
    <div className="w-full">
      {/* CRITICAL WARNING TRIGGER: Pulsing Red Banner when >= 80% (>= 400 MB) */}
      {isCritical && (
        <div
          id="storage-critical-warning"
          role="alert"
          className="mb-6 p-4 rounded-xl bg-red-950 border-2 border-red-600 text-red-100 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-lg shadow-red-900/30 animate-pulse"
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-red-600 text-white rounded-lg shrink-0">
              <AlertTriangle className="w-6 h-6 animate-bounce" />
            </div>
            <div>
              <div className="font-bold text-base text-red-200 uppercase tracking-wider flex items-center gap-2">
                CRITICAL ACTION REQUIRED: Supabase Memory Limit Reaching Full Capacity
                <span className="bg-red-700 text-white text-xs px-2 py-0.5 rounded-full font-mono">
                  {data.usage_percent}% USED
                </span>
              </div>
              <p className="text-sm text-red-300 mt-1">
                Database utilization has crossed the 80% (400 MB) threshold on the Supabase Free Tier ceiling (500 MB). Please upgrade to the Pro Plan immediately to prevent automated system suspension.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <a
              href="https://supabase.com/dashboard"
              target="_blank"
              rel="noreferrer"
              className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white font-medium rounded-lg text-sm flex items-center gap-1.5 transition-colors shadow"
            >
              Upgrade on Supabase <ArrowUpRight className="w-4 h-4" />
            </a>
            <button
              onClick={() => handleSimulateThreshold(48.5)}
              disabled={isSimulating}
              className="px-3 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-lg text-xs font-mono transition-colors"
              title="Reset simulated size to normal"
            >
              Reset Test
            </button>
          </div>
        </div>
      )}

      {/* System Health & Data Limits Widget */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-neutral-800">
          <div className="flex items-center gap-2.5">
            <div className={`p-2 rounded-lg ${isCritical ? "bg-red-900/50 text-red-400" : "bg-blue-900/40 text-blue-400"}`}>
              <HardDrive className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-neutral-100 flex items-center gap-2">
                System Health &amp; Data Limits
                <span className="text-xs px-2 py-0.5 rounded-full bg-neutral-800 text-neutral-400 font-mono">
                  Supabase PostgreSQL
                </span>
              </h3>
              <p className="text-xs text-neutral-400">
                Live automated telemetry via <code className="text-blue-400">pg_database_size()</code> RPC
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Simulator buttons for testing warning threshold */}
            <div className="flex items-center bg-neutral-950 p-1 rounded-lg border border-neutral-800 text-xs">
              <span className="text-neutral-400 px-2 flex items-center gap-1">
                <Zap className="w-3 h-3 text-amber-400" /> Test Warning:
              </span>
              <button
                onClick={() => handleSimulateThreshold(425)}
                disabled={isSimulating}
                className="px-2 py-1 bg-red-900/70 hover:bg-red-800 text-red-200 rounded text-xs transition font-mono"
                title="Simulate 425MB (85% - triggers red warning)"
              >
                85% (425 MB)
              </button>
              <button
                onClick={() => handleSimulateThreshold(48.5)}
                disabled={isSimulating}
                className="px-2 py-1 hover:bg-neutral-800 text-neutral-300 rounded text-xs transition font-mono ml-1"
                title="Reset to 48.5 MB (safe level)"
              >
                Safe (48 MB)
              </button>
            </div>

            <button
              onClick={fetchStorageData}
              disabled={loading}
              className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 transition-colors"
              title="Refresh database metrics"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-blue-400" : ""}`} />
            </button>
          </div>
        </div>

        {/* Progress Bar & Numeric Metrics */}
        <div className="mt-4">
          <div className="flex justify-between items-baseline mb-2">
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold font-mono text-neutral-100">{data.size_mb} MB</span>
              <span className="text-xs text-neutral-400">used of</span>
              <span className="text-sm font-semibold font-mono text-neutral-300">{data.limit_mb} MB</span>
              <span className="text-xs text-neutral-500">(Free Tier Cap)</span>
            </div>
            <div className="text-right">
              <span
                className={`text-sm font-bold font-mono px-2.5 py-0.5 rounded-md ${
                  isCritical
                    ? "bg-red-900/60 text-red-300 border border-red-700"
                    : data.usage_percent > 60
                    ? "bg-amber-900/60 text-amber-300"
                    : "bg-emerald-950 text-emerald-300 border border-emerald-800"
                }`}
              >
                {data.usage_percent}%
              </span>
            </div>
          </div>

          {/* Visual Live Progress Bar */}
          <div className="w-full h-3.5 bg-neutral-800 rounded-full overflow-hidden p-0.5 border border-neutral-700">
            <div
              className={`h-full rounded-full transition-all duration-700 ease-out ${
                isCritical
                  ? "bg-gradient-to-r from-red-600 to-rose-500"
                  : data.usage_percent > 60
                  ? "bg-gradient-to-r from-amber-500 to-orange-500"
                  : "bg-gradient-to-r from-emerald-500 to-blue-500"
              }`}
              style={{ width: `${Math.min(100, Math.max(2, data.usage_percent))}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-xs text-neutral-400 mt-2">
            <div className="flex items-center gap-1.5">
              {isCritical ? (
                <span className="flex items-center gap-1 text-red-400 font-medium">
                  <AlertTriangle className="w-3.5 h-3.5" /> High threshold reached (&ge; 80% / 400 MB)
                </span>
              ) : (
                <span className="flex items-center gap-1 text-emerald-400 font-medium">
                  <CheckCircle className="w-3.5 h-3.5" /> Normal memory operation (&lt; 400 MB)
                </span>
              )}
            </div>
            <div className="text-neutral-500 font-mono">
              Source: {data.source === "live_supabase_rpc" ? "Supabase RPC (pg_database_size)" : "Calculated Storage Engine"}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
