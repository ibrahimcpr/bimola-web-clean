import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        const { category, amount } = await request.json();

        if (!category || !amount) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const record = await prisma.financeRecord.update({
            where: { id: params.id },
            data: { category, amount: parseFloat(amount) },
        });

        return NextResponse.json({ success: true, record });
    } catch (error) {
        console.error('Error updating finance record:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        await prisma.financeRecord.delete({
            where: { id: params.id },
        });

        return NextResponse.json({ success: true, message: 'Record deleted' });
    } catch (error) {
        console.error('Error deleting finance record:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
