import Pusher from 'pusher-js';
import axios from 'axios';
import { Telegraf } from 'telegraf';

const API_BASE_URL = process.env.API_BASE_URL!;
const PUSHER_KEY = process.env.PUSHER_KEY!;
const PUSHER_CLUSTER = process.env.PUSHER_CLUSTER!;

// Global bot instance (passed from bot.ts)
let bot: Telegraf;

export function initializePusher(botInstance: Telegraf) {
  bot = botInstance;
}

export async function setupPusherForUser(telegramId: string, organizationId: string, token: string) {
  try {
    const pusherClient = new Pusher(PUSHER_KEY, {
      cluster: PUSHER_CLUSTER,
      authorizer: (channel) => ({
        authorize: async (socketId, callback) => {
          try {
            const response = await axios.post(
              `${API_BASE_URL}/api/notifications/auth`,
              {
                socket_id: socketId,
                channel_name: channel.name,
              },
              {
                headers: { Authorization: `Bearer ${token}` },
              }
            );

            if (response.data) {
              callback(null, response.data);
            } else {
              callback(new Error('Pusher authentication failed'), null);
            }
          } catch (error) {
            console.error('Pusher authorization error:', error);
            callback(error as Error, null);
          }
        },
      }),
    });

    const channelName = `private-org-${organizationId}`;
    const channel = pusherClient.subscribe(channelName);

    channel.bind('pusher:subscription_succeeded', () => {
      console.log(`Successfully subscribed to ${channelName} for user ${telegramId}`);
      bot.telegram.sendMessage(telegramId, '✅ Real-time deposit notifications enabled!');
    });

    channel.bind('pusher:subscription_error', (error) => {
      console.error(`Subscription error for ${channelName}:`, error);
      bot.telegram.sendMessage(telegramId, '⚠️ Failed to enable deposit notifications. Please try again later.');
    });

    // Bind deposit event per channel for user-specific notifications
    channel.bind('deposit', (data: any) => {
      const message = 
        `💰 *New Deposit Received*\n\n` +
        `${data.amount} USDC deposited on Solana\n` +
        `TxID: ${data.transactionId || 'N/A'}`;
      bot.telegram.sendMessage(telegramId, message, { parse_mode: 'Markdown' });
    });

    // Handle connection errors
    pusherClient.connection.bind('error', (error: any) => {
      console.error(`Pusher connection error for ${telegramId}:`, error);
    });

    console.log(`Pusher setup complete for ${telegramId} on ${channelName}`);
  } catch (error) {
    console.error(`Failed to set up Pusher for user ${telegramId}:`, error);
    bot.telegram.sendMessage(telegramId, '⚠️ Error initializing notifications. Contact support.');
  }
}
