'use client'

import { useState, useEffect } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts'

interface MonthlyData {
    year: number
    month: number
    totalIncome: number
    totalExpense: number
    netProfit: number
    monthName?: string
}

interface CategoryData {
    record_type: string
    category: string
    total: number
}

interface FinanceRecord {
    id: string
    record_type: string
    category: string
    amount: number
    record_date: string
    month: number
    year: number
    created_by: string
    created_at: string
}

const monthNames = [
    'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
    'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
]

export default function FinanceReportsPage() {
    const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([])
    const [categoryData, setCategoryData] = useState<CategoryData[]>([])
    const [records, setRecords] = useState<FinanceRecord[]>([])
    const [filter, setFilter] = useState('last3months')
    const [month, setMonth] = useState<string>('')
    const [year, setYear] = useState<string>(new Date().getFullYear().toString())
    const [startDate, setStartDate] = useState<string>('')
    const [endDate, setEndDate] = useState<string>('')
    const [loading, setLoading] = useState(true)
    const [editingId, setEditingId] = useState<string | null>(null)
    const [editAmount, setEditAmount] = useState<string>('')
    const [editCategory, setEditCategory] = useState<string>('')

    useEffect(() => {
        fetchData()
    }, [filter, month, year, startDate, endDate])

    const fetchData = async () => {
        setLoading(true)
        try {
            const now = new Date()
            let queryStartDate = ''
            let queryEndDate = now.toISOString().split('T')[0]

            if (filter === 'custom' && startDate && endDate) {
                queryStartDate = startDate
                queryEndDate = endDate
            } else if (filter === 'monthYear' && month && year) {
                // This will be handled by the API with month/year params
            } else {
                switch (filter) {
                    case 'last3months':
                        queryStartDate = new Date(now.getFullYear(), now.getMonth() - 2, 1).toISOString().split('T')[0]
                        break
                    case 'last6months':
                        queryStartDate = new Date(now.getFullYear(), now.getMonth() - 5, 1).toISOString().split('T')[0]
                        break
                    case 'last12months':
                        queryStartDate = new Date(now.getFullYear() - 1, now.getMonth() + 1, 1).toISOString().split('T')[0]
                        break
                    case 'thisMonth':
                        queryStartDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
                        break
                    case 'lastMonth':
                        queryStartDate = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().split('T')[0]
                        queryEndDate = new Date(now.getFullYear(), now.getMonth(), 0).toISOString().split('T')[0]
                        break
                }
            }

            let monthlyUrl = `/api/admin/finance/monthly?`
            let categoryUrl = `/api/admin/finance/category-breakdown?`
            let recordsUrl = `/api/admin/finance/records?`

            if (filter === 'monthYear' && month && year) {
                monthlyUrl += `month=${month}&year=${year}`
                categoryUrl += `month=${month}&year=${year}`
                recordsUrl += `month=${month}&year=${year}`
            } else if (queryStartDate && queryEndDate) {
                monthlyUrl += `startDate=${queryStartDate}&endDate=${queryEndDate}`
                categoryUrl += `startDate=${queryStartDate}&endDate=${queryEndDate}`
                recordsUrl += `startDate=${queryStartDate}&endDate=${queryEndDate}`
            }

            const [monthlyRes, categoryRes, recordsRes] = await Promise.all([
                fetch(monthlyUrl),
                fetch(categoryUrl),
                fetch(recordsUrl),
            ])

            const monthly = await monthlyRes.json()
            const category = await categoryRes.json()
            const recordsData = await recordsRes.json()

            const formattedMonthly = monthly.map((item: MonthlyData) => ({
                ...item,
                monthName: monthNames[item.month - 1] + ' ' + item.year
            }))

            setMonthlyData(formattedMonthly)
            setCategoryData(category)
            setRecords(recordsData.records || [])
        } catch (error) {
            console.error('Error fetching data:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm('Kaydı silmek istediğinizden emin misiniz?')) return

        try {
            const res = await fetch(`/api/admin/finance/record/${id}`, { method: 'DELETE' })
            if (res.ok) {
                fetchData()
            }
        } catch (error) {
            console.error('Error deleting record:', error)
        }
    }

    const handleEdit = async (id: string) => {
        if (!editAmount || !editCategory) return

        try {
            const res = await fetch(`/api/admin/finance/record/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ category: editCategory, amount: editAmount }),
            })
            if (res.ok) {
                setEditingId(null)
                fetchData()
            }
        } catch (error) {
            console.error('Error updating record:', error)
        }
    }

    const incomeCategories = categoryData.filter(item => item.record_type === 'income')
    const expenseCategories = categoryData.filter(item => item.record_type === 'expense')

    if (loading) {
        return <div className="p-6">Yükleniyor...</div>
    }

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-6">Gelir Gider Raporları</h1>

            {/* Filter Section */}
            <div className="mb-6 bg-white p-4 rounded shadow grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                    <label className="block text-sm font-medium mb-2">Filtre:</label>
                    <select
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                        className="w-full border rounded px-3 py-2"
                    >
                        <option value="last3months">Son 3 Ay</option>
                        <option value="last6months">Son 6 Ay</option>
                        <option value="last12months">Son 12 Ay</option>
                        <option value="thisMonth">Bu Ay</option>
                        <option value="lastMonth">Geçen Ay</option>
                        <option value="monthYear">Belirli Ay/Yıl</option>
                        <option value="custom">Özel Tarih Aralığı</option>
                    </select>
                </div>

                {filter === 'monthYear' && (
                    <>
                        <div>
                            <label className="block text-sm font-medium mb-2">Ay:</label>
                            <select
                                value={month}
                                onChange={(e) => setMonth(e.target.value)}
                                className="w-full border rounded px-3 py-2"
                            >
                                <option value="">Ay Seçin</option>
                                {Array.from({ length: 12 }, (_, i) => (
                                    <option key={i + 1} value={i + 1}>
                                        {monthNames[i]}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-2">Yıl:</label>
                            <input
                                type="number"
                                value={year}
                                onChange={(e) => setYear(e.target.value)}
                                className="w-full border rounded px-3 py-2"
                            />
                        </div>
                    </>
                )}

                {filter === 'custom' && (
                    <>
                        <div>
                            <label className="block text-sm font-medium mb-2">Başlangıç Tarihi:</label>
                            <input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="w-full border rounded px-3 py-2"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-2">Bitiş Tarihi:</label>
                            <input
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="w-full border rounded px-3 py-2"
                            />
                        </div>
                    </>
                )}
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                {/* Monthly Overview */}
                <div className="bg-white p-4 rounded shadow">
                    <h2 className="text-lg font-semibold mb-4">Aylık Genel Bakış</h2>
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={monthlyData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="monthName" />
                            <YAxis />
                            <Tooltip formatter={(value: any) => value ? `${Number(value).toFixed(2)} TL` : '0 TL'} />
                            <Legend />
                            <Line type="monotone" dataKey="totalIncome" stroke="#10b981" name="Toplam Gelir" />
                            <Line type="monotone" dataKey="totalExpense" stroke="#ef4444" name="Toplam Gider" />
                            <Line type="monotone" dataKey="netProfit" stroke="#3b82f6" name="Net Kar" />
                        </LineChart>
                    </ResponsiveContainer>
                </div>

                {/* Income Categories */}
                <div className="bg-white p-4 rounded shadow">
                    <h2 className="text-lg font-semibold mb-4">Gelir Kategorileri</h2>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={incomeCategories}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="category" />
                            <YAxis />
                            <Tooltip formatter={(value: any) => value ? `${Number(value).toFixed(2)} TL` : '0 TL'} />
                            <Bar dataKey="total" fill="#10b981" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                {/* Expense Categories */}
                <div className="bg-white p-4 rounded shadow">
                    <h2 className="text-lg font-semibold mb-4">Gider Kategorileri</h2>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={expenseCategories}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="category" />
                            <YAxis />
                            <Tooltip formatter={(value: any) => value ? `${Number(value).toFixed(2)} TL` : '0 TL'} />
                            <Bar dataKey="total" fill="#ef4444" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Monthly Table */}
            <div className="bg-white p-4 rounded shadow mb-6">
                <h2 className="text-lg font-semibold mb-4">Aylık Özet Tablosu</h2>
                <div className="overflow-x-auto">
                    <table className="min-w-full table-auto">
                        <thead>
                            <tr className="bg-gray-50">
                                <th className="px-4 py-2 text-left">Ay</th>
                                <th className="px-4 py-2 text-right">Toplam Gelir</th>
                                <th className="px-4 py-2 text-right">Toplam Gider</th>
                                <th className="px-4 py-2 text-right">Net Kar</th>
                            </tr>
                        </thead>
                        <tbody>
                            {monthlyData.map((item, index) => (
                                <tr key={index} className="border-t">
                                    <td className="px-4 py-2">{item.monthName}</td>
                                    <td className="px-4 py-2 text-right">{item.totalIncome.toFixed(2)} TL</td>
                                    <td className="px-4 py-2 text-right">{item.totalExpense.toFixed(2)} TL</td>
                                    <td className="px-4 py-2 text-right">{item.netProfit.toFixed(2)} TL</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Records List */}
            <div className="bg-white p-4 rounded shadow">
                <h2 className="text-lg font-semibold mb-4">Kayıtlar</h2>
                <div className="overflow-x-auto">
                    <table className="min-w-full table-auto">
                        <thead>
                            <tr className="bg-gray-50">
                                <th className="px-4 py-2 text-left">Tarih</th>
                                <th className="px-4 py-2 text-left">Tür</th>
                                <th className="px-4 py-2 text-left">Kategori</th>
                                <th className="px-4 py-2 text-right">Tutar</th>
                                <th className="px-4 py-2 text-left">Yapan</th>
                                <th className="px-4 py-2 text-center">İşlemler</th>
                            </tr>
                        </thead>
                        <tbody>
                            {records.map((record) => (
                                <tr key={record.id} className="border-t">
                                    {editingId === record.id ? (
                                        <>
                                            <td className="px-4 py-2">{new Date(record.record_date).toLocaleDateString('tr-TR')}</td>
                                            <td className="px-4 py-2">{record.record_type === 'income' ? '📈 Gelir' : '📉 Gider'}</td>
                                            <td className="px-4 py-2">
                                                <input
                                                    type="text"
                                                    value={editCategory}
                                                    onChange={(e) => setEditCategory(e.target.value)}
                                                    className="border rounded px-2 py-1 w-full"
                                                />
                                            </td>
                                            <td className="px-4 py-2 text-right">
                                                <input
                                                    type="text"
                                                    value={editAmount}
                                                    onChange={(e) => setEditAmount(e.target.value)}
                                                    className="border rounded px-2 py-1 w-full"
                                                />
                                            </td>
                                            <td className="px-4 py-2">{record.created_by}</td>
                                            <td className="px-4 py-2 text-center">
                                                <button
                                                    onClick={() => handleEdit(record.id)}
                                                    className="bg-green-500 text-white px-2 py-1 rounded mr-2"
                                                >
                                                    ✓
                                                </button>
                                                <button
                                                    onClick={() => setEditingId(null)}
                                                    className="bg-gray-500 text-white px-2 py-1 rounded"
                                                >
                                                    ✕
                                                </button>
                                            </td>
                                        </>
                                    ) : (
                                        <>
                                            <td className="px-4 py-2">{new Date(record.record_date).toLocaleDateString('tr-TR')}</td>
                                            <td className="px-4 py-2">{record.record_type === 'income' ? '📈 Gelir' : '📉 Gider'}</td>
                                            <td className="px-4 py-2">{record.category}</td>
                                            <td className="px-4 py-2 text-right">{record.amount.toFixed(2)} TL</td>
                                            <td className="px-4 py-2">{record.created_by}</td>
                                            <td className="px-4 py-2 text-center">
                                                <button
                                                    onClick={() => {
                                                        setEditingId(record.id)
                                                        setEditCategory(record.category)
                                                        setEditAmount(record.amount.toString())
                                                    }}
                                                    className="bg-blue-500 text-white px-2 py-1 rounded mr-2"
                                                >
                                                    Düzenle
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(record.id)}
                                                    className="bg-red-500 text-white px-2 py-1 rounded"
                                                >
                                                    Sil
                                                </button>
                                            </td>
                                        </>
                                    )}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}