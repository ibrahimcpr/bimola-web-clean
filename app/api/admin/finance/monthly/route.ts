import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const dynamic = 'force-dynamic';

function parseDateOnlyUTC(value: string): Date | null {
    // Expect YYYY-MM-DD
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
    if (!match) return null;
    const year = Number(match[1]);
    const month = Number(match[2]);
    const day = Number(match[3]);
    const dt = new Date(Date.UTC(year, month - 1, day));
    return Number.isNaN(dt.getTime()) ? null : dt;
}

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
            const start = parseDateOnlyUTC(startDate);
            const end = parseDateOnlyUTC(endDate);
            if (!start || !end) {
                return NextResponse.json(
                    { error: 'Invalid date range. Use YYYY-MM-DD for startDate/endDate.' },
                    { status: 400 }
                );
            }

            // Make endDate inclusive by converting it to an exclusive upper bound (next day at 00:00 UTC)
            const endExclusive = new Date(end.getTime());
            endExclusive.setUTCDate(endExclusive.getUTCDate() + 1);

            whereClause.record_date = {
                gte: start,
                lt: endExclusive,
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