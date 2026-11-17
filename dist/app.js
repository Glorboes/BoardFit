import {plan} from './solver.js';
const $=id=>document.getElementById(id);
const colors=['#c2d2a9','#e6cca5','#b8cfce','#d8bdd0','#c8c1df','#d9d8a9','#c0cbdc'];
const fmt=n=>new Intl.NumberFormat('en-GB',{maximumFractionDigits:1}).format(n);
let rows=[{w:650,h:700,qty:6},{w:600,h:400,qty:4},{w:200,h:100,qty:8}];
const label=i=>i<26?String.fromCharCode(65+i):`P${i+1}`;
try{const saved=JSON.parse(localStorage.getItem('boardfit-v1'));if(saved&&Array.isArray(saved.rows)&&saved.rows.length<=50){rows=saved.rows;for(const id of ['sheetW','sheetH','kerf'])$(id).value=saved[id];$('rotate').checked=saved.rotate!==false;}}catch{}
function persist(){try{localStorage.setItem('boardfit-v1',JSON.stringify({rows,sheetW:$('sheetW').value,sheetH:$('sheetH').value,kerf:$('kerf').value,rotate:$('rotate').checked}));}catch{$('saveNote').textContent='Device storage is unavailable in this browser.';}}
function dirty(){persist();document.querySelector('.results').classList.add('stale');$('status').textContent='● Recalculate to update';$('print').disabled=true;$('pieceCount').textContent=`${rows.reduce((n,p)=>n+(Number(p.qty)||0),0)} PIECES`;}
function renderRows(){
 $('rows').replaceChildren();
 rows.forEach((p,i)=>{
 const row=document.createElement('div');row.className='piece-row';
 const badge=document.createElement('span');badge.className='piece-letter';badge.style.background=colors[i%colors.length];badge.textContent=label(i);row.append(badge);
 for(const [key,name] of [['w','length'],['h','width'],['qty','quantity']]){const input=document.createElement('input');input.type='number';input.min=key==='qty'?'1':'0.1';input.max=key==='qty'?'500':'100000';input.step=key==='qty'?'1':'any';input.required=true;input.value=p[key];input.setAttribute('aria-label',`Piece ${label(i)} ${name}${key==='qty'?'':' in millimetres'}`);input.addEventListener('input',()=>{p[key]=input.value===''?'':Number(input.value);dirty();});row.append(input);}
 const del=document.createElement('button');del.type='button';del.className='remove';del.textContent='×';del.setAttribute('aria-label',`Remove piece ${label(i)}`);del.addEventListener('click',()=>{rows.splice(i,1);renderRows();dirty();});row.append(del);$('rows').append(row);
 });$('add').disabled=rows.length>=50;$('pieceCount').textContent=`${rows.reduce((n,p)=>n+(Number(p.qty)||0),0)} PIECES`;
}
function svgNode(name,attrs={},text){const el=document.createElementNS('http://www.w3.org/2000/svg',name);for(const [k,v]of Object.entries(attrs))el.setAttribute(k,v);if(text!==undefined)el.textContent=text;return el;}
function showSheet(sheet,index,W,H){
 const block=document.createElement('div');block.className='board-block';
 const heading=document.createElement('div');heading.className='board-label';const title=document.createElement('strong');title.textContent=`Sheet ${String(index+1).padStart(2,'0')}`;const info=document.createElement('small');info.textContent=`${sheet.pieces.length} pieces · ${fmt(sheet.pieces.reduce((a,p)=>a+p.w*p.h,0)/(W*H)*100)}% used`;heading.append(title,info);block.append(heading);
 // Fixed display coordinate system keeps labels readable for all stock sizes.
 const scale=700/W,h=H*scale,pad=35;
 const svg=svgNode('svg',{viewBox:`0 0 770 ${h+70}`,role:'img','aria-label':`Sheet ${index+1}, ${W} by ${H} millimetres, ${sheet.pieces.length} pieces`});
 const defs=svgNode('defs'),pattern=svgNode('pattern',{id:`hatch${index}`,width:7,height:7,patternUnits:'userSpaceOnUse',patternTransform:'rotate(45)'});pattern.append(svgNode('rect',{width:7,height:7,fill:'#f3f3e9'}),svgNode('line',{x1:0,y1:0,x2:0,y2:7,stroke:'#e1e4d4','stroke-width':2}));defs.append(pattern);svg.append(defs);
 svg.append(svgNode('text',{x:385,y:18,'text-anchor':'middle',fill:'#87917d','font-size':11},`${fmt(W)} mm`));
 svg.append(svgNode('text',{transform:`translate(15 ${pad+h/2}) rotate(-90)`,'text-anchor':'middle',fill:'#87917d','font-size':11},`${fmt(H)} mm`));
 svg.append(svgNode('rect',{x:pad,y:pad,width:700,height:h,fill:`url(#hatch${index})`,stroke:'#a8b39b','stroke-width':1}));
 sheet.pieces.forEach(p=>{const x=pad+p.x*scale,y=pad+p.y*scale,w=p.w*scale,ph=p.h*scale;
 const group=svgNode('g');group.append(svgNode('title',{},`Piece ${label(p.id)} · ${p.w} × ${p.h} mm${p.rotated?' · rotated 90°':''}`),svgNode('rect',{x,y,width:w,height:ph,fill:colors[p.id%colors.length],stroke:'#fff','stroke-width':1}));
 if(w>15&&ph>13){const size=Math.min(16,ph*.37,w*.3);group.append(svgNode('text',{x:x+w/2,y:y+ph/2+(ph>45&&w>74?-5:4),'font-size':size,'font-weight':600,fill:'#354b39','text-anchor':'middle'},label(p.id)));
 if(ph>45&&w>74)group.append(svgNode('text',{x:x+w/2,y:y+ph/2+13,'font-size':Math.min(11,w/10),'text-anchor':'middle',fill:'#4b5c46'},`${fmt(p.w)} × ${fmt(p.h)}`));}
 svg.append(group);
 });block.append(svg);return block;
}
function calculate(){
 $('error').hidden=true;$('warning').hidden=true;
 const W=Number($('sheetW').value),H=Number($('sheetH').value),k=Number($('kerf').value);
 try{
 const pieces=rows.map((p,id)=>({...p,w:Number(p.w),h:Number(p.h),qty:Number(p.qty),id}));const result=plan(W,H,k,pieces,$('rotate').checked);
 const placed=result.sheets.flatMap(s=>s.pieces),area=placed.reduce((n,p)=>n+p.w*p.h,0),stockArea=result.sheets.length*W*H;
 $('sheetCount').textContent=result.sheets.length;$('stockLabel').textContent=`${fmt(W)} × ${fmt(H)} mm each`;$('placed').textContent=placed.length;$('totalLabel').textContent=`of ${pieces.reduce((n,p)=>n+p.qty,0)} requested pieces`;
 $('usage').textContent=`${stockArea?Math.round(area/stockArea*100):0}%`;$('wasteLabel').textContent=`${fmt((stockArea-area)/1e6)} m² offcuts + saw loss`;
 $('boards').replaceChildren(...result.sheets.map((s,i)=>showSheet(s,i,W,H)));
 if(!result.sheets.length){const empty=document.createElement('div');empty.className='empty';empty.textContent=pieces.length?'No pieces fit this sheet. Try a larger stock size.':'Add a piece size to start your cutting plan.';$('boards').append(empty);}
 $('legend').replaceChildren();pieces.forEach((p,i)=>{const item=document.createElement('span');item.className='legend-item';const swatch=document.createElement('span');swatch.className='swatch';swatch.style.background=colors[i%colors.length];item.append(swatch,document.createTextNode(`${label(i)} · ${fmt(p.w)} × ${fmt(p.h)} · Qty ${p.qty}`));$('legend').append(item);});
 if(result.unplaced.length){$('warning').hidden=false;$('warning').textContent=`Does not fit: ${result.unplaced.map(p=>`${label(p.id)} (${fmt(p.w)} × ${fmt(p.h)} mm, qty ${p.qty})`).join('; ')}. These pieces are excluded from the sheet count. ${$('rotate').checked?'Use larger sheets or change these dimensions.':'Try allowing rotation, or use larger sheets.'}`;}
 document.querySelector('.results').classList.remove('stale');$('status').textContent=result.unplaced.length?'● Some pieces do not fit':'● Layout ready';$('print').disabled=false;persist();
 }catch(e){$('error').hidden=false;$('error').textContent=e.message;$('status').textContent='● Check your measurements';document.querySelector('.results').classList.add('stale');$('print').disabled=true;}
}
$('add').addEventListener('click',()=>{rows.push({w:'',h:'',qty:1});renderRows();dirty();$('rows').lastElementChild.querySelector('input').focus();});
$('planner').addEventListener('submit',e=>{e.preventDefault();calculate();});
for(const id of ['sheetW','sheetH','kerf','rotate'])$(id).addEventListener('input',dirty);
$('print').addEventListener('click',()=>window.print());renderRows();calculate();
