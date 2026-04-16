/**
 * FancyPlan – Lemon Squeezy Webhook Handler
 * ==========================================
 * Empfängt Order-Events von Lemon Squeezy, entnimmt den nächsten
 * Lizenzschlüssel aus der CSV-Datei (über Netlify Blobs als Zähler)
 * und versendet ihn per E-Mail an den Kunden via Resend.
 *
 * Erforderliche Netlify-Umgebungsvariablen (in Netlify UI setzen):
 *   RESEND_API_KEY         → API Key von resend.com (kostenlos bis 3.000 E-Mails/Monat)
 *   LS_WEBHOOK_SECRET      → Webhook-Secret aus Lemon Squeezy Settings → Webhooks
 *   LS_VARIANT_MONTHLY     → Variant-ID Monatsabo: 1536198
 *   LS_VARIANT_YEARLY      → Variant-ID Jahresabo: 1536243
 *   EMAIL_FROM             → Absenderadresse, z.B. noreply@fancyplan.de
 *   SITE_URL               → https://fancyplan.de  (kein trailing slash)
 */

const { getStore } = require('@netlify/blobs');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// ── Hilfsfunktionen ────────────────────────────────────────────────────────────

/**
 * Liest alle Keys aus einer CSV-Datei.
 * Erwartet eine Spalte "key" in der ersten Zeile (Header).
 * Leere Zeilen werden ignoriert.
 */
function readKeysFromCsv(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n').map(l => l.trim()).filter(Boolean);
  if (lines.length === 0) return [];
  // Erste Zeile: Header überspringen wenn sie "key" enthält
  const start = lines[0].toLowerCase() === 'key' ? 1 : 0;
  return lines.slice(start).filter(Boolean);
}

/**
 * Verifiziert die Lemon Squeezy Webhook-Signatur (HMAC-SHA256).
 */
function verifySignature(body, signature, secret) {
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(body);
  const digest = hmac.digest('hex');
  return digest === signature;
}

/**
 * Sendet eine E-Mail via Resend API.
 */
async function sendEmail({ to, subject, html, apiKey, from }) {
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({ from, to: [to], subject, html }),
  });
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Resend API error: ${error}`);
  }
  return response.json();
}

/**
 * Generiert den HTML-Inhalt der Lizenzschlüssel-E-Mail.
 */
function buildEmailHtml({ licenseKey, planName, customerName, siteUrl }) {
  const greeting = customerName ? `Hallo ${customerName},` : 'Hallo,';
  return `<!DOCTYPE html>
<html lang="de">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:Inter,-apple-system,sans-serif;">
  <div style="max-width:600px;margin:40px auto;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

    <!-- Header -->
    <div style="background:#0d9488;padding:32px 40px;text-align:center;">
      <h1 style="color:#ffffff;font-size:24px;font-weight:800;margin:0;letter-spacing:-0.02em;">FancyPlan</h1>
      <p style="color:rgba(255,255,255,0.85);margin:8px 0 0;font-size:14px;">Fokus-Tool für Windows</p>
    </div>

    <!-- Body -->
    <div style="padding:40px;">
      <p style="color:#334155;font-size:16px;margin:0 0 8px;">${greeting}</p>
      <p style="color:#334155;font-size:16px;margin:0 0 32px;">
        vielen Dank für deinen Kauf von <strong>FancyPlan ${planName}</strong>.<br>
        Hier ist dein persönlicher Lizenzschlüssel:
      </p>

      <!-- Key Box -->
      <div style="background:#f0fdfa;border:2px solid #0d9488;border-radius:10px;padding:24px;text-align:center;margin-bottom:32px;">
        <p style="color:#64748b;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.08em;margin:0 0 8px;">Dein Lizenzschlüssel</p>
        <code style="font-size:20px;font-weight:700;color:#0d9488;letter-spacing:3px;word-break:break-all;">${licenseKey}</code>
      </div>

      <!-- Steps -->
      <h2 style="color:#0f172a;font-size:17px;font-weight:700;margin:0 0 16px;">In 3 Schritten loslegen</h2>

      <div style="display:flex;flex-direction:column;gap:12px;">
        <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:16px;display:flex;gap:12px;align-items:flex-start;">
          <span style="min-width:28px;height:28px;background:#f0fdfa;color:#0d9488;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;font-weight:700;font-size:13px;">1</span>
          <span style="color:#334155;font-size:14px;line-height:1.5;">FancyPlan herunterladen und installieren:<br>
            <a href="${siteUrl}/download.html" style="color:#0d9488;font-weight:600;">${siteUrl}/download.html</a>
          </span>
        </div>
        <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:16px;display:flex;gap:12px;align-items:flex-start;">
          <span style="min-width:28px;height:28px;background:#f0fdfa;color:#0d9488;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;font-weight:700;font-size:13px;">2</span>
          <span style="color:#334155;font-size:14px;line-height:1.5;">FancyPlan starten → <strong>Lizenz aktivieren</strong> im Menü klicken</span>
        </div>
        <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:16px;display:flex;gap:12px;align-items:flex-start;">
          <span style="min-width:28px;height:28px;background:#f0fdfa;color:#0d9488;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;font-weight:700;font-size:13px;">3</span>
          <span style="color:#334155;font-size:14px;line-height:1.5;">Lizenzschlüssel eingeben und bestätigen – <strong>FancyPlan Pro ist sofort aktiv</strong></span>
        </div>
      </div>

      <!-- CTA -->
      <div style="text-align:center;margin-top:32px;">
        <a href="${siteUrl}/danke.html" style="background:#0d9488;color:#ffffff;padding:13px 28px;border-radius:8px;text-decoration:none;font-weight:600;font-size:15px;display:inline-block;">
          Zur Bestätigungsseite →
        </a>
      </div>
    </div>

    <!-- Footer -->
    <div style="background:#f8fafc;border-top:1px solid #e2e8f0;padding:24px 40px;text-align:center;">
      <p style="color:#94a3b8;font-size:12px;margin:0;">
        Fragen? <a href="mailto:sapco.cslt@gmail.com" style="color:#0d9488;">sapco.cslt@gmail.com</a>
        &nbsp;·&nbsp;
        <a href="${siteUrl}/impressum.html" style="color:#94a3b8;">Impressum</a>
        &nbsp;·&nbsp;
        <a href="${siteUrl}/datenschutz.html" style="color:#94a3b8;">Datenschutz</a>
      </p>
      <p style="color:#cbd5e1;font-size:11px;margin:8px 0 0;">© 2026 FancyPlan</p>
    </div>

  </div>
</body>
</html>`;
}

// ── Handler ────────────────────────────────────────────────────────────────────

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  // 1. Signatur prüfen
  const webhookSecret = process.env.LS_WEBHOOK_SECRET;
  if (webhookSecret) {
    const signature = event.headers['x-signature'];
    if (!signature || !verifySignature(event.body, signature, webhookSecret)) {
      console.error('Invalid webhook signature');
      return { statusCode: 401, body: 'Unauthorized' };
    }
  }

  // 2. Payload parsen
  let payload;
  try {
    payload = JSON.parse(event.body);
  } catch {
    return { statusCode: 400, body: 'Invalid JSON' };
  }

  const eventName = payload?.meta?.event_name;

  // Nur order_created verarbeiten
  if (eventName !== 'order_created') {
    return { statusCode: 200, body: `Event ${eventName} ignored` };
  }

  const order      = payload?.data?.attributes;
  const customerEmail = order?.user_email;
  const customerName  = order?.user_name;
  const variantId     = String(order?.first_order_item?.variant_id || '');

  if (!customerEmail) {
    return { statusCode: 400, body: 'Missing customer email' };
  }

  // 3. Produkt-Typ bestimmen
  const variantMonthly = process.env.LS_VARIANT_MONTHLY || '1536198';
  const variantYearly  = process.env.LS_VARIANT_YEARLY  || '1536243';

  let keyType, planName;
  if (variantId === variantYearly) {
    keyType  = 'yearly';
    planName = 'Pro Jährlich';
  } else if (variantId === variantMonthly) {
    keyType  = 'monthly';
    planName = 'Pro Monatlich';
  } else {
    console.warn(`Unknown variant ID: ${variantId} – defaulting to monthly`);
    keyType  = 'monthly';
    planName = 'Pro Monatlich';
  }

  // 4. Nächsten Lizenzschlüssel aus CSV lesen (Zähler in Netlify Blobs)
  const csvPath = path.join(process.cwd(), 'licenses', `${keyType}.csv`);
  let keys;
  try {
    keys = readKeysFromCsv(csvPath);
  } catch (err) {
    console.error('Cannot read CSV:', err.message);
    return { statusCode: 500, body: 'License CSV not found' };
  }

  const store      = getStore('fancyplan-licenses');
  const counterKey = `${keyType}-index`;
  const indexStr   = await store.get(counterKey) || '0';
  const index      = parseInt(indexStr, 10);

  if (index >= keys.length) {
    console.error(`No more ${keyType} keys available! Index: ${index}, Total: ${keys.length}`);
    // Alarm-E-Mail an Admin senden
    await sendEmail({
      to: 'sapco.cslt@gmail.com',
      subject: `⚠️ FancyPlan: Keine ${keyType}-Lizenzschlüssel mehr verfügbar!`,
      html: `<p>Bitte neue Schlüssel in <code>licenses/${keyType}.csv</code> hochladen. Bestellungs-E-Mail: ${customerEmail}</p>`,
      apiKey: process.env.RESEND_API_KEY,
      from: process.env.EMAIL_FROM || 'noreply@fancyplan.de',
    }).catch(console.error);
    return { statusCode: 500, body: 'No keys available' };
  }

  const licenseKey = keys[index];

  // Zähler erhöhen
  await store.set(counterKey, String(index + 1));

  // 5. Lizenzschlüssel per E-Mail senden
  const siteUrl = (process.env.SITE_URL || 'https://fancyplan.de').replace(/\/$/, '');
  try {
    await sendEmail({
      to:      customerEmail,
      subject: `Dein FancyPlan Lizenzschlüssel – ${planName}`,
      html:    buildEmailHtml({ licenseKey, planName, customerName, siteUrl }),
      apiKey:  process.env.RESEND_API_KEY,
      from:    process.env.EMAIL_FROM || 'noreply@fancyplan.de',
    });
    console.log(`License key sent to ${customerEmail} (${keyType}, index ${index})`);
  } catch (err) {
    console.error('Email send failed:', err.message);
    // Schlüssel zurücksetzen, damit er erneut versucht werden kann
    await store.set(counterKey, String(index));
    return { statusCode: 500, body: 'Email delivery failed' };
  }

  return {
    statusCode: 200,
    body: JSON.stringify({ success: true, keyType, index }),
  };
};
