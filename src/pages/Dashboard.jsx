import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../lib/firebase";
import { collection, addDoc, getDocs, query, where } from "firebase/firestore";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { generateCourse } from "../lib/generateCourse";

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [topic, setTopic] = useState("");
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      if (!u) navigate("/login");
      else {
        setUser(u);
        fetchCourses(u.uid);
      }
    });
    return unsub;
  }, []);

  const fetchCourses = async (uid) => {
    try {
      const q = query(
        collection(db, "courses"),
        where("userId", "==", uid)
      );
      const snap = await getDocs(q);
      const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setCourses(data);
    } catch (e) {
      console.error(e);
    }
  };

  const handleGenerate = async () => {
    if (!topic.trim()) return setError("Please enter a topic first");
    setError("");
    setLoading(true);
    setLoadingMsg("🤖 AI is building your course structure...");

    try {
      const courseData = await generateCourse(topic, setLoadingMsg);

      setLoadingMsg("💾 Saving your course...");
      const docRef = await addDoc(collection(db, "courses"), {
        userId: user.uid,
        topic,
        createdAt: new Date().toISOString(),
        progress: {},
        ...courseData,
      });

      navigate(`/course/${docRef.id}`);
    } catch (e) {
      setError(e.message);
    }
    setLoading(false);
  };

  const handleSignOut = async () => {
    await signOut(auth);
    navigate("/");
  };

  return (
    <div style={styles.root}>
      {/* Navbar */}
      <nav style={styles.nav}>
        <div style={styles.logo}>
          course<span style={{ color: "#3b82f6" }}>rocket</span>.ai
        </div>
        <div style={styles.navRight}>
          <span style={styles.userEmail}>{user?.email || user?.displayName}</span>
          <button style={styles.signOutBtn} onClick={handleSignOut}>Sign out</button>
        </div>
      </nav>

      <div style={styles.body}>
        {/* Generate box */}
        <div style={styles.generateBox}>
          <h1 style={styles.h1}>What do you want to learn?</h1>
          <p style={styles.sub}>Describe any topic, project or skill — we'll build the full course.</p>

          <div style={styles.inputRow}>
            <input
              style={styles.input}
              placeholder="e.g. Build a stock price predictor with Black-Scholes..."
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleGenerate()}
              disabled={loading}
            />
            <button style={styles.btn} onClick={handleGenerate} disabled={loading}>
              {loading ? "Generating..." : "Generate →"}
            </button>
          </div>

          {error && <div style={styles.error}>{error}</div>}

          {loading && (
            <div style={styles.loadingBox}>
              <div style={styles.spinner} />
              <span style={styles.loadingMsg}>{loadingMsg}</span>
            </div>
          )}
        </div>

        {/* Existing courses */}
        {courses.length > 0 && (
          <>
            <h2 style={styles.sectionTitle}>Your courses</h2>
            <div style={styles.courseGrid}>
              {courses.map((c) => (
                <div
                  key={c.id}
                  style={styles.courseCard}
                  onClick={() => navigate(`/course/${c.id}`)}
                >
                  <div style={styles.courseLevel}>{c.level}</div>
                  <div style={styles.courseTitle}>{c.title}</div>
                  <div style={styles.courseMeta}>
                    {c.modules?.length} modules · {c.estimatedHours}h
                  </div>
                  <div style={styles.courseDesc}>{c.description}</div>
                  <div style={styles.continueBtn}>Continue →</div>
                </div>
              ))}
            </div>
          </>
        )}

        {courses.length === 0 && !loading && (
          <div style={styles.empty}>
            No courses yet — generate your first one above!
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  root: { minHeight: "100vh", background: "#080d18", color: "#e8edf5", fontFamily: "'DM Sans', sans-serif" },
  nav: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 40px", borderBottom: "1px solid rgba(59,130,246,0.15)" },
  logo: { fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: "20px", color: "#fff", letterSpacing: "-0.5px" },
  navRight: { display: "flex", alignItems: "center", gap: "16px" },
  userEmail: { fontSize: "13px", color: "rgba(232,237,245,0.4)" },
  signOutBtn: { background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", padding: "7px 14px", color: "rgba(232,237,245,0.6)", fontSize: "12px", cursor: "pointer", fontFamily: "'DM Sans', sans-serif" },
  body: { maxWidth: "900px", margin: "0 auto", padding: "48px 24px" },
  generateBox: { background: "rgba(59,130,246,0.05)", border: "1px solid rgba(59,130,246,0.15)", borderRadius: "16px", padding: "36px", marginBottom: "48px" },
  h1: { fontFamily: "'Syne', sans-serif", fontSize: "28px", fontWeight: 800, color: "#fff", marginBottom: "8px", letterSpacing: "-0.5px" },
  sub: { fontSize: "14px", color: "rgba(232,237,245,0.45)", marginBottom: "24px" },
  inputRow: { display: "flex", gap: "0", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(59,130,246,0.25)", borderRadius: "12px", padding: "6px 6px 6px 18px", marginBottom: "12px" },
  input: { flex: 1, background: "none", border: "none", outline: "none", color: "#e8edf5", fontSize: "14px", fontFamily: "'DM Sans', sans-serif" },
  btn: { background: "#3b82f6", color: "#fff", border: "none", borderRadius: "8px", padding: "10px 22px", fontSize: "13px", fontWeight: 500, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", whiteSpace: "nowrap" },
  error: { background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: "8px", padding: "10px 14px", fontSize: "13px", color: "#f87171" },
  loadingBox: { display: "flex", alignItems: "center", gap: "12px", marginTop: "16px", padding: "14px", background: "rgba(255,255,255,0.03)", borderRadius: "10px", border: "1px solid rgba(255,255,255,0.06)" },
  spinner: { width: "16px", height: "16px", border: "2px solid rgba(59,130,246,0.3)", borderTop: "2px solid #3b82f6", borderRadius: "50%", animation: "spin 1s linear infinite", flexShrink: 0 },
  loadingMsg: { fontSize: "13px", color: "rgba(232,237,245,0.6)" },
  sectionTitle: { fontFamily: "'Syne', sans-serif", fontSize: "18px", fontWeight: 700, color: "#fff", marginBottom: "16px" },
  courseGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "16px" },
  courseCard: { background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "12px", padding: "22px", cursor: "pointer" },
  courseLevel: { fontSize: "11px", color: "#60a5fa", background: "rgba(59,130,246,0.1)", border: "1px solid rgba(59,130,246,0.2)", borderRadius: "20px", padding: "3px 10px", display: "inline-block", marginBottom: "10px" },
  courseTitle: { fontFamily: "'Syne', sans-serif", fontSize: "15px", fontWeight: 700, color: "#fff", marginBottom: "6px" },
  courseMeta: { fontSize: "12px", color: "rgba(232,237,245,0.35)", marginBottom: "8px" },
  courseDesc: { fontSize: "12px", color: "rgba(232,237,245,0.5)", lineHeight: 1.6, marginBottom: "16px" },
  continueBtn: { fontSize: "12px", color: "#3b82f6", fontWeight: 500 },
  empty: { textAlign: "center", color: "rgba(232,237,245,0.25)", fontSize: "14px", padding: "60px 0" },
};