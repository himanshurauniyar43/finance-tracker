import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { transactionsAPI, categoriesAPI } from '../services/api';

const Transactions = () => {
  const { hasRole } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({ amount: '', type: 'expense', category_id: '', description: '', date: new Date().toISOString().split('T')[0] });
  const [categories, setCategories] = useState([]);
  const [filters, setFilters] = useState({ search: '', type: '', category: '' });
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 1 });

  const canModify = useMemo(() => hasRole(['admin', 'user']), [hasRole]);

  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page: pagination.page, limit: pagination.limit, ...filters };
      Object.keys(params).forEach(k => { if (!params[k]) delete params[k]; });
      const res = await transactionsAPI.getAll(params);
      setTransactions(res.data.data.transactions);
      setPagination(res.data.data.pagination);
    } catch (err) { console.error(err); }
    setLoading(false);
  }, [pagination.page, filters]);

  const fetchCategories = async () => {
    try {
      const res = await categoriesAPI.getAll();
      setCategories(res.data.data);
    } catch (err) { console.error(err); }
  };

  useEffect(() => { fetchTransactions(); fetchCategories(); }, [fetchTransactions]);

  const handleInputChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await transactionsAPI.update(editingId, formData);
      } else {
        await transactionsAPI.create(formData);
      }
      resetForm();
      fetchTransactions();
    } catch (err) { alert(err.response?.data?.message || 'Error'); }
  };

  const handleEdit = (t) => {
    setFormData({
      amount: t.amount,
      type: t.type,
      category_id: t.category_id,
      description: t.description || '',
      date: t.transaction_date?.split('T')[0],
    });
    setEditingId(t.id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this transaction?')) return;
    try { await transactionsAPI.delete(id); fetchTransactions(); } catch (err) { alert('Error'); }
  };

  const resetForm = useCallback(() => {
    setFormData({ amount: '', type: 'expense', category_id: '', description: '', date: new Date().toISOString().split('T')[0] });
    setEditingId(null);
    setShowForm(false);
  }, []);

  const filteredCategories = useMemo(() => {
    return categories.filter(c => c.type === formData.type);
  }, [categories, formData.type]);

  const handlePageChange = useCallback((newPage) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  }, []);

  return (
    <div>
      <div className="flex justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Transactions</h1>
        {canModify && (
          <button onClick={() => { resetForm(); setShowForm(!showForm); }} className="bg-blue-600 text-white px-4 py-2 rounded-lg">
            {showForm ? 'Cancel' : '+ Add Transaction'}
          </button>
        )}
      </div>

      {showForm && canModify && (
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Type</label>
            <select name="type" value={formData.type} onChange={handleInputChange} className="w-full p-2 border rounded">
              <option value="expense">Expense</option>
              <option value="income">Income</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Amount (₹)</label>
            <input type="number" name="amount" value={formData.amount} onChange={handleInputChange} required className="w-full p-2 border rounded" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Category</label>
            <select name="category_id" value={formData.category_id} onChange={handleInputChange} required className="w-full p-2 border rounded">
              <option value="">Select</option>
              {filteredCategories.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Date</label>
            <input type="date" name="date" value={formData.date} onChange={handleInputChange} required className="w-full p-2 border rounded" />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-1">Description</label>
            <input type="text" name="description" value={formData.description} onChange={handleInputChange} className="w-full p-2 border rounded" />
          </div>
          <div className="flex items-end gap-2">
            <button type="submit" className="bg-green-600 text-white px-6 py-2 rounded">{editingId ? 'Update' : 'Save'}</button>
            <button type="button" onClick={resetForm} className="bg-gray-300 px-4 py-2 rounded">Cancel</button>
          </div>
        </form>
      )}

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow mb-4 flex gap-3 flex-wrap">
        <input type="text" name="search" placeholder="Search..." value={filters.search} onChange={e => { setFilters({...filters, search: e.target.value}); setPagination(p => ({...p, page: 1})); }} className="p-2 border rounded" />
        <select name="type" value={filters.type} onChange={e => { setFilters({...filters, type: e.target.value}); setPagination(p => ({...p, page: 1})); }} className="p-2 border rounded">
          <option value="">All Types</option>
          <option value="income">Income</option>
          <option value="expense">Expense</option>
        </select>
        <select name="category" value={filters.category} onChange={e => { setFilters({...filters, category: e.target.value}); setPagination(p => ({...p, page: 1})); }} className="p-2 border rounded">
          <option value="">All Categories</option>
          {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="p-3 text-left text-sm font-medium text-gray-500">Date</th>
              <th className="p-3 text-left text-sm font-medium text-gray-500">Category</th>
              <th className="p-3 text-left text-sm font-medium text-gray-500">Description</th>
              <th className="p-3 text-right text-sm font-medium text-gray-500">Amount</th>
              {canModify && <th className="p-3 text-right text-sm font-medium text-gray-500">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="text-center p-6">Loading...</td></tr>
            ) : transactions.length === 0 ? (
              <tr><td colSpan={5} className="text-center p-6 text-gray-500">No transactions found</td></tr>
            ) : (
              transactions.map(t => (
                <tr key={t.id} className="border-t hover:bg-gray-50">
                  <td className="p-3">{new Date(t.transaction_date).toLocaleDateString()}</td>
                  <td className="p-3">{t.category_icon} {t.category_name}</td>
                  <td className="p-3 text-gray-600">{t.description || '-'}</td>
                  <td className={`p-3 text-right font-semibold ${t.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                    {t.type === 'income' ? '+' : '-'}₹{parseFloat(t.amount).toLocaleString()}
                  </td>
                  {canModify && (
                    <td className="p-3 text-right">
                      <button onClick={() => handleEdit(t)} className="text-blue-600 mr-3 hover:text-blue-800">✏️</button>
                      <button onClick={() => handleDelete(t.id)} className="text-red-600 hover:text-red-800">🗑️</button>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
        {pagination.totalPages > 1 && (
          <div className="p-3 bg-gray-50 flex justify-between items-center">
            <p className="text-sm text-gray-600">Page {pagination.page} of {pagination.totalPages}</p>
            <div className="flex gap-2">
              <button onClick={() => handlePageChange(pagination.page - 1)} disabled={pagination.page === 1} className="px-3 py-1 border rounded disabled:opacity-50">Prev</button>
              <button onClick={() => handlePageChange(pagination.page + 1)} disabled={pagination.page >= pagination.totalPages} className="px-3 py-1 border rounded disabled:opacity-50">Next</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Transactions;