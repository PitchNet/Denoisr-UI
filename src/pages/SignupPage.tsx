import { Link } from 'react-router-dom'
import Button from '../components/ui/Button'

export default function SignupPage() {
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

        <form
          className="authForm"
          onSubmit={(e) => {
            e.preventDefault()
          }}
        >
          <label className="field">
            <span className="field__label">Name</span>
            <input className="field__input" type="text" required />
          </label>

          <label className="field">
            <span className="field__label">Email</span>
            <input className="field__input" type="email" required />
          </label>

          <label className="field">
            <span className="field__label">Password</span>
            <input className="field__input" type="password" required />
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

