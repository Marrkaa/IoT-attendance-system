import { Radio, Server, Shield } from 'lucide-react';

/** Statinė informacija administratoriui: kaip RADIUS jungiasi su Teltonika ir backend. */
export function RadiusInfoCard() {
  return (
    <div className="card" style={{ padding: '1.25rem', marginBottom: '1rem' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', marginBottom: '1rem' }}>
        <Radio size={22} style={{ flexShrink: 0 }} />
        <div>
          <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>RADIUS ir hotspot (RUTX11)</h3>
          <p style={{ margin: '0.5rem 0 0', fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            Teltonika maršrutizatoriuje įjungiamas Wi‑Fi hotspot su išoriniu RADIUS (pvz., FreeRADIUS). Autentifikacijos
            užklausos nukreipiamos į backend API endpointą <code style={{ fontSize: '0.8rem' }}>POST /api/radius/authenticate</code>,
            kuris tikrina naudotojo kredencialus prieš duomenų bazėje saugomą <strong>RadiusAccount</strong> įrašą.
          </p>
        </div>
      </div>
      <ul style={{ margin: 0, paddingLeft: '1.25rem', fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.7 }}>
        <li>
          <Server size={14} style={{ verticalAlign: 'middle', marginRight: 6 }} />
          Registracijos metu studentui kuriami web prisijungimo ir RADIUS slaptažodžio hash įrašai (prototipe — ta pati
          slaptažodžio politika; produkcijoje — atskiras hotspot slaptažodis).
        </li>
        <li style={{ marginTop: '0.5rem' }}>
          <Shield size={14} style={{ verticalAlign: 'middle', marginRight: 6 }} />
          Fizinio buvimo fiksavimui naudojamas atskiras <strong>station dump</strong> skriptas (cron), siunčiantis MAC,
          IP ir signalo stiprumą į <code style={{ fontSize: '0.8rem' }}>POST /api/iot-nodes/station-dump</code>.
        </li>
      </ul>
    </div>
  );
}
