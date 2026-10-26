export const STORAGE_KEY='aerion-progress-v1';
export const defaultProgress=()=>({version:1,attempts:[],studied:[],lastModule:1,saved:[],exams:[],activeExam:null,cards:{},reviews:[],notes:{},reviewFormulas:[],settings:{theme:'light',reduced:false,scene:'3d',name:'Bryan',hideSteps:false},createdAt:Date.now()});
let memoryProgress=defaultProgress();
export let persistenceAvailable=true;
export function readProgress(){
  try{if(typeof localStorage==='undefined')return memoryProgress;const raw=localStorage.getItem(STORAGE_KEY);return raw?validateProgress(JSON.parse(raw)):defaultProgress();}
  catch{persistenceAvailable=false;return defaultProgress();}
}
export function writeProgress(data){
  memoryProgress=data;
  try{if(typeof localStorage!=='undefined')localStorage.setItem(STORAGE_KEY,JSON.stringify(data));persistenceAvailable=true;return true;}
  catch{persistenceAvailable=false;return false;}
}
export function validateProgress(x){
  if(!x||x.version!==1||!Array.isArray(x.attempts)||!Array.isArray(x.studied)||!x.settings||!x.cards)throw new Error('Arquivo de progresso AERION inválido.');
  if(x.attempts.length>20000||JSON.stringify(x).length>20000000)throw new Error('Arquivo de progresso muito grande.');
  const base=defaultProgress(),out={...base,...x};
  out.attempts=x.attempts.filter(a=>a&&typeof a.id==='string'&&typeof a.family==='string'&&typeof a.correct==='boolean'&&Number.isFinite(a.at)&&Number.isFinite(a.seconds)&&a.seconds>=0&&Number.isFinite(a.hints)&&a.hints>=0);
  out.attempts=[...new Map(out.attempts.map(a=>[a.id,a])).values()];
  out.studied=[...new Set(x.studied.filter(n=>Number.isInteger(n)&&n>=1&&n<=6))];
  out.settings={...base.settings,...x.settings};out.settings.theme=out.settings.theme==='dark'?'dark':'light';out.settings.name=String(out.settings.name||'Explorador').slice(0,40);
  out.settings.scene=out.settings.scene==='2d'?'2d':'3d';out.settings.reduced=!!out.settings.reduced;
  out.cards=Object.fromEntries(Object.entries(x.cards).filter(([k,v])=>/^[fc]-[a-zA-Z0-9]+$/.test(k)&&v&&Number.isFinite(v.due)&&Number.isFinite(v.box)&&v.box>=0&&v.box<=5));
  for(const key of ['saved','exams','reviews','reviewFormulas'])if(!Array.isArray(out[key]))out[key]=[];
  out.saved=out.saved.filter(q=>q&&typeof q.id==='string'&&typeof q.prompt==='string'&&Array.isArray(q.steps)&&Array.isArray(q.choices)&&q.params&&q.hints&&typeof q.formulaId==='string'&&(Number.isFinite(q.answer)||typeof q.answer==='string'));
  out.exams=out.exams.filter(e=>e&&typeof e.id==='string'&&Array.isArray(e.questions)&&e.questions.length>0&&e.questions.length<=100&&Array.isArray(e.results)&&Number.isFinite(e.at));
  out.reviews=out.reviews.filter(r=>r&&typeof r.id==='string'&&Number.isFinite(r.at)&&Number.isFinite(r.box));
  if(!out.notes||typeof out.notes!=='object'||Array.isArray(out.notes))out.notes={};
  if(out.activeExam&&(!Array.isArray(out.activeExam.questions)||!out.activeExam.answers||!Number.isFinite(out.activeExam.startedAt)||out.activeExam.questions.length>100||out.activeExam.questions.some(q=>!q||!Array.isArray(q.choices)||!q.params||!Array.isArray(q.steps))))out.activeExam=null;
  // Compatibilidade com o antigo quarto nível, sem apagar provas, respostas ou pontos.
  const migrateLevel=item=>{if(item&&item.level==='especialista')item.level='dificil';};
  for(const attempt of out.attempts){
    if(attempt.level==='especialista'&&!Number.isFinite(attempt.earnedXp))attempt.earnedXp=attempt.correct?(attempt.hints?5:50):2;
    migrateLevel(attempt);migrateLevel(attempt.question);
  }
  out.saved.forEach(migrateLevel);
  for(const exam of [...out.exams,...(out.activeExam?[out.activeExam]:[])]){migrateLevel(exam);exam.questions.forEach(migrateLevel);}
  return out;
}
export function addAttempt(data,q,input,result,{seconds=0,hints=0,source='arena'}={}){
  if(data.attempts.some(a=>a.id===q.id))return false;
  data.attempts.push({id:q.id,family:q.family,formulaId:q.formulaId,module:q.module,level:q.level,correct:!!result.correct,input:String(input),hints,seconds:Math.max(0,seconds),source,at:Date.now(),signature:q.signature,question:q});
  return true;
}
export function summary(data){
  const count=data.attempts.length,correct=data.attempts.filter(x=>x.correct).length;
  return {count,correct,accuracy:count?Math.round(correct*100/count):0,xp:data.attempts.reduce((s,a)=>s+(Number.isFinite(a.earnedXp)?a.earnedXp:a.correct?(a.hints?5:({facil:10,medio:20,dificil:35}[a.level]||10)):2),0)+data.studied.length*30,seconds:data.attempts.reduce((s,a)=>s+a.seconds,0)};
}
export function mastery(data,formulaId){
  const all=data.attempts.filter(a=>a.formulaId===formulaId),a=all.slice(-15),independent=a.filter(x=>x.hints===0),success=independent.filter(x=>x.correct),accuracy=independent.length?success.length/independent.length:0;
  if(!all.length)return {name:'Não iniciado',value:0,accuracy:0,count:0};
  const varieties=new Set(success.map(x=>x.signature)).size,days=new Set(success.map(x=>new Date(x.at).toLocaleDateString('pt-BR'))).size,levels=new Set(success.map(x=>x.level)).size;
  const formulaReviews=data.reviews.filter(r=>r.id===`f-${formulaId}`),retention=formulaReviews.some((r,i)=>r.rating==='correct'&&formulaReviews.slice(0,i).some(previous=>r.at-previous.at>=864e5)),last=all.at(-1).at,stale=Date.now()-last>14*864e5;
  let value=Math.min(94,Math.round(accuracy*Math.min(independent.length,10)*7+Math.min(varieties,5)*4));
  let name=independent.length<3?'Em aprendizado':independent.length<6?'Em prática':accuracy>=.8?'Bom domínio':'Em prática';
  if(independent.length>=10&&accuracy>=.9&&varieties>=5&&days>=2&&levels>=2&&retention){name='Domínio consolidado';value=100;}
  if((all.length>=5&&accuracy<.55)||stale){name='Revisão recomendada';value=Math.min(value,55);}
  return {name,value,accuracy:Math.round(accuracy*100),count:all.length};
}
export function scheduleCard(data,id,rating,now=Date.now()){
  const previous=data.cards[id]||{box:0,due:now,seen:0};
  const box=rating==='correct'?Math.min(5,previous.box+1):rating==='hard'?Math.max(0,previous.box-1):0;
  const interval=rating==='wrong'?60000:rating==='hard'?600000:[0,1,3,7,14,30][box]*864e5;
  data.cards[id]={box,due:now+interval,seen:previous.seen+1,last:now,rating};
  data.reviews.push({id,at:now,box,rating});return data.cards[id];
}
export function dueCards(data,cards,now=Date.now()){return cards.filter(c=>!data.cards[c.id]||data.cards[c.id].due<=now).sort((a,b)=>(data.cards[a.id]?.due||0)-(data.cards[b.id]?.due||0));}
export function finishExam(data,exam,checker){
  if(data.exams.some(e=>e.id===exam.id))return data.exams.find(e=>e.id===exam.id);
  const elapsed=Math.max(0,(Date.now()-exam.startedAt)/1000),results=exam.questions.map(q=>{const response=exam.answers[q.id];const result=response==null?{correct:false,valid:true}:checker(q,response);addAttempt(data,q,response??'',result,{seconds:(exam.times?.[q.id]||0),source:'exam'});return {id:q.id,input:response??'',correct:!!result.correct,blank:response==null};});
  const report={...exam,results,seconds:elapsed,at:Date.now(),correct:results.filter(x=>x.correct).length};data.exams.push(report);data.activeExam=null;return report;
}
