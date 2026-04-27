import { useState } from "react";
import { useNavigate } from "react-router-dom";

const suggestions = [
  "Build a stock price predictor with Black-Scholes",
  "Learn machine learning from scratch",
  "iOS app development with Swift",
  "Quantum computing fundamentals",
  "Options trading strategies",
  "Build a full-stack web app",
];

export default function Landing() {
  const [topic, setTopic] = useState("");
  const navigate = useNavigate();

const handleGenerate = () => {
  if (!topic.trim()) return;
  navigate("/login");
};
  return (
    <div style={styles.root}>

      {/* Navbar */}
      <nav style={styles.nav}>
        <div style={styles.logo}>
          course<span style={{ color: "#3b82f6" }}>rocket</span>.ai
        </div>
        <div style={styles.navLinks}>
          <span style={styles.navLink}>Explore</span>
          <span style={styles.navLink}>My Courses</span>
          <span style={styles.navLink}>Progress</span>
        </div>
        <span
            style={{ fontSize: "13px", color: "#60a5fa", cursor: "pointer", marginRight: "12px" }}
            onClick={() => navigate("/login")}
        >
            Sign In
        </span>
        <div style={styles.badge}>Beta</div>
      </nav>

      {/* Hero */}
      <div style={styles.hero}>
        <div style={styles.eyebrow}>
          <div style={styles.dot} />
          AI-powered learning for anything
        </div>

        <h1 style={styles.h1}>
          Learn <span style={{ color: "#3b82f6" }}>anything.</span>
          <br />Build everything.
        </h1>

        <p style={styles.subtitle}>
          Type any topic, project, or skill — CourseRocket builds you a full
          structured course with videos, papers, quizzes and progress tracking.
        </p>

        {/* Input box */}
        <div style={styles.inputRow}>
          <input
            style={styles.input}
            placeholder="e.g. Build a machine learning model from scratch..."
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleGenerate()}
          />
          <button style={styles.btn} onClick={handleGenerate}>
            Generate Course →
          </button>
        </div>

        {/* Suggestion chips */}
        <div style={styles.chips}>
          {suggestions.map((s) => (
            <div
              key={s}
              style={styles.chip}
              onClick={() => setTopic(s)}
            >
              {s}
            </div>
          ))}
        </div>
      </div>

      {/* Feature cards */}
      <div style={styles.features}>
        {[
          { icon: "▶", color: "#ef4444", title: "YouTube Curation", desc: "Best videos sourced and sequenced for your exact goal" },
          { icon: "◈", color: "#8b5cf6", title: "Research Papers", desc: "Academic papers summarised and linked at the right depth" },
          { icon: "◉", color: "#14b8a6", title: "Adaptive Quizzes", desc: "Auto-generated quizzes after each module" },
          { icon: "◎", color: "#f59e0b", title: "Progress Tracking", desc: "Visual dashboards showing where you are and what's next" },
          { icon: "✎", color: "#fb7185", title: "Smart Notes", desc: "AI-assisted notes that sync with your course content" },
          { icon: "↺", color: "#22c55e", title: "Spaced Repetition", desc: "Flashcard reviews timed for maximum retention" },
        ].map((f) => (
          <div key={f.title} style={styles.card}>
            <div style={{ ...styles.cardIcon, background: `${f.color}20` }}>
              <span style={{ color: f.color, fontSize: "16px" }}>{f.icon}</span>
            </div>
            <div style={styles.cardTitle}>{f.title}</div>
            <div style={styles.cardDesc}>{f.desc}</div>
          </div>
        ))}
      </div>

    </div>
  );
}

const styles = {
  root: {
    minHeight: "100vh",
    background: "#080d18",
    color: "#e8edf5",
    fontFamily: "'DM Sans', sans-serif",
  },
  nav: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "18px 40px",
    borderBottom: "1px solid rgba(59,130,246,0.15)",
  },
  logo: {
    fontFamily: "'Syne', sans-serif",
    fontWeight: 800,
    fontSize: "20px",
    color: "#fff",
    letterSpacing: "-0.5px",
  },
  navLinks: {
    display: "flex",
    gap: "28px",
  },
  navLink: {
    fontSize: "13px",
    color: "rgba(232,237,245,0.5)",
    cursor: "pointer",
  },
  badge: {
    background: "rgba(59,130,246,0.12)",
    border: "1px solid rgba(59,130,246,0.3)",
    color: "#60a5fa",
    fontSize: "11px",
    padding: "4px 10px",
    borderRadius: "20px",
    fontWeight: 500,
  },
  hero: {
    textAlign: "center",
    padding: "80px 40px 60px",
  },
  eyebrow: {
    display: "inline-flex",
    alignItems: "center",
    gap: "8px",
    background: "rgba(59,130,246,0.08)",
    border: "1px solid rgba(59,130,246,0.2)",
    borderRadius: "20px",
    padding: "6px 14px",
    fontSize: "12px",
    color: "#60a5fa",
    marginBottom: "28px",
    fontWeight: 500,
  },
  dot: {
    width: "6px",
    height: "6px",
    background: "#3b82f6",
    borderRadius: "50%",
  },
  h1: {
    fontFamily: "'Syne', sans-serif",
    fontWeight: 800,
    fontSize: "52px",
    lineHeight: 1.1,
    letterSpacing: "-1.5px",
    color: "#fff",
    marginBottom: "20px",
  },
  subtitle: {
    fontSize: "16px",
    color: "rgba(232,237,245,0.5)",
    maxWidth: "480px",
    margin: "0 auto 40px",
    lineHeight: 1.7,
    fontWeight: 300,
  },
  inputRow: {
    display: "flex",
    alignItems: "center",
    maxWidth: "560px",
    margin: "0 auto 20px",
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(59,130,246,0.25)",
    borderRadius: "12px",
    padding: "6px 6px 6px 18px",
  },
  input: {
    background: "none",
    border: "none",
    outline: "none",
    color: "#e8edf5",
    fontSize: "14px",
    flex: 1,
    fontFamily: "'DM Sans', sans-serif",
  },
  btn: {
    background: "#3b82f6",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    padding: "10px 22px",
    fontSize: "13px",
    fontWeight: 500,
    cursor: "pointer",
    fontFamily: "'DM Sans', sans-serif",
    whiteSpace: "nowrap",
  },
  chips: {
    display: "flex",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: "8px",
    maxWidth: "680px",
    margin: "0 auto",
  },
  chip: {
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: "20px",
    padding: "6px 14px",
    fontSize: "12px",
    color: "rgba(232,237,245,0.5)",
    cursor: "pointer",
  },
  features: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: "16px",
    maxWidth: "900px",
    margin: "0 auto",
    padding: "0 40px 60px",
  },
  card: {
    background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(255,255,255,0.07)",
    borderRadius: "12px",
    padding: "22px",
  },
  cardIcon: {
    width: "36px",
    height: "36px",
    borderRadius: "8px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: "14px",
  },
  cardTitle: {
    fontFamily: "'Syne', sans-serif",
    fontSize: "14px",
    fontWeight: 600,
    color: "#e8edf5",
    marginBottom: "6px",
  },
  cardDesc: {
    fontSize: "12px",
    color: "rgba(232,237,245,0.45)",
    lineHeight: 1.6,
  },
};