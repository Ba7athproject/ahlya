import React, { useEffect, useState } from 'react';
import { fetchUsers, createUser, updateUser, deleteUser } from '../services/api';
import { Plus, Trash2, Edit2, Check, X, Shield, Lock, ShieldAlert } from 'lucide-react';

const AdminDashboard = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showCreateModal, setShowCreateModal] = useState(false);

    // New User State
    const [newUser, setNewUser] = useState({
        email: '',
        password: '',
        full_name: '',
        is_admin: false,
        is_active: true
    });

    useEffect(() => {
        loadUsers();
    }, []);

    const loadUsers = async () => {
        try {
            setLoading(true);
            const data = await fetchUsers();
            setUsers(data);
            setError('');
        } catch (err) {
            setError('Failed to load users');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateUser = async (e) => {
        e.preventDefault();
        try {
            await createUser(newUser);
            setShowCreateModal(false);
            setNewUser({ email: '', password: '', full_name: '', is_admin: false, is_active: true });
            loadUsers();
        } catch (err) {
            alert(err.message);
        }
    };

    const handleToggleAdmin = async (user) => {
        if (window.confirm(`Change admin status for ${user.email}?`)) {
            try {
                await updateUser(user.id, { is_admin: !user.is_admin });
                loadUsers();
            } catch (err) {
                alert('Failed to update user');
            }
        }
    };

    const handleToggleActive = async (user) => {
        if (window.confirm(`${user.is_active ? 'Deactivate' : 'Activate'} account for ${user.email}?`)) {
            try {
                await updateUser(user.id, { is_active: !user.is_active });
                loadUsers();
            } catch (err) {
                alert('Failed to update user');
            }
        }
    };

    const handleDeleteUser = async (id) => {
        if (window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
            try {
                await deleteUser(id);
                loadUsers();
            } catch (err) {
                alert('Failed to delete user');
            }
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 font-sans" dir="rtl">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                            <Shield className="h-8 w-8 text-emerald-600" />
                            لوحة التحكم بالإدارة
                        </h1>
                        <p className="mt-1 text-sm text-slate-500">إدارة المستخدمين والصلاحيات</p>
                    </div>
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
                    >
                        <Plus className="ml-2 -mr-1 h-5 w-5" />
                        مستخدم جديد
                    </button>
                </div>

                {error && (
                    <div className="mb-4 bg-red-50 border border-red-200 rounded-md p-4 flex items-center gap-3">
                        <ShieldAlert className="h-5 w-5 text-red-500" />
                        <span className="text-sm text-red-700">{error}</span>
                    </div>
                )}

                <div className="bg-white shadow overflow-hidden sm:rounded-lg border border-slate-200">
                    <table className="min-w-full divide-y divide-slate-200">
                        <thead className="bg-slate-50">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                                    المستخدم
                                </th>
                                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                                    الدور
                                </th>
                                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                                    الحالة
                                </th>
                                <th scope="col" className="relative px-6 py-3">
                                    <span className="sr-only">إجراءات</span>
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-slate-200">
                            {users.map((user) => (
                                <tr key={user.id} className="hover:bg-slate-50">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <div className="flex-shrink-0 h-10 w-10">
                                                <span className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold border border-slate-200">
                                                    {user.email[0].toUpperCase()}
                                                </span>
                                            </div>
                                            <div className="mr-4">
                                                <div className="text-sm font-medium text-slate-900">{user.full_name || 'بدون اسم'}</div>
                                                <div className="text-sm text-slate-500">{user.email}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span
                                            onClick={() => handleToggleAdmin(user)}
                                            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full cursor-pointer select-none ${user.is_admin ? 'bg-purple-100 text-purple-800' : 'bg-slate-100 text-slate-800'}`}
                                        >
                                            {user.is_admin ? 'Admin' : 'User'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span
                                            onClick={() => handleToggleActive(user)}
                                            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full cursor-pointer select-none ${user.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}
                                        >
                                            {user.is_active ? 'نشط' : 'معطل'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-left text-sm font-medium">
                                        <button onClick={() => handleDeleteUser(user.id)} className="text-red-600 hover:text-red-900 transition-colors">
                                            <Trash2 className="h-5 w-5" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Create User Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
                    <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                        <div className="fixed inset-0 bg-slate-500 bg-opacity-75 transition-opacity" aria-hidden="true" onClick={() => setShowCreateModal(false)}></div>
                        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
                        <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-right overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">

                            <h3 className="text-lg leading-6 font-medium text-slate-900" id="modal-title">
                                إضافة مستخدم جديد
                            </h3>

                            <form onSubmit={handleCreateUser} className="mt-5 space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700">البريد الإلكتروني</label>
                                    <input
                                        type="email"
                                        required
                                        className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm border p-2"
                                        value={newUser.email}
                                        onChange={e => setNewUser({ ...newUser, email: e.target.value })}
                                        dir="ltr"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700">الاسم الكامل</label>
                                    <input
                                        type="text"
                                        className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm border p-2"
                                        value={newUser.full_name}
                                        onChange={e => setNewUser({ ...newUser, full_name: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700">كلمة المرور</label>
                                    <input
                                        type="password"
                                        required
                                        className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm border p-2"
                                        value={newUser.password}
                                        onChange={e => setNewUser({ ...newUser, password: e.target.value })}
                                        dir="ltr"
                                    />
                                </div>
                                <div className="flex items-center gap-4 mt-4">
                                    <label className="flex items-center">
                                        <input
                                            type="checkbox"
                                            className="rounded border-slate-300 text-emerald-600 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 h-4 w-4"
                                            checked={newUser.is_admin}
                                            onChange={e => setNewUser({ ...newUser, is_admin: e.target.checked })}
                                        />
                                        <span className="mr-2 text-sm text-slate-700">صلاحيات Admin</span>
                                    </label>
                                </div>

                                <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense">
                                    <button
                                        type="submit"
                                        className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-emerald-600 text-base font-medium text-white hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 sm:col-start-2 sm:text-sm"
                                    >
                                        إضافة
                                    </button>
                                    <button
                                        type="button"
                                        className="mt-3 w-full inline-flex justify-center rounded-md border border-slate-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 sm:mt-0 sm:col-start-1 sm:text-sm"
                                        onClick={() => setShowCreateModal(false)}
                                    >
                                        إلغاء
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminDashboard;
