import { Radio, Server, Shield } from 'lucide-react';

/** Static admin reference: how RADIUS connects Teltonika and the backend. */
export function RadiusInfoCard() {
  return (
    <div className="card" style={{ padding: '1.25rem', marginBottom: '1rem' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', marginBottom: '1rem' }}>
        <Radio size={22} style={{ flexShrink: 0 }} />
        <div>
          <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>RADIUS and hotspot (RUTX11)</h3>
          <p style={{ margin: '0.5rem 0 0', fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            On the Teltonika router, enable a Wi‑Fi hotspot with an external RADIUS server (e.g. FreeRADIUS). Point
            authentication to the backend <code style={{ fontSize: '0.8rem' }}>POST /api/radius/authenticate</code>, which
            validates credentials against the <strong>RadiusAccount</strong> row stored in the database.
          </p>
        </div>
      </div>
      <ul style={{ margin: 0, paddingLeft: '1.25rem', fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.7 }}>
        <li>
          <Server size={14} style={{ verticalAlign: 'middle', marginRight: 6 }} />
          On registration, the student gets web login credentials and a RADIUS password hash (prototype: same policy;
          production: use a dedicated hotspot password).
        </li>
        <li style={{ marginTop: '0.5rem' }}>
          <Shield size={14} style={{ verticalAlign: 'middle', marginRight: 6 }} />
          <strong>Accounting:</strong> <code style={{ fontSize: '0.8rem' }}>POST /api/radius/accounting</code> +{' '}
          <code style={{ fontSize: '0.8rem' }}>X-Api-Key</code> — fields: <code>User-Name</code>,{' '}
          <code>Calling-Station-Id</code>, <code>Acct-Status-Type</code> (Start/Stop/Interim), optionally{' '}
          <code>Acct-Unique-Session-Id</code>, <code>Acct-Session-Time</code>. This fills <strong>HotspotSession</strong> and
          live attendance without relying on station dump alone.
        </li>
        <li style={{ marginTop: '0.5rem' }}>
          <Shield size={14} style={{ verticalAlign: 'middle', marginRight: 6 }} />
          For physical presence telemetry, a <strong>station dump</strong> script (cron) sends MAC, IP, and signal to{' '}
          <code style={{ fontSize: '0.8rem' }}>POST /api/iot-nodes/station-dump</code>.
        </li>
      </ul>
    </div>
  );
}
