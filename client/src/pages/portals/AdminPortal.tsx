import React, { useState, useEffect } from 'react';
import { Navbar } from '../../components/layout/Navbar';
import api from '../../api/authClient';
import { User, UserRole } from '../../types/auth';
import {
  Users,
  History,
  RefreshCw,
} from 'lucide-react';

export const AdminPortal: React.FC = () => {
  const [usersList, setUsersList] = useState<User[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const loadAdminData = async () => {
    setLoading(true);
    try {
      const [usersRes, logsRes] = await Promise.all([
        api.get('/api/admin/users'),
        api.get('/api/admin/audit-logs'),
      ]);
      setUsersList(usersRes.data.users || []);
      setAuditLogs(logsRes.data.logs || []);
    } catch (err: any) {
      console.error('Failed to load admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdminData();
  }, []);

  const handleRoleUpdate = async (userId: string | number, newRole: UserRole) => {
    try {
      await api.patch(`/api/admin/users/${String(userId)}/role`, { role: newRole });
      setActionMessage(`Updated user role to ${newRole}`);
      loadAdminData();
    } catch (err: any) {
      setActionMessage(`Failed: ${err.response?.data?.message || err.message}`);
    }
  };

  const handleStatusToggle = async (userId: string | number, currentStatus?: boolean) => {
    try {
      await api.patch(`/api/admin/users/${String(userId)}/status`, { isActive: !currentStatus });
      setActionMessage(`Updated user status`);
      loadAdminData();
    } catch (err: any) {
      setActionMessage(`Failed: ${err.response?.data?.message || err.message}`);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-900">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-700 text-xs font-bold border border-purple-200">
              <span>ADMINISTRATIVE GOVERNANCE</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
              System Administration
            </h1>
            <p className="text-xs text-slate-500">
              Manage multi-agency users, inspect authorization logs, and govern portal access.
            </p>
          </div>

          <button
            onClick={loadAdminData}
            disabled={loading}
            className="px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 font-bold text-xs shadow-sm hover:bg-slate-50 transition-colors flex items-center space-x-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh Telemetry</span>
          </button>
        </div>

        {actionMessage && (
          <div className="p-3.5 rounded-xl bg-purple-50 border border-purple-200 text-purple-800 text-xs font-semibold flex items-center justify-between">
            <span>{actionMessage}</span>
            <button onClick={() => setActionMessage(null)} className="text-purple-600 font-bold">✕</button>
          </div>
        )}

        {/* User Governance Table */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center space-x-2">
              <Users className="w-5 h-5 text-purple-600" />
              <h2 className="text-base font-bold text-slate-900">User Directory & Role Management</h2>
            </div>
            <span className="text-xs text-slate-500 font-bold">{usersList.length} Registered Accounts</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-500 font-semibold">
                  <th className="pb-2">User / Operator</th>
                  <th className="pb-2">Email</th>
                  <th className="pb-2">Assigned Role</th>
                  <th className="pb-2">Status</th>
                  <th className="pb-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {usersList.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50">
                    <td className="py-3 flex items-center space-x-3">
                      <div className="w-7 h-7 rounded-full bg-purple-100 text-purple-700 font-bold flex items-center justify-center text-xs">
                        {u.name?.charAt(0) || 'U'}
                      </div>
                      <div>
                        <div className="font-bold text-slate-900">{u.name}</div>
                        <div className="text-[10px] text-slate-400 font-mono">#{u.id}</div>
                      </div>
                    </td>
                    <td className="py-3 text-slate-600">{u.email}</td>
                    <td className="py-3">
                      <select
                        value={u.role}
                        onChange={(e) => handleRoleUpdate(u.id, e.target.value as UserRole)}
                        className="px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200 text-xs font-bold text-slate-800 focus:outline-none"
                      >
                        <option value="CITIZEN">CITIZEN</option>
                        <option value="TRAFFIC_POLICE">TRAFFIC_POLICE</option>
                        <option value="MUNICIPAL_CORP">MUNICIPAL_CORP</option>
                        <option value="COMMAND_CENTER">COMMAND_CENTER</option>
                      </select>
                    </td>
                    <td className="py-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-extrabold ${
                          u.is_active !== false ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {u.is_active !== false ? 'ACTIVE' : 'DEACTIVATED'}
                      </span>
                    </td>
                    <td className="py-3 text-right">
                      <button
                        onClick={() => handleStatusToggle(u.id, u.is_active)}
                        className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${
                          u.is_active !== false
                            ? 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
                            : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                        }`}
                      >
                        {u.is_active !== false ? 'Deactivate' : 'Reactivate'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Audit Logs Table */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
          <div className="flex items-center space-x-2 border-b border-slate-100 pb-4">
            <History className="w-5 h-5 text-purple-600" />
            <h2 className="text-base font-bold text-slate-900">Platform Security & Audit Trail</h2>
          </div>

          <div className="overflow-x-auto max-h-72">
            <table className="w-full text-left text-xs">
              <thead className="sticky top-0 bg-white">
                <tr className="border-b border-slate-100 text-slate-500 font-semibold">
                  <th className="pb-2">ID</th>
                  <th className="pb-2">Timestamp</th>
                  <th className="pb-2">Action</th>
                  <th className="pb-2">Details</th>
                  <th className="pb-2">User / Actor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50 font-mono">
                    <td className="py-2.5 text-slate-400">#{log.id}</td>
                    <td className="py-2.5 text-slate-500 font-sans text-[11px]">
                      {new Date(log.created_at || Date.now()).toLocaleTimeString()}
                    </td>
                    <td className="py-2.5 font-bold text-slate-900 font-sans">{log.action}</td>
                    <td className="py-2.5 text-slate-600 font-sans truncate max-w-sm">{log.details}</td>
                    <td className="py-2.5 text-slate-500 font-sans text-[11px]">{log.user_name || 'System'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
};
