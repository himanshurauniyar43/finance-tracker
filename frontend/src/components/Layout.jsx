import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Layout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="flex h-screen bg-gray-100">
      <aside className="w-64 bg-gray-800 text-white flex flex-col">
        <div className="p-4 border-b border-gray-700">
          <h1 className="text-xl font-bold">Finance Tracker</h1>
          <p className="text-sm text-gray-400">{user?.username} ({user?.role})</p>
        </div>
        <nav className="flex-1 p-4">
          <NavLink to="/dashboard" className={({isActive}) => `block px-4 py-2 rounded ${isActive ? 'bg-blue-600' : 'hover:bg-gray-700'}`}>Dashboard</NavLink>
          <NavLink to="/transactions" className={({isActive}) => `block px-4 py-2 rounded ${isActive ? 'bg-blue-600' : 'hover:bg-gray-700'}`}>Transactions</NavLink>
        </nav>
        <div className="p-4 border-t border-gray-700">
          <button onClick={handleLogout} className="w-full text-left px-4 py-2 hover:bg-red-600 rounded">Logout</button>
        </div>
      </aside>
      <main className="flex-1 overflow-auto p-6">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;