import { NextRequest, NextResponse } from "next/server"
import { randomBytes } from "crypto"

const PROJECT_ID = "prj_NwZzkP85jDUIIuRIMyRaA5TtkJMX"
const TEAM_ID    = "team_irfN6vwN2Dz8BIrhr7jOnrWK"

export async function POST(req: NextRequest) {
  try {
    const { vercelToken, vars } = await req.json()
    if (!vercelToken) {
      return NextResponse.json({ error: "Vercel APIトークンが必要です" }, { status: 400 })
    }

    const toSet: Record<string, string> = { ...vars }
    if (!toSet.NEXTAUTH_SECRET) {
      toSet.NEXTAUTH_SECRET = randomBytes(32).toString("hex")
    }
    if (!toSet.NEXTAUTH_URL) {
      const origin = new URL(req.url)
      toSet.NEXTAUTH_URL = `${origin.protocol}//${origin.host}`
    }

    const listRes = await fetch(
      `https://api.vercel.com/v9/projects/${PROJECT_ID}/env?teamId=${TEAM_ID}`,
      { headers: { Authorization: `Bearer ${vercelToken}` } }
    )
    if (!listRes.ok) {
      return NextResponse.json({ error: "Vercelトークンが無効または権限がありません" }, { status: 400 })
    }
    const { envs = [] } = await listRes.json()

    const results: { key: string; action: string; ok: boolean }[] = []
    for (const [key, value] of Object.entries(toSet)) {
      if (!value) continue
      const existing = (envs as Array<{ id: string; key: string }>).find(e => e.key === key)
      let res: Response

      if (existing) {
        res = await fetch(
          `https://api.vercel.com/v9/projects/${PROJECT_ID}/env/${existing.id}?teamId=${TEAM_ID}`,
          {
            method: "PATCH",
            headers: { Authorization: `Bearer ${vercelToken}`, "Content-Type": "application/json" },
            body: JSON.stringify({ value, target: ["production", "preview", "development"] }),
          }
        )
        results.push({ key, action: "updated", ok: res.ok })
      } else {
        res = await fetch(
          `https://api.vercel.com/v10/projects/${PROJECT_ID}/env?teamId=${TEAM_ID}`,
          {
            method: "POST",
            headers: { Authorization: `Bearer ${vercelToken}`, "Content-Type": "application/json" },
            body: JSON.stringify({ key, value, type: "encrypted", target: ["production", "preview", "development"] }),
          }
        )
        results.push({ key, action: "created", ok: res.ok })
      }
    }

    return NextResponse.json({ success: true, results })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const vercelToken = searchParams.get("token")
  if (!vercelToken) {
    return NextResponse.json({ error: "token required" }, { status: 400 })
  }
  const res = await fetch(
    `https://api.vercel.com/v9/projects/${PROJECT_ID}/env?teamId=${TEAM_ID}`,
    { headers: { Authorization: `Bearer ${vercelToken}` } }
  )
  if (!res.ok) return NextResponse.json({ error: "Invalid token" }, { status: 400 })
  const { envs } = await res.json()
  const keys = (envs as Array<{ key: string }>).map(e => e.key)
  return NextResponse.json({ keys })
}
