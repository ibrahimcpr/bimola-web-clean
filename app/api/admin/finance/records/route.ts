import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const dynamic = 'force-dynamic';

function parseDateOnly(value: string): Date | null {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
    const date = new Date(`${value}T00:00:00.000Z`);
    return Number.isNaN(date.getTime()) ? null : date;
}

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const startDate = searchParams.get('startDate');
        const endDate = searchParams.get('endDate');
        const month = searchParams.get('month');
        const year = searchParams.get('year');
        const recordType = searchParams.get('recordType');
        const search = searchParams.get('search')?.trim();
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '50');

        let whereClause: any = {};

        if (startDate || endDate) {
            const start = startDate ? parseDateOnly(startDate) : null;
            const end = endDate ? parseDateOnly(endDate) : null;
            if ((startDate && !start) || (endDate && !end)) {
                return NextResponse.json({ error: 'Invalid date. Use YYYY-MM-DD.' }, { status: 400 });
            }
            whereClause.record_date = {
                ...(start ? { gte: start } : {}),
                ...(end ? { lt: new Date(end.getTime() + 24 * 60 * 60 * 1000) } : {}),
            };
        }
        if (month && year) {
            whereClause.month = parseInt(month);
            whereClause.year = parseInt(year);
        }
        if (recordType && recordType !== 'all') {
            if (!['income', 'expense'].includes(recordType)) {
                return NextResponse.json({ error: 'Invalid record type.' }, { status: 400 });
            }
            whereClause.record_type = recordType;
        }
        if (search) {
            whereClause.OR = [
                { category: { contains: search, mode: 'insensitive' } },
                { created_by: { contains: search, mode: 'insensitive' } },
            ];
        }

        if (!Number.isInteger(page) || page < 1 || !Number.isInteger(limit) || limit < 1 || limit > 100) {
            return NextResponse.json({ error: 'Invalid pagination.' }, { status: 400 });
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
