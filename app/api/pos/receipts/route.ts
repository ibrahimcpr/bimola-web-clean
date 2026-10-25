import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, x-pos-api-key',
}

interface ReceiptItemInput {
    productId: number
    productName: string
    unitPrice: number
}

interface ReceiptInput {
    receiptNo: string
    receiptDate: string
    tableName: string
    paymentMethod: string
    total: number
    receiptText: string
    items: ReceiptItemInput[]
}

function response(code: string, message: string, status: number) {
    return NextResponse.json({ code, message }, { status, headers: corsHeaders })
}

export function OPTIONS() {
    return new NextResponse(null, { status: 204, headers: corsHeaders })
}

export async function POST(request: NextRequest) {
    const expectedToken = process.env.POS_API_TOKEN
    if (!expectedToken) {
        return response('POS_API_NOT_CONFIGURED', 'POS API anahtarı sunucuda ayarlanmamış.', 503)
    }
    if (request.headers.get('x-pos-api-key') !== expectedToken) {
        return response('POS_UNAUTHORIZED', 'Yetkisiz istek.', 401)
    }

    try {
        const body = await request.json() as ReceiptInput
        const receiptDate = new Date(body.receiptDate)
        const validItems = Array.isArray(body.items) && body.items.length > 0 && body.items.every((item) =>
            Number.isInteger(item.productId) && item.productId > 0 &&
            typeof item.productName === 'string' && item.productName.trim().length > 0 &&
            Number.isFinite(item.unitPrice) && item.unitPrice >= 0
        )

        if (
            typeof body.receiptNo !== 'string' || !body.receiptNo.trim() || body.receiptNo.length > 80 ||
            !Number.isFinite(receiptDate.getTime()) ||
            typeof body.tableName !== 'string' || !body.tableName.trim() ||
            !['NAKIT', 'KART', 'NAKIT_KART'].includes(body.paymentMethod) ||
            !Number.isFinite(body.total) || body.total <= 0 ||
            typeof body.receiptText !== 'string' || !validItems
        ) {
            return response('INVALID_RECEIPT', 'Fiş bilgileri geçersiz.', 400)
        }

        const itemTotal = body.items.reduce((sum, item) => sum + item.unitPrice, 0)
        if (Math.abs(itemTotal - body.total) > 0.01) {
            return response('INVALID_RECEIPT_TOTAL', 'Fiş toplamı ürün satırlarıyla eşleşmiyor.', 400)
        }

        const existing = await prisma.posReceipt.findUnique({ where: { receiptNo: body.receiptNo } })
        if (existing) {
            return response('RECEIPT_RECORDED', 'Fiş daha önce kaydedilmiş.', 200)
        }

        await prisma.posReceipt.create({
            data: {
                receiptNo: body.receiptNo,
                receiptDate,
                tableName: body.tableName,
                paymentMethod: body.paymentMethod,
                total: body.total,
                receiptText: body.receiptText,
                items: {
                    create: body.items.map((item) => ({
                        productId: item.productId,
                        productName: item.productName.trim(),
                        unitPrice: item.unitPrice,
                    }))
                },
            },
        })

        return response('RECEIPT_RECORDED', 'Fiş sunucuya kaydedildi.', 200)
    } catch (error) {
        console.error('POS receipt save failed:', error)
        return response('RECEIPT_SAVE_FAILED', 'Sunucu hatası: kayıt tamamlanamadı.', 500)
    }
}