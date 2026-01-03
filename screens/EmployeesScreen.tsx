import React, { useState, useMemo } from 'react';
import { Employee } from '../types';
import {
    Users,
    Search,
    Plus,
    User as UserIcon,
    Mail,
    Phone,
    Trash2,
    Edit,
    X,
    Briefcase,
    Building2,
    Calendar,
    DollarSign,
    MapPin,
    CheckCircle2,
    XCircle,
    Plane
} from 'lucide-react';

interface EmployeesScreenProps {
    employees: Employee[];
    setEmployees: (employees: Employee[]) => void;
}

const EmployeesScreen: React.FC<EmployeesScreenProps> = ({ employees, setEmployees }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [showEmployeeModal, setShowEmployeeModal] = useState(false);
    const [employeeForm, setEmployeeForm] = useState<Partial<Employee>>({});
    const [editingEmployeeId, setEditingEmployeeId] = useState<string | null>(null);
    const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive' | 'vacation'>('all');

    const handleSaveEmployee = (e: React.FormEvent) => {
        e.preventDefault();
        if (!employeeForm.fullName || !employeeForm.cpf || !employeeForm.position) {
            alert('Nome completo, CPF e cargo são obrigatórios!');
            return;
        }

        if (editingEmployeeId) {
            setEmployees(employees.map(emp =>
                emp.id === editingEmployeeId ? { ...emp, ...employeeForm } as Employee : emp
            ));
        } else {
            const newEmployee: Employee = {
                id: Date.now().toString(),
                fullName: employeeForm.fullName || '',
                cpf: employeeForm.cpf || '',
                position: employeeForm.position || '',
                department: employeeForm.department || '',
                email: employeeForm.email || '',
                phone: employeeForm.phone || '',
                salary: employeeForm.salary || 0,
                hireDate: employeeForm.hireDate || new Date().toISOString().split('T')[0],
                status: employeeForm.status || 'active',
                address: employeeForm.address,
                birthDate: employeeForm.birthDate
            };
            setEmployees([...employees, newEmployee]);
        }

        setShowEmployeeModal(false);
        setEmployeeForm({});
        setEditingEmployeeId(null);
    };

    const handleEditEmployee = (employee: Employee) => {
        setEmployeeForm(employee);
        setEditingEmployeeId(employee.id);
        setShowEmployeeModal(true);
    };

    const handleDeleteEmployee = (id: string) => {
        if (confirm('Tem certeza que deseja excluir este funcionário?')) {
            setEmployees(employees.filter(emp => emp.id !== id));
        }
    };

    const filteredEmployees = useMemo(() => {
        return employees.filter(emp => {
            const matchesSearch = emp.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                emp.cpf.includes(searchTerm) ||
                emp.position.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesStatus = filterStatus === 'all' || emp.status === filterStatus;
            return matchesSearch && matchesStatus;
        });
    }, [employees, searchTerm, filterStatus]);

    const stats = useMemo(() => {
        const active = employees.filter(e => e.status === 'active').length;
        const inactive = employees.filter(e => e.status === 'inactive').length;
        const vacation = employees.filter(e => e.status === 'vacation').length;
        const totalSalary = employees.filter(e => e.status === 'active').reduce((acc, e) => acc + e.salary, 0);
        return { active, inactive, vacation, totalSalary };
    }, [employees]);

    const getStatusColor = (status: Employee['status']) => {
        switch (status) {
            case 'active': return 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/10';
            case 'inactive': return 'bg-slate-100 text-slate-600 dark:bg-slate-500/10';
            case 'vacation': return 'bg-blue-100 text-blue-600 dark:bg-blue-500/10';
        }
    };

    const getStatusIcon = (status: Employee['status']) => {
        switch (status) {
            case 'active': return <CheckCircle2 className="w-4 h-4" />;
            case 'inactive': return <XCircle className="w-4 h-4" />;
            case 'vacation': return <Plane className="w-4 h-4" />;
        }
    };

    const getStatusLabel = (status: Employee['status']) => {
        switch (status) {
            case 'active': return 'Ativo';
            case 'inactive': return 'Inativo';
            case 'vacation': return 'Férias';
        }
    };

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">Gestão de Funcionários</h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">Gerencie sua equipe e informações de RH.</p>
                </div>
                <button
                    onClick={() => setShowEmployeeModal(true)}
                    className="flex items-center gap-2 px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold shadow-lg shadow-emerald-500/20 transition-all hover:scale-105 active:scale-95"
                >
                    <Plus className="w-5 h-5" /> Novo Funcionário
                </button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                    <div className="flex justify-between items-start mb-2">
                        <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">Ativos</p>
                        <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                    </div>
                    <h3 className="text-3xl font-extrabold text-emerald-600">{stats.active}</h3>
                </div>
                <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                    <div className="flex justify-between items-start mb-2">
                        <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">Férias</p>
                        <Plane className="w-5 h-5 text-blue-500" />
                    </div>
                    <h3 className="text-3xl font-extrabold text-blue-600">{stats.vacation}</h3>
                </div>
                <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                    <div className="flex justify-between items-start mb-2">
                        <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">Inativos</p>
                        <XCircle className="w-5 h-5 text-slate-500" />
                    </div>
                    <h3 className="text-3xl font-extrabold text-slate-600">{stats.inactive}</h3>
                </div>
                <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                    <div className="flex justify-between items-start mb-2">
                        <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">Folha Salarial</p>
                        <DollarSign className="w-5 h-5 text-emerald-500" />
                    </div>
                    <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white">R$ {stats.totalSalary.toLocaleString()}</h3>
                </div>
            </div>

            {/* Search and Filter */}
            <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Buscar por nome, CPF ou cargo..."
                        className="w-full pl-12 pr-4 py-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all text-slate-900 dark:text-white shadow-sm"
                    />
                </div>
                <div className="flex gap-2">
                    {(['all', 'active', 'vacation', 'inactive'] as const).map(status => (
                        <button
                            key={status}
                            onClick={() => setFilterStatus(status)}
                            className={`px-4 py-2 rounded-xl font-bold text-sm transition-all ${filterStatus === status
                                ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20'
                                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:border-emerald-500'
                                }`}
                        >
                            {status === 'all' ? 'Todos' : getStatusLabel(status)}
                        </button>
                    ))}
                </div>
            </div>

            {/* Employees Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredEmployees.map(employee => (
                    <div key={employee.id} className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm hover:border-emerald-500/50 transition-all group">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-3 bg-slate-50 dark:bg-slate-950/50 rounded-xl text-emerald-500">
                                <UserIcon className="w-6 h-6" />
                            </div>
                            <span className={`text-[10px] font-black uppercase px-2 py-1 rounded-full flex items-center gap-1 ${getStatusColor(employee.status)}`}>
                                {getStatusIcon(employee.status)}
                                {getStatusLabel(employee.status)}
                            </span>
                        </div>

                        <h3 className="text-lg font-bold text-slate-900 dark:text-white leading-tight mb-1">{employee.fullName}</h3>
                        <p className="text-sm text-emerald-600 font-bold mb-4">{employee.position}</p>

                        <div className="space-y-2 mb-6">
                            <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
                                <Building2 className="w-3.5 h-3.5" />
                                <span>{employee.department || 'Sem departamento'}</span>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
                                <Mail className="w-3.5 h-3.5" />
                                <span className="truncate">{employee.email || 'Sem email'}</span>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
                                <Phone className="w-3.5 h-3.5" />
                                <span>{employee.phone || 'Sem telefone'}</span>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
                                <Calendar className="w-3.5 h-3.5" />
                                <span>Admissão: {new Date(employee.hireDate).toLocaleDateString()}</span>
                            </div>
                        </div>

                        <div className="pt-4 border-t border-slate-50 dark:border-slate-800 flex justify-between items-center">
                            <div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Salário</p>
                                <p className="text-lg font-black text-emerald-600">R$ {employee.salary.toLocaleString()}</p>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => handleEditEmployee(employee)}
                                    className="p-2 text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 rounded-lg transition-colors"
                                >
                                    <Edit className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => handleDeleteEmployee(employee.id)}
                                    className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg transition-colors"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {filteredEmployees.length === 0 && (
                <div className="text-center py-16">
                    <Users className="w-16 h-16 text-slate-200 dark:text-slate-700 mx-auto mb-4" />
                    <p className="text-slate-500 dark:text-slate-400 font-medium">Nenhum funcionário encontrado</p>
                </div>
            )}

            {/* Employee Modal */}
            {showEmployeeModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-2xl p-8 border border-slate-200 dark:border-slate-800 max-h-[90vh] overflow-y-auto transform scale-100 animate-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                                {editingEmployeeId ? 'Editar Funcionário' : 'Novo Funcionário'}
                            </h2>
                            <button
                                onClick={() => {
                                    setShowEmployeeModal(false);
                                    setEmployeeForm({});
                                    setEditingEmployeeId(null);
                                }}
                                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSaveEmployee} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 block">Nome Completo *</label>
                                    <input
                                        type="text"
                                        value={employeeForm.fullName || ''}
                                        onChange={(e) => setEmployeeForm({ ...employeeForm, fullName: e.target.value })}
                                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-3 px-4 focus:ring-2 focus:ring-emerald-500 outline-none transition-all dark:text-white"
                                        placeholder="João Silva"
                                    />
                                </div>
                                <div>
                                    <label className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 block">CPF *</label>
                                    <input
                                        type="text"
                                        value={employeeForm.cpf || ''}
                                        onChange={(e) => setEmployeeForm({ ...employeeForm, cpf: e.target.value })}
                                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-3 px-4 focus:ring-2 focus:ring-emerald-500 outline-none transition-all dark:text-white"
                                        placeholder="000.000.000-00"
                                    />
                                </div>
                                <div>
                                    <label className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 block">Cargo *</label>
                                    <input
                                        type="text"
                                        value={employeeForm.position || ''}
                                        onChange={(e) => setEmployeeForm({ ...employeeForm, position: e.target.value })}
                                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-3 px-4 focus:ring-2 focus:ring-emerald-500 outline-none transition-all dark:text-white"
                                        placeholder="Desenvolvedor"
                                    />
                                </div>
                                <div>
                                    <label className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 block">Departamento</label>
                                    <input
                                        type="text"
                                        value={employeeForm.department || ''}
                                        onChange={(e) => setEmployeeForm({ ...employeeForm, department: e.target.value })}
                                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-3 px-4 focus:ring-2 focus:ring-emerald-500 outline-none transition-all dark:text-white"
                                        placeholder="TI"
                                    />
                                </div>
                                <div>
                                    <label className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 block">Email</label>
                                    <input
                                        type="email"
                                        value={employeeForm.email || ''}
                                        onChange={(e) => setEmployeeForm({ ...employeeForm, email: e.target.value })}
                                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-3 px-4 focus:ring-2 focus:ring-emerald-500 outline-none transition-all dark:text-white"
                                        placeholder="joao@empresa.com"
                                    />
                                </div>
                                <div>
                                    <label className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 block">Telefone</label>
                                    <input
                                        type="text"
                                        value={employeeForm.phone || ''}
                                        onChange={(e) => setEmployeeForm({ ...employeeForm, phone: e.target.value })}
                                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-3 px-4 focus:ring-2 focus:ring-emerald-500 outline-none transition-all dark:text-white"
                                        placeholder="(11) 99999-9999"
                                    />
                                </div>
                                <div>
                                    <label className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 block">Salário (R$)</label>
                                    <input
                                        type="number"
                                        value={employeeForm.salary || ''}
                                        onChange={(e) => setEmployeeForm({ ...employeeForm, salary: parseFloat(e.target.value) || 0 })}
                                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-3 px-4 focus:ring-2 focus:ring-emerald-500 outline-none transition-all dark:text-white"
                                        placeholder="5000"
                                    />
                                </div>
                                <div>
                                    <label className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 block">Data de Admissão</label>
                                    <input
                                        type="date"
                                        value={employeeForm.hireDate || ''}
                                        onChange={(e) => setEmployeeForm({ ...employeeForm, hireDate: e.target.value })}
                                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-3 px-4 focus:ring-2 focus:ring-emerald-500 outline-none transition-all dark:text-white"
                                    />
                                </div>
                                <div>
                                    <label className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 block">Data de Nascimento</label>
                                    <input
                                        type="date"
                                        value={employeeForm.birthDate || ''}
                                        onChange={(e) => setEmployeeForm({ ...employeeForm, birthDate: e.target.value })}
                                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-3 px-4 focus:ring-2 focus:ring-emerald-500 outline-none transition-all dark:text-white"
                                    />
                                </div>
                                <div>
                                    <label className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 block">Status</label>
                                    <select
                                        value={employeeForm.status || 'active'}
                                        onChange={(e) => setEmployeeForm({ ...employeeForm, status: e.target.value as Employee['status'] })}
                                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-3 px-4 focus:ring-2 focus:ring-emerald-500 outline-none transition-all dark:text-white"
                                    >
                                        <option value="active">Ativo</option>
                                        <option value="vacation">Férias</option>
                                        <option value="inactive">Inativo</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 block">Endereço</label>
                                <textarea
                                    value={employeeForm.address || ''}
                                    onChange={(e) => setEmployeeForm({ ...employeeForm, address: e.target.value })}
                                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-3 px-4 focus:ring-2 focus:ring-emerald-500 outline-none transition-all dark:text-white"
                                    placeholder="Rua, número, bairro, cidade - UF"
                                    rows={2}
                                />
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowEmployeeModal(false);
                                        setEmployeeForm({});
                                        setEditingEmployeeId(null);
                                    }}
                                    className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold shadow-lg shadow-emerald-500/20 transition-all"
                                >
                                    {editingEmployeeId ? 'Salvar Alterações' : 'Cadastrar Funcionário'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default EmployeesScreen;
