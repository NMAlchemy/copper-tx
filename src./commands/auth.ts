import axios from 'axios';
import { Context } from 'telegraf';
import { PrismaClient } from '@prisma/client';
import { encrypt, decrypt } from '../utils/security';
import { setupPusherForUser } from '../utils/pusher';

const prisma = new PrismaClient();
const API_BASE_URL = process.env.API_BASE_URL!;

export async function handleLogin(ctx: Context) {
  ctx.reply('Please enter your email to receive an OTP.');
  ctx.session!.waitingForEmail = true;
}

export async function handleOtp(ctx: Context) {
  const otp = ctx.message?.text.split(' ')[1];
  if (!otp || !ctx.session!.email) return ctx.reply('Please provide an OTP after /login.');
  try {
    const response = await axios.post(`${API_BASE_URL}/api/auth/email-otp/authenticate`, {
      email: ctx.session!.email,
      otp,
    });
    const token = response.data.token;
    const profile = await axios.get(`${API_BASE_URL}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const organizationId = profile.data.organizationId;

    await prisma.user.upsert({
      where: { telegramId: ctx.session!.telegramId! },
      update: { sessionToken: encrypt(token), organizationId },
      create: { telegramId: ctx.session!.telegramId!, sessionToken: encrypt(token), organizationId },
    });

    await setupPusherForUser(ctx.session!.telegramId!, organizationId, token);
    ctx.reply('Logged in successfully! Deposit notifications enabled.');
    delete ctx.session!.email;
  } catch (error) {
    ctx.reply('Invalid OTP or login failed. Try again.');
  }
}

export async function handleProfile(ctx: Context) {
  const token = await getSessionToken(ctx);
  if (!token) return ctx.reply('Please log in first with /login.');
  try {
    const response = await axios.get(`${API_BASE_URL}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const profile = response.data;
    ctx.reply(`Profile:\nEmail: ${profile.email}\nID: ${profile.id}`);
  } catch (error) {
    ctx.reply('Failed to fetch profile. Try again later.');
  }
}

export async function handleKyc(ctx: Context) {
  const token = await getSessionToken(ctx);
  if (!token) return ctx.reply('Please log in first with /login.');
  try {
    const response = await axios.get(`${API_BASE_URL}/api/kycs`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const status = response.data.status;
    if (status === 'approved') {
      ctx.reply('Your KYC/KYB is approved.');
    } else {
      ctx.reply('Your KYC/KYB is not approved. Complete it at: https://platform.copperx.io/kyc');
    }
  } catch (error) {
    ctx.reply('Failed to check KYC status.');
  }
}

async function getSessionToken(ctx: Context): Promise<string | null> {
  const user = await prisma.user.findUnique({ where: { telegramId: ctx.session!.telegramId! } });
  return user?.sessionToken ? decrypt(user.sessionToken) : null;
}
