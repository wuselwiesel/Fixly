import { KeyRound, Mail } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { supabase } from '@/lib/supabase'

export function LoginPage() {
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSendCode(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim()) return
    setLoading(true)
    setError(null)
    const { error } = await supabase.auth.signInWithOtp({ email: email.trim() })
    setLoading(false)
    if (error) {
      setError('Der Code konnte nicht versendet werden. Bitte versuch es erneut.')
      return
    }
    setSent(true)
  }

  async function handleVerifyCode(e: React.FormEvent) {
    e.preventDefault()
    if (!code.trim()) return
    setLoading(true)
    setError(null)
    const { error } = await supabase.auth.verifyOtp({ email: email.trim(), token: code.trim(), type: 'email' })
    setLoading(false)
    if (error) {
      setError('Der Code ist ungültig oder abgelaufen. Bitte fordere einen neuen an.')
      return
    }
  }

  return (
    <div className="flex min-h-dvh items-center justify-center bg-background px-4">
      <Card className="w-full max-w-sm">
        <CardContent className="flex flex-col items-center gap-6 p-8 text-center">
          <img src="/icon.png" alt="Fixly" className="size-14 rounded-2xl" />

          {sent ? (
            <>
              <div className="flex flex-col gap-1.5">
                <h1 className="text-lg font-semibold">Code eingeben</h1>
                <p className="text-sm text-muted-foreground">
                  Wir haben einen 6-stelligen Code an <strong>{email}</strong> geschickt.
                </p>
              </div>
              <form onSubmit={handleVerifyCode} className="flex w-full flex-col gap-3">
                <div className="flex flex-col gap-1.5 text-left">
                  <Label htmlFor="code">Code</Label>
                  <Input
                    id="code"
                    inputMode="numeric"
                    placeholder="123456"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    autoFocus
                    required
                    className="text-center text-lg tracking-[0.3em]"
                  />
                </div>
                {error && <p className="text-sm text-destructive">{error}</p>}
                <Button type="submit" disabled={loading} className="gap-2">
                  <KeyRound className="size-4" />
                  {loading ? 'Wird geprüft…' : 'Bestätigen'}
                </Button>
              </form>
              <Button variant="ghost" size="sm" onClick={() => setSent(false)}>
                Andere E-Mail verwenden
              </Button>
            </>
          ) : (
            <>
              <div className="flex flex-col gap-1.5">
                <h1 className="text-lg font-semibold">Willkommen bei Fixly</h1>
                <p className="text-sm text-muted-foreground">
                  Melde dich per E-Mail an – wir schicken dir einen Anmeldecode, kein Passwort nötig.
                </p>
              </div>
              <form onSubmit={handleSendCode} className="flex w-full flex-col gap-3">
                <div className="flex flex-col gap-1.5 text-left">
                  <Label htmlFor="email">E-Mail</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="du@beispiel.de"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoFocus
                    required
                  />
                </div>
                {error && <p className="text-sm text-destructive">{error}</p>}
                <Button type="submit" disabled={loading} className="gap-2">
                  <Mail className="size-4" />
                  {loading ? 'Wird gesendet…' : 'Code senden'}
                </Button>
              </form>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
