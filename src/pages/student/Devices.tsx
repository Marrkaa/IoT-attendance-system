import { useEffect, useState } from 'react';
import { Smartphone } from 'lucide-react';
import { PageHeader, Modal } from '../../components';
import { DeviceManagementTable } from '../../components/iot/DeviceManagementTable';
import { deviceService } from '../../services/deviceService';
import { useAuth } from '../../store/AuthContext';
import type { StudentDevice } from '../../types';

export function StudentDevicesPage() {
  const { user } = useAuth();
  const [devices, setDevices] = useState<StudentDevice[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ macAddress: '', deviceName: '' });
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    if (!user) return;
    setLoading(true);
    try {
      setDevices(await deviceService.getByStudent(user.id));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Klaida');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [user?.id]);

  const handleRegister = async () => {
    if (!user || !form.macAddress.trim()) return;
    try {
      await deviceService.register({
        studentId: user.id,
        macAddress: form.macAddress,
        deviceName: form.deviceName || undefined,
      });
      setModalOpen(false);
      setForm({ macAddress: '', deviceName: '' });
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Klaida');
    }
  };

  if (!user) return null;

  return (
    <div>
      <PageHeader
        title="Mano įrenginiai"
        subtitle="Užregistruokite savo telefono MAC adresą — sistema sies jį su Wi-Fi signalu auditorijoje (Teltonika / station dump)."
        action={
          <button type="button" className="btn btn-primary" onClick={() => setModalOpen(true)}>
            <Smartphone size={16} /> Pridėti įrenginį
          </button>
        }
      />

      {error && (
        <div className="card" style={{ padding: '0.75rem 1rem', marginBottom: '1rem', borderLeft: '4px solid #DC2626', background: '#FEF2F2' }}>
          {error}
        </div>
      )}

      <div className="card" style={{ padding: '1.25rem' }}>
        {loading ? (
          <p style={{ color: 'var(--text-secondary)' }}>Kraunama…</p>
        ) : (
          <DeviceManagementTable devices={devices} showStudentColumn={false} />
        )}
      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Registruoti mobilųjį įrenginį">
        <div className="form-group">
          <label className="form-label">Wi‑Fi MAC adresas</label>
          <input
            className="form-input"
            placeholder="Pvz. AA:BB:CC:DD:EE:FF"
            value={form.macAddress}
            onChange={(e) => setForm((f) => ({ ...f, macAddress: e.target.value }))}
          />
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
            Raskite nustatymuose: Wi‑Fi → išsami informacija / apie telefoną (priklausomai nuo OS).
          </p>
        </div>
        <div className="form-group">
          <label className="form-label">Pavadinimas (nebūtina)</label>
          <input
            className="form-input"
            value={form.deviceName}
            onChange={(e) => setForm((f) => ({ ...f, deviceName: e.target.value }))}
          />
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
          <button type="button" className="btn btn-outline" onClick={() => setModalOpen(false)}>
            Atšaukti
          </button>
          <button type="button" className="btn btn-primary" onClick={handleRegister}>
            Registruoti
          </button>
        </div>
      </Modal>
    </div>
  );
}
