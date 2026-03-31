import { useEffect, useState } from 'react';
import { PageHeader } from '../../components';
import { RadiusInfoCard } from '../../components/iot/RadiusInfoCard';
import { radiusService, type RadiusAccountView } from '../../services/radiusService';

export function RadiusConfigPage() {
  const [accounts, setAccounts] = useState<RadiusAccountView[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      setAccounts(await radiusService.listAccountsWithUsers());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Klaida');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const toggle = async (a: RadiusAccountView) => {
    try {
      await radiusService.setEnabled(a.userId, !a.isEnabled);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Klaida');
    }
  };

  return (
    <div>
      <PageHeader
        title="RADIUS konfigūracija"
        subtitle="Hotspot autentifikacija ir studentų paskyrų valdymas (suderinama su FreeRADIUS + backend API)."
      />

      <RadiusInfoCard />

      {error && (
        <div className="card" style={{ padding: '0.75rem 1rem', marginBottom: '1rem', borderLeft: '4px solid #DC2626', background: '#FEF2F2' }}>
          {error}
        </div>
      )}

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--border)', fontWeight: 600 }}>
          RADIUS paskyros (studentai)
        </div>
        {loading ? (
          <div style={{ padding: '1.5rem', color: 'var(--text-secondary)' }}>Kraunama…</div>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Naudotojas</th>
                  <th>El. paštas (RADIUS vardas)</th>
                  <th>Būsena</th>
                  <th>Sukurta</th>
                  <th>Veiksmai</th>
                </tr>
              </thead>
              <tbody>
                {accounts.map((a) => (
                  <tr key={a.id}>
                    <td>{a.userName ?? '—'}</td>
                    <td style={{ fontSize: '0.875rem' }}>{a.radiusUsername}</td>
                    <td>
                      <span className={`badge ${a.isEnabled ? 'badge-success' : ''}`} style={a.isEnabled ? undefined : { background: '#F3F4F6', color: '#6B7280' }}>
                        {a.isEnabled ? 'Įjungta' : 'Išjungta'}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                      {new Date(a.createdAt).toLocaleDateString('lt-LT')}
                    </td>
                    <td>
                      <button type="button" className="btn btn-outline" style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }} onClick={() => toggle(a)}>
                        {a.isEnabled ? 'Išjungti hotspot' : 'Įjungti hotspot'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
