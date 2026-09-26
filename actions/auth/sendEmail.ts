// Server-only helper (used by lib/auth.ts). Deliberately NOT a "use server"
// action, so nobody can call it from the browser to send emails.

import transporter from "@/lib/nodemailer";

const escape = (s: string) =>
    s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

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
    };
}) {
    const link = escape(meta.link);
    const mailOptions = {
        from: `Inkference <${process.env.NODEMAILER_USER}>`,
        to,
        subject: `Inkference - ${subject}`,
        // Plain text too, for email apps that don't show HTML.
        text: `${subject}\n\n${meta.description}\n\n${meta.link}\n\n- Inkference`,
        html: `
<div style="background:#f3f4f6;padding:24px 12px;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;">
  <div style="max-width:480px;margin:0 auto;background:#ffffff;border-radius:12px;padding:28px 24px;border:1px solid #e5e7eb;">
    <p style="margin:0 0 16px;font-size:14px;font-weight:700;letter-spacing:.02em;color:#111827;">INKFERENCE</p>
    <h1 style="margin:0 0 12px;font-size:20px;color:#111827;">${escape(subject)}</h1>
    <p style="margin:0 0 20px;font-size:15px;line-height:1.5;color:#374151;">${escape(meta.description)}</p>
    <a href="${link}" style="display:inline-block;padding:11px 18px;background:#111827;color:#ffffff;text-decoration:none;border-radius:8px;font-size:15px;font-weight:600;">${escape(meta.button ?? "Open link")}</a>
    <p style="margin:24px 0 0;font-size:12px;line-height:1.5;color:#6b7280;">Button not working? Copy this link into your browser:<br><a href="${link}" style="color:#2563eb;word-break:break-all;">${link}</a></p>
  </div>
  <p style="max-width:480px;margin:12px auto 0;font-size:11px;color:#9ca3af;text-align:center;">You got this email because of your Inkference account. Questions? inkference@gmail.com</p>
</div>`,
    };

    try {
        await transporter.sendMail(mailOptions);
        return { success: true };
    } catch (err) {
        console.error("[SendEmail]:", err);
        return { success: false };
    }
}
