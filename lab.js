import {R,idealSolve,internalEnergy,gasWork,isothermalWork,fmt} from './physics.js';
import {lineChart,escapeHTML,icon} from './visuals.js';
export const labState={experiment:'piston',process:'iso',n:.1,T:300,V:.002493,P:100000,base:{n:.1,T:300,V:.002493,P:100000},chart:'pv',selected:[],Q:800,W:300,dU:500,unknown:'dU'};
let particleFrame=0;
export function stopParticles(){if(particleFrame)cancelAnimationFrame(particleFrame);particleFrame=0;}
export function resetLab(){Object.assign(labState,{n:.1,T:300,V:.002493,P:100000});labState.base={n:labState.n,T:labState.T,V:labState.V,P:labState.P};labState.selected=[];}
export function setLabValue(key,value){
  if(!Number.isFinite(value)||value<=0)return;
  const l=labState;
  if(key==='n'){l.n=value;l.P=idealSolve(l,'P');l.base={n:l.n,T:l.T,V:l.V,P:l.P};return;}
  if(l.process==='iso'){
    if(key==='T')return;l[key]=value;if(key==='V')l.P=idealSolve(l,'P');else if(key==='P')l.V=idealSolve(l,'V');
  }else if(l.process==='isobar'){
    if(key==='P')return;l[key]=value;if(key==='T')l.V=idealSolve(l,'V');else if(key==='V')l.T=idealSolve(l,'T');
  }else{
    if(key==='V')return;l[key]=value;if(key==='T')l.P=idealSolve(l,'P');else if(key==='P')l.T=idealSolve(l,'T');
  }
}
export function labPath(){
  const l=labState,b=l.base;
  return Array.from({length:21},(_,i)=>{
    const t=i/20;let V,T,P;
    if(l.process==='iso'){V=b.V+(l.V-b.V)*t;T=b.T;P=l.n*R*T/V;}
    else if(l.process==='isobar'){T=b.T+(l.T-b.T)*t;P=b.P;V=l.n*R*T/P;}
    else{T=b.T+(l.T-b.T)*t;V=b.V;P=l.n*R*T/V;}
    return {P,V,T,U:internalEnergy(l.n,T)};
  });
}
export function labCalculations(){
  const l=labState,b=l.base,W=l.process==='iso'?isothermalWork(l.n,l.T,b.V,l.V):l.process==='isobar'?gasWork(l.P,b.V,l.V):0,dU=internalEnergy(l.n,l.T)-internalEnergy(l.n,b.T);
  return {W,dU,Q:W+dU,U:internalEnergy(l.n,l.T)};
}
export function renderLabPage(){
  const l=labState;
  const experiments=[['piston','Pistão ideal'],['rigid','Recipiente rígido'],['work','Trabalho mecânico'],['energy','Energia interna'],['first','Primeira lei']];
  return `<div class="page-intro"><div><span class="eyebrow">OBSERVAR PARA COMPREENDER</span><h1>Laboratório virtual<span>.</span></h1><p>Altere uma grandeza. A Física cuida das outras.</p></div><span class="pill">${icon('lab',15)} R = 8,31 J/(mol·K)</span></div><div class="tabs wrap">${experiments.map(([id,name])=>`<button data-lab-experiment="${id}" class="${l.experiment===id?'active':''}">${name}</button>`).join('')}</div>${l.experiment==='first'?renderEnergyPanel():`<div class="lab-grid"><section class="panel"><div class="panel-heading"><h2>Uma amostra, três variáveis</h2><span class="tag">MODELO IDEAL</span></div><div class="piston-scene"><canvas id="particles" width="600" height="400" aria-label="Representação ilustrativa de partículas de um gás em um pistão"></canvas><div class="piston-label"><span id="piston-condition"></span><strong id="piston-temp"></strong></div></div><p class="caption">Partículas ilustrativas: a quantidade desenhada não representa o número real de átomos. A escala de velocidade acompanha √T.</p><div class="metric-row" id="lab-metrics"></div></section><section class="panel lab-controls"><div class="panel-heading"><h2>Controles do experimento</h2><button class="icon-button" data-lab-reset aria-label="Restaurar estado inicial">${icon('refresh')}</button></div><label class="field">Transformação<select id="lab-process" ${['rigid','work','energy'].includes(l.experiment)?'disabled':''}><option value="iso" ${l.process==='iso'?'selected':''}>Isotérmica · T constante</option><option value="isobar" ${l.process==='isobar'?'selected':''}>Isobárica · P constante</option><option value="isochor" ${l.process==='isochor'?'selected':''}>Isocórica · V constante</option></select></label>${[['V','Volume',.0005,.012,.00005,'L',1000],['T','Temperatura',100,1000,1,'K',1],['P','Pressão',10000,1000000,1000,'kPa',.001],['n','Quantidade de matéria',.02,.3,.01,'mol',1]].map(([key,label,min,max,step,unit,scale])=>`<label class="range-field"><span>${label}<output data-lab-label="${key}">${fmt(l[key]*scale)} ${unit}</output></span><input type="range" data-lab-key="${key}" min="${min}" max="${max}" step="${step}" value="${l[key]}" ${l.process==='iso'&&key==='T'||l.process==='isobar'&&key==='P'||l.process==='isochor'&&key==='V'?'disabled':''} aria-label="${label}"></label>`).join('')}<div class="info-callout" id="lab-rule"></div><p class="caption">Modificar n prepara uma nova amostra e redefine o estado A. Nos demais controles, n permanece fixo. Valores fora da faixa visual continuam sendo calculados e exibidos.</p></section></div><section class="panel chart-panel"><div class="panel-heading"><div><span class="eyebrow">DO ESTADO A AO ESTADO B</span><h2>A trajetória conta uma história</h2></div><div class="tabs small">${[['pv','P × V'],['vt','V × T'],['pt','P × T'],['ut','U × T']].map(([id,name])=>`<button data-lab-chart="${id}" class="${l.chart===id?'active':''}">${name}</button>`).join('')}</div></div><div id="lab-chart"></div><div id="lab-points" class="caption"></div><p class="caption">Selecione até dois pontos para comparar estados. Área sombreada somente em P × V: trabalho quase-estático. Nesta simulação, os processos têm n fixo.</p></section>`}`;
}
function renderEnergyPanel(){
  const l=labState;
  return `<section class="panel energy-panel"><div class="panel-heading"><h2>Balanço de energia</h2><span class="tag">ΔU = Q − W</span></div><label class="field">Grandeza a calcular<select id="energy-unknown"><option value="dU" ${l.unknown==='dU'?'selected':''}>Variação ΔU</option><option value="Q" ${l.unknown==='Q'?'selected':''}>Calor Q</option><option value="W" ${l.unknown==='W'?'selected':''}>Trabalho W</option></select></label><div class="energy-flow"><div class="energy-node heat"><span>CALOR RECEBIDO</span><strong id="energy-Q"></strong><small>Q &gt; 0 entra no sistema</small></div><div class="energy-arrow">${icon('arrow',34)}</div><div class="energy-node system"><span>ENERGIA INTERNA</span><strong id="energy-dU"></strong><small>ΔU: energia armazenada muda</small></div><div class="energy-arrow">${icon('arrow',34)}</div><div class="energy-node work"><span>TRABALHO PELO GÁS</span><strong id="energy-W"></strong><small>W &gt; 0 sai do sistema</small></div></div><div class="two-col">${['Q','W','dU'].filter(k=>k!==l.unknown).map(k=>`<label class="range-field"><span>${k==='dU'?'ΔU':k} (J)<output data-energy-label="${k}">${fmt(l[k])} J</output></span><input type="range" data-energy-key="${k}" min="-1500" max="1500" step="10" value="${l[k]}" aria-label="${k} em joules"></label>`).join('')}</div><div class="info-callout" id="energy-explain"></div><p class="caption">Os sinais indicam o sentido real. Q negativo é calor cedido; W negativo é trabalho recebido. As setas mostram a convenção positiva de referência.</p></section>`;
}
export function updateLab(){
  const l=labState;
  if(l.experiment==='first'){
    if(l.unknown==='dU')l.dU=l.Q-l.W;if(l.unknown==='Q')l.Q=l.dU+l.W;if(l.unknown==='W')l.W=l.Q-l.dU;
    for(const k of ['Q','W','dU']){const e=document.getElementById(`energy-${k}`);if(e)e.textContent=`${fmt(l[k])} J`;const label=document.querySelector(`[data-energy-label="${k}"]`);if(label)label.textContent=`${fmt(l[k])} J`;}
    document.getElementById('energy-explain').textContent=`ΔU = Q − W = ${fmt(l.Q)} − (${fmt(l.W)}) = ${fmt(l.dU)} J. ${l.dU>0?'A energia interna aumenta.':l.dU<0?'A energia interna diminui.':'A energia interna não varia.'}`;return;
  }
  const calc=labCalculations(),path=labPath();
  for(const [key,unit,scale] of [['V','L',1000],['T','K',1],['P','kPa',.001],['n','mol',1]]){
    const label=document.querySelector(`[data-lab-label="${key}"]`);if(label)label.textContent=`${fmt(l[key]*scale)} ${unit}`;
    const input=document.querySelector(`[data-lab-key="${key}"]`);if(input)input.value=l[key];
  }
  document.getElementById('piston-condition').textContent={iso:'Temperatura constante',isobar:'Pressão constante',isochor:'Volume constante'}[l.process];
  document.getElementById('piston-temp').textContent=`${fmt(l.T)} K`;
  document.getElementById('lab-metrics').innerHTML=[['W pelo gás',calc.W],['ΔU',calc.dU],['Q recebido',calc.Q],['U',calc.U]].map(([k,v])=>`<div><small>${k}</small><strong>${fmt(v)} <span>J</span></strong></div>`).join('');
  document.getElementById('lab-rule').innerHTML=`<strong>${{iso:'PV = constante · ΔU = 0',isobar:'V/T = constante · W = nRΔT',isochor:'P/T = constante · W = 0'}[l.process]}</strong><p>${l.process==='iso'?'A temperatura está fixa; mudar V ajusta P inversamente. O trabalho é nRT ln(Vf/Vi).':l.process==='isobar'?'A pressão está fixa; V acompanha T. O trabalho é P(Vf − Vi).':'O recipiente é rígido. A pressão acompanha a temperatura e Q = ΔU.'}</p>`;
  const graphs={pv:{xLabel:'Volume (L)',yLabel:'Pressão (kPa)',points:path.map(s=>[s.V*1000,s.P/1000]),shade:true},vt:{xLabel:'Temperatura (K)',yLabel:'Volume (L)',points:path.map(s=>[s.T,s.V*1000])},pt:{xLabel:'Temperatura (K)',yLabel:'Pressão (kPa)',points:path.map(s=>[s.T,s.P/1000])},ut:{xLabel:'Temperatura (K)',yLabel:'Energia interna (J)',points:path.map(s=>[s.T,s.U])}};
  document.getElementById('lab-chart').innerHTML=lineChart(graphs[l.chart].points,{...graphs[l.chart],interactive:true,selected:l.selected});
  document.getElementById('lab-points').textContent=l.selected.length?l.selected.map(i=>{const s=path[i];return `Estado ${i+1}: P = ${fmt(s.P/1000)} kPa; V = ${fmt(s.V*1000)} L; T = ${fmt(s.T)} K; U = ${fmt(s.U)} J.`;}).join('   /   '):'Estado A: referência inicial. Estado B: valores atuais dos controles.';
}
export function startParticles(reduced=false){
  stopParticles();const canvas=document.getElementById('particles');if(!canvas)return;
  const ctx=canvas.getContext('2d'),particles=Array.from({length:38},()=>({x:180+Math.random()*230,y:150+Math.random()*210,vx:(Math.random()-.5)*1.8,vy:(Math.random()-.5)*1.8}));
  let last=0;
  function draw(now){
    const dt=Math.min(2,(now-last)/16.67)||1;last=now;const l=labState;
    const left=155,right=445,bottom=350,height=Math.min(270,Math.max(65,l.V/.009*270)),top=bottom-height;
    ctx.clearRect(0,0,600,400);
    const fill=ctx.createLinearGradient(left,0,right,0);fill.addColorStop(0,'rgba(56,189,248,.02)');fill.addColorStop(.5,'rgba(56,189,248,.12)');fill.addColorStop(1,'rgba(56,189,248,.02)');
    ctx.fillStyle=fill;ctx.fillRect(left,top,right-left,height);ctx.strokeStyle='#78a8b8';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(left,60);ctx.lineTo(left,bottom);ctx.lineTo(right,bottom);ctx.lineTo(right,60);ctx.stroke();
    ctx.fillStyle='#bad7df';ctx.fillRect(left-6,top-9,right-left+12,12);ctx.strokeStyle='#7195a1';ctx.strokeRect(left-6,top-9,right-left+12,12);ctx.fillStyle='#789da9';ctx.fillRect(290,Math.max(15,top-80),20,Math.min(80,top-15));
    ctx.fillStyle='#188ab1';for(const p of particles){if(!reduced){const speed=Math.sqrt(l.T/300);p.x+=p.vx*speed*dt;p.y+=p.vy*speed*dt;}
      if(p.x<left+6){p.x=left+6;p.vx=Math.abs(p.vx);}if(p.x>right-6){p.x=right-6;p.vx=-Math.abs(p.vx);}if(p.y<top+8){p.y=top+8+Math.random()*10;p.vy=Math.abs(p.vy);}if(p.y>bottom-8){p.y=bottom-8;p.vy=-Math.abs(p.vy);}ctx.beginPath();ctx.arc(p.x,p.y,3.2,0,Math.PI*2);ctx.fill();}
    ctx.fillStyle='#749399';ctx.font='12px system-ui';ctx.fillText('VOLUME ILUSTRADO · ESCALA LIMITADA',172,381);
    particleFrame=requestAnimationFrame(draw);
  }
  particleFrame=requestAnimationFrame(draw);
}
