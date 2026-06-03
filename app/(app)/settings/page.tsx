import { SettingsClient } from "./SettingsClient"

function getStatus() {
  return {
    NEXTAUTH_SECRET:      !!process.env.NEXTAUTH_SECRET,
    NEXTAUTH_URL:         process.env.NEXTAUTH_URL || "",
    GOOGLE_CLIENT_ID:     !!process.env.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET: !!process.env.GOOGLE_CLIENT_SECRET,
    GEMINI_API_KEY:       !!process.env.GEMINI_API_KEY,
    SHINKI_SHEETS_ID:     !!process.env.SHINKI_SHEETS_ID,
    GOOGLE_SHEETS_ID:     !!process.env.GOOGLE_SHEETS_ID,
    SFCHAT_API_KEY:       !!process.env.SFCHAT_API_KEY,
    ALLOWED_DOMAIN:       process.env.ALLOWED_DOMAIN || "",
  }
}

export default function SettingsPage() {
  return <SettingsClient status={getStatus()} />
}
