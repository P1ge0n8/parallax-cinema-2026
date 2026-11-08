import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {isSiteRoute,isSpaceRoute,routeToStage,stageToRoute,parentStage} from '../space-source/route-protocol.js';
import {podcastColumns,filmFestEpisodes,episodeURL} from '../src/podcast-data.js';

test('space deep links and reading routes keep the same scene with correct back layers',()=>{
 for(const [route,stage] of [['home','desk'],['intro','directory'],['podcast','menu']]){assert.equal(routeToStage(route),stage);assert.equal(stageToRoute(stage),route);assert.ok(isSpaceRoute(route));}
 assert.equal(parentStage('menu'),'directory');assert.equal(parentStage('directory'),'desk');
 for(const route of ['about','articles','contact',...podcastColumns.map(([id])=>'podcast/'+id)]){assert.ok(isSiteRoute(route));assert.equal(isSpaceRoute(route),false);assert.equal(routeToStage(route),'reading');}
 for(const route of ['https://example.com','javascript:alert(1)','podcast/unknown','../home',null,{}])assert.equal(isSiteRoute(route),false);
});
test('all original episode numbers, titles and playback IDs are preserved from the public repository',()=>{
 const original=readFileSync(new URL('./fixtures/original-podcast-data.txt',import.meta.url),'utf8');
 const rows=[...original.matchAll(/\['([^']+)','([^']+)','([^']+)'\]/g)].map(m=>m.slice(1));
 assert.deepEqual(podcastColumns,rows.slice(0,3));assert.deepEqual(filmFestEpisodes,rows.slice(3));
 assert.equal(filmFestEpisodes.length,4);
 for(const [,,id] of filmFestEpisodes){const url=new URL(episodeURL(id));assert.equal(url.hostname,'www.xiaoyuzhoufm.com');assert.equal(url.pathname,'/episode/'+id);}
});
