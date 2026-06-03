"use client"

import { useState } from "react"
import {
  CheckCircle2, XCircle, Eye, EyeOff, Loader2, ExternalLink,
  Settings, Key, Database, Shield, ChevronRight, RotateCcw
} from "lucide-react"

type Status = {
  NEXTAUTH_SECRET: boolean
  NEXTAUTH_URL: string
  GOOGLE_CLIENT_ID: boolean
  GOOGLE_CLIENT_SECRET: boolean
  GEMINI_API_KEY: boolean
  SHINKI_SHEETS_ID: boolean
  GOOGLE_SHEETS_ID: boolean
  SFCHAT_API_KEY: boolean
  ALLOWED_DOMAIN: string
}

function StatusBadge({ set, required }: { set: boolean; required?: boolean }) {
  if (set) return (
    <span className="inline-flex items-center gap-1 text-xs text-green-700 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full">
      <CheckCircle2 className="w-3 h-3" />設定済
    </span>
  )
  if (required) return (
    <span className="inline-flex items-center gap-1 text-xs text-red-700 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full">
      <XCircle className="w-3 h-3" />未設定・必須
    </span>
  )
  return (
    <span className="inline-flex items-center gap-1 text-xs text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
      <XCircle className="w-3 h-3" />未設定
    </span>
  )
}

function SecretField({ label, value, onChange, placeholder }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string
}) {
  const [show, setShow] = useState(false)
  return (
    <div>
      <label className="block text-xs text-slate-500 mb-1">{label}</label>
      <div className="relative">
        <input
          type={show ? "text" : "password"}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full px-3 py-2 pr-10 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
        />
        <button type="button" onClick={() => setShow(p => !p)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
          {show ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
        </button>
      </div>
    </div>
  )
}

type SectionKey = "auth" | "gemini" | "sheets" | "access"

export function SettingsClient({ status }: { status: Status }) {
  const [openSection, setOpenSection] = useState<SectionKey | null>(null)
  const [vercelToken, setVercelToken] = useState("")
  const [showVercelToken, setShowVercelToken] = useState(false)
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

  const set = (key: keyof typeof vars) => (v: string) => setVars(p => ({ ...p, [key]: v }))

  async function handleSave(keys: (keyof typeof vars)[]) {
    if (!vercelToken) { setResult({ success: false, message: "Vercel API トークンを入力してください" }); return }
    setLoading(true)
    setResult(null)
    const partial = Object.fromEntries(keys.map(k => [k, vars[k]]))
    try {
      const res = await fetch("/api/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vercelToken, vars: partial }),
      })
      const data = await res.json()
      if (data.success) {
        const count = data.results.filter((r: { ok: boolean }) => r.ok).length
        setResult({ success: true, message: `${count}件を保存しました。リデプロイで反映されます。` })
      } else {
        setResult({ success: false, message: data.error || "エラーが発生しました" })
      }
    } catch {
      setResult({ success: false, message: "ネットワークエラーが発生しました" })
    } finally {
      setLoading(false)
    }
  }

  function toggle(s: SectionKey) {
    setOpenSection(p => p === s ? null : s)
    setResult(null)
  }

  const sections: Array<{
    key: SectionKey
    icon: React.ElementType
    title: string
    desc: string
    statusItems: Array<{ label: string; set: boolean; required?: boolean }>
    form: React.ReactNode
    saveKeys: (keyof typeof vars)[]
  }> = [
    {
      key: "auth",
      icon: Key,
      title: "Google OAuth（ログイン認証）",
      desc: "Google Cloud Console で OAuth クライアントを管理",
      statusItems: [
        { label: "GOOGLE_CLIENT_ID",     set: status.GOOGLE_CLIENT_ID,     required: true },
        { label: "GOOGLE_CLIENT_SECRET", set: status.GOOGLE_CLIENT_SECRET, required: true },
      ],
      form: (
        <div className="space-y-3">
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-800 space-y-1">
            <p className="font-medium">承認済みリダイレクトURIに追加が必要:</p>
            <code className="block bg-white border border-amber-200 rounded px-2 py-1">
              https://padokanri.vercel.app/api/auth/callback/google
            </code>
            <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-blue-600 hover:underline">
              Google Cloud Console を開く <ExternalLink className="w-3 h-3" />
            </a>
          </div>
          <SecretField label="GOOGLE_CLIENT_ID" value={vars.GOOGLE_CLIENT_ID} onChange={set("GOOGLE_CLIENT_ID")} placeholder="xxxxx.apps.googleusercontent.com" />
          <SecretField label="GOOGLE_CLIENT_SECRET" value={vars.GOOGLE_CLIENT_SECRET} onChange={set("GOOGLE_CLIENT_SECRET")} placeholder="クライアントシークレット" />
        </div>
      ),
      saveKeys: ["GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET"],
    },
    {
      key: "gemini",
      icon: Settings,
      title: "Gemini API（AI機能）",
      desc: "AIアシスタント・SFChat分析機能",
      statusItems: [
        { label: "GEMINI_API_KEY", set: status.GEMINI_API_KEY },
      ],
      form: (
        <div className="space-y-3">
          <SecretField label="GEMINI_API_KEY" value={vars.GEMINI_API_KEY} onChange={set("GEMINI_API_KEY")} placeholder="AIzaSy..." />
          <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline">
            Google AI Studio でAPIキーを取得 <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      ),
      saveKeys: ["GEMINI_API_KEY"],
    },
    {
      key: "sheets",
      icon: Database,
      title: "Google Sheets・SFChat連携",
      desc: "見込みリスト・申込書・社内チャット",
      statusItems: [
        { label: "SHINKI_SHEETS_ID", set: status.SHINKI_SHEETS_ID },
        { label: "GOOGLE_SHEETS_ID", set: status.GOOGLE_SHEETS_ID },
        { label: "SFCHAT_API_KEY",   set: status.SFCHAT_API_KEY },
      ],
      form: (
        <div className="space-y-3">
          <div>
            <label className="block text-xs text-slate-500 mb-1">SHINKI_SHEETS_ID（見込みリスト）</label>
            <input type="text" value={vars.SHINKI_SHEETS_ID} onChange={e => set("SHINKI_SHEETS_ID")(e.target.value)}
              placeholder="URLの /d/xxxxx/edit の xxxxx 部分"
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono" />
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">GOOGLE_SHEETS_ID（汎用）</label>
            <input type="text" value={vars.GOOGLE_SHEETS_ID} onChange={e => set("GOOGLE_SHEETS_ID")(e.target.value)}
              placeholder="スプレッドシートID"
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono" />
          </div>
          <SecretField label="SFCHAT_API_KEY" value={vars.SFCHAT_API_KEY} onChange={set("SFCHAT_API_KEY")} placeholder="SFChat APIキー" />
        </div>
      ),
      saveKeys: ["SHINKI_SHEETS_ID", "GOOGLE_SHEETS_ID", "SFCHAT_API_KEY"],
    },
    {
      key: "access",
      icon: Shield,
      title: "アクセス制限",
      desc: "ログインを許可するGoogleアカウントのドメイン",
      statusItems: [
        { label: `ALLOWED_DOMAIN: ${status.ALLOWED_DOMAIN || "（全員許可）"}`, set: true },
      ],
      form: (
        <div className="space-y-2">
          <label className="block text-xs text-slate-500">ALLOWED_DOMAIN</label>
          <input type="text" value={vars.ALLOWED_DOMAIN} onChange={e => set("ALLOWED_DOMAIN")(e.target.value)}
            placeholder="（空=全Googleアカウント許可 / kansaipado.co.jp で社員限定）"
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
          <p className="text-xs text-slate-400">変更後はリデプロイが必要です</p>
        </div>
      ),
      saveKeys: ["ALLOWED_DOMAIN"],
    },
  ]

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">設定</h1>
        <p className="text-sm text-slate-500 mt-1">環境変数・API連携の設定を管理します</p>
      </div>

      {/* Vercel API トークン（常時表示） */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5">
        <h2 className="font-semibold text-slate-800 mb-1 text-sm flex items-center gap-2">
          <Key className="w-4 h-4 text-slate-500" />
          Vercel API トークン
        </h2>
        <p className="text-xs text-slate-500 mb-3">
          設定を保存するたびに必要です。
          <a href="https://vercel.com/account/tokens" target="_blank" rel="noopener noreferrer"
            className="text-blue-600 hover:underline inline-flex items-center gap-0.5 ml-1">
            vercel.com/account/tokens <ExternalLink className="w-3 h-3" />
          </a>
        </p>
        <div className="relative">
          <input
            type={showVercelToken ? "text" : "password"}
            value={vercelToken}
            onChange={e => setVercelToken(e.target.value)}
            placeholder="vercel_..."
            className="w-full px-3 py-2 pr-10 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
          />
          <button type="button" onClick={() => setShowVercelToken(p => !p)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
            {showVercelToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* 結果 */}
      {result && (
        <div className={`rounded-xl p-4 text-sm ${result.success
          ? "bg-green-50 text-green-800 border border-green-200"
          : "bg-red-50 text-red-800 border border-red-200"}`}>
          {result.message}
          {result.success && (
            <p className="mt-1 font-medium">Vercel ダッシュボードでリデプロイしてください</p>
          )}
        </div>
      )}

      {/* 設定セクション */}
      {sections.map(({ key, icon: Icon, title, desc, statusItems, form, saveKeys }) => (
        <div key={key} className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <button onClick={() => toggle(key)}
            className="w-full flex items-center gap-3 px-5 py-4 text-left hover:bg-slate-50 transition-colors">
            <Icon className="w-4 h-4 text-slate-500 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="font-medium text-slate-800 text-sm">{title}</p>
              <p className="text-xs text-slate-400">{desc}</p>
            </div>
            <div className="flex items-center gap-2">
              {statusItems.map(item => (
                <StatusBadge key={item.label} set={item.set} required={item.required} />
              ))}
              <ChevronRight className={`w-4 h-4 text-slate-400 transition-transform ${openSection === key ? "rotate-90" : ""}`} />
            </div>
          </button>

          {openSection === key && (
            <div className="px-5 pb-5 border-t border-slate-100">
              <div className="pt-4 space-y-4">
                {form}
                <button
                  onClick={() => handleSave(saveKeys)}
                  disabled={loading || !vercelToken}
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white text-sm font-medium rounded-xl transition-colors flex items-center justify-center gap-2">
                  {loading ? <><Loader2 className="w-4 h-4 animate-spin" />保存中...</> : "Vercelに保存"}
                </button>
              </div>
            </div>
          )}
        </div>
      ))}

      {/* リデプロイ案内 */}
      <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 flex items-start gap-3">
        <RotateCcw className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
        <div className="text-sm text-blue-800">
          <p className="font-medium">設定変更後はリデプロイが必要です</p>
          <p className="text-xs mt-0.5 text-blue-600">
            Vercel ダッシュボード → Deployments → 最新ビルドの「…」→「Redeploy」
          </p>
        </div>
      </div>
    </div>
  )
}
