import type { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '../../../lib/supabaseAdmin';

// Safaricom calls this URL directly (no user session) once the customer has
// entered their PIN or cancelled. We must always respond 200 or Safaricom will
// keep retrying the webhook.
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(200).json({ ResultCode: 0, ResultDesc: 'Ignored non-POST request' });
  }

  try {
    const callback = req.body?.Body?.stkCallback;
    if (!callback) {
      return res.status(200).json({ ResultCode: 0, ResultDesc: 'No callback payload' });
    }

    const checkoutRequestId: string = callback.CheckoutRequestID;
    const resultCode: number = callback.ResultCode;
    const resultDesc: string = callback.ResultDesc;

    if (resultCode === 0) {
      const items: any[] = callback.CallbackMetadata?.Item || [];
      const get = (name: string) => items.find((i) => i.Name === name)?.Value;

      const mpesaReceipt = get('MpesaReceiptNumber');

      await supabaseAdmin.rpc('complete_mpesa_deposit', {
        p_checkout_request_id: checkoutRequestId,
        p_mpesa_receipt: mpesaReceipt || null,
        p_result_desc: resultDesc,
        p_raw: req.body,
      });
    } else {
      await supabaseAdmin.rpc('fail_mpesa_deposit', {
        p_checkout_request_id: checkoutRequestId,
        p_result_desc: resultDesc,
        p_raw: req.body,
      });
    }

    return res.status(200).json({ ResultCode: 0, ResultDesc: 'Accepted' });
  } catch (err) {
    // Still acknowledge with 200 so Safaricom doesn't hammer retries; the error
    // is only visible in your Vercel function logs.
    console.error('M-Pesa callback error:', err);
    return res.status(200).json({ ResultCode: 0, ResultDesc: 'Accepted' });
  }
}