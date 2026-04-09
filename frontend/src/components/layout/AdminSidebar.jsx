import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard, Users, Home, DollarSign, MessageSquare,
  Settings, ShieldAlert, LogOut, ChevronLeft, ChevronRight,
  Menu, Search, User, X, MapPin, Trash2, CheckCircle, XCircle,
  Phone, Mail, Calendar, Shield, Eye,
} from 'lucide-react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { Link } from 'react-router-dom';
import NotificationBell from './NotificationBell';

// ── Confirm Modal ──────────────────────────────────────────────────────────────
const ConfirmModal = ({ isOpen, title, message, confirmLabel, confirmColor, onConfirm, onCancel }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-5 sm:p-6 w-full max-w-sm mx-4">
        <h2 className="text-[15px] font-bold text-[#2d3a1e] mb-2">{title}</h2>
        <p className="text-[13px] text-[#9a9476] mb-6">{message}</p>
        <div className="flex flex-col-reverse sm:flex-row gap-3">
          <button
            onClick={onCancel}
            className="flex-1 h-10 rounded-xl border border-[#d6cebc] text-[#3d5028] text-sm font-medium hover:bg-[#f5f3ec] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 h-10 rounded-xl text-white text-sm font-bold transition-colors ${confirmColor}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

// ── User Detail Modal ──────────────────────────────────────────────────────────
const UserDetailModal = ({ user, onClose }) => {
  if (!user) return null;

  const roleColors = {
    host:  { bg: 'bg-[#e8ecd8]', text: 'text-[#3d5028]' },
    admin: { bg: 'bg-[#fef3c7]', text: 'text-[#92400e]' },
    guest: { bg: 'bg-[#f0f0e4]', text: 'text-[#6b6b52]' },
  };
  const rc = roleColors[user.role] || roleColors.guest;

  const initials = user.name
    ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : 'U';

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-[#2d3a1e] px-4 py-4 sm:px-6 sm:py-5 flex items-center justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-[#6b8c3e] flex items-center justify-center text-white text-[15px] font-bold shrink-0">
              {initials}
            </div>
            <div className="min-w-0">
              <p className="text-white font-semibold text-[15px] truncate">{user.name}</p>
              <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${rc.bg} ${rc.text}`}>
                {user.role}
              </span>
            </div>
          </div>
          <button onClick={onClose} className="text-[#8aab5c] hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 sm:p-6 space-y-4 overflow-y-auto">
          {/* Info rows */}
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-[13px]">
              <div className="w-8 h-8 rounded-[7px] bg-[#f0f0e4] flex items-center justify-center shrink-0">
                <Mail className="w-3.5 h-3.5 text-[#6b8c3e]" />
              </div>
              <div>
                <p className="text-[10px] text-[#9a9476] mb-0.5">Email</p>
                <p className="text-[#2d3a1e] font-medium">{user.email || '—'}</p>
              </div>
            </div>

            {user.phone && (
              <div className="flex items-center gap-3 text-[13px]">
                <div className="w-8 h-8 rounded-[7px] bg-[#f0f0e4] flex items-center justify-center shrink-0">
                  <Phone className="w-3.5 h-3.5 text-[#6b8c3e]" />
                </div>
                <div>
                  <p className="text-[10px] text-[#9a9476] mb-0.5">Phone</p>
                  <p className="text-[#2d3a1e] font-medium">{user.phone}</p>
                </div>
              </div>
            )}

            <div className="flex items-center gap-3 text-[13px]">
              <div className="w-8 h-8 rounded-[7px] bg-[#f0f0e4] flex items-center justify-center shrink-0">
                <Shield className="w-3.5 h-3.5 text-[#6b8c3e]" />
              </div>
              <div>
                <p className="text-[10px] text-[#9a9476] mb-0.5">Role</p>
                <p className="text-[#2d3a1e] font-medium capitalize">{user.role}</p>
              </div>
            </div>

            {user.createdAt && (
              <div className="flex items-center gap-3 text-[13px]">
                <div className="w-8 h-8 rounded-[7px] bg-[#f0f0e4] flex items-center justify-center shrink-0">
                  <Calendar className="w-3.5 h-3.5 text-[#6b8c3e]" />
                </div>
                <div>
                  <p className="text-[10px] text-[#9a9476] mb-0.5">Joined</p>
                  <p className="text-[#2d3a1e] font-medium">
                    {new Date(user.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </p>
                </div>
              </div>
            )}

            {user.address && (
              <div className="flex items-center gap-3 text-[13px]">
                <div className="w-8 h-8 rounded-[7px] bg-[#f0f0e4] flex items-center justify-center shrink-0">
                  <MapPin className="w-3.5 h-3.5 text-[#6b8c3e]" />
                </div>
                <div>
                  <p className="text-[10px] text-[#9a9476] mb-0.5">Address</p>
                  <p className="text-[#2d3a1e] font-medium">{user.address}</p>
                </div>
              </div>
            )}
          </div>

          {/* User ID */}
          <div className="pt-3 border-t border-[#ece8de]">
            <p className="text-[10px] text-[#9a9476] mb-1">User ID</p>
            <p className="text-[11px] font-mono text-[#6b6b52] bg-[#f5f3ec] px-3 py-1.5 rounded-[6px] break-all">{user._id}</p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 pb-4 sm:px-6 sm:pb-5 pt-1">
          <button
            onClick={onClose}
            className="w-full h-10 rounded-xl border border-[#d6cebc] text-[#3d5028] text-sm font-medium hover:bg-[#f5f3ec] transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Filter Pills ───────────────────────────────────────────────────────────────
const FilterPills = ({ options, active, onChange }) => (
  <div className="flex flex-wrap gap-1.5">
    {options.map((opt) => (
      <button
        key={opt.value}
        onClick={() => onChange(opt.value)}
        className={`px-3 py-1 text-[11px] font-medium rounded-full border transition-colors ${
          active === opt.value
            ? 'bg-[#2d3a1e] text-white border-[#2d3a1e]'
            : 'bg-white text-[#6b6b52] border-[#d6cebc] hover:border-[#6b8c3e] hover:text-[#3d5028]'
        }`}
      >
        {opt.label}
      </button>
    ))}
  </div>
);

const MobileField = ({ label, value, valueClassName = '' }) => (
  <div className="min-w-0">
    <p className="text-[10px] uppercase tracking-[0.12em] text-[#9a9476]">{label}</p>
    <div className={`mt-1 text-[12px] text-[#2d3a1e] ${valueClassName}`}>{value}</div>
  </div>
);

// ── Main Component ─────────────────────────────────────────────────────────────
const AdminSidebar = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed]     = useState(false);
  const [activeTab, setActiveTab]         = useState('Dashboard');

  const [users, setUsers]           = useState([]);
  const [properties, setProperties] = useState([]);
  const [bookings, setBookings]     = useState([]);

  // ── Filter state ───────────────────────────────
  const [userRoleFilter,     setUserRoleFilter]     = useState('all');
  const [propertyStatusFilter, setPropertyStatusFilter] = useState('all');
  const [bookingStatusFilter,  setBookingStatusFilter]  = useState('all');

  // ── Modal state ────────────────────────────────
  const [modal, setModal] = useState({ isOpen: false, title: '', message: '', confirmLabel: '', confirmColor: '', onConfirm: null });
  const closeModal = () => setModal((prev) => ({ ...prev, isOpen: false }));

  // ── User detail modal ──────────────────────────
  const [selectedUser, setSelectedUser] = useState(null);

  const menuItems = [
    { name: 'Dashboard', icon: LayoutDashboard },
    { name: 'Users',     icon: Users },
    { name: 'Listings',  icon: Home },
    { name: 'Bookings',  icon: DollarSign },
    { name: 'Disputes',  icon: ShieldAlert },
    { name: 'Messages',  icon: MessageSquare },
    { name: 'Settings',  icon: Settings },
  ];

  // ── Fetch ──────────────────────────────────────
  const getAllUsers = async () => {
    try {
      const res = await axios.get('/user');
      setUsers(res.data.data);
    } catch {
      toast.error('Error fetching users');
    }
  };

  const getAllProperties = async () => {
    try {
      const res = await axios.get('/property');
      setProperties(res.data.data);
    } catch {
      toast.error('Error fetching properties');
    }
  };

  const getAllBookings = async () => {
    try {
      const res = await axios.get('/booking');
      setBookings(res.data.data);
    } catch {
      toast.error('Error fetching bookings');
    }
  };

  useEffect(() => {
    let isMounted = true;

    Promise.allSettled([
      axios.get('/user'),
      axios.get('/property'),
      axios.get('/booking'),
    ]).then(([usersResult, propertiesResult, bookingsResult]) => {
      if (!isMounted) return;

      if (usersResult.status === 'fulfilled') {
        setUsers(usersResult.value.data.data);
      } else {
        toast.error('Error fetching users');
      }

      if (propertiesResult.status === 'fulfilled') {
        setProperties(propertiesResult.value.data.data);
      } else {
        toast.error('Error fetching properties');
      }

      if (bookingsResult.status === 'fulfilled') {
        setBookings(bookingsResult.value.data.data);
      } else {
        toast.error('Error fetching bookings');
      }
    });

    return () => {
      isMounted = false;
    };
  }, []);

  // ── Filtered data ──────────────────────────────
  const filteredUsers = userRoleFilter === 'all'
    ? users
    : users.filter(u => u.role === userRoleFilter);

  const filteredProperties = propertyStatusFilter === 'all'
    ? properties
    : properties.filter(p => p.status === propertyStatusFilter);

  const filteredBookings = bookingStatusFilter === 'all'
    ? bookings
    : bookings.filter(b => b.status === bookingStatusFilter);

  // ── Delete ─────────────────────────────────────
  const deleteUser = async (id) => {
    if (!window.confirm('Delete this user?')) return;
    try {
      await axios.delete(`/user/${id}`);
      toast.success('User deleted');
      getAllUsers();
    } catch {
      toast.error('Error deleting user');
    }
  };

  const deleteProperty = async (id) => {
    if (!window.confirm('Delete this property?')) return;
    try {
      await axios.delete(`/property/${id}`);
      toast.success('Property deleted');
      getAllProperties();
    } catch {
      toast.error('Error deleting property');
    }
  };

  const deleteBooking = async (id) => {
    if (!window.confirm('Delete this booking?')) return;
    try {
      await axios.delete(`/booking/${id}`);
      toast.success('Booking deleted');
      getAllBookings();
    } catch {
      toast.error('Error deleting booking');
    }
  };

  // ── Approve / Reject listing ───────────────────
  const updatePropertyStatus = (id, status) => {
    const isApprove = status === 'active';
    setModal({
      isOpen: true,
      title: isApprove ? 'Approve Listing?' : 'Reject Listing?',
      message: isApprove
        ? 'This listing will be made visible to all users.'
        : 'This listing will be marked as inactive.',
      confirmLabel: isApprove ? 'Yes, Approve' : 'Yes, Reject',
      confirmColor: isApprove ? 'bg-[#6b8c3e] hover:bg-[#5a7a30]' : 'bg-orange-500 hover:bg-orange-600',
      onConfirm: async () => {
        closeModal();
        try {
          await axios.put(`/property/${id}/status`, { status });
          toast.success(isApprove ? 'Listing approved ✅' : 'Listing rejected ❌');
          getAllProperties();
        } catch {
          toast.error('Error updating listing status');
        }
      },
    });
  };

  // ── Update booking status ──────────────────────
  const updateBookingStatus = async (id, status) => {
    try {
      await axios.put(`/booking/${id}`, { status });
      toast.success('Booking status updated');
      getAllBookings();
    } catch {
      toast.error('Error updating booking');
    }
  };

  // ── Stats ──────────────────────────────────────
  const totalRevenue = bookings
    .filter((b) => b.status === 'completed' || b.status === 'confirmed')
    .reduce((sum, b) => sum + (b.totalPrice || 0), 0);

  const stats = [
    { label: 'Total Users',      value: users.length,                                         icon: Users },
    { label: 'Active Listings',  value: properties.filter(p => p.status === 'active').length, icon: Home },
    { label: 'Total Bookings',   value: bookings.length,                                       icon: DollarSign },
    { label: 'Pending Bookings', value: bookings.filter(b => b.status === 'pending').length,  icon: ShieldAlert },
    { label: 'Total Revenue',    value: `₹${totalRevenue.toLocaleString('en-IN')}`,            icon: DollarSign },
    { label: 'Pending Listings', value: properties.filter(p => p.status === 'draft').length,  icon: ShieldAlert },
  ];

  return (
    <div className="flex h-screen bg-[#f5f3ec] overflow-hidden font-sans">

      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-20 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed md:relative z-30 h-full bg-[#2d3a1e] text-white flex flex-col transition-all duration-300
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        ${isCollapsed ? 'w-20' : 'w-[88vw] max-w-64 md:w-64'}
      `}>

        {/* Logo */}
        <div className="flex items-center justify-between h-14 px-4 border-b border-[#3d5028]">
          {!isCollapsed && (
            <div className="flex items-center gap-2">
              <div className="bg-[#6b8c3e] p-1.5 rounded-[7px]">
                <Home className="w-4 h-4 text-white" />
              </div>
              <span className="text-[15px] font-medium">
                Admin<span className="text-[#a3c46a]">Panel</span>
              </span>
            </div>
          )}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hidden md:block p-1 rounded hover:bg-[#3d5028] text-[#8aab5c]"
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
          <button onClick={() => setIsSidebarOpen(false)} className="md:hidden text-[#8aab5c]">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-0.5">
          {menuItems.map((item) => (
            <button
              key={item.name}
              onClick={() => { setActiveTab(item.name); setIsSidebarOpen(false); }}
              className={`
                w-full flex items-center px-3 py-2.5 text-[13px] font-medium rounded-[8px] transition-all
                ${activeTab === item.name
                  ? 'bg-[#6b8c3e] text-white'
                  : 'text-[#a3c46a] hover:bg-[#3d5028] hover:text-white'}
              `}
            >
              <item.icon className="w-4 h-4 shrink-0" />
              {!isCollapsed && <span className="ml-2.5">{item.name}</span>}
            </button>
          ))}
        </nav>

        {/* Footer */}
        <div className="p-3 border-t border-[#3d5028]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-[#6b8c3e] flex items-center justify-center text-white text-[12px] font-medium shrink-0">
              A
            </div>
            {!isCollapsed && (
              <>
                <div>
                  <p className="text-[12px] font-medium text-white">Admin User</p>
                  <p className="text-[10px] text-[#8aab5c]">Super Admin</p>
                </div>
                <button className="ml-auto text-[#8aab5c] hover:text-white">
                  <LogOut className="w-4 h-4" />
                </button>
              </>
            )}
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* Top Header */}
        <header className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-5 bg-white border-b border-[#e0dbd0] z-10">
          <div className="flex min-w-0 items-center gap-3">
            <button onClick={() => setIsSidebarOpen(true)} className="md:hidden text-[#9a9476]">
              <Menu className="w-5 h-5" />
            </button>
            <div className="hidden lg:flex items-center bg-[#f5f3ec] rounded-[8px] px-3 h-[34px] w-56 border border-[#d6cebc]">
              <Search className="w-3.5 h-3.5 text-[#9a9476]" />
              <input
                type="text"
                placeholder="Search..."
                className="bg-transparent border-none outline-none text-[13px] ml-2 w-full text-[#4a5020] placeholder-[#9a9476]"
              />
            </div>
            <h1 className="truncate text-[15px] font-medium text-[#2d3a1e]">
              {activeTab}
            </h1>
          </div>
          <div className="ml-auto flex items-center gap-2 sm:gap-3">
            <NotificationBell
              enabled
              storageKey="notifications_seen_admin"
              title="Admin notifications"
              buttonClassName="relative text-[#9a9476] transition-colors hover:text-[#6b8c3e]"
              iconClassName="h-5 w-5"
              badgeClassName="absolute -right-1 -top-1 inline-flex min-h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[#6b8c3e] px-1 text-[10px] font-bold text-white"
            />
            <Link
              to="/messages"
              className="hidden md:inline-flex items-center gap-2 rounded-[8px] border border-[#d6cebc] bg-[#f5f3ec] px-3 py-2 text-[12px] font-medium text-[#3d5028] hover:bg-[#e8ecd8]"
            >
              <MessageSquare className="w-3.5 h-3.5 text-[#6b8c3e]" />
              Open Messages
            </Link>
            <div className="w-8 h-8 rounded-full bg-[#e8ecd8] flex items-center justify-center border border-[#c5c9a0]">
              <User className="w-4 h-4 text-[#6b8c3e]" />
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto bg-[#f5f3ec] p-3 sm:p-4 lg:p-5">
          <div className="max-w-7xl mx-auto space-y-5">

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
              {stats.map((stat, i) => (
                <div key={i} className="bg-white rounded-[10px] p-4 border border-[#e0dbd0]">
                  <p className="text-[11px] text-[#9a9476] mb-1">{stat.label}</p>
                  <div className="flex items-end justify-between">
                    <p className="pr-3 text-[20px] sm:text-[22px] font-medium text-[#2d3a1e] break-words">{stat.value}</p>
                    <div className="w-[30px] h-[30px] rounded-[7px] bg-[#f0f0e4] flex items-center justify-center">
                      <stat.icon className="w-3.5 h-3.5 text-[#6b8c3e]" />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* ── USERS TABLE ── */}
            {(activeTab === 'Dashboard' || activeTab === 'Users') && (
              <div className="bg-white rounded-[12px] border border-[#e0dbd0] overflow-hidden">
                <div className="px-4 py-3.5 sm:px-5 border-b border-[#ece8de]">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <h3 className="text-[13px] font-medium text-[#2d3a1e]">Users</h3>
                      <span className="text-[11px] text-[#9a9476]">{filteredUsers.length} of {users.length}</span>
                    </div>
                    {/* Filter Pills */}
                    <FilterPills
                      active={userRoleFilter}
                      onChange={setUserRoleFilter}
                      options={[
                        { label: 'All',   value: 'all' },
                        { label: 'Host',  value: 'host' },
                        { label: 'Guest', value: 'guest' },
                        { label: 'Admin', value: 'admin' },
                      ]}
                    />
                  </div>
                </div>
                <div className="md:hidden divide-y divide-[#f0ece4]">
                  {filteredUsers.map((user) => (
                    <div
                      key={user._id}
                      className="space-y-4 px-4 py-4"
                      onClick={() => setSelectedUser(user)}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-[14px] font-semibold text-[#2d3a1e] truncate">{user.name}</p>
                          <p className="mt-1 text-[12px] text-[#7c755e] break-all">{user.email}</p>
                        </div>
                        <span className={`shrink-0 px-2 py-1 rounded-full text-[10px] font-medium ${
                          user.role === 'host'
                            ? 'bg-[#e8ecd8] text-[#3d5028]'
                            : user.role === 'admin'
                            ? 'bg-[#fef3c7] text-[#92400e]'
                            : 'bg-[#f0f0e4] text-[#6b6b52]'
                        }`}>
                          {user.role}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-2" onClick={e => e.stopPropagation()}>
                        <button
                          onClick={() => setSelectedUser(user)}
                          className="inline-flex h-9 items-center gap-2 rounded-lg border border-[#d6cebc] px-3 text-[12px] font-medium text-[#3d5028] hover:bg-[#f5f3ec]"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          View
                        </button>
                        <Link
                          to={`/messages?userId=${user._id}`}
                          className="inline-flex h-9 items-center gap-2 rounded-lg border border-[#d6cebc] px-3 text-[12px] font-medium text-[#3d5028] hover:bg-[#f5f3ec]"
                        >
                          <MessageSquare className="w-3.5 h-3.5 text-[#6b8c3e]" />
                          Message
                        </Link>
                        <button
                          onClick={() => deleteUser(user._id)}
                          className="inline-flex h-9 items-center gap-2 rounded-lg border border-[#f1d1d1] px-3 text-[12px] font-medium text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                  {filteredUsers.length === 0 && (
                    <div className="px-4 py-8 text-center text-[#9a9476] text-[12px]">
                      {users.length === 0 ? 'No users yet' : `No ${userRoleFilter} users found`}
                    </div>
                  )}
                </div>
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-left text-[12px] text-[#4a5020]">
                    <thead className="bg-[#faf9f4] text-[#9a9476] text-[11px]">
                      <tr>
                        <th className="px-5 py-2.5">Name</th>
                        <th className="px-5 py-2.5">Email</th>
                        <th className="px-5 py-2.5">Role</th>
                        <th className="px-5 py-2.5">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#f0ece4]">
                      {filteredUsers.map((user) => (
                        <tr
                          key={user._id}
                          className="hover:bg-[#faf9f4] cursor-pointer"
                          onClick={() => setSelectedUser(user)}
                        >
                          <td className="px-5 py-3 font-medium text-[#2d3a1e]">{user.name}</td>
                          <td className="px-5 py-3">{user.email}</td>
                          <td className="px-5 py-3">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                              user.role === 'host'
                                ? 'bg-[#e8ecd8] text-[#3d5028]'
                                : user.role === 'admin'
                                ? 'bg-[#fef3c7] text-[#92400e]'
                                : 'bg-[#f0f0e4] text-[#6b6b52]'
                            }`}>
                              {user.role}
                            </span>
                          </td>
                          <td className="px-5 py-3">
                            <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                              {/* View detail */}
                              <button
                                onClick={() => setSelectedUser(user)}
                                className="text-[#6b8c3e] hover:text-[#3d5028] transition-colors"
                                title="View details"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>
                              <Link
                                to={`/messages?userId=${user._id}`}
                                className="text-[#6b8c3e] hover:text-[#3d5028] transition-colors"
                                title="Message user"
                              >
                                <MessageSquare className="w-3.5 h-3.5" />
                              </Link>
                              {/* Delete */}
                              <button
                                onClick={() => deleteUser(user._id)}
                                className="text-[#c0b898] hover:text-red-500 transition-colors"
                                title="Delete user"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {filteredUsers.length === 0 && (
                        <tr><td colSpan={4} className="px-5 py-8 text-center text-[#9a9476]">
                          {users.length === 0 ? 'No users yet' : `No ${userRoleFilter} users found`}
                        </td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ── PROPERTIES TABLE ── */}
            {(activeTab === 'Dashboard' || activeTab === 'Listings') && (
              <div className="bg-white rounded-[12px] border border-[#e0dbd0] overflow-hidden">
                <div className="px-4 py-3.5 sm:px-5 border-b border-[#ece8de]">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <h3 className="text-[13px] font-medium text-[#2d3a1e]">Listings</h3>
                      <span className="text-[11px] text-[#9a9476]">{filteredProperties.length} of {properties.length}</span>
                    </div>
                    {/* Filter Pills */}
                    <FilterPills
                      active={propertyStatusFilter}
                      onChange={setPropertyStatusFilter}
                      options={[
                        { label: 'All',      value: 'all' },
                        { label: 'Active',   value: 'active' },
                        { label: 'Draft',    value: 'draft' },
                        { label: 'Inactive', value: 'inactive' },
                      ]}
                    />
                  </div>
                </div>
                <div className="md:hidden divide-y divide-[#f0ece4]">
                  {filteredProperties.map((property) => (
                    <div key={property._id} className="space-y-4 px-4 py-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-[14px] font-semibold text-[#2d3a1e]">{property.title}</p>
                          <div className="mt-1 flex items-center gap-1 text-[12px] text-[#7c755e]">
                            <MapPin className="w-3 h-3 text-[#9a9476] shrink-0" />
                            <span className="truncate">{property.location?.city}, {property.location?.country}</span>
                          </div>
                        </div>
                        <span className={`shrink-0 px-2 py-1 rounded-full text-[10px] font-medium ${
                          property.status === 'active'
                            ? 'bg-[#d1f0c4] text-[#2a6310]'
                            : property.status === 'draft'
                            ? 'bg-[#fef3c7] text-[#92400e]'
                            : 'bg-[#f0ece4] text-[#9a9476]'
                        }`}>
                          {property.status}
                        </span>
                      </div>
                      <MobileField
                        label="Price / Night"
                        value={`₹${property.pricePerNight?.toLocaleString('en-IN')}`}
                        valueClassName="font-medium"
                      />
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          onClick={() => updatePropertyStatus(property._id, 'active')}
                          className="inline-flex h-9 items-center gap-2 rounded-lg border border-[#cfe0b4] px-3 text-[12px] font-medium text-[#3d5028] hover:bg-[#f4f8ea]"
                        >
                          <CheckCircle className="w-3.5 h-3.5 text-[#6b8c3e]" />
                          Approve
                        </button>
                        <button
                          onClick={() => updatePropertyStatus(property._id, 'inactive')}
                          className="inline-flex h-9 items-center gap-2 rounded-lg border border-[#f1dcc8] px-3 text-[12px] font-medium text-[#92400e] hover:bg-[#fff7ed]"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          Reject
                        </button>
                        <button
                          onClick={() => deleteProperty(property._id)}
                          className="inline-flex h-9 items-center gap-2 rounded-lg border border-[#f1d1d1] px-3 text-[12px] font-medium text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                  {filteredProperties.length === 0 && (
                    <div className="px-4 py-8 text-center text-[#9a9476] text-[12px]">
                      {properties.length === 0 ? 'No listings yet' : `No ${propertyStatusFilter} listings found`}
                    </div>
                  )}
                </div>
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-left text-[12px] text-[#4a5020]">
                    <thead className="bg-[#faf9f4] text-[#9a9476] text-[11px]">
                      <tr>
                        <th className="px-5 py-2.5">Title</th>
                        <th className="px-5 py-2.5">Location</th>
                        <th className="px-5 py-2.5">Price/Night</th>
                        <th className="px-5 py-2.5">Status</th>
                        <th className="px-5 py-2.5">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#f0ece4]">
                      {filteredProperties.map((property) => (
                        <tr key={property._id} className="hover:bg-[#faf9f4]">
                          <td className="px-5 py-3 font-medium text-[#2d3a1e]">{property.title}</td>
                          <td className="px-5 py-3">
                            <div className="flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-[#9a9476]" />
                              {property.location?.city}, {property.location?.country}
                            </div>
                          </td>
                          <td className="px-5 py-3">₹{property.pricePerNight?.toLocaleString('en-IN')}</td>
                          <td className="px-5 py-3">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                              property.status === 'active'
                                ? 'bg-[#d1f0c4] text-[#2a6310]'
                                : property.status === 'draft'
                                ? 'bg-[#fef3c7] text-[#92400e]'
                                : 'bg-[#f0ece4] text-[#9a9476]'
                            }`}>
                              {property.status}
                            </span>
                          </td>
                          <td className="px-5 py-3">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => updatePropertyStatus(property._id, 'active')}
                                className="text-[#6b8c3e] hover:text-[#3d5028] transition-colors"
                                title="Approve listing"
                              >
                                <CheckCircle className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => updatePropertyStatus(property._id, 'inactive')}
                                className="text-[#b45309] hover:text-[#92400e] transition-colors"
                                title="Reject listing"
                              >
                                <XCircle className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => deleteProperty(property._id)}
                                className="text-[#c0b898] hover:text-red-500 transition-colors"
                                title="Delete listing"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {filteredProperties.length === 0 && (
                        <tr><td colSpan={5} className="px-5 py-8 text-center text-[#9a9476]">
                          {properties.length === 0 ? 'No listings yet' : `No ${propertyStatusFilter} listings found`}
                        </td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ── BOOKINGS TABLE ── */}
            {(activeTab === 'Dashboard' || activeTab === 'Bookings') && (
              <div className="bg-white rounded-[12px] border border-[#e0dbd0] overflow-hidden">
                <div className="px-4 py-3.5 sm:px-5 border-b border-[#ece8de]">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <h3 className="text-[13px] font-medium text-[#2d3a1e]">Bookings</h3>
                      <span className="text-[11px] text-[#9a9476]">{filteredBookings.length} of {bookings.length}</span>
                    </div>
                    {/* Filter Pills */}
                    <FilterPills
                      active={bookingStatusFilter}
                      onChange={setBookingStatusFilter}
                      options={[
                        { label: 'All',       value: 'all' },
                        { label: 'Pending',   value: 'pending' },
                        { label: 'Confirmed', value: 'confirmed' },
                        { label: 'Completed', value: 'completed' },
                      ]}
                    />
                  </div>
                </div>
                <div className="md:hidden divide-y divide-[#f0ece4]">
                  {filteredBookings.map((booking) => (
                    <div key={booking._id} className="space-y-4 px-4 py-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-[14px] font-semibold text-[#2d3a1e]">{booking.guest?.name}</p>
                          <p className="mt-1 text-[12px] text-[#7c755e]">{booking.property?.title}</p>
                        </div>
                        <button
                          onClick={() => deleteBooking(booking._id)}
                          className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[#f1d1d1] text-red-600 hover:bg-red-50"
                          title="Delete booking"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <MobileField value={new Date(booking.checkIn).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} label="Check In" />
                        <MobileField value={new Date(booking.checkOut).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} label="Check Out" />
                        <MobileField value={`₹${booking.totalPrice?.toLocaleString('en-IN')}`} label="Total" valueClassName="font-medium" />
                        <div>
                          <p className="text-[10px] uppercase tracking-[0.12em] text-[#9a9476]">Status</p>
                          <select
                            value={booking.status}
                            onChange={(e) => updateBookingStatus(booking._id, e.target.value)}
                            className="mt-1 w-full text-[11px] border border-[#d6cebc] rounded-[8px] px-2.5 py-2 bg-white text-[#3d5028] outline-none"
                          >
                            <option value="pending">Pending</option>
                            <option value="confirmed">Confirmed</option>
                            <option value="cancelled">Cancelled</option>
                            <option value="completed">Completed</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  ))}
                  {filteredBookings.length === 0 && (
                    <div className="px-4 py-8 text-center text-[#9a9476] text-[12px]">
                      {bookings.length === 0 ? 'No bookings yet' : `No ${bookingStatusFilter} bookings found`}
                    </div>
                  )}
                </div>
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-left text-[12px] text-[#4a5020]">
                    <thead className="bg-[#faf9f4] text-[#9a9476] text-[11px]">
                      <tr>
                        <th className="px-5 py-2.5">Guest</th>
                        <th className="px-5 py-2.5">Property</th>
                        <th className="px-5 py-2.5">Check In</th>
                        <th className="px-5 py-2.5">Check Out</th>
                        <th className="px-5 py-2.5">Total</th>
                        <th className="px-5 py-2.5">Status</th>
                        <th className="px-5 py-2.5">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#f0ece4]">
                      {filteredBookings.map((booking) => (
                        <tr key={booking._id} className="hover:bg-[#faf9f4]">
                          <td className="px-5 py-3 font-medium text-[#2d3a1e]">{booking.guest?.name}</td>
                          <td className="px-5 py-3">{booking.property?.title}</td>
                          <td className="px-5 py-3">{new Date(booking.checkIn).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</td>
                          <td className="px-5 py-3">{new Date(booking.checkOut).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</td>
                          <td className="px-5 py-3 font-medium">₹{booking.totalPrice?.toLocaleString('en-IN')}</td>
                          <td className="px-5 py-3">
                            <select
                              value={booking.status}
                              onChange={(e) => updateBookingStatus(booking._id, e.target.value)}
                              className="text-[11px] border border-[#d6cebc] rounded-[6px] px-2 py-1 bg-white text-[#3d5028] outline-none"
                            >
                              <option value="pending">Pending</option>
                              <option value="confirmed">Confirmed</option>
                              <option value="cancelled">Cancelled</option>
                              <option value="completed">Completed</option>
                            </select>
                          </td>
                          <td className="px-5 py-3">
                            <button
                              onClick={() => deleteBooking(booking._id)}
                              className="text-[#c0b898] hover:text-red-500 transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                      {filteredBookings.length === 0 && (
                        <tr><td colSpan={7} className="px-5 py-8 text-center text-[#9a9476]">
                          {bookings.length === 0 ? 'No bookings yet' : `No ${bookingStatusFilter} bookings found`}
                        </td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

          </div>
        </main>
      </div>

      {/* ── Confirm Modal ── */}
      <ConfirmModal
        isOpen={modal.isOpen}
        title={modal.title}
        message={modal.message}
        confirmLabel={modal.confirmLabel}
        confirmColor={modal.confirmColor}
        onConfirm={modal.onConfirm}
        onCancel={closeModal}
      />

      {/* ── User Detail Modal ── */}
      {selectedUser && (
        <UserDetailModal
          user={selectedUser}
          onClose={() => setSelectedUser(null)}
        />
      )}

    </div>
  );
};

export default AdminSidebar;
