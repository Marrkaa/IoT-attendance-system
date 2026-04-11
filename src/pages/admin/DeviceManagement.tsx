import { useEffect, useState } from 'react';
import { Smartphone } from 'lucide-react';
import { PageHeader, Modal } from '../../components';
import { DeviceManagementTable } from '../../components/iot/DeviceManagementTable';
import { deviceService } from '../../services/deviceService';
import { mockUsers } from '../../mock-data/data';
import type { StudentDevice } from '../../types';

export function DeviceManagementPage() {
  const [devices, setDevices] = useState<StudentDevice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ studentId: '', macAddress: '', deviceName: '' });

  const students = mockUsers.filter((u) => u.role === 'Student');

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      setDevices(await deviceService.getAll());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleAdd = async () => {
    if (!form.studentId || !form.macAddress.trim()) return;
    try {
      await deviceService.register({
        studentId: form.studentId,
        macAddress: form.macAddress,
        deviceName: form.deviceName || undefined,
      });
      setModalOpen(false);
      setForm({ studentId: '', macAddress: '', deviceName: '' });
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong');
    }
  };

  const handleToggle = async (d: StudentDevice) => {
    try {
      await deviceService.update(d.id, { isActive: !d.isActive });
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong');
    }
  };

  const handleDelete = async (d: StudentDevice) => {
    if (!confirm(`Remove device ${d.macAddress}?`)) return;
    try {
      await deviceService.delete(d.id);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong');
    }
  };

  return (
    <div>
      <PageHeader
        title="Student devices (MAC)"
        subtitle="Maps devices to Wi‑Fi signal and attendance logic. Teltonika station dump identifies clients by MAC."
        action={
          <button type="button" className="btn btn-primary" onClick={() => setModalOpen(true)}>
            <Smartphone size={16} /> Register device
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
          <p style={{ color: 'var(--text-secondary)' }}>Loading…</p>
        ) : (
          <DeviceManagementTable
            devices={devices}
            showStudentColumn
            onToggleActive={handleToggle}
            onDelete={handleDelete}
          />
        )}
      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="New student device">
        <div className="form-group">
          <label className="form-label">Student</label>
          <select
            className="form-input"
            value={form.studentId}
            onChange={(e) => setForm((f) => ({ ...f, studentId: e.target.value }))}
          >
            <option value="">— select —</option>
            {students.map((s) => (
              <option key={s.id} value={s.id}>
                {s.firstName} {s.lastName} ({s.email})
              </option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">MAC address</label>
          <input
            className="form-input"
            placeholder="AA:BB:CC:DD:EE:FF"
            value={form.macAddress}
            onChange={(e) => setForm((f) => ({ ...f, macAddress: e.target.value }))}
          />
        </div>
        <div className="form-group">
          <label className="form-label">Device name (optional)</label>
          <input
            className="form-input"
            value={form.deviceName}
            onChange={(e) => setForm((f) => ({ ...f, deviceName: e.target.value }))}
          />
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
          <button type="button" className="btn btn-outline" onClick={() => setModalOpen(false)}>
            Cancel
          </button>
          <button type="button" className="btn btn-primary" onClick={handleAdd}>
            Save
          </button>
        </div>
      </Modal>
    </div>
  );
}
