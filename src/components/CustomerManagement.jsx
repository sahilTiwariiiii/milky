import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { GiveProductModal } from './GiveProductModal';
import { PrintableQrBadge } from './PrintableQrBadge';
import {
  Users,
  UserPlus,
  Search,
  QrCode,
  Package,
  RefreshCw,
  Edit2,
  Trash2,
  Printer,
  X,
  Phone,
  MapPin,
  ShieldCheck,
  CheckCircle2,
  Eye,
  Sparkles
} from 'lucide-react';

export const CustomerManagement = () => {
  const { user, isSuperAdmin } = useAuth();
  const { showSuccess, showError } = useToast();

  const [customers, setCustomers] = useState([]);
  const [adminsList, setAdminsList] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('ALL'); // 'ALL' | 'ACTIVE' | 'INACTIVE'
  const [filterAdminId, setFilterAdminId] = useState('');

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [activeBadgeCustomer, setActiveBadgeCustomer] = useState(null);
  const [activeGiveProductCustomer, setActiveGiveProductCustomer] = useState(null);
  const [viewCustomerModal, setViewCustomerModal] = useState(null); // Full customer details with QR

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    mobile: '',
    address: '',
    adminId: '',
    status: 'ACTIVE'
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const params = {};
      if (searchTerm) params.search = searchTerm;
      if (filterAdminId) params.adminId = filterAdminId;
      if (activeTab !== 'ALL') params.status = activeTab;

      const res = await api.getCustomers(params);
      if (res.success && res.data?.customers) {
        setCustomers(res.data.customers);
      }
    } catch (err) {
      showError(err.message || 'Failed to fetch customers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isSuperAdmin) {
      api.getAdmins({ limit: 100 }).then((res) => {
        if (res.success && res.data?.admins) {
          setAdminsList(res.data.admins);
          if (res.data.admins.length > 0 && !formData.adminId) {
            setFormData((prev) => ({ ...prev, adminId: res.data.admins[0]._id }));
          }
        }
      }).catch(() => {});
    }
  }, [isSuperAdmin]);

  useEffect(() => {
    fetchCustomers();
  }, [searchTerm, filterAdminId, activeTab, user]);

  const handleCreateCustomer = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        name: formData.name,
        mobile: formData.mobile,
        address: formData.address,
        adminId: isSuperAdmin ? formData.adminId : user.id,
        status: formData.status
      };

      const res = await api.createCustomer(payload);
      if (res.success && res.data?.customer) {
        showSuccess(`Customer "${res.data.customer.name}" created with QR Pass!`);
        setShowCreateModal(false);
        setFormData({ name: '', mobile: '', address: '', adminId: adminsList[0]?._id || '', status: 'ACTIVE' });
        fetchCustomers();
        setViewCustomerModal(res.data.customer);
      }
    } catch (err) {
      showError(err.message || 'Failed to create customer');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateCustomer = async (e) => {
    e.preventDefault();
    if (!editingCustomer) return;

    setSubmitting(true);
    try {
      const payload = {
        name: formData.name,
        mobile: formData.mobile,
        address: formData.address,
        status: formData.status,
        ...(isSuperAdmin && { adminId: formData.adminId })
      };

      const res = await api.updateCustomer(editingCustomer._id, payload);
      if (res.success) {
        showSuccess('Customer details updated successfully');
        setShowEditModal(false);
        setEditingCustomer(null);
        fetchCustomers();
      }
    } catch (err) {
      showError(err.message || 'Failed to update customer');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRegenerateQr = async (customer) => {
    if (!window.confirm(`Regenerate QR token for ${customer.name}? Previous QR pass will become invalid.`)) {
      return;
    }

    try {
      const res = await api.regenerateQr(customer._id);
      if (res.success && res.data?.customer) {
        showSuccess(`New QR Pass Generated! Token: ${res.data.customer.qrToken}`);
        fetchCustomers();
        setViewCustomerModal(res.data.customer);
      }
    } catch (err) {
      showError(err.message || 'Failed to regenerate QR pass');
    }
  };

  const handleDeleteCustomer = async (customer) => {
    if (!window.confirm(`Are you sure you want to delete customer "${customer.name}"?`)) return;

    try {
      const res = await api.deleteCustomer(customer._id);
      if (res.success) {
        showSuccess('Customer deleted successfully');
        fetchCustomers();
      }
    } catch (err) {
      showError(err.message || 'Failed to delete customer');
    }
  };

  const openEditModal = (cust) => {
    setEditingCustomer(cust);
    setFormData({
      name: cust.name,
      mobile: cust.mobile,
      address: cust.address || '',
      adminId: cust.adminId?._id || cust.adminId,
      status: cust.status
    });
    setShowEditModal(true);
  };

  return (
    <div>
      {/* ENTERPRISE PANEL */}
      <div className="enterprise-panel">
        <div className="panel-banner-red">
          <h3>
            <Users size={16} />
            <span>Customer Master & QR Pass Registry</span>
          </h3>

          <button
            type="button"
            className="btn btn-xs btn-outline"
            style={{ background: '#fff', color: 'var(--primary-red)' }}
            onClick={() => {
              setFormData({
                name: '',
                mobile: '',
                address: '',
                adminId: isSuperAdmin && adminsList.length > 0 ? adminsList[0]._id : user?.id,
                status: 'ACTIVE'
              });
              setShowCreateModal(true);
            }}
          >
            <UserPlus size={13} />
            <span>+ Register Customer</span>
          </button>
        </div>

        {/* Sub-Filter Tabs */}
        <div className="sub-filter-strip">
          <button
            type="button"
            className={`sub-tab-btn ${activeTab === 'ALL' ? 'active' : ''}`}
            onClick={() => setActiveTab('ALL')}
          >
            All Customers ({customers.length})
          </button>
          <button
            type="button"
            className={`sub-tab-btn ${activeTab === 'ACTIVE' ? 'active' : ''}`}
            onClick={() => setActiveTab('ACTIVE')}
          >
            Active Passes
          </button>
          <button
            type="button"
            className={`sub-tab-btn ${activeTab === 'INACTIVE' ? 'active' : ''}`}
            onClick={() => setActiveTab('INACTIVE')}
          >
            Suspended
          </button>
        </div>

        {/* Toolbar */}
        <div className="panel-toolbar">
          <div style={{ display: 'flex', gap: '0.5rem', flex: 1, maxWidth: '380px' }}>
            <input
              type="text"
              className="form-control"
              placeholder="Search Name, Phone, or QR Token..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {isSuperAdmin && (
            <select
              className="form-control"
              style={{ width: 'auto', minWidth: '170px' }}
              value={filterAdminId}
              onChange={(e) => setFilterAdminId(e.target.value)}
            >
              <option value="">All Delivery Routes / Admins</option>
              {adminsList.map((a) => (
                <option key={a._id} value={a._id}>
                  Route: {a.name}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Table with VISIBLE QR CODE THUMBNAIL */}
        {loading ? (
          <div style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            Loading customer master records...
          </div>
        ) : customers.length === 0 ? (
          <div style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            No customer records found matching this selection.
          </div>
        ) : (
          <div className="table-responsive">
            <table className="enterprise-table">
              <thead>
                <tr>
                  <th>S.No.</th>
                  <th>Customer QR Pass</th>
                  <th>Customer Name</th>
                  <th>Phone / Mobile</th>
                  <th>Delivery Address</th>
                  <th>Assigned Route Admin</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Process / Actions</th>
                </tr>
              </thead>
              <tbody>
                {customers.map((c, idx) => (
                  <tr key={c._id}>
                    <td style={{ fontWeight: 700, color: 'var(--text-muted)' }}>{idx + 1}</td>

                    {/* Prominent Generated QR Code Preview Column */}
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        {c.qrCode ? (
                          <img
                            src={c.qrCode}
                            alt={`QR for ${c.name}`}
                            className="table-qr-thumb"
                            title="Click to view QR Pass & Details"
                            onClick={() => setViewCustomerModal(c)}
                          />
                        ) : (
                          <div style={{ width: '42px', height: '42px', background: '#f5ebe0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <QrCode size={18} />
                          </div>
                        )}
                        <div>
                          <div className="badge-qr-token">{c.qrToken}</div>
                          <button
                            type="button"
                            style={{ background: 'none', border: 'none', color: 'var(--primary-red)', fontSize: '0.7rem', fontWeight: 700, cursor: 'pointer', padding: 0, marginTop: '2px', display: 'flex', alignItems: 'center', gap: '2px' }}
                            onClick={() => setViewCustomerModal(c)}
                          >
                            <Eye size={11} />
                            <span>View QR Details</span>
                          </button>
                        </div>
                      </div>
                    </td>

                    <td style={{ fontWeight: 700, color: 'var(--text-heading)' }}>
                      <span style={{ cursor: 'pointer' }} onClick={() => setViewCustomerModal(c)}>
                        {c.name}
                      </span>
                    </td>

                    <td>{c.mobile}</td>

                    <td style={{ color: 'var(--text-muted)', fontSize: '0.76rem' }}>
                      {c.address || 'Standard Hub Delivery'}
                    </td>

                    <td style={{ fontWeight: 600, color: 'var(--primary-red)' }}>
                      {c.adminId?.name || 'Unassigned'}
                    </td>

                    <td>
                      <span className={c.status === 'ACTIVE' ? 'badge-status-green' : 'badge-status-red'}>
                        {c.status}
                      </span>
                    </td>

                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '0.3rem' }}>
                        <button
                          type="button"
                          className="btn btn-xs btn-success"
                          onClick={() => setActiveGiveProductCustomer(c)}
                          title="Record distribution for this customer"
                        >
                          <Package size={12} />
                          <span>Give Milk</span>
                        </button>

                        <button
                          type="button"
                          className="btn btn-xs btn-outline"
                          onClick={() => setActiveBadgeCustomer(c)}
                          title="Print Customer QR ID Card"
                        >
                          <Printer size={12} />
                          <span>Print Pass</span>
                        </button>

                        <button
                          type="button"
                          className="btn btn-xs btn-outline"
                          onClick={() => handleRegenerateQr(c)}
                          title="Regenerate QR Code"
                        >
                          <RefreshCw size={12} />
                        </button>

                        <button
                          type="button"
                          className="btn btn-xs btn-outline"
                          onClick={() => openEditModal(c)}
                          title="Edit Customer"
                        >
                          <Edit2 size={12} />
                        </button>

                        {isSuperAdmin && (
                          <button
                            type="button"
                            className="btn btn-xs btn-danger-outline"
                            onClick={() => handleDeleteCustomer(c)}
                            title="Delete Customer"
                          >
                            <Trash2 size={12} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* FULL CUSTOMER DETAILS WITH GENERATED QR MODAL (Point 4) */}
      {viewCustomerModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '460px' }}>
            <div className="modal-header">
              <h3>
                <QrCode size={16} />
                <span>Customer QR Pass & Details</span>
              </h3>
              <button type="button" className="close-btn" onClick={() => setViewCustomerModal(null)}>
                <X size={16} />
              </button>
            </div>

            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
              {/* QR Image Box */}
              <div style={{
                background: '#ffffff',
                border: '2px solid var(--primary-red)',
                borderRadius: 'var(--radius-sm)',
                padding: '1rem',
                display: 'inline-flex',
                flexDirection: 'column',
                alignItems: 'center',
                boxShadow: 'var(--shadow-sm)',
                marginBottom: '1rem'
              }}>
                <img
                  src={viewCustomerModal.qrCode}
                  alt={`QR for ${viewCustomerModal.name}`}
                  style={{ width: '160px', height: '160px', marginBottom: '0.5rem' }}
                />
                <span className="badge-qr-token" style={{ fontSize: '0.88rem', padding: '0.2rem 0.6rem' }}>
                  {viewCustomerModal.qrToken}
                </span>
              </div>

              <h4 style={{ fontWeight: 800, fontSize: '1.15rem', color: 'var(--text-heading)', marginBottom: '0.25rem' }}>
                {viewCustomerModal.name}
              </h4>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.82rem', marginBottom: '1rem' }}>
                Phone: <strong>{viewCustomerModal.mobile}</strong> • Address: {viewCustomerModal.address || 'Standard Hub'}
              </div>

              {/* Route Assignment info */}
              <div style={{
                width: '100%',
                background: 'var(--primary-red-soft)',
                border: '1px solid var(--primary-red-border)',
                borderRadius: 'var(--radius-xs)',
                padding: '0.65rem 0.85rem',
                fontSize: '0.78rem',
                textAlign: 'left',
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: '1rem'
              }}>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Assigned Route Admin: </span>
                  <strong style={{ color: 'var(--primary-red-dark)' }}>{viewCustomerModal.adminId?.name || 'Assigned Admin'}</strong>
                </div>
                <div>
                  <span className={viewCustomerModal.status === 'ACTIVE' ? 'badge-status-green' : 'badge-status-red'}>
                    {viewCustomerModal.status}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '0.5rem', width: '100%' }}>
                <button
                  type="button"
                  className="btn btn-success"
                  style={{ flex: 1 }}
                  onClick={() => {
                    const cust = viewCustomerModal;
                    setViewCustomerModal(null);
                    setActiveGiveProductCustomer(cust);
                  }}
                >
                  <Package size={14} />
                  <span>Scan & Give Milk</span>
                </button>

                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => {
                    const cust = viewCustomerModal;
                    setViewCustomerModal(null);
                    setActiveBadgeCustomer(cust);
                  }}
                >
                  <Printer size={14} />
                  <span>Print Pass</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Customer Modal */}
      {showCreateModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>
                <UserPlus size={16} />
                <span>Register Customer & Generate QR Pass</span>
              </h3>
              <button type="button" className="close-btn" onClick={() => setShowCreateModal(false)}>
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateCustomer}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>
                    Customer Full Name
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. Rahul Sharma"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>
                    Mobile Phone Number
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. 9876543210"
                    value={formData.mobile}
                    onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>
                    Delivery Address / Flat No
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. Flat 302, Green Valley Apts"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  />
                </div>

                {isSuperAdmin && (
                  <div>
                    <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>
                      Assign to Delivery Admin Route
                    </label>
                    <select
                      className="form-control"
                      value={formData.adminId}
                      onChange={(e) => setFormData({ ...formData, adminId: e.target.value })}
                      required
                    >
                      {adminsList.map((a) => (
                        <option key={a._id} value={a._id}>
                          {a.name} ({a.email})
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setShowCreateModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Generating...' : 'Create & Generate QR'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Customer Modal */}
      {showEditModal && editingCustomer && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>
                <Edit2 size={16} />
                <span>Edit Customer Record</span>
              </h3>
              <button type="button" className="close-btn" onClick={() => setShowEditModal(false)}>
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleUpdateCustomer}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>
                    Customer Full Name
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
                  <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>
                    Mobile Number
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    value={formData.mobile}
                    onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>
                    Delivery Address
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  />
                </div>

                {isSuperAdmin && (
                  <div>
                    <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>
                      Reassign Route Admin
                    </label>
                    <select
                      className="form-control"
                      value={formData.adminId}
                      onChange={(e) => setFormData({ ...formData, adminId: e.target.value })}
                    >
                      {adminsList.map((a) => (
                        <option key={a._id} value={a._id}>
                          {a.name} ({a.email})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>
                    Status
                  </label>
                  <select
                    className="form-control"
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  >
                    <option value="ACTIVE">Active Pass</option>
                    <option value="INACTIVE">Suspended</option>
                  </select>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setShowEditModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Saving...' : 'Update Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Give Product Modal */}
      {activeGiveProductCustomer && (
        <GiveProductModal
          customer={activeGiveProductCustomer}
          onClose={() => setActiveGiveProductCustomer(null)}
          onTransactionCreated={() => {
            fetchCustomers();
          }}
        />
      )}

      {/* Printable Badge */}
      {activeBadgeCustomer && (
        <PrintableQrBadge
          customer={activeBadgeCustomer}
          onClose={() => setActiveBadgeCustomer(null)}
        />
      )}
    </div>
  );
};
