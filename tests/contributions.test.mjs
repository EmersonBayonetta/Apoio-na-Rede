import test from 'node:test';
import assert from 'node:assert/strict';
import { confirmedCriteria } from '../src/utils/communityConfirmation.ts';
const report=(rampa,status='aprovado')=>({status,respostas:{rampa}});
test('two approved reports cannot confirm a resource',()=>assert.deepEqual(confirmedCriteria([report('sim'),report('sim')],'place'),[]));
test('three approved agreements confirm yes and no independently',()=>{
 for(const [value,present] of [['sim',true],['nao',false]]) {
  const result=confirmedCriteria(Array.from({length:3},()=>report(value)),'place');
  assert.equal(result.length,1);assert.equal(result[0].presente,present);
 }
});
test('pending, refused, and unknown answers cannot confirm accessibility',()=>{
 assert.deepEqual(confirmedCriteria([report('sim'),report('sim','pendente'),report('sim','recusado'),report('nao_sei')],'place'),[]);
});
test('contradictions remain unknown even after three agreements',()=>{
 for(const reports of [[report('sim'),report('nao')],[report('sim'),report('sim'),report('sim'),report('nao')]]) {
  assert.equal(confirmedCriteria(reports,'place')[0].presente,null);
 }
});
