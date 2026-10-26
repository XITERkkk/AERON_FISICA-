import test from 'node:test';import assert from 'node:assert/strict';
import {generateQuestion,FAMILIES,LEVELS,createExam,SCHOOL_FAMILIES,chooseFamily} from '../src/engine.js';
import {R,ATM,fmt,roundForDisplay,checkAnswer,nearAnswer,parseNumber} from '../src/physics.js';
import {FORMULAS} from '../src/content.js';

function independentlyComputed(q){
 const p=q.params;
 if(q.family==='iso'||q.family==='general'){
  const v={P1:p.P1,V1:p.V1,T1:p.T1,P2:p.P2,V2:p.V2,T2:p.T2};
  const answers={P1:v.P2*v.V2*v.T1/(v.T2*v.V1),V1:v.P2*v.V2*v.T1/(v.T2*v.P1),T1:v.P1*v.V1*v.T2/(v.P2*v.V2),P2:v.P1*v.V1*v.T2/(v.T1*v.V2),V2:v.P1*v.V1*v.T2/(v.T1*v.P2),T2:v.P2*v.V2*v.T1/(v.P1*v.V1)};return answers[p.target];
 }
 if(q.family==='isobar')return {V1:p.V2*p.T1/p.T2,T1:p.T2*p.V1/p.V2,V2:p.V1*p.T2/p.T1,T2:p.T1*p.V2/p.V1}[p.target];
 if(q.family==='isochor')return {P1:p.P2*p.T1/p.T2,T1:p.T2*p.P1/p.P2,P2:p.P1*p.T2/p.T1,T2:p.T1*p.P2/p.P1}[p.target];
 if(q.family==='ideal')return {P:p.n*R*p.T/p.V,V:p.n*R*p.T/p.P,n:p.P*p.V/(R*p.T),T:p.P*p.V/(p.n*R)}[p.target]*(p.target==='V'&&q.unit==='L'?1000:1);
 if(['work','expansion','compression','zeroWork','graph'].includes(q.family))return p.target==='P'?p.W/(p.Vf-p.Vi):p.target==='Vf'?(p.Vi+p.W/p.P)*(q.unit==='L'?1000:1):((p.P+(p.Pf??p.P))/2)*(p.Vf-p.Vi);
 if(q.family==='internal')return p.target==='T'?p.U/(1.5*p.n*R):p.target==='n'?p.U/(1.5*R*p.Tf):1.5*p.n*R*p.Tf;
 if(['deltaU','workT','rigid'].includes(q.family)){const factor=q.family==='workT'?1:1.5,energy=factor*p.n*R*(p.Tf-p.Ti);return p.target==='Tf'?p.Ti+energy/(factor*p.n*R):p.target==='n'?energy/(factor*R*(p.Tf-p.Ti)):energy;}
 if(q.family==='multi'){const n=q.level==='dificil'?p.P*p.V/(R*p.Ti):p.n;return {W:n*R*(p.Tf-p.Ti),dU:1.5*n*R*(p.Tf-p.Ti),Q:2.5*n*R*(p.Tf-p.Ti)}[p.target];}
 if(['first','signs','cycle','adiabatic'].includes(q.family))return {Q:p.dU+p.W,W:p.Q-p.dU,dU:p.Q-p.W}[p.target];
 if(q.family==='kinetic'||q.family==='internalConcept')return p.T2/p.T1;
 if(q.family==='units')return {temperature:p.v+273.15,volume:p.v*.001,pressure:p.v*101325,delta:p.v}[p.variant];
 if(q.family==='identify')return FORMULAS.find(f=>f.id===p.formula).equation;
 if(q.family==='tf')return p.truth?'Verdadeiro':'Falso';
 if(q.family==='order')return ['Reconhecer T e n constantes','Escrever P₁V₁ = P₂V₂','Isolar P₂ = P₁V₁/V₂',`Calcular P₂ = ${fmt(p.P*p.V/p.Vf)} atm`].join(' → ');
 if(q.family==='mental')return {proportion:p.a/p.c,power:p.a*10**(p.e-3),division:p.a*p.c,estimate:p.a*p.b*100}[p.op];
 throw new Error('Sem verificador independente: '+q.family);
}
function checkVisibleData(q){
 const p=q.params;
 for(const g of q.givens){
  assert.equal(parseNumber(fmt(g.value),g.unit).value,g.value,'o dado visível não corresponde ao número fornecido');
  const text=`${fmt(g.value)} ${g.unit}`;
  assert.ok(q.prompt.includes(text)||q.family==='order',`dado ausente do enunciado: ${q.family}: ${text}`);
  let key=g.key,value=g.value;
  if(['iso','isobar','isochor','general'].includes(q.family)){
   if(g.unit==='Pa')value/=101325;if(g.unit==='m³')value*=1000;if(g.unit==='°C')value+=273.15;
  }else if(q.family==='ideal'){
   if(g.unit==='atm')value*=101325;if(g.unit==='L')value/=1000;if(g.unit==='°C')value+=273.15;
  }else if(['work','expansion','compression','zeroWork','graph'].includes(q.family)){
   if(g.unit==='atm')value*=101325;if(g.unit==='L')value/=1000;if(g.unit==='kPa')value*=1000;
   if(key==='Pi')key='P';if(key==='Pf'&&p.Pf===undefined)key='P';if(key==='V')key='Vi';
  }else if(['internal','deltaU','workT','multi','rigid'].includes(q.family)){
   if(g.unit==='atm')value*=101325;if(g.unit==='L')value/=1000;if(g.unit==='°C')value+=273.15;
   key=({Pi:'P',Vi:'V',T:'Tf','ΔU':'dU'})[key]||key;
  }else if(['first','signs','adiabatic','cycle'].includes(q.family)){
   if(g.unit==='kJ')value*=1000;key=({'ΔU':'dU',Qrecebido:'heatIn',Qcedido:'heatOut'})[key]||key;
  }else if(q.family==='kinetic'||q.family==='internalConcept'){
   if(g.unit==='°C')value+=273.15;key=({Ti:'T1',Tf:'T2'})[key]||key;
  }else if(q.family==='units')key='v';
  else if(q.family==='order')key=({P1:'P',V1:'V',V2:'Vf'})[key]||key;
  if(typeof p[key]==='number')assert.ok(Math.abs(p[key]-value)<=Math.max(1,Math.abs(value))*1e-9,`cálculo usou um dado oculto diferente: ${q.family}/${g.key}: ${value} vs ${p[key]}`);
 }
}
for(const f of FAMILIES)test(`${f.id}: 1.000 instâncias, três níveis e cálculo independente`,()=>{
 const signatures=new Set(),targets=new Set();
 for(let i=0;i<1000;i++){
  const q=generateQuestion(f.id,Object.keys(LEVELS)[i%3],`qa-${i}`),expected=independentlyComputed(q);
  assert.ok(q.prompt&&q.steps.length&&q.hints.length===3&&q.concept,`${f.id} faltando explicação`);
  assert.doesNotMatch([q.prompt,...q.steps,...q.choices.map(c=>c.label)].join(' '),/\d+[.,]\d{3,}/,'mais de duas casas decimais na apresentação');
  assert.doesNotMatch(q.prompt,/Determine a volume|processo mantendo|\bem em\b/,'construção incoerente no enunciado');
  checkVisibleData(q);
  if(typeof expected==='number'){assert.ok(Number.isFinite(q.answer));assert.ok(Math.abs(q.answer-expected)<1e-7*Math.max(1,Math.abs(expected)),`${f.id} incorreto: ${q.answer} ≠ ${expected}`);}
  else assert.equal(q.answer,expected);
  assert.ok(q.choices.length>1);assert.equal(new Set(q.choices.map(c=>c.label)).size,q.choices.length,'alternativas com rótulos iguais');
  if(q.kind!=='order'){
   assert.equal(q.choices.filter(c=>checkAnswer(q,c.value).correct).length,1,'mais de uma alternativa equivalente');
   if(typeof q.answer==='number')assert.equal(q.choices.filter(c=>checkAnswer(q,c.label).correct).length,1,`arredondamento da alternativa ${f.id}`);
  }
  for(const key of ['P','P1','P2','Vi','Vf','V','V1','V2','T','T1','T2','Ti','Tf','n'])if(key in q.params)assert.ok(q.params[key]>0,`${key} inválida`);
  if(q.family==='iso')assert.ok(Math.abs(q.params.P1*q.params.V1-q.params.P2*q.params.V2)<1e-8);
  if(q.family==='expansion')assert.ok(q.answer>0);if(q.family==='compression')assert.ok(q.answer<0);if(q.family==='zeroWork')assert.equal(q.answer,0);
  signatures.add(q.signature);targets.add(q.params.target);
  if(i===0)assert.deepEqual(q,generateQuestion(f.id,'facil','qa-0'),'semente não reproduz a questão');
 }
 if(['iso','isobar','isochor','general','ideal','workT','internal','deltaU','first'].includes(f.id))assert.ok(targets.size>=3,`${f.id} não varia incógnitas`);
 if(!['tf','identify','internalConcept','kinetic','cycle'].includes(f.id))assert.ok(signatures.size>15,`${f.id} baixa variedade`);
});
test('Existem somente três níveis; os arredondamentos de duas casas são aceitos',()=>{
 assert.deepEqual(Object.keys(LEVELS),['facil','medio','dificil']);
 assert.throws(()=>generateQuestion('iso','outro-nivel','x'));
 for(const value of [1/3,2/3,311.625,-311.625,.004243,.02493,101325/3,123456789]){
  const q={answer:value,unit:'J'};assert.ok(checkAnswer(q,fmt(value)).correct,`${value} → ${fmt(value)}`);
  assert.doesNotMatch(fmt(value),/\d+[.,]\d{3,}/);
 }
 assert.equal(fmt(1.23456),'1,23');assert.equal(fmt(10),'10');assert.equal(fmt(-0),'0');
 assert.equal(fmt(1.005),'1,01');assert.equal(fmt(-1.005),'-1,01');assert.equal(fmt(2.675),'2,68');assert.equal(fmt(-303.975),'-303,98');
 assert.notEqual(roundForDisplay(.0005),0);
 assert.equal(checkAnswer({answer:1/30,unit:'mol'},'0,03').correct,true);
 assert.equal(checkAnswer({answer:1/30,unit:'mol'},'0,04').correct,false);
});
test('Simulado escolar preserva as 15 estruturas; equilibrado distribui os 5 módulos',()=>{
 const school=createExam({school:true,seed:'escolar'});assert.deepEqual(school.map(q=>q.family),SCHOOL_FAMILIES);assert.equal(new Set(school.map(q=>q.id)).size,15);
 for(const count of [5,10,15,20,30,45]){const e=createExam({count,seed:'balance-'+count});const n=[1,2,3,4,5].map(m=>e.filter(q=>q.module===m).length);assert.ok(Math.max(...n)-Math.min(...n)<=1,`módulos desequilibrados ${n}`);}
 const focus=createExam({count:10,focus:['iso','work'],seed:'foco'});assert.ok(focus.every(q=>['iso','work'].includes(q.family)));
});
test('Sequência equilibrada cobre todas as famílias uma vez antes de recomeçar',()=>{let bag=[],seen=[];for(let i=0;i<23;i++){const r=chooseFamily({bag,recent:seen});seen.push(r.id);bag=r.bag;}assert.equal(new Set(seen).size,23);});
test('Parser numérico: vírgula, ponto, notação científica, unidades e entradas inválidas',()=>{
 assert.equal(parseNumber('1,2e3 J','J').value,1200);assert.equal(parseNumber('1.2 × 10^3 J','J').value,1200);assert.equal(parseNumber('−2,5 kJ','J').value,-2500);assert.equal(parseNumber('1000 L','m³').value,1);assert.equal(parseNumber('1 atm','Pa').value,ATM);assert.equal(parseNumber('26,85 °C','K').value,300);
 assert.equal(parseNumber('2 K','J').valid,false);for(const v of ['','1/0','NaN','Infinity','<script>','2+2','2,3,4'])assert.equal(parseNumber(v).valid,false);
 assert.equal(nearAnswer(.00125,.00125),true);assert.equal(nearAnswer(.0013,.00125),false);
});
