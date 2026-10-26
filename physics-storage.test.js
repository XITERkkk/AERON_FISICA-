import test from 'node:test';import assert from 'node:assert/strict';
import {R,kelvin,litersToM3,atmToPa,idealSolve,isothermal,isobaric,isochoric,combined,gasWork,gasWorkT,internalEnergy,internalDelta,firstLaw,checkAnswer} from '../src/physics.js';
import {defaultProgress,addAttempt,summary,mastery,scheduleCard,validateProgress,finishExam,writeProgress,readProgress} from '../src/storage.js';
import {generateQuestion,createExam} from '../src/engine.js';import {labState,setLabValue,resetLab,labPath,labCalculations} from '../src/lab.js';
test('Casos de referência da Física e validação de entradas',()=>{
 assert.equal(isothermal(2,4,1.6),5);assert.equal(isobaric(3,300,450),4.5);assert.equal(isochoric(2,300,450),3);assert.equal(combined(2,3,300,2,400),4);
 assert.equal(gasWork(200000,.002,.005),600);assert.equal(gasWork(100000,.006,.002),-400);assert.equal(gasWorkT(2,300,350),831);assert.equal(internalEnergy(1,300),3739.5);assert.equal(internalDelta(1,300,400),1246.5);assert.equal(firstLaw(800,300),500);
 assert.equal(kelvin(26.85),300);assert.equal(litersToM3(1),.001);assert.equal(atmToPa(1),101325);assert.equal(idealSolve({n:1,T:300,V:.02493},'P'),100000);
 for(const fn of [()=>idealSolve({n:0,T:300,V:.01},'P'),()=>isothermal(1,2,0),()=>kelvin(-274),()=>internalEnergy(1,0)])assert.throws(fn);
});
test('Primeiras tentativas não duplicam estatísticas; revisão e importação preservam identidade',()=>{
 const d=defaultProgress(),q=generateQuestion('iso','facil','x');assert.equal(addAttempt(d,q,String(q.answer),{correct:true},{seconds:10}),true);assert.equal(addAttempt(d,q,'0',{correct:false}),false);assert.equal(summary(d).count,1);assert.equal(summary(d).accuracy,100);assert.notEqual(mastery(d,'iso').name,'Domínio consolidado');
 const copy=validateProgress(JSON.parse(JSON.stringify(d)));assert.deepEqual(copy.attempts,d.attempts);assert.throws(()=>validateProgress({version:2}));
 const invalid=JSON.parse(JSON.stringify(d));invalid.attempts.push({...invalid.attempts[0]});assert.equal(validateProgress(invalid).attempts.length,1);
 const backing=new Map();globalThis.localStorage={getItem:k=>backing.get(k)||null,setItem:(k,v)=>backing.set(k,v)};assert.equal(writeProgress(d),true);assert.equal(readProgress().attempts.length,1);delete globalThis.localStorage;
});
test('Repetição espaçada usa intervalos reais e restaura dificuldades',()=>{
 const d=defaultProgress(),now=1000000;let r=scheduleCard(d,'f-iso','correct',now);assert.equal(r.due,now+86400000);r=scheduleCard(d,'f-iso','correct',now+86400000);assert.equal(r.box,2);assert.equal(r.due,now+4*86400000);r=scheduleCard(d,'f-iso','hard',now);assert.equal(r.due,now+600000);r=scheduleCard(d,'f-iso','wrong',now);assert.equal(r.box,0);assert.equal(r.due,now+60000);
});
test('Progresso do antigo quarto nível migra sem perder respostas, identidades ou XP',()=>{
 const data=defaultProgress(),q=generateQuestion('iso','dificil','legacy');q.level='especialista';
 addAttempt(data,q,String(q.answer),{correct:true},{seconds:12});
 data.saved.push(structuredClone(q));
 data.activeExam={id:'retomar',startedAt:Date.now(),level:'especialista',questions:[structuredClone(q)],answers:{[q.id]:'1,23'}};
 const migrated=validateProgress(JSON.parse(JSON.stringify(data)));
 assert.equal(migrated.attempts[0].id,q.id);assert.equal(migrated.attempts[0].level,'dificil');assert.equal(migrated.attempts[0].question.level,'dificil');assert.equal(migrated.saved[0].level,'dificil');assert.equal(migrated.activeExam.level,'dificil');assert.equal(migrated.activeExam.questions[0].level,'dificil');assert.equal(migrated.activeExam.answers[q.id],'1,23');assert.equal(summary(migrated).xp,50);assert.equal(migrated.attempts[0].correct,true);
});
test('Correção do simulado, brancos, histórico e finalização idempotente',()=>{
 const d=defaultProgress(),questions=createExam({count:5,seed:'int'}),exam={id:'int',startedAt:Date.now()-1000,questions,answers:{[questions[0].id]:String(questions[0].answer)},times:{}};
 d.activeExam=exam;const r=finishExam(d,exam,checkAnswer);assert.equal(r.correct,1);assert.equal(r.results.filter(x=>x.blank).length,4);assert.equal(d.attempts.length,5);assert.equal(d.activeExam,null);finishExam(d,exam,checkAnswer);assert.equal(d.exams.length,1);assert.equal(d.attempts.length,5);
});
test('Controles e caminhos do laboratório obedecem à equação de estado e à primeira lei',()=>{
 for(const process of ['iso','isobar','isochor']){resetLab();labState.process=process;setLabValue(process==='iso'?'V':'T',process==='iso'?.004:450);const points=labPath();for(const s of points){assert.ok(Math.abs(s.P*s.V-labState.n*R*s.T)<1e-8);if(process==='iso')assert.equal(s.T,300);if(process==='isobar')assert.equal(s.P,100000);if(process==='isochor')assert.equal(s.V,.002493);}const c=labCalculations();assert.ok(Math.abs(c.Q-c.W-c.dU)<1e-7);if(process==='iso')assert.equal(c.dU,0);if(process==='isochor')assert.equal(c.W,0);}
});
