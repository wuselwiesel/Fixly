import { LogIn, UserPlus } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { supabase } from '@/lib/supabase'

function mapAuthError(message: string): string {
  if (message.includes('Invalid login credentials')) return 'E-Mail oder Passwort ist falsch.'
  if (message.includes('User already registered')) return 'Für diese E-Mail existiert bereits ein Konto. Bitte melde dich an.'
  if (message.includes('Password should be at least')) return 'Das Passwort muss mindestens 6 Zeichen lang sein.'
  if (message.includes('Unable to validate email address')) return 'Bitte gib eine gültige E-Mail-Adresse ein.'
  if (message.includes('Email not confirmed')) return 'Diese E-Mail-Adresse wurde noch nicht bestätigt.'
  return 'Das hat leider nicht geklappt. Bitte versuch es erneut.'
}

export function LoginPage() {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  function switchMode(next: 'signin' | 'signup') {
    setMode(next)
    setError(null)
    setInfo(null)
    setPassword('')
    setPasswordConfirm('')
  }

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setInfo(null)
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
    setLoading(false)
    if (error) setError(mapAuthError(error.message))
  }

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault()
    if (password !== passwordConfirm) {
      setError('Die Passwörter stimmen nicht überein.')
      return
    }
    setLoading(true)
    setError(null)
    setInfo(null)
    const { data, error } = await supabase.auth.signUp({ email: email.trim(), password })
    setLoading(false)
    if (error) {
      setError(mapAuthError(error.message))
      return
    }
    if (!data.session) {
      setInfo('Konto erstellt. Bitte bestätige deine E-Mail-Adresse, um dich anzumelden.')
    }
  }

  const isSignUp = mode === 'signup'

  return (
    <div className="flex min-h-dvh items-center justify-center bg-background px-4">
      <Card className="w-full max-w-sm">
        <CardContent className="flex flex-col items-center gap-6 p-8 text-center">
          <img src="/icon.png" alt="Fixly" className="size-14 rounded-2xl" />

          <div className="flex flex-col gap-1.5">
            <h1 className="text-lg font-semibold">Willkommen bei Fixly</h1>
            <p className="text-sm text-muted-foreground">
              {isSignUp ? 'Erstelle ein Konto mit E-Mail und Passwort.' : 'Melde dich mit E-Mail und Passwort an.'}
            </p>
          </div>

          <Tabs value={mode} onValueChange={(v) => switchMode(v as 'signin' | 'signup')} className="w-full">
            <TabsList className="w-full">
              <TabsTrigger value="signin" className="flex-1">
                Anmelden
              </TabsTrigger>
              <TabsTrigger value="signup" className="flex-1">
                Registrieren
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <form onSubmit={isSignUp ? handleSignUp : handleSignIn} className="flex w-full flex-col gap-3">
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
            <div className="flex flex-col gap-1.5 text-left">
              <Label htmlFor="password">Passwort</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={6}
                required
                autoComplete={isSignUp ? 'new-password' : 'current-password'}
              />
            </div>
            {isSignUp && (
              <div className="flex flex-col gap-1.5 text-left">
                <Label htmlFor="passwordConfirm">Passwort bestätigen</Label>
                <Input
                  id="passwordConfirm"
                  type="password"
                  placeholder="••••••••"
                  value={passwordConfirm}
                  onChange={(e) => setPasswordConfirm(e.target.value)}
                  minLength={6}
                  required
                  autoComplete="new-password"
                />
              </div>
            )}
            {error && <p className="text-sm text-destructive">{error}</p>}
            {info && <p className="text-sm text-muted-foreground">{info}</p>}
            <Button type="submit" disabled={loading} className="gap-2">
              {isSignUp ? <UserPlus className="size-4" /> : <LogIn className="size-4" />}
              {loading ? 'Einen Moment…' : isSignUp ? 'Konto erstellen' : 'Anmelden'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
