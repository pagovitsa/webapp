import "server-only";
import nodemailer from "nodemailer";
import { env } from "../env";

export type EmailMessage = { readonly to: string; readonly subject: string; readonly text: string };
let transport: ReturnType<typeof nodemailer.createTransport> | undefined;

export async function sendEmail(message: EmailMessage): Promise<void> {
  if (/[\r\n]/.test(message.to) || /[\r\n]/.test(message.subject) || /[\r\n]/.test(env.SMTP_FROM)) {
    throw new Error("Μη έγκυρη κεφαλίδα email.");
  }
  if (!transport) {
    let url: URL;
    try { url = new URL(env.SMTP_URL); } catch { throw new Error("Μη έγκυρη ρύθμιση SMTP."); }
    if (!["smtp:", "smtps:"].includes(url.protocol)) throw new Error("Μη υποστηριζόμενο πρωτόκολλο SMTP.");
    const local = ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname);
    if (url.protocol === "smtp:" && !local) url.searchParams.set("requireTLS", "true");
    transport = nodemailer.createTransport(url.toString());
  }
  await transport.sendMail({ ...message, from: env.SMTP_FROM, textEncoding: "base64", disableFileAccess: true, disableUrlAccess: true });
}
