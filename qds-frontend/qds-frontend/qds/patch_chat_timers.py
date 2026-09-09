import re

with open('src/components/ChatPanel.jsx', 'r', encoding='utf-8') as f:
    text = f.read()

# Replace the broken useEffect with a robust useRef-based timer solution
broken_effect_regex = r"  // Wait for the server response.*?\}, \[hasStarted, verifyPhase, msg\.failure_type, msg\.locked, msg\.verification_failed\]\);"
fixed_effect = """  const timers = useRef([]);
  useEffect(() => {
    return () => timers.current.forEach(clearTimeout);
  }, []);

  // Wait for the server response (msg.failure_type, msg.locked updated) before animating
  useEffect(() => {
    if (hasStarted && verifyPhase === 0 && (msg.failure_type !== undefined || !msg.locked || msg.verification_failed)) {
       setVerifyPhase(1);
       timers.current.push(setTimeout(() => setVerifyPhase(2), 1500));
       
       if (msg.failure_type === 'stalled') {
          timers.current.push(setTimeout(() => setVerifyPhase(3), 3000));
       } else if (msg.failure_type === 'gradual') {
          timers.current.push(setTimeout(() => setVerifyPhase(3), 3000));
          timers.current.push(setTimeout(() => setVerifyPhase(4), 4500));
       } else {
          timers.current.push(setTimeout(() => setVerifyPhase(3), 3000));
          timers.current.push(setTimeout(() => setVerifyPhase(4), 4500));
          timers.current.push(setTimeout(() => setVerifyPhase(5), 6000));
       }
    }
  }, [hasStarted, verifyPhase, msg.failure_type, msg.locked, msg.verification_failed]);"""

text = re.sub(broken_effect_regex, fixed_effect, text, flags=re.DOTALL)

with open('src/components/ChatPanel.jsx', 'w', encoding='utf-8') as f:
    f.write(text)