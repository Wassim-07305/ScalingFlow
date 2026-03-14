import { Resend } from "resend";

// Guard : si pas de cle API, resend est null (pas de crash)
export const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;
