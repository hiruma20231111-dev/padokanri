"use client"

import { useState } from "react"
import {
  CheckCircle2, XCircle, Eye, EyeOff, Loader2,
  ExternalLink, Building2, ChevronDown, ChevronUp
} from "lucide-react"

type Status = {
  NEXTAUTH_SECRET: boolean
  NEXTAUTH_URL: boolean
  GOOGLE_CLIENT_ID: boolean
  GOOGLE_CLIENT_SECRET: boolean
  GEMINI_API_KEY: boolean
  SHINKI_SHEETS_ID: boolean
  GOOGLE_SHEETS_ID: boolean
  SFCHAT_API_KEY: boolean
  ALLOWED_DOMAIN: string
}

function Field({
  label, name, value, onChange, type = "text", placeholder,
}: {
  label?: string; name: string; value: string
  onChange: (v: string) => void; type?: string; placeholder?: string
}) {
  const [show, setShow] = useState(false)
  const isPassword = type === "password"
  return (
    <div>
      {label && <label className="block text-xs text-slate-500 mb-1">{label}</label>}
      <div className="relative">
        <input
          type={isPassword && !show ? "password" : "text"}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder || name}
          className="w-full px-3 py-2 pr-10 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
        />
        {isPassword && (
          <button type="button" onClick={() => setShow(p => !p)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
            {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        )}
      </div>
    </div>
  )
}

function StatusDot({ set, required }: { set: boolean; required?: boolean }) {
  return set
    ? <CheckCircle2 className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
    : <XCircle className={`w-3.5 h-3.5 flex-shrink-0 ${required ? "text-red-500" : "text-amber-400"}`} />
}

export function SetupForm({ status }: { status: Status }) {
  const [vercelToken, setVercelToken] = useState("")
  const [showToken, setShowToken] = useState(false)
  const [showOptional, setShowOptional] = useState(false)
  const [vars, setVars] = useState({
    GOOGLE_CLIENT_ID: "",
    GOOGLE_CLIENT_SECRET: "",
    GEMINI_API_KEY: "",
    SHINKI_SHEETS_ID: "",
    GOOGLE_SHEETS_ID: "",
    SFCHAT_API_KEY: "",
    ALLOWED_DOMAIN: status.ALLOWED_DOMAIN,
  })
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ success?: boolean; message?: string } | null>(null)

  const requiredOk = status.NEXTAUTH_SECRET && status.NEXTAUTH_URL &&
    status.GOOGLE_CLIENT_ID && status.GOOGLE_CLIENT_SECRET

  const set = (key: keyof typeof vars) => (v: string) => setVars(p => ({ ...p, [key]: v }))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setResult(null)
    try {
      const res = await fetch("/api/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vercelToken, vars }),
      })
      const data = await res.json()
      if (data.success) {
        const count = data.results.filter((r: { ok: boolean }) => r.ok).length
        setResult({ success: true, message: `${count}件の環境変数を保存しました。Vercelでリデプロイが必要です。` })
      } else {
        setResult({ success: false, message: data.error || "エラーが発生しました" })
      }
    } catch {
      setResult({ success: false, message: "ネットワークエラーが発生しました" })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* ヘッダー */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-blue-600 rounded-2xl mb-4">
            <Building2 className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">KPD 営業パイロット — セットアップ</h1>
          <p className="text-slate-500 text-sm mt-1">
            {requiredOk
              ? "✅ 必須項目は設定済みです（任意項目を更新できます）"
              : "初期設定が必要です。以下を入力してください。"}
          </p>
        </div>

        {/* 現在の設定状態 */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 mb-5">
          <h2 className="font-semibold text-slate-800 mb-3 text-sm">現在の設定状態</h2>
          <div className="grid grid-cols-2 gap-x-6">
            {([
              ["NEXTAUTH_SECRET",    true ],
              ["NEXTAUTH_URL",       true ],
              ["GOOGLE_CLIENT_ID",   true ],
              ["GOOGLE_CLIENT_SECRET", true],
              ["GEMINI_API_KEY",     false],
              ["SHINKI_SHEETS_ID",   false],
              ["GOOGLE_SHEETS_ID",   false],
              ["SFCHAT_API_KEY",     false],
            ] as [string, boolean][]).map(([key, required]) => (
              <div key={key} className="flex items-center gap-2 py-1.5 border-b border-slate-50 last:border-0">
                <StatusDot set={!!status[key as keyof Status]} required={required} />
                <code className="text-xs font-mono text-slate-600 truncate">{key}</code>
                <span className={`text-xs ml-auto ${status[key as keyof Status] ? "text-green-600" : required ? "text-red-500" : "text-amber-500"}`}>
                  {status[key as keyof Status] ? "設定済" : required ? "必須" : "未設定"}
                </span>
              </div>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Vercelトークン */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5">
            <h2 className="font-semibold text-slate-800 mb-1">Vercel API トークン <span className="text-red-500 text-xs font-normal">必須</span></h2>
            <p className="text-xs text-slate-500 mb-3">
              環境変数の保存に使います（送信後は保持されません）。
              <a href="https://vercel.com/account/tokens" target="_blank" rel="noopener noreferrer"
                className="text-blue-600 hover:underline inline-flex items-center gap-0.5 ml-1">
                vercel.com/account/tokens で作成 <ExternalLink className="w-3 h-3" />
              </a>
            </p>
            <div className="relative">
              <input
                type={showToken ? "text" : "password"}
                value={vercelToken}
                onChange={e => setVercelToken(e.target.value)}
                placeholder="vercel_..."
                className="w-full px-3 py-2 pr-10 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
              />
              <button type="button" onClick={() => setShowToken(p => !p)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                {showToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Google OAuth */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5">
            <h2 className="font-semibold text-slate-800 mb-1">
              Google OAuth <span className="text-red-500 text-xs font-normal">ログインに必須</span>
            </h2>
            <div className="text-xs text-slate-500 mb-3 space-y-1">
              <p>
                <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noopener noreferrer"
                  className="text-blue-600 hover:underline inline-flex items-center gap-0.5">
                  Google Cloud Console → OAuth クライアントID（ウェブアプリ）を作成 <ExternalLink className="w-3 h-3" />
                </a>
              </p>
              <p>承認済みリダイレクトURIに追加：</p>
              <code className="block bg-slate-100 px-2 py-1 rounded text-slate-700">
                https://padokanri.vercel.app/api/auth/callback/google
              </code>
            </div>
            <div className="space-y-2">
              <Field name="GOOGLE_CLIENT_ID" value={vars.GOOGLE_CLIENT_ID} onChange={set("GOOGLE_CLIENT_ID")} placeholder="クライアントID（xxxxx.apps.googleusercontent.com）" />
              <Field name="GOOGLE_CLIENT_SECRET" value={vars.GOOGLE_CLIENT_SECRET} onChange={set("GOOGLE_CLIENT_SECRET")} type="password" placeholder="クライアントシークレット" />
            </div>
          </div>

          {/* Gemini */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5">
            <h2 className="font-semibold text-slate-800 mb-1">Gemini API キー</h2>
            <p className="text-xs text-slate-500 mb-3">
              AIアシスタント機能に使用します。
              <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener noreferrer"
                className="text-blue-600 hover:underline inline-flex items-center gap-0.5 ml-1">
                Google AI Studio で取得 <ExternalLink className="w-3 h-3" />
              </a>
            </p>
            <Field name="GEMINI_API_KEY" value={vars.GEMINI_API_KEY} onChange={set("GEMINI_API_KEY")} type="password" placeholder="AIzaSy..." />
          </div>

          {/* 任意設定（折りたたみ） */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            <button type="button" onClick={() => setShowOptional(p => !p)}
              className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-slate-50 transition-colors">
              <span className="font-semibold text-slate-800 text-sm">その他の設定（Sheets・SFChat・アクセス制限）</span>
              {showOptional ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
            </button>
            {showOptional && (
              <div className="px-5 pb-5 space-y-4 border-t border-slate-100">
                <div className="pt-4 space-y-2">
                  <Field name="SHINKI_SHEETS_ID" label="SHINKI_SHEETS_ID（見込みリストのスプレッドシートID）"
                    value={vars.SHINKI_SHEETS_ID} onChange={set("SHINKI_SHEETS_ID")} placeholder="URLの /d/xxxxx/edit の xxxxx 部分" />
                  <Field name="GOOGLE_SHEETS_ID" label="GOOGLE_SHEETS_ID（汎用）"
                    value={vars.GOOGLE_SHEETS_ID} onChange={set("GOOGLE_SHEETS_ID")} placeholder="スプレッドシートID" />
                  <Field name="SFCHAT_API_KEY" label="SFCHAT_API_KEY（社内チャット）"
                    value={vars.SFCHAT_API_KEY} onChange={set("SFCHAT_API_KEY")} type="password" placeholder="SFChat APIキー" />
                </div>
                <div>
                  <Field name="ALLOWED_DOMAIN" label="ALLOWED_DOMAIN（アクセス制限）空=全Googleアカウント許可"
                    value={vars.ALLOWED_DOMAIN} onChange={set("ALLOWED_DOMAIN")} placeholder="（空=全員許可 / kansaipado.co.jp で社員限定）" />
                </div>
              </div>
            )}
          </div>

          {/* 結果 */}
          {result && (
            <div className={`rounded-xl p-4 text-sm ${result.success
              ? "bg-green-50 text-green-800 border border-green-200"
              : "bg-red-50 text-red-800 border border-red-200"}`}>
              {result.message}
              {result.success && (
                <p className="mt-2 font-medium">
                  → Vercel ダッシュボード → Deployments → 最新ビルドの「…」→「Redeploy」でリデプロイしてください
                </p>
              )}
            </div>
          )}

          <button type="submit" disabled={loading || !vercelToken}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-medium rounded-xl transition-colors flex items-center justify-center gap-2">
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {loading ? "Vercelに保存中..." : "Vercelに設定を保存"}
          </button>

          <p className="text-center text-xs text-slate-400">
            設定済みなら <a href="/login" className="text-blue-600 hover:underline">ログインページへ</a>
          </p>
        </form>
      </div>
    </div>
  )
}
