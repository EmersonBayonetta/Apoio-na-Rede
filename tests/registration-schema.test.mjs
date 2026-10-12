import test from 'node:test';
import assert from 'node:assert/strict';
import {validateRegistration as frontendValidate,registrationTextSchema} from '../src/utils/registrationValidation.ts';
import {validateRegistration as apiValidate} from '../api/_lib/registrationValidation.js';
import {validatePlaceEdit} from '../api/_lib/placeManagementValidation.js';
import {createRegistrationHandler} from '../api/register-place.js';
const data={nome:'Local',descricao:'Descrição adequada para o cadastro.',endereco:'Rua Teste, 10',cidade:'Cataguases',estado:'MG',latitude:-21.4,longitude:-42.7,fotos:[],categoria:'educacao'};
test('frontend and API share the same validator and reject whitespace-padded short texts',()=>{
 assert.equal(frontendValidate,apiValidate);
 for(const [field,rule] of Object.entries(registrationTextSchema)){
  for(const validate of [frontendValidate,apiValidate,validatePlaceEdit]){
   assert.throws(()=>validate({...data,[field]:`   ${'a'.repeat(rule.min-1)}   `}),new RegExp(`${rule.min} caracteres`));
   assert.doesNotThrow(()=>validate({...data,[field]:`  ${'a'.repeat(rule.min)}  `}));
   assert.throws(()=>validate({...data,[field]:' '.repeat(rule.min+20)}));
   assert.throws(()=>validate({...data,[field]:'a'.repeat(rule.max+1)}));
  }
 }
});
test('API rejects short descriptions before database writes or email requests',async()=>{
 let calls=0;const handler=createRegistrationHandler({fetchImpl:async()=>{calls++;throw Error('Unexpected call');}});
 const res={setHeader(){},status(code){this.code=code;return this;},json(body){this.body=body;return this;}};
 await handler({method:'POST',headers:{},body:{details:{...data,descricao:'Muito curta'},criteria:[]}},res);
 assert.equal(res.code,400);assert.match(res.body.error,/20 caracteres/);assert.equal(calls,0);
});
