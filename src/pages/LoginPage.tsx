import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { storeAuthTokenFromResponse } from '../auth'
import Button from '../components/ui/Button'

export default function LoginPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsSubmitting(true)
    setError('')

    const baseUrl = import.meta.env.VITE_API_BASE_URL.replace(/\/$/, '')

    try {
      const response = await fetch(`${baseUrl}/LoginController/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      })

      if (!response.ok) {
        setError('Wrong email/password')
        return
      }

      await storeAuthTokenFromResponse(response)

      navigate('/home')
    } catch {
      setError('Wrong email/password')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="authPage">
      <div className="container authCard">
        <div className="authTop">
          <Link to="/" className="authBack">
            Back to Denoisr
          </Link>
          <div className="sectionLabel sectionLabel--mono">LOGIN</div>
          <h1 className="authTitle">Welcome back.</h1>
          <p className="authSub">
            A signal-first network for hiring and opportunities.
          </p>
        </div>

        <form className="authForm" onSubmit={handleSubmit}>
          <label className="field">
            <span className="field__label">Email</span>
            <input
              className="field__input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </label>

          <label className="field">
            <span className="field__label">Password</span>
            <input
              className="field__input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </label>

          {error ? (
            <p className="authError" role="alert">
              {error}
            </p>
          ) : null}

          <Button variant="solidDark" type="submit">
            {isSubmitting ? 'Logging in...' : 'Login'}
          </Button>
        </form>

        <div className="authFooter">
          <span className="authFooter__text">New to Denoisr?</span>
          <Button to="/signup" variant="outlinedLight">
            Signup
          </Button>
        </div>
      </div>
    </div>
  )
}
