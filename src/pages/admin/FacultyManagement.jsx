import { useState, useEffect } from 'react';
import { UserCheck, Shield, Clock, Search, Filter, CheckCircle, XCircle, List, Users } from 'lucide-react';
import api from '../../utils/api';
import toast from 'react-hot-toast';

const FacultyManagement = () => {
    const [pendingFaculty, setPendingFaculty] = useState([]);
    const [allFaculty, setAllFaculty] = useState([]);
    const [activeTab, setActiveTab] = useState('pending'); // 'pending' or 'directory'
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedFacultyStats, setSelectedFacultyStats] = useState(null);
    const [statsLoading, setStatsLoading] = useState(false);

    const fetchPendingFaculty = async () => {
        try {
            setLoading(true);
            const response = await api.get('/auth/faculty/pending');
            setPendingFaculty(response.data);
        } catch (error) {
            console.error('Error fetching pending faculty:', error);
            toast.error('Failed to load pending faculty requests');
        } finally {
            setLoading(false);
        }
    };

    const fetchAllFaculty = async () => {
        try {
            setLoading(true);
            const response = await api.get('/auth/faculty/all');
            setAllFaculty(response.data);
        } catch (error) {
            console.error('Error fetching all faculty:', error);
            toast.error('Failed to load faculty directory');
        } finally {
            setLoading(false);
        }
    };

    const fetchFacultyStats = async (id) => {
        try {
            setStatsLoading(true);
            const response = await api.get(`/auth/faculty/${id}/stats`);
            setSelectedFacultyStats(response.data);
        } catch (error) {
            console.error('Error fetching faculty stats:', error);
            toast.error('Failed to load faculty statistics');
        } finally {
            setStatsLoading(false);
        }
    };

    useEffect(() => {
        if (activeTab === 'pending') fetchPendingFaculty();
        else fetchAllFaculty();
    }, [activeTab]);

    const handleApprove = async (id, name) => {
        try {
            const response = await api.post(`/auth/faculty/approve/${id}`);
            toast.success(response.data.message || `${name} approved successfully`);
            // Refresh both lists to ensure accurate UI state across tabs
            fetchPendingFaculty();
            fetchAllFaculty();
        } catch (error) {
            console.error('Error approving faculty:', error);
            toast.error('Approval failed');
        }
    };

    const displayFaculty = activeTab === 'pending' ? pendingFaculty : allFaculty;
    
    const filteredFaculty = displayFaculty.filter(f => 
        (f.name?.toLowerCase().includes(searchQuery.toLowerCase())) || 
        (f.email?.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (f.studentId?.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    return (
        <div style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
                        Faculty Management
                    </h2>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                        {activeTab === 'pending' ? 'Review and authorize new faculty requests' : 'Monitor faculty performance and event history'}
                    </p>
                </div>
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border)' }}>
                <button 
                    onClick={() => setActiveTab('pending')}
                    style={{
                        padding: '0.75rem 1rem',
                        background: 'none',
                        border: 'none',
                        borderBottom: activeTab === 'pending' ? '3px solid #4f46e5' : '3px solid transparent',
                        color: activeTab === 'pending' ? '#4f46e5' : 'var(--text-muted)',
                        fontWeight: 700,
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                    }}
                >
                    <Clock size={18} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
                    Pending Requests ({pendingFaculty.length})
                </button>
                <button 
                    onClick={() => setActiveTab('directory')}
                    style={{
                        padding: '0.75rem 1rem',
                        background: 'none',
                        border: 'none',
                        borderBottom: activeTab === 'directory' ? '3px solid #4f46e5' : '3px solid transparent',
                        color: activeTab === 'directory' ? '#4f46e5' : 'var(--text-muted)',
                        fontWeight: 700,
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                    }}
                >
                    <List size={18} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
                    Faculty Directory
                </button>
            </div>

            <div className="card" style={{ padding: '1.5rem', background: 'var(--bg-card)', borderRadius: '16px', border: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
                    <div style={{ position: 'relative', flex: 1 }}>
                        <Search style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} size={18} />
                        <input 
                            type="text" 
                            placeholder={activeTab === 'pending' ? "Search requests..." : "Search faculty directory..."}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '0.75rem 1rem 0.75rem 2.5rem',
                                background: 'var(--bg-primary)',
                                border: '1.5px solid var(--border)',
                                borderRadius: '10px',
                                color: 'var(--text-primary)',
                                fontSize: '0.9rem'
                            }}
                        />
                    </div>
                </div>

                {loading ? (
                    <div style={{ padding: '3rem', textAlign: 'center' }}>
                        <div className="spinner dark" style={{ margin: '0 auto 1rem' }}></div>
                        <p style={{ color: 'var(--text-secondary)' }}>Loading faculty data...</p>
                    </div>
                ) : filteredFaculty.length === 0 ? (
                    <div style={{ padding: '4rem 2rem', textAlign: 'center', background: 'var(--bg-primary)', borderRadius: '12px', border: '1px dashed var(--border)' }}>
                        <div style={{ width: 64, height: 64, background: 'var(--bg-card)', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem', border: '1px solid var(--border)' }}>
                            {activeTab === 'pending' ? <Clock size={32} color="#94a3b8" /> : <Users size={32} color="#94a3b8" />}
                        </div>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>No {activeTab === 'pending' ? 'pending requests' : 'authorized faculty found'}</h3>
                        <p style={{ color: 'var(--text-secondary)', maxWidth: '280px', margin: '0.5rem auto 0' }}>
                            {activeTab === 'pending' ? 'All recently registered faculty members have been authorized.' : 'Try a different search term or check back later.'}
                        </p>
                    </div>
                ) : (
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--border)' }}>
                                    <th style={{ padding: '1rem', color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.85rem' }}>NAME & ID</th>
                                    <th style={{ padding: '1rem', color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.85rem' }}>EMAIL ADDRESS</th>
                                    <th style={{ padding: '1rem', color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.85rem' }}>STATUS</th>
                                    <th style={{ padding: '1rem', color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.85rem', textAlign: 'right' }}>ACTION</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredFaculty.map(f => (
                                    <tr key={f.id} style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.2s' }} className="table-row">
                                        <td style={{ padding: '1rem' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                <div style={{ width: 36, height: 36, background: 'linear-gradient(135deg, #4f46e5, #0ea5e9)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, fontSize: '0.9rem' }}>
                                                    {f.name.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <button 
                                                        onClick={() => activeTab === 'directory' && fetchFacultyStats(f.id)}
                                                        style={{ 
                                                            display: 'block',
                                                            background: 'none', 
                                                            border: 'none', 
                                                            padding: 0, 
                                                            fontWeight: 700, 
                                                            color: activeTab === 'directory' ? '#4f46e5' : 'var(--text-primary)',
                                                            cursor: activeTab === 'directory' ? 'pointer' : 'default',
                                                            textDecoration: activeTab === 'directory' ? 'underline' : 'none'
                                                        }}
                                                    >
                                                        {f.name}
                                                    </button>
                                                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>ID: {f.studentId || 'N/A'}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td style={{ padding: '1rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{f.email}</td>
                                        <td style={{ padding: '1rem' }}>
                                            <span style={{ 
                                                display: 'inline-flex', 
                                                alignItems: 'center', 
                                                gap: '6px', 
                                                padding: '4px 10px', 
                                                background: (f.isApproved || f.approved) ? '#d1fae5' : '#fef3c7', 
                                                color: (f.isApproved || f.approved) ? '#059669' : '#d97706', 
                                                borderRadius: '20px', 
                                                fontSize: '0.75rem', 
                                                fontWeight: 700 
                                            }}>
                                                <div style={{ width: 6, height: 6, borderRadius: '50%', background: (f.isApproved || f.approved) ? '#059669' : '#d97706' }}></div>
                                                {(f.isApproved || f.approved) ? 'Authorized' : 'Pending Review'}
                                            </span>
                                        </td>
                                        <td style={{ padding: '1rem', textAlign: 'right' }}>
                                            {(f.isApproved || f.approved) ? (
                                                <button 
                                                    onClick={() => fetchFacultyStats(f.id)}
                                                    style={{ background: 'var(--bg-primary)', color: '#4f46e5', border: '1.5px solid #4f46e5', padding: '6px 12px', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer' }}
                                                >
                                                    Performance Stats
                                                </button>
                                            ) : (
                                                <button 
                                                    onClick={() => handleApprove(f.id, f.name)}
                                                    style={{ background: '#10b981', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '8px', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '8px' }}
                                                    className="btn-approve"
                                                >
                                                    <CheckCircle size={16} /> Authorize Role
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Stats Modal */}
            {selectedFacultyStats && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '2rem' }}>
                    <div style={{ background: 'var(--bg-card)', width: '100%', maxWidth: '750px', borderRadius: '24px', boxShadow: 'var(--shadow-2xl)', border: '1px solid var(--border)', maxHeight: '90vh', overflowY: 'auto' }}>
                        <div style={{ padding: '2rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'center' }}>
                                <div style={{ width: 60, height: 60, background: 'linear-gradient(135deg, #4f46e5, #0ea5e9)', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, fontSize: '1.5rem' }}>
                                    {selectedFacultyStats.name.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <h3 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>{selectedFacultyStats.name}</h3>
                                    <p style={{ color: 'var(--text-secondary)', margin: '4px 0 0', fontSize: '0.95rem' }}>
                                        {selectedFacultyStats.email} • ID: {selectedFacultyStats.facultyId || 'N/A'}
                                    </p>
                                </div>
                            </div>
                            <button onClick={() => setSelectedFacultyStats(null)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '8px' }}>
                                <XCircle size={24} />
                            </button>
                        </div>
                        
                        <div style={{ padding: '2rem' }}>
                            <h4 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <List size={18} /> Created Events & Attendance Data
                            </h4>
                            {selectedFacultyStats.events.length === 0 ? (
                                <div style={{ padding: '3rem', textAlign: 'center', background: 'var(--bg-primary)', borderRadius: '12px', border: '1px dashed var(--border)' }}>
                                    <p style={{ color: 'var(--text-secondary)' }}>This faculty member hasn't created any events yet.</p>
                                </div>
                            ) : (
                                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                    <thead>
                                        <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--border)' }}>
                                            <th style={{ padding: '1rem 0.5rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>EVENT NAME</th>
                                            <th style={{ padding: '1rem 0.5rem', fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center' }}>TOTAL</th>
                                            <th style={{ padding: '1rem 0.5rem', fontSize: '0.8rem', color: 'green', textAlign: 'center' }}>PRESENT</th>
                                            <th style={{ padding: '1rem 0.5rem', fontSize: '0.8rem', color: 'red', textAlign: 'center' }}>ABSENT</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {selectedFacultyStats.events.map(ev => (
                                            <tr key={ev.id} style={{ borderBottom: '1px solid var(--border)' }}>
                                                <td style={{ padding: '1rem 0.5rem' }}>
                                                    <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{ev.name}</div>
                                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{new Date(ev.date).toLocaleDateString()}</div>
                                                </td>
                                                <td style={{ padding: '1rem 0.5rem', textAlign: 'center', fontWeight: 700 }}>{ev.totalStudents}</td>
                                                <td style={{ padding: '1rem 0.5rem', textAlign: 'center' }}>
                                                    <span style={{ color: '#059669', background: '#d1fae5', padding: '4px 8px', borderRadius: '6px', fontWeight: 700 }}>{ev.attendedCount}</span>
                                                </td>
                                                <td style={{ padding: '1rem 0.5rem', textAlign: 'center' }}>
                                                    <span style={{ color: '#dc2626', background: '#fee2e2', padding: '4px 8px', borderRadius: '6px', fontWeight: 700 }}>{ev.absentCount}</span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                        
                        <div style={{ padding: '1.5rem 2rem', background: 'var(--bg-primary)', borderBottomLeftRadius: '24px', borderBottomRightRadius: '24px', textAlign: 'right' }}>
                            <button onClick={() => setSelectedFacultyStats(null)} className="btn-approve" style={{ background: '#4f46e5', color: 'white', border: 'none', padding: '10px 24px', borderRadius: '12px', fontWeight: 700 }}>
                                Close Analysis
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                .table-row:hover { background: var(--bg-hover) !important; }
                .btn-approve:hover { transform: translateY(-1px); box-shadow: 0 4px 12px rgba(16, 185, 129, 0.25); }
                .btn-approve:active { transform: translateY(0); }
            `}</style>
        </div>
    );
};

export default FacultyManagement;
