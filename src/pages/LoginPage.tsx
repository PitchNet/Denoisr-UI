import { Link } from 'react-router-dom'
import Button from '../components/ui/Button'

export default function LoginPage() {
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

        <form
          className="authForm"
          onSubmit={(e) => {
            e.preventDefault()
          }}
        >
          <label className="field">
            <span className="field__label">Email</span>
            <input className="field__input" type="email" required />
          </label>

          <label className="field">
            <span className="field__label">Password</span>
            <input className="field__input" type="password" required />
          </label>

          <Button variant="solidDark" type="submit">
            Login
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

