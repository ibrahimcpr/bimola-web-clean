import { NextResponse } from 'next/server'
import { isAuthenticated } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
    if (!await isAuthenticated()) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        const item = await prisma.posReceiptItem.findUnique({
            where: { id: params.id },
            include: { receipt: true },
        })
        if (!item) {
            return NextResponse.json({ error: 'Receipt item not found' }, { status: 404 })
        }

        await prisma.$transaction(async (tx) => {
            await tx.posReceiptItem.delete({ where: { id: item.id } })
            const nextTotal = Math.max(0, Math.round((item.receipt.total - item.unitPrice) * 100) / 100)
            await tx.posReceipt.update({ where: { id: item.receiptId }, data: { total: nextTotal } })
            if (nextTotal === 0) {
                await tx.financeRecord.deleteMany({ where: { source_receipt_no: item.receipt.receiptNo } })
            } else {
                await tx.financeRecord.updateMany({
                    where: { source_receipt_no: item.receipt.receiptNo },
                    data: { amount: nextTotal },
                })
            }
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('POS receipt item delete failed:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}