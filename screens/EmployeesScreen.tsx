import React, { useState, useMemo, useEffect } from 'react';
import { Employee } from '../types';
import {
    Users,
    Search,
    Plus,
    User as UserIcon,
    Trash2,
    Edit,
    X,
    DollarSign,
    Calculator as CalcIcon,
    TrendingUp,
    TrendingDown,
    Briefcase,
    Calendar,
    Clock,
    FileDown
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

import { supabase } from '../lib/supabase';

interface EmployeesScreenProps {
    employees: Employee[];
    fetchAllData: () => Promise<void>;
}

const EmployeesScreen: React.FC<EmployeesScreenProps> = ({ employees, fetchAllData }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [showEmployeeModal, setShowEmployeeModal] = useState(false);
    const [employeeForm, setEmployeeForm] = useState<Partial<Employee>>({});
    const [editingEmployeeId, setEditingEmployeeId] = useState<string | null>(null);

    // Auto-calculate totals when form changes
    useEffect(() => {
        if (employeeForm.foodVoucherPerDay !== undefined) {
            const workDays = 22; // Dias úteis padrão
            setEmployeeForm(prev => ({
                ...prev,
                foodVoucherTotal: (prev.foodVoucherPerDay || 0) * workDays
            }));
        }
    }, [employeeForm.foodVoucherPerDay]);

    useEffect(() => {
        if (employeeForm.transportVoucherPerDay !== undefined) {
            const workDays = 22;
            setEmployeeForm(prev => ({
                ...prev,
                transportVoucherTotal: (prev.transportVoucherPerDay || 0) * workDays
            }));
        }
    }, [employeeForm.transportVoucherPerDay]);

    useEffect(() => {
        if (employeeForm.absenceDays !== undefined && employeeForm.baseSalary !== undefined) {
            const dailySalary = (employeeForm.baseSalary || 0) / 30;
            setEmployeeForm(prev => ({
                ...prev,
                absenceTotal: dailySalary * (prev.absenceDays || 0)
            }));
        }
    }, [employeeForm.absenceDays, employeeForm.baseSalary]);

    const calculateTotal = (emp: Partial<Employee>) => {
        const remuneration = (emp.baseSalary || 0) + (emp.additionalPercent20 || 0) + (emp.attendance || 0);
        const benefits = (emp.mealVoucher || 0) + (emp.foodVoucherTotal || 0) + (emp.transportVoucherTotal || 0);
        const discounts = (emp.absenceTotal || 0);
        const operationalCosts = (emp.fuel || 0) + (emp.carRental || 0);

        return remuneration + benefits - discounts + operationalCosts;
    };

    const handleSaveEmployee = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!employeeForm.fullName || !employeeForm.position || !employeeForm.costCenter) {
            alert('Nome, Cargo e Centro de Custo são obrigatórios!');
            return;
        }

        try {
            const dataToSave = {
                cost_center: employeeForm.costCenter,
                full_name: employeeForm.fullName,
                position: employeeForm.position,
                hire_date: employeeForm.hireDate,
                work_schedule: employeeForm.workSchedule,
                base_salary: employeeForm.baseSalary,
                additional_percent_20: employeeForm.additionalPercent20,
                attendance: employeeForm.attendance,
                meal_voucher: employeeForm.mealVoucher,
                food_voucher_per_day: employeeForm.foodVoucherPerDay,
                food_voucher_total: employeeForm.foodVoucherTotal,
                transport_voucher_per_day: employeeForm.transportVoucherPerDay,
                transport_voucher_total: employeeForm.transportVoucherTotal,
                absence_days: employeeForm.absenceDays,
                absence_total: employeeForm.absenceTotal,
                fuel: employeeForm.fuel,
                car_rental: employeeForm.carRental,
                observations: employeeForm.observations,
                status: 'active'
            };

            if (editingEmployeeId) {
                await supabase.from('employees').update(dataToSave).eq('id', editingEmployeeId);
            } else {
                await supabase.from('employees').insert(dataToSave);
            }

            await fetchAllData();
            setShowEmployeeModal(false);
            setEmployeeForm({});
            setEditingEmployeeId(null);
            alert('Funcionário salvo com sucesso!');
        } catch (error) {
            console.error('Error saving employee:', error);
            alert('Erro ao salvar funcionário.');
        }
    };

    const handleEditEmployee = (employee: Employee) => {
        setEmployeeForm(employee);
        setEditingEmployeeId(employee.id);
        setShowEmployeeModal(true);
    };

    const handleDeleteEmployee = async (id: string) => {
        if (confirm('Tem certeza que deseja excluir este funcionário?')) {
            try {
                await supabase.from('employees').delete().eq('id', id);
                await fetchAllData();
            } catch (error) {
                console.error('Error deleting employee:', error);
                alert('Erro ao excluir funcionário.');
            }
        }
    };

    const filteredEmployees = useMemo(() => {
        return employees.filter(emp =>
            emp.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            emp.position.toLowerCase().includes(searchTerm.toLowerCase()) ||
            emp.costCenter.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [employees, searchTerm]);

    const stats = useMemo(() => {
        const totalPayroll = employees.reduce((acc, emp) => acc + calculateTotal(emp), 0);
        const totalRemuneration = employees.reduce((acc, emp) =>
            acc + (emp.baseSalary || 0) + (emp.additionalPercent20 || 0) + (emp.attendance || 0), 0);
        const totalBenefits = employees.reduce((acc, emp) =>
            acc + (emp.mealVoucher || 0) + (emp.foodVoucherTotal || 0) + (emp.transportVoucherTotal || 0), 0);
        const totalOperational = employees.reduce((acc, emp) =>
            acc + (emp.fuel || 0) + (emp.carRental || 0), 0);

        return { totalPayroll, totalRemuneration, totalBenefits, totalOperational, count: employees.length };
    }, [employees]);

    const exportToPDF = () => {
        const doc = new jsPDF('landscape');
        const pageWidth = doc.internal.pageSize.width;

        // Header
        doc.setFillColor(16, 185, 129); // emerald-500
        doc.rect(0, 0, pageWidth, 35, 'F');

        doc.setTextColor(255, 255, 255);
        doc.setFontSize(22);
        doc.setFont('helvetica', 'bold');
        doc.text('FOLHA DE PAGAMENTO', pageWidth / 2, 15, { align: 'center' });

        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text('Schumacher Tecnologia Ltda.', pageWidth / 2, 23, { align: 'center' });
        doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}`, pageWidth / 2, 29, { align: 'center' });

        // Summary Cards
        doc.setTextColor(71, 85, 105);
        doc.setFontSize(9);
        let yPos = 45;

        const summaryData = [
            ['Total de Funcionários', stats.count.toString()],
            ['Remuneração Total', `R$ ${stats.totalRemuneration.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`],
            ['Benefícios Total', `R$ ${stats.totalBenefits.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`],
            ['Custo Total', `R$ ${stats.totalPayroll.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`]
        ];

        autoTable(doc, {
            startY: yPos,
            head: [['Resumo Financeiro', 'Valor']],
            body: summaryData,
            theme: 'grid',
            headStyles: { fillColor: [16, 185, 129], textColor: 255, fontStyle: 'bold', fontSize: 10 },
            styles: { fontSize: 9, cellPadding: 3 },
            columnStyles: {
                0: { fontStyle: 'bold', cellWidth: 60 },
                1: { halign: 'right', fontStyle: 'bold' }
            }
        });

        // Detailed Employee Table
        const tableData = filteredEmployees.map(emp => {
            const remuneration = (emp.baseSalary || 0) + (emp.additionalPercent20 || 0) + (emp.attendance || 0);
            const benefits = (emp.mealVoucher || 0) + (emp.foodVoucherTotal || 0) + (emp.transportVoucherTotal || 0);
            const discounts = (emp.absenceTotal || 0);
            const operational = (emp.fuel || 0) + (emp.carRental || 0);
            const total = calculateTotal(emp);

            return [
                emp.costCenter,
                emp.fullName,
                emp.position,
                emp.workSchedule || '-',
                `R$ ${(emp.baseSalary || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
                `R$ ${(emp.additionalPercent20 || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
                `R$ ${(emp.attendance || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
                `R$ ${remuneration.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
                `R$ ${benefits.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
                `R$ ${discounts.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
                `R$ ${operational.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
                `R$ ${total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
            ];
        });

        autoTable(doc, {
            startY: (doc as any).lastAutoTable.finalY + 10,
            head: [[
                'Centro\nCusto',
                'Nome',
                'Função',
                'Escala',
                'Salário\nBase',
                'Adic.\n20%',
                'Assid.',
                'Total\nRemun.',
                'Benef.',
                'Desc.',
                'Oper.',
                'TOTAL'
            ]],
            body: tableData,
            theme: 'striped',
            headStyles: {
                fillColor: [16, 185, 129],
                textColor: 255,
                fontStyle: 'bold',
                fontSize: 8,
                halign: 'center',
                valign: 'middle'
            },
            styles: {
                fontSize: 7,
                cellPadding: 2,
                overflow: 'linebreak'
            },
            columnStyles: {
                0: { cellWidth: 18, halign: 'center' },
                1: { cellWidth: 35, fontStyle: 'bold' },
                2: { cellWidth: 25 },
                3: { cellWidth: 15, halign: 'center' },
                4: { cellWidth: 20, halign: 'right' },
                5: { cellWidth: 18, halign: 'right' },
                6: { cellWidth: 18, halign: 'right' },
                7: { cellWidth: 22, halign: 'right', fontStyle: 'bold' },
                8: { cellWidth: 20, halign: 'right' },
                9: { cellWidth: 18, halign: 'right' },
                10: { cellWidth: 18, halign: 'right' },
                11: { cellWidth: 25, halign: 'right', fontStyle: 'bold', textColor: [16, 185, 129] }
            },
            didDrawPage: (data) => {
                // Footer
                const pageCount = (doc as any).internal.getNumberOfPages();
                const currentPage = (doc as any).internal.getCurrentPageInfo().pageNumber;

                doc.setFontSize(8);
                doc.setTextColor(148, 163, 184);
                doc.text(
                    `Página ${currentPage} de ${pageCount}`,
                    pageWidth / 2,
                    doc.internal.pageSize.height - 10,
                    { align: 'center' }
                );
            }
        });

        // Save
        const fileName = `Folha_Pagamento_${new Date().toISOString().split('T')[0]}.pdf`;
        doc.save(fileName);
    };

    return (
        <div className="p-8 max-w-[1600px] mx-auto space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">Folha de Pagamento</h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">Gestão completa de custos com funcionários</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={exportToPDF}
                        disabled={employees.length === 0}
                        className="flex items-center gap-2 px-6 py-3 bg-blue-500 hover:bg-blue-600 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-xl font-bold shadow-lg shadow-blue-500/20 transition-all hover:scale-105 active:scale-95"
                    >
                        <FileDown className="w-5 h-5" /> Exportar PDF
                    </button>
                    <button
                        onClick={() => setShowEmployeeModal(true)}
                        className="flex items-center gap-2 px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold shadow-lg shadow-emerald-500/20 transition-all hover:scale-105 active:scale-95"
                    >
                        <Plus className="w-5 h-5" /> Novo Funcionário
                    </button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                    <div className="flex justify-between items-start mb-2">
                        <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">Funcionários</p>
                        <Users className="w-5 h-5 text-emerald-500" />
                    </div>
                    <h3 className="text-3xl font-extrabold text-emerald-600">{stats.count}</h3>
                </div>
                <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                    <div className="flex justify-between items-start mb-2">
                        <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">Remuneração</p>
                        <DollarSign className="w-5 h-5 text-blue-500" />
                    </div>
                    <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white">R$ {stats.totalRemuneration.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h3>
                </div>
                <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                    <div className="flex justify-between items-start mb-2">
                        <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">Benefícios</p>
                        <TrendingUp className="w-5 h-5 text-purple-500" />
                    </div>
                    <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white">R$ {stats.totalBenefits.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h3>
                </div>
                <div className="bg-gradient-to-br from-emerald-500 to-green-600 p-6 rounded-2xl shadow-lg">
                    <div className="flex justify-between items-start mb-2">
                        <p className="text-sm font-bold text-emerald-100 uppercase tracking-wider">Custo Total</p>
                        <CalcIcon className="w-5 h-5 text-white" />
                    </div>
                    <h3 className="text-2xl font-extrabold text-white">R$ {stats.totalPayroll.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h3>
                </div>
            </div>

            {/* Search */}
            <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Buscar por nome, cargo ou centro de custo..."
                    className="w-full pl-12 pr-4 py-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all text-slate-900 dark:text-white shadow-sm"
                />
            </div>

            {/* Employees Table */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800">
                            <tr>
                                <th className="text-left p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Centro Custo</th>
                                <th className="text-left p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Nome</th>
                                <th className="text-left p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Função</th>
                                <th className="text-left p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Admissão</th>
                                <th className="text-left p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Escala</th>
                                <th className="text-right p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Salário Base</th>
                                <th className="text-right p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Adic. 20%</th>
                                <th className="text-right p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Total</th>
                                <th className="text-center p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {filteredEmployees.map(emp => {
                                const total = calculateTotal(emp);
                                return (
                                    <tr key={emp.id} className="hover:bg-slate-50 dark:hover:bg-slate-950 transition-colors">
                                        <td className="p-4 text-sm font-medium text-slate-900 dark:text-white">{emp.costCenter}</td>
                                        <td className="p-4 text-sm font-bold text-slate-900 dark:text-white">{emp.fullName}</td>
                                        <td className="p-4 text-sm text-slate-600 dark:text-slate-400">{emp.position}</td>
                                        <td className="p-4 text-sm text-slate-600 dark:text-slate-400">{new Date(emp.hireDate).toLocaleDateString('pt-BR')}</td>
                                        <td className="p-4 text-sm text-slate-600 dark:text-slate-400">{emp.workSchedule}</td>
                                        <td className="p-4 text-sm text-right font-bold text-slate-900 dark:text-white">R$ {(emp.baseSalary || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                                        <td className="p-4 text-sm text-right text-emerald-600">R$ {(emp.additionalPercent20 || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                                        <td className="p-4 text-sm text-right font-black text-emerald-600">R$ {total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                                        <td className="p-4">
                                            <div className="flex justify-center gap-2">
                                                <button
                                                    onClick={() => handleEditEmployee(emp)}
                                                    className="p-2 text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 rounded-lg transition-colors"
                                                >
                                                    <Edit className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteEmployee(emp.id)}
                                                    className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg transition-colors"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                {filteredEmployees.length === 0 && (
                    <div className="text-center py-16">
                        <Users className="w-16 h-16 text-slate-200 dark:text-slate-700 mx-auto mb-4" />
                        <p className="text-slate-500 dark:text-slate-400 font-medium">Nenhum funcionário encontrado</p>
                    </div>
                )}
            </div>

            {/* Employee Modal */}
            {showEmployeeModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-5xl p-8 border border-slate-200 dark:border-slate-800 max-h-[90vh] overflow-y-auto transform scale-100 animate-in zoom-in-95 duration-200">
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

                        <form onSubmit={handleSaveEmployee} className="space-y-6">
                            {/* Dados Básicos */}
                            <div>
                                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                                    <UserIcon className="w-5 h-5 text-emerald-500" />
                                    Dados Básicos
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                        <label className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 block">Centro de Custo *</label>
                                        <input
                                            type="text"
                                            value={employeeForm.costCenter || ''}
                                            onChange={(e) => setEmployeeForm({ ...employeeForm, costCenter: e.target.value })}
                                            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-3 px-4 focus:ring-2 focus:ring-emerald-500 outline-none transition-all dark:text-white"
                                            placeholder="CC-001"
                                        />
                                    </div>
                                    <div className="md:col-span-2">
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
                                        <label className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 block">Função *</label>
                                        <input
                                            type="text"
                                            value={employeeForm.position || ''}
                                            onChange={(e) => setEmployeeForm({ ...employeeForm, position: e.target.value })}
                                            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-3 px-4 focus:ring-2 focus:ring-emerald-500 outline-none transition-all dark:text-white"
                                            placeholder="Desenvolvedor"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 block">Admissão</label>
                                        <input
                                            type="date"
                                            value={employeeForm.hireDate || ''}
                                            onChange={(e) => setEmployeeForm({ ...employeeForm, hireDate: e.target.value })}
                                            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-3 px-4 focus:ring-2 focus:ring-emerald-500 outline-none transition-all dark:text-white"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 block">Escala</label>
                                        <input
                                            type="text"
                                            value={employeeForm.workSchedule || ''}
                                            onChange={(e) => setEmployeeForm({ ...employeeForm, workSchedule: e.target.value })}
                                            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-3 px-4 focus:ring-2 focus:ring-emerald-500 outline-none transition-all dark:text-white"
                                            placeholder="12x36, 5x2, etc"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Remuneração */}
                            <div>
                                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                                    <DollarSign className="w-5 h-5 text-emerald-500" />
                                    Remuneração
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                        <label className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 block">Salário Base (R$)</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={employeeForm.baseSalary || ''}
                                            onChange={(e) => setEmployeeForm({ ...employeeForm, baseSalary: parseFloat(e.target.value) || 0 })}
                                            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-3 px-4 focus:ring-2 focus:ring-emerald-500 outline-none transition-all dark:text-white"
                                            placeholder="5000.00"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 block">Adic. 20% (R$)</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={employeeForm.additionalPercent20 || ''}
                                            onChange={(e) => setEmployeeForm({ ...employeeForm, additionalPercent20: parseFloat(e.target.value) || 0 })}
                                            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-3 px-4 focus:ring-2 focus:ring-emerald-500 outline-none transition-all dark:text-white"
                                            placeholder="1000.00"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 block">Assiduidade (R$)</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={employeeForm.attendance || ''}
                                            onChange={(e) => setEmployeeForm({ ...employeeForm, attendance: parseFloat(e.target.value) || 0 })}
                                            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-3 px-4 focus:ring-2 focus:ring-emerald-500 outline-none transition-all dark:text-white"
                                            placeholder="200.00"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Benefícios */}
                            <div>
                                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                                    <TrendingUp className="w-5 h-5 text-emerald-500" />
                                    Benefícios
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                                    <div>
                                        <label className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 block">VA (R$)</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={employeeForm.mealVoucher || ''}
                                            onChange={(e) => setEmployeeForm({ ...employeeForm, mealVoucher: parseFloat(e.target.value) || 0 })}
                                            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-3 px-4 focus:ring-2 focus:ring-emerald-500 outline-none transition-all dark:text-white"
                                            placeholder="500.00"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 block">VR Dia (R$)</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={employeeForm.foodVoucherPerDay || ''}
                                            onChange={(e) => setEmployeeForm({ ...employeeForm, foodVoucherPerDay: parseFloat(e.target.value) || 0 })}
                                            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-3 px-4 focus:ring-2 focus:ring-emerald-500 outline-none transition-all dark:text-white"
                                            placeholder="35.00"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 block">VR Total (R$)</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={employeeForm.foodVoucherTotal || ''}
                                            readOnly
                                            className="w-full bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-3 px-4 outline-none dark:text-white cursor-not-allowed"
                                            placeholder="Auto"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 block">VT Dia (R$)</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={employeeForm.transportVoucherPerDay || ''}
                                            onChange={(e) => setEmployeeForm({ ...employeeForm, transportVoucherPerDay: parseFloat(e.target.value) || 0 })}
                                            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-3 px-4 focus:ring-2 focus:ring-emerald-500 outline-none transition-all dark:text-white"
                                            placeholder="15.00"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 block">VT Total (R$)</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={employeeForm.transportVoucherTotal || ''}
                                            readOnly
                                            className="w-full bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-3 px-4 outline-none dark:text-white cursor-not-allowed"
                                            placeholder="Auto"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Descontos */}
                            <div>
                                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                                    <TrendingDown className="w-5 h-5 text-rose-500" />
                                    Descontos / Ajustes
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 block">Faltas (Dias)</label>
                                        <input
                                            type="number"
                                            value={employeeForm.absenceDays || ''}
                                            onChange={(e) => setEmployeeForm({ ...employeeForm, absenceDays: parseFloat(e.target.value) || 0 })}
                                            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-3 px-4 focus:ring-2 focus:ring-emerald-500 outline-none transition-all dark:text-white"
                                            placeholder="0"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 block">Faltas Total (R$)</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={employeeForm.absenceTotal || ''}
                                            readOnly
                                            className="w-full bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-3 px-4 outline-none dark:text-white cursor-not-allowed"
                                            placeholder="Auto"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Custos Operacionais */}
                            <div>
                                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                                    <Briefcase className="w-5 h-5 text-emerald-500" />
                                    Custos Operacionais
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 block">Combustível (R$)</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={employeeForm.fuel || ''}
                                            onChange={(e) => setEmployeeForm({ ...employeeForm, fuel: parseFloat(e.target.value) || 0 })}
                                            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-3 px-4 focus:ring-2 focus:ring-emerald-500 outline-none transition-all dark:text-white"
                                            placeholder="300.00"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 block">Aluguel Carro (R$)</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={employeeForm.carRental || ''}
                                            onChange={(e) => setEmployeeForm({ ...employeeForm, carRental: parseFloat(e.target.value) || 0 })}
                                            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-3 px-4 focus:ring-2 focus:ring-emerald-500 outline-none transition-all dark:text-white"
                                            placeholder="1500.00"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Outros */}
                            <div>
                                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Outros</h3>
                                <div>
                                    <label className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 block">Observações</label>
                                    <textarea
                                        value={employeeForm.observations || ''}
                                        onChange={(e) => setEmployeeForm({ ...employeeForm, observations: e.target.value })}
                                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-3 px-4 focus:ring-2 focus:ring-emerald-500 outline-none transition-all dark:text-white"
                                        placeholder="Informações adicionais..."
                                        rows={3}
                                    />
                                </div>
                            </div>

                            {/* Total Preview */}
                            <div className="bg-gradient-to-br from-emerald-500 to-green-600 p-6 rounded-2xl">
                                <div className="flex justify-between items-center">
                                    <div>
                                        <p className="text-emerald-100 text-sm font-bold uppercase tracking-wider mb-1">Custo Total Mensal</p>
                                        <h3 className="text-4xl font-extrabold text-white">
                                            R$ {calculateTotal(employeeForm).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                        </h3>
                                    </div>
                                    <CalcIcon className="w-12 h-12 text-white/20" />
                                </div>
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
