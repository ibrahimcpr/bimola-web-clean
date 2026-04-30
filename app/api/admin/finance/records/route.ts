import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const startDate = searchParams.get('startDate');
        const endDate = searchParams.get('endDate');
        const month = searchParams.get('month');
        const year = searchParams.get('year');
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '50');

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

        const skip = (page - 1) * limit;

        const [records, total] = await Promise.all([
            prisma.financeRecord.findMany({
                where: whereClause,
                orderBy: { record_date: 'desc' },
                skip,
                take: limit,
            }),
            prisma.financeRecord.count({ where: whereClause }),
        ]);

        return NextResponse.json({
            records,
            total,
            page,
            pages: Math.ceil(total / limit),
        });
    } catch (error) {
        console.error('Error fetching finance records:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
