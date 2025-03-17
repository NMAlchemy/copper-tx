import axios from 'axios';
import { Context, Markup } from 'telegraf';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const API_BASE_URL = process.env.API_BASE_URL!;

export async function handleSend(ctx: Context) {
  ctx.reply('Choose a send option:', Markup.inlineKeyboard([
    [Markup.button.callback('To Email', 'send_email')],
    [Markup.button.callback('To Wallet', 'send_wallet')],
    [Markup.button.callback('To Bank', 'withdraw_bank')],
  ]));
}

export async function handleSendEmail(ctx: Context) {
  const [_, email, amountStr, currency] = ctx.message?.text.split(' ') || [];
  if (!email || !amountStr || !currency) return ctx.reply('Usage: /sendemail <email> <amount> <currency>');
  const amount = parseFloat(amountStr);
  if (isNaN(amount) || amount <= 0) return ctx.reply('Invalid amount.');
  const token = await getSessionToken(ctx);
  if (!token) return ctx.reply('Please log in first with /login.');
  ctx.session!.pendingTransfer = { type: 'email', email, amount, currency, fee: 0.5 };
  ctx.reply(`Send ${amount} ${currency} to ${email}? Fee: 0.5 ${currency}. Reply /confirm or /cancel.`);
}

export async function handleSendWallet(ctx: Context) {
  const [_, address, amountStr, currency, network] = ctx.message?.text.split(' ') || [];
  if (!address || !amountStr || !currency || !network) return ctx.reply('Usage: /sendwallet <address> <amount> <currency> <network>');
  const amount = parseFloat(amountStr);
  if (isNaN(amount) || amount <= 0) return ctx.reply('Invalid amount.');
  const token = await getSessionToken(ctx);
  if (!token) return ctx.reply('Please log in first with /login.');
  ctx.session!.pendingTransfer = { type: 'wallet', address, amount, currency, network, fee: 0.01 };
  ctx.reply(`Send ${amount} ${currency} to ${address} on ${network}? Fee: 0.01 ${currency}. Reply /confirm or /cancel.`);
}

export async function handleWithdrawBank(ctx: Context) {
  const [_, bankId, amountStr, currency] = ctx.message?.text.split(' ') || [];
  if (!bankId || !amountStr || !currency) return ctx.reply('Usage: /withdrawbank <bank_id> <amount> <currency>');
  const amount = parseFloat(amountStr);
  if (isNaN(amount) || amount <= 0) return ctx.reply('Invalid amount.');
  const token = await getSessionToken(ctx);
  if (!token) return ctx.reply('Please log in first with /login.');
  ctx.session!.pendingTransfer = { type: 'bank', bankId, amount, currency, fee: 2 };
  ctx.reply(`Withdraw ${amount} ${currency} to bank ${bankId}? Fee: 2 ${currency}. Reply /confirm or /cancel.`);
}

export async function handleTransactions(ctx: Context) {
  const token = await getSessionToken(ctx);
  if (!token) return ctx.reply('Please log in first with /login.');
  try {
    const response = await axios.get(`${API_BASE_URL}/api/transfers?page=1&limit=10`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const transfers = response.data.map(t => `${t.date}: ${t.type} - ${t.amount} ${t.currency}`).join('\n');
    ctx.reply(`Last 10 transactions:\n${transfers || 'None found.'}`);
  } catch (error) {
    ctx.reply('Failed to fetch transactions.');
  }
}

export async function handleConfirm(ctx: Context) {
  const transfer = ctx.session!.pendingTransfer;
  if (!transfer) return ctx.reply('No pending transfer to confirm.');
  const token = await getSessionToken(ctx);
  if (!token) return ctx.reply('Please log in first with /login.');
  try {
    switch (transfer.type) {
      case 'email':
        await axios.post(`${API_BASE_URL}/api/transfers/send`, transfer, { headers: { Authorization: `Bearer ${token}` } });
        ctx.reply(`Sent ${transfer.amount} ${transfer.currency} to ${transfer.email}.`);
        break;
      case 'wallet':
        await axios.post(`${API_BASE_URL}/api/transfers/wallet-withdraw`, transfer, { headers: { Authorization: `Bearer ${token}` } });
        ctx.reply(`Sent ${transfer.amount} ${transfer.currency} to ${transfer.address}.`);
        break;
      case 'bank':
        await axios.post(`${API_BASE_URL}/api/transfers/offramp`, transfer, { headers: { Authorization: `Bearer ${token}` } });
        ctx.reply(`Withdrawn ${transfer.amount} ${transfer.currency} to bank ${transfer.bankId}.`);
        break;
    }
  } catch (error) {
    ctx.reply('Transfer failed.');
  } finally {
    delete ctx.session!.pendingTransfer;
  }
}

export async function handleCancel(ctx: Context) {
  delete ctx.session!.pendingTransfer;
  ctx.reply('Transfer cancelled.');
}

async function getSessionToken(ctx: Context): Promise<string | null> {
  const user = await prisma.user.findUnique({ where: { telegramId: ctx.session!.telegramId! } });
  return user?.sessionToken ? decrypt(user.sessionToken) : null;
}
