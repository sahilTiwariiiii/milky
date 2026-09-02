const API_BASE = import.meta.env.VITE_API_URL || '/api';

export const api = {
  getToken() {
    return localStorage.getItem('token');
  },

  setToken(token) {
    if (token) {
      localStorage.setItem('token', token);
    } else {
      localStorage.removeItem('token');
    }
  },

  async request(endpoint, options = {}) {
    const token = this.getToken();
    const headers = {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers
    };

    const config = {
      ...options,
      headers
    };

    try {
      const res = await fetch(`${API_BASE}${endpoint}`, config);
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        const error = new Error(data.message || 'An unexpected error occurred');
        error.status = res.status;
        error.errors = data.errors;
        throw error;
      }

      return data;
    } catch (err) {
      if (err.status === 401 && !endpoint.includes('/auth/login')) {
        this.setToken(null);
        window.dispatchEvent(new CustomEvent('auth:expired'));
      }
      throw err;
    }
  },

  // Auth endpoints
  login(email, password) {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
  },

  getMe() {
    return this.request('/auth/me');
  },

  logout() {
    return this.request('/auth/logout', { method: 'POST' });
  },

  // Admin endpoints (Super Admin)
  getAdmins(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/admins${query ? `?${query}` : ''}`);
  },

  getAdminById(id) {
    return this.request(`/admins/${id}`);
  },

  createAdmin(adminData) {
    return this.request('/admins', {
      method: 'POST',
      body: JSON.stringify(adminData)
    });
  },

  updateAdmin(id, adminData) {
    return this.request(`/admins/${id}`, {
      method: 'PUT',
      body: JSON.stringify(adminData)
    });
  },

  deleteAdmin(id) {
    return this.request(`/admins/${id}`, {
      method: 'DELETE'
    });
  },

  // Customer endpoints
  getCustomers(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/customers${query ? `?${query}` : ''}`);
  },

  getCustomerById(id) {
    return this.request(`/customers/${id}`);
  },

  getCustomerByQr(qrToken) {
    return this.request(`/customers/qr/${encodeURIComponent(qrToken.trim())}`);
  },

  createCustomer(customerData) {
    return this.request('/customers', {
      method: 'POST',
      body: JSON.stringify(customerData)
    });
  },

  updateCustomer(id, customerData) {
    return this.request(`/customers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(customerData)
    });
  },

  deleteCustomer(id) {
    return this.request(`/customers/${id}`, {
      method: 'DELETE'
    });
  },

  regenerateQr(customerId) {
    return this.request(`/customers/${customerId}/regenerate-qr`, {
      method: 'POST'
    });
  },

  getCustomerTransactions(customerId, params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/customers/${customerId}/transactions${query ? `?${query}` : ''}`);
  },

  // Product endpoints
  getProducts(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/products${query ? `?${query}` : ''}`);
  },

  createProduct(productData) {
    return this.request('/products', {
      method: 'POST',
      body: JSON.stringify(productData)
    });
  },

  updateProduct(id, productData) {
    return this.request(`/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(productData)
    });
  },

  deleteProduct(id) {
    return this.request(`/products/${id}`, {
      method: 'DELETE'
    });
  },

  // Transaction endpoints
  recordTransaction(transactionData) {
    return this.request('/transactions', {
      method: 'POST',
      body: JSON.stringify(transactionData)
    });
  },

  getTransactions(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/transactions${query ? `?${query}` : ''}`);
  },

  getTransactionById(id) {
    return this.request(`/transactions/${id}`);
  }
};
