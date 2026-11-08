import test from 'node:test';
import assert from 'node:assert/strict';
import {LANGUAGES,copy,validLanguage,nextLanguage,textFor,episodeTitle,objectName} from '../src/i18n.js';
import {filmFestEpisodes} from '../src/podcast-data.js';

test('saved two-language preferences migrate and the three-language cycle wraps',()=>{
 assert.equal(validLanguage('zh'),'zh-CN');assert.equal(validLanguage('en'),'en');assert.equal(validLanguage('zh-TW'),'zh-TW');
 assert.equal(validLanguage('invalid'),'zh-CN');
 assert.equal(nextLanguage('zh-TW'),'zh-CN');assert.equal(nextLanguage('zh-CN'),'en');assert.equal(nextLanguage('en'),'zh-TW');
});
test('Taiwan copy is complete and uses regional UI terminology',()=>{
 for(const locale of LANGUAGES){assert.deepEqual(Object.keys(copy[locale]).sort(),Object.keys(copy['zh-CN']).sort());for(const text of Object.values(copy[locale]))assert.ok(text.length>0);}
 assert.match(textFor('zh-TW','world'),/拖曳/);assert.match(textFor('zh-TW','manualP2'),/滑鼠/);
 assert.equal(textFor('zh-TW','newWindow'),'另開視窗');assert.equal(objectName('zh-TW','phone'),'摺疊手機');
});
test('localized episode display leaves the original source titles and identifiers intact',()=>{
 for(const [number,title,id] of filmFestEpisodes){
  assert.equal(episodeTitle('zh-CN',title,id),title);
  for(const locale of LANGUAGES)assert.ok(episodeTitle(locale,title,id)?.length>5);
  assert.match(id,/^[a-f0-9]{24}$/);assert.match(number,/^\d+\.\d+$/);
 }
 assert.match(episodeTitle('zh-TW','',filmFestEpisodes[0][2]),/坎城/);
});
