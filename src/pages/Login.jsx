import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth, googleProvider } from "../lib/firebase";
import {
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
} from "firebase/auth";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleEmailAuth = async () => {
    if (!email || !password) return setError("Please fill in all fields");
    setLoading(true);
    setError("");
    try {
      if (isSignUp) {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      navigate("/dashboard");
    } catch (err) {
      setError(err.message.replace("Firebase: ", ""));
    }
    setLoading(false);
  };

  const handleGoogle = async () => {
    setLoading(true);
    setError("");
    try {
      await signInWithPopup(auth, googleProvider);
      navigate("/dashboard");
    } catch (err) {
      setError(err.message.replace("Firebase: ", ""));
    }
    setLoading(false);
  };

  return (
    <div style={styles.root}>
      <div style={styles.logo}>
        course<span style={{ color: "#3b82f6" }}>rocket</span>.ai
      </div>

      <div style={styles.card}>
        <h2 style={styles.title}>
          {isSignUp ? "Create your account" : "Welcome back"}
        </h2>
        <p style={styles.sub}>
          {isSignUp
            ? "Start building your AI-powered courses"
            : "Sign in to continue learning"}
        </p>

        {/* Google button */}
        <button style={styles.googleBtn} onClick={handleGoogle}>
          <svg width="18" height="18" viewBox="0 0 18 18">
            <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z"/>
            <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z"/>
            <path fill="#FBBC05" d="M3.964 10.707c-.18-.54-.282-1.117-.282-1.707s.102-1.167.282-1.707V4.961H.957C.347 6.175 0 7.55 0 9s.348 2.825.957 4.039l3.007-2.332z"/>
            <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.961L3.964 7.293C4.672 5.166 6.656 3.58 9 3.58z"/>
          </svg>
          Continue with Google
        </button>

        <div style={styles.divider}>
          <div style={styles.dividerLine} />
          <span style={styles.dividerText}>or</span>
          <div style={styles.dividerLine} />
        </div>

        {/* Email input */}
        <input
          style={styles.input}
          type="email"
          placeholder="Email address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        {/* Password input */}
        <input
          style={styles.input}
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleEmailAuth()}
        />

        {/* Error message */}
        {error && <div style={styles.error}>{error}</div>}

        {/* Submit button */}
        <button style={styles.btn} onClick={handleEmailAuth} disabled={loading}>
          {loading ? "Please wait..." : isSignUp ? "Create Account" : "Sign In"}
        </button>

        {/* Toggle sign up / sign in */}
        <p style={styles.toggle}>
          {isSignUp ? "Already have an account? " : "Don't have an account? "}
          <span
            style={styles.toggleLink}
            onClick={() => { setIsSignUp(!isSignUp); setError(""); }}
          >
            {isSignUp ? "Sign in" : "Sign up"}
          </span>
        </p>
      </div>
    </div>
  );
}

const styles = {
  root: {
    minHeight: "100vh",
    background: "#080d18",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "40px 20px",
    fontFamily: "'DM Sans', sans-serif",
  },
  logo: {
    fontFamily: "'Syne', sans-serif",
    fontWeight: 800,
    fontSize: "22px",
    color: "#fff",
    marginBottom: "32px",
    letterSpacing: "-0.5px",
  },
  card: {
    background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: "16px",
    padding: "36px",
    width: "100%",
    maxWidth: "400px",
  },
  title: {
    fontFamily: "'Syne', sans-serif",
    fontSize: "22px",
    fontWeight: 700,
    color: "#fff",
    marginBottom: "8px",
  },
  sub: {
    fontSize: "14px",
    color: "rgba(232,237,245,0.45)",
    marginBottom: "28px",
  },
  googleBtn: {
    width: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "10px",
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.12)",
    borderRadius: "10px",
    padding: "12px",
    color: "#e8edf5",
    fontSize: "14px",
    fontWeight: 500,
    cursor: "pointer",
    fontFamily: "'DM Sans', sans-serif",
    marginBottom: "20px",
  },
  divider: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    marginBottom: "20px",
  },
  dividerLine: {
    flex: 1,
    height: "1px",
    background: "rgba(255,255,255,0.08)",
  },
  dividerText: {
    fontSize: "12px",
    color: "rgba(232,237,245,0.3)",
  },
  input: {
    width: "100%",
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: "10px",
    padding: "12px 16px",
    color: "#e8edf5",
    fontSize: "14px",
    fontFamily: "'DM Sans', sans-serif",
    marginBottom: "12px",
    outline: "none",
    display: "block",
  },
  error: {
    background: "rgba(239,68,68,0.08)",
    border: "1px solid rgba(239,68,68,0.2)",
    borderRadius: "8px",
    padding: "10px 14px",
    fontSize: "13px",
    color: "#f87171",
    marginBottom: "12px",
  },
  btn: {
    width: "100%",
    background: "#3b82f6",
    border: "none",
    borderRadius: "10px",
    padding: "13px",
    color: "#fff",
    fontSize: "14px",
    fontWeight: 500,
    cursor: "pointer",
    fontFamily: "'DM Sans', sans-serif",
    marginBottom: "20px",
    marginTop: "4px",
  },
  toggle: {
    fontSize: "13px",
    color: "rgba(232,237,245,0.4)",
    textAlign: "center",
  },
  toggleLink: {
    color: "#3b82f6",
    cursor: "pointer",
    fontWeight: 500,
  },
};