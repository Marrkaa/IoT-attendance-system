/**
 * Admin auditorijos: duomenys iš roomService → /api/rooms.
 * „Online“ rodomas pagal prijungtą IoT mazgą (room.ioTNode), ne pagal mock atsitiktinumą.
 */
import { useCallback, useEffect, useState } from 'react';
import { Plus, Wifi, WifiOff, Edit2, Trash2 } from 'lucide-react';
import { roomService } from '../../services/roomService';
import { PageHeader, Modal, ConfirmDialog } from '../../components';
import type { Room } from '../../types';

export const RoomsPage = () => {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editRoom, setEditRoom] = useState<Room | null>(null);
  const [form, setForm] = useState({ name: '', location: '', capacity: 30 });
  const [deleteTarget, setDeleteTarget] = useState<Room | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setRooms(await roomService.getAll());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load rooms');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const openCreate = () => {
    setEditRoom(null);
    setForm({ name: '', location: '', capacity: 30 });
    setModalOpen(true);
  };

  const openEdit = (room: Room) => {
    setEditRoom(room);
    setForm({ name: room.name, location: room.location, capacity: room.capacity });
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.location.trim()) return;
    setSaving(true);
    setError(null);
    try {
      if (editRoom) {
        await roomService.update(editRoom.id, {
          name: form.name,
          location: form.location,
          capacity: form.capacity,
        });
      } else {
        await roomService.create({
          name: form.name,
          location: form.location,
          capacity: form.capacity,
        });
      }
      setModalOpen(false);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    setError(null);
    try {
      await roomService.delete(deleteTarget.id);
      setDeleteTarget(null);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Delete failed');
    } finally {
      setDeleting(false);
    }
  };

  const isOnline = (room: Room) => room.ioTNode?.status === 'Online';

  return (
    <div>
      <PageHeader
        title="Room Management"
        subtitle="Rooms stored in the database. Assign IoT nodes separately (Router status / IoT admin)."
        action={
          <button type="button" className="btn btn-primary" onClick={openCreate}>
            <Plus size={16} /> Add Room
          </button>
        }
      />

      {error && (
        <div className="badge badge-danger" style={{ display: 'block', marginBottom: '1rem', padding: '0.75rem' }}>
          {error}
        </div>
      )}

      {loading ? (
        <p style={{ color: 'var(--text-secondary)' }}>Loading rooms…</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {rooms.map((room) => (
            <div className="card" key={room.id}>
              <div className="card-header">
                <h3 className="card-title">{room.name}</h3>
                <span
                  className={`badge ${isOnline(room) ? 'badge-success' : 'badge-danger'}`}
                  style={{ padding: '0.35rem 0.75rem' }}
                >
                  {isOnline(room) ? <Wifi size={12} style={{ marginRight: '0.25rem' }} /> : <WifiOff size={12} style={{ marginRight: '0.25rem' }} />}
                  {isOnline(room) ? 'Online' : 'Offline'}
                </span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '0.5rem' }}>
                <div>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Location</p>
                  <p style={{ fontWeight: 500, fontSize: '0.875rem' }}>{room.location}</p>
                </div>
                <div>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Capacity</p>
                  <p style={{ fontWeight: 500, fontSize: '0.875rem' }}>{room.capacity} seats</p>
                </div>
                <div>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>IoT node</p>
                  <p style={{ fontWeight: 500, fontSize: '0.875rem', fontFamily: 'monospace' }}>
                    {room.ioTNode?.hostname ?? '—'}
                  </p>
                </div>
                <div>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Hotspot SSID</p>
                  <p style={{ fontWeight: 500, fontSize: '0.875rem' }}>{room.ioTNode?.hotspotSsid ?? '—'}</p>
                </div>
              </div>
              <div style={{ marginTop: '1.25rem', display: 'flex', gap: '0.5rem' }}>
                <button type="button" className="btn btn-outline" style={{ fontSize: '0.75rem', flex: 1 }} onClick={() => openEdit(room)}>
                  <Edit2 size={12} /> Edit
                </button>
                <button
                  type="button"
                  className="btn btn-outline"
                  style={{ fontSize: '0.75rem', flex: 1, color: 'var(--danger)' }}
                  onClick={() => setDeleteTarget(room)}
                >
                  <Trash2 size={12} /> Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editRoom ? 'Edit Room' : 'Add Room'}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Room Name</label>
            <input
              className="form-input"
              placeholder="e.g. Room A-101"
              value={form.name}
              onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
            />
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Location</label>
            <input
              className="form-input"
              placeholder="e.g. Building A, Floor 1"
              value={form.location}
              onChange={(e) => setForm((prev) => ({ ...prev, location: e.target.value }))}
            />
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Capacity</label>
            <input
              type="number"
              className="form-input"
              value={form.capacity}
              onChange={(e) => setForm((prev) => ({ ...prev, capacity: parseInt(e.target.value, 10) || 0 }))}
            />
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
            <button type="button" className="btn btn-outline" onClick={() => setModalOpen(false)} disabled={saving}>
              Cancel
            </button>
            <button type="button" className="btn btn-primary" onClick={() => void handleSave()} disabled={saving}>
              {saving ? 'Saving…' : editRoom ? 'Save Changes' : 'Create Room'}
            </button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={deleteTarget !== null}
        onClose={() => !deleting && setDeleteTarget(null)}
        onConfirm={() => void handleConfirmDelete()}
        title="Delete Room"
        message={`Delete "${deleteTarget?.name}"? Lectures using this room may block deletion.`}
        loading={deleting}
      />
    </div>
  );
};
