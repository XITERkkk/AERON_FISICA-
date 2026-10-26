import {seededRandom,shuffle,fmt,roundForDisplay,numericTolerance,checkAnswer} from './physics.js';
import {formulaById} from './content.js';
import {populateQuestion} from './question-templates.js';

export const LEVELS = {facil:'Fácil',medio:'Médio',dificil:'Difícil'};
export const LEVEL_DESCRIPTIONS = {facil:'Dados diretos e números simples.',medio:'Conversões e isolamento de variáveis.',dificil:'Unidades combinadas, gráficos e várias etapas.'};
export const FAMILIES = [
 ['iso','Isotérmica','iso',2],['isobar','Isobárica','isobar',2],['isochor','Isocórica','isochor',2],['general','Lei geral','general',2],['ideal','Equação de estado','ideal',1],
 ['work','Trabalho PΔV','work',3],['expansion','Expansão · W positivo','work',3],['compression','Compressão · W negativo','work',3],['zeroWork','Volume constante · W = 0','work',3],['workT','Trabalho nRΔT','workT',3],
 ['internal','Energia interna','internal',4],['deltaU','Variação de U','deltaU',4],['first','Primeira lei','first',5],['adiabatic','Adiabática','first',5],['cycle','Ciclos','first',5],
 ['kinetic','Teoria cinética','isochor',1],['units','Conversões','kelvin',1],['identify','Reconhecer fórmulas','iso',2],['graph','Leitura de gráficos','work',3],['multi','Várias equações','first',5],
 ['internalConcept','Conceito de energia','internal',4],['rigid','Calor no recipiente rígido','first',5],['signs','Convenção de sinais','first',5],['order','Ordenar uma solução','general',2],['tf','Verdadeiro ou falso','iso',2],['mental','Cálculo mental','iso',1]
].map(([id,name,formulaId,module])=>({id,name,formulaId,module}));
export const SCHOOL_FAMILIES = ['iso','isobar','kinetic','general','identify','expansion','compression','zeroWork','first','internalConcept','internal','rigid','cycle','adiabatic','multi'];

function engineChoices(q,rng,suggestions=[]) {
  const numeric=typeof q.answer==='number';
  const makeChoice=(value,error='')=>({value:numeric?roundForDisplay(value):value,label:`${fmt(numeric?roundForDisplay(value):value)}${q.unit?' '+q.unit:''}`,error});
  const choices=[makeChoice(q.answer)];
  const pool=[...suggestions];
  if(numeric){
    const a=q.answer,step=Math.max(1,Math.abs(a)*.35);
    pool.push(...[a*2,a/2,a*1.5,a*.75,-a,a+step,a-step,a+2*step,a+3*step].map(value=>({value,error:'Confira a relação entre as grandezas, a operação e as unidades.'})));
  }
  for(const item of pool){
    if(choices.length===4)break;
    const c=makeChoice(item.value,item.error);
    if(numeric){
      if(!Number.isFinite(c.value))continue;
      if(['pressure','volume','temperature','amount','ratio'].includes(q.quantity)&&c.value<=0)continue;
      if(choices.some(other=>Math.abs(other.value-c.value)<=numericTolerance(other.value)+numericTolerance(c.value)))continue;
      if(checkAnswer(q,c.value).correct)continue;
    }
    if(choices.some(other=>String(other.value)===String(c.value)||other.label===c.label))continue;
    choices.push(c);
  }
  if(choices.length!==(q.family==='tf'?2:4))throw new Error('Não foi possível gerar alternativas distintas.');
  q.choices=shuffle(choices,rng);
}
/** Instância reproduzível. As grandezas fornecidas são as mesmas exibidas no enunciado. */
export function generateQuestion(family='iso',level='facil',seed=Date.now().toString()+Math.random()) {
  const meta=FAMILIES.find(f=>f.id===family);
  if(!meta)throw new Error('Família de questões desconhecida.');
  if(!Object.hasOwn(LEVELS,level))throw new Error('Escolha Fácil, Médio ou Difícil.');
  const rng=seededRandom(`v2:${family}:${level}:${seed}`),pick=items=>items[Math.floor(rng()*items.length)],int=(a,b)=>a+Math.floor(rng()*(b-a+1));
  const q={id:`v2:${family}:${level}:${seed}`,generatorVersion:2,seed:String(seed),family,level,formulaId:meta.formulaId,module:meta.module,topic:meta.name,unit:'',quantity:'energy',givens:[],params:{},steps:[],concept:'',hints:[],answer:0,kind:'numeric',prompt:'',tolerance:'Apresentação com até 2 casas decimais. Arredonde apenas o resultado final; seu arredondamento é aceito na correção.'};
  const wrong=populateQuestion(q,{rng,pick,int,shuffle:items=>shuffle(items,rng),medium:level!=='facil',hard:level==='dificil'});
  if(!q.prompt||(!Number.isFinite(q.answer)&&typeof q.answer!=='string'))throw new Error('Instância inválida.');
  if(!q.hints.length)q.hints=[`Observe o que o enunciado pede e quais dados ele fornece.`,`O conceito é ${meta.name.toLowerCase()}.`,`${formulaById(q.formulaId).equation}. Verifique as unidades antes de calcular.`];
  if(!q.choices)engineChoices(q,rng,wrong);
  q.signature=JSON.stringify([2,family,level,q.prompt,q.params]);
  return q;
}
export function chooseFamily({mode='balanced',focus=[],history=[],recent=[],bag=[]}={}) {
  const allowed=focus.length?FAMILIES.filter(f=>focus.includes(f.id)):FAMILIES.filter(f=>!['order','tf','mental'].includes(f.id));
  if(mode==='adaptive'){
    const weights=allowed.map(f=>{const a=history.filter(h=>h.family===f.id).slice(-12);return {id:f.id,w:a.length?1+4*(1-a.filter(x=>x.correct).length/a.length):3};});
    let t=Math.random()*weights.reduce((s,x)=>s+x.w,0);for(const x of weights){t-=x.w;if(t<=0)return {id:x.id,bag};}return {id:weights[0].id,bag};
  }
  const nextBag=bag.filter(id=>allowed.some(f=>f.id===id));
  if(!nextBag.length)nextBag.push(...shuffle(allowed.map(f=>f.id)));
  if(nextBag.length>1&&nextBag[0]===recent.at(-1))nextBag.push(nextBag.shift());
  return {id:nextBag.shift(),bag:nextBag};
}
export function createExam({count=15,school=false,level='medio',focus=[],seed=Date.now().toString()}={}) {
  const rng=seededRandom(seed);let families=[];
  if(school)families=[...SCHOOL_FAMILIES];
  else {
    const candidates=FAMILIES.filter(f=>(!focus.length||focus.includes(f.id))&&!['mental','order','tf'].includes(f.id));
    if(!candidates.length)throw new Error('Escolha ao menos um conteúdo.');
    const groups=[1,2,3,4,5].map(m=>shuffle(candidates.filter(f=>f.module===m).map(f=>f.id),rng)).filter(a=>a.length);
    for(let i=0;i<count;i++){const g=groups[i%groups.length];families.push(g[Math.floor(i/groups.length)%g.length]);}
    families=shuffle(families,rng);
  }
  return families.map((f,i)=>{
    let q=generateQuestion(f,level,`${seed}-${i}`);
    if(!school&&f==='identify')for(let retry=0;q.module!==2&&retry<100;retry++)q=generateQuestion(f,level,`${seed}-${i}-recognition-${retry}`);
    return q;
  });
}
export function diagnose(q,input) {
  const result=checkAnswer(q,input);if(result.correct)return '';
  const matching=q.choices?.find(c=>typeof c.value==='number'&&typeof result.value==='number'?Math.abs(c.value-result.value)<numericTolerance(c.value):String(c.value)===String(input));
  return matching?.error?`Hipótese a conferir: ${matching.error}`:'Não há evidência suficiente para identificar um erro específico. Confira interpretação, unidade, sinal e operação.';
}
