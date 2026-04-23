import { useEffect, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { PageHeader } from '../../components';
import { RouterStatusPanel } from '../../components/iot/RouterStatusPanel';
import { iotNodeService } from '../../services/iotNodeService';
import type { IoTNode, RouterStatus as RouterStatusType } from '../../types';

export function RouterStatusPage() {
  const [nodes, setNodes] = useState<IoTNode[]>([]);
  const [selectedId, setSelectedId] = useState<string>('');
  const [node, setNode] = useState<IoTNode | null>(null);
  const [status, setStatus] = useState<RouterStatusType | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const list = await iotNodeService.getAll();
        if (!cancelled) {
          setNodes(list);
          if (list.length && !selectedId) setSelectedId(list[0].id);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!selectedId) {
      setNode(null);
      setStatus(null);
      return;
    }
    setNode(null);
    setStatus(null);
    let cancelled = false;
    (async () => {
      setRefreshing(true);
      try {
        const n = await iotNodeService.getById(selectedId);
        const s = await iotNodeService.getRouterStatus(selectedId);
        if (!cancelled) {
          setNode(n);
          setStatus(s);
        }
      } catch {
        if (!cancelled) {
          setNode(null);
          setStatus(null);
        }
      } finally {
        if (!cancelled) setRefreshing(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [selectedId]);

  const manualRefresh = async () => {
    if (!selectedId) return;
    setRefreshing(true);
    try {
      const n = await iotNodeService.getById(selectedId);
      const s = await iotNodeService.getRouterStatus(selectedId);
      setNode(n);
      setStatus(s);
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Router / IoT status"
        subtitle="IoT nodes: connected clients and signal strength."
        action={
          <button type="button" className="btn btn-outline" onClick={manualRefresh} disabled={!selectedId || refreshing}>
            <RefreshCw size={16} style={{ marginRight: 6 }} />
            Refresh
          </button>
        }
      />

      <div className="card" style={{ padding: '1rem 1.25rem', marginBottom: '1rem' }}>
        <label className="form-label" style={{ marginBottom: '0.5rem' }}>
          IoT node (room)
        </label>
        {loading ? (
          <p style={{ color: 'var(--text-secondary)' }}>Loading list…</p>
        ) : (
          <select
            className="form-input"
            style={{ maxWidth: '420px' }}
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}
          >
            {nodes.length === 0 ? (
              <option value="">No registered nodes</option>
            ) : (
              nodes.map((n) => (
                <option key={n.id} value={n.id}>
                  {n.hostname} — {n.hotspotSsid} ({n.status})
                </option>
              ))
            )}
          </select>
        )}
      </div>

      <RouterStatusPanel key={selectedId} node={node} status={status} loading={refreshing && !node} />
    </div>
  );
}
