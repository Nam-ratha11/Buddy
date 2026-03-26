"use client";
import { useState, useEffect, useRef } from 'react';

const T = {
  pageBg: 'var(--page)', cardBg: 'var(--card)', zoneBg: 'var(--zone)',
  green: 'var(--g)', gMid: 'var(--gMid)', gLight: 'var(--gLight)', gRing: 'var(--gRing)',
  gGlow: 'var(--gGlow)', ink: 'var(--ink)', sub: 'var(--sub)',
  hint: 'var(--hint)', line: 'var(--line)', lineHi: 'var(--lineHi)',
  amber: 'var(--amber)', amberBg: 'var(--amberBg)', amberLine: 'var(--amberLine)',
};
const cardShadow = '0 0 0 1px rgba(0,0,0,0.04), 0 2px 4px rgba(0,0,0,0.04), 0 12px 40px rgba(0,0,0,0.07)';

function MermaidDiagram({ chart }) {
  const [svg, setSvg] = useState('');
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!chart) {
      setLoading(false);
      return;
    }
    
    let cancelled = false;
    setLoading(true);
    
    (async () => {
      try {
        const mermaid = (await import('mermaid')).default;
        mermaid.initialize({
          startOnLoad: false,
          theme: 'base',
          themeVariables: {
            primaryColor: '#EFF6FF',
            primaryBorderColor: '#BFDBFE',
            primaryTextColor: '#0F172A',
            lineColor: '#2563EB',
            fontFamily: 'DM Sans, sans-serif',
            fontSize: '14px'
          },
          flowchart: { curve: 'basis', padding: 15 }
        });
        
        const id = `mermaid-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const { svg: rendered } = await mermaid.render(id, chart);
        
        if (!cancelled) {
          setSvg(rendered);
          setLoading(false);
        }
      } catch (e) {
        console.error('Mermaid render error:', e);
        if (!cancelled) {
          setError(true);
          setLoading(false);
        }
      }
    })();
    
    return () => { cancelled = true; };
  }, [chart]);

  if (!chart) return null;
  if (error) {
    return (
      <div style={{
        padding: '16px',
        borderRadius: 12,
        background: T.amberBg,
        border: `1px solid ${T.amberLine}`,
        margin: '12px 0'
      }}>
        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: T.amber, margin: 0 }}>
          ⚠️ Could not render diagram
        </p>
      </div>
    );
  }
  
  if (loading || !svg) {
    return (
      <div style={{
        padding: '20px',
        borderRadius: 12,
        background: T.zoneBg,
        border: `1px solid ${T.line}`,
        margin: '12px 0',
        textAlign: 'center'
      }}>
        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: T.hint, margin: 0 }}>
          Rendering diagram…
        </p>
      </div>
    );
  }
  
  return (
    <div style={{
      padding: '20px',
      borderRadius: 12,
      background: T.cardBg,
      border: `1px solid ${T.line}`,
      display: 'flex',
      justifyContent: 'center',
      overflow: 'auto',
      margin: '12px 0'
    }}
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}

export default function RemediationAgent({ evaluation, history = [], studentClass, syllabusTopics }) {
  const [gapProgress, setGapProgress] = useState({});
  const [messages, setMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [activeTopic, setActiveTopic] = useState(null);
  const [profile, setProfile] = useState({ weakTopics: {} });
  const [mcqAnswers, setMcqAnswers] = useState({});
  const scrollRef = useRef(null);
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';

  const getStorageKey = () => {
    try { const user = JSON.parse(localStorage.getItem('sprout_current_user') || '{}'); return `sprout_gap_progress_${user.studentId || 'default'}`; }
    catch { return 'sprout_gap_progress_default'; }
  };

  useEffect(() => {
    const saved = localStorage.getItem(getStorageKey());
    if (saved) { try { setGapProgress(JSON.parse(saved)); } catch { } }
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try { const res = await fetch(`${API_URL}/api/profile`); const data = await res.json(); if (data.weakTopics) setProfile(data); }
    catch (e) { console.error("Failed to fetch profile:", e); }
  };

  const updateGapProgress = (topic, status) => {
    const updated = { ...gapProgress, [topic]: status };
    setGapProgress(updated);
    localStorage.setItem(getStorageKey(), JSON.stringify(updated));
  };

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, isTyping]);

  let allQuestions = [];
  if (evaluation && evaluation.questions) allQuestions = evaluation.questions;
  else if (history.length > 0) allQuestions = history.reduce((acc, item) => { if (item.data && item.data.questions) return acc.concat(item.data.questions); return acc; }, []);

  const topicScores = {};
  allQuestions.forEach(q => {
    if (!topicScores[q.topic]) topicScores[q.topic] = { subject: q.subject, total: 0, obtained: 0, mistakeType: null, feedback: null };
    topicScores[q.topic].total += q.maxMarks;
    topicScores[q.topic].obtained += q.marksObtained;
    if (q.marksObtained < q.maxMarks) { topicScores[q.topic].mistakeType = q.mistakeType; topicScores[q.topic].feedback = q.feedback; }
  });

  const buildWeakTopics = () => {
    let weak = [];
    if (syllabusTopics) {
      Object.entries(syllabusTopics).forEach(([subject, topics]) => {
        topics.forEach(topic => {
          const score = topicScores[topic];
          if (score) { const pct = (score.obtained / score.total) * 100; if (pct < 75) weak.push({ topic, subject, mistakeType: score.mistakeType, feedback: score.feedback, status: gapProgress[topic] || 'weak' }); }
        });
      });
    }
    Object.values(profile.weakTopics).forEach(pt => {
      const exists = weak.find(w => w.topic.toLowerCase() === pt.name.toLowerCase());
      if (!exists) weak.push({ topic: pt.name, subject: pt.subject, mistakeType: pt.mistakeType, feedback: pt.feedback, status: pt.status.toLowerCase().replace(' ', '_'), isFromMemory: true });
      else exists.status = pt.status.toLowerCase().replace(' ', '_');
    });
    return weak;
  };

  const weakTopics = buildWeakTopics();

  useEffect(() => {
    if (weakTopics.length > 0 && messages.length === 0) {
      const unresolved = weakTopics.filter(t => t.status !== 'resolved');
      if (unresolved.length > 0) {
        setMessages([
          { id: Date.now().toString(), role: 'bot', type: 'text', content: `Hi! I'm your AI Improvement Coach. Based on your recent performance, I've identified a few specific areas where we can improve to boost your score. What would you like to review first?` },
          { id: (Date.now() + 1).toString(), role: 'bot', type: 'options', options: unresolved.map(t => ({ label: t.topic, action: () => handleTopicSelect(t.topic, t.mistakeType, t.feedback) })) }
        ]);
      } else {
        setMessages([{ id: Date.now().toString(), role: 'bot', type: 'text', content: `Hi! I'm your AI Improvement Coach. Great job! It looks like you have resolved all your weak topics for now.` }]);
      }
    } else if (weakTopics.length === 0 && messages.length === 0) {
      setMessages([{ id: Date.now().toString(), role: 'bot', type: 'text', content: `Hi! I'm your AI Improvement Coach. I haven't found any weak topics from your tests yet, but you can still ask me to explain any topic you'd like to learn about!` }]);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weakTopics.length]);

  const generateOptionsMessage = () => {
    const unresolved = buildWeakTopics().filter(t => t.status !== 'resolved');
    if (unresolved.length > 0) return { id: Date.now().toString(), role: 'bot', type: 'options', content: 'Which topic would you like to tackle next?', options: unresolved.map(t => ({ label: t.topic, action: () => handleTopicSelect(t.topic, t.mistakeType, t.feedback) })) };
    return { id: Date.now().toString(), role: 'bot', type: 'text', content: 'Amazing! You have resolved all the weak gaps I found.' };
  };

  const handleTopicSelect = async (topic, mistakeType, feedback) => {
    setActiveTopic(topic);
    setMessages(prev => { const newMsgs = [...prev]; const last = newMsgs[newMsgs.length - 1]; if (last.type === 'options') newMsgs.pop(); return [...newMsgs, { id: Date.now().toString(), role: 'user', type: 'text', content: `I want to review ${topic}` }]; });
    setIsTyping(true);
    updateGapProgress(topic, 'in_progress');
    try {
      console.log('[RemediationAgent] Requesting remediation for:', topic);
      const response = await fetch(`${API_URL}/api/remediate`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ topic, grade: studentClass, mistakeType, feedback }) });
      const data = await response.json();
      console.log('[RemediationAgent] Received data:', data);
      console.log('[RemediationAgent] Has conceptMap?', !!data.conceptMap);
      console.log('[RemediationAgent] Has youtubeSearchQuery?', !!data.youtubeSearchQuery);
      if (data.error) throw new Error(data.error);
      setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), role: 'bot', type: 'explanation', data }, { id: (Date.now() + 2).toString(), role: 'bot', type: 'text', content: `I've prepared a detailed lesson on ${topic} for you. Feel free to ask me any questions about it below!` }]);
    } catch (error) {
      console.error('[RemediationAgent] Error:', error);
      setMessages(prev => [...prev, { id: Date.now().toString(), role: 'bot', type: 'text', content: "Sorry, I had trouble generating that lesson. Let's try another topic." }]);
    } finally { setIsTyping(false); }
  };

  const handleSendMessage = async (e) => {
    if (e) e.preventDefault();
    if (!inputValue.trim() || isTyping) return;
    const userMsg = inputValue.trim();
    setInputValue('');
    setMessages(prev => [...prev, { id: Date.now().toString(), role: 'user', type: 'text', content: userMsg }]);
    setIsTyping(true);
    try {
      let contextualHistory = [];
      messages.forEach(m => {
        if (m.type === 'text') contextualHistory.push({ role: m.role, content: m.content });
        else if (m.type === 'explanation' && m.data) {
          const d = m.data;
          let s = `[SYSTEM CONTEXT: You previously taught a lesson on "${d.topic}". `;
          if (d.hook) s += `The hook was: ${d.hook.title}. `;
          if (d.chapterExplanation) s += `Overview: ${d.chapterExplanation.overview}. `;
          if (d.chapterExplanation?.keyConcepts) s += `Key Concepts: ${d.chapterExplanation.keyConcepts.map(kc => kc.heading).join(', ')}. `;
          if (d.proTips) s += `Pro Tips: ${d.proTips.join('; ')}. `;
          s += `]`;
          contextualHistory.push({ role: 'assistant', content: s });
        }
      });
      const response = await fetch(`${API_URL}/api/chat`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message: userMsg, history: contextualHistory, grade: studentClass, topic: activeTopic || 'General' }) });
      const data = await response.json();
      if (data.error) throw new Error(data.error);
      
      // Handle both text and explanation responses
      if (data.type === 'explanation' && data.data) {
        console.log('[RemediationAgent] Received explanation from chat');
        console.log('[RemediationAgent] Has conceptMap?', !!data.data.conceptMap);
        console.log('[RemediationAgent] Has youtubeSearchQuery?', !!data.data.youtubeSearchQuery);
        setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), role: 'bot', type: 'explanation', data: data.data }]);
        // Update active topic if we got a new explanation
        if (data.data.topic) setActiveTopic(data.data.topic);
      } else {
        // Regular text response
        setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), role: 'bot', type: 'text', content: data.content }]);
      }
    } catch (error) {
      console.error('[RemediationAgent] Chat error:', error);
      setMessages(prev => [...prev, { id: Date.now().toString(), role: 'bot', type: 'text', content: "I'm having a bit of trouble connecting right now. Could you try asking that again?" }]);
    } finally { setIsTyping(false); }
  };

  const handleMcqSubmit = (messageId, optionIndex, correctOption, topic) => {
    setMcqAnswers(prev => ({ ...prev, [messageId]: optionIndex }));
    if (optionIndex === correctOption) updateGapProgress(topic, 'resolved');
  };

  const handleWatchVideo = (topic, youtubeQuery) => {
    const searchQuery = youtubeQuery || `${studentClass} CBSE ${topic} NCERT explained`;
    window.open(`https://www.youtube.com/results?search_query=${encodeURIComponent(searchQuery)}`, '_blank');
  };

  // ── Render helpers ──
  const renderText = (msg) => (
    <div style={{
      padding: '12px 16px', maxWidth: '85%', lineHeight: 1.6, fontSize: 14,
      borderRadius: msg.role === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
      background: msg.role === 'user' ? 'linear-gradient(135deg, #F59E0B, #D97706)' : T.cardBg,
      color: msg.role === 'user' ? 'white' : T.ink,
      border: msg.role === 'bot' ? `1px solid ${T.line}` : 'none',
      boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
      fontFamily: "'DM Sans', sans-serif",
    }}>{msg.content}</div>
  );

  const renderOptions = (msg) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxWidth: '85%' }}>
      {msg.content && (
        <div style={{ padding: '12px 16px', borderRadius: '18px 18px 18px 4px', background: T.cardBg, border: `1px solid ${T.line}`, fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: T.ink, marginBottom: 4 }}>{msg.content}</div>
      )}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {msg.options.map((opt, i) => (
          <button key={i} onClick={opt.action} style={{
            padding: '8px 16px', borderRadius: 99,
            background: T.cardBg, border: `1.5px solid ${T.gRing}`, color: T.green,
            fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: 13,
            cursor: 'pointer', transition: 'all 0.18s',
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
          }}
            onMouseEnter={e => { e.currentTarget.style.background = T.gLight; }}
            onMouseLeave={e => { e.currentTarget.style.background = T.cardBg; }}
          >{opt.label}</button>
        ))}
      </div>
    </div>
  );

  const renderExplanation = (msg) => {
    const d = msg.data;
    if (!d) return null;
    const isMcqSubmitted = mcqAnswers[msg.id] !== undefined;
    const userAnswer = mcqAnswers[msg.id];

    return (
      <div style={{ borderRadius: '18px 18px 18px 4px', background: T.cardBg, border: `1px solid ${T.line}`, boxShadow: cardShadow, maxWidth: '92%', overflow: 'hidden', animation: 'sp-fadein 0.4s ease' }}>
        <div style={{ height: 3, background: `linear-gradient(90deg, ${T.green}, #FCD34D, transparent)` }} />
        <div style={{ padding: '20px 22px' }}>
          <h3 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 800, fontSize: 16, color: T.green, borderBottom: `1px solid ${T.gRing}`, paddingBottom: 10, marginBottom: 18, marginTop: 0 }}>{d.topic}</h3>

          {d.hook && (
            <div style={{ marginBottom: 16, background: T.gLight, padding: '12px 14px', borderRadius: 12, border: `1px solid ${T.gRing}` }}>
              <p style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: 12, color: T.green, marginBottom: 4 }}>💡 {d.hook.title}</p>
              <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13.5, lineHeight: 1.65, color: T.ink, margin: 0 }}>{d.hook.explanation}</p>
            </div>
          )}

          {d.chapterExplanation?.overview && (
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, lineHeight: 1.75, color: T.ink, marginBottom: 16 }}>{d.chapterExplanation.overview}</p>
          )}

          {d.chapterExplanation?.keyConcepts?.length > 0 && (
            <div style={{ marginBottom: 18 }}>
              <p style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: 10, color: T.hint, textTransform: 'uppercase', letterSpacing: '0.7px', marginBottom: 10 }}>Key Concepts</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {d.chapterExplanation.keyConcepts.map((kc, i) => (
                  <div key={i} style={{ padding: '12px 14px', borderRadius: 12, background: T.zoneBg, border: `1px solid ${T.line}` }}>
                    <p style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: 13, color: T.gMid, marginBottom: 4 }}>{kc.heading}</p>
                    <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13.5, lineHeight: 1.65, color: T.ink, marginBottom: kc.example ? 8 : 0 }}>{kc.explanation}</p>
                    {kc.example && <div style={{ padding: '8px 10px', borderRadius: 8, background: T.cardBg, borderLeft: `3px solid ${T.gRing}`, fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontStyle: 'italic', color: T.sub }}>📌 {kc.example}</div>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {d.chapterExplanation?.importantTerms?.length > 0 && (
            <div style={{ marginBottom: 18, background: T.gLight, padding: '12px 14px', borderRadius: 12, border: `1px solid ${T.gRing}` }}>
              <p style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: 10, color: T.green, textTransform: 'uppercase', letterSpacing: '0.7px', marginBottom: 10 }}>Important Terms</p>
              <div style={{ display: 'grid', gap: 6 }}>
                {d.chapterExplanation.importantTerms.map((term, i) => (
                  <div key={i} style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13.5, lineHeight: 1.6, color: T.ink }}>
                    <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700 }}>{term.term}: </span>{term.definition}
                  </div>
                ))}
              </div>
            </div>
          )}

          {d.conceptMap && <MermaidDiagram chart={d.conceptMap} />}

          {d.commonMistakes?.length > 0 && (
            <div style={{ marginBottom: 18 }}>
              <p style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: 10, color: '#DC2626', textTransform: 'uppercase', letterSpacing: '0.7px', marginBottom: 10 }}>⚠️ Common Mistakes</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {d.commonMistakes.map((cm, i) => (
                  <div key={i} style={{ padding: '12px 14px', borderRadius: 12, background: '#FEF2F2', border: '1px solid #FECACA' }}>
                    <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, textDecoration: 'line-through', color: '#9CA3AF', marginBottom: 4 }}>✗ {cm.mistake}</p>
                    <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: T.green, fontWeight: 600, marginBottom: cm.example ? 4 : 0 }}>✓ {cm.correction}</p>
                    {cm.example && <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12.5, color: T.sub, fontStyle: 'italic', lineHeight: 1.5, margin: 0 }}>{cm.example}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {d.proTips?.length > 0 && (
            <div style={{ marginBottom: 18, padding: '12px 14px', borderRadius: 12, background: T.amberBg, border: `1px solid ${T.amberLine}` }}>
              <p style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: 10, color: T.amber, textTransform: 'uppercase', letterSpacing: '0.7px', marginBottom: 8 }}>⭐ Pro Tips</p>
              <ul style={{ paddingLeft: '1.1rem', margin: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
                {d.proTips.map((tip, i) => <li key={i} style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13.5, lineHeight: 1.6, color: T.amber }}>{tip}</li>)}
              </ul>
            </div>
          )}


          <div style={{ textAlign: 'center' }}>
            <button onClick={() => handleWatchVideo(d.topic, d.youtubeSearchQuery)} style={{ padding: '9px 18px', borderRadius: 99, background: 'transparent', border: `1px solid ${T.line}`, color: T.sub, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", fontWeight: 500, fontSize: 13, transition: 'all 0.18s' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = T.gRing; e.currentTarget.style.color = T.green; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = T.line; e.currentTarget.style.color = T.sub; }}
            >🎥 Search YouTube for this Topic</button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div style={{ height: 'calc(100vh - 180px)', display: 'flex', flexDirection: 'column', fontFamily: "'DM Sans', sans-serif", animation: 'sp-fadein 0.3s ease both' }}>
      {/* Header */}
      <div style={{ marginBottom: 16, flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
          <div style={{ width: 7, height: 7, borderRadius: '50%', background: T.green, boxShadow: `0 0 0 3px ${T.gRing}` }} />
          <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: 11, color: T.green, letterSpacing: '0.9px', textTransform: 'uppercase' }}>AI Coach</span>
        </div>
        <h1 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 800, fontSize: 'clamp(1.4rem, 2.5vw, 1.8rem)', color: T.ink, marginBottom: 4 }}>🤖 AI Improvement Coach</h1>
        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13.5, color: T.sub }}>Chat with me to fix your knowledge gaps</p>
      </div>

      {/* Chat window */}
      <div ref={scrollRef} style={{
        flex: 1, background: T.zoneBg, borderRadius: 16,
        border: `1px solid ${T.line}`, overflowY: 'auto',
        padding: '20px 18px', display: 'flex', flexDirection: 'column', gap: 16,
        boxShadow: '0 0 0 1px rgba(0,0,0,0.03), 0 2px 8px rgba(0,0,0,0.04)',
      }}>
        {/* Growth areas memory card */}
        {Object.keys(profile.weakTopics).length > 0 && messages.length <= 2 && (
          <div style={{ background: T.cardBg, padding: '16px 18px', borderRadius: 14, border: `1px solid ${T.line}`, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <div style={{ width: 28, height: 28, borderRadius: 8, background: T.gLight, border: `1px solid ${T.gRing}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>📈</div>
              <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: 13, color: T.ink }}>Your Personal Growth Areas</span>
            </div>
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: T.sub, marginBottom: 12 }}>I've remembered these topics from your previous tests. Which one should we master today?</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 8 }}>
              {Object.values(profile.weakTopics).map((t, i) => (
                <button key={i} onClick={() => handleTopicSelect(t.name, t.mistakeType, t.feedback)} style={{
                  padding: '10px 12px', borderRadius: 12, border: `1px solid ${T.line}`,
                  background: T.zoneBg, textAlign: 'left', cursor: 'pointer', transition: 'all 0.18s',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = T.gRing; e.currentTarget.style.background = T.gLight; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = T.line; e.currentTarget.style.background = T.zoneBg; }}
                >
                  <div>
                    <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: 13, color: T.ink }}>{t.name}</div>
                    <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: T.hint }}>{t.subject}</div>
                  </div>
                  <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: 10, padding: '2px 8px', borderRadius: 99, background: t.status === 'Resolved' ? T.gLight : '#EFF6FF', color: t.status === 'Resolved' ? T.green : '#1D4ED8', border: `1px solid ${t.status === 'Resolved' ? T.gRing : '#BFDBFE'}` }}>
                    {t.status}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map(msg => (
          <div key={msg.id} style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start', alignItems: 'flex-end', gap: 8 }}>
            {msg.role === 'bot' && (
              <div style={{ width: 30, height: 30, borderRadius: '50%', background: T.gLight, border: `1px solid ${T.gRing}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, flexShrink: 0 }}>🤖</div>
            )}
            {msg.type === 'text' && renderText(msg)}
            {msg.type === 'options' && renderOptions(msg)}
            {msg.type === 'explanation' && renderExplanation(msg)}
          </div>
        ))}

        {isTyping && (
          <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
            <div style={{ width: 30, height: 30, borderRadius: '50%', background: T.gLight, border: `1px solid ${T.gRing}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, flexShrink: 0 }}>🤖</div>
            <div style={{ padding: '12px 16px', borderRadius: '18px 18px 18px 4px', background: T.cardBg, border: `1px solid ${T.line}`, display: 'flex', gap: 4, alignItems: 'center' }}>
              {[0, 0.2, 0.4].map((delay, i) => (
                <div key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: T.gMid, animation: `sp-bounce 1.2s ease-in-out ${delay}s infinite` }} />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <form onSubmit={handleSendMessage} style={{
        marginTop: 14, display: 'flex', gap: 10, padding: '10px 12px',
        background: T.cardBg, borderRadius: 99, border: `1px solid ${T.line}`,
        boxShadow: '0 2px 12px rgba(0,0,0,0.06)', flexShrink: 0,
      }}>
        <input type="text" value={inputValue} onChange={e => setInputValue(e.target.value)}
          placeholder={activeTopic ? `Ask about ${activeTopic}…` : 'Ask your AI Coach a question…'}
          style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', padding: '4px 10px', fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: T.ink }}
        />
        <button type="submit" disabled={!inputValue.trim() || isTyping} style={{
          width: 38, height: 38, borderRadius: '50%', border: 'none',
          background: inputValue.trim() && !isTyping ? 'linear-gradient(135deg, #F59E0B, #D97706)' : T.line,
          color: 'white', cursor: inputValue.trim() && !isTyping ? 'pointer' : 'default',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'all 0.18s', fontSize: 16, flexShrink: 0,
          boxShadow: inputValue.trim() && !isTyping ? `0 3px 10px ${T.gGlow}` : 'none',
        }}>↑</button>
      </form>
    </div>
  );
}
