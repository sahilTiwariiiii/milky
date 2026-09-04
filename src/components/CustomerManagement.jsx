import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { GiveProductModal } from './GiveProductModal';
import { PrintableQrBadge } from './PrintableQrBadge';
import { Pagination } from './Pagination';
import { CustomerDetailPage } from './CustomerDetailPage';
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
  Sparkles,
  Upload,
  Image as ImageIcon,
  CreditCard,
  FileText
} from 'lucide-react';

export const CustomerManagement = () => {
  const { user, isSuperAdmin } = useAuth();
  const { showSuccess, showError } = useToast();

  const [customers, setCustomers] = useState([]);
  const [adminsList, setAdminsList] = useState([]);
  const [loading, setLoading] = useState(true);

  // Dedicated Page Customer View
  const [viewingCustomer, setViewingCustomer] = useState(null);

  // Pagination & Meta
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [meta, setMeta] = useState({ page: 1, limit: 20, totalPages: 1, totalItems: 0 });

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

  // Form State
  const initialFormState = {
    name: '',
    mobile: '',
    address: '',
    adharNumber: '',
    panNumber: '',
    image: '',
    profileImage: '',
    adminId: '',
    status: 'ACTIVE'
  };
  const [formData, setFormData] = useState(initialFormState);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const params = {
        page,
        limit
      };
      if (searchTerm.trim()) params.search = searchTerm.trim();
      if (filterAdminId) params.adminId = filterAdminId;
      if (activeTab !== 'ALL') params.status = activeTab;

      const res = await api.getCustomers(params);
      if (res.success && res.data?.customers) {
        setCustomers(res.data.customers);
        if (res.meta) {
          setMeta(res.meta);
        } else {
          setMeta({
            page,
            limit,
            totalPages: Math.ceil((res.data.customers.length || 1) / limit) || 1,
            totalItems: res.data.customers.length
          });
        }
      }
    } catch (err) {
      showError(err.message || 'Failed to fetch customers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isSuperAdmin) {
      api.getAdmins({ limit: 100 })
        .then((res) => {
          if (res.success && res.data?.admins) {
            setAdminsList(res.data.admins);
          }
        })
        .catch(() => {});
    }
  }, [isSuperAdmin]);

  useEffect(() => {
    setPage(1);
  }, [searchTerm, filterAdminId, activeTab]);

  useEffect(() => {
    fetchCustomers();
  }, [page, limit, searchTerm, filterAdminId, activeTab, user]);

  // Handle Image Upload
  const handleImageFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    try {
      const res = await api.uploadFile(file);
      if (res.success && res.data?.url) {
        setFormData((prev) => ({ ...prev, image: res.data.url, profileImage: res.data.url }));
        showSuccess('Photo uploaded successfully');
      }
    } catch (err) {
      showError(err.message || 'Image upload failed');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleCreateCustomer = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const imgVal = formData.profileImage || formData.image || '';
      const payload = {
        name: formData.name.trim(),
        mobile: formData.mobile.trim(),
        address: formData.address.trim(),
        adharNumber: formData.adharNumber.trim(),
        panNumber: formData.panNumber.trim().toUpperCase(),
        image: imgVal,
        profileImage: imgVal,
        adminId: isSuperAdmin ? (formData.adminId || adminsList[0]?._id) : user?.id,
        status: formData.status
      };

      const res = await api.createCustomer(payload);
      if (res.success && res.data?.customer) {
        showSuccess(`Customer "${res.data.customer.name}" created with QR Pass!`);
        setShowCreateModal(false);
        setFormData(initialFormState);
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
      const imgVal = formData.profileImage || formData.image || '';
      const payload = {
        name: formData.name.trim(),
        mobile: formData.mobile.trim(),
        address: formData.address.trim(),
        adharNumber: formData.adharNumber.trim(),
        panNumber: formData.panNumber.trim().toUpperCase(),
        image: imgVal,
        profileImage: imgVal,
        status: formData.status,
        ...(isSuperAdmin && { adminId: formData.adminId })
      };

      const res = await api.updateCustomer(editingCustomer._id, payload);
      if (res.success) {
        showSuccess('Customer details updated successfully');
        setShowEditModal(false);
        setEditingCustomer(null);
        fetchCustomers();
        if (viewingCustomer && (viewingCustomer._id === editingCustomer._id || viewingCustomer.id === editingCustomer._id)) {
          setViewingCustomer(res.data.customer);
        }
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
        if (viewingCustomer && (viewingCustomer._id === customer._id || viewingCustomer.id === customer._id)) {
          setViewingCustomer(res.data.customer);
        }
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
      name: cust.name || '',
      mobile: cust.mobile || '',
      address: cust.address || '',
      adharNumber: cust.adharNumber || '',
      panNumber: cust.panNumber || '',
      image: cust.profileImage || cust.image || '',
      profileImage: cust.profileImage || cust.image || '',
      adminId: cust.adminId?._id || cust.adminId || '',
      status: cust.status || 'ACTIVE'
    });
    setShowEditModal(true);
  };

  // Dedicated Page: When customer is selected, render full page instead of modal
  if (viewingCustomer) {
    return (
      <CustomerDetailPage
        customer={viewingCustomer}
        onBack={() => {
          setViewingCustomer(null);
          fetchCustomers();
        }}
        onEditCustomer={(cust) => {
          openEditModal(cust);
        }}
      />
    );
  }

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
                ...initialFormState,
                adminId: isSuperAdmin && adminsList.length > 0 ? adminsList[0]._id : user?.id
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
            All Customers ({meta.totalItems})
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

        {/* Toolbar with Search and Admin Filter */}
        <div className="panel-toolbar">
          <div style={{ display: 'flex', gap: '0.5rem', flex: 1, maxWidth: '420px' }}>
            <div style={{ position: 'relative', width: '100%' }}>
              <input
                type="text"
                className="form-control"
                placeholder="Search by Name, Mobile, or QR Token..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ paddingLeft: '2rem' }}
              />
              <Search
                size={14}
                style={{ position: 'absolute', left: '0.65rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}
              />
            </div>
          </div>

          {isSuperAdmin && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)' }}>Assigned Admin:</span>
              <select
                className="form-control"
                style={{ width: 'auto', minWidth: '190px' }}
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
            </div>
          )}
        </div>

        {/* Table with Customer Details, Image & QR */}
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
                  <th>Customer Profile</th>
                  <th>Customer QR Pass</th>
                  <th>Contact Phone</th>
                  <th>Govt IDs (Aadhaar/PAN)</th>
                  <th>Delivery Address</th>
                  <th>Assigned Route</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Process / Actions</th>
                </tr>
              </thead>
              <tbody>
                {customers.map((c, idx) => (
                  <tr key={c._id}>
                    <td style={{ fontWeight: 700, color: 'var(--text-muted)' }}>
                      {(page - 1) * limit + idx + 1}
                    </td>

                    {/* Customer Avatar & Name */}
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                        {c.profileImage || c.image ? (
                          <img
                            src={c.profileImage || c.image}
                            alt={c.name}
                            className="table-avatar-img"
                            onClick={() => setViewingCustomer(c)}
                            style={{ cursor: 'pointer' }}
                            title="Click to view Customer Profile & Daily Orders"
                          />
                        ) : (
                          <div
                            className="table-avatar-fallback"
                            onClick={() => setViewingCustomer(c)}
                            style={{ cursor: 'pointer' }}
                            title="Click to view Customer Profile & Daily Orders"
                          >
                            {c.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <div
                            style={{ fontWeight: 700, color: 'var(--text-heading)', cursor: 'pointer' }}
                            onClick={() => setViewingCustomer(c)}
                            title="Click to view Customer Profile & Daily Orders"
                          >
                            {c.name}
                          </div>
                          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                            ID: {c.qrToken}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* QR Code Column */}
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        {c.qrCode ? (
                          <img
                            src={c.qrCode}
                            alt={`QR for ${c.name}`}
                            className="table-qr-thumb"
                            title="Click to view Customer Profile & Daily Orders"
                            onClick={() => setViewingCustomer(c)}
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
                            onClick={() => setViewingCustomer(c)}
                          >
                            <Eye size={11} />
                            <span>View Details</span>
                          </button>
                        </div>
                      </div>
                    </td>

                    <td>{c.mobile}</td>

                    {/* Aadhaar / PAN */}
                    <td style={{ fontSize: '0.76rem' }}>
                      {c.adharNumber ? (
                        <div style={{ color: '#15803d', fontWeight: 600 }}>
                          Aadhaar: •••• {c.adharNumber.slice(-4)}
                        </div>
                      ) : (
                        <div style={{ color: 'var(--text-dim)' }}>No Aadhaar</div>
                      )}
                      {c.panNumber && (
                        <div style={{ color: '#0369a1', fontWeight: 600 }}>
                          PAN: {c.panNumber}
                        </div>
                      )}
                    </td>

                    <td style={{ color: 'var(--text-muted)', fontSize: '0.76rem', maxWidth: '200px' }}>
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
                          className="btn btn-xs btn-outline"
                          onClick={() => setViewingCustomer(c)}
                          title="View Full Customer Page, Daily Orders & Monthly Bill"
                          style={{ color: 'var(--primary-red)', borderColor: '#fca5a5' }}
                        >
                          <FileText size={12} />
                          <span>View & Bill</span>
                        </button>

                        <button
                          type="button"
                          className="btn btn-xs btn-success"
                          onClick={() => setActiveGiveProductCustomer(c)}
                          title="Record milk for this customer"
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
                          <span>Pass</span>
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

        {/* Pagination Bar */}
        <Pagination
          meta={meta}
          onPageChange={(newPage) => setPage(newPage)}
          onLimitChange={(newLimit) => {
            setLimit(newLimit);
            setPage(1);
          }}
        />
      </div>

      {/* CREATE CUSTOMER MODAL WITH AADHAAR, PAN, ADDRESS, PHOTO */}
      {showCreateModal && (
        <div className="modal-overlay">
          <div className="modal-content modal-lg">
            <div className="modal-header">
              <h3>
                <UserPlus size={16} />
                <span>Register New Customer with Complete Details</span>
              </h3>
              <button type="button" className="close-btn" onClick={() => setShowCreateModal(false)}>
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateCustomer}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  {/* Full Name */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>
                      Customer Full Name *
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. Ramesh Patel"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </div>

                  {/* Mobile */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>
                      Mobile Phone Number *
                    </label>
                    <input
                      type="tel"
                      className="form-control"
                      placeholder="e.g. 9876543210"
                      value={formData.mobile}
                      onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  {/* Aadhaar */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>
                      Aadhaar Card Number (Optional)
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. 1234 5678 9012"
                      value={formData.adharNumber}
                      onChange={(e) => setFormData({ ...formData, adharNumber: e.target.value })}
                    />
                  </div>

                  {/* PAN Card */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>
                      PAN Card Number (Optional)
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. ABCDE1234F"
                      value={formData.panNumber}
                      onChange={(e) => setFormData({ ...formData, panNumber: e.target.value })}
                    />
                  </div>
                </div>

                {/* Delivery Address */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>
                    Delivery Address / House / Flat
                  </label>
                  <textarea
                    className="form-control"
                    rows={2}
                    placeholder="e.g. Flat 302, Sai Residency, Main Market Road"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  />
                </div>

                {/* Customer Photo Upload */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>
                    Customer Photo / Document Image
                  </label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                    {formData.image ? (
                      <div style={{ position: 'relative' }}>
                        <img
                          src={formData.image}
                          alt="Customer preview"
                          style={{ width: '70px', height: '70px', objectFit: 'cover', borderRadius: 'var(--radius-xs)', border: '1px solid var(--border-medium)' }}
                        />
                        <button
                          type="button"
                          style={{ position: 'absolute', top: '-6px', right: '-6px', background: '#ef4444', color: '#fff', border: 'none', borderRadius: '50%', width: '18px', height: '18px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                          onClick={() => setFormData({ ...formData, image: '' })}
                          title="Remove image"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ) : (
                      <label className="upload-btn-container">
                        <Upload size={16} />
                        <span>{uploadingImage ? 'Uploading photo...' : 'Upload Customer Photo'}</span>
                        <input
                          type="file"
                          accept="image/*"
                          style={{ display: 'none' }}
                          onChange={handleImageFileChange}
                          disabled={uploadingImage}
                        />
                      </label>
                    )}
                    <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                      Optional. Supported formats: JPG, PNG, WEBP (Max 10MB).
                    </span>
                  </div>
                </div>

                {/* Assigned Route Admin (Super Admin only) */}
                {isSuperAdmin && (
                  <div>
                    <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>
                      Assign to Route Admin *
                    </label>
                    <select
                      className="form-control"
                      value={formData.adminId}
                      onChange={(e) => setFormData({ ...formData, adminId: e.target.value })}
                      required
                    >
                      {adminsList.map((a) => (
                        <option key={a._id} value={a._id}>
                          Admin: {a.name} ({a.email})
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
                <button type="submit" className="btn btn-primary" disabled={submitting || uploadingImage}>
                  {submitting ? 'Creating Customer & QR...' : 'Create Customer & Generate Pass'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT CUSTOMER MODAL */}
      {showEditModal && editingCustomer && (
        <div className="modal-overlay">
          <div className="modal-content modal-lg">
            <div className="modal-header">
              <h3>
                <Edit2 size={16} />
                <span>Edit Customer Profile</span>
              </h3>
              <button type="button" className="close-btn" onClick={() => setShowEditModal(false)}>
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleUpdateCustomer}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>
                      Customer Full Name *
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
                      Mobile Number *
                    </label>
                    <input
                      type="tel"
                      className="form-control"
                      value={formData.mobile}
                      onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>
                      Aadhaar Card Number
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.adharNumber}
                      onChange={(e) => setFormData({ ...formData, adharNumber: e.target.value })}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>
                      PAN Card Number
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.panNumber}
                      onChange={(e) => setFormData({ ...formData, panNumber: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>
                    Delivery Address
                  </label>
                  <textarea
                    className="form-control"
                    rows={2}
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  />
                </div>

                {/* Photo Update */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>
                    Customer Photo
                  </label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                    {formData.image ? (
                      <div style={{ position: 'relative' }}>
                        <img
                          src={formData.image}
                          alt="Customer preview"
                          style={{ width: '70px', height: '70px', objectFit: 'cover', borderRadius: 'var(--radius-xs)', border: '1px solid var(--border-medium)' }}
                        />
                        <button
                          type="button"
                          style={{ position: 'absolute', top: '-6px', right: '-6px', background: '#ef4444', color: '#fff', border: 'none', borderRadius: '50%', width: '18px', height: '18px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                          onClick={() => setFormData({ ...formData, image: '' })}
                          title="Remove image"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ) : (
                      <label className="upload-btn-container">
                        <Upload size={16} />
                        <span>{uploadingImage ? 'Uploading photo...' : 'Change Customer Photo'}</span>
                        <input
                          type="file"
                          accept="image/*"
                          style={{ display: 'none' }}
                          onChange={handleImageFileChange}
                          disabled={uploadingImage}
                        />
                      </label>
                    )}
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
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
                      Account Status
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
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setShowEditModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={submitting || uploadingImage}>
                  {submitting ? 'Saving Changes...' : 'Save Profile Changes'}
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
