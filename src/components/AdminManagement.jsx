import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';
import {
  UserCheck,
  UserPlus,
  Search,
  Users,
  Edit2,
  Trash2,
  X,
  Phone,
  Mail,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';

export const AdminManagement = () => {
  const { showSuccess, showError } = useToast();

  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState(null);
  const [selectedAdminDetails, setSelectedAdminDetails] = useState(null);

  // Form
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    mobile: '',
    status: 'ACTIVE'
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchAdmins = async () => {
    setLoading(true);
    try {
      const params = {};
      if (searchTerm) params.search = searchTerm;

      const res = await api.getAdmins(params);
      if (res.success && res.data?.admins) {
        setAdmins(res.data.admins);
      }
    } catch (err) {
      showError(err.message || 'Failed to fetch Admins');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdmins();
  }, [searchTerm]);

  const handleCreateAdmin = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await api.createAdmin(formData);
      if (res.success) {
        showSuccess(`Admin "${res.data.admin.name}" created successfully!`);
        setShowAddModal(false);
        setFormData({ name: '', email: '', password: '', mobile: '', status: 'ACTIVE' });
        fetchAdmins();
      }
    } catch (err) {
      showError(err.message || 'Failed to create Admin');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateAdmin = async (e) => {
    e.preventDefault();
    if (!editingAdmin) return;

    setSubmitting(true);
    try {
      const payload = {
        name: formData.name,
        email: formData.email,
        mobile: formData.mobile,
        status: formData.status
      };
      if (formData.password) {
        payload.password = formData.password;
      }

      const res = await api.updateAdmin(editingAdmin._id, payload);
      if (res.success) {
        showSuccess('Admin account updated successfully');
        setShowEditModal(false);
        setEditingAdmin(null);
        fetchAdmins();
      }
    } catch (err) {
      showError(err.message || 'Failed to update Admin');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteAdmin = async (admin) => {
    if (!window.confirm(`Are you sure you want to delete Admin "${admin.name}"?`)) return;

    try {
      const res = await api.deleteAdmin(admin._id);
      if (res.success) {
        showSuccess('Admin deleted successfully');
        fetchAdmins();
      }
    } catch (err) {
      showError(err.message || 'Failed to delete Admin');
    }
  };

  const openEdit = (admin) => {
    setEditingAdmin(admin);
    setFormData({
      name: admin.name,
      email: admin.email,
      password: '',
      mobile: admin.mobile || '',
      status: admin.status
    });
    setShowEditModal(true);
  };

  const viewAssignedCustomers = async (adminId) => {
    try {
      const res = await api.getAdminById(adminId);
      if (res.success) {
        setSelectedAdminDetails(res.data.admin);
      }
    } catch (err) {
      showError(err.message || 'Failed to load Admin details');
    }
  };

  return (
    <div>
      {/* ENTERPRISE PANEL */}
      <div className="enterprise-panel">
        <div className="panel-banner-red">
          <h3>
            <UserCheck size={18} />
            <span>Delivery Admin & Route Staff Master</span>
          </h3>

          <button
            type="button"
            className="btn btn-xs btn-outline"
            style={{ background: '#fff', color: 'var(--primary-red)' }}
            onClick={() => {
              setFormData({ name: '', email: '', password: '', mobile: '', status: 'ACTIVE' });
              setShowAddModal(true);
            }}
          >
            <UserPlus size={14} />
            <span>+ Create New Admin</span>
          </button>
        </div>

        {/* Toolbar */}
        <div className="panel-toolbar">
          <div style={{ maxWidth: '380px', width: '100%' }}>
            <input
              type="text"
              className="form-control"
              placeholder="Search by Name, Email, or Phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            Loading delivery staff...
          </div>
        ) : admins.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            No admin accounts found.
          </div>
        ) : (
          <div className="table-responsive">
            <table className="enterprise-table">
              <thead>
                <tr>
                  <th>S.No.</th>
                  <th>Admin Name</th>
                  <th>Login Email</th>
                  <th>Mobile Phone</th>
                  <th>Assigned Route Customers</th>
                  <th>Account Status</th>
                  <th style={{ textAlign: 'right' }}>Process / Actions</th>
                </tr>
              </thead>
              <tbody>
                {admins.map((admin, idx) => (
                  <tr key={admin._id}>
                    <td style={{ fontWeight: 700, color: 'var(--text-muted)' }}>{idx + 1}</td>
                    <td style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-heading)' }}>
                      {admin.name}
                    </td>
                    <td>{admin.email}</td>
                    <td>{admin.mobile || '—'}</td>
                    <td>
                      <button
                        type="button"
                        className="btn btn-xs btn-outline"
                        onClick={() => viewAssignedCustomers(admin._id)}
                      >
                        <Users size={13} style={{ color: 'var(--primary-red)' }} />
                        <span><strong>{admin.assignedCustomerCount || 0} Customers</strong></span>
                      </button>
                    </td>
                    <td>
                      <span className={admin.status === 'ACTIVE' ? 'badge-status-green' : 'badge-status-red'}>
                        {admin.status}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '0.35rem' }}>
                        <button
                          type="button"
                          className="btn btn-xs btn-outline"
                          onClick={() => openEdit(admin)}
                          title="Edit Admin"
                        >
                          <Edit2 size={13} />
                          <span>Edit</span>
                        </button>

                        <button
                          type="button"
                          className="btn btn-xs btn-danger-outline"
                          onClick={() => handleDeleteAdmin(admin)}
                          title="Delete Admin"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>
                <UserPlus size={18} />
                <span>Create Admin Account</span>
              </h3>
              <button type="button" className="close-btn" onClick={() => setShowAddModal(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateAdmin}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '0.95rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.3rem' }}>
                    Full Name
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. Rajesh Kumar"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.3rem' }}>
                    Login Email Address
                  </label>
                  <input
                    type="email"
                    className="form-control"
                    placeholder="e.g. rajesh@dairy.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.3rem' }}>
                    Password
                  </label>
                  <input
                    type="password"
                    className="form-control"
                    placeholder="Min 6 chars"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.3rem' }}>
                    Phone Number
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. 9876543211"
                    value={formData.mobile}
                    onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setShowAddModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Creating...' : 'Create Admin'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && editingAdmin && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>
                <Edit2 size={18} />
                <span>Edit Admin Account</span>
              </h3>
              <button type="button" className="close-btn" onClick={() => setShowEditModal(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleUpdateAdmin}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '0.95rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.3rem' }}>
                    Full Name
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.3rem' }}>
                    Email
                  </label>
                  <input
                    type="email"
                    className="form-control"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.3rem' }}>
                    Change Password (Leave blank to keep unchanged)
                  </label>
                  <input
                    type="password"
                    className="form-control"
                    placeholder="New password..."
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.3rem' }}>
                    Phone
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    value={formData.mobile}
                    onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.3rem' }}>
                    Status
                  </label>
                  <select
                    className="form-control"
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  >
                    <option value="ACTIVE">Active</option>
                    <option value="INACTIVE">Suspended</option>
                  </select>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setShowEditModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Saving...' : 'Update Admin'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Admin Assigned Customers Details Modal */}
      {selectedAdminDetails && (
        <div className="modal-overlay">
          <div className="modal-content modal-lg">
            <div className="modal-header">
              <h3>
                <Users size={18} />
                <span>Customers Assigned to Route: {selectedAdminDetails.name}</span>
              </h3>
              <button type="button" className="close-btn" onClick={() => setSelectedAdminDetails(null)}>
                <X size={18} />
              </button>
            </div>

            <div className="modal-body">
              {selectedAdminDetails.assignedCustomers?.length === 0 ? (
                <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                  No customers assigned to this admin yet.
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="enterprise-table">
                    <thead>
                      <tr>
                        <th>S.No.</th>
                        <th>QR Token</th>
                        <th>Customer Name</th>
                        <th>Mobile</th>
                        <th>Status</th>
                        <th>Registered Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedAdminDetails.assignedCustomers?.map((c, idx) => (
                        <tr key={c._id}>
                          <td style={{ fontWeight: 700, color: 'var(--text-muted)' }}>{idx + 1}</td>
                          <td><span className="badge-qr-token">{c.qrToken}</span></td>
                          <td style={{ fontWeight: 700, color: 'var(--text-heading)' }}>{c.name}</td>
                          <td>{c.mobile}</td>
                          <td><span className="badge-status-green">{c.status}</span></td>
                          <td style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>
                            {new Date(c.createdAt).toLocaleDateString('en-IN')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button type="button" className="btn btn-outline" onClick={() => setSelectedAdminDetails(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
