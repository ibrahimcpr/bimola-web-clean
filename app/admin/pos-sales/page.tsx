'use client'

import { useEffect, useState } from 'react'

interface ReceiptItem {
    id: string
    productId: number
    productName: string
    unitPrice: number
}

interface Receipt {
    id: string
    receiptNo: string
    receiptDate: string
    tableName: string
    paymentMethod: string
    total: number
    items: ReceiptItem[]
}

interface MonthlyProduct {
    month: string
    productId: number
    productName: string
    quantity: number
    revenue: number
}

interface SalesReport {
    receipts: Receipt[]
    monthlyProducts: MonthlyProduct[]
}

const monthNames = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık']

export default function PosSalesPage() {
    const [period, setPeriod] = useState<'month' | 'quarter' | 'year'>('month')
    const [month, setMonth] = useState(new Date().getMonth() + 1)
    const [year, setYear] = useState(new Date().getFullYear())
    const [report, setReport] = useState<SalesReport>({ receipts: [], monthlyProducts: [] })
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [deletingId, setDeletingId] = useState<string | null>(null)

    const fetchReport = async () => {
        setLoading(true)
        setError('')
        try {
            const params = new URLSearchParams({ period, month: String(month), year: String(year) })
            const response = await fetch(`/api/admin/pos-sales?${params}`)
            if (!response.ok) throw new Error('Adisyon raporu alınamadı.')
            setReport(await response.json())
        } catch (fetchError) {
            setError(fetchError instanceof Error ? fetchError.message : 'Bir hata oluştu.')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        void fetchReport()
    }, [period, month, year])

    const handleDeleteItem = async (item: ReceiptItem) => {
        if (!confirm(`${item.productName} ürününün bu satış satırı silinsin mi?`)) return
        setDeletingId(item.id)
        try {
            const response = await fetch(`/api/admin/pos-sales/items/${item.id}`, { method: 'DELETE' })
            if (!response.ok) throw new Error('Ürün satırı silinemedi.')
            await fetchReport()
        } catch (deleteError) {
            setError(deleteError instanceof Error ? deleteError.message : 'Bir hata oluştu.')
        } finally {
            setDeletingId(null)
        }
    }

    const totalUnits = report.monthlyProducts.reduce((sum, item) => sum + item.quantity, 0)
    const totalRevenue = report.monthlyProducts.reduce((sum, item) => sum + item.revenue, 0)

    return (
        <section className="p-6">
            <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold">Adisyon Satışları</h1>
                    <p className="mt-1 text-sm text-gray-600">Fiş kayıtları ve ürün bazlı satış adetleri</p>
                </div>
                <div className="flex flex-wrap gap-3">
                    <label className="text-sm font-medium">
                        Dönem
                        <select className="mt-1 block rounded border px-3 py-2" value={period} onChange={(event) => setPeriod(event.target.value as typeof period)}>
                            <option value="month">Ay</option>
                            <option value="quarter">3 Ay</option>
                            <option value="year">Yıl</option>
                        </select>
                    </label>
                    <label className="text-sm font-medium">
                        Yıl
                        <input className="mt-1 block w-28 rounded border px-3 py-2" type="number" min="2000" max="2200" value={year} onChange={(event) => setYear(Number(event.target.value))} />
                    </label>
                    {period !== 'year' && (
                        <label className="text-sm font-medium">
                            {period === 'quarter' ? 'Bitiş Ayı' : 'Ay'}
                            <select className="mt-1 block rounded border px-3 py-2" value={month} onChange={(event) => setMonth(Number(event.target.value))}>
                                {monthNames.map((name, index) => <option key={name} value={index + 1}>{name}</option>)}
                            </select>
                        </label>
                    )}
                </div>
            </div>

            {error && <div role="alert" className="mb-4 border border-red-300 bg-red-50 p-3 text-red-800">{error}</div>}

            <div className="mb-6 grid gap-4 sm:grid-cols-3">
                <div className="border bg-white p-4"><div className="text-sm text-gray-500">Satılan adet</div><div className="mt-1 text-xl font-semibold">{totalUnits}</div></div>
                <div className="border bg-white p-4"><div className="text-sm text-gray-500">Ürün çeşidi</div><div className="mt-1 text-xl font-semibold">{report.monthlyProducts.length}</div></div>
                <div className="border bg-white p-4"><div className="text-sm text-gray-500">Satış toplamı</div><div className="mt-1 text-xl font-semibold">{totalRevenue.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}</div></div>
            </div>

            <div className="mb-8 overflow-x-auto border bg-white">
                <h2 className="border-b px-4 py-3 text-lg font-semibold">Aylık Ürün Satışları</h2>
                {loading ? <p className="p-4 text-gray-600">Yükleniyor...</p> : (
                    <table className="min-w-full text-sm">
                        <thead className="bg-gray-50 text-left"><tr><th className="px-4 py-3">Ay</th><th className="px-4 py-3">Ürün</th><th className="px-4 py-3">Ürün ID</th><th className="px-4 py-3 text-right">Adet</th><th className="px-4 py-3 text-right">Tutar</th></tr></thead>
                        <tbody>
                            {report.monthlyProducts.map((item) => {
                                const [itemYear, itemMonth] = item.month.split('-').map(Number)
                                return <tr className="border-t" key={`${item.month}-${item.productId}-${item.productName}`}>
                                    <td className="px-4 py-3">{monthNames[itemMonth - 1]} {itemYear}</td>
                                    <td className="px-4 py-3">{item.productName}</td>
                                    <td className="px-4 py-3">{item.productId}</td>
                                    <td className="px-4 py-3 text-right">{item.quantity}</td>
                                    <td className="px-4 py-3 text-right">{item.revenue.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}</td>
                                </tr>
                            })}
                            {!loading && report.monthlyProducts.length === 0 && <tr><td className="px-4 py-6 text-center text-gray-500" colSpan={5}>Bu dönem için satış kaydı yok.</td></tr>}
                        </tbody>
                    </table>
                )}
            </div>

            <div className="overflow-x-auto border bg-white">
                <h2 className="border-b px-4 py-3 text-lg font-semibold">Fişler ve Ürün Satırları</h2>
                {loading ? <p className="p-4 text-gray-600">Yükleniyor...</p> : report.receipts.length === 0 ? <p className="p-4 text-gray-500">Bu dönem için fiş yok.</p> : (
                    <table className="min-w-full text-sm">
                        <thead className="bg-gray-50 text-left"><tr><th className="px-4 py-3">Fiş no / tarih</th><th className="px-4 py-3">Masa</th><th className="px-4 py-3">Ürün</th><th className="px-4 py-3">Ürün ID</th><th className="px-4 py-3 text-right">Birim fiyat</th><th className="px-4 py-3 text-right">Fiş toplamı</th><th className="px-4 py-3">İşlem</th></tr></thead>
                        <tbody>
                            {report.receipts.flatMap((receipt) => receipt.items.map((item) => <tr className="border-t" key={item.id}>
                                <td className="whitespace-nowrap px-4 py-3"><div className="font-medium">{receipt.receiptNo}</div><div className="text-gray-500">{new Date(receipt.receiptDate).toLocaleString('tr-TR')}</div></td>
                                <td className="px-4 py-3">{receipt.tableName}</td>
                                <td className="px-4 py-3">{item.productName}</td>
                                <td className="px-4 py-3">{item.productId}</td>
                                <td className="px-4 py-3 text-right">{item.unitPrice.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}</td>
                                <td className="px-4 py-3 text-right">{receipt.total.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}</td>
                                <td className="px-4 py-3"><button className="text-red-700 underline disabled:opacity-50" disabled={deletingId === item.id} onClick={() => void handleDeleteItem(item)}>{deletingId === item.id ? 'Siliniyor...' : 'Satırı sil'}</button></td>
                            </tr>))}
                        </tbody>
                    </table>
                )}
            </div>
        </section>
    )
}