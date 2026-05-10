import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';

const Layout = () => {
  const { user, logout } = useAuth();
  const { darkMode, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: '📊', roles: ['admin', 'user', 'read-only'] },
    { path: '/transactions', label: 'Transactions', icon: '💳', roles: ['admin', 'user', 'read-only'] },
  ];

  return (
    <div className={`flex h-screen ${darkMode ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-800'}`}>
      {/* Sidebar */}
      <aside className={`w-64 flex flex-col ${darkMode ? 'bg-gray-800' : 'bg-gray-800 text-white'}`}>
        <div className="p-4 border-b border-gray-700">
          <h1 className="text-xl font-bold text-white">💰 Finance Tracker</h1>
          <p className="text-sm text-gray-400 mt-1">
            {user?.username} <span className="text-xs bg-gray-600 px-2 py-0.5 rounded">{user?.role}</span>
          </p>
          <button
            onClick={toggleTheme}
            className="mt-3 w-full text-sm bg-gray-600 hover:bg-gray-500 px-3 py-1.5 rounded transition-colors text-white"
          >
            {darkMode ? '☀️ Light Mode' : '🌙 Dark Mode'}
          </button>
        </div>

        <nav className="flex-1 p-4">
          <ul className="space-y-2">
            {navItems.map((item) => (
              item.roles.includes(user?.role) && (
                <li key={item.path}>
                  <NavLink
                    to={item.path}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-4 py-2 rounded-lg transition-colors text-white ${
                        isActive ? 'bg-blue-600' : 'hover:bg-gray-700'
                      }`
                    }
                  >
                    <span>{item.icon}</span>
                    <span>{item.label}</span>
                  </NavLink>
                </li>
              )
            ))}
          </ul>
        </nav>

        <div className="p-4 border-t border-gray-700">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-4 py-2 text-gray-300 hover:bg-red-600 rounded-lg transition-colors"
          >
            <span>🚪</span>
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className={`flex-1 overflow-auto p-6 ${darkMode ? 'bg-gray-900' : 'bg-gray-100'}`}>
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;