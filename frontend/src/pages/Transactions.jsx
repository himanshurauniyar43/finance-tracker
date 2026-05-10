import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { transactionsAPI, categoriesAPI } from '../services/api';

const Transactions = () => {
  const { hasRole } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    amount: '', type: 'expense', category_id: '', description: '',
    date: new Date().toISOString().split('T')[0]
  });
  const [categories, setCategories] = useState([]);
  const [filters, setFilters] = useState({ search: '', type: '', category: '' });
  const [pagination, setPagination] = useState({ page: 1, limit: 50, total: 0, totalPages: 1 });

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
    } catch (err) { alert(err.response?.data?.message || 'Error saving transaction'); }
  };

  const handleEdit = useCallback((t) => {
    setFormData({
      amount: t.amount,
      type: t.type,
      category_id: t.category_id,
      description: t.description || '',
      date: t.transaction_date?.split('T')[0],
    });
    setEditingId(t.id);
    setShowForm(true);
  }, []);

  const handleDelete = useCallback(async (id) => {
    if (!confirm('Delete this transaction?')) return;
    try { await transactionsAPI.delete(id); fetchTransactions(); } catch (err) { alert('Error deleting'); }
  }, [fetchTransactions]);

  const resetForm = useCallback(() => {
    setFormData({
      amount: '', type: 'expense', category_id: '', description: '',
      date: new Date().toISOString().split('T')[0]
    });
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
        <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">Transactions</h1>
        {canModify && (
          <button onClick={() => { resetForm(); setShowForm(!showForm); }} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
            {showForm ? 'Cancel' : '+ Add Transaction'}
          </button>
        )}
      </div>

      {showForm && canModify && (
        <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1 dark:text-gray-200">Type</label>
            <select name="type" value={formData.type} onChange={handleInputChange} className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200">
              <option value="expense">Expense</option>
              <option value="income">Income</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 dark:text-gray-200">Amount (₹)</label>
            <input type="number" name="amount" value={formData.amount} onChange={handleInputChange} required min="0.01" step="0.01" className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200" placeholder="0.00" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 dark:text-gray-200">Category</label>
            <select name="category_id" value={formData.category_id} onChange={handleInputChange} required className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200">
              <option value="">Select category</option>
              {filteredCategories.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 dark:text-gray-200">Date</label>
            <input type="date" name="date" value={formData.date} onChange={handleInputChange} required className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200" />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-1 dark:text-gray-200">Description</label>
            <input type="text" name="description" value={formData.description} onChange={handleInputChange} className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200" placeholder="Optional description" />
          </div>
          <div className="flex items-end gap-2">
            <button type="submit" className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700 transition-colors">{editingId ? 'Update' : 'Save'}</button>
            <button type="button" onClick={resetForm} className="bg-gray-300 dark:bg-gray-600 dark:text-gray-200 px-4 py-2 rounded hover:bg-gray-400 transition-colors">Cancel</button>
          </div>
        </form>
      )}

      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow mb-4 flex gap-3 flex-wrap">
        <input type="text" placeholder="Search transactions..." value={filters.search} onChange={e => { setFilters({...filters, search: e.target.value}); setPagination(p => ({...p, page: 1})); }} className="p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 flex-1 min-w-[200px]" />
        <select value={filters.type} onChange={e => { setFilters({...filters, type: e.target.value}); setPagination(p => ({...p, page: 1})); }} className="p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200">
          <option value="">All Types</option>
          <option value="income">Income</option>
          <option value="expense">Expense</option>
        </select>
        <select value={filters.category} onChange={e => { setFilters({...filters, category: e.target.value}); setPagination(p => ({...p, page: 1})); }} className="p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200">
          <option value="">All Categories</option>
          {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Date</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Category</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Description</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Amount</th>
                {canModify && <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {loading ? (
                <tr><td colSpan={canModify ? 5 : 4} className="text-center py-12 dark:text-gray-300">Loading...</td></tr>
              ) : transactions.length === 0 ? (
                <tr><td colSpan={canModify ? 5 : 4} className="text-center py-12 text-gray-500 dark:text-gray-400">No transactions found</td></tr>
              ) : (
                transactions.map(t => (
                  <tr key={t.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                    <td className="px-4 py-3 text-sm dark:text-gray-300 whitespace-nowrap">{new Date(t.transaction_date).toLocaleDateString('en-IN')}</td>
                    <td className="px-4 py-3 text-sm dark:text-gray-300 whitespace-nowrap">{t.category_icon} {t.category_name}</td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{t.description || '-'}</td>
                    <td className={`px-4 py-3 text-sm text-right font-semibold whitespace-nowrap ${t.type === 'income' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                      {t.type === 'income' ? '+' : '-'}₹{parseFloat(t.amount).toLocaleString('en-IN')}
                    </td>
                    {canModify && (
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <button onClick={() => handleEdit(t)} className="text-blue-600 hover:text-blue-800 dark:text-blue-400 mr-3" title="Edit">✏️</button>
                        <button onClick={() => handleDelete(t.id)} className="text-red-600 hover:text-red-800 dark:text-red-400" title="Delete">🗑️</button>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {pagination.totalPages > 1 && (
          <div className="px-4 py-3 bg-gray-50 dark:bg-gray-700 border-t border-gray-200 dark:border-gray-600 flex justify-between items-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">Showing {((pagination.page - 1) * pagination.limit) + 1}-{Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}</p>
            <div className="flex gap-2">
              <button onClick={() => handlePageChange(pagination.page - 1)} disabled={pagination.page === 1} className="px-3 py-1 border rounded disabled:opacity-50 dark:border-gray-600 dark:text-gray-300">← Prev</button>
              <span className="px-3 py-1 text-sm dark:text-gray-300">Page {pagination.page} of {pagination.totalPages}</span>
              <button onClick={() => handlePageChange(pagination.page + 1)} disabled={pagination.page >= pagination.totalPages} className="px-3 py-1 border rounded disabled:opacity-50 dark:border-gray-600 dark:text-gray-300">Next →</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Transactions;