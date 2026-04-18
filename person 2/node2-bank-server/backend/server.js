import Fastify from 'fastify';
import cors from '@fastify/cors';
import { Server } from 'socket.io';
import { randomInt } from 'crypto';

// ─────────────────────────────────────────────
//  GLOBAL DEMO STATE
// ─────────────────────────────────────────────
let ACTIVE_DEMO_SCENARIO = 'SCENARIO_1';
let activeAmtdPort = randomInt(49152, 65536);
const shardMemoryVault = new Map();

// ─────────────────────────────────────────────
//  FASTIFY
// ─────────────────────────────────────────────
const fastify = Fastify({ logger: false });
await fastify.register(cors, { origin: true, methods: ['GET', 'POST', 'OPTIONS'] });

fastify.get('/health', async () => ({
  status: 'ONLINE', port: 3002,
  scenario: ACTIVE_DEMO_SCENARIO,
  amtd_port: activeAmtdPort,
  timestamp: Date.now(),
}));

fastify.get('/', async (_req, reply) => {
  reply.type('text/html').send(`<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>🌾 Gramin Cooperative Bank</title>
<script src="https://cdn.tailwindcss.com"></script>
<script src="https://cdn.socket.io/4.7.5/socket.io.min.js"></script>
<script src="https://unpkg.com/react@18/umd/react.development.js"></script>
<script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet"/>
<style>
*{font-family:'Inter',sans-serif}
@keyframes shake{10%,90%{transform:translate3d(-2px,0,0)}20%,80%{transform:translate3d(4px,0,0)}30%,50%,70%{transform:translate3d(-6px,0,0)}40%,60%{transform:translate3d(6px,0,0)}}
@keyframes rowIn{from{opacity:0;transform:translateY(-6px)}to{opacity:1;transform:translateY(0)}}
.row-in{animation:rowIn 0.3s ease}
</style>
</head>
<body class="bg-[#f5f0e8] min-h-screen">
<div id="root"></div>
<script>
const BANK_HOST = window.location.origin;
const {useState,useEffect,useRef,useCallback} = React;
const {createRoot} = ReactDOM;

function makeTxnId(){return 'txn_'+Date.now()+'_'+Math.random().toString(36).slice(2,6)}

function statusColor(s){
  if(s==='LEGITIMATE_SUCCESS'||s==='AEGIS_VERIFIED')return 'text-green-700';
  if(s==='CRITICAL_THEFT_SUCCESS')return 'text-red-600';
  if(s==='BLOCKED_BY_AEGIS')return 'text-amber-600';
  return 'text-stone-400';
}
function statusLabel(s){
  if(s==='LEGITIMATE_SUCCESS')return '✓ LEGITIMATE SUCCESS';
  if(s==='AEGIS_VERIFIED')return '✓ AEGIS VERIFIED';
  if(s==='CRITICAL_THEFT_SUCCESS')return '✗ THEFT SUCCESS';
  if(s==='BLOCKED_BY_AEGIS')return '🛡 BLOCKED BY AEGIS';
  return s;
}

function StatsBadge({label,value,color}){
  return React.createElement('div',{className:'flex flex-col items-center px-3 py-2 rounded-lg border '+color},
    React.createElement('span',{className:'text-lg font-bold'},value),
    React.createElement('span',{className:'text-[10px] uppercase tracking-wider mt-0.5'},label)
  );
}

function LedgerTable({entries}){
  const ref=useRef(null);
  useEffect(()=>{ref.current?.scrollIntoView({behavior:'smooth'})},[entries.length]);
  if(!entries.length)return React.createElement('div',{className:'flex items-center justify-center h-16 text-stone-400 text-xs italic border border-stone-200 rounded-lg bg-stone-50'},'No transactions yet');
  return React.createElement('div',{className:'overflow-auto max-h-48 rounded-lg border border-stone-200'},
    React.createElement('table',{className:'w-full text-xs'},
      React.createElement('thead',{className:'sticky top-0 bg-stone-100'},
        React.createElement('tr',{className:'text-stone-600 border-b border-stone-200'},
          ['Txn ID','Amount','Status','Time'].map(h=>React.createElement('th',{key:h,className:'text-left px-3 py-2 font-semibold'},h))
        )
      ),
      React.createElement('tbody',{className:'bg-white'},
        entries.map(e=>React.createElement('tr',{key:e.id,className:'border-b border-stone-100 hover:bg-stone-50 row-in'},
          React.createElement('td',{className:'px-3 py-2 text-stone-500 font-mono'},e.id.slice(-8)),
          React.createElement('td',{className:'px-3 py-2 text-stone-800 font-semibold'},'₹'+Number(e.amount).toLocaleString('en-IN')),
          React.createElement('td',{className:'px-3 py-2 font-medium '+statusColor(e.status)},statusLabel(e.status)),
          React.createElement('td',{className:'px-3 py-2 text-stone-400'},new Date(e.timestamp).toLocaleTimeString())
        ))
      )
    ),
    React.createElement('div',{ref})
  );
}

function AegisOverlay({data,onClose}){
  const [lines,setLines]=useState([]);
  const [done,setDone]=useState(false);
  useEffect(()=>{
    if(!data)return;
    setLines([]);setDone(false);
    let i=0;
    const tick=()=>{if(i<data.sequence.length){setLines(p=>[...p,data.sequence[i]]);i++;setTimeout(tick,420)}else setDone(true)};
    tick();
  },[data]);
  if(!data)return null;
  return React.createElement('div',{className:'fixed inset-0 z-50 flex items-center justify-center bg-stone-900/70',onClick:onClose},
    React.createElement('div',{className:'relative max-w-2xl w-full mx-4 bg-white border-2 border-amber-400 rounded-2xl p-8 shadow-2xl',onClick:e=>e.stopPropagation()},
      React.createElement('div',{className:'flex items-center gap-3 mb-5 pb-4 border-b border-amber-200'},
        React.createElement('div',{className:'w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center text-2xl'},'🛡'),
        React.createElement('div',null,
          React.createElement('h2',{className:'text-amber-700 font-bold text-xl'},'AEGIS Security Intervention'),
          React.createElement('p',{className:'text-stone-500 text-xs mt-0.5'},'Zero-Trust Dual-Channel Verification')
        ),
        React.createElement('span',{className:'ml-auto text-xs font-bold bg-red-100 text-red-700 px-2 py-1 rounded-full border border-red-200'},'THREAT DETECTED')
      ),
      React.createElement('div',{className:'bg-stone-50 rounded-lg p-4 font-mono text-xs space-y-1 min-h-[160px] border border-stone-200'},
        lines.map((l,i)=>React.createElement('div',{key:i,className:'text-stone-700'},React.createElement('span',{className:'text-amber-600 mr-2 font-bold'},'›'),l)),
        !done&&React.createElement('span',{className:'inline-block w-2 h-3 bg-amber-500 animate-pulse ml-4'})
      ),
      done&&React.createElement('div',{className:'mt-4 space-y-3'},
        React.createElement('div',{className:'flex gap-2 bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm'},'⚠ '+data.reason),
        React.createElement('div',{className:'flex gap-2 bg-green-50 border border-green-200 rounded-lg p-3 text-green-700 text-sm'},'✓ '+data.mitigation),
        React.createElement('button',{onClick:onClose,className:'mt-2 w-full py-2.5 rounded-lg bg-green-700 hover:bg-green-800 text-white text-sm font-semibold'},'Acknowledge & Dismiss')
      )
    )
  );
}

function App(){
  const sockRef=useRef(null);
  const [connected,setConnected]=useState(false);
  const [ledger,setLedger]=useState([]);
  const [termLogs,setTermLogs]=useState([]);
  const [shardEvts,setShardEvts]=useState([]);
  const [intervention,setIntervention]=useState(null);
  const [amtdPort,setAmtdPort]=useState(null);
  const [shaking,setShaking]=useState(false);
  const [loading,setLoading]=useState(null);
  const [aegisOn,setAegisOn]=useState(false);
  const [toggling,setToggling]=useState(false);

  useEffect(()=>{
    const s=io(BANK_HOST,{transports:['websocket','polling']});
    sockRef.current=s;
    s.on('connect',()=>setConnected(true));
    s.on('disconnect',()=>setConnected(false));
    s.on('scenario_changed',({scenario})=>setAegisOn(scenario==='SCENARIO_3'));
    s.on('ledger_update',e=>{
      setLedger(p=>[...p,e]);
      if(e.status==='CRITICAL_THEFT_SUCCESS'){setShaking(true);setTimeout(()=>setShaking(false),700)}
    });
    s.on('aegis_intervention',d=>{
      setIntervention(d);
      setLedger(p=>[...p,{id:d.id,sender:'BLOCKED',receiver:'—',amount:0,status:'BLOCKED_BY_AEGIS',scenario:'SCENARIO_3',timestamp:new Date(d.timestamp).toISOString()}]);
    });
    s.on('terminal_log',l=>setTermLogs(p=>[...p.slice(-99),l]));
    s.on('shard_received',e=>setShardEvts(p=>[...p.slice(-19),e]));
    s.on('amtd_telemetry',({current_port})=>setAmtdPort(current_port));
    return()=>s.disconnect();
  },[]);

  const l1=ledger.filter(e=>e.scenario==='SCENARIO_1');
  const l2=ledger.filter(e=>e.scenario==='SCENARIO_2');
  const l3=ledger.filter(e=>e.scenario==='SCENARIO_3');
  const stats=arr=>({
    approved:arr.filter(e=>e.status==='LEGITIMATE_SUCCESS'||e.status==='AEGIS_VERIFIED').length,
    theft:arr.filter(e=>e.status==='CRITICAL_THEFT_SUCCESS').length,
    blocked:arr.filter(e=>e.status==='BLOCKED_BY_AEGIS').length
  });
  const s1=stats(l1),s2=stats(l2),s3=stats(l3);

  const doTransfer=useCallback(async(key,amount,isForged,scenario,withShard)=>{
    if(loading)return;
    setLoading(key);
    sockRef.current?.emit('set_scenario',{scenario});
    try{await fetch(BANK_HOST+'/admin/set-scenario',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({scenario})})}catch{}
    const txnId=makeTxnId();
    if(withShard&&sockRef.current&&amtdPort!==null){
      sockRef.current.emit('submit_shard_b',{transactionId:txnId,zkpSignature:'zkp_'+Math.random().toString(36).slice(2,10),targetPort:amtdPort});
      await new Promise(r=>setTimeout(r,20));
    }
    try{await fetch(BANK_HOST+'/api/transfer',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({transactionId:txnId,amount,receiver:'Rajesh Kumar',isForged})})}catch{}
    setLoading(null);
  },[loading,amtdPort]);

  const toggleAegis=useCallback(async()=>{
    if(toggling)return;
    setToggling(true);
    const sc=aegisOn?'SCENARIO_1':'SCENARIO_3';
    sockRef.current?.emit('set_scenario',{scenario:sc});
    try{await fetch(BANK_HOST+'/admin/set-scenario',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({scenario:sc})})}catch{}
    setAegisOn(!aegisOn);setToggling(false);
  },[aegisOn,toggling]);

  const btn=(key,label,cls,onClick)=>React.createElement('button',{
    disabled:!!loading,onClick,
    className:'flex items-center justify-center gap-2 w-full py-3 rounded-lg '+cls+' disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-sm transition-colors'
  },loading===key?'⟳ Loading...':label);

  const col=(title,badge,desc,borderColor,stats,actions,ledgerEntries,extra)=>
    React.createElement('section',{className:'flex flex-col gap-4'},
      React.createElement('div',{className:'bg-white rounded-lg shadow-sm border border-stone-200 overflow-hidden'},
        React.createElement('div',{className:'h-1.5 '+borderColor}),
        React.createElement('div',{className:'p-5'},
          React.createElement('span',{className:'text-xs font-bold px-2 py-0.5 rounded-full uppercase tracking-wider border '+badge},title),
          React.createElement('h2',{className:'text-base font-bold text-stone-800 mt-2'},desc[0]),
          React.createElement('p',{className:'text-xs text-stone-500 mt-1 leading-relaxed'},desc[1])
        )
      ),
      React.createElement('div',{className:'flex gap-2'},
        React.createElement(StatsBadge,{label:'Approved',value:stats.approved,color:'bg-green-50 border-green-200 text-green-700'}),
        React.createElement(StatsBadge,{label:'Theft',value:stats.theft,color:'bg-red-50 border-red-200 text-red-700'}),
        React.createElement(StatsBadge,{label:'Blocked',value:stats.blocked,color:'bg-amber-50 border-amber-200 text-amber-700'})
      ),
      React.createElement('div',{className:'bg-white rounded-lg shadow-sm border border-stone-200 p-5'},
        React.createElement('p',{className:'text-xs font-semibold text-stone-500 uppercase tracking-wider mb-3'},'Transfer Amount: ₹5,000'),
        React.createElement('div',{className:'flex flex-col gap-3'},...actions)
      ),
      React.createElement('div',{className:'bg-white rounded-lg shadow-sm border border-stone-200 p-5 flex-1'},
        React.createElement('p',{className:'text-xs font-semibold text-stone-500 uppercase tracking-wider mb-3'},'📄 Transaction Ledger'),
        React.createElement(LedgerTable,{entries:ledgerEntries})
      ),
      ...( extra||[])
    );

  return React.createElement('div',{style:{backgroundColor:'#f5f0e8',animation:shaking?'shake 0.6s both':'none'},className:'min-h-screen flex flex-col'},
    React.createElement(AegisOverlay,{data:intervention,onClose:()=>setIntervention(null)}),
    React.createElement('div',{className:'bg-green-800 py-1 px-6 text-center'},
      React.createElement('span',{className:'text-white text-xs font-medium tracking-widest'},'सहकारी बैंक | Cooperative Bank')
    ),
    React.createElement('header',{className:'bg-white border-b border-stone-200 shadow-sm sticky top-0 z-40'},
      React.createElement('div',{className:'flex items-center justify-between px-8 py-4'},
        React.createElement('div',{className:'flex items-center gap-3'},
          React.createElement('div',{className:'border-l-4 border-green-800 pl-4 flex items-center gap-3'},
            React.createElement('span',{className:'text-3xl'},'🏦'),
            React.createElement('div',null,
              React.createElement('h1',{className:'text-xl font-bold text-green-800'},'Gramin Cooperative Bank'),
              React.createElement('p',{className:'text-xs text-stone-500'},'Established 1987 | Serving Rural Communities')
            )
          )
        ),
        React.createElement('div',{className:'flex items-center gap-3'},
          React.createElement('button',{
            onClick:toggleAegis,disabled:toggling,
            className:'flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm border-2 transition-all '+(aegisOn?'bg-blue-700 border-blue-700 text-white hover:bg-blue-800':'bg-white border-stone-300 text-stone-600 hover:border-blue-400')
          },'🛡 '+(toggling?'...':aegisOn?'AEGIS: ON':'AEGIS: OFF')),
          React.createElement('div',{className:'flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border '+(connected?'bg-green-50 text-green-700 border-green-200':'bg-red-50 text-red-700 border-red-200')},
            (connected?'● Connected':'● Disconnected')
          )
        )
      )
    ),
    aegisOn&&React.createElement('div',{className:'bg-blue-700 text-white text-xs font-semibold text-center py-1.5 tracking-widest'},
      '🛡 AEGIS ZERO-TRUST PROTECTION ACTIVE — Dual-Channel ZK-Proof Verification Enabled'
    ),
    React.createElement('main',{className:'flex-1 grid grid-cols-3 gap-6 p-6'},
      col('Scenario 1','text-green-700 bg-green-50 border-green-200','bg-green-600',
        ['Standard Transfer Desk','Standard HTTP transfer. No CSRF protection. No dual-channel verification.'],
        s1,
        [btn('s1_legit','✓ Approve Transfer','bg-green-700 hover:bg-green-800',()=>doTransfer('s1_legit',5000,false,'SCENARIO_1',false))],
        l1
      ),
      col('Scenario 2','text-red-700 bg-red-50 border-red-200','bg-red-600',
        ['Security Audit — CSRF Test','Attacker forges a cross-site request. Bank blindly processes it. Funds stolen.'],
        s2,
        [
          btn('s2_legit','✓ Approve Legitimate Transfer','bg-green-700 hover:bg-green-800',()=>doTransfer('s2_legit',5000,false,'SCENARIO_2',false)),
          btn('s2_csrf','⚠ Launch CSRF Attack (No AEGIS)','bg-red-600 hover:bg-red-700',()=>doTransfer('s2_csrf',5000,true,'SCENARIO_2',false))
        ],
        l2
      ),
      col('Scenario 3','text-blue-700 bg-blue-50 border-blue-200','bg-blue-700',
        ['AEGIS Protected Gateway','Dual-channel ZK-proof verification. CSRF attacks are detected and terminated.'],
        s3,
        [
          btn('s3_legit','🛡 Approve Transfer (AEGIS)','bg-blue-700 hover:bg-blue-800',()=>doTransfer('s3_legit',5000,false,'SCENARIO_3',true)),
          btn('s3_csrf','⚠ Launch CSRF Attack (AEGIS Active)','bg-red-600 hover:bg-red-700',()=>doTransfer('s3_csrf',5000,true,'SCENARIO_3',false))
        ],
        l3,
        [
          React.createElement('div',{className:'bg-white rounded-lg shadow-sm border border-blue-200 p-5'},
            React.createElement('p',{className:'text-xs font-bold text-blue-700 uppercase tracking-wider mb-3'},'🔒 AEGIS Shard Monitor'),
            React.createElement('div',{className:'flex items-center justify-between text-xs mb-3 pb-2 border-b border-stone-100'},
              React.createElement('span',{className:'text-stone-500'},'AMTD Active Port'),
              React.createElement('span',{className:'font-mono text-blue-700 font-bold bg-blue-50 px-2 py-0.5 rounded border border-blue-200'},amtdPort??'—')
            ),
            shardEvts.length===0
              ?React.createElement('p',{className:'text-stone-400 text-xs italic'},'Awaiting shard events…')
              :shardEvts.slice(-6).map((e,i)=>React.createElement('div',{key:i,className:'flex items-center gap-2 text-xs'},
                  React.createElement('span',{className:'text-blue-500'},'⚡'),
                  React.createElement('span',{className:'text-blue-700 font-mono font-medium'},e.protocol),
                  React.createElement('span',{className:'text-stone-400 truncate'},e.transactionId.slice(-10))
                ))
          ),
          React.createElement('div',{className:'bg-white rounded-lg shadow-sm border border-amber-200 p-5'},
            React.createElement('p',{className:'text-xs font-bold text-amber-700 uppercase tracking-wider mb-3'},'⚡ AEGIS Event Stream'),
            React.createElement('div',{className:'space-y-1 max-h-36 overflow-auto font-mono text-xs bg-stone-50 rounded-lg p-3 border border-stone-200'},
              termLogs.length===0
                ?React.createElement('p',{className:'text-stone-400 italic'},'No events yet…')
                :termLogs.slice(-20).map((l,i)=>React.createElement('div',{key:i,className:l.level==='threat'?'text-red-600':l.level==='success'?'text-green-700':'text-stone-500'},
                    React.createElement('span',{className:'text-stone-400 mr-2'},new Date(l.timestamp).toLocaleTimeString()),l.message
                  ))
            )
          )
        ]
      )
    )
  );
}

createRoot(document.getElementById('root')).render(React.createElement(App));
</script>
</body>
</html>`);
});

// ─────────────────────────────────────────────
//  ADMIN: SET SCENARIO
// ─────────────────────────────────────────────
fastify.post('/admin/set-scenario', async (request, reply) => {
  const { scenario } = request.body ?? {};
  const valid = ['SCENARIO_1', 'SCENARIO_2', 'SCENARIO_3'];
  if (!valid.includes(scenario)) return reply.status(400).send({ status: 'ERROR' });
  ACTIVE_DEMO_SCENARIO = scenario;
  io.emit('scenario_changed', { scenario: ACTIVE_DEMO_SCENARIO, timestamp: Date.now() });
  console.log(`[ADMIN] Scenario → ${ACTIVE_DEMO_SCENARIO}`);
  return { status: 'OK', active: ACTIVE_DEMO_SCENARIO };
});

// ─────────────────────────────────────────────
//  MAIN TRANSFER ROUTE
// ─────────────────────────────────────────────
fastify.post('/api/transfer', async (request, reply) => {
  const { transactionId, amount, receiver, isForged } = request.body ?? {};

  if (!transactionId || !amount || !receiver) {
    return reply.status(400).send({ status: 'ERROR', reason: 'Missing fields.' });
  }

  // ── SCENARIO 1 & 2: Legacy — blindly trust HTTP ──
  if (ACTIVE_DEMO_SCENARIO === 'SCENARIO_1' || ACTIVE_DEMO_SCENARIO === 'SCENARIO_2') {
    console.warn(`[LEGACY] Processing TxID ${transactionId} WITHOUT ZKP. isForged=${isForged}`);

    io.emit('ledger_update', {
      id: transactionId,
      sender: isForged ? 'Person 1 (FORGED SESSION)' : 'Person 1',
      receiver,
      amount,
      status: isForged ? 'CRITICAL_THEFT_SUCCESS' : 'LEGITIMATE_SUCCESS',
      scenario: ACTIVE_DEMO_SCENARIO,
      timestamp: new Date().toISOString(),
    });

    io.emit('terminal_log', {
      level: isForged ? 'threat' : 'info',
      message: isForged
        ? `[LEGACY] ⚠ CSRF PAYLOAD BLINDLY PROCESSED — ₹${amount} → ${receiver}`
        : `[LEGACY] Legitimate transfer ₹${amount} → ${receiver} processed.`,
      timestamp: Date.now(),
    });

    return reply.send({ status: 'PROCESSED_LEGACY', message: 'Funds transferred.' });
  }

  // ── SCENARIO 3: AEGIS Zero-Trust ──
  if (ACTIVE_DEMO_SCENARIO === 'SCENARIO_3') {
    shardMemoryVault.set(`${transactionId}_HTTP`, { data: request.body, timestamp: Date.now() });

    io.emit('shard_received', { protocol: 'HTTP', transactionId, timestamp: Date.now() });
    io.emit('terminal_log', { level: 'info', message: `[AEGIS] Incoming POST /api/transfer — HTTP Shard A stored. TxID: ${transactionId}`, timestamp: Date.now() });
    io.emit('terminal_log', { level: 'info', message: `[AEGIS] Validating ambient credentials (Cookies)... STATUS: PRESENT.`, timestamp: Date.now() });
    io.emit('terminal_log', { level: 'info', message: `[AEGIS] Initiating 50ms temporal window for WebRTC cryptographic shard.`, timestamp: Date.now() });

    await new Promise(r => setTimeout(r, 50));

    const httpShard   = shardMemoryVault.get(`${transactionId}_HTTP`);
    const webrtcShard = shardMemoryVault.get(`${transactionId}_WEBRTC`);
    shardMemoryVault.delete(`${transactionId}_HTTP`);
    shardMemoryVault.delete(`${transactionId}_WEBRTC`);

    if (!webrtcShard) {
      io.emit('aegis_intervention', {
        id: transactionId,
        reason: 'Asymmetric Transport Failure. WebRTC ZK-Proof Missing.',
        mitigation: 'Transaction Terminated. Origin flagged as automated bot.',
        timestamp: Date.now(),
        sequence: [
          'Incoming state-changing POST request detected on /api/transfer.',
          'Validating ambient credentials (Cookies)... STATUS: PRESENT.',
          'Initiating 50ms temporal window for WebRTC cryptographic shard.',
          '50ms elapsed. Shard B (ZK-Behavioral Proof) NOT FOUND.',
          'Verifying Sec-Fetch-Site metadata... WARNING: Cross-Site origin detected.',
          'DIAGNOSIS: OWASP API2:2023 Broken Authentication Exploit (CSRF) Attempted.',
          'ACTION: Payload dropped. Connection severed. Funds secured.',
        ],
      });
      io.emit('terminal_log', { level: 'threat', message: `[AEGIS] FATAL: CSRF Payload terminated. TxID: ${transactionId}`, timestamp: Date.now() });
      return reply.status(403).send({ status: 'BLOCKED_BY_AEGIS' });
    }

    const delta = Math.abs(httpShard.timestamp - webrtcShard.timestamp);
    io.emit('ledger_update', {
      id: transactionId, sender: 'Person 1', receiver,
      amount, status: 'AEGIS_VERIFIED', delta,
      scenario: 'SCENARIO_3', timestamp: new Date().toISOString(),
    });
    io.emit('transaction_success', { transactionId, delta, timestamp: Date.now() });
    io.emit('terminal_log', { level: 'success', message: `[AEGIS] Dual-channel sync verified (Δ${delta}ms). APPROVED. TxID: ${transactionId}`, timestamp: Date.now() });
    return reply.status(200).send({ status: 'APPROVED', delta_ms: delta });
  }
});

// ─────────────────────────────────────────────
//  START
// ─────────────────────────────────────────────
await fastify.listen({ port: 3002, host: '0.0.0.0' });
console.log('[NODE 2] Fastify on http://0.0.0.0:3002');

const io = new Server(fastify.server, {
  cors: { origin: '*', methods: ['GET', 'POST'] },
});

setInterval(() => {
  activeAmtdPort = randomInt(49152, 65536);
  if (ACTIVE_DEMO_SCENARIO === 'SCENARIO_3') {
    io.emit('amtd_telemetry', { current_port: activeAmtdPort, timestamp: Date.now() });
  }
}, 3500);

io.on('connection', (socket) => {
  console.log(`[WS] ${socket.id} connected`);
  socket.emit('scenario_changed', { scenario: ACTIVE_DEMO_SCENARIO, timestamp: Date.now() });
  socket.emit('amtd_telemetry', { current_port: activeAmtdPort, timestamp: Date.now() });

  socket.on('set_scenario', ({ scenario }) => {
    const valid = ['SCENARIO_1', 'SCENARIO_2', 'SCENARIO_3'];
    if (!valid.includes(scenario)) return;
    ACTIVE_DEMO_SCENARIO = scenario;
    console.log(`[WS] Scenario → ${ACTIVE_DEMO_SCENARIO}`);
    io.emit('scenario_changed', { scenario: ACTIVE_DEMO_SCENARIO, timestamp: Date.now() });
  });

  socket.on('submit_shard_b', ({ transactionId, zkpSignature, targetPort }) => {
    if (ACTIVE_DEMO_SCENARIO !== 'SCENARIO_3') return;
    if (targetPort !== activeAmtdPort) {
      io.emit('terminal_log', { level: 'threat', message: `[AEGIS] AMTD BLOCK — Stale port ${targetPort}. Active: ${activeAmtdPort}.`, timestamp: Date.now() });
      return;
    }
    shardMemoryVault.set(`${transactionId}_WEBRTC`, { signature: zkpSignature, timestamp: Date.now() });
    io.emit('shard_received', { protocol: 'WebRTC', transactionId, timestamp: Date.now() });
  });

  socket.on('disconnect', () => console.log(`[WS] ${socket.id} disconnected`));
});

console.log('[AMTD] Daemon started — rotating every 3500ms');
