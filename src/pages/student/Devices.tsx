import { useEffect, useState } from 'react';
import { PageHeader } from '../../components';
import { DeviceManagementTable } from '../../components/iot/DeviceManagementTable';
import { deviceService } from '../../services/deviceService';
import { useAuth } from '../../store/AuthContext';
import type { StudentDevice } from '../../types';

export function StudentDevicesPage() {
  const { user } = useAuth();
  const [devices, setDevices] = useState<StudentDevice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    if (!user) return;
    setLoading(true);
    try {
      setDevices(await deviceService.getByStudent(user.id));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [user?.id]);

  const handleDelete = async (device: StudentDevice) => {
    const ok = window.confirm('Remove this device?');
    if (!ok) return;

    try {
      await deviceService.delete(device.id);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong');
    }
  };

  if (!user) return null;

  return (
    <div>
      <PageHeader
        title="My devices"
        subtitle="View devices linked to your account."
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
          <DeviceManagementTable devices={devices} showStudentColumn={false} onDelete={handleDelete} />
        )}
      </div>
    </div>
  );
}
