/**
 * ONE-TIME SCAFFOLD SCRIPT — DO NOT RE-RUN
 *
 * This script was used once to generate the initial version of:
 *   Security system Moniters_3_persons_activities/aegis-dashboard/src/components/SplitTunnelHero.tsx
 *
 * The generated file has since been edited manually and diverged from this template.
 * Re-running this script will OVERWRITE those manual edits.
 *
 * This file can be safely ignored during normal demo operation.
 */

const fs = require("fs");
const path = "Security system Moniters_3_persons_activities/aegis-dashboard/src/components/SplitTunnelHero.tsx";

const code = `"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface Props {
  onLegit: () => Promise<void>;
  onAttack: () => Promise<void>;
  loadingLegit: boolean;
  loadingAttack: boolean;
}

// ── Layout ────────────────────────────────────────────────────────────────────
const W = 960, H = 360;
const SX = 72, SPX = 230, VX = 700, RX = 900;
const MY = H / 2, C1Y = 100, C2Y = 260, CMX = 465;

// ── Bezier helpers ────────────────────────────────────────────────────────────
function bez(p0:number,p1:number,p2:number,p3:number,t:number){
  const u=1-t; return u*u*u*p0+3*u*u*t*p1+3*u*t*t*p2+t*t*t*p3;
}
function ptC1(t:number):[number,number]{
  if(t<=0.5){const s=t*2;return[bez(SPX,SPX+70,CMX-70,CMX,s),bez(MY,MY,C1Y,C1Y,s)];}
  const s=(t-0.5)*2;return[bez(CMX,CMX+70,VX-70,VX,s),bez(C1Y,C1Y,MY,MY,s)];
}
function ptC2(t:number):[number,number]{
  if(t<=0.5){const s=t*2;return[bez(SPX,SPX+70,CMX-70,CMX,s),bez(MY,MY,C2Y,C2Y,s)];}
  const s=(t-0.5)*2;return[bez(CMX,CMX+70,VX-70,VX,s),bez(C2Y,C2Y,MY,MY,s)];
}
function ptSV(t:number):[number,number]{return[SX+(SPX-SX)*t,MY];}
function ptVR(t:number):[number,number]{return[VX+(RX-VX)*t,MY];}

// ── Tunnel path ───────────────────────────────────────────────────────────────
function Tunnel({d,color,lit,dashed}:{d:string;color:string;lit:boolean;dashed?:boolean}){
  return(<>
    <path d={d} fill="none" stroke="#0a0f1a" strokeWidth={32}/>
    <path d={d} fill="none" stroke={lit?color+"35":"#141e2e"} strokeWidth={lit?4:2}
      strokeDasharray={dashed?"10 6":undefined} style={{transition:"stroke 0.4s"}}/>
    {lit&&<path d={d} fill="none" stroke={color} strokeWidth="2" opacity="0.55"
      style={{filter:"drop-shadow(0 0 6px "+color+")"}}/>}
  </>);
}

// ── Node ──────────────────────────────────────────────────────────────────────
function Node({cx,cy,r=30,color,lit,pulse,emoji,label,sub}:{
  cx:number;cy:number;r?:number;color:string;lit:boolean;pulse?:boolean;
  emoji:string;label:string;sub?:string;
}){
  return(<g>
    {pulse&&lit&&<circle cx={cx} cy={cy} r={r+14} fill="none" stroke={color} strokeWidth="1.5" opacity="0.25">
      <animate attributeName="r" values={(r+10)+";"+(r+22)+";"+(r+10)} dur="1.4s" repeatCount="indefinite"/>
      <animate attributeName="opacity" values="0.25;0.04;0.25" dur="1.4s" repeatCount="indefinite"/>
    </circle>}
    <circle cx={cx} cy={cy} r={r} fill={lit?color+"1e":"rgba(255,255,255,0.03)"}
      stroke={lit?color:color+"30"} strokeWidth={lit?2.5:1} style={{transition:"all 0.35s"}}/>
    <text x={cx} y={cy+1} textAnchor="middle" dominantBaseline="middle" fontSize="20">{emoji}</text>
    <text x={cx} y={cy+r+16} textAnchor="middle" fill={lit?color:"#3d5068"}
      fontSize="11" fontFamily="monospace" fontWeight="700">{label}</text>
    {sub&&<text x={cx} y={cy+r+29} textAnchor="middle" fill="#2a3a4e" fontSize="9" fontFamily="monospace">{sub}</text>}
  </g>);
}

// ── Vault ─────────────────────────────────────────────────────────────────────
function Vault({step,blink}:{step:number;blink:number}){
  const validating=step===4, approved=step===5, blocked=step===6;
  const active=step>=4;
  const color=approved?"#10b981":blocked?"#ef4444":validating?"#f59e0b":"#6366f1";
  const on=blink%2===0;
  return(<g>
    {active&&<>
      <circle cx={VX} cy={MY} r={50} fill="none" stroke={color} strokeWidth="1.5"
        opacity={on?0.35:0.08} style={{transition:"opacity 0.18s"}}/>
      <circle cx={VX} cy={MY} r={62} fill="none" stroke={color} strokeWidth="1"
        opacity={on?0.18:0.03} style={{transition:"opacity 0.18s"}}/>
    </>}
    <circle cx={VX} cy={MY} r={38} fill={active?color+"18":"rgba(255,255,255,0.02)"}
      stroke={active?color:"#2d3f52"} strokeWidth={active?2.5:1} style={{transition:"all 0.3s"}}/>
    <text x={VX} y={MY-4} textAnchor="middle" dominantBaseline="middle" fontSize="22">
      {approved?"🔓":blocked?"🔒":"🔐"}
    </text>
    {validating&&<g>
      <rect x={VX-30} y={MY+12} width={26} height={7} rx={3.5}
        fill={on?"#3b82f6":"#3b82f640"} style={{transition:"fill 0.18s"}}/>
      <rect x={VX+4} y={MY+12} width={26} height={7} rx={3.5}
        fill={on?"#10b981":"#10b98140"} style={{transition:"fill 0.18s"}}/>
      <text x={VX} y={MY+16} textAnchor="middle" dominantBaseline="middle"
        fill={on?"#f59e0b":"#f59e0b50"} fontSize="10" fontWeight="bold"
        style={{transition:"fill 0.18s"}}>{"≟"}</text>
    </g>}
    {approved&&<text x={VX} y={MY+16} textAnchor="middle" fill="#10b981"
      fontSize="9" fontFamily="monospace" fontWeight="bold">SHA-256 ✓</text>}
    {blocked&&<text x={VX} y={MY+16} textAnchor="middle" fill="#ef4444"
      fontSize="9" fontFamily="monospace" fontWeight="bold">NO S_B ✗</text>}
    <text x={VX} y={MY+56} textAnchor="middle" fill={active?color:"#3d5068"}
      fontSize="11" fontFamily="monospace" fontWeight="700">AEGIS VAULT</text>
    <text x={VX} y={MY+69} textAnchor="middle" fill="#2a3a4e" fontSize="9" fontFamily="monospace">
      {validating?"VALIDATING...":approved?"VERIFIED ✓":blocked?"REJECTED ✗":"Sync Engine"}
    </text>
  </g>);
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function SplitTunnelHero({onLegit,onAttack,loadingLegit,loadingAttack}:Props){
  const [step,setStep]=useState(0);
  const [isAttack,setIsAttack]=useState(false);
  // particle positions 0..1
  const [svP,setSvP]=useState(0);
  const [c1P,setC1P]=useState(0);
  const [c2P,setC2P]=useState(0);
  const [vrP,setVrP]=useState(0);
  const [blink,setBlink]=useState(0);
  const rafRef=useRef<number|null>(null);
  const blinkRef=useRef<ReturnType<typeof setInterval>|null>(null);
  const resetRef=useRef<ReturnType<typeof setTimeout>|null>(null);

  function clearAll(){
    if(rafRef.current)cancelAnimationFrame(rafRef.current);
    if(blinkRef.current)clearInterval(blinkRef.current);
    if(resetRef.current)clearTimeout(resetRef.current);
  }

  function startBlink(){
    if(blinkRef.current)clearInterval(blinkRef.current);
    blinkRef.current=setInterval(()=>setBlink(b=>b+1),180);
  }
  function stopBlink(){
    if(blinkRef.current){clearInterval(blinkRef.current);blinkRef.current=null;}
  }

  // Animate a value from 0->1 over duration ms, calling setter each frame
  function animateProg(setter:(v:number)=>void, duration:number, onDone?:()=>void){
    const start=performance.now();
    function frame(now:number){
      const p=Math.min((now-start)/duration,1);
      setter(p);
      if(p<1){rafRef.current=requestAnimationFrame(frame);}
      else{onDone&&onDone();}
    }
    rafRef.current=requestAnimationFrame(frame);
  }

  function runLegit(){
    clearAll();
    setIsAttack(false);
    setSvP(0);setC1P(0);setC2P(0);setVrP(0);setBlink(0);
    setStep(1);
    // Step 1: sender->splitter (400ms)
    animateProg(setSvP,400,()=>{
      setStep(2);
      setSvP(1);
      // Step 2: both channels travel simultaneously (1100ms)
      setStep(3);
      const startT=performance.now();
      function bothFrame(now:number){
        const p=Math.min((now-startT)/1100,1);
        setC1P(p);setC2P(p);
        if(p<1){rafRef.current=requestAnimationFrame(bothFrame);}
        else{
          setC1P(1);setC2P(1);
          // Step 3: validating (1600ms with blink)
          setStep(4);
          startBlink();
          resetRef.current=setTimeout(()=>{
            stopBlink();
            setStep(5); // approved
            // Step 4: vault->receiver (800ms)
            setVrP(0);
            animateProg(setVrP,800,()=>{
              setVrP(1);
              resetRef.current=setTimeout(()=>{
                setStep(0);setSvP(0);setC1P(0);setC2P(0);setVrP(0);
              },4000);
            });
          },1600);
        }
      }
      rafRef.current=requestAnimationFrame(bothFrame);
    });
  }

  function runAttack(){
    clearAll();
    setIsAttack(true);
    setSvP(0);setC1P(0);setC2P(0);setVrP(0);setBlink(0);
    setStep(1);
    animateProg(setSvP,400,()=>{
      setSvP(1);setStep(3);
      // Only CH1 travels
      animateProg(setC1P,1100,()=>{
        setC1P(1);
        setStep(4);startBlink();
        resetRef.current=setTimeout(()=>{
          stopBlink();
          setStep(6); // blocked
          resetRef.current=setTimeout(()=>{
            setStep(0);setSvP(0);setC1P(0);setC2P(0);setVrP(0);setIsAttack(false);
          },4000);
        },1600);
      });
    });
  }

  // Listen for socket-driven events too
  useEffect(()=>{
    const onStart=()=>{ /* handled by button */ };
    const onApproved=()=>{};
    const onBlocked=()=>{};
    window.addEventListener("aegis_animate_start",onStart);
    window.addEventListener("aegis_approved",onApproved);
    window.addEventListener("aegis_blocked",onBlocked);
    return()=>{
      clearAll();
      window.removeEventListener("aegis_animate_start",onStart);
      window.removeEventListener("aegis_approved",onApproved);
      window.removeEventListener("aegis_blocked",onBlocked);
    };
  },[]);

  const handleLegit=useCallback(async()=>{
    runLegit();
    await onLegit();
  },[onLegit]);

  const handleAttack=useCallback(async()=>{
    runAttack();
    await onAttack();
  },[onAttack]);

  // Derived
  const active=step>0;
  const approved=step===5;
  const blocked=step===6;
  const validating=step===4;
  const traveling=step===3||step===4||step===5||step===6;
  const splitting=step>=2;

  // Particle positions
  const [svX,svY]=svP>0?ptSV(Math.min(svP,1)):[SX,MY];
  const [c1X,c1Y]=c1P>0?ptC1(Math.min(c1P,0.999)):[SPX,MY];
  const [c2X,c2Y]=c2P>0?ptC2(Math.min(c2P,0.999)):[SPX,MY];
  const [vrX,vrY]=vrP>0?ptVR(Math.min(vrP,0.999)):[VX,MY];

  const statusMsg=
    step===1?"Payment signal detected. AEGIS intercepting...":
    step===2?"⚡ Splitting signal into two separate channels...":
    step===3?"Fragments traveling — blue through public HTTP, green through hidden WebRTC tunnel...":
    step===4?"🔐 Both signals arriving at vault. Running SHA-256 match within 50ms window...":
    step===5?"✅ Perfect match! Both channels verified. Payment authorized — transferring to receiver.":
    step===6?"❌ Channel 2 (WebRTC) missing. Bot detected. Payment blocked — returning to sender.":
    "";

  return(
    <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] backdrop-blur-xl overflow-hidden">

      {/* Header */}
      <div className="px-6 pt-5 pb-3 flex items-center justify-between border-b border-white/[0.05]">
        <div className="flex items-center gap-3">
          <motion.div animate={{opacity:active?[1,0.3,1]:0.35}}
            transition={{duration:1,repeat:active?Infinity:0}}
            className="w-2 h-2 rounded-full bg-amber-400"/>
          <span className="text-sm font-bold font-mono text-white/80 tracking-widest uppercase">
            Split-Tunnel Security Simulation
          </span>
        </div>
        <AnimatePresence mode="wait">
          {approved&&<motion.span key="ok" initial={{opacity:0,scale:0.8}} animate={{opacity:1,scale:1}} exit={{opacity:0}}
            className="text-[11px] font-mono font-bold px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
            ✓ BOTH CHANNELS MATCHED — PAYMENT CLEARED
          </motion.span>}
          {blocked&&<motion.span key="no" initial={{opacity:0,scale:0.8}} animate={{opacity:1,scale:1}} exit={{opacity:0}}
            className="text-[11px] font-mono font-bold px-3 py-1 rounded-full bg-red-500/15 text-red-400 border border-red-500/30">
            ✗ CHANNEL 2 MISSING — ATTACK BLOCKED
          </motion.span>}
          {!approved&&!blocked&&validating&&<motion.span key="val" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
            className="text-[11px] font-mono text-amber-400/80">
            🔐 Validating at vault...
          </motion.span>}
        </AnimatePresence>
      </div>

      {/* SVG Canvas */}
      <div className="px-4 py-4" style={{background:"#040810"}}>
        <svg viewBox={"0 0 "+W+" "+H} width="100%" style={{maxHeight:360,overflow:"visible"}}>

          {/* Tunnel backgrounds */}
          <path d={D_C1} fill="none" stroke="#060c18" strokeWidth={34}/>
          <path d={D_C2} fill="none" stroke="#060c18" strokeWidth={34}/>

          {/* Tunnel walls */}
          <Tunnel d={D_SV} color="#06b6d4" lit={active}/>
          <Tunnel d={D_C1} color="#3b82f6" lit={splitting}/>
          <Tunnel d={D_C2} color="#10b981" lit={splitting&&!isAttack} dashed={isAttack&&splitting}/>
          <Tunnel d={D_VR} color="#a855f7" lit={approved}/>

          {/* Channel labels */}
          <rect x={CMX-76} y={C1Y-24} width={152} height={20} rx={10}
            fill={splitting?"#3b82f615":"#0a1020"} stroke={splitting?"#3b82f640":"#141e2e"} strokeWidth="1"/>
          <text x={CMX} y={C1Y-14} textAnchor="middle" fill={splitting?"#3b82f6":"#2a3a4e"}
            fontSize="9" fontFamily="monospace" fontWeight="700">CHANNEL 1 — PUBLIC HTTP TUNNEL</text>

          <rect x={CMX-84} y={C2Y+6} width={168} height={20} rx={10}
            fill={splitting&&!isAttack?"#10b98115":isAttack?"#ef444412":"#0a1020"}
            stroke={splitting&&!isAttack?"#10b98140":isAttack?"#ef444435":"#141e2e"} strokeWidth="1"/>
          <text x={CMX} y={C2Y+16} textAnchor="middle"
            fill={splitting&&!isAttack?"#10b981":isAttack?"#ef4444":"#2a3a4e"}
            fontSize="9" fontFamily="monospace" fontWeight="700">
            {isAttack?"CHANNEL 2 — HIDDEN WebRTC  ✗ MISSING":"CHANNEL 2 — HIDDEN WebRTC TUNNEL"}
          </text>

          {/* ── Particles ── */}
          {/* Sender→Splitter (cyan) */}
          {svP>0&&svP<1&&<circle cx={svX} cy={svY} r={8} fill="#06b6d4"
            style={{filter:"drop-shadow(0 0 10px #06b6d4)"}}/>}

          {/* CH1 particle (blue) */}
          {c1P>0&&c1P<1&&<circle cx={c1X} cy={c1Y} r={8} fill="#3b82f6"
            style={{filter:"drop-shadow(0 0 12px #3b82f6)"}}/>}

          {/* CH2 particle (green) — legit only */}
          {!isAttack&&c2P>0&&c2P<1&&<circle cx={c2X} cy={c2Y} r={8} fill="#10b981"
            style={{filter:"drop-shadow(0 0 12px #10b981)"}}/>}

          {/* Vault→Receiver particle (purple) */}
          {approved&&vrP>0&&vrP<1&&<circle cx={vrX} cy={vrY} r={9} fill="#a855f7"
            style={{filter:"drop-shadow(0 0 14px #a855f7)"}}/>}

          {/* Receiver blink when vrP reaches 1 */}
          {approved&&vrP>=0.98&&<circle cx={RX} cy={MY} r={36} fill="none" stroke="#a855f7" strokeWidth="2"
            opacity={blink%2===0?0.7:0.2} style={{transition:"opacity 0.18s"}}/>}

          {/* ── Nodes ── */}
          <Node cx={SX} cy={MY} color="#06b6d4" lit={active} pulse emoji="👤" label="SENDER" sub="Gong User"/>

          {/* Splitter node */}
          <g>
            {splitting&&<circle cx={SPX} cy={MY} r={44} fill="none" stroke="#f59e0b" strokeWidth="1.5" opacity="0.2">
              <animate attributeName="r" values="36;48;36" dur="1.2s" repeatCount="indefinite"/>
              <animate attributeName="opacity" values="0.2;0.04;0.2" dur="1.2s" repeatCount="indefinite"/>
            </circle>}
            <circle cx={SPX} cy={MY} r={30} fill={splitting?"#f59e0b18":"rgba(255,255,255,0.03)"}
              stroke={splitting?"#f59e0b":"#f59e0b30"} strokeWidth={splitting?2.5:1} style={{transition:"all 0.4s"}}/>
            <text x={SPX} y={MY-5} textAnchor="middle" dominantBaseline="middle" fontSize="18">⚡</text>
            <text x={SPX} y={MY+9} textAnchor="middle" fill={splitting?"#f59e0b":"#3d5068"}
              fontSize="8" fontFamily="monospace" fontWeight="700">SPLIT</text>
            <text x={SPX} y={MY+44} textAnchor="middle" fill={splitting?"#f59e0b":"#3d5068"}
              fontSize="11" fontFamily="monospace" fontWeight="700">SPLITTER</text>
            <text x={SPX} y={MY+57} textAnchor="middle" fill="#2a3a4e" fontSize="9" fontFamily="monospace">Dual-Path</text>
          </g>

          {/* Vault */}
          <Vault step={step} blink={blink}/>

          {/* Receiver */}
          <Node cx={RX} cy={MY} r={26} color="#a855f7" lit={approved} pulse
            emoji="🏦" label="RECEIVER" sub={approved?"Payment Received!":"Awaiting..."}/>

          {/* Blocked: return arrow */}
          {blocked&&<g>
            <path d={"M "+(VX-45)+" "+MY+" Q "+CMX+" "+(MY+70)+" "+(SPX+35)+" "+MY}
              fill="none" stroke="#ef4444" strokeWidth="2.5" strokeDasharray="8 5" opacity="0.7">
              <animate attributeName="stroke-dashoffset" values="0;-26" dur="0.5s" repeatCount="indefinite"/>
            </path>
            <text x={(VX+SPX)/2} y={MY+82} textAnchor="middle"
              fill="#ef4444" fontSize="11" fontFamily="monospace" fontWeight="700">↩ RETURNED TO SENDER</text>
          </g>}

          {/* Idle hint */}
          {step===0&&<text x={W/2} y={MY+4} textAnchor="middle" dominantBaseline="middle"
            fill="#1e2d3d" fontSize="13" fontFamily="monospace">
            ↓  Click a button below to start the simulation  ↓
          </text>}
        </svg>
      </div>

      {/* Status strip */}
      <div className="px-6 pb-3">
        <AnimatePresence mode="wait">
          {active&&<motion.div key={step} initial={{opacity:0,y:4}} animate={{opacity:1,y:0}} exit={{opacity:0}}
            className={"rounded-xl px-4 py-2.5 border text-[11px] font-mono flex items-center gap-3 "+(
              approved?"border-emerald-500/20 bg-emerald-900/10 text-emerald-400":
              blocked?"border-red-500/20 bg-red-900/10 text-red-400":
              validating?"border-amber-500/20 bg-amber-900/10 text-amber-400":
              "border-white/[0.05] bg-white/[0.02] text-slate-400")}>
            <span className="text-base shrink-0">{approved?"✅":blocked?"❌":validating?"🔐":"⚡"}</span>
            <span>{statusMsg}</span>
          </motion.div>}
          {!active&&<motion.div key="idle" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
            className="rounded-xl px-4 py-2.5 border border-white/[0.04] bg-white/[0.01] text-[11px] font-mono text-slate-600 text-center">
            Use the buttons below to simulate a legitimate payment or a CSRF attack
          </motion.div>}
        </AnimatePresence>
      </div>

      {/* Buttons */}
      <div className="px-6 pb-6 grid grid-cols-1 sm:grid-cols-2 gap-3 border-t border-white/[0.05] pt-4">
        <motion.button onClick={handleLegit} disabled={loadingLegit||loadingAttack}
          whileHover={{scale:1.02,y:-2}} whileTap={{scale:0.98}}
          className="relative rounded-xl p-5 text-left border cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed overflow-hidden group"
          style={{background:"#06b6d40d",borderColor:"#06b6d430"}}>
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl"
            style={{background:"radial-gradient(ellipse at 50% 0%,#06b6d415 0%,transparent 70%)"}}/>
          <div className="relative flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center shrink-0">
              {loadingLegit?<div className="w-4 h-4 border-2 border-t-transparent border-cyan-400 rounded-full animate-spin"/>:<span className="text-lg">✅</span>}
            </div>
            <div>
              <p className="text-sm font-bold font-mono text-cyan-400 mb-1">Legitimate Payment</p>
              <p className="text-[11px] text-white/40 leading-relaxed">
                Sends <span className="text-blue-400 font-mono">Part 1 (HTTP)</span> + <span className="text-emerald-400 font-mono">Part 2 (WebRTC)</span>.
                Both channels arrive → vault validates → payment reaches receiver.
              </p>
            </div>
          </div>
        </motion.button>

        <motion.button onClick={handleAttack} disabled={loadingLegit||loadingAttack}
          whileHover={{scale:1.02,y:-2}} whileTap={{scale:0.98}}
          className="relative rounded-xl p-5 text-left border cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed overflow-hidden group"
          style={{background:"#ef44440d",borderColor:"#ef444430"}}>
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl"
            style={{background:"radial-gradient(ellipse at 50% 0%,#ef444415 0%,transparent 70%)"}}/>
          <div className="relative flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-500/15 border border-red-500/30 flex items-center justify-center shrink-0">
              {loadingAttack?<div className="w-4 h-4 border-2 border-t-transparent border-red-400 rounded-full animate-spin"/>:<span className="text-lg">🚨</span>}
            </div>
            <div>
              <p className="text-sm font-bold font-mono text-red-400 mb-1">Simulate CSRF Attack</p>
              <p className="text-[11px] text-white/40 leading-relaxed">
                Sends only <span className="text-blue-400 font-mono">Part 1 (HTTP)</span>.
                <span className="text-red-400 font-mono"> Part 2 missing</span> — bot cannot generate WebRTC tunnel.
                Vault rejects, funds returned to sender.
              </p>
            </div>
          </div>
        </motion.button>
      </div>
    </div>
  );
}
`;

fs.writeFileSync(path, code, "utf8");
console.log("wrote", code.length, "chars");
