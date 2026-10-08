import { test } from 'node:test';
import assert from 'node:assert/strict';
import { replaceBusinessName } from './services/businessName.js';
test('business rename handles repeated names, casing, spacing and literal symbols',()=>{
 assert.equal(replaceBusinessName('OLD Bakery and Old\nBakery.', 'Old Bakery','New Shop'),'New Shop and New Shop.');
 assert.equal(replaceBusinessName('A+B serves tea. a+b grows.', 'A+B','$New'),'$New serves tea. $New grows.');
 assert.equal(replaceBusinessName('Keep this.', '', 'New'),'Keep this.');
});
