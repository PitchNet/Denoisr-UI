import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Button from '../components/ui/Button'

const SIGNUP_CREDENTIALS_KEY = 'denoisr-signup-credentials'

export default function SignupPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!email.trim() || !password.trim()) {
      return
    }

    sessionStorage.setItem(
      SIGNUP_CREDENTIALS_KEY,
      JSON.stringify({
        email: email.trim(),
        password,
      }),
    )

    navigate('/dashboard')
  }

  return (
    <div className="authPage">
      <div className="container authCard">
        <div className="authTop">
          <Link to="/" className="authBack">
            Back to Denoisr
          </Link>
          <div className="sectionLabel sectionLabel--mono">SIGNUP</div>
          <h1 className="authTitle">Create your signal.</h1>
          <p className="authSub">
            Join a noise-free network for networking and personalised hiring.
          </p>
        </div>

        <form className="authForm" onSubmit={handleSubmit}>
          {/* <label className="field">
            <span className="field__label">Name</span>
            <input
              className="field__input"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </label> */}

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

          <Button variant="solidDark" type="submit">
            Signup
          </Button>
        </form>

        <div className="authFooter">
          <span className="authFooter__text">Already have an account?</span>
          <Button to="/login" variant="outlinedLight">
            Login
          </Button>
        </div>
      </div>
    </div>
  )
}
