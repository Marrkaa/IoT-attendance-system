import { useState } from 'react';
import { Download, FileText, Calendar, Filter } from 'lucide-react';
import { PageHeader } from '../../components';
import { mockLectures } from '../../mock-data/data';

type ReportType = 'attendance_summary' | 'student_detail' | 'weekly_overview' | 'at_risk';

interface ReportConfig {
  type: ReportType;
  title: string;
  description: string;
  icon: typeof FileText;
}

const reportTypes: ReportConfig[] = [
  { type: 'attendance_summary', title: 'Attendance Summary', description: 'Overall attendance rates per lecture with present/late/absent breakdown.', icon: FileText },
  { type: 'student_detail', title: 'Student Detail Report', description: 'Individual student attendance records across all lectures.', icon: FileText },
  { type: 'weekly_overview', title: 'Weekly Overview', description: 'Day-by-day attendance trends for the selected week.', icon: Calendar },
  { type: 'at_risk', title: 'At-Risk Students', description: 'Students below the attendance threshold who need follow-up.', icon: Filter },
];

export const ReportsPage = () => {
  const [selectedReport, setSelectedReport] = useState<ReportType | null>(null);
  const [selectedLecture, setSelectedLecture] = useState('all');
  const [dateRange, setDateRange] = useState({ from: '2026-03-01', to: '2026-03-30' });
  const [generating, setGenerating] = useState(false);
  const [generated, setGenerated] = useState(false);

  const handleGenerate = async () => {
    setGenerating(true);
    setGenerated(false);
    await new Promise(resolve => setTimeout(resolve, 1500));
    setGenerating(false);
    setGenerated(true);
  };

  return (
    <div>
      <PageHeader
        title="Report Generation"
        subtitle="Generate and export attendance reports"
      />

      {/* Report type selection */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6" style={{ marginBottom: '1.5rem' }}>
        {reportTypes.map(report => {
          const Icon = report.icon;
          const isSelected = selectedReport === report.type;
          return (
            <div
              key={report.type}
              className="card"
              onClick={() => { setSelectedReport(report.type); setGenerated(false); }}
              style={{
                cursor: 'pointer',
                borderColor: isSelected ? 'var(--primary)' : 'var(--border)',
                borderWidth: isSelected ? '2px' : '1px',
                background: isSelected ? '#EEF2FF' : 'var(--bg-card)',
              }}
            >
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                <div style={{
                  padding: '0.75rem', borderRadius: '50%',
                  background: isSelected ? 'var(--primary)' : '#F3F4F6',
                  color: isSelected ? 'white' : 'var(--text-muted)',
                }}>
                  <Icon size={20} />
                </div>
                <div>
                  <h3 style={{ fontWeight: 600, fontSize: '0.95rem', marginBottom: '0.25rem' }}>{report.title}</h3>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{report.description}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Configuration */}
      {selectedReport && (
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <div className="card-header" style={{ borderBottom: '1px solid var(--border)', paddingBottom: '1rem', marginBottom: '1rem' }}>
            <h3 className="card-title">Report Configuration</h3>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', alignItems: 'end' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Lecture</label>
              <select className="form-input" value={selectedLecture} onChange={e => setSelectedLecture(e.target.value)}>
                <option value="all">All Lectures</option>
                {mockLectures.map(l => (
                  <option key={l.id} value={l.id}>{l.title}</option>
                ))}
              </select>
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">From</label>
              <input type="date" className="form-input" value={dateRange.from} onChange={e => setDateRange(prev => ({ ...prev, from: e.target.value }))} />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">To</label>
              <input type="date" className="form-input" value={dateRange.to} onChange={e => setDateRange(prev => ({ ...prev, to: e.target.value }))} />
            </div>
          </div>
          <div style={{ marginTop: '1.5rem', display: 'flex', gap: '0.75rem' }}>
            <button className="btn btn-primary" onClick={handleGenerate} disabled={generating}>
              {generating ? 'Generating...' : (<><FileText size={16} /> Generate Report</>)}
            </button>
            {generated && (
              <button className="btn btn-outline">
                <Download size={16} /> Download CSV
              </button>
            )}
          </div>
        </div>
      )}

      {/* Preview */}
      {generated && (
        <div className="card">
          <div className="card-header" style={{ borderBottom: '1px solid var(--border)', paddingBottom: '1rem', marginBottom: '1rem' }}>
            <h3 className="card-title">Report Preview</h3>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button className="btn btn-outline" style={{ fontSize: '0.75rem' }}><Download size={14} /> CSV</button>
              <button className="btn btn-outline" style={{ fontSize: '0.75rem' }}><Download size={14} /> PDF</button>
            </div>
          </div>
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Lecture</th>
                  <th>Total Sessions</th>
                  <th>Avg. Present</th>
                  <th>Avg. Late</th>
                  <th>Avg. Absent</th>
                  <th>Attendance Rate</th>
                </tr>
              </thead>
              <tbody>
                {mockLectures.slice(0, selectedLecture === 'all' ? undefined : 1).map(l => (
                  <tr key={l.id}>
                    <td style={{ fontWeight: 500 }}>{l.title}</td>
                    <td>24</td>
                    <td><span className="badge badge-success">18.5</span></td>
                    <td><span className="badge badge-warning">2.3</span></td>
                    <td><span className="badge badge-danger">3.2</span></td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div style={{ flex: 1, height: '6px', background: 'var(--border)', borderRadius: '3px', overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: '87%', background: 'var(--success)', borderRadius: '3px' }}></div>
                        </div>
                        <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>87%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
