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
        ],
        resize_keyboard: true,
        one_time_keyboard: false,
    },
};

// Income categories
const incomeCategories = ['Nakit Geliri', 'Kredi Kartı Geliri', 'Trendyol Geliri', 'Yemek Kartı Geliri'];

// Expense categories
const expenseCategories = ['Kira Gideri', 'Market Gideri', 'Eker Gideri', 'Faturalar', 'Diğer Gider'];

// User states
const userStates: Record<number, any> = {};

bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from?.id;

    if (!userId || !isAuthorized(userId)) {
        bot.sendMessage(chatId, 'Yetkisiz kullanıcı.');
        return;
    }

    bot.sendMessage(chatId, 'Hoş geldiniz! Lütfen bir işlem seçin:', mainMenu);
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
                keyboard: incomeCategories.map(cat => [{ text: cat }]),
                resize_keyboard: true,
                one_time_keyboard: true,
            },
        };
        bot.sendMessage(chatId, 'Gelir tipini seçin:', categoryKeyboard);
    } else if (text === 'Gider Ekle') {
        userStates[userId] = { action: 'add_expense', step: 'select_category' };
        const categoryKeyboard = {
            reply_markup: {
                keyboard: expenseCategories.map(cat => [{ text: cat }]),
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
        // Implement missing entry check
        const now = new Date();
        const lastMonth = now.getMonth() === 0 ? 12 : now.getMonth();
        const lastMonthYear = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();

        const requiredIncomes = ['Yemek Kartı Geliri', 'Trendyol Geliri'];
        const missing: string[] = [];

        for (const category of requiredIncomes) {
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
    } else if (state.action === 'add_income' && state.step === 'select_category') {
        if (incomeCategories.includes(text)) {
            userStates[userId] = { ...state, category: text, step: 'enter_amount' };
            bot.sendMessage(chatId, 'Tutar girin (örnek: 1000 veya 1.000,50):');
        }
    } else if (state.action === 'add_expense' && state.step === 'select_category') {
        if (expenseCategories.includes(text)) {
            userStates[userId] = { ...state, category: text, step: 'enter_amount' };
            bot.sendMessage(chatId, 'Tutar girin (örnek: 1000 veya 1.000,50):');
        }
    } else if (state.step === 'enter_amount') {
        const amount = parseAmount(text);
        if (amount === null) {
            bot.sendMessage(chatId, 'Geçersiz tutar. Lütfen tekrar girin:');
            return;
        }

        const now = new Date();
        const record = await prisma.financeRecord.create({
            data: {
                record_type: state.action === 'add_income' ? 'income' : 'expense',
                category: state.category,
                amount,
                record_date: now,
                month: now.getMonth() + 1,
                year: now.getFullYear(),
                created_by: userId.toString(),
            },
        });

        bot.sendMessage(chatId, `Kayıt alındı: ${state.category} - ${amount.toFixed(2)} TL`);

        delete userStates[userId];
        bot.sendMessage(chatId, 'Başka bir işlem yapmak ister misiniz?', mainMenu);
    }
});

// Helper function to check missing entries and notify
async function checkMissingEntries() {
    const now = new Date();
    const lastMonth = now.getMonth() === 0 ? 12 : now.getMonth();
    const lastMonthYear = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();

    const requiredIncomes = ['Yemek Kartı Geliri', 'Trendyol Geliri'];
    const missing: string[] = [];

    for (const category of requiredIncomes) {
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