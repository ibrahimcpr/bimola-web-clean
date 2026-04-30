import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
    try {
        const { record_type, category, amount, record_date, month, year, created_by } = await request.json();

        // Validate required fields
        if (!record_type || !category || !amount || !created_by) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Validate record_type
        if (!['income', 'expense'].includes(record_type)) {
            return NextResponse.json({ error: 'Invalid record_type' }, { status: 400 });
        }

        // Validate amount
        const parsedAmount = parseFloat(amount);
        if (isNaN(parsedAmount) || parsedAmount <= 0) {
            return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });
        }

        // Create record
        const record = await prisma.financeRecord.create({
            data: {
                record_type,
                category,
                amount: parsedAmount,
                record_date: record_date ? new Date(record_date) : new Date(),
                month: month || new Date().getMonth() + 1,
                year: year || new Date().getFullYear(),
                created_by,
            },
        });

        return NextResponse.json({ success: true, record }, { status: 201 });
    } catch (error) {
        console.error('Error creating finance record:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}