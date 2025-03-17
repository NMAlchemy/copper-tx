import Pusher from 'pusher-js';
import axios from 'axios';

const API_BASE_URL = process.env.API_BASE_URL!;
const PUSHER_KEY = process.env.PUSHER_KEY!;
const PUSHER_CLUSTER = process.env.PUSHER_CLUSTER!;

export async function setupPusherForUser(telegramId: string, organizationId: string, token: string) {
  try {
    const authData = await axios.post(`${API_BASE_URL}/api/notifications/auth`, { organizationId }, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const pusher = new Pusher(PUSHER_KEY, {
      cluster: PUSHER_CLUSTER,
      auth: { headers: { Authorization: `Bearer ${authData.data.auth}` } },
    });
    const channel = pusher.subscribe(`private-org-${organizationId}`);
    channel.bind('deposit', (data: any) => {
      const message = `New deposit: ${data.amount} ${data.currency} (TxID: ${data.transactionId})`;
      bot.telegram.sendMessage(telegramId, message);
    });
  } catch (error) {
    console.error(`Pusher setup failed for ${telegramId}:`, error);
  }
        }
