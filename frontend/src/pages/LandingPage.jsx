import { Link } from "react-router-dom";
import { useEffect, useState, useRef } from "react";

function GlitchText({ text }) {
  return (
    <span data-text={text} style={{ textShadow: "0 0 10px #00ff9c" }}>
      {text}
    </span>
  );
}

function HackerCard({ children, style }) {
  return (
    <div
      style={{
        border: "1px solid #00ff9c",
        padding: "20px",
        background: "#020d05",
        boxShadow: "0 0 20px rgba(0,255,156,0.3)",
        ...style
      }}
    >
      {children}
    </div>
  );
}

const featureData = [
  { label: "SSL Security Check", icon: "🔒" },
  { label: "Security Headers Scan", icon: "🛡️" },
  { label: "Open Port Detection", icon: "🔍" },
  { label: "DNS Security Analysis", icon: "🌐" },
  { label: "Directory Exposure Scan", icon: "📁" },
  { label: "Phishing URL Detection", icon: "⚠️" }
];

export default function LandingPage() {

  const canvasRef = useRef(null);

  const [step,setStep] = useState(0);
  const [lines,setLines] = useState([]);

  const [demoRunning,setDemoRunning] = useState(false);
  const [demoResult,setDemoResult] = useState(null);

  const steps = [
    "Initializing scanner...",
    "Checking SSL certificate...",
    "Scanning open ports...",
    "Analyzing security headers...",
    "Searching vulnerabilities...",
    "XSS vulnerability detected",
    "Missing security headers detected",
    "Generating security score..."
  ];

  /* MATRIX BACKGROUND */

  useEffect(()=>{

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    const letters="01CYBERSHIELD";
    const fontSize=14;

    let drops=[];

    const resize=()=>{
      canvas.width=window.innerWidth;
      canvas.height=window.innerHeight;
      drops=[];
      for(let x=0;x<canvas.width/fontSize;x++) drops[x]=1;
    }

    resize();
    window.addEventListener("resize",resize);

    const draw=()=>{

      ctx.fillStyle="rgba(0,0,0,0.05)";
      ctx.fillRect(0,0,canvas.width,canvas.height);

      ctx.fillStyle="#00ff9c";
      ctx.font=fontSize+"px monospace";

      for(let i=0;i<drops.length;i++){

        const text=letters[Math.floor(Math.random()*letters.length)];

        ctx.fillText(text,i*fontSize,drops[i]*fontSize);

        if(drops[i]*fontSize>canvas.height && Math.random()>0.975)
          drops[i]=0;

        drops[i]++;

      }

    }

    const interval=setInterval(draw,35);

    return ()=>{
      clearInterval(interval);
      window.removeEventListener("resize",resize);
    }

  },[])

  /* TERMINAL ANIMATION */

  useEffect(()=>{

    const timer=setInterval(()=>{

      setStep(prev=>{

        const next=(prev+1)%steps.length;

        setLines(l=>{
          const updated=[...l,steps[prev]];
          return updated.slice(-6);
        })

        return next;

      })

    },2000)

    return ()=>clearInterval(timer)

  },[])

  /* DEMO SCAN */

  const runDemoScan=()=>{

    setDemoRunning(true)
    setDemoResult(null)

    setTimeout(()=>{

      setDemoRunning(false)

      setDemoResult({
        score:72,
        issues:[
          "Missing security headers",
          "Directory listing enabled",
          "Potential XSS vulnerability"
        ]
      })

    },4000)

  }

  return (

    <div style={{background:"#000",color:"#00ff9c",minHeight:"100vh",fontFamily:"monospace"}}>

      <canvas ref={canvasRef} style={{position:"fixed",inset:0,opacity:0.2,pointerEvents: "none"}} />

      {/* NAVBAR */}

      <nav style={{display:"flex",justifyContent:"space-between",padding:"20px 40px"}}>

        <h1 style={{fontSize:22}}>CYBERSHIELD</h1>

        <div>

          <Link to="/login" style={{marginRight:20}}>LOGIN</Link>

          <Link to="/register">REGISTER</Link>

        </div>

      </nav>

      {/* HERO */}

      <section style={{textAlign:"center",marginTop:100}}>

        <h1 style={{fontSize:60}}>
          <GlitchText text="CyberShield Scanner"/>
        </h1>

        <p style={{maxWidth:600,margin:"auto",marginBottom:40}}>
          Real-time cybersecurity scanner that detects vulnerabilities before hackers exploit them.
        </p>

        <div style={{display:"flex",justifyContent:"center",gap:20}}>

          <Link to="/register" style={{border:"1px solid #00ff9c",padding:"12px 30px"}}>
            START SCAN
          </Link>

          <button
            onClick={runDemoScan}
            style={{
              border:"1px solid #00ff9c",
              padding:"12px 30px",
              background:"transparent",
              color:"#00ff9c",
              cursor:"pointer"
            }}
          >
            TRY DEMO SCAN
          </button>

        </div>

      </section>

      {/* TERMINAL */}

      <section style={{marginTop:80,display:"flex",justifyContent:"center"}}>

        <HackerCard style={{width:600}}>

          {lines.map((line,i)=>(
            <div key={i}>{line}</div>
          ))}

          <div style={{marginTop:10}}>
            root@cybershield:~# {steps[step]}
          </div>

        </HackerCard>

      </section>

      {/* DEMO RESULT */}

      {demoRunning && (

        <div style={{textAlign:"center",marginTop:40}}>
          Running demo scan...
        </div>

      )}

      {demoResult && (

        <div style={{textAlign:"center",marginTop:40}}>

          <h2>Security Score: {demoResult.score}</h2>

          <ul>
            {demoResult.issues.map((issue,i)=>(
              <li key={i}>{issue}</li>
            ))}
          </ul>

        </div>

      )}

      {/* FEATURES */}

      <section style={{marginTop:120,padding:"0 40px"}}>

        <h2 style={{textAlign:"center",marginBottom:40}}>
          Security Modules
        </h2>

        <div style={{
          display:"grid",
          gridTemplateColumns:"repeat(auto-fit,minmax(250px,1fr))",
          gap:20,
          maxWidth:1000,
          margin:"auto"
        }}>

          {featureData.map(f=>(
            <HackerCard key={f.label}>
              <div style={{fontSize:22}}>{f.icon}</div>
              <div>{f.label}</div>
            </HackerCard>
          ))}

        </div>

      </section>

      {/* CTA */}

      <section style={{textAlign:"center",marginTop:120,paddingBottom:100}}>

        <button
          onClick={runDemoScan}
          style={{border:"1px solid #00ff9c",padding:"14px 40px",background:"transparent",color:"#00ff9c"}}
        >
          TRY DEMO SCAN
        </button>

      </section>

    </div>

  )

}