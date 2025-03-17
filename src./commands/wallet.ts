import axios from 'axios';
import { Context, Markup } from 'telegraf';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const API_BASE_URL = process.env.API_BASE_URL!;

export async function handleBalances(ctx: Context) {
  const token = await getSessionToken(ctx);
  if (!token) return ctx.reply('Please log in first with /login.');
  try {
    const response = await axios.get(`${API_BASE_URL}/api/wallets/balances`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const balances = response.data.map(b => `${b.network}: ${b.balance} ${b.currency}`).join('\n');
    ctx.reply(`Your wallet balances:\n${balances || 'No balances found.'}`);
  } catch (error) {
    ctx.reply('Failed to retrieve balances.');
  }
}

export async function handleSetDefault(ctx: Context) {
  const address = ctx.message?.text.split(' ')[1];
  if (!address) return ctx.reply('Usage: /setdefault <wallet_address>');
  const token = await getSessionToken(ctx);
  if (!token) return ctx.reply('Please log in first with /login.');
  try {
    await axios.post(`${API_BASE_URL}/api/wallets/default`, { walletAddress: address }, {
      headers: { Authorization: `Bearer ${token}` },
    });
    ctx.reply(`Default wallet set to ${address}.`);
  } catch (error) {
    ctx.reply('Failed to set default wallet.');
  }
}

export async function handleDeposit(ctx: Context) {
  const token = await getSessionToken(ctx);
  if (!token) return ctx.reply('Please log in first with /login.');
  try {
    const response = await axios.get(`${API_BASE_URL}/api/wallets/default`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const wallet = response.data;
    ctx.reply(`Deposit to: ${wallet.address} on ${wallet.network}.`);
  } catch (error) {
    ctx.reply('Set a default wallet first with /setdefault.');
  }
}

export async function handleHistory(ctx: Context) {
  const token = await getSessionToken(ctx);
  if (!token) return ctx.reply('Please log in first with /login.');
  try {
    const response = await axios.get(`${API_BASE_URL}/api/transfers?page=1&limit=10`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const history = response.data.map(t => `${t.date}: ${t.type} - ${t.amount} ${t.currency}`).join('\n');
    ctx.reply(`Transaction history:\n${history || 'No transactions found.'}`);
  } catch (error) {
    ctx.reply('Failed to fetch history.');
  }
}

async function getSessionToken(ctx: Context): Promise<string | null> {
  const user = await prisma.user.findUnique({ where: { telegramId: ctx.session!.telegramId! } });
  return user?.sessionToken ? decrypt(user.sessionToken) : null;
    }
