import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Pagination } from './Pagination';
import {
  Package,
  Plus,
  IndianRupee,
  Edit2,
  Trash2,
  X,
  Sparkles,
  Layers,
  Search
} from 'lucide-react';

const STANDARD_UNITS = [
  { value: 'litre', label: 'Per Litre (L)' },
  { value: 'pack', label: 'Per Pack / Packet' },
  { value: 'kg', label: 'Per Kilogram (kg)' },
  { value: 'pouch', label: 'Per Pouch (e.g. 500ml / 1L)' },
  { value: 'bottle', label: 'Per Bottle' },
  { value: 'cup', label: 'Per Cup / Tub' },
  { value: 'box', label: 'Per Box / Carton' },
  { value: 'gram', label: 'Per Gram (g)' },
  { value: 'piece', label: 'Per Piece (pc)' },
  { value: 'can', label: 'Per Can / Tin' },
  { value: 'custom', label: '+ Custom Unit (Type Below)' }
];

export const ProductManagement = () => {
  const { isSuperAdmin } = useAuth();
  const { showSuccess, showError } = useToast();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Pagination & Filters
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [meta, setMeta] = useState({ page: 1, limit: 20, totalPages: 1, totalItems: 0 });
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [availableCategories, setAvailableCategories] = useState(['Dairy', 'Milk', 'Curd', 'Ghee', 'Paneer']);

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    category: 'Dairy',
    unitSelect: 'litre',
    customUnit: '',
    price: '',
    status: 'ACTIVE'
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    api.getSystemConfig()
      .then((res) => {
        if (res.success && res.data?.config?.categories) {
          setAvailableCategories(res.data.config.categories);
        }
      })
      .catch(() => {});
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const params = {
        page,
        limit
      };
      if (search.trim()) params.search = search.trim();
      if (selectedCategory) params.category = selectedCategory;
      if (selectedStatus) params.status = selectedStatus;

      const res = await api.getProducts(params);
      if (res.success && res.data?.products) {
        setProducts(res.data.products);
        if (res.meta) {
          setMeta(res.meta);
        } else {
          setMeta({
            page,
            limit,
            totalPages: Math.ceil((res.data.products.length || 1) / limit) || 1,
            totalItems: res.data.products.length
          });
        }
      }
    } catch (err) {
      showError(err.message || 'Failed to fetch products');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setPage(1);
  }, [search, selectedCategory, selectedStatus]);

  useEffect(() => {
    fetchProducts();
  }, [page, limit, search, selectedCategory, selectedStatus]);

  const getEffectiveUnit = () => {
    if (formData.unitSelect === 'custom') {
      return (formData.customUnit || 'unit').trim().toLowerCase();
    }
    return formData.unitSelect;
  };

  const handleAddProduct = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const unit = getEffectiveUnit();
      const payload = {
        name: formData.name,
        category: formData.category,
        unit,
        price: parseFloat(formData.price),
        status: formData.status
      };

      const res = await api.createProduct(payload);
      if (res.success) {
        showSuccess(`Product "${res.data.product.name}" created with unit "${unit}"!`);
        setShowAddModal(false);
        setFormData({ name: '', category: 'Dairy', unitSelect: 'litre', customUnit: '', price: '', status: 'ACTIVE' });
        fetchProducts();
      }
    } catch (err) {
      showError(err.message || 'Failed to add product');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateProduct = async (e) => {
    e.preventDefault();
    if (!editingProduct) return;

    setSubmitting(true);
    try {
      const unit = getEffectiveUnit();
      const payload = {
        name: formData.name,
        category: formData.category,
        unit,
        price: parseFloat(formData.price),
        status: formData.status
      };

      const res = await api.updateProduct(editingProduct._id, payload);
      if (res.success) {
        showSuccess(`Product updated! New rate: ₹${payload.price} / ${unit}`);
        setShowEditModal(false);
        setEditingProduct(null);
        fetchProducts();
      }
    } catch (err) {
      showError(err.message || 'Failed to update product');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (product) => {
    const nextStatus = product.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try {
      const res = await api.updateProduct(product._id, { status: nextStatus });
      if (res.success) {
        showSuccess(`Product status changed to ${nextStatus}`);
        fetchProducts();
      }
    } catch (err) {
      showError(err.message || 'Failed to toggle status');
    }
  };

  const handleDeleteProduct = async (product) => {
    if (!window.confirm(`Delete product "${product.name}"?`)) return;

    try {
      const res = await api.deleteProduct(product._id);
      if (res.success) {
        showSuccess('Product deleted successfully');
        fetchProducts();
      }
    } catch (err) {
      showError(err.message || 'Failed to delete product');
    }
  };

  const openEdit = (p) => {
    setEditingProduct(p);
    const isStandard = STANDARD_UNITS.some((u) => u.value === p.unit && u.value !== 'custom');
    setFormData({
      name: p.name,
      category: p.category || 'Dairy',
      unitSelect: isStandard ? p.unit : 'custom',
      customUnit: isStandard ? '' : p.unit,
      price: p.price.toString(),
      status: p.status
    });
    setShowEditModal(true);
  };

  return (
    <div>
      {/* ENTERPRISE PANEL */}
      <div className="enterprise-panel">
        <div className="panel-banner-charcoal">
          <h3>
            <Package size={16} />
            <span>Product Catalog & Multi-Unit Pricing Master</span>
          </h3>

          {isSuperAdmin && (
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => {
                setFormData({ name: '', category: 'Dairy', unitSelect: 'litre', customUnit: '', price: '', status: 'ACTIVE' });
                setShowAddModal(true);
              }}
            >
              <Plus size={15} />
              <span>Add Product</span>
            </button>
          )}
        </div>

        {/* Snapshot Guarantee Notice */}
        <div style={{
          background: '#ECFDF5',
          borderBottom: '1px solid #A7F3D0',
          padding: '0.65rem 1rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          fontSize: '0.78rem',
          color: '#047857',
          fontWeight: 600
        }}>
          <Sparkles size={15} style={{ color: '#059669', flexShrink: 0 }} />
          <span>
            <strong>Flexible Units & Price Snapshot Guarantee:</strong> Products can be priced by Litre, Per Pack, Kilogram, Pouch, Bottle, Cup, or custom units. Historical orders always preserve their exact unit rate.
          </span>
        </div>

        {/* Toolbar with Search, Category & Status */}
        <div className="panel-toolbar no-print">
          <div style={{ position: 'relative', width: '100%', maxWidth: '320px' }}>
            <input
              type="text"
              className="form-control"
              placeholder="Search product name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ paddingLeft: '2rem' }}
            />
            <Search
              size={14}
              style={{ position: 'absolute', left: '0.65rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}
            />
          </div>

          <div style={{ display: 'flex', gap: '0.65rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <select
              className="form-control"
              style={{ width: 'auto', minWidth: '160px' }}
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              <option value="">All Categories</option>
              {availableCategories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>

            <select
              className="form-control"
              style={{ width: 'auto', minWidth: '140px' }}
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
            >
              <option value="">All Statuses</option>
              <option value="ACTIVE">Active Only</option>
              <option value="INACTIVE">Inactive Only</option>
            </select>
          </div>

          {(search || selectedCategory || selectedStatus) && (
            <button
              type="button"
              className="btn btn-xs btn-outline"
              onClick={() => {
                setSearch('');
                setSelectedCategory('');
                setSelectedStatus('');
              }}
            >
              Reset
            </button>
          )}
        </div>

        {/* Table */}
        {loading ? (
          <div style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            Loading product catalog...
          </div>
        ) : products.length === 0 ? (
          <div style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            No products in catalog.
          </div>
        ) : (
          <div className="table-responsive">
            <table className="enterprise-table">
              <thead>
                <tr>
                  <th>S.No.</th>
                  <th>Product Name</th>
                  <th>Category</th>
                  <th>Sale Unit</th>
                  <th>Price Rate (₹)</th>
                  <th>Status</th>
                  {isSuperAdmin && <th style={{ textAlign: 'right' }}>Process / Actions</th>}
                </tr>
              </thead>
              <tbody>
                {products.map((p, idx) => (
                  <tr key={p._id}>
                    <td style={{ fontWeight: 700, color: 'var(--text-muted)' }}>{idx + 1}</td>
                    <td style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--text-heading)' }}>
                      {p.name}
                    </td>
                    <td>{p.category || 'Dairy'}</td>
                    <td>
                      <span style={{
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        fontSize: '0.74rem',
                        color: 'var(--primary-red)',
                        background: 'var(--primary-red-soft)',
                        padding: '0.15rem 0.45rem',
                        borderRadius: 'var(--radius-xs)',
                        border: '1px solid var(--primary-red-border)'
                      }}>
                        {p.unit}
                      </span>
                    </td>
                    <td>
                      <div style={{ fontWeight: 800, fontSize: '0.98rem', color: '#15803d' }}>
                        ₹{p.price} <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', fontWeight: 600 }}>/ {p.unit}</span>
                      </div>
                    </td>
                    <td>
                      <span className={p.status === 'ACTIVE' ? 'badge-status-green' : 'badge-status-red'}>
                        {p.status}
                      </span>
                    </td>
                    {isSuperAdmin && (
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '0.3rem' }}>
                          <button
                            type="button"
                            className="btn btn-xs btn-outline"
                            onClick={() => openEdit(p)}
                          >
                            <Edit2 size={12} />
                            <span>Edit Rate</span>
                          </button>

                          <button
                            type="button"
                            className="btn btn-xs btn-outline"
                            onClick={() => handleToggleStatus(p)}
                            title={p.status === 'ACTIVE' ? 'Disable' : 'Enable'}
                          >
                            {p.status === 'ACTIVE' ? 'Disable' : 'Enable'}
                          </button>

                          <button
                            type="button"
                            className="btn btn-xs btn-danger-outline"
                            onClick={() => handleDeleteProduct(p)}
                            title="Delete Product"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </td>
                    )}
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

      {/* Add Product Modal */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>
                <Plus size={16} />
                <span>Add Product to Catalog</span>
              </h3>
              <button type="button" className="close-btn" onClick={() => setShowAddModal(false)}>
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleAddProduct}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>
                    Product Name
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. Taaza Milk,Butter, Cheese Slices"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.65rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>
                      Pricing Unit (e.g. Litre, Per Pack)
                    </label>
                    <select
                      className="form-control"
                      value={formData.unitSelect}
                      onChange={(e) => setFormData({ ...formData, unitSelect: e.target.value })}
                      required
                    >
                      {STANDARD_UNITS.map((u) => (
                        <option key={u.value} value={u.value}>
                          {u.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>
                      Unit Price (₹)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      className="form-control"
                      placeholder="e.g. 64"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      required
                    />
                  </div>
                </div>

                {/* Custom Unit Input if selected */}
                {formData.unitSelect === 'custom' && (
                  <div>
                    <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, color: 'var(--primary-red)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>
                      Enter Custom Unit Name
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. 500ml pouch, 200g tub, per carton"
                      value={formData.customUnit}
                      onChange={(e) => setFormData({ ...formData, customUnit: e.target.value })}
                      required
                    />
                  </div>
                )}

                <div>
                  <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>
                    Category
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Dairy, Bakery, Beverages"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setShowAddModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Saving...' : 'Create Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Product Modal */}
      {showEditModal && editingProduct && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>
                <Edit2 size={16} />
                <span>Edit Product & Unit Rate</span>
              </h3>
              <button type="button" className="close-btn" onClick={() => setShowEditModal(false)}>
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleUpdateProduct}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>
                    Product Name
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.65rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>
                      Pricing Unit
                    </label>
                    <select
                      className="form-control"
                      value={formData.unitSelect}
                      onChange={(e) => setFormData({ ...formData, unitSelect: e.target.value })}
                      required
                    >
                      {STANDARD_UNITS.map((u) => (
                        <option key={u.value} value={u.value}>
                          {u.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>
                      Unit Price (₹)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      className="form-control"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      required
                    />
                  </div>
                </div>

                {formData.unitSelect === 'custom' && (
                  <div>
                    <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, color: 'var(--primary-red)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>
                      Custom Unit Name
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. per pouch, 500ml pack"
                      value={formData.customUnit}
                      onChange={(e) => setFormData({ ...formData, customUnit: e.target.value })}
                      required
                    />
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
                    <option value="ACTIVE">Active in Catalog</option>
                    <option value="INACTIVE">Disabled</option>
                  </select>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setShowEditModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Updating...' : 'Save & Update Rate'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
