import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const startDate = searchParams.get('startDate');
        const endDate = searchParams.get('endDate');
        const month = searchParams.get('month');
        const year = searchParams.get('year');

        let whereClause: any = {};

        if (startDate && endDate) {
            whereClause.record_date = {
                gte: new Date(startDate),
                lte: new Date(endDate),
            };
        }
        if (month && year) {
            whereClause.month = parseInt(month);
            whereClause.year = parseInt(year);
        }

        const records = await prisma.financeRecord.findMany({
            where: whereClause,
            orderBy: { record_date: 'asc' },
        });

        // Group by category and type
        const categoryData: Record<string, any> = records.reduce((acc, record) => {
            const key = `${record.record_type}-${record.category}`;
            if (!acc[key]) {
                acc[key] = { record_type: record.record_type, category: record.category, total: 0 };
            }
            acc[key].total += record.amount;
            return acc;
        }, {} as Record<string, any>);

        const result = Object.values(categoryData);

        return NextResponse.json(result);
    } catch (error) {
        console.error('Error fetching category breakdown:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}