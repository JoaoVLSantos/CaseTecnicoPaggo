import { FormEvent, useState } from 'react'
import { useRouter } from 'next/router'

export default function SignInForm() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const base = process.env.NEXT_PUBLIC_API_URL || ''
      const res = await fetch(`${base}/auth/signin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      if (!res.ok) {
        const errJson = await res.json()
        throw new Error(errJson.message || 'Erro ao fazer login')
      }

      const { access_token } = await res.json()
      localStorage.setItem('access_token', access_token)

      // redireciona diretamente para a página de chats
      await router.push('/chats')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="auth-card__form">
      {error && <p className="error">{error}</p>}
      <input
        type="email"
        placeholder="Email"
        required
        value={email}
        onChange={e => setEmail(e.target.value)}
      />
      <input
        type="password"
        placeholder="Senha"
        required
        value={password}
        onChange={e => setPassword(e.target.value)}
      />
      <button
        type="submit"
        className="button--signin"
        disabled={isLoading}
      >
        {isLoading ? 'Entrando...' : 'Entrar'}
      </button>
    </form>
  )
}