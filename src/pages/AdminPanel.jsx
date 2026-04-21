import React, { useState, useEffect } from 'react';
import { adminAPI } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import './Login.css'; 

const AdminPanel = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [users, setUsers] = useState([]);
    const [stats, setStats] = useState({ total: 0, verified: 0, pending: 0, totalPoints: 0, claimedRewards: 0 });
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('');
    const [error, setError] = useState(null);

    // Identity check - Strictly restricted to authorized super admin
    const isAuthorized = (user?.username?.toLowerCase() === 'gokul19' || user?.role === 'admin') && 
                          user?.email?.toLowerCase() === 'gokul68799@gmail.com';

    useEffect(() => {
        if (!loading && !isAuthorized) {
            navigate('/');
        }
    }, [isAuthorized, loading, navigate]);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            setError(null);
            
            // Using centralized adminAPI for consistent token handling & proxy support
            const response = await adminAPI.getUsers();
            
            // Centralized API instance (api.js) returns data directly due to interceptor
            setUsers(response.users || []);
            setStats(response.stats || { total: 0, verified: 0, pending: 0, totalPoints: 0, claimedRewards: 0 });
        } catch (err) {
            console.error('Error fetching admin data:', err);
            
            if (err.status === 403) {
                setError('Access Denied. Your session may be stale. Please Logout and Login again to refresh your permissions.');
            } else {
                setError(err.message || 'Failed to connect to the database. Please check your connection.');
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isAuthorized) {
            fetchUsers();
        } else {
            setLoading(false);
        }
    }, [isAuthorized]);

    const handleToggleVerify = async (userId, currentStatus) => {
        try {
            if (currentStatus) {
                await adminAPI.revokeUser(userId);
            } else {
                await adminAPI.verifyUser(userId);
            }
            fetchUsers(); 
        } catch (error) {
            alert('Error updating user status');
        }
    };

    const handleDeleteUser = async (userId, username) => {
        if (!window.confirm(`Are you sure you want to PERMANENTLY delete ${username}? This cannot be undone.`)) return;
        try {
            // Reusing axios instance for specific delete if not in adminAPI
            const { default: api } = await import('../utils/api');
            await api.delete(`/auth/admin/user/${userId}`);
            fetchUsers();
        } catch (error) {
            alert('Error deleting user');
        }
    };

    const handleUpdatePoints = async (userId, currentPoints) => {
        const newPoints = window.prompt(`Update points balance:`, currentPoints);
        if (newPoints === null || newPoints === "" || isNaN(newPoints)) return;
        
        try {
            const { default: api } = await import('../utils/api');
            await api.put(`/auth/admin/user/${userId}/points`, { points: parseInt(newPoints) });
            fetchUsers();
        } catch (error) {
            alert('Error updating points');
        }
    };

    const filteredUsers = users.filter(u =>
        u.username.toLowerCase().includes(filter.toLowerCase()) ||
        u.email.toLowerCase().includes(filter.toLowerCase())
    );

    if (!isAuthorized && !loading) {
        return (
            <div className="container" style={{ textAlign: 'center', padding: '5rem' }}>
                <h1 style={{ fontSize: '4rem' }}>🚫</h1>
                <h2>Access Denied</h2>
                <p>You do not have permission to view this page.</p>
                <button className="btn btn-primary" onClick={() => navigate('/')}>Back to Home</button>
            </div>
        );
    }

    return (
        <div className="container" style={{ padding: '2rem 1rem' }}>
            <div className="admin-header" style={{ marginBottom: '2rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                    <div className="glass-card" style={{ padding: '0.8rem', borderRadius: '1rem', display: 'flex', background: 'var(--primary-gradient)' }}>
                        <span style={{ fontSize: '2rem' }}>🛡️</span>
                    </div>
                    <div style={{ flex: 1 }}>
                        <h1 style={{ margin: 0, fontSize: '2.2rem', fontWeight: 800 }}>Admin Control</h1>
                        <p style={{ color: 'var(--text-secondary)', margin: 0 }}>Manage users, verification, and system balance</p>
                    </div>
                    <div className="form-group" style={{ margin: 0, minWidth: '320px' }}>
                        <div style={{ position: 'relative' }}>
                            <input
                                type="text"
                                className="form-input"
                                style={{ paddingLeft: '2.8rem', borderRadius: '12px', border: '1px solid var(--glass-border)' }}
                                placeholder="Search by name or email..."
                                value={filter}
                                onChange={(e) => setFilter(e.target.value)}
                            />
                            <span style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', opacity: 0.6, fontSize: '1.2rem' }}>🔍</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Stats Overview */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
                {[
                    { label: 'Total Users', value: stats.total, color: 'var(--primary)', icon: '👥' },
                    { label: 'Verified', value: stats.verified, color: 'var(--success)', icon: '✅' },
                    { label: 'Pending', value: stats.pending, color: 'var(--warning)', icon: '⏳' },
                    { label: 'System Points', value: stats.totalPoints, color: '#f59e0b', icon: '🪙' },
                    { label: 'Claimed Rewards', value: stats.claimedRewards, color: '#ec4899', icon: '🎁' }
                ].map((stat, i) => (
                    <div key={i} className="glass-card fade-in" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1.2rem', animationDelay: `${i * 0.1}s` }}>
                        <div style={{ fontSize: '2.2rem', opacity: 0.9 }}>{stat.icon}</div>
                        <div>
                            <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#fff' }}>{stat.value}</div>
                            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{stat.label}</div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="glass-card" style={{ padding: '0', overflow: 'hidden', border: '1px solid var(--glass-border)' }}>
                {loading ? (
                    <div style={{ textAlign: 'center', padding: '5rem' }}>
                        <div className="spinner" style={{ margin: '0 auto', width: '40px', height: '40px' }}></div>
                        <p style={{ marginTop: '1.5rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Establishing secure connection to database...</p>
                    </div>
                ) : error ? (
                    <div style={{ textAlign: 'center', padding: '5rem', background: 'rgba(244, 63, 94, 0.05)' }}>
                        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⚠️</div>
                        <h3 style={{ color: '#fff', marginBottom: '0.5rem' }}>Connection Interrupted</h3>
                        <p style={{ color: 'var(--text-secondary)', maxWidth: '500px', margin: '0 auto 2rem' }}>{error}</p>
                        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                            <button className="btn btn-primary" onClick={fetchUsers}>Try Again</button>
                            {error.includes('Logout') && (
                                <button className="btn btn-secondary" onClick={() => { logout(); navigate('/login'); }}>Logout Now</button>
                            )}
                        </div>
                    </div>
                ) : (
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '1000px' }}>
                            <thead>
                                <tr style={{ background: 'rgba(255,255,255,0.02)', textAlign: 'left', borderBottom: '1px solid var(--glass-border)' }}>
                                    <th style={{ padding: '1.5rem', color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 700, letterSpacing: '1px' }}>USER IDENTITY</th>
                                    <th style={{ padding: '1.5rem', color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 700, letterSpacing: '1px' }}>EMAIL ADDRESS</th>
                                    <th style={{ padding: '1.5rem', color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 700, letterSpacing: '1px' }}>LOYALTY BALANCE</th>
                                    <th style={{ padding: '1.5rem', color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 700, letterSpacing: '1px' }}>ACTIVITY</th>
                                    <th style={{ padding: '1.5rem', color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 700, letterSpacing: '1px' }}>VERIFICATION</th>
                                    <th style={{ padding: '1.5rem', color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 700, letterSpacing: '1px', textAlign: 'right' }}>OPERATIONS</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredUsers.map((userItem, idx) => (
                                    <tr key={userItem.id} className="fade-in" style={{ borderBottom: '1px solid var(--glass-border)', transition: 'background 0.2s', animationDelay: `${idx * 0.02}s` }}>
                                        <td style={{ padding: '1.5rem' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                                <div className="user-avatar" style={{ width: '42px', height: '42px', fontSize: '1rem', background: 'var(--primary-gradient)', border: '2px solid var(--glass-border)' }}>
                                                    {userItem.username.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <div style={{ fontWeight: 700, fontSize: '1rem', color: '#fff' }}>{userItem.username}</div>
                                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>ID: {userItem.id.toString().padStart(5, '0')} • Joined {new Date(userItem.created_at || userItem.createdAt).toLocaleDateString()}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td style={{ padding: '1.5rem' }}>
                                            <div style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>{userItem.email}</div>
                                            {userItem.role === 'admin' && <span style={{ fontSize: '0.7rem', background: 'var(--primary)', color: '#fff', padding: '1px 6px', borderRadius: '4px', marginTop: '4px', display: 'inline-block' }}>PLATFORM ADMIN</span>}
                                        </td>
                                        <td style={{ padding: '1.5rem' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: '#f59e0b', fontWeight: 800, fontSize: '1.1rem' }}>
                                                🪙 {userItem.points || 0}
                                                <button 
                                                    className="icon-control-btn"
                                                    style={{ width: '28px', height: '28px', fontSize: '0.8rem' }}
                                                    onClick={() => handleUpdatePoints(userItem.id, userItem.points || 0)}
                                                    title="Adjust balance"
                                                >✏️</button>
                                            </div>
                                        </td>
                                        <td style={{ padding: '1.5rem' }}>
                                            <div style={{ fontSize: '0.95rem', fontWeight: 500 }}>📝 {userItem.reviewCount || 0} Reviews</div>
                                        </td>
                                        <td style={{ padding: '1.5rem' }}>
                                            {userItem.emailVerified ? (
                                                <div style={{ color: 'var(--success)', fontSize: '0.9rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                    <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--success)', boxShadow: '0 0 8px var(--success)' }}></span>
                                                    ACTIVE
                                                </div>
                                            ) : (
                                                <div style={{ color: 'var(--warning)', fontSize: '0.9rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                    <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--warning)', boxShadow: '0 0 8px var(--warning)' }}></span>
                                                    PENDING
                                                </div>
                                            )}
                                        </td>
                                        <td style={{ padding: '1.5rem', textAlign: 'right' }}>
                                            <div style={{ display: 'flex', gap: '0.8rem', justifyContent: 'flex-end' }}>
                                                <button
                                                    className={`btn ${userItem.emailVerified ? 'btn-secondary' : 'btn-primary'} btn-sm`}
                                                    style={{ minWidth: '90px' }}
                                                    onClick={() => handleToggleVerify(userItem.id, userItem.emailVerified)}
                                                >
                                                    {userItem.emailVerified ? 'Deactivate' : 'Activate'}
                                                </button>
                                                <button
                                                    className="btn btn-sm"
                                                    style={{ 
                                                        minWidth: '80px',
                                                        background: 'rgba(244, 63, 94, 0.1)', 
                                                        color: '#f43f5e',
                                                        border: '1px solid rgba(244, 63, 94, 0.2)'
                                                    }}
                                                    onClick={() => handleDeleteUser(userItem.id, userItem.username)}
                                                >
                                                    Delete
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {filteredUsers.length === 0 && (
                            <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
                                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔎</div>
                                <p>No users match "<strong>{filter}</strong>"</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminPanel;
