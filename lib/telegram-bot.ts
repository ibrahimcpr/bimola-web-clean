import TelegramBot from 'node-telegram-bot-api';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const token = process.env.TELEGRAM_BOT_TOKEN;
if (!token) {
    throw new Error('TELEGRAM_BOT_TOKEN is not set');
}

const authorizedUserIds = process.env.AUTHORIZED_TELEGRAM_USER_IDS?.split(',') || [];

const bot = new TelegramBot(token, { polling: true });

// Helper function to check authorization
function isAuthorized(userId: number): boolean {
    return authorizedUserIds.includes(userId.toString());
}

// Helper function to parse amount
function parseAmount(input: string): number | null {
    const cleaned = input.replace(/[^\d.,]/g, '').replace(',', '.');
    const parsed = parseFloat(cleaned);
    return isNaN(parsed) || parsed <= 0 ? null : parsed;
}

// Main menu
const mainMenu = {
    reply_markup: {
        keyboard: [
            [{ text: 'Gelir Ekle' }, { text: 'Gider Ekle' }],
            [{ text: 'Aylık Özet' }, { text: 'Eksik Giriş Kontrolü' }],
            [{ text: 'Eksik Veri Girişi' }],
        ],
        resize_keyboard: true,
        one_time_keyboard: false,
    },
};

// Income categories
const incomeCategories = ['Nakit Geliri', 'Kredi Kartı Geliri', 'Trendyol Geliri', 'Yemek Kartı Geliri'];

// Expense categories
const expenseCategories = ['Kira Gideri', 'Market Gideri', 'Eker Gideri', 'Faturalar', 'Personel Gideri', 'Diğer Gider'];

// User states
const userStates: Record<number, any> = {};
const requiredMissingIncomeCategories = ['Yemek Kartı Geliri', 'Trendyol Geliri'];

function sendMainMenu(chatId: number) {
    bot.sendMessage(chatId, 'Hoş geldiniz! Lütfen bir işlem seçin:', {
        reply_markup: { remove_keyboard: true },
    });

    bot.sendMessage(chatId, 'Hoş geldiniz! Lütfen bir işlem seçin:', mainMenu);
}

function getLastDayOfMonth(year: number, month: number): Date {
    return new Date(year, month, 0, 23, 59, 59, 999);
}

async function getMissingMonthData(): Promise<Array<{ month: number; year: number; missingCategories: string[] }>> {
    const result: Array<{ month: number; year: number; missingCategories: string[] }> = [];
    const now = new Date();

    for (let offset = 0; offset < 12; offset++) {
        const currentMonthDate = new Date(now.getFullYear(), now.getMonth() - offset, 1);
        const year = currentMonthDate.getFullYear();
        const month = currentMonthDate.getMonth() + 1;
        const missingCategories: string[] = [];

        for (const category of requiredMissingIncomeCategories) {
            const count = await prisma.financeRecord.count({
                where: {
                    record_type: 'income',
                    category,
                    month,
                    year,
                },
            });

            if (count === 0) {
                missingCategories.push(category);
            }
        }

        if (missingCategories.length > 0) {
            result.push({ month, year, missingCategories });
        }
    }

    return result;
}

bot.onText(/\/start|\/menu/, (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from?.id;

    if (!userId || !isAuthorized(userId)) {
        bot.sendMessage(chatId, 'Yetkisiz kullanıcı.');
        return;
    }

    sendMainMenu(chatId);
});

// Handle main menu selections
bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from?.id;
    const text = msg.text;

    if (!userId || !isAuthorized(userId)) {
        return;
    }

    if (!text) return;

    const state = userStates[userId] || {};

    if (text === 'Gelir Ekle') {
        userStates[userId] = { action: 'add_income', step: 'select_category' };
        const categoryKeyboard = {
            reply_markup: {
                keyboard: [
                    ...incomeCategories.map(cat => [{ text: cat }]),
                    [{ text: '◀️ Geri' }]
                ],
                resize_keyboard: true,
                one_time_keyboard: true,
            },
        };
        bot.sendMessage(chatId, 'Gelir tipini seçin:', categoryKeyboard);
    } else if (text === 'Gider Ekle') {
        userStates[userId] = { action: 'add_expense', step: 'select_category' };
        const categoryKeyboard = {
            reply_markup: {
                keyboard: [
                    ...expenseCategories.map(cat => [{ text: cat }]),
                    [{ text: '◀️ Geri' }]
                ],
                resize_keyboard: true,
                one_time_keyboard: true,
            },
        };
        bot.sendMessage(chatId, 'Gider tipini seçin:', categoryKeyboard);
    } else if (text === 'Aylık Özet') {
        // Implement monthly summary
        const now = new Date();
        const currentMonth = now.getMonth() + 1;
        const currentYear = now.getFullYear();

        const records = await prisma.financeRecord.findMany({
            where: { month: currentMonth, year: currentYear },
        });

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

        const netProfit = summary.totalIncome - summary.totalExpense;

        bot.sendMessage(
            chatId,
            `Bu ay özeti:\nToplam Gelir: ${summary.totalIncome.toFixed(2)} TL\nToplam Gider: ${summary.totalExpense.toFixed(2)} TL\nNet Kar: ${netProfit.toFixed(2)} TL`
        );
    } else if (text === 'Eksik Giriş Kontrolü') {
        const now = new Date();
        const previousMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const lastMonth = previousMonthDate.getMonth() + 1;
        const lastMonthYear = previousMonthDate.getFullYear();
        const missing: string[] = [];

        for (const category of requiredMissingIncomeCategories) {
            const count = await prisma.financeRecord.count({
                where: {
                    record_type: 'income',
                    category,
                    month: lastMonth,
                    year: lastMonthYear,
                },
            });
            if (count === 0) {
                missing.push(category);
            }
        }

        if (missing.length > 0) {
            const message = `${lastMonth}/${lastMonthYear} için eksik girişler: ${missing.join(', ')}. Lütfen kontrol ediniz.`;
            bot.sendMessage(chatId, message);
        } else {
            bot.sendMessage(chatId, 'Geçen ay için tüm gerekli girişler mevcut.');
        }
    } else if (text === 'Eksik Veri Girişi') {
        const missingMonths = await getMissingMonthData();

        if (missingMonths.length === 0) {
            bot.sendMessage(chatId, 'Şu anda eksik veri gireceğiniz ay bulunmuyor.');
            return;
        }

        userStates[userId] = {
            action: 'missing_entry',
            step: 'select_month',
            missingMonths,
        };

        const monthKeyboard = {
            reply_markup: {
                keyboard: [
                    ...missingMonths.map((item: { month: number; year: number; missingCategories: string[] }) => [{ text: `${String(item.month).padStart(2, '0')}/${item.year}` }]),
                    [{ text: '◀️ Geri' }],
                ],
                resize_keyboard: true,
                one_time_keyboard: true,
            },
        };

        bot.sendMessage(chatId, 'Eksik veri için ay seçin:', monthKeyboard);
    } else if (text === '◀️ Geri') {
        delete userStates[userId];
        bot.sendMessage(chatId, 'Ana menüye dönüldü.', mainMenu);
    } else if (state.action === 'missing_entry' && state.step === 'select_month') {
        const match = text.match(/^(\d{1,2})\/(\d{4})$/);
        if (!match) {
            bot.sendMessage(chatId, 'Lütfen formatı doğru seçin, örnek: 06/2026');
            return;
        }

        const month = Number(match[1]);
        const year = Number(match[2]);
        const selectedMonth = state.missingMonths.find(
            (item: { month: number; year: number; missingCategories: string[] }) => item.month === month && item.year === year
        );

        if (!selectedMonth) {
            bot.sendMessage(chatId, 'Bu ay için eksik veri girişi yok. Lütfen başka ay seçin.');
            return;
        }

        userStates[userId] = {
            ...state,
            targetMonth: month,
            targetYear: year,
            missingCategories: selectedMonth.missingCategories,
            step: 'select_missing_category',
        };

        const categoryKeyboard = {
            reply_markup: {
                keyboard: [
                    ...selectedMonth.missingCategories.map((cat: string) => [{ text: cat }]),
                    [{ text: '◀️ Geri' }],
                ],
                resize_keyboard: true,
                one_time_keyboard: true,
            },
        };

        bot.sendMessage(chatId, `${String(month).padStart(2, '0')}/${year} için eksik kategori seçin:`, categoryKeyboard);
    } else if (state.action === 'missing_entry' && state.step === 'select_missing_category') {
        if (!state.missingCategories?.includes(text)) {
            bot.sendMessage(chatId, 'Lütfen listeden bir kategori seçin.');
            return;
        }

        userStates[userId] = {
            ...state,
            category: text,
            step: 'enter_amount',
        };

        const amountKeyboard = {
            reply_markup: {
                keyboard: [[{ text: '◀️ Geri' }]],
                resize_keyboard: true,
                one_time_keyboard: false,
            },
        };

        bot.sendMessage(chatId, 'Tutar girin (örnek: 1000 veya 1.000,50):', amountKeyboard);
    } else if (state.action === 'add_income' && state.step === 'select_category') {
        if (incomeCategories.includes(text)) {
            userStates[userId] = { ...state, category: text, step: 'enter_amount' };
            const amountKeyboard = {
                reply_markup: {
                    keyboard: [
                        [{ text: '◀️ Geri' }]
                    ],
                    resize_keyboard: true,
                    one_time_keyboard: false,
                },
            };
            bot.sendMessage(chatId, 'Tutar girin (örnek: 1000 veya 1.000,50):', amountKeyboard);
        }
    } else if (state.action === 'add_expense' && state.step === 'select_category') {
        if (expenseCategories.includes(text)) {
            userStates[userId] = { ...state, category: text, step: 'enter_amount' };
            const amountKeyboard = {
                reply_markup: {
                    keyboard: [
                        [{ text: '◀️ Geri' }]
                    ],
                    resize_keyboard: true,
                    one_time_keyboard: false,
                },
            };
            bot.sendMessage(chatId, 'Tutar girin (örnek: 1000 veya 1.000,50):', amountKeyboard);
        }
    } else if (state.step === 'enter_amount') {
        const amount = parseAmount(text);
        if (amount === null) {
            bot.sendMessage(chatId, 'Geçersiz tutar. Lütfen tekrar girin:');
            return;
        }

        const isMissingEntry = state.action === 'missing_entry';
        const targetYear = isMissingEntry ? state.targetYear : new Date().getFullYear();
        const targetMonth = isMissingEntry ? state.targetMonth : new Date().getMonth() + 1;
        const recordType = state.action === 'missing_entry' || state.action === 'add_income' ? 'income' : 'expense';
        const recordDate = isMissingEntry
            ? getLastDayOfMonth(targetYear, targetMonth)
            : new Date();

        await prisma.financeRecord.create({
            data: {
                record_type: recordType,
                category: state.category,
                amount,
                record_date: recordDate,
                month: targetMonth,
                year: targetYear,
                created_by: userId.toString(),
            },
        });

        const summaryText = isMissingEntry
            ? `${state.category} - ${amount.toFixed(2)} TL (${String(targetMonth).padStart(2, '0')}/${targetYear} için eksik veri eklendi)`
            : `${state.category} - ${amount.toFixed(2)} TL`;

        bot.sendMessage(chatId, `Kayıt alındı: ${summaryText}`);

        delete userStates[userId];
        bot.sendMessage(chatId, 'Başka bir işlem yapmak ister misiniz?', mainMenu);
    }
});

// Helper function to check missing entries and notify
async function checkMissingEntries() {
    const now = new Date();
    const previousMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonth = previousMonthDate.getMonth() + 1;
    const lastMonthYear = previousMonthDate.getFullYear();

    const missing: string[] = [];

    for (const category of requiredMissingIncomeCategories) {
        const count = await prisma.financeRecord.count({
            where: {
                record_type: 'income',
                category,
                month: lastMonth,
                year: lastMonthYear,
            },
        });
        if (count === 0) {
            missing.push(category);
        }
    }

    if (missing.length > 0) {
        const message = `${lastMonth}/${lastMonthYear} için eksik girişler: ${missing.join(', ')}. Lütfen kontrol ediniz.`;

        // Send to all authorized users
        for (const userId of authorizedUserIds) {
            try {
                await bot.sendMessage(parseInt(userId), message);
            } catch (error) {
                console.error(`Failed to send message to ${userId}:`, error);
            }
        }
    }
}

// Check missing entries on startup and schedule daily check
checkMissingEntries();
setInterval(checkMissingEntries, 24 * 60 * 60 * 1000); // Daily check