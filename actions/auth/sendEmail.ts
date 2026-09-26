// Server-only helper (used by lib/auth.ts). Deliberately NOT a "use server"
// action, so nobody can call it from the browser to send emails.

import transporter from "@/lib/nodemailer";
import { SITE_URL } from "@/lib/siteUrl";

const escape = (s: string) =>
    s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

// Same "hard-surface" look as the welcome page: black and white, monospace
// system labels, a hazard stripe and a square black button. Built with
// tables and inline styles so it looks right in Gmail, Outlook and phones.
function mechaEmail(o: { code: string; subject: string; description: string; link: string; button: string }) {
    const mono = "'SFMono-Regular',Menlo,Consolas,'Courier New',monospace";
    const sans = "-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif";
    const logo = `${SITE_URL}/assets/brand/logo-mark-white.png`;
    const stripe = Array.from({ length: 24 }, (_, i) =>
        `<td width="20" height="8" style="background:${i % 2 ? "#f3f3f1" : "#171717"};font-size:0;line-height:0;">&nbsp;</td>`
    ).join("");

    return `
<div style="margin:0;padding:24px 12px;background:#e9e9e6;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;margin:0 auto;border-collapse:collapse;">
    <tr>
      <td style="background:#171717;padding:14px 20px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
          <td style="vertical-align:middle;">
            <img src="${logo}" width="16" height="16" alt="" style="vertical-align:middle;border:0;">
            <span style="font-family:${mono};font-size:13px;font-weight:700;letter-spacing:.3em;color:#ffffff;vertical-align:middle;padding-left:8px;">INKFERENCE</span>
          </td>
          <td align="right" style="font-family:${mono};font-size:10px;letter-spacing:.2em;color:#a3a3a3;">SYS // ${escape(o.code)}</td>
        </tr></table>
      </td>
    </tr>
    <tr><td style="padding:0;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;"><tr>${stripe}</tr></table></td></tr>
    <tr>
      <td style="background:#f3f3f1;border:2px solid #171717;border-top:0;padding:28px 24px;">
        <p style="margin:0 0 10px;font-family:${mono};font-size:11px;letter-spacing:.2em;color:#737373;">&#9632; INCOMING TRANSMISSION</p>
        <h1 style="margin:0 0 12px;font-family:${sans};font-size:24px;line-height:1.2;font-weight:900;color:#171717;">${escape(o.subject)}</h1>
        <p style="margin:0 0 24px;font-family:${sans};font-size:15px;line-height:1.6;color:#404040;">${escape(o.description)}</p>
        <table role="presentation" cellpadding="0" cellspacing="0"><tr>
          <td style="background:#171717;">
            <a href="${o.link}" style="display:inline-block;padding:13px 22px;font-family:${mono};font-size:13px;font-weight:700;letter-spacing:.15em;text-transform:uppercase;color:#ffffff;text-decoration:none;">${escape(o.button)} &rarr;</a>
          </td>
        </tr></table>
        <p style="margin:24px 0 0;padding-top:16px;border-top:1px dashed #a3a3a3;font-family:${sans};font-size:12px;line-height:1.5;color:#737373;">
          Button not working? Copy this link into your browser:<br>
          <a href="${o.link}" style="color:#171717;word-break:break-all;">${o.link}</a>
        </p>
      </td>
    </tr>
    <tr>
      <td style="padding:14px 4px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
          <td style="font-family:${mono};font-size:10px;letter-spacing:.2em;color:#737373;">&copy; INKFERENCE &middot; INKFERENCE.APP</td>
          <td align="right" style="font-family:${mono};font-size:10px;letter-spacing:.2em;color:#737373;">END OF TRANSMISSION</td>
        </tr></table>
        <p style="margin:8px 0 0;font-family:${sans};font-size:11px;color:#a3a3a3;">You got this because of your Inkference account. Questions? Reply to this email.</p>
      </td>
    </tr>
  </table>
</div>`;
}

export async function sendEmailAction({
    to,
    subject,
    meta,
}: {
    to: string;
    subject: string;
    meta: {
        description: string;
        link: string;
        /** Button text (default "Open link"). */
        button?: string;
        /** Short system code in the header, e.g. "VERIFY". */
        code?: string;
    };
}) {
    const link = escape(meta.link);
    const button = meta.button ?? "Open link";
    const mailOptions = {
        from: `Inkference <${process.env.NODEMAILER_USER}>`,
        replyTo: "inkference@gmail.com",
        to,
        subject: `Inkference - ${subject}`,
        // Plain text too, for email apps that don't show HTML.
        text: `${subject}\n\n${meta.description}\n\n${meta.link}\n\n- Inkference`,
        html: mechaEmail({
            code: meta.code ?? button.split(" ")[0].toUpperCase(),
            subject,
            description: meta.description,
            link,
            button,
        }),
    };

    try {
        // Render's free plan blocks email ports (SMTP), so in production we
        // send through Resend's web API instead. Locally, Gmail still works.
        if (process.env.RESEND_API_KEY) {
            const res = await fetch("https://api.resend.com/emails", {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    from: process.env.EMAIL_FROM || "Inkference <noreply@inkference.app>",
                    reply_to: "inkference@gmail.com",
                    to: [to],
                    subject: mailOptions.subject,
                    html: mailOptions.html,
                    text: mailOptions.text,
                }),
            });
            if (!res.ok) throw new Error(`Resend ${res.status}: ${await res.text()}`);
        } else {
            await transporter.sendMail(mailOptions);
        }
        return { success: true };
    } catch (err) {
        console.error("[SendEmail]:", err);
        return { success: false };
    }
}
