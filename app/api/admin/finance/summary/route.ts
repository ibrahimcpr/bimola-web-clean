import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const startDate = searchParams.get('startDate');
        const endDate = searchParams.get('endDate');

        let whereClause: any = {};

        if (startDate && endDate) {
            whereClause.record_date = {
                gte: new Date(startDate),
                lte: new Date(endDate),
            };
        }

        const records = await prisma.financeRecord.findMany({
            where: whereClause,
            orderBy: { record_date: 'asc' },
        });

        // Calculate summary
        const summary = records.reduce(
            (acc, record) => {
                if (record.record_type === 'income') {
                    acc.totalIncome += record.amount;
                } else {
                    acc.totalExpense += record.amount;
                }
                return acc;
            },
            { totalIncome: 0, totalExpense: 0 }
        );

        return NextResponse.json({
            ...summary,
            netProfit: summary.totalIncome - summary.totalExpense,
        });
    } catch (error) {
        console.error('Error fetching finance summary:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}