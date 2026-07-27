import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@4.0.1";

const MPESA_ENVIRONMENT = Deno.env.get('MPESA_ENVIRONMENT') || 'sandbox';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

function getClientIP(req: Request): string {
  const forwarded = req.headers.get('x-forwarded-for');
  const realIP = req.headers.get('x-real-ip');
  const cfConnectingIP = req.headers.get('cf-connecting-ip');
  
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  if (realIP) {
    return realIP;
  }
  if (cfConnectingIP) {
    return cfConnectingIP;
  }
  
  return 'unknown';
}

async function isIPWhitelisted(ip: string, environment: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('callback_ip_whitelist')
      .select('ip_address')
      .eq('ip_address', ip)
      .eq('environment', environment);
    
    if (error) {
      console.error('Error checking IP whitelist:', error);
      return false;
    }
    
    return data && data.length > 0;
  } catch (error) {
    console.error('IP whitelist check failed:', error);
    return false;
  }
}

async function sendPaymentConfirmationEmail(orderId: string) {
  try {
    // ── Fetch order (items are stored as JSONB directly on the orders row) ──
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('order_id', orderId)
      .single();

    if (orderError || !order) {
      console.error('Order not found for email:', orderError);
      return;
    }

    if (!order.email || !order.amount) {
      console.error('Missing required fields for email:', {
        hasEmail: !!order.email,
        hasAmount: !!order.amount,
      });
      return;
    }

    console.log('Sending payment confirmation email to:', order.email);

    // ── Config ─────────────────────────────────────────────────────────────
    const accentHex = '#22c55e';
    const accentRgb = '34,197,94';
    const gradient  = 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)';
    const badgeBg   = '#f0fdf4';
    const year      = new Date().getFullYear();

    const customerName = order.username || 'Valued Customer';
    const shortId      = orderId.slice(0, 8).toUpperCase();
    const fullId       = orderId.toUpperCase();
    const amount       = (order.amount as number).toLocaleString();
    const mpesaRef     = order.mpesa_receipt_number || order.mpesa_code || '';

    const orderDate = new Intl.DateTimeFormat('en-US', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
      timeZone: 'Africa/Nairobi',
    }).format(new Date(order.created_at || new Date()));

    // ── Items rows with product image ──────────────────────────────────────
    const items: any[] = Array.isArray(order.items) ? order.items : [];

    const itemsHtml = items.length > 0 ? `
      <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse; margin-top: 8px;">
        <tr>
          <td colspan="3" style="padding-bottom: 10px;">
            <p style="margin: 0; font-size: 13px; font-weight: 700; letter-spacing: 1.5px;
                       text-transform: uppercase; color: #94a3b8;">Items Ordered</p>
          </td>
        </tr>
        ${items.map((item: any) => {
          const qty   = item.quantity  || 1;
          const price = item.product?.price ?? item.price ?? 0;
          const name  = item.product?.name  ?? item.name  ?? 'Product';
          const image = item.product?.image ?? item.product?.images?.[0] ?? item.image ?? '';
          const total = qty * price;

          return `
        <tr>
          <td style="padding: 12px 0; border-top: 1px solid #f1f5f9; vertical-align: top;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <!-- Product image -->
                <td width="56" style="vertical-align: top; padding-right: 14px;">
                  ${image
                    ? `<img src="${image}" alt="${name}"
                          width="56" height="56"
                          style="display: block; width: 56px; height: 56px; object-fit: cover;
                                 border-radius: 10px; border: 1px solid #e2e8f0;">`
                    : `<div style="width: 56px; height: 56px; background: #f1f5f9;
                                   border-radius: 10px; text-align: center;
                                   line-height: 56px; font-size: 24px;">📦</div>`
                  }
                </td>
                <!-- Product details -->
                <td style="vertical-align: top;">
                  <p style="margin: 0 0 4px; font-size: 15px; font-weight: 600;
                             color: #0f172a; line-height: 1.4;">${name}</p>
                  <p style="margin: 0; font-size: 13px; color: #64748b;">
                    Qty: ${qty} &nbsp;·&nbsp; KES ${price.toLocaleString()} each
                  </p>
                </td>
                <!-- Line total -->
                <td style="vertical-align: top; text-align: right;
                            white-space: nowrap; padding-left: 12px;">
                  <p style="margin: 0; font-size: 15px; font-weight: 700; color: #0f172a;">
                    KES ${total.toLocaleString()}
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>`;
        }).join('')}
      </table>` : '';

    // ── Full HTML ──────────────────────────────────────────────────────────
    const html = `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Payment Successful — Order #${shortId}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f0f4f8;
             font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto,
             'Helvetica Neue', Arial, sans-serif; -webkit-font-smoothing: antialiased;">

  <!-- Hidden preheader -->
  <span style="display: none; max-height: 0; overflow: hidden; mso-hide: all;">
    Your M-Pesa payment of KES ${amount} has been confirmed — SmartKenya &#8203;&zwj;&zwnj;&nbsp;&zwnj;&zwj;
  </span>

  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f0f4f8;">
    <tr>
      <td align="center" style="padding: 36px 16px 48px;">

<!-- Brand header -->
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin-bottom: 20px;">
          <tr>
            <td align="center">
              <img src="https://www.smartkenya.co.ke/assets/images/smartkenya-logo-BcDCofys.png"
                   alt="SmartKenya"
                   width="180"
                   style="display: block; width: 180px; height: auto; margin: 0 auto;">
              <p style="margin: 6px 0 0; font-size: 12px; letter-spacing: 3px;
                         text-transform: uppercase; color: #94a3b8;">Online Shopping</p>
            </td>
          </tr>
        </table>

        <!-- Main card -->
        <table width="100%" cellpadding="0" cellspacing="0"
               style="max-width: 600px; background: #ffffff; border-radius: 20px;
                      overflow: hidden; box-shadow: 0 20px 60px rgba(0,0,0,0.08),
                      0 4px 16px rgba(0,0,0,0.04);">

          <!-- Hero banner -->
          <tr>
            <td style="background: ${gradient}; padding: 44px 40px; text-align: center;">
              <div style="display: inline-block; width: 72px; height: 72px;
                           background: rgba(255,255,255,0.2); border-radius: 50%;
                           line-height: 72px; font-size: 34px; margin-bottom: 20px;">✅</div>
              <h1 style="margin: 0; font-size: 32px; font-weight: 800; color: #ffffff;
                          letter-spacing: -0.5px; line-height: 1.2;">Payment Confirmed!</h1>
              <p style="margin: 10px 0 0; font-size: 16px; color: rgba(255,255,255,0.85);
                         letter-spacing: 0.3px;">
                Order #${shortId} is now being processed
              </p>
              <div style="margin: 22px auto 0; width: 40px; height: 2px;
                           background: rgba(255,255,255,0.4); border-radius: 2px;"></div>
            </td>
          </tr>

          <!-- Body message -->
          <tr>
            <td style="padding: 36px 40px 0 40px;">
              <p style="margin: 0; font-size: 17px; color: #334155; line-height: 1.8;">
                Hi <strong>${customerName}</strong>,<br><br>
                Thank you! We've successfully received your M-Pesa payment and your order
                is now being processed. We'll send you another update once your items are packed
                and on their way.
              </p>
            </td>
          </tr>

          <!-- Order details card -->
          <tr>
            <td style="padding: 28px 40px 0 40px;">
              <table width="100%" cellpadding="0" cellspacing="0"
                     style="background: #f8fafc; border-radius: 14px; border: 1px solid #e2e8f0;">
                <tr>
                  <td style="padding: 22px 24px;">
                    <p style="margin: 0 0 18px; font-size: 13px; font-weight: 700;
                               letter-spacing: 1.5px; text-transform: uppercase; color: #94a3b8;">
                      Payment &amp; Order Details
                    </p>

                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding: 8px 0; font-size: 15px; color: #64748b;">Order Number</td>
                        <td style="padding: 8px 0; font-size: 15px; font-weight: 700; color: #0f172a;
                                   text-align: right; font-family: 'Courier New', monospace;
                                   letter-spacing: 0.5px;">#${fullId}</td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; border-top: 1px solid #f1f5f9;
                                   font-size: 15px; color: #64748b;">Order Date</td>
                        <td style="padding: 8px 0; border-top: 1px solid #f1f5f9;
                                   font-size: 15px; color: #0f172a; text-align: right;">${orderDate}</td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; border-top: 1px solid #f1f5f9;
                                   font-size: 15px; color: #64748b;">Payment Method</td>
                        <td style="padding: 8px 0; border-top: 1px solid #f1f5f9;
                                   font-size: 15px; color: #0f172a; text-align: right;">M-Pesa</td>
                      </tr>
                      ${mpesaRef ? `
                      <tr>
                        <td style="padding: 8px 0; border-top: 1px solid #f1f5f9;
                                   font-size: 15px; color: #64748b;">M-Pesa Receipt</td>
                        <td style="padding: 8px 0; border-top: 1px solid #f1f5f9;
                                   font-size: 15px; font-weight: 700; color: #0f172a;
                                   text-align: right; font-family: 'Courier New', monospace;
                                   letter-spacing: 1px;">${mpesaRef}</td>
                      </tr>` : ''}
                      <tr>
                        <td style="padding: 8px 0; border-top: 1px solid #f1f5f9;
                                   font-size: 15px; color: #64748b;">Status</td>
                        <td style="padding: 8px 0; border-top: 1px solid #f1f5f9; text-align: right;">
                          <span style="display: inline-block; background: ${badgeBg};
                                       color: ${accentHex}; padding: 4px 14px; border-radius: 20px;
                                       font-size: 13px; font-weight: 700; letter-spacing: 0.5px;
                                       text-transform: uppercase;">Confirmed</span>
                        </td>
                      </tr>
                      ${order.shipping_address ? `
                      <tr>
                        <td style="padding: 8px 0; border-top: 1px solid #f1f5f9;
                                   font-size: 15px; color: #64748b; vertical-align: top;">Ship To</td>
                        <td style="padding: 8px 0; border-top: 1px solid #f1f5f9;
                                   font-size: 15px; color: #0f172a; text-align: right;">
                          ${order.shipping_address}
                        </td>
                      </tr>` : ''}
                    </table>

                    ${itemsHtml}

                    <!-- Grand total -->
                    <table width="100%" cellpadding="0" cellspacing="0"
                           style="margin-top: 14px; border-top: 2px solid #e2e8f0;">
                      <tr>
                        <td style="padding-top: 14px; font-size: 18px; font-weight: 800;
                                   color: #0f172a;">Total Paid</td>
                        <td style="padding-top: 14px; text-align: right; font-size: 24px;
                                   font-weight: 800; color: ${accentHex};">KES ${amount}</td>
                      </tr>
                    </table>

                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- What's next info strip -->
          <tr>
            <td style="padding: 24px 40px 0 40px;">
              <table width="100%" cellpadding="0" cellspacing="0"
                     style="background: #fffbeb; border-radius: 10px; border-left: 3px solid #f59e0b;">
                <tr>
                  <td style="padding: 16px 18px;">
                    <p style="margin: 0 0 8px; font-size: 13px; font-weight: 700;
                               color: #b45309; letter-spacing: 1px; text-transform: uppercase;">
                      What Happens Next?
                    </p>
                    <p style="margin: 0; font-size: 14px; color: #78350f; line-height: 1.8;">
                      • Your order will be processed within 24 hours<br>
                      • You'll receive a shipping confirmation once dispatched<br>
                      • Track your order status in your account dashboard
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- CTA button -->
          <tr>
            <td style="padding: 32px 40px 0 40px; text-align: center;">
              <a href="https://smartkenya.co.ke/orders?status=processing"
                 style="display: inline-block; background: ${gradient}; color: #ffffff;
                        padding: 15px 36px; text-decoration: none; border-radius: 50px;
                        font-weight: 700; font-size: 16px; letter-spacing: 0.3px;
                        box-shadow: 0 8px 24px rgba(${accentRgb}, 0.35);">
                View Order Status &rarr;
              </a>
            </td>
          </tr>

          <!-- Help strip -->
          <tr>
            <td style="padding: 36px 40px 28px 40px; background: #f8fafc;
                       text-align: center; border-top: 1px solid #f1f5f9; margin-top: 36px;">
              <p style="margin: 0 0 6px; font-size: 15px; color: #94a3b8;">
                Questions about your order?
              </p>
              <p style="margin: 0;">
                <a href="mailto:support@smartkenya.co.ke"
                   style="color: ${accentHex}; text-decoration: none;
                          font-weight: 600; font-size: 16px;">
                  support@smartkenya.co.ke
                </a>
                <span style="color: #cbd5e1; margin: 0 10px;">|</span>
                <a href="tel:+254798229783"
                   style="color: ${accentHex}; text-decoration: none;
                          font-weight: 600; font-size: 16px;">
                  +254 798 229 783
                </a>
              </p>
            </td>
          </tr>

        </table><!-- /main card -->

        <!-- Footer -->
        <table width="100%" cellpadding="0" cellspacing="0"
               style="max-width: 600px; margin-top: 28px;">
          <tr>
            <td align="center" style="padding: 0 20px 20px;">
              <p style="margin: 0 0 6px; font-size: 11px; color: #94a3b8;">
                © ${year} SmartKenya. All rights reserved.
              </p>
              <p style="margin: 0 0 10px; font-size: 11px; color: #cbd5e1;">
                This email was sent to ${order.email}
              </p>
              <p style="margin: 0;">
                <a href="https://smartkenya.co.ke/privacy"
                   style="font-size: 11px; color: #94a3b8; text-decoration: none;">Privacy Policy</a>
                <span style="color: #cbd5e1; margin: 0 6px;">•</span>
                <a href="https://smartkenya.co.ke/terms"
                   style="font-size: 11px; color: #94a3b8; text-decoration: none;">Terms of Service</a>
              </p>
            </td>
          </tr>
        </table>

      </td>
    </tr>
  </table>
</body>
</html>`;

    const emailResponse = await resend.emails.send({
      from:    "SmartKenya Orders <orders@smartkenya.co.ke>",
      to:      [order.email],
      subject: `✅ Payment Confirmed — Order #${shortId}`,
      html,
    });

    console.log("Payment confirmation email sent successfully:", emailResponse);
  } catch (error) {
    console.error('Error sending confirmation email:', error);
  }
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  }

  if (req.method !== 'POST') {
    console.error('Method not allowed:', req.method);
    return new Response('Method not allowed', { 
      status: 405,
      headers: {
        'Allow': 'POST',
        'Access-Control-Allow-Origin': '*',
      }
    });
  }

  try {
    const clientIP = getClientIP(req);

    // CRITICAL SECURITY: Validate webhook secret from URL
    const url = new URL(req.url);
    const webhookSecret = url.searchParams.get('secret');
    
    if (!webhookSecret) {
      console.error('Missing webhook secret in callback URL');
      await supabase.from('security_alerts').insert({
        alert_type: 'mpesa_callback_no_secret',
        severity: 'critical',
        identifier: clientIP,
        details: { ip: clientIP, timestamp: new Date().toISOString() }
      });
      return new Response('Unauthorized - missing secret', { status: 401 });
    }

    // Environment-aware IP checking (secondary defense)
    if (MPESA_ENVIRONMENT === 'production') {
      const isWhitelisted = await isIPWhitelisted(clientIP, MPESA_ENVIRONMENT);
      if (!isWhitelisted) {
        console.warn('Unauthorized callback attempt from IP:', clientIP);
        return new Response('Unauthorized', { status: 401 });
      }
    } else {
      // In sandbox, log but don't block (for easier testing)
      const isWhitelisted = await isIPWhitelisted(clientIP, MPESA_ENVIRONMENT);
      if (!isWhitelisted) {
        console.log('Non-whitelisted IP in sandbox mode:', clientIP);
      }
    }

    const callbackData = await req.json();

    const { Body } = callbackData;
    if (!Body || !Body.stkCallback) {
      console.error('Invalid callback format');
      return new Response('Invalid callback format', { 
        status: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
        }
      });
    }

    const { stkCallback } = Body;
    const {
      MerchantRequestID,
      CheckoutRequestID,
      ResultCode,
      ResultDesc,
      CallbackMetadata
    } = stkCallback;

    // Extract transaction details from metadata
    let mpesaReceiptNumber = '';
    let transactionDate = '';
    let phoneNumber = '';
    let amount = 0;

    if (CallbackMetadata && CallbackMetadata.Item) {
      CallbackMetadata.Item.forEach((item: any) => {
        switch (item.Name) {
          case 'MpesaReceiptNumber':
            mpesaReceiptNumber = item.Value;
            break;
          case 'TransactionDate':
            transactionDate = item.Value;
            break;
          case 'PhoneNumber':
            phoneNumber = item.Value;
            break;
          case 'Amount':
            amount = item.Value;
            break;
        }
      });
    }

    // Validate webhook secret matches order
    const { data: payment, error: paymentError } = await supabase
      .from('mpesa_payments')
      .select('order_id')
      .eq('checkout_request_id', CheckoutRequestID)
      .single();

    if (paymentError || !payment) {
      console.error('Payment not found for CheckoutRequestID:', CheckoutRequestID);
      return new Response('Payment not found', { 
        status: 404,
        headers: { 'Access-Control-Allow-Origin': '*' }
      });
    }

    // Verify webhook secret matches the order (stored in order_secrets table,
    // NOT on the orders table — this is where the mismatch bug was)
    const { data: orderSecret, error: secretError } = await supabase
      .from('order_secrets')
      .select('webhook_secret')
      .eq('order_id', payment.order_id)
      .single();

    if (secretError || !orderSecret || orderSecret.webhook_secret !== webhookSecret) {
      console.error('Invalid webhook secret for order:', payment.order_id);
      await supabase.from('security_alerts').insert({
        alert_type: 'mpesa_callback_invalid_secret',
        severity: 'critical',
        identifier: clientIP,
        details: { 
          order_id: payment.order_id,
          ip: clientIP,
          timestamp: new Date().toISOString()
        }
      });
      return new Response('Unauthorized - invalid secret', { status: 401 });
    }

    // Update payment record
    const updateData: any = {
      merchant_request_id: MerchantRequestID,
      result_code: ResultCode,
      result_desc: ResultDesc,
      callback_data: callbackData,
      updated_at: new Date().toISOString()
    };

    if (ResultCode === 0) {
      // Payment successful
      updateData.status = 'success';
      updateData.mpesa_receipt_number = mpesaReceiptNumber;
      updateData.transaction_date = new Date(
        transactionDate.toString().replace(
          /(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})/,
          '$1-$2-$3T$4:$5:$6'
        )
      ).toISOString();
    } else {
      // Payment failed
      updateData.status = 'failed';
    }

    const { error: updateError } = await supabase
      .from('mpesa_payments')
      .update(updateData)
      .eq('checkout_request_id', CheckoutRequestID);

    if (updateError) {
      console.error('Failed to update payment:', updateError);
      return new Response('Database update failed', { 
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
        }
      });
    }

    // If payment was successful, update order status and send confirmation email
    if (ResultCode === 0 && payment?.order_id) {
      // Update order status to 'processing' (valid transition from pending)
      const { error: orderUpdateError } = await supabase
        .from('orders')
        .update({ 
          status: 'processing',
          updated_at: new Date().toISOString()
        })
        .eq('order_id', payment.order_id);

      if (orderUpdateError) {
        console.error('Failed to update order status:', orderUpdateError);
      }

      // Clear webhook secret after successful payment
      // (deletes from order_secrets, not orders — matches where it's actually stored)
      await supabase
        .from('order_secrets')
        .delete()
        .eq('order_id', payment.order_id);

      // Send confirmation email
      await sendPaymentConfirmationEmail(payment.order_id);
    }

    return new Response('Callback processed', {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      }
    });

  } catch (error: any) {
    console.error('Callback processing error:', error);
    return new Response('Internal server error', { 
      status: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
      }
    });
  }
};

serve(handler);