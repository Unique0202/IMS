/**
 * email.js — Nodemailer email utility for CIPD IMS
 *
 * SETUP REQUIRED (one-time):
 *   1. Create a Gmail account for the lab, e.g. cipd.ims@gmail.com
 *   2. Enable 2-Step Verification on that account
 *   3. Go to Google Account → Security → App Passwords
 *   4. Generate an App Password for "Mail"
 *   5. Add to backend/.env:
 *        EMAIL_USER=cipd.ims@gmail.com
 *        EMAIL_PASS=xxxx xxxx xxxx xxxx   (the 16-char app password, spaces optional)
 *        EMAIL_FROM="CIPD Lab IMS <cipd.ims@gmail.com>"
 *
 * THREADING:
 *   All emails for a request share the same Message-ID anchor:
 *     <cipd-req-{requestId}@lab-mgmt.iiitd.edu.in>
 *   Subsequent emails set In-Reply-To + References to that ID so Gmail,
 *   Outlook, and most clients group them into one conversation thread.
 */

const nodemailer = require('nodemailer')

// ── Transporter (reused across all sends) ───────────────────────────────────
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
})

// Deterministic Message-ID for a given request — used for threading
const threadId = (requestId) => `<cipd-req-${requestId}@lab-mgmt.iiitd.edu.in>`

// ── Shared HTML wrapper ──────────────────────────────────────────────────────
function wrap(title, bodyHtml) {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:32px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.07);">

        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#0e3a6e,#0ea5e9);padding:28px 32px;">
            <p style="margin:0;color:#bae6fd;font-size:11px;font-weight:600;letter-spacing:2px;text-transform:uppercase;">CIPD | IIIT Delhi</p>
            <h1 style="margin:6px 0 0;color:#ffffff;font-size:20px;font-weight:700;">${title}</h1>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:32px;">
            ${bodyHtml}
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="padding:20px 32px;border-top:1px solid #e2e8f0;background:#f8fafc;">
            <p style="margin:0;font-size:12px;color:#94a3b8;line-height:1.6;">
              This is an automated message from the CIPD Lab Inventory Management System.<br>
              Please do not reply to this email. For queries, contact the lab admin directly.
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`
}

// ── Item list helper ─────────────────────────────────────────────────────────
function itemTable(items) {
  const rows = items.map(ri => {
    const qty = ri.issuedQuantity ?? ri.quantity
    return `<tr>
      <td style="padding:10px 12px;font-size:14px;color:#1e293b;border-bottom:1px solid #f1f5f9;">${ri.item.name}</td>
      <td style="padding:10px 12px;font-size:14px;color:#475569;border-bottom:1px solid #f1f5f9;text-align:center;">${qty}</td>
      <td style="padding:10px 12px;font-size:14px;border-bottom:1px solid #f1f5f9;text-align:center;">
        <span style="padding:2px 10px;border-radius:99px;font-size:12px;font-weight:600;background:${ri.item.type === 'RETURNABLE' ? '#dbeafe' : ri.item.type === 'CONSUMABLE' ? '#dcfce7' : '#f1f5f9'};color:${ri.item.type === 'RETURNABLE' ? '#1d4ed8' : ri.item.type === 'CONSUMABLE' ? '#15803d' : '#64748b'};">
          ${ri.item.type}
        </span>
      </td>
    </tr>`
  }).join('')

  return `<table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;margin:16px 0;">
    <tr style="background:#f8fafc;">
      <th style="padding:10px 12px;font-size:12px;font-weight:600;color:#64748b;text-align:left;text-transform:uppercase;letter-spacing:1px;">Item</th>
      <th style="padding:10px 12px;font-size:12px;font-weight:600;color:#64748b;text-align:center;text-transform:uppercase;letter-spacing:1px;">Qty</th>
      <th style="padding:10px 12px;font-size:12px;font-weight:600;color:#64748b;text-align:center;text-transform:uppercase;letter-spacing:1px;">Type</th>
    </tr>
    ${rows}
  </table>`
}

function statusBadge(label, color) {
  const colors = {
    green:  { bg: '#dcfce7', text: '#15803d' },
    red:    { bg: '#fee2e2', text: '#b91c1c' },
    blue:   { bg: '#dbeafe', text: '#1d4ed8' },
    gray:   { bg: '#f1f5f9', text: '#475569' },
    orange: { bg: '#fff7ed', text: '#c2410c' },
  }
  const c = colors[color] || colors.gray
  return `<span style="display:inline-block;padding:4px 14px;border-radius:99px;font-size:13px;font-weight:700;background:${c.bg};color:${c.text};">${label}</span>`
}

function infoRow(label, value) {
  return `<tr>
    <td style="padding:8px 0;font-size:13px;color:#64748b;font-weight:600;width:140px;">${label}</td>
    <td style="padding:8px 0;font-size:14px;color:#1e293b;">${value}</td>
  </tr>`
}

// ── Send helper ──────────────────────────────────────────────────────────────
async function send({ to, subject, html, requestId, isFirstEmail = false }) {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) return // silently skip if not configured

  const headers = isFirstEmail
    ? { 'Message-ID': threadId(requestId) }
    : { 'In-Reply-To': threadId(requestId), 'References': threadId(requestId) }

  try {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM || `"CIPD Lab IMS" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
      headers,
    })
  } catch (err) {
    // Log but never crash the request flow due to email failure
    console.error(`[Email] Failed to send "${subject}" to ${to}:`, err.message)
  }
}

// ════════════════════════════════════════════════════════════════════════════
// EMAIL SENDERS — one per event in the request lifecycle
// ════════════════════════════════════════════════════════════════════════════

/**
 * 1. Request submitted → student
 */
async function sendRequestReceived({ student, requestId, items, reason }) {
  const subject = `[CIPD IMS] Request #${requestId} Received`
  const html = wrap('Request Received', `
    <p style="font-size:15px;color:#334155;margin:0 0 20px;">Hi <strong>${student.name}</strong>,</p>
    <p style="font-size:14px;color:#475569;line-height:1.7;margin:0 0 20px;">
      Your borrowing request has been received and is now <strong>pending review</strong> by the lab admin.
      You will receive another email once it is approved or declined.
    </p>

    <table cellpadding="0" cellspacing="0" style="margin:0 0 20px;">
      ${infoRow('Request ID', `#${requestId}`)}
      ${infoRow('Status', statusBadge('Pending Review', 'orange'))}
      ${infoRow('Reason', reason)}
    </table>

    <p style="font-size:13px;font-weight:600;color:#64748b;margin:20px 0 8px;text-transform:uppercase;letter-spacing:1px;">Items Requested</p>
    ${itemTable(items)}
  `)
  await send({ to: student.email, subject, html, requestId, isFirstEmail: true })
}

/**
 * 2. Request approved → student
 */
async function sendRequestApproved({ student, requestId, items, collectionDeadline }) {
  const deadline = collectionDeadline
    ? new Date(collectionDeadline).toLocaleString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })
    : 'as soon as possible'

  const subject = `Re: [CIPD IMS] Request #${requestId} — Approved ✓`
  const html = wrap('Request Approved', `
    <p style="font-size:15px;color:#334155;margin:0 0 20px;">Hi <strong>${student.name}</strong>,</p>
    <p style="font-size:14px;color:#475569;line-height:1.7;margin:0 0 20px;">
      Great news! Your request has been <strong style="color:#15803d;">approved</strong>.
      Please collect your items from the CIPD Lab by the deadline below.
    </p>

    <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:16px 20px;margin:0 0 20px;">
      <p style="margin:0;font-size:13px;color:#15803d;font-weight:700;text-transform:uppercase;letter-spacing:1px;">Collection Deadline</p>
      <p style="margin:6px 0 0;font-size:16px;color:#14532d;font-weight:700;">${deadline}</p>
    </div>

    <table cellpadding="0" cellspacing="0" style="margin:0 0 20px;">
      ${infoRow('Request ID', `#${requestId}`)}
      ${infoRow('Status', statusBadge('Approved', 'green'))}
    </table>

    <p style="font-size:13px;font-weight:600;color:#64748b;margin:20px 0 8px;text-transform:uppercase;letter-spacing:1px;">Items to Collect</p>
    ${itemTable(items)}

    <p style="font-size:13px;color:#94a3b8;margin:20px 0 0;">
      If you are unable to collect within the deadline, please inform the lab admin.
    </p>
  `)
  await send({ to: student.email, subject, html, requestId })
}

/**
 * 3. Request declined → student
 */
async function sendRequestDeclined({ student, requestId, items, declineReason }) {
  const subject = `Re: [CIPD IMS] Request #${requestId} — Declined`
  const html = wrap('Request Declined', `
    <p style="font-size:15px;color:#334155;margin:0 0 20px;">Hi <strong>${student.name}</strong>,</p>
    <p style="font-size:14px;color:#475569;line-height:1.7;margin:0 0 20px;">
      Unfortunately, your request has been <strong style="color:#b91c1c;">declined</strong> by the lab admin.
    </p>

    <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:16px 20px;margin:0 0 20px;">
      <p style="margin:0;font-size:13px;color:#b91c1c;font-weight:700;text-transform:uppercase;letter-spacing:1px;">Reason</p>
      <p style="margin:6px 0 0;font-size:14px;color:#7f1d1d;">${declineReason}</p>
    </div>

    <table cellpadding="0" cellspacing="0" style="margin:0 0 20px;">
      ${infoRow('Request ID', `#${requestId}`)}
      ${infoRow('Status', statusBadge('Declined', 'red'))}
    </table>

    <p style="font-size:13px;font-weight:600;color:#64748b;margin:20px 0 8px;text-transform:uppercase;letter-spacing:1px;">Items Requested</p>
    ${itemTable(items)}

    <p style="font-size:13px;color:#475569;line-height:1.7;margin:20px 0 0;">
      You may submit a new request if you have addressed the reason above.
    </p>
  `)
  await send({ to: student.email, subject, html, requestId })
}

/**
 * 4. Items issued / collected → student
 */
async function sendItemsIssued({ student, requestId, items, expectedReturnAt, conditionOnIssue }) {
  const returnDate = expectedReturnAt
    ? new Date(expectedReturnAt).toLocaleString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
    : null

  const subject = `Re: [CIPD IMS] Request #${requestId} — Items Collected`
  const html = wrap('Items Collected', `
    <p style="font-size:15px;color:#334155;margin:0 0 20px;">Hi <strong>${student.name}</strong>,</p>
    <p style="font-size:14px;color:#475569;line-height:1.7;margin:0 0 20px;">
      The following items have been issued to you from the CIPD Lab. Please keep them safe and return them by the due date.
    </p>

    ${returnDate ? `
    <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;padding:16px 20px;margin:0 0 20px;">
      <p style="margin:0;font-size:13px;color:#1d4ed8;font-weight:700;text-transform:uppercase;letter-spacing:1px;">Return Due Date</p>
      <p style="margin:6px 0 0;font-size:16px;color:#1e3a8a;font-weight:700;">${returnDate}</p>
      <p style="margin:6px 0 0;font-size:12px;color:#3b82f6;">You will receive a reminder email one day before this date.</p>
    </div>` : ''}

    <table cellpadding="0" cellspacing="0" style="margin:0 0 20px;">
      ${infoRow('Request ID', `#${requestId}`)}
      ${infoRow('Status', statusBadge('Issued', 'blue'))}
      ${conditionOnIssue ? infoRow('Condition at Issue', conditionOnIssue) : ''}
    </table>

    <p style="font-size:13px;font-weight:600;color:#64748b;margin:20px 0 8px;text-transform:uppercase;letter-spacing:1px;">Items Issued to You</p>
    ${itemTable(items)}

    <p style="font-size:13px;color:#94a3b8;margin:20px 0 0;">
      Note: CONSUMABLE items (wires, batteries, etc.) do not need to be returned.
      RETURNABLE items (boards, tools) must be returned in good condition.
    </p>
  `)
  await send({ to: student.email, subject, html, requestId })
}

/**
 * 5. Due date reminder (1 day before) → student
 */
async function sendReturnReminder({ student, requestId, items, expectedReturnAt }) {
  const returnDate = new Date(expectedReturnAt).toLocaleString('en-IN', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })

  const subject = `Re: [CIPD IMS] Request #${requestId} — Return Due Tomorrow`
  const html = wrap('Return Reminder', `
    <p style="font-size:15px;color:#334155;margin:0 0 20px;">Hi <strong>${student.name}</strong>,</p>
    <p style="font-size:14px;color:#475569;line-height:1.7;margin:0 0 20px;">
      This is a friendly reminder that the items from your request are due for return <strong>tomorrow</strong>.
    </p>

    <div style="background:#fff7ed;border:1px solid #fed7aa;border-radius:8px;padding:16px 20px;margin:0 0 20px;">
      <p style="margin:0;font-size:13px;color:#c2410c;font-weight:700;text-transform:uppercase;letter-spacing:1px;">Return Due</p>
      <p style="margin:6px 0 0;font-size:16px;color:#7c2d12;font-weight:700;">${returnDate}</p>
    </div>

    <table cellpadding="0" cellspacing="0" style="margin:0 0 20px;">
      ${infoRow('Request ID', `#${requestId}`)}
      ${infoRow('Status', statusBadge('Issued', 'blue'))}
    </table>

    <p style="font-size:13px;font-weight:600;color:#64748b;margin:20px 0 8px;text-transform:uppercase;letter-spacing:1px;">Items to Return</p>
    ${itemTable(items)}

    <p style="font-size:13px;color:#475569;line-height:1.7;margin:20px 0 0;">
      Please return all RETURNABLE items to the CIPD Lab by the due date to avoid being marked overdue.
      If you need an extension, contact the lab admin before the deadline.
    </p>
  `)
  await send({ to: student.email, subject, html, requestId })
}

/**
 * 6. Items returned → student
 */
async function sendItemsReturned({ student, requestId, items, conditionOnReturn, returnedAt }) {
  const returnedDate = new Date(returnedAt || Date.now()).toLocaleString('en-IN', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit',
  })

  const subject = `Re: [CIPD IMS] Request #${requestId} — Items Returned`
  const html = wrap('Items Returned — Thank You', `
    <p style="font-size:15px;color:#334155;margin:0 0 20px;">Hi <strong>${student.name}</strong>,</p>
    <p style="font-size:14px;color:#475569;line-height:1.7;margin:0 0 20px;">
      The items from your request have been successfully returned to the CIPD Lab. Thank you!
    </p>

    <table cellpadding="0" cellspacing="0" style="margin:0 0 20px;">
      ${infoRow('Request ID', `#${requestId}`)}
      ${infoRow('Status', statusBadge('Returned', 'gray'))}
      ${infoRow('Returned On', returnedDate)}
      ${conditionOnReturn ? infoRow('Condition on Return', conditionOnReturn) : ''}
    </table>

    <p style="font-size:13px;font-weight:600;color:#64748b;margin:20px 0 8px;text-transform:uppercase;letter-spacing:1px;">Items Returned</p>
    ${itemTable(items)}

    <p style="font-size:13px;color:#475569;line-height:1.7;margin:20px 0 0;">
      This request is now closed. You can submit a new request anytime from the CIPD IMS portal.
    </p>
  `)
  await send({ to: student.email, subject, html, requestId })
}

module.exports = {
  sendRequestReceived,
  sendRequestApproved,
  sendRequestDeclined,
  sendItemsIssued,
  sendReturnReminder,
  sendItemsReturned,
}
