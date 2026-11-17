// Guillotine packing: each placement divides one free rectangle with straight cuts.
export function plan(W,H,kerf,rows,rotate=true){
 const positive=n=>Number.isFinite(n)&&n>0&&n<=100000;
 if(!positive(W)||!positive(H)||!Number.isFinite(kerf)||kerf<0||kerf>1000) throw Error('Enter positive sheet dimensions and a blade width from 0 to 1000 mm.');
 if(rows.some(p=>!positive(p.w)||!positive(p.h)||!Number.isInteger(p.qty)||p.qty<1)) throw Error('Each piece needs positive dimensions and a whole-number quantity.');
 if(rows.reduce((n,p)=>n+p.qty,0)>500) throw Error('Use up to 500 pieces per layout.');
 const unplaced=[],items=[];
 for(const p of rows){
  if(!((p.w<=W&&p.h<=H)||(rotate&&p.h<=W&&p.w<=H))){unplaced.push(p);continue;}
  for(let i=0;i<p.qty;i++)items.push({...p,copy:i+1});
 }
 let best;
 const sorts=[p=>p.w*p.h,p=>Math.max(p.w,p.h),p=>p.w,p=>p.h];
 for(const key of sorts)for(const split of [0,1]){
  const sheets=[];
  for(const p of [...items].sort((a,b)=>key(b)-key(a)||b.w*b.h-a.w*a.h)){
   let choice;
   const find=()=>{
    for(let si=0;si<sheets.length;si++)for(let fi=0;fi<sheets[si].free.length;fi++){
     const f=sheets[si].free[fi];
     for(const rotated of rotate&&p.w!==p.h?[false,true]:[false]){
      const w=rotated?p.h:p.w,h=rotated?p.w:p.h;
      if(w>f.w||h>f.h)continue;
      const score=f.w*f.h-w*h;
      if(!choice||score<choice.score)choice={si,fi,w,h,rotated,score};
     }
    }
   };
   find();
   if(!choice){sheets.push({free:[{x:0,y:0,w:W,h:H}],pieces:[]});find();}
   const {si,fi,w,h,rotated}=choice,s=sheets[si],f=s.free.splice(fi,1)[0];
   s.pieces.push({...p,x:f.x,y:f.y,w,h,rotated});
   const dw=f.w-w-kerf,dh=f.h-h-kerf;
   const vertical=split===0?dw>dh:dw<=dh;
   const newFree=vertical?
    [{x:f.x+w+kerf,y:f.y,w:dw,h:f.h},{x:f.x,y:f.y+h+kerf,w,h:dh}]:
    [{x:f.x+w+kerf,y:f.y,w:dw,h},{x:f.x,y:f.y+h+kerf,w:f.w,h:dh}];
   s.free.push(...newFree.filter(r=>r.w>0&&r.h>0));
  }
  const largest=Math.max(0,...sheets.flatMap(s=>s.free.map(r=>r.w*r.h)));
  if(!best||sheets.length<best.sheets.length||(sheets.length===best.sheets.length&&largest>best.largest))best={sheets,largest};
 }
 return {...best,unplaced};
}
