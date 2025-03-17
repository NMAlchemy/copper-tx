import { Context } from 'telegraf';

export async function handleHelp(ctx: Context) {
  ctx.reply(
    'Welcome to Copperx Bot!\n\n' +
    'Commands:\n' +
    '/balance - View wallet balances\n' +
    '/send - Send funds (email, wallet, bank)\n' +
    '/withdrawbank - Withdraw to bank\n' +
    '/deposit - Get deposit instructions\n' +
    '/transactions - View last 10 transactions\n' +
    '/setdefault - Set default wallet\n' +
    '/profile - View account profile\n' +
    '/kyc - Check KYC/KYB status\n' +
    '/login - Log in with Copperx credentials\n' +
    '/support - Get help from the community'
  );
}

export async function handleSupport(ctx: Context) {
  ctx.reply('Need assistance? Join our community: https://t.me/copperxcommunity/2183');
}
