import { Context } from 'telegraf';

// Extend Telegraf Context with custom session properties
export interface BotContext extends Context {
  session?: {
    telegramId?: string;
    waitingForEmail?: boolean;
    email?: string;
    pendingTransfer?: PendingTransfer;
    [key: string]: any; // Allow additional dynamic properties
  };
}

// Type for pending transfers (used in fund transfer commands)
export interface PendingTransfer {
  type: 'email' | 'wallet' | 'bank';
  email?: string;
  address?: string;
  bankId?: string;
  amount: number;
  currency: string;
  network?: string;
  fee: number;
}

// Type for Copperx API responses (example structures)
export interface UserProfile {
  id: string;
  email: string;
  organizationId: string;
}

export interface WalletBalance {
  network: string;
  address: string;
  balance: number;
  currency: string;
}

export interface Transaction {
  date: string;
  type: string;
  amount: number;
  currency: string;
  status: string;
}

// Pusher deposit event data
export interface DepositEvent {
  amount: number;
  currency: string;
  transactionId: string;
}
