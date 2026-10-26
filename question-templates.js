import {R,ATM,fmt,roundForDisplay,idealSolve,internalEnergy,internalDelta,gasWork,gasWorkT} from './physics.js';
import {MAIN_FORMULAS,formulaById} from './content.js';

const stateNames={P1:'pressão inicial P₁',P2:'pressão final P₂',V1:'volume inicial V₁',V2:'volume final V₂',T1:'temperatura inicial T₁',T2:'temperatura final T₂'};
const symbol={P1:'P₁',P2:'P₂',V1:'V₁',V2:'V₂',T1:'T₁',T2:'T₂'};
const targetUnits=k=>k.startsWith('P')?'atm':k.startsWith('V')?'L':'K';

/** Os dados são quantizados ANTES do cálculo: o gabarito usa somente o que está visível. */
function given(q,key,value,unit){
  const displayed=roundForDisplay(value);
  q.givens.push({key,value:displayed,unit});
  return displayed;
}
const showGiven=g=>`${g.key} = ${fmt(g.value)} ${g.unit}`;
function knownStep(q){return `Dados do enunciado: ${q.givens.map(showGiven).join('; ')}.`;}
function temperatureGiven(q,key,t,celsius){return celsius?given(q,key,t-273.15,'°C')+273.15:given(q,key,t,'K');}
const temperatureLabel=(q,key)=>{const g=q.givens.find(d=>d.key===key);return `${fmt(g.value)} ${g.unit}`;};
function conversionSteps(q){return q.givens.filter(g=>g.unit==='°C').map(g=>`${g.key}: ${fmt(g.value)} + 273,15 = ${fmt(g.value+273.15)} K.`);}
function solveLaw(p,family,k){
  if(family==='iso')return {P1:()=>p.P2*p.V2/p.V1,V1:()=>p.P2*p.V2/p.P1,P2:()=>p.P1*p.V1/p.V2,V2:()=>p.P1*p.V1/p.P2}[k]();
  if(family==='isobar')return {V1:()=>p.V2*p.T1/p.T2,T1:()=>p.T2*p.V1/p.V2,V2:()=>p.V1*p.T2/p.T1,T2:()=>p.T1*p.V2/p.V1}[k]();
  if(family==='isochor')return {P1:()=>p.P2*p.T1/p.T2,T1:()=>p.T2*p.P1/p.P2,P2:()=>p.P1*p.T2/p.T1,T2:()=>p.T1*p.P2/p.P1}[k]();
  return {P1:()=>p.P2*p.V2*p.T1/(p.T2*p.V1),V1:()=>p.P2*p.V2*p.T1/(p.T2*p.P1),T1:()=>p.P1*p.V1*p.T2/(p.P2*p.V2),P2:()=>p.P1*p.V1*p.T2/(p.T1*p.V2),V2:()=>p.P1*p.V1*p.T2/(p.T1*p.P2),T2:()=>p.P2*p.V2*p.T1/(p.P1*p.V1)}[k]();
}
function lawCalculation(p,family,k){
  const f=Object.fromEntries(Object.entries(p).map(([key,v])=>[key,fmt(v)]));
  const expr=family==='iso'?{P1:`${f.P2} × ${f.V2}/${f.V1}`,V1:`${f.P2} × ${f.V2}/${f.P1}`,P2:`${f.P1} × ${f.V1}/${f.V2}`,V2:`${f.P1} × ${f.V1}/${f.P2}`}:
    family==='isobar'?{V1:`${f.V2} × ${f.T1}/${f.T2}`,T1:`${f.T2} × ${f.V1}/${f.V2}`,V2:`${f.V1} × ${f.T2}/${f.T1}`,T2:`${f.T1} × ${f.V2}/${f.V1}`}:
    family==='isochor'?{P1:`${f.P2} × ${f.T1}/${f.T2}`,T1:`${f.T2} × ${f.P1}/${f.P2}`,P2:`${f.P1} × ${f.T2}/${f.T1}`,T2:`${f.T1} × ${f.P2}/${f.P1}`}:
    {P1:`(${f.P2} × ${f.V2} × ${f.T1})/(${f.T2} × ${f.V1})`,V1:`(${f.P2} × ${f.V2} × ${f.T1})/(${f.T2} × ${f.P1})`,T1:`(${f.P1} × ${f.V1} × ${f.T2})/(${f.P2} × ${f.V2})`,P2:`(${f.P1} × ${f.V1} × ${f.T2})/(${f.T1} × ${f.V2})`,V2:`(${f.P1} × ${f.V1} × ${f.T2})/(${f.T1} × ${f.P2})`,T2:`(${f.P2} × ${f.V2} × ${f.T1})/(${f.P1} × ${f.V1})`};
  return `${symbol[k]} = ${expr[k]} ≈ ${fmt(p[k])} ${targetUnits(k)}.`;
}
function lawQuestion(q,{pick,shuffle,medium,hard}){
  const family=q.family,P1=pick(medium?[.75,1.25,1.5,2.5,3,4.5]:[1,2,3,4]),V1=pick([2,4,6,8,10,12]),T1=pick([240,300,320,400]),T2=T1*pick([1.25,1.5,2]),V2=V1*pick(medium?[.5,1.5,2,3]:[.5,2]);
  const p={P1,V1,T1,P2:0,V2,T2};
  if(family==='iso'){p.T2=T1;p.P2=P1*V1/V2;}
  if(family==='isobar'){p.P2=P1;p.V2=V1*T2/T1;}
  if(family==='isochor'){p.V2=V1;p.P2=P1*T2/T1;}
  if(family==='general')p.P2=P1*V1*T2/(T1*V2);
  const keys={iso:['P1','V1','P2','V2'],isobar:['V1','T1','V2','T2'],isochor:['P1','T1','P2','T2'],general:['P1','V1','T1','P2','V2','T2']}[family];
  const target=medium?pick(keys):{iso:'P2',isobar:'V2',isochor:'P2',general:'P2'}[family];
  const givenKeys=medium?shuffle(keys.filter(k=>k!==target)):keys.filter(k=>k!==target);
  const data=givenKeys.map(k=>{
    let value=p[k],unit=targetUnits(k);
    if(medium&&k.startsWith('T')){unit='°C';value-=273.15;}
    else if(hard&&k==='P1'){unit='Pa';value*=ATM;}
    else if(hard&&k==='V1'){unit='m³';value/=1000;}
    const visible=given(q,k,value,unit);
    p[k]=unit==='°C'?visible+273.15:unit==='Pa'?visible/ATM:unit==='m³'?visible*1000:visible;
    return `${stateNames[k]} = ${fmt(visible)} ${unit}`;
  });
  p[target]=solveLaw(p,family,target);
  if(family==='iso')p.T2=p.T1;
  if(family==='isobar')p.P2=p.P1;
  if(family==='isochor')p.V2=p.V1;
  const stems={iso:pick(['Uma amostra fixa de gás ideal sofre uma transformação a temperatura constante.','Um gás ideal é mantido em contato com um reservatório térmico, sem mudar de temperatura nem perder matéria.']),isobar:pick(['Uma amostra fixa de gás ideal sofre uma transformação sob pressão constante.','Um cilindro com êmbolo móvel contém uma quantidade fixa de gás ideal. Durante o processo, a pressão se mantém constante.']),isochor:pick(['Um recipiente rígido e fechado contém uma amostra de gás ideal. O volume permanece constante.','Uma amostra de gás ideal é aquecida em um recipiente rígido, fechado e sem vazamentos.']),general:'Uma quantidade fixa de gás ideal passa de um estado inicial para um estado final. Compare os dois estados usando os dados a seguir.'};
  q.prompt=`${stems[family]} Dados: ${data.join('; ')}. Determine ${target.startsWith('V')?'o':'a'} ${stateNames[target]} em ${targetUnits(target)}.`;
  q.params={...p,target};q.answer=p[target];q.unit=targetUnits(target);q.quantity=target.startsWith('P')?'pressure':target.startsWith('V')?'volume':'temperature';
  const f=formulaById(family),isolation=f.isolate.find(s=>s.startsWith(symbol[target]))||f.equation;
  q.steps=[`Condição física: ${f.constant.toLowerCase()}.`,knownStep(q),...conversionSteps(q),...q.givens.filter(g=>g.unit==='Pa'||g.unit==='m³').map(g=>`${symbol[g.key]} = ${fmt(p[g.key])} ${targetUnits(g.key)}, na mesma unidade do outro estado.`),`Use ${f.equation}. Isole a incógnita: ${isolation}.`,lawCalculation(p,family,target)];
  q.concept=f.why;q.hints=[f.cue,`A grandeza que não muda é: ${f.constant.toLowerCase()}.`,`${f.equation}. Organize as unidades e isole ${symbol[target]}.`];
  if(family==='iso'&&target==='P2')return [{value:p.P1*p.V2/p.V1,error:'A razão entre os volumes foi invertida. Em temperatura constante, P e V variam inversamente.'},{value:p.P1,error:'A pressão foi mantida igual, embora o volume tenha mudado.'}];
  if(family==='isobar'&&target==='V2')return [{value:p.V1*p.T1/p.T2,error:'A razão entre as temperaturas foi invertida.'},{value:p.V1*(p.T2-273.15)/(p.T1-273.15),error:'Foram usadas temperaturas em Celsius em uma razão que exige Kelvin.'}];
  if(family==='isochor'&&target==='P2')return [{value:p.P1*p.T1/p.T2,error:'A razão entre as temperaturas foi invertida.'},{value:p.P1*(p.T2-273.15)/(p.T1-273.15),error:'Foram usadas temperaturas em Celsius em uma razão que exige Kelvin.'}];
  return [];
}
function idealQuestion(q,{pick,medium,hard}){
  const target=medium?pick(['P','V','n','T']):'P',p={n:pick([.5,1,2]),T:pick([250,300,350,400]),V:pick([.005,.01,.02,.04])};p.P=idealSolve(p,'P');
  const units={P:hard?'atm':'Pa',V:'L',n:'mol',T:medium?'°C':'K'},data=[];
  for(const key of ['P','V','n','T'].filter(k=>k!==target)){
    const v=key==='P'&&hard?p.P/ATM:key==='V'?p.V*1000:key==='T'&&medium?p.T-273.15:p[key],visible=given(q,key,v,units[key]);
    p[key]=key==='P'&&hard?visible*ATM:key==='V'?visible/1000:key==='T'&&medium?visible+273.15:visible;
    data.push(`${key} = ${fmt(visible)} ${units[key]}`);
  }
  p[target]=idealSolve(p,target);q.params={...p,target};q.unit=target==='V'?'L':{P:'Pa',n:'mol',T:'K'}[target];q.answer=target==='V'?p.V*1000:p[target];q.quantity={P:'pressure',V:'volume',n:'amount',T:'temperature'}[target];
  const names={P:'a pressão absoluta',V:'o volume',n:'a quantidade de matéria',T:'a temperatura absoluta'};
  q.prompt=`Uma amostra de gás ideal tem ${data.join('; ')}. Determine ${names[target]} em ${q.unit}. Use R = 8,31 J/(mol·K).`;
  q.steps=[knownStep(q),...conversionSteps(q),'Use Pa, m³, mol e K em PV = nRT. Para o volume dado em litros, use V(L) × 10⁻³.',...q.givens.filter(g=>g.unit==='atm').map(g=>`P = ${fmt(g.value)} × 101325 = ${fmt(p.P)} Pa.`),`Isole a variável: ${formulaById('ideal').isolate.find(s=>s.startsWith(target))}.`,`${target} ≈ ${fmt(q.answer)} ${q.unit}.`];q.concept=formulaById('ideal').why;
  return [];
}
function workQuestion(q,{pick,medium,hard,rng}){
  const family=q.family;let P=(hard&&family!=='graph'?pick([1,1.5,2])*ATM:pick([100000,150000,200000,300000])),Vi=pick([2,4,6,8])/1000,Vf=Vi+pick([1,2,4])/1000;
  if(family==='compression'||(['work','graph'].includes(family)&&medium&&rng()<.5))Vf=Vi/2;
  if(family==='zeroWork')Vf=Vi;
  let Pf=P,W=gasWork(P,Vi,Vf),target=family==='work'&&hard?pick(['W','P','Vf']):'W';
  if(family==='graph'&&hard){Pf=P*pick([.5,1.5,2]);W=(P+Pf)*(Vf-Vi)/2;}
  if(family==='graph'){
    given(q,'Vi',Vi*1000,'L');given(q,'Vf',Vf*1000,'L');given(q,'Pi',P/1000,'kPa');given(q,'Pf',Pf/1000,'kPa');
    q.prompt=`O gráfico mostra a trajetória de uma amostra de gás, percorrida de A para B de forma quase-estática. A: ${fmt(Vi*1000)} L e ${fmt(P/1000)} kPa. B: ${fmt(Vf*1000)} L e ${fmt(Pf/1000)} kPa. Determine o trabalho realizado pelo gás, em J. Use o sentido indicado para definir o sinal.`;
    q.graph={xLabel:'Volume (L)',yLabel:'Pressão (kPa)',points:[[Vi*1000,P/1000],[Vf*1000,Pf/1000]],shade:true};
    q.steps=['No gráfico P × V, o trabalho quase-estático é a área algébrica sob a trajetória.','Converta kPa para Pa (× 1000) e L para m³ (× 10⁻³).',hard?'A trajetória é reta: W = (Pi + Pf)(Vf − Vi)/2.':'A pressão é constante: W = P(Vf − Vi).',`ΔV = (${fmt(Vf*1000)} − ${fmt(Vi*1000)}) × 10⁻³ m³.`,`W ≈ ${fmt(W)} J.`,Vf>Vi?'A expansão tem trabalho positivo.':'A compressão tem trabalho negativo.'];
  }else if(family==='zeroWork'){
    const Ti=pick([250,300,400]),Tf=Ti+pick([40,80,100]);given(q,'V',Vi*1000,'L');given(q,'Ti',Ti,'K');given(q,'Tf',Tf,'K');
    q.prompt=`Uma amostra de gás é aquecida de ${Ti} K para ${Tf} K em um recipiente rígido e fechado, de volume ${fmt(Vi*1000)} L. Determine o trabalho de expansão ou compressão realizado pelo gás, em J.`;
    q.steps=['O recipiente é rígido: o volume final é igual ao inicial.','ΔV = 0. Portanto, o trabalho de expansão/compressão é W = 0 J.','A temperatura pode mudar mesmo sem trabalho de expansão ou compressão.'];
  }else{
    const pressureUnit=hard?'atm':'Pa',pressureValue=hard?P/ATM:P;
    if(target!=='P')given(q,'P',pressureValue,pressureUnit);given(q,'Vi',Vi*1000,'L');if(target!=='Vf')given(q,'Vf',Vf*1000,'L');
    if(target!=='W'){
      W=given(q,'W',W,'J');
      if(target==='P')P=W/(Vf-Vi);
      if(target==='Vf')Vf=Vi+W/P;
    }
    const pd=`${fmt(pressureValue)} ${pressureUnit}`,action=Vf>Vi?'se expande':'é comprimida';
    q.prompt=target==='W'?`Uma amostra de gás ${action} de ${fmt(Vi*1000)} L para ${fmt(Vf*1000)} L sob pressão constante de ${pd}. O processo é quase-estático. Calcule o trabalho realizado pelo gás, em J.`:target==='P'?`Uma amostra de gás passa de ${fmt(Vi*1000)} L para ${fmt(Vf*1000)} L sob pressão constante e realiza ${fmt(W)} J de trabalho. Qual é a pressão, em Pa?`:`Uma amostra de gás ocupa inicialmente ${fmt(Vi*1000)} L. Sob pressão constante de ${pd}, o trabalho realizado pelo gás é ${fmt(W)} J. Determine o volume final em L.`;
    q.steps=[knownStep(q),...(hard&&target!=='P'?[`P = ${fmt(pressureValue)} × 101325 = ${fmt(P)} Pa.`]:[]),'Na fórmula W = PΔV, use ΔV em m³. Cada litro corresponde a 10⁻³ m³.',target==='W'?`W = ${fmt(P)} × (${fmt(Vf*1000)} − ${fmt(Vi*1000)}) × 10⁻³ ≈ ${fmt(W)} J.`:target==='P'?`P = W/ΔV = ${fmt(W)}/[(${fmt(Vf*1000)} − ${fmt(Vi*1000)}) × 10⁻³] ≈ ${fmt(P)} Pa.`:`Vf = Vi + W/P. Em litros: Vf = ${fmt(Vi*1000)} + (${fmt(W)}/${fmt(P)}) × 1000 ≈ ${fmt(Vf*1000)} L.`];
  }
  q.params={P,Vi,Vf,W,target,...(family==='graph'&&hard?{Pf}:{})};q.unit=target==='P'?'Pa':target==='Vf'?'L':'J';q.answer=target==='P'?P:target==='Vf'?Vf*1000:W;q.quantity=target==='P'?'pressure':target==='Vf'?'volume':'energy';
  q.concept=family==='zeroWork'?'O trabalho de fronteira é nulo quando não há mudança de volume.':family==='graph'&&hard?'A pressão varia linearmente no trajeto desenhado. Use a área de um trapézio, com sinal dado pelo sentido de A para B.':Vf>Vi?'O gás se expande e realiza trabalho positivo sobre o ambiente.':'Na compressão, o trabalho realizado pelo gás é negativo; o ambiente realiza trabalho sobre ele.';
  return target==='W'?[{value:-W,error:'O sinal foi invertido em relação ao sentido da variação de volume.'},{value:W*1000,error:'O volume em litros foi usado como se estivesse em m³.'},{value:family==='graph'&&hard?P*(Vf-Vi):P*(Vf+Vi),error:family==='graph'&&hard?'Foi usada a pressão inicial como se ela permanecesse constante.':'Foi somado o volume inicial ao final em vez de fazer a subtração.'}]:[];
}
function monoQuantities(n,Ti,Tf,rigid=false){const U=internalEnergy(n,Tf),dU=internalDelta(n,Ti,Tf),W=rigid?0:gasWorkT(n,Ti,Tf);return {n,Ti,Tf,dT:Tf-Ti,U,dU,W,Q:dU+W};}
function monoQuestion(q,{pick,medium,hard}){
  const family=q.family;let n=pick([.5,1,2,3]),Ti=pick([250,300,350,400]),Tf=Ti+pick(medium?[-100,-50,40,80,150]:[40,100,200]);let p=monoQuantities(n,Ti,Tf,family==='rigid');
  if(family==='internal'){
    const target=medium?pick(['U','T','n']):'U';let U=p.U;
    if(target!=='n')n=given(q,'n',n,'mol');
    if(target!=='T')Tf=temperatureGiven(q,'T',Tf,medium);
    if(target!=='U')U=given(q,'U',U,'J');
    if(target==='U')U=internalEnergy(n,Tf);if(target==='T')Tf=U/(1.5*n*R);if(target==='n')n=U/(1.5*R*Tf);
    p=monoQuantities(n,Ti,Tf);p.target=target;q.params=p;q.answer=target==='U'?U:target==='T'?Tf:n;q.unit=target==='U'?'J':target==='T'?'K':'mol';q.quantity=target==='U'?'energy':target==='T'?'temperature':'amount';
    const desc=target==='U'?`tem ${fmt(n)} mol e está a ${temperatureLabel(q,'T')}`:target==='T'?`tem ${fmt(n)} mol e energia interna de ${fmt(U)} J`:`está a ${temperatureLabel(q,'T')} e tem energia interna de ${fmt(U)} J`;
    q.prompt=`Uma amostra de gás ideal monoatômico ${desc}. Determine ${target==='U'?'a energia interna U':target==='T'?'a temperatura absoluta':'a quantidade de matéria'} em ${q.unit}. Use R = 8,31 J/(mol·K).`;
    q.steps=[knownStep(q),...conversionSteps(q),'Para gás ideal monoatômico: U = (3/2)nRT.',target==='U'?`U = 1,5 × ${fmt(n)} × 8,31 × ${fmt(Tf)} ≈ ${fmt(U)} J.`:target==='T'?`T = 2U/(3nR) = (2 × ${fmt(U)})/(3 × ${fmt(n)} × 8,31) ≈ ${fmt(Tf)} K.`:`n = 2U/(3RT) = (2 × ${fmt(U)})/(3 × 8,31 × ${fmt(Tf)}) ≈ ${fmt(n)} mol.`];q.concept=formulaById('internal').why;return [];
  }
  if(family==='multi'){
    let P=100000,V;
    if(hard){
      P=given(q,'Pi',pick([1,1.5,2]),'atm')*ATM;V=given(q,'Vi',pick([4,8,12]),'L')/1000;
      Ti=temperatureGiven(q,'Ti',Ti,true);Tf=temperatureGiven(q,'Tf',Ti*pick([.5,1.5,2]),true);n=P*V/(R*Ti);
    }else{n=given(q,'n',n,'mol');Ti=temperatureGiven(q,'Ti',Ti,medium);Tf=temperatureGiven(q,'Tf',Tf,medium);V=n*R*Ti/P;}
    p={...monoQuantities(n,Ti,Tf),P,V,target:hard?pick(['Q','dU','W']):'Q'};q.params=p;q.answer=p[p.target];q.unit='J';q.quantity='energy';
    q.prompt=`Uma amostra de gás ideal monoatômico ${hard?`ocupa inicialmente ${fmt(V*1000)} L sob ${fmt(P/ATM)} atm, a ${temperatureLabel(q,'Ti')}`:`tem ${fmt(n)} mol e está inicialmente a ${temperatureLabel(q,'Ti')}`}. Ela passa para ${temperatureLabel(q,'Tf')} sob pressão constante, em um processo quase-estático. Determine ${p.target==='Q'?'o calor Q trocado':p.target==='dU'?'a variação de energia interna ΔU':'o trabalho W realizado pelo gás'}, em J. Adote Q positivo quando recebido e W positivo quando realizado pelo gás. Use R = 8,31 J/(mol·K).`;
    q.steps=[knownStep(q),...conversionSteps(q),`ΔT = ${fmt(Tf)} − ${fmt(Ti)} = ${fmt(Tf-Ti)} K.`,...(hard?['De PiVi = nRTi, obtenha nR = PiVi/Ti. Substitua essa razão diretamente para não arredondar n.',`Pi = ${fmt(P)} Pa; Vi = ${fmt(V*1000)} × 10⁻³ m³.`]:[]),`Na isobárica, W = ${hard?'(PiVi/Ti)':'nR'}ΔT ≈ ${fmt(p.W)} J.`,`Para gás ideal monoatômico, ΔU = (3/2)${hard?'(PiVi/Ti)':'nR'}ΔT ≈ ${fmt(p.dU)} J.`,`Pela primeira lei, Q = ΔU + W = (5/2)${hard?'(PiVi/Ti)':'nR'}ΔT ≈ ${fmt(p.Q)} J.`,`Grandeza pedida: ${p.target==='dU'?'ΔU':p.target} ≈ ${fmt(q.answer)} J.`];
    q.concept=Tf>Ti?'O gás aquece e se expande. O calor recebido aumenta a energia interna e fornece o trabalho.':'O gás esfria e é comprimido sob pressão constante. Q, ΔU e o trabalho realizado pelo gás são negativos.';
    return [{value:p.target==='Q'?p.dU:p.Q,error:'Calor e variação de energia interna foram confundidos.'},{value:p.target==='Q'?p.W:p.W-p.dU,error:'O balanço Q = ΔU + W não foi completado corretamente.'}];
  }
  const target=hard&&family!=='rigid'?pick(['energy','Tf','n']):'energy',factor=family==='workT'?1:1.5,label=family==='workT'?'W':family==='rigid'?'Q':'ΔU';let energy=family==='workT'?p.W:p.dU;
  if(target!=='n')n=given(q,'n',n,'mol');Ti=temperatureGiven(q,'Ti',Ti,medium);if(target!=='Tf')Tf=temperatureGiven(q,'Tf',Tf,medium);if(target!=='energy')energy=given(q,label,energy,'J');
  if(target==='energy')energy=factor*n*R*(Tf-Ti);if(target==='Tf')Tf=Ti+energy/(factor*n*R);if(target==='n')n=energy/(factor*R*(Tf-Ti));
  p={...monoQuantities(n,Ti,Tf,family==='rigid'),target};q.params=p;q.answer=target==='energy'?energy:target==='Tf'?Tf:n;q.unit=target==='Tf'?'K':target==='n'?'mol':'J';q.quantity=target==='Tf'?'temperature':target==='n'?'amount':'energy';
  const condition=family==='workT'?'gás ideal sofre um processo quase-estático sob pressão constante':family==='rigid'?'gás ideal monoatômico está em um recipiente rígido e fechado, sem outros tipos de trabalho':'gás ideal monoatômico sofre uma mudança de estado, sem perda de matéria';
  const info=target==='Tf'?`A amostra tem ${fmt(n)} mol, parte de ${temperatureLabel(q,'Ti')} e apresenta ${label} = ${fmt(energy)} J.`:target==='n'?`A temperatura passa de ${temperatureLabel(q,'Ti')} para ${temperatureLabel(q,'Tf')}, com ${label} = ${fmt(energy)} J.`:`A amostra tem ${fmt(n)} mol e sua temperatura passa de ${temperatureLabel(q,'Ti')} para ${temperatureLabel(q,'Tf')}.`;
  q.prompt=`Uma amostra de ${condition}. ${info} Determine ${target==='energy'?(family==='rigid'?'o calor Q trocado':label):target==='Tf'?'a temperatura final':'a quantidade de matéria'} em ${q.unit}. ${family==='rigid'?'Adote Q positivo quando recebido pelo gás. ':family==='workT'?'Adote W positivo quando realizado pelo gás. ':''}Use R = 8,31 J/(mol·K).`;
  const eq=family==='workT'?'W = nRΔT':'ΔU = (3/2)nRΔT';
  q.steps=[knownStep(q),...conversionSteps(q),...(family==='rigid'?['O volume não varia e não há outros trabalhos: W = 0. Pela primeira lei, Q = ΔU.']:[]),`Use ${eq}.`,target==='Tf'?`Tf = Ti + ${label}/(${factor===1?'':'1,5 × '}nR) ≈ ${fmt(Tf)} K.`:target==='n'?`n = ${label}/(${factor===1?'':'1,5 × '}RΔT) ≈ ${fmt(n)} mol.`:`ΔT = ${fmt(Tf)} − ${fmt(Ti)} = ${fmt(Tf-Ti)} K; ${label} ≈ ${fmt(energy)} J.`];
  q.concept=family==='rigid'?'Com W = 0, o calor trocado é igual à variação de energia interna.':formulaById(family==='workT'?'workT':'deltaU').why;
  return target==='energy'?[{value:-energy,error:'Foi invertido o sinal da variação de temperatura.'},{value:p.U,error:'Foi calculada a energia interna final, em vez da variação.'},{value:family==='workT'?p.dU:p.W,error:'O fator 3/2 foi aplicado à grandeza errada.'}]:target==='Tf'?[{value:Math.abs(Tf-Ti),error:'Foi respondida a variação em vez da temperatura final.'},{value:Tf-273.15,error:'Foi usada a temperatura em Celsius em vez de Kelvin.'}]:[];
}
function energyBalanceQuestion(q,{pick,medium,hard}){
  const family=q.family;let Q=pick([200,400,600,800,1000])*(medium?pick([-1,1]):1),W=pick([100,150,250,300])*(medium?pick([-1,1]):1),dU=Q-W,target=family==='cycle'?(medium?'Q':'dU'):family==='adiabatic'?pick(['dU','W']):medium?pick(['dU','Q','W']):'dU';
  if(family==='adiabatic'){Q=0;dU=-W;}if(family==='cycle'){Q=W;dU=0;}
  const energyGiven=(key,value)=>{const useKJ=hard;return given(q,key,useKJ?value/1000:value,useKJ?'kJ':'J')*(useKJ?1000:1);};
  if(family==='cycle'&&hard){
    const heatIn=given(q,'Qrecebido',pick([800,1000,1200,1600]),'J'),heatOut=given(q,'Qcedido',pick([200,300,400,600]),'J');Q=heatIn-heatOut;W=Q;target='W';
    q.params={Q,W,dU:0,target,heatIn,heatOut};q.prompt=`Durante um ciclo completo, um gás retorna ao estado inicial. Ao longo do ciclo, ele recebe ${fmt(heatIn)} J de calor e cede ${fmt(heatOut)} J. Qual é o trabalho líquido realizado pelo gás, em J?`;
    q.steps=['Em um ciclo completo, ΔU = 0.',`Calor líquido: Q = ${fmt(heatIn)} − ${fmt(heatOut)} = ${fmt(Q)} J.`,'Pela primeira lei, ΔU = Q − W. Assim, W = Q.',`W = ${fmt(W)} J.`];
  }else{
    if(family==='cycle'){
      if(target==='Q')W=energyGiven('W',W);Q=W;dU=0;
      q.prompt=target==='dU'?'Uma amostra de gás completa um ciclo termodinâmico e retorna exatamente ao estado inicial. Qual é a variação total da energia interna, em J?':`Um gás completa um ciclo e retorna ao mesmo estado inicial. O trabalho líquido realizado por ele é dado por ${q.givens.map(showGiven).join('')}. Calcule o calor líquido Q trocado, em J, adotando positivo o calor recebido.`;
    }else if(family==='adiabatic'){
      if(target==='dU'){W=energyGiven('W',W);dU=-W;}else{dU=energyGiven('ΔU',dU);W=-dU;}
      const info=target==='dU'?`o trabalho realizado pelo gás é dado por ${q.givens.map(showGiven).join('')}`:`a variação de energia interna é dada por ${q.givens.map(showGiven).join('')}`;
      q.prompt=`Uma amostra de gás sofre uma transformação adiabática, sem troca de calor. Nesse processo, ${info}. Determine ${target==='dU'?'ΔU':'W realizado pelo gás'}, em J. Adote W positivo quando realizado pelo gás.`;
    }else{
      if(target!=='Q')Q=energyGiven('Q',Q);if(target!=='W')W=energyGiven('W',W);if(target!=='dU')dU=energyGiven('ΔU',dU);
      if(target==='dU')dU=Q-W;if(target==='Q')Q=dU+W;if(target==='W')W=Q-dU;
      q.prompt=`Em um processo de uma amostra fechada de gás, ${q.givens.map(showGiven).join(' e ')}. Adote Q positivo para calor recebido e W positivo para trabalho realizado pelo gás. Determine ${target==='dU'?'a variação de energia interna ΔU':target==='Q'?'o calor Q trocado':'o trabalho W realizado pelo gás'}, em J.`;
    }
    q.params={Q,W,dU,target};q.steps=[...(q.givens.length?[knownStep(q)]:[]),...(hard?['Converta a energia dada em kJ para J, multiplicando por 1000.']:[]),...(family==='adiabatic'?['Adiabática: Q = 0, portanto ΔU = −W.']:family==='cycle'?['Ciclo completo: ΔU = 0, portanto Q líquido = W líquido.']:['Primeira lei: ΔU = Q − W. Para outras incógnitas: Q = ΔU + W e W = Q − ΔU.']),`${target==='dU'?'ΔU':target} = ${fmt({Q,W,dU}[target])} J.`];
  }
  q.answer=q.params[target];q.unit='J';q.quantity='energy';q.concept=family==='cycle'?'A energia interna depende do estado. Voltar ao mesmo estado implica ΔU total igual a zero.':family==='adiabatic'?'Sem transferência de calor, o trabalho determina a variação de energia interna com sinal oposto.':formulaById('first').why;
  return [{value:Q+W,error:'O trabalho foi somado ao calor sem respeitar ΔU = Q − W.'},{value:-q.answer,error:'O sinal da grandeza pedida foi invertido.'}];
}
function unitQuestion(q,{pick,int}){
  const variant=pick(['temperature','volume','pressure','delta']),v=variant==='temperature'?int(-40,120):variant==='volume'?pick([.5,1,2,5,20,150,250]):variant==='pressure'?pick([.5,1,1.5,2,3]):int(10,90);q.params={variant,v};
  if(variant==='temperature'){given(q,'T',v,'°C');q.answer=v+273.15;q.unit='K';q.quantity='temperature';q.prompt=`Um termômetro indica ${fmt(v)} °C. Converta essa temperatura para Kelvin usando T(K) = T(°C) + 273,15.`;q.steps=[`${fmt(v)} + 273,15 = ${fmt(q.answer)} K.`];}
  if(variant==='volume'){given(q,'V',v,'L');q.answer=v/1000;q.unit='m³';q.quantity='volume';q.prompt=`Uma amostra ocupa ${fmt(v)} L. Qual é esse volume em m³? Use 1 L = 10⁻³ m³. Se necessário, responda em notação científica.`;q.steps=[`${fmt(v)} × 10⁻³ = ${fmt(q.answer)} m³.`];}
  if(variant==='pressure'){given(q,'P',v,'atm');q.answer=v*ATM;q.unit='Pa';q.quantity='pressure';q.prompt=`A pressão absoluta de uma amostra é ${fmt(v)} atm. Converta para Pa usando 1 atm = 101325 Pa.`;q.steps=[`${fmt(v)} × 101325 = ${fmt(q.answer)} Pa.`];}
  if(variant==='delta'){given(q,'ΔT',v,'°C');q.answer=v;q.unit='K';q.quantity='temperature';q.prompt=`A temperatura de uma amostra aumenta ${v} °C. Qual é o valor dessa variação em Kelvin?`;q.steps=['Um intervalo de 1 °C tem o mesmo tamanho que um intervalo de 1 K.',`ΔT = ${v} K. Não se soma 273,15 a uma diferença de temperaturas.`];}
  q.concept='Converter unidades preserva a grandeza física. A mudança de origem entre Celsius e Kelvin só é aplicada a temperaturas absolutas.';
  return variant==='delta'?[{value:v+273.15,error:'Foi somado o deslocamento de escala a uma variação de temperatura.'}]:[];
}
function conceptQuestion(q,{pick,int,medium,hard,rng,shuffle}){
  if(q.family==='kinetic'||q.family==='internalConcept'){
    const ratio=pick(medium?[1.25,1.5,2,3]:[2,3]),T1=pick([200,250,300]),T2=T1*ratio;
    const t1=temperatureGiven(q,'Ti',T1,medium),t2=temperatureGiven(q,'Tf',T2,medium);q.params={T1:t1,T2:t2,ratio:t2/t1};q.answer=t2/t1;q.unit='vezes';q.quantity='ratio';
    q.prompt=q.family==='kinetic'?`Uma quantidade fixa de gás ideal é aquecida de ${temperatureLabel(q,'Ti')} para ${temperatureLabel(q,'Tf')} em um recipiente rígido e fechado. Qual é a razão Pf/Pi entre a pressão final e a inicial?`:`Uma quantidade fixa de gás ideal monoatômico é aquecida de ${temperatureLabel(q,'Ti')} para ${temperatureLabel(q,'Tf')}. Qual é a razão Uf/Ui entre a energia interna final e a inicial?`;
    q.steps=[...conversionSteps(q),q.family==='kinetic'?'Como n e V são constantes, Pf/Pi = Tf/Ti.':'Como n é constante, Uf/Ui = Tf/Ti.',`${fmt(t2)}/${fmt(t1)} = ${fmt(q.answer)}.`];q.concept=q.family==='kinetic'?'Em volume fixo, o aumento da temperatura absoluta eleva a pressão na mesma proporção.':'Para uma mesma amostra ideal monoatômica, a energia interna é proporcional à temperatura absoluta.';return [{value:1/q.answer,error:'Foi usada a razão inicial/final em lugar de final/inicial.'},{value:Math.sqrt(q.answer),error:'A raiz da razão de temperaturas se relaciona à escala das velocidades, não à pressão ou à energia interna.'}];
  }
  if(q.family==='identify'){
    const f=pick(medium?MAIN_FORMULAS:MAIN_FORMULAS.slice(0,3));q.formulaId=f.id;q.module=f.module;q.params={formula:f.id,context:int(1,100000)};
    const simple={iso:`Uma amostra fixa de gás ideal passa de ${int(2,8)} L para ${int(9,15)} L a temperatura constante. Qual equação relaciona as pressões e os volumes?`,isobar:'Uma amostra fixa de gás ideal é aquecida sob pressão constante. Qual equação relaciona os volumes e as temperaturas?',isochor:'Um gás ideal é aquecido em um recipiente rígido, fechado e sem vazamentos. Qual equação relaciona as pressões e as temperaturas?',general:'Uma quantidade fixa de gás ideal muda de pressão, volume e temperatura. Qual equação compara os dois estados?',work:'Um pistão se desloca em um processo quase-estático sob pressão constante. Conhecidos P, Vi e Vf, qual expressão calcula o trabalho pelo gás?',internal:'Uma amostra ideal monoatômica tem n e T conhecidos. Qual equação calcula a energia interna nesse estado?',deltaU:'Uma quantidade fixa de gás ideal monoatômico muda de temperatura. Qual equação calcula a variação da energia interna?',first:'Um gás recebe calor e realiza trabalho. Qual equação relaciona essas transferências à mudança da energia interna?',workT:'Conhecidos n e ΔT em um processo isobárico de gás ideal, qual expressão calcula diretamente o trabalho pelo gás?'};
    const contextual={iso:'Um cilindro fechado com pistão permanece em contato com um reservatório que mantém sua temperatura. O volume muda. Qual relação compara pressão e volume nos dois estados?',isobar:'Um êmbolo sem atrito move-se lentamente sob uma carga externa constante. A amostra de gás ideal aquece, sem perda de matéria. Qual relação compara volume e temperatura?',isochor:'Um tanque de aço, rígido e fechado, é aquecido. Qual relação compara sua pressão e temperatura antes e depois?',general:'Uma amostra ideal sem vazamentos passa entre dois estados, sem indicação de P, V ou T constantes. Qual relação permite comparar os estados?',work:'O gráfico P × V mostra um segmento horizontal entre Vi e Vf, percorrido quase-estaticamente. Qual expressão fornece sua área algébrica?',internal:'Uma amostra ideal monoatômica está em equilíbrio térmico. Conhecidos a quantidade de matéria e T em Kelvin, qual equação fornece sua energia interna total?',deltaU:'Uma amostra ideal monoatômica esfria sem perder matéria. Qual equação calcula a diferença entre a energia interna final e a inicial?',first:'Um gás cede calor enquanto é comprimido. Qual equação permite encontrar a mudança da energia interna, respeitando os sinais de Q e W?',workT:'Uma amostra ideal sob pressão fixa muda de temperatura. Os volumes não foram fornecidos. Conhecidos n e ΔT, qual expressão dá o trabalho pelo gás?'};
    q.prompt=(hard?contextual:simple)[f.id];q.answer=f.equation;q.kind='choice';q.steps=[`Pista do enunciado: ${f.cue}`,`Condição de validade: ${f.constant}.`,`Equação adequada: ${f.equation}.`];q.hints=[f.cue,`Observe: ${f.constant.toLowerCase()}.`,`O conceito é ${f.name.toLowerCase()}.`];q.concept=f.why;return shuffle(MAIN_FORMULAS.filter(x=>x.id!==f.id)).map(x=>({value:x.equation,error:`${x.name} exige ${x.constant.toLowerCase()}, ou calcula outra grandeza.`}));
  }
  if(q.family==='order'){
    const P=pick([2,3,4]),V=pick([4,6,8]),Vf=V*2,steps=['Reconhecer T e n constantes','Escrever P₁V₁ = P₂V₂','Isolar P₂ = P₁V₁/V₂',`Calcular P₂ = ${fmt(P*V/Vf)} atm`];given(q,'P1',P,'atm');given(q,'V1',V,'L');given(q,'V2',Vf,'L');
    q.prompt=`Organize a solução: uma amostra fixa de gás ideal ocupa ${V} L a ${P} atm e se expande isotermicamente até ${Vf} L. Como encontrar a pressão final?`;q.answer=steps.join(' → ');q.kind='order';q.order=steps;q.choices=shuffle(steps.map(value=>({value,label:value})));q.params={P,V,Vf};q.steps=steps;q.concept='Identifique a condição física, escolha a relação, isole a incógnita e só então calcule.';return [];
  }
  if(q.family==='tf'){
    const f=pick(MAIN_FORMULAS),truth=rng()>.5;const claims={iso:['Na isotérmica de uma amostra ideal fixa, PV permanece constante.','Na isotérmica, pressão e volume são diretamente proporcionais.'],isobar:['Na isobárica de uma amostra ideal fixa, V/T permanece constante.','Na isobárica, o volume precisa ser constante.'],isochor:['Em recipiente rígido, o trabalho de expansão/compressão é zero.','Em recipiente rígido, a pressão precisa ser constante.'],general:['A lei geral se reduz às leis especiais quando uma grandeza é constante.','A lei geral permite cancelar n mesmo quando há vazamento de gás.'],work:['Na expansão quase-estática contra pressão positiva, o trabalho pelo gás é positivo.','Na compressão, o trabalho realizado pelo gás é positivo.'],internal:['O fator 3/2 é usado para gás ideal monoatômico no modelo clássico.','U = (3/2)nRT vale para qualquer gás real, sem restrições.'],deltaU:['Uma isotérmica ideal com n fixo tem ΔU = 0.','É preciso somar 273,15 a uma variação de temperatura em Celsius.'],first:['Em uma adiabática, Q = 0 e ΔU = −W.','Em uma adiabática, o trabalho sempre é zero.'],workT:['W = nRΔT exige uma transformação isobárica de gás ideal com n fixo.','W = nRΔT pode ser usada para qualquer transformação de um gás.']};
    q.formulaId=f.id;q.module=f.module;q.prompt=`Verdadeiro ou falso? ${claims[f.id][truth?0:1]}`;q.answer=truth?'Verdadeiro':'Falso';q.kind='choice';q.params={formula:f.id,truth};q.steps=[f.valid,f.why];q.concept=f.why;return [{value:truth?'Falso':'Verdadeiro',error:'A afirmação deve ser comparada às condições de validade da equação.'}];
  }
  if(q.family==='mental'){
    const op=pick(medium?['proportion','power','division','estimate']:['proportion','division']),a=int(2,9),b=pick([2,4,5,10]),c=pick([2,3,4]);q.params={op,a,b,c};
    if(op==='proportion'){q.answer=a/c;q.unit='atm';q.quantity='pressure';q.prompt=`Uma amostra ideal tem P₁ = ${a} atm e V₁ = ${b} L. A temperatura é mantida constante e o volume passa a ${b*c} L. Calcule P₂ mentalmente, em atm.`;q.steps=[`P₂ = ${a} × ${b}/(${b} × ${c}). Cancele o fator ${b}.`,`P₂ = ${a}/${c} ≈ ${fmt(q.answer)} atm.`];}
    if(op==='power'){const e=int(3,6);q.params.e=e;q.answer=a*10**(e-3);q.unit='J';q.prompt=`Em uma expansão isobárica, P = ${a} × 10^${e} Pa e ΔV = 1 × 10⁻³ m³. Calcule o trabalho pelo gás em J.`;q.steps=[`W = PΔV = ${a} × 10^(${e} − 3) = ${fmt(q.answer)} J.`];}
    if(op==='division'){q.answer=a*c;q.prompt=`Simplifique mentalmente a expressão (${a*b} × ${c})/${b}, cancelando fatores antes de multiplicar.`;q.steps=[`Como ${a*b} = ${a} × ${b}, cancele o fator ${b}.`,`${a} × ${c} = ${q.answer}.`];}
    if(op==='estimate'){q.answer=a*b*100;q.unit='J';q.prompt=`Estime o trabalho de uma expansão isobárica usando P ≈ ${a} × 10⁵ Pa e ΔV ≈ ${b} × 10⁻³ m³. Qual resultado em J corresponde a essas aproximações?`;q.steps=[`W ≈ ${a} × ${b} × 10² = ${fmt(q.answer)} J.`];}
    q.concept='Cancele fatores e agrupe as potências de dez antes de multiplicar. Arredonde somente a resposta final.';return [];
  }
  throw new Error('Modelo de questão não encontrado.');
}
export function populateQuestion(q,random){
  if(['iso','isobar','isochor','general'].includes(q.family))return lawQuestion(q,random);
  if(q.family==='ideal')return idealQuestion(q,random);
  if(['work','expansion','compression','zeroWork','graph'].includes(q.family))return workQuestion(q,random);
  if(['workT','internal','deltaU','multi','rigid'].includes(q.family))return monoQuestion(q,random);
  if(['first','adiabatic','cycle','signs'].includes(q.family))return energyBalanceQuestion(q,random);
  if(q.family==='units')return unitQuestion(q,random);
  return conceptQuestion(q,random);
}
