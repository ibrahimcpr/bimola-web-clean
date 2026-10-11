import { NextRequest, NextResponse } from 'next/server'
import { isAuthenticated } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
    if (!await isAuthenticated()) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const params = request.nextUrl.searchParams
    const period = params.get('period') || 'month'
    const year = Number(params.get('year') || new Date().getFullYear())
    const month = Number(params.get('month') || new Date().getMonth() + 1)
    if (!['month', 'quarter', 'year'].includes(period) || !Number.isInteger(year) || year < 2000 || year > 2200 || !Number.isInteger(month) || month < 1 || month > 12) {
        return NextResponse.json({ error: 'Invalid date range' }, { status: 400 })
    }

    const rangeStart = period === 'year'
        ? new Date(Date.UTC(year, 0, 1))
        : new Date(Date.UTC(year, month - (period === 'quarter' ? 3 : 1), 1))
    const rangeEnd = period === 'year'
        ? new Date(Date.UTC(year + 1, 0, 1))
        : new Date(Date.UTC(year, month, 1))

    try {
        const [receipts, items] = await Promise.all([
            prisma.posReceipt.findMany({
                where: { receiptDate: { gte: rangeStart, lt: rangeEnd } },
                include: { items: { orderBy: { createdAt: 'asc' } } },
                orderBy: { receiptDate: 'desc' },
                take: 500,
            }),
            prisma.posReceiptItem.findMany({
                where: { receipt: { receiptDate: { gte: rangeStart, lt: rangeEnd } } },
                select: {
                    productId: true,
                    productName: true,
                    unitPrice: true,
                    receipt: { select: { receiptDate: true } },
                },
            }),
        ])

        const monthlyProducts = new Map<string, { month: string; productId: number; productName: string; quantity: number; revenue: number }>()
        for (const item of items) {
            const monthKey = `${item.receipt.receiptDate.getUTCFullYear()}-${String(item.receipt.receiptDate.getUTCMonth() + 1).padStart(2, '0')}`
            const key = `${monthKey}:${item.productId}:${item.productName}`
            const row = monthlyProducts.get(key) || {
                month: monthKey,
                productId: item.productId,
                productName: item.productName,
                quantity: 0,
                revenue: 0,
            }
            row.quantity += 1
            row.revenue += item.unitPrice
            monthlyProducts.set(key, row)
        }

        return NextResponse.json({
            period,
            from: rangeStart.toISOString(),
            to: rangeEnd.toISOString(),
            monthlyProducts: Array.from(monthlyProducts.values()).sort((a, b) => a.month.localeCompare(b.month) || b.quantity - a.quantity),
            receipts,
        })
    } catch (error) {
        console.error('POS sales report failed:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}