import { Telegraf, Markup } from 'telegraf';
import { PrismaClient } from '@prisma/client';
import { Connection, Keypair } from '@solana/web3.js';
import { initializePusher, setupPusherForUser } from './utils/pusher';
import { encrypt, decrypt } from './utils/security';
import * as authCommands from './commands/auth';
import * as walletCommands from './commands/wallet';
import * as transferCommands from './commands/transfer';
import * as helpCommands from './commands/help';

const bot = new Telegraf(process.env.BOT_TOKEN!);
const prisma = new PrismaClient();
const connection = new Connection(process.env.SOLANA_RPC_URL!, 'confirmed');
const botKeypair = Keypair.fromSecretKey(Buffer.from(process.env.BOT_PRIVATE_KEY!, 'base58'));

// Initialize Pusher with bot instance
initializePusher(bot);

// Middleware for session management
bot.use(async (ctx, next) => {
  ctx.session = ctx.session || {};
  ctx.session.telegramId = ctx.from?.id.toString();
  await next();
});

// Register commands
bot.command('login', authCommands.handleLogin);
bot.command('otp', authCommands.handleOtp);
bot.command('profile', authCommands.handleProfile);
bot.command('kyc', authCommands.handleKyc);

bot.command('balances', walletCommands.handleBalances);
bot.command('setdefault', walletCommands.handleSetDefault);
bot.command('deposit', walletCommands.handleDeposit);
bot.command('history', walletCommands.handleHistory);

bot.command('send', transferCommands.handleSend);
bot.command('sendemail', transferCommands.handleSendEmail);
bot.command('sendwallet', transferCommands.handleSendWallet);
bot.command('withdrawbank', transferCommands.handleWithdrawBank);
bot.command('transactions', transferCommands.handleTransactions);
bot.command('confirm', transferCommands.handleConfirm);
bot.command('cancel', transferCommands.handleCancel);

bot.command('help', helpCommands.handleHelp);
bot.command('support', helpCommands.handleSupport);

// Natural language query support
bot.on('text', async (ctx) => {
  const text = ctx.message.text.toLowerCase();
  if (text.includes('balance')) return walletCommands.handleBalances(ctx);
  if (text.includes('send')) return transferCommands.handleSend(ctx);
  if (text.includes('withdraw')) return ctx.reply('Use /withdrawbank <bank_id> <amount> <currency>');
});

// Launch bot
bot.launch().then(() => console.log('Copperx Bot is running with sophistication...'));
process.once('SIGINT', () => bot.stop('SIGINT'));
