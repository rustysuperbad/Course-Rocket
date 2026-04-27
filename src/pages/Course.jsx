import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { auth, db } from "../lib/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

export default function Course() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeModule, setActiveModule] = useState(0);
  const [progress, setProgress] = useState({});
  const [showQuiz, setShowQuiz] = useState(false);
  const [quizAnswers, setQuizAnswers] = useState({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      if (!u) navigate("/login");
      else fetchCourse();
    });
    return unsub;
  }, []);

  const fetchCourse = async () => {
    try {
      const snap = await getDoc(doc(db, "courses", id));
      if (snap.exists()) {
        const data = snap.data();
        setCourse(data);
        setProgress(data.progress || {});
      }
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const markComplete = async () => {
    const moduleId = course.modules[activeModule].id;
    const newProgress = { ...progress, [moduleId]: true };
    setProgress(newProgress);
    await updateDoc(doc(db, "courses", id), { progress: newProgress });
  };

  const handleQuizAnswer = (qIndex, optIndex) => {
    if (quizSubmitted) return;
    setQuizAnswers((prev) => ({ ...prev, [qIndex]: optIndex }));
  };

  const submitQuiz = async () => {
    setQuizSubmitted(true);
    const moduleId = course.modules[activeModule].id;
    const quiz = course.modules[activeModule].quiz;
    const score = quiz.filter((q, i) => quizAnswers[i] === q.correctIndex).length;
    const newProgress = { ...progress, [moduleId]: true, [moduleId + "_quiz"]: score };
    setProgress(newProgress);
    await updateDoc(doc(db, "courses", id), { progress: newProgress });
  };

  const resetQuiz = () => { setQuizAnswers({}); setQuizSubmitted(false); };

  const openModule = (index) => {
    setActiveModule(index);
    setShowQuiz(false);
    resetQuiz();
  };

  if (loading) return (
    <div style={{ background: "#050a14", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "DM Sans, sans-serif" }}>
      <div style={{ color: "#3b82f6", fontSize: "15px", textShadow: "0 0 20px rgba(59,130,246,0.8)" }}>Loading your course...</div>
    </div>
  );

  if (!course) return (
    <div style={{ background: "#050a14", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "DM Sans, sans-serif" }}>
      <div style={{ color: "#f87171", fontSize: "15px" }}>Course not found.</div>
    </div>
  );

  const module = course.modules[activeModule];
  const completedCount = course.modules.filter((m) => progress[m.id]).length;
  const progressPct = Math.round((completedCount / course.modules.length) * 100);
  const quizScore = progress[module.id + "_quiz"];
  const isCompleted = progress[module.id];
  const quizCorrect = module.quiz
    ? module.quiz.filter((q, i) => quizAnswers[i] === q.correctIndex).length
    : 0;

  return (
    <div style={s.root}>
      <style>{`
        @keyframes glow-pulse {
          0%,100% { text-shadow: 0 0 10px rgba(59,130,246,0.9), 0 0 20px rgba(59,130,246,0.5), 0 0 40px rgba(59,130,246,0.3); }
          50% { text-shadow: 0 0 20px rgba(59,130,246,1), 0 0 40px rgba(59,130,246,0.7), 0 0 80px rgba(59,130,246,0.5); }
        }
        @keyframes fadeIn {
          from { opacity:0; transform:translateY(10px); }
          to { opacity:1; transform:translateY(0); }
        }
        .mod-item:hover { background: rgba(59,130,246,0.06) !important; border-color: rgba(59,130,246,0.15) !important; }
        .res-card:hover { border-color: rgba(139,92,246,0.4) !important; box-shadow: 0 0 20px rgba(139,92,246,0.1) !important; }
        .opt-item:hover { border-color: rgba(59,130,246,0.4) !important; background: rgba(59,130,246,0.06) !important; }
        .quiz-btn-main:hover { box-shadow: 0 0 25px rgba(59,130,246,0.6) !important; background: #2563eb !important; }
        .complete-btn:hover { box-shadow: 0 0 20px rgba(34,197,94,0.4) !important; }
        .next-btn:hover { box-shadow: 0 0 25px rgba(59,130,246,0.6) !important; }
        .back-link:hover { color: #3b82f6 !important; text-shadow: 0 0 10px rgba(59,130,246,0.6) !important; }
        .dash-link:hover { color: #60a5fa !important; text-shadow: 0 0 12px rgba(59,130,246,0.7) !important; }
      `}</style>

      <nav style={s.nav}>
        <div
          className="dash-link"
          style={s.logo}
          onClick={() => navigate("/dashboard")}
        >
          course<span style={{ color: "#3b82f6", textShadow: "0 0 15px rgba(59,130,246,0.8)" }}>rocket</span>.ai
        </div>
        <div style={s.navCenter}>{course.title}</div>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={s.progressPill}>{progressPct}% complete</div>
          <button
            style={s.dashBtn}
            onClick={() => navigate("/dashboard")}
          >
            ← Dashboard
          </button>
        </div>
      </nav>

      <div style={s.layout}>

        <div style={s.sidebar}>
          <div style={s.sidebarTop}>
            <div style={s.progTrack}>
              <div style={{ ...s.progFill, width: progressPct + "%" }} />
            </div>
            <span style={s.progLabel}>{completedCount} of {course.modules.length} modules done</span>
          </div>

          {course.modules.map((m, i) => {
            const done = progress[m.id];
            const active = i === activeModule;
            return (
              <div
                key={m.id}
                className="mod-item"
                onClick={() => openModule(i)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  padding: "10px",
                  borderRadius: "9px",
                  cursor: "pointer",
                  marginBottom: "4px",
                  transition: "all 0.2s",
                  background: active ? "rgba(59,130,246,0.1)" : "transparent",
                  border: active ? "1px solid rgba(59,130,246,0.3)" : "1px solid transparent",
                  boxShadow: active ? "0 0 15px rgba(59,130,246,0.1)" : "none",
                }}
              >
                <div style={{
                  width: "26px", height: "26px", borderRadius: "6px",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "11px", fontWeight: 600, flexShrink: 0,
                  background: done ? "#22c55e" : active ? "#3b82f6" : "rgba(255,255,255,0.06)",
                  color: (done || active) ? "#fff" : "rgba(232,237,245,0.4)",
                  boxShadow: done ? "0 0 10px rgba(34,197,94,0.4)" : active ? "0 0 10px rgba(59,130,246,0.5)" : "none",
                }}>
                  {done ? "✓" : i + 1}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: "12px", color: active ? "#e8edf5" : "rgba(232,237,245,0.6)", fontWeight: active ? 500 : 400, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {m.title}
                  </div>
                  <div style={{ fontSize: "11px", color: "rgba(232,237,245,0.25)", marginTop: "2px" }}>
                    {m.videos ? m.videos.length : 0} videos
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div style={s.main}>
          {!showQuiz ? (
            <div style={{ animation: "fadeIn 0.3s ease" }}>

              <div style={s.moduleHeader}>
                <div style={s.moduleTag}>Module {activeModule + 1}</div>
                <h1 style={s.moduleTitle}>{module.title}</h1>
                <p style={s.moduleSummary}>{module.summary}</p>
              </div>

              <div style={s.section}>
                <h2 style={s.sectionTitle}>Key concepts</h2>
                <div style={s.conceptsGrid}>
                  {module.concepts && module.concepts.map((c) => (
                    <div key={c} style={s.conceptTag}>{c}</div>
                  ))}
                </div>
              </div>

              {module.lessons && module.lessons.length > 0 && (
                <div style={s.section}>
                  <h2 style={s.sectionTitle}>Lesson content</h2>
                  <div style={s.lessonsContainer}>
                    {module.lessons.map((lesson, i) => (
                      <div key={i} style={s.lessonBlock}>
                        <h3 style={s.lessonHeading}>{lesson.heading}</h3>
                        {lesson.text.split("\n\n").map((para, j) => (
                          <p key={j} style={s.lessonParagraph}>{para}</p>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div style={s.section}>
                <h2 style={s.sectionTitle}>Module videos</h2>
                {module.videos && module.videos.length > 0 ? (
                  <div style={s.videoList}>
                    {module.videos.map((v) => (
                      <div key={v.videoId} style={s.videoCard}>
                        <iframe
                          width="100%"
                          height="300"
                          src={"https://www.youtube.com/embed/" + v.videoId + "?rel=0&modestbranding=1"}
                          title={v.title}
                          frameBorder="0"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                          style={{ borderRadius: "8px", display: "block" }}
                        />
                        <div style={s.videoMeta}>
                          <div style={s.videoTitle}>{v.title}</div>
                          <div style={s.videoChannel}>{v.channel}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={s.noContent}>No videos found for this module.</div>
                )}
              </div>

              <div style={s.section}>
                <h2 style={s.sectionTitle}>Research and reading</h2>
                {module.papers && module.papers.length > 0 ? (
                  <div style={s.resourceList}>
                    {module.papers.map((p, i) => (
                      <a
                        key={i}
                        href={p.url}
                        target="_blank"
                        rel="noreferrer"
                        className="res-card"
                        style={s.paperCard}
                      >
                        <div style={s.paperIcon}>◈</div>
                        <div style={{ flex: 1 }}>
                          <div style={s.paperTitle}>{p.title}</div>
                          <div style={s.paperMeta}>{p.authors}{p.year ? " · " + p.year : ""}</div>
                          {p.abstract && <div style={s.paperAbstract}>{p.abstract}</div>}
                        </div>
                        <div style={s.paperArrow}>→</div>
                      </a>
                    ))}
                  </div>
                ) : (
                  <div style={s.noContent}>No papers found for this module.</div>
                )}
              </div>

              <div style={s.actions}>
                <button
                  className="quiz-btn-main"
                  style={s.quizBtn}
                  onClick={() => setShowQuiz(true)}
                >
                  Take module quiz →
                </button>
                {!isCompleted && (
                  <button
                    className="complete-btn"
                    style={s.completeBtn}
                    onClick={markComplete}
                  >
                    Mark as complete
                  </button>
                )}
                {isCompleted && (
                  <div style={s.completedBadge}>
                    {"✓ Completed" + (quizScore !== undefined ? " · Quiz: " + quizScore + "/" + (module.quiz ? module.quiz.length : 0) : "")}
                  </div>
                )}
                {activeModule < course.modules.length - 1 && (
                  <button
                    style={s.nextModBtn}
                    onClick={() => openModule(activeModule + 1)}
                  >
                    Next module →
                  </button>
                )}
              </div>

            </div>
          ) : (

            <div style={{ animation: "fadeIn 0.3s ease", maxWidth: "680px" }}>
              <button
                className="back-link"
                style={s.backBtn}
                onClick={() => { setShowQuiz(false); resetQuiz(); }}
              >
                ← Back to module
              </button>
              <h2 style={s.quizTitle}>Module {activeModule + 1} Quiz</h2>
              <p style={s.quizSub}>Test your understanding of {module.title}</p>

              {module.quiz && module.quiz.map((q, qIndex) => {
                const selected = quizAnswers[qIndex];
                return (
                  <div key={qIndex} style={s.questionCard}>
                    <div style={s.questionNum}>Question {qIndex + 1}</div>
                    <div style={s.questionText}>{q.question}</div>
                    <div style={s.optionsList}>
                      {q.options.map((opt, optIndex) => {
                        let base = { ...s.option };
                        if (quizSubmitted) {
                          if (optIndex === q.correctIndex) base = { ...base, ...s.optCorrect };
                          else if (optIndex === selected) base = { ...base, ...s.optWrong };
                        } else if (selected === optIndex) {
                          base = { ...base, ...s.optSelected };
                        }
                        return (
                          <div
                            key={optIndex}
                            className="opt-item"
                            style={base}
                            onClick={() => handleQuizAnswer(qIndex, optIndex)}
                          >
                            <div style={s.optLetter}>{["A","B","C","D"][optIndex]}</div>
                            {opt}
                          </div>
                        );
                      })}
                    </div>
                    {quizSubmitted && (
                      <div style={s.explanation}>
                        {quizAnswers[qIndex] === q.correctIndex ? "✓ Correct! " : "✗ Incorrect. "}
                        {q.explanation}
                      </div>
                    )}
                  </div>
                );
              })}

              {!quizSubmitted ? (
                <button
                  className="quiz-btn-main"
                  style={{
                    ...s.submitBtn,
                    opacity: module.quiz && Object.keys(quizAnswers).length < module.quiz.length ? 0.4 : 1,
                  }}
                  onClick={submitQuiz}
                  disabled={module.quiz && Object.keys(quizAnswers).length < module.quiz.length}
                >
                  Submit answers
                </button>
              ) : (
                <div style={s.resultCard}>
                  <div style={s.scoreNum}>
                    {quizCorrect}
                    <span style={{ fontSize: "28px", color: "rgba(232,237,245,0.3)" }}>
                      {"/" + (module.quiz ? module.quiz.length : 0)}
                    </span>
                  </div>
                  <div style={s.scoreLabel}>correct answers</div>
                  <div style={s.resultActions}>
                    <button style={s.retryBtn} onClick={resetQuiz}>Retry</button>
                    <button
                      className="next-btn"
                      style={s.nextBtn}
                      onClick={() => {
                        setShowQuiz(false);
                        resetQuiz();
                        if (activeModule < course.modules.length - 1) openModule(activeModule + 1);
                        else navigate("/dashboard");
                      }}
                    >
                      {activeModule < course.modules.length - 1 ? "Next module →" : "Finish course ✓"}
                    </button>
                  </div>
                </div>
              )}
            </div>

          )}
        </div>
      </div>
    </div>
  );
}

const s = {
  root: { minHeight: "100vh", background: "#050a14", color: "#e8edf5", fontFamily: "DM Sans, sans-serif" },
  nav: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 32px", borderBottom: "1px solid rgba(59,130,246,0.15)", position: "sticky", top: 0, background: "rgba(5,10,20,0.97)", backdropFilter: "blur(10px)", zIndex: 10 },
  logo: { fontFamily: "Syne, sans-serif", fontWeight: 800, fontSize: "18px", color: "#fff", cursor: "pointer", letterSpacing: "-0.5px", transition: "all 0.2s" },
  navCenter: { fontSize: "13px", color: "rgba(232,237,245,0.4)", maxWidth: "380px", textAlign: "center", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
  progressPill: { background: "rgba(59,130,246,0.1)", border: "1px solid rgba(59,130,246,0.25)", color: "#60a5fa", fontSize: "12px", padding: "5px 12px", borderRadius: "20px", textShadow: "0 0 10px rgba(59,130,246,0.5)" },
  dashBtn: { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", padding: "7px 14px", color: "rgba(232,237,245,0.5)", fontSize: "12px", cursor: "pointer", fontFamily: "DM Sans, sans-serif", transition: "all 0.2s" },
  layout: { display: "grid", gridTemplateColumns: "280px 1fr", minHeight: "calc(100vh - 57px)" },
  sidebar: { borderRight: "1px solid rgba(59,130,246,0.08)", padding: "20px 12px", overflowY: "auto", background: "rgba(5,10,20,0.5)" },
  sidebarTop: { padding: "0 8px 16px", borderBottom: "1px solid rgba(255,255,255,0.05)", marginBottom: "12px" },
  progTrack: { background: "rgba(255,255,255,0.05)", borderRadius: "20px", height: "4px", overflow: "hidden", marginBottom: "6px" },
  progFill: { height: "100%", background: "#3b82f6", borderRadius: "20px", transition: "width 0.5s ease", boxShadow: "0 0 8px rgba(59,130,246,0.7)" },
  progLabel: { fontSize: "11px", color: "rgba(232,237,245,0.3)" },
  main: { padding: "40px 52px", overflowY: "auto" },
  moduleHeader: { marginBottom: "32px", maxWidth: "720px" },
  moduleTag: { fontSize: "11px", color: "#3b82f6", fontWeight: 600, marginBottom: "10px", letterSpacing: "1px", textTransform: "uppercase", textShadow: "0 0 10px rgba(59,130,246,0.6)" },
  moduleTitle: { fontFamily: "Syne, sans-serif", fontSize: "30px", fontWeight: 800, color: "#fff", letterSpacing: "-0.5px", marginBottom: "12px", textShadow: "0 0 30px rgba(255,255,255,0.1)" },
  moduleSummary: { fontSize: "15px", color: "rgba(232,237,245,0.5)", lineHeight: 1.7 },
  section: { marginBottom: "40px", maxWidth: "720px" },
  sectionTitle: { fontFamily: "Syne, sans-serif", fontSize: "16px", fontWeight: 700, color: "#e8edf5", marginBottom: "16px", textShadow: "0 0 15px rgba(255,255,255,0.15)" },
  conceptsGrid: { display: "flex", flexWrap: "wrap", gap: "8px" },
  conceptTag: { background: "rgba(139,92,246,0.08)", border: "1px solid rgba(139,92,246,0.25)", color: "#a78bfa", fontSize: "12px", padding: "6px 14px", borderRadius: "20px", textShadow: "0 0 8px rgba(139,92,246,0.5)" },
  lessonsContainer: { display: "flex", flexDirection: "column", gap: "28px" },
  lessonBlock: { background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "12px", padding: "24px 28px", borderLeft: "3px solid rgba(59,130,246,0.4)" },
  lessonHeading: { fontFamily: "Syne, sans-serif", fontSize: "17px", fontWeight: 700, color: "#e8edf5", marginBottom: "14px", letterSpacing: "-0.3px" },
  lessonParagraph: { fontSize: "14px", color: "rgba(232,237,245,0.7)", lineHeight: 1.85, marginBottom: "12px" },
  videoList: { display: "flex", flexDirection: "column", gap: "24px" },
  videoCard: { background: "rgba(255,255,255,0.02)", border: "1px solid rgba(59,130,246,0.1)", borderRadius: "12px", padding: "16px", boxShadow: "0 0 20px rgba(59,130,246,0.05)" },
  videoMeta: { marginTop: "12px" },
  videoTitle: { fontSize: "14px", color: "#e8edf5", fontWeight: 500, marginBottom: "4px", lineHeight: 1.4 },
  videoChannel: { fontSize: "12px", color: "rgba(232,237,245,0.3)" },
  resourceList: { display: "flex", flexDirection: "column", gap: "10px" },
  paperCard: { display: "flex", alignItems: "flex-start", gap: "14px", padding: "16px", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(139,92,246,0.15)", borderRadius: "10px", textDecoration: "none", color: "inherit", transition: "all 0.2s" },
  paperIcon: { width: "32px", height: "32px", background: "rgba(139,92,246,0.1)", color: "#a78bfa", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px", flexShrink: 0, marginTop: "2px", textShadow: "0 0 8px rgba(139,92,246,0.6)" },
  paperTitle: { fontSize: "13px", color: "#e8edf5", fontWeight: 500, marginBottom: "4px", lineHeight: 1.4 },
  paperMeta: { fontSize: "11px", color: "rgba(232,237,245,0.3)", marginBottom: "6px" },
  paperAbstract: { fontSize: "12px", color: "rgba(232,237,245,0.35)", lineHeight: 1.6 },
  paperArrow: { fontSize: "16px", color: "rgba(59,130,246,0.4)", flexShrink: 0, marginTop: "2px" },
  noContent: { fontSize: "13px", color: "rgba(232,237,245,0.2)", padding: "16px 0" },
  actions: { display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap", marginTop: "40px", paddingTop: "24px", borderTop: "1px solid rgba(255,255,255,0.05)", maxWidth: "720px" },
  quizBtn: { background: "#3b82f6", color: "#fff", border: "none", borderRadius: "10px", padding: "12px 24px", fontSize: "14px", fontWeight: 500, cursor: "pointer", fontFamily: "DM Sans, sans-serif", boxShadow: "0 0 20px rgba(59,130,246,0.4)", transition: "all 0.2s" },
  completeBtn: { background: "rgba(34,197,94,0.08)", color: "#4ade80", border: "1px solid rgba(34,197,94,0.25)", borderRadius: "10px", padding: "12px 24px", fontSize: "14px", fontWeight: 500, cursor: "pointer", fontFamily: "DM Sans, sans-serif", transition: "all 0.2s", textShadow: "0 0 8px rgba(34,197,94,0.4)" },
  completedBadge: { background: "rgba(34,197,94,0.08)", color: "#4ade80", border: "1px solid rgba(34,197,94,0.25)", borderRadius: "10px", padding: "12px 24px", fontSize: "14px", fontWeight: 500, textShadow: "0 0 10px rgba(34,197,94,0.5)" },
  nextModBtn: { background: "rgba(255,255,255,0.04)", color: "rgba(232,237,245,0.5)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "10px", padding: "12px 24px", fontSize: "14px", cursor: "pointer", fontFamily: "DM Sans, sans-serif", transition: "all 0.2s" },
  backBtn: { background: "none", border: "none", color: "rgba(232,237,245,0.35)", fontSize: "13px", cursor: "pointer", fontFamily: "DM Sans, sans-serif", marginBottom: "20px", padding: 0, display: "block", transition: "all 0.2s" },
  quizTitle: { fontFamily: "Syne, sans-serif", fontSize: "26px", fontWeight: 800, color: "#fff", marginBottom: "8px", textShadow: "0 0 20px rgba(255,255,255,0.1)" },
  quizSub: { fontSize: "14px", color: "rgba(232,237,245,0.4)", marginBottom: "28px" },
  questionCard: { background: "rgba(255,255,255,0.02)", border: "1px solid rgba(59,130,246,0.1)", borderRadius: "12px", padding: "24px", marginBottom: "16px" },
  questionNum: { fontSize: "11px", color: "#3b82f6", fontWeight: 600, marginBottom: "8px", letterSpacing: "0.8px", textShadow: "0 0 8px rgba(59,130,246,0.6)" },
  questionText: { fontSize: "15px", color: "#e8edf5", fontWeight: 500, marginBottom: "16px", lineHeight: 1.6 },
  optionsList: { display: "flex", flexDirection: "column", gap: "8px" },
  option: { display: "flex", alignItems: "center", gap: "12px", padding: "12px 14px", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "9px", cursor: "pointer", fontSize: "14px", color: "rgba(232,237,245,0.65)", transition: "all 0.15s" },
  optSelected: { background: "rgba(59,130,246,0.1)", border: "1px solid rgba(59,130,246,0.4)", color: "#e8edf5", boxShadow: "0 0 12px rgba(59,130,246,0.2)" },
  optCorrect: { background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.4)", color: "#4ade80", boxShadow: "0 0 12px rgba(34,197,94,0.2)" },
  optWrong: { background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.3)", color: "#f87171" },
  optLetter: { width: "24px", height: "24px", borderRadius: "6px", background: "rgba(255,255,255,0.05)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", fontWeight: 600, flexShrink: 0 },
  explanation: { marginTop: "12px", fontSize: "13px", color: "rgba(232,237,245,0.5)", lineHeight: 1.6, padding: "10px 14px", background: "rgba(59,130,246,0.04)", borderRadius: "8px", borderLeft: "2px solid rgba(59,130,246,0.4)" },
  submitBtn: { width: "100%", background: "#3b82f6", color: "#fff", border: "none", borderRadius: "10px", padding: "14px", fontSize: "15px", fontWeight: 500, cursor: "pointer", fontFamily: "DM Sans, sans-serif", marginTop: "8px", boxShadow: "0 0 20px rgba(59,130,246,0.4)", transition: "all 0.2s" },
  resultCard: { background: "rgba(59,130,246,0.05)", border: "1px solid rgba(59,130,246,0.2)", borderRadius: "16px", padding: "40px", textAlign: "center", marginTop: "16px", boxShadow: "0 0 40px rgba(59,130,246,0.1)" },
  scoreNum: { fontFamily: "Syne, sans-serif", fontSize: "64px", fontWeight: 800, color: "#fff", lineHeight: 1, textShadow: "0 0 30px rgba(59,130,246,0.6)" },
  scoreLabel: { fontSize: "14px", color: "rgba(232,237,245,0.35)", marginTop: "8px", marginBottom: "28px" },
  resultActions: { display: "flex", gap: "12px", justifyContent: "center" },
  retryBtn: { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(232,237,245,0.6)", borderRadius: "10px", padding: "12px 24px", fontSize: "14px", cursor: "pointer", fontFamily: "DM Sans, sans-serif", transition: "all 0.2s" },
  nextBtn: { background: "#3b82f6", color: "#fff", border: "none", borderRadius: "10px", padding: "12px 28px", fontSize: "14px", fontWeight: 500, cursor: "pointer", fontFamily: "DM Sans, sans-serif", boxShadow: "0 0 20px rgba(59,130,246,0.4)", transition: "all 0.2s" },
};