import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const year = searchParams.get('year');
        const month = searchParams.get('month');
        const startDate = searchParams.get('startDate');
        const endDate = searchParams.get('endDate');

        let whereClause: any = {};

        if (year) {
            whereClause.year = parseInt(year);
        }
        if (month) {
            whereClause.month = parseInt(month);
        }
        if (startDate && endDate) {
            whereClause.record_date = {
                gte: new Date(startDate),
                lte: new Date(endDate),
            };
        }

        const records = await prisma.financeRecord.findMany({
            where: whereClause,
            orderBy: { year: 'asc', month: 'asc' },
        });

        // Group by month/year
        const monthlyData = records.reduce((acc, record) => {
            const key = `${record.year}-${record.month}`;
            if (!acc[key]) {
                acc[key] = { year: record.year, month: record.month, totalIncome: 0, totalExpense: 0 };
            }
            if (record.record_type === 'income') {
                acc[key].totalIncome += record.amount;
            } else {
                acc[key].totalExpense += record.amount;
            }
            return acc;
        }, {} as Record<string, any>);

        const result = Object.values(monthlyData).map((item: any) => ({
            ...item,
            netProfit: item.totalIncome - item.totalExpense,
        }));

        return NextResponse.json(result);
    } catch (error) {
        console.error('Error fetching monthly finance data:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}