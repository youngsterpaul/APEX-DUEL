import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import { supabaseAdmin } from '../../../lib/supabaseAdmin';

const {
  MPESA_CONSUMER_KEY,
  MPESA_CONSUMER_SECRET,
  MPESA_SHORTCODE,
  MPESA_PASSKEY,
  MPESA_BASE_URL = 'https://sandbox.safaricom.co.ke',
  MPESA_CALLBACK_URL,
  NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY,
} = process.env;

function normalizePhone(input: string): string | null {
  const digits = input.replace(/\D/g, '');
  if (/^254\d{9}$/.test(digits)) return digits;
  if (/^0\d{9}$/.test(digits)) return '254' + digits.slice(1);
  if (/^7\d{8}$/.test(digits)) return '254' + digits;
  return null;
}

function timestampNow(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return (
    d.getFullYear().toString() +
    pad(d.getMonth() + 1) +
    pad(d.getDate()) +
    pad(d.getHours()) +
    pad(d.getMinutes()) +
    pad(d.getSeconds())
  );
}

async function getAccessToken(): Promise<string> {
  const auth = Buffer.from(`${MPESA_CONSUMER_KEY}:${MPESA_CONSUMER_SECRET}`).toString('base64');
  const res = await fetch(`${MPESA_BASE_URL}/oauth/v1/generate?grant_type=client_credentials`, {
    headers: { Authorization: `Basic ${auth}` },
  });
  if (!res.ok) throw new Error('Failed to authenticate with M-Pesa.');
  const data = await res.json();
  return data.access_token;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!MPESA_CONSUMER_KEY || !MPESA_CONSUMER_SECRET || !MPESA_SHORTCODE || !MPESA_PASSKEY || !MPESA_CALLBACK_URL) {
    return res.status(500).json({
      error: 'M-Pesa is not configured yet. Set MPESA_CONSUMER_KEY, MPESA_CONSUMER_SECRET, MPESA_SHORTCODE, MPESA_PASSKEY, and MPESA_CALLBACK_URL in your environment variables.',
    });
  }

  // Identify the signed-in user from their access token (sent by the client).
  const authHeader = req.headers.authorization || '';
  const token = authHeader.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'Not signed in.' });

  const anonClient = createClient(NEXT_PUBLIC_SUPABASE_URL as string, NEXT_PUBLIC_SUPABASE_ANON_KEY as string);
  const { data: userData, error: userError } = await anonClient.auth.getUser(token);
  if (userError || !userData.user) return res.status(401).json({ error: 'Not signed in.' });
  const user = userData.user;

  const { amount, phone } = req.body as { amount?: number; phone?: string };

  if (!amount || amount < 1) {
    return res.status(400).json({ error: 'Amount must be at least 1.' });
  }
  const normalizedPhone = phone ? normalizePhone(phone) : null;
  if (!normalizedPhone) {
    return res.status(400).json({ error: 'Enter a valid Safaricom number, e.g. 07XXXXXXXX.' });
  }

  try {
    // Get or create this user's unique paybill account reference.
    let accountRef: string | null = null;
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('mpesa_account_ref')
      .eq('id', user.id)
      .single();

    accountRef = profile?.mpesa_account_ref || null;
    if (!accountRef) {
      accountRef = 'AD' + user.id.replace(/-/g, '').slice(0, 8).toUpperCase();
      await supabaseAdmin.from('profiles').update({ mpesa_account_ref: accountRef }).eq('id', user.id);
    }

    const accessToken = await getAccessToken();
    const timestamp = timestampNow();
    const password = Buffer.from(`${MPESA_SHORTCODE}${MPESA_PASSKEY}${timestamp}`).toString('base64');

    const stkRes = await fetch(`${MPESA_BASE_URL}/mpesa/stkpush/v1/processrequest`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        BusinessShortCode: MPESA_SHORTCODE,
        Password: password,
        Timestamp: timestamp,
        TransactionType: 'CustomerPayBillOnline',
        Amount: Math.round(amount),
        PartyA: normalizedPhone,
        PartyB: MPESA_SHORTCODE,
        PhoneNumber: normalizedPhone,
        CallBackURL: MPESA_CALLBACK_URL,
        AccountReference: accountRef,
        TransactionDesc: 'ApexDuel wallet deposit',
      }),
    });

    const stkData = await stkRes.json();

    if (stkData.ResponseCode !== '0') {
      return res.status(400).json({ error: stkData.errorMessage || stkData.ResponseDescription || 'M-Pesa request failed.' });
    }

    await supabaseAdmin.from('deposit_requests').insert([
      {
        profile_id: user.id,
        method: 'mpesa',
        amount,
        phone: normalizedPhone,
        account_reference: accountRef,
        merchant_request_id: stkData.MerchantRequestID,
        checkout_request_id: stkData.CheckoutRequestID,
        status: 'pending',
      },
    ]);

    return res.status(200).json({
      checkoutRequestId: stkData.CheckoutRequestID,
      message: 'Check your phone and enter your M-Pesa PIN to complete the deposit.',
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Something went wrong initiating the deposit.' });
  }
}