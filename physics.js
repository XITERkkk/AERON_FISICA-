/** Grandezas em SI, exceto quando uma função especifica outra unidade. */
export const R = 8.31;
export const ATM = 101325;
export function positive(x, name = 'grandeza') {
  if (!Number.isFinite(x) || x <= 0) throw new RangeError(`${name} deve ser positiva e finita.`);
  return x;
}
export function finite(x) { if (!Number.isFinite(x)) throw new RangeError('Valor não finito.'); return x; }
export const kelvin = (c, offset = 273.15) => positive(c + offset, 'Temperatura absoluta');
export const litersToM3 = l => positive(l, 'Volume') / 1000;
export const atmToPa = a => positive(a, 'Pressão') * ATM;
/** @param {{P?:number,V?:number,n?:number,T?:number}} state @param {'P'|'V'|'n'|'T'} target */
export function idealSolve(state, target) {
  const equations = {P: () => state.n * R * state.T / state.V,
    V: () => state.n * R * state.T / state.P,
    n: () => state.P * state.V / (R * state.T),
    T: () => state.P * state.V / (state.n * R)};
  if (!equations[target]) throw new Error('Incógnita inválida.');
  Object.keys(equations).filter(k=>k!==target).forEach(k=>positive(state[k],k));
  return positive(equations[target](), target);
}
export const isothermal = (p1,v1,v2) => positive(p1)*positive(v1)/positive(v2);
export const isobaric = (v1,t1,t2) => positive(v1)*positive(t2)/positive(t1);
export const isochoric = (p1,t1,t2) => positive(p1)*positive(t2)/positive(t1);
export const combined = (p1,v1,t1,v2,t2) => positive(p1)*positive(v1)*positive(t2)/(positive(t1)*positive(v2));
export const gasWork = (p,vi,vf) => positive(p)*(positive(vf)-positive(vi));
export const gasWorkT = (n,ti,tf) => positive(n)*R*(positive(tf)-positive(ti));
export const internalEnergy = (n,t) => 1.5*positive(n)*R*positive(t);
export const internalDelta = (n,ti,tf) => 1.5*positive(n)*R*(positive(tf)-positive(ti));
export const firstLaw = (q,w) => finite(q)-finite(w);
export const isothermalWork = (n,t,vi,vf) => positive(n)*R*positive(t)*Math.log(positive(vf)/positive(vi));
export function seededRandom(seed) {
  let h=2166136261;
  for (const c of String(seed)) h=Math.imul(h^c.charCodeAt(0),16777619);
  return ()=>{ h+=0x6D2B79F5; let t=h; t=Math.imul(t^t>>>15,t|1); t^=t+Math.imul(t^t>>>7,t|61); return ((t^t>>>14)>>>0)/4294967296; };
}
export function shuffle(items, rng=Math.random) {
  const a=[...items]; for(let i=a.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[a[i],a[j]]=[a[j],a[i]];} return a;
}
/** Apenas a apresentação é arredondada; os cálculos conservam sua precisão. */
const physicsRawNumberFormat = new Intl.NumberFormat('en-US',{maximumFractionDigits:2,useGrouping:false});
const physicsDisplayNumberFormat = new Intl.NumberFormat('pt-BR',{maximumFractionDigits:2,useGrouping:false});
export function roundForDisplay(x) {
  if (!Number.isFinite(x)) return x;
  if (x === 0) return 0;
  let rounded;
  if(Math.abs(x)<0.01||Math.abs(x)>=1e7){
    const [coefficient,exponent]=x.toExponential().split('e');
    rounded=Number(`${physicsRawNumberFormat.format(Number(coefficient))}e${exponent}`);
  }else rounded=Number(physicsRawNumberFormat.format(x));
  return Object.is(rounded, -0) ? 0 : rounded;
}
export function fmt(x) {
  if (typeof x !== 'number') return String(x);
  if (!Number.isFinite(x)) return '—';
  const rounded = roundForDisplay(x);
  if (x!==0 && (Math.abs(x)<0.01 || Math.abs(x)>=1e7)) return rounded.toExponential(2).replace('.',',').replace('e',' × 10^');
  return physicsDisplayNumberFormat.format(rounded);
}
/** Aceita vírgula, ponto, e, ×10^ e unidades reconhecidas. Não executa expressões. */
export function parseNumber(input, expectedUnit='') {
  let s=String(input).trim().replace(/−/g,'-').replace(/\s+/g,'').replace(',', '.');
  const units=['atm','Pa','kPa','m³','m3','L','K','°C','mol','J','kJ','vezes'];
  let supplied='';
  for(const u of [...units].sort((a,b)=>b.length-a.length)) if(s.endsWith(u)){supplied=u;s=s.slice(0,-u.length);break;}
  s=s.replace(/[×x*]10\^?([+-]?\d+)$/i,'e$1');
  if(!/^[+-]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?$/i.test(s)) return {valid:false,error:'Digite um número, como 4,5 ou 2,5e3.'};
  let value=Number(s);
  if(!Number.isFinite(value)) return {valid:false,error:'Use um número finito.'};
  if(supplied && supplied!==expectedUnit){
    const scales={atm:['pressure',ATM],Pa:['pressure',1],kPa:['pressure',1000],L:['volume',.001],'m³':['volume',1],m3:['volume',1],J:['energy',1],kJ:['energy',1000]};
    if(supplied==='°C'&&expectedUnit==='K') value+=273.15;
    else if(scales[supplied]&&scales[expectedUnit]&&scales[supplied][0]===scales[expectedUnit][0]) value=value*scales[supplied][1]/scales[expectedUnit][1];
    else return {valid:false,error:`Unidade incompatível. A resposta é pedida em ${expectedUnit||'número sem unidade'}.`,unitError:true};
  }
  return {valid:true,value};
}
export function numericTolerance(answer) {
  const magnitude = Math.abs(answer);
  const quantum = magnitude && (magnitude < 0.01 || magnitude >= 1e7) ? 10 ** (Math.floor(Math.log10(magnitude)) - 2) : 0.01;
  return Math.max(magnitude * 0.005, quantum / 2) + Number.EPSILON * Math.max(1, magnitude) * 8;
}
export const nearAnswer = (x,answer) => Number.isFinite(x) && Math.abs(x-answer)<=numericTolerance(answer);
export function checkAnswer(q,input) {
  if(typeof q.answer === 'number'){
    const p=parseNumber(input,q.unit); return p.valid?{valid:true,correct:nearAnswer(p.value,q.answer),value:p.value}:{...p,correct:false};
  }
  return {valid:String(input).length>0,correct:String(input)===String(q.answer),value:String(input)};
}
