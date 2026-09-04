import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import {
  Settings,
  Building2,
  Upload,
  Plus,
  Trash2,
  CheckCircle2,
  Package,
  Layers,
  Phone,
  MapPin,
  X,
  Sparkles,
  Save
} from 'lucide-react';

export const SystemConfigView = ({ onNavigate }) => {
  const { isSuperAdmin } = useAuth();
  const { showSuccess, showError } = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  // Form State
  const [config, setConfig] = useState({
    orgName: 'Milky Dairy',
    orgLogo: '',
    profileImage: '',
    tagline: 'Pure & Fresh Farm Milk Daily',
    phone: '+91 98765 43210',
    address: 'Central Dairy Sector Hub, Main Road',
    categories: ['Dairy', 'Milk', 'Curd', 'Ghee', 'Paneer']
  });

  const [newCategory, setNewCategory] = useState('');
  const [products, setProducts] = useState([]);

  // Quick Product Add State
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [productForm, setProductForm] = useState({
    name: '',
    category: 'Milk',
    unit: 'litre',
    price: ''
  });
  const [submittingProduct, setSubmittingProduct] = useState(false);

  const fetchConfigAndProducts = async () => {
    setLoading(true);
    try {
      const [configRes, prodRes] = await Promise.all([
        api.getSystemConfig(),
        api.getProducts({ limit: 100 })
      ]);

      if (configRes.success && configRes.data?.config) {
        setConfig((prev) => ({
          ...prev,
          ...configRes.data.config
        }));
      }

      if (prodRes.success && prodRes.data?.products) {
        setProducts(prodRes.data.products);
      }
    } catch (err) {
      showError(err.message || 'Failed to load system settings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfigAndProducts();
  }, []);

  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingLogo(true);
    try {
      const res = await api.uploadFile(file);
      if (res.success && res.data?.url) {
        setConfig((prev) => ({ ...prev, orgLogo: res.data.url, profileImage: res.data.url }));
        showSuccess('Organization logo / profile image uploaded to S3 successfully');
      }
    } catch (err) {
      showError(err.message || 'Failed to upload logo image');
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleAddCategory = (e) => {
    e.preventDefault();
    const cat = newCategory.trim();
    if (!cat) return;

    if (config.categories.some((c) => c.toLowerCase() === cat.toLowerCase())) {
      showError(`Category "${cat}" already exists`);
      return;
    }

    setConfig((prev) => ({
      ...prev,
      categories: [...prev.categories, cat]
    }));
    setNewCategory('');
    showSuccess(`Added category "${cat}"`);
  };

  const handleRemoveCategory = (catToRemove) => {
    if (config.categories.length <= 1) {
      showError('You must have at least one category');
      return;
    }

    setConfig((prev) => ({
      ...prev,
      categories: prev.categories.filter((c) => c !== catToRemove)
    }));
  };

  const handleSaveConfig = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const logoUrl = config.profileImage || config.orgLogo;
      const res = await api.updateSystemConfig({
        orgName: config.orgName.trim(),
        orgLogo: logoUrl,
        profileImage: logoUrl,
        tagline: config.tagline.trim(),
        phone: config.phone.trim(),
        address: config.address.trim(),
        categories: config.categories
      });

      if (res.success) {
        showSuccess('System configuration saved successfully! Top branding and QR passes updated.');
        // Trigger custom event so header refreshes
        window.dispatchEvent(new CustomEvent('config:updated', { detail: res.data?.config }));
      }
    } catch (err) {
      showError(err.message || 'Failed to update system configuration');
    } finally {
      setSaving(false);
    }
  };

  const handleCreateProduct = async (e) => {
    e.preventDefault();
    if (!productForm.name || !productForm.price) {
      showError('Please enter product name and price');
      return;
    }

    setSubmittingProduct(true);
    try {
      const res = await api.createProduct({
        name: productForm.name.trim(),
        category: productForm.category,
        unit: productForm.unit.trim().toLowerCase(),
        price: parseFloat(productForm.price),
        status: 'ACTIVE'
      });

      if (res.success) {
        showSuccess(`Product "${res.data.product.name}" created!`);
        setShowAddProductModal(false);
        setProductForm({ name: '', category: config.categories[0] || 'Milk', unit: 'litre', price: '' });
        fetchConfigAndProducts();
      }
    } catch (err) {
      showError(err.message || 'Failed to add product');
    } finally {
      setSubmittingProduct(false);
    }
  };

  if (!isSuperAdmin) {
    return (
      <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
        Access Restricted: Only Super Administrator can configure system organization details.
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
        Loading enterprise configuration...
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* 1. ORGANIZATION PROFILE SETTINGS */}
      <div className="enterprise-panel">
        <div className="panel-banner-red">
          <h3>
            <Building2 size={16} />
            <span>Organization Branding & Hub Profile</span>
          </h3>
          <button
            type="button"
            className="btn btn-xs btn-outline"
            style={{ background: '#fff', color: 'var(--primary-red)' }}
            onClick={handleSaveConfig}
            disabled={saving}
          >
            <Save size={12} />
            <span>{saving ? 'Saving...' : 'Save Configuration'}</span>
          </button>
        </div>

        <form onSubmit={handleSaveConfig} style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Logo & Name Row */}
          <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>
            {/* Logo Upload Box */}
            <div>
              <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.35rem' }}>
                Organization Logo / Emblem
              </label>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                {config.orgLogo ? (
                  <div style={{ position: 'relative' }}>
                    <img
                      src={config.orgLogo}
                      alt="Dairy Logo"
                      style={{
                        width: '110px',
                        height: '110px',
                        objectFit: 'contain',
                        borderRadius: 'var(--radius-xs)',
                        border: '2px solid var(--border-medium)',
                        padding: '4px',
                        background: '#fff'
                      }}
                    />
                    <button
                      type="button"
                      style={{ position: 'absolute', top: '-6px', right: '-6px', background: '#ef4444', color: '#fff', border: 'none', borderRadius: '50%', width: '20px', height: '20px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      onClick={() => setConfig((prev) => ({ ...prev, orgLogo: '' }))}
                      title="Remove Logo"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ) : (
                  <label className="upload-btn-container" style={{ width: '130px', height: '110px', flexDirection: 'column', justifyContent: 'center' }}>
                    <Upload size={20} />
                    <span style={{ fontSize: '0.75rem', textAlign: 'center' }}>
                      {uploadingLogo ? 'Uploading...' : 'Upload Logo'}
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      style={{ display: 'none' }}
                      onChange={handleLogoUpload}
                      disabled={uploadingLogo}
                    />
                  </label>
                )}
                <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>
                  Appears on QR Passes & Nav
                </span>
              </div>
            </div>

            {/* Profile Fields */}
            <div style={{ flex: 1, minWidth: '280px', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>
                    Organization / Dairy Name *
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. Milky Dairy"
                    value={config.orgName}
                    onChange={(e) => setConfig({ ...config, orgName: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>
                    Tagline / Slogan
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. Pure & Fresh Farm Milk Daily"
                    value={config.tagline}
                    onChange={(e) => setConfig({ ...config, tagline: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>
                    Customer Helpline / Contact Mobile
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. +91 98765 43210"
                    value={config.phone}
                    onChange={(e) => setConfig({ ...config, phone: e.target.value })}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>
                    Headquarters / Dairy Hub Address
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. Central Sector, Dairy Road, Anand"
                    value={config.address}
                    onChange={(e) => setConfig({ ...config, address: e.target.value })}
                  />
                </div>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              <Save size={14} />
              <span>{saving ? 'Saving System Changes...' : 'Save Organization Profile'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* 2. CATEGORIES MANAGEMENT */}
      <div className="enterprise-panel">
        <div className="panel-banner-red">
          <h3>
            <Layers size={16} />
            <span>Milk & Dairy Product Categories</span>
          </h3>
        </div>

        <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
            Define the distribution categories for your enterprise. When adding products and registering transactions, products will be organized under these categories.
          </p>

          {/* Add Category Form */}
          <form onSubmit={handleAddCategory} style={{ display: 'flex', gap: '0.5rem', maxWidth: '420px' }}>
            <input
              type="text"
              className="form-control"
              placeholder="e.g. Full Cream Milk, A2 Cow Milk, Paneer..."
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
            />
            <button type="submit" className="btn btn-primary" disabled={!newCategory.trim()}>
              <Plus size={14} />
              <span>Add</span>
            </button>
          </form>

          {/* Active Category Chips */}
          <div>
            <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.45rem' }}>
              Active Configured Categories ({config.categories.length})
            </label>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {config.categories.map((cat) => (
                <div
                  key={cat}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.45rem',
                    background: '#f8fafc',
                    border: '1px solid var(--border-medium)',
                    borderRadius: 'var(--radius-full)',
                    padding: '0.35rem 0.85rem',
                    fontSize: '0.84rem',
                    fontWeight: 600,
                    color: 'var(--text-heading)'
                  }}
                >
                  <span>{cat}</span>
                  <button
                    type="button"
                    style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', display: 'flex', padding: 0 }}
                    onClick={() => handleRemoveCategory(cat)}
                    title={`Remove ${cat}`}
                  >
                    <X size={13} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 3. QUICK PRODUCT CATALOG MANAGEMENT */}
      <div className="enterprise-panel">
        <div className="panel-banner-red">
          <h3>
            <Package size={16} />
            <span>Product Catalog by Category ({products.length} Products)</span>
          </h3>

          <div style={{ display: 'flex', gap: '0.35rem' }}>
            <button
              type="button"
              className="btn btn-xs btn-outline"
              style={{ background: '#fff', color: 'var(--primary-red)' }}
              onClick={() => {
                setProductForm({
                  name: '',
                  category: config.categories[0] || 'Milk',
                  unit: 'litre',
                  price: ''
                });
                setShowAddProductModal(true);
              }}
            >
              <Plus size={12} />
              <span>+ Add Dairy Product</span>
            </button>
          </div>
        </div>

        <div style={{ padding: '1rem' }}>
          {products.length === 0 ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              No products found. Click "+ Add Dairy Product" to create products under your categories.
            </div>
          ) : (
            <div className="table-responsive">
              <table className="enterprise-table">
                <thead>
                  <tr>
                    <th>S.No.</th>
                    <th>Product Name</th>
                    <th>Category</th>
                    <th>Unit Type</th>
                    <th>Standard Price</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((p, idx) => (
                    <tr key={p._id}>
                      <td style={{ fontWeight: 700, color: 'var(--text-muted)' }}>{idx + 1}</td>
                      <td style={{ fontWeight: 700, color: 'var(--text-heading)' }}>{p.name}</td>
                      <td>
                        <span className="badge-qr-token" style={{ fontSize: '0.72rem' }}>
                          {p.category || 'General'}
                        </span>
                      </td>
                      <td style={{ textTransform: 'capitalize' }}>Per {p.unit}</td>
                      <td style={{ fontWeight: 800, color: '#15803d' }}>₹{p.price}</td>
                      <td>
                        <span className={p.status === 'ACTIVE' ? 'badge-status-green' : 'badge-status-red'}>
                          {p.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Quick Add Product Modal */}
      {showAddProductModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '440px' }}>
            <div className="modal-header">
              <h3>
                <Package size={16} />
                <span>Add Product to Category</span>
              </h3>
              <button type="button" className="close-btn" onClick={() => setShowAddProductModal(false)}>
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateProduct}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>
                    Product Name *
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. Fresh Cow Milk"
                    value={productForm.name}
                    onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>
                    Assigned Category *
                  </label>
                  <select
                    className="form-control"
                    value={productForm.category}
                    onChange={(e) => setProductForm({ ...productForm, category: e.target.value })}
                    required
                  >
                    {config.categories.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>
                      Pricing Unit *
                    </label>
                    <select
                      className="form-control"
                      value={productForm.unit}
                      onChange={(e) => setProductForm({ ...productForm, unit: e.target.value })}
                    >
                      <option value="litre">Litre (L)</option>
                      <option value="pack">Pack / Pouch</option>
                      <option value="kg">Kilogram (kg)</option>
                      <option value="bottle">Bottle</option>
                      <option value="cup">Cup / Tub</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>
                      Price (₹) *
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      className="form-control"
                      placeholder="e.g. 60"
                      value={productForm.price}
                      onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setShowAddProductModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={submittingProduct}>
                  {submittingProduct ? 'Adding...' : 'Save Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
