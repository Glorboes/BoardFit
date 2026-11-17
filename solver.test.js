import {test} from 'node:test';
import assert from 'node:assert/strict';
import {plan} from './dist/solver.js';
const piece=(w,h,qty=1)=>({w,h,qty,id:0});
test('fits an exact sheet without outer blade allowance',()=>assert.equal(plan(2470,1800,3,[piece(2470,1800)],true).sheets.length,1));
test('blade allowance separates pieces',()=>{
 assert.equal(plan(100,100,0,[piece(50,100,2)],false).sheets.length,1);
 assert.equal(plan(100,100,3,[piece(50,100,2)],false).sheets.length,2);
});
test('rotation allows fit only when enabled',()=>{
 assert.equal(plan(100,60,3,[piece(60,100)],true).sheets.length,1);
 assert.equal(plan(100,60,3,[piece(60,100)],false).unplaced.length,1);
});
test('flags oversized items while placing the rest',()=>{
 const r=plan(2470,1800,3,[piece(2700,650),{...piece(600,400,6),id:1}],true);
 assert.equal(r.unplaced.length,1); assert.equal(r.sheets.flatMap(s=>s.pieces).length,6);
});
test('rejects invalid dimensions and quantities',()=>{
 for(const p of [piece(-1,20),piece(10,0),piece(10,20,1.5)]) assert.throws(()=>plan(100,100,3,[p],true));
 assert.throws(()=>plan(0,100,3,[piece(10,20)],true));
});
test('layouts preserve quantities, bounds and blade clearance',()=>{
 const r=plan(2470,1800,3,[piece(650,700,9),{...piece(600,400,7),id:1},{...piece(200,100,15),id:2}],true);
 assert.equal(r.sheets.flatMap(s=>s.pieces).length,31);
 for(const s of r.sheets) for(const [i,a] of s.pieces.entries()) {
 assert.ok(a.x>=0&&a.y>=0&&a.x+a.w<=2470&&a.y+a.h<=1800);
 for(const b of s.pieces.slice(i+1)) assert.ok(a.x+a.w+3<=b.x||b.x+b.w+3<=a.x||a.y+a.h+3<=b.y||b.y+b.h+3<=a.y);
 }
});
