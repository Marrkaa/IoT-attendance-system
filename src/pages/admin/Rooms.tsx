import { useState } from 'react';
import { Plus, Wifi, WifiOff, Edit2, Trash2 } from 'lucide-react';
import { mockRooms } from '../../mock-data/data';
import { PageHeader, Modal } from '../../components';
import type { Room } from '../../types';

export const RoomsPage = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const [editRoom, setEditRoom] = useState<Room | null>(null);
  const [form, setForm] = useState({ name: '', location: '', capacity: 30, routerMac: '' });

  const openCreate = () => {
    setEditRoom(null);
    setForm({ name: '', location: '', capacity: 30, routerMac: '' });
    setModalOpen(true);
  };

  const openEdit = (room: Room) => {
    setEditRoom(room);
    setForm({ name: room.name, location: room.location, capacity: room.capacity, routerMac: room.routerMac || '' });
    setModalOpen(true);
  };

  const handleSave = () => {
    // In real app: call roomService.create or roomService.update
    setModalOpen(false);
  };

  return (
    <div>
      <PageHeader
        title="Room Management"
        subtitle="Configure rooms and IoT nodes"
        action={<button className="btn btn-primary" onClick={openCreate}><Plus size={16} /> Add Room</button>}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {mockRooms.map(room => (
          <div className="card" key={room.id}>
            <div className="card-header">
              <h3 className="card-title">{room.name}</h3>
              <span className={`badge ${room.isOnline ? 'badge-success' : 'badge-danger'}`} style={{ padding: '0.35rem 0.75rem' }}>
                {room.isOnline ? <Wifi size={12} style={{ marginRight: '0.25rem' }} /> : <WifiOff size={12} style={{ marginRight: '0.25rem' }} />}
                {room.isOnline ? 'Online' : 'Offline'}
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
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Router MAC</p>
                <p style={{ fontWeight: 500, fontSize: '0.875rem', fontFamily: 'monospace' }}>{room.routerMac || 'Not assigned'}</p>
              </div>
              <div>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Connected</p>
                <p style={{ fontWeight: 500, fontSize: '0.875rem', color: room.isOnline ? 'var(--success)' : 'var(--text-muted)' }}>
                  {room.isOnline ? `${Math.floor(Math.random() * 10) + 1} devices` : '0 devices'}
                </p>
              </div>
            </div>
            <div style={{ marginTop: '1.25rem', display: 'flex', gap: '0.5rem' }}>
              <button className="btn btn-outline" style={{ fontSize: '0.75rem', flex: 1 }} onClick={() => openEdit(room)}>
                <Edit2 size={12} /> Edit
              </button>
              <button className="btn btn-outline" style={{ fontSize: '0.75rem', flex: 1, color: 'var(--danger)' }}>
                <Trash2 size={12} /> Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add/Edit Room Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editRoom ? 'Edit Room' : 'Add Room'}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Room Name</label>
            <input className="form-input" placeholder="e.g. Room A-101" value={form.name} onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))} />
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Location</label>
            <input className="form-input" placeholder="e.g. Building A, Floor 1" value={form.location} onChange={e => setForm(prev => ({ ...prev, location: e.target.value }))} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Capacity</label>
              <input type="number" className="form-input" value={form.capacity} onChange={e => setForm(prev => ({ ...prev, capacity: parseInt(e.target.value) || 0 }))} />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Router MAC Address</label>
              <input className="form-input" placeholder="AA:BB:CC:DD:EE:FF" value={form.routerMac} onChange={e => setForm(prev => ({ ...prev, routerMac: e.target.value }))} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
            <button className="btn btn-outline" onClick={() => setModalOpen(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleSave}>{editRoom ? 'Save Changes' : 'Create Room'}</button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
