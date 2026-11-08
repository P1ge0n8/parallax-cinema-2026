export const SPACE_ROUTES=['home','intro','podcast'];
export const CONTENT_ROUTES=['about','articles','contact','podcast/film-fest','podcast/focus','podcast/in-cinemas'];
export const isSpaceRoute=route=>SPACE_ROUTES.includes(route);
export const isSiteRoute=route=>isSpaceRoute(route)||CONTENT_ROUTES.includes(route);
export const routeToStage=route=>({home:'desk',intro:'directory',podcast:'menu'})[route]||(CONTENT_ROUTES.includes(route)?'reading':undefined);
export const stageToRoute=stage=>({desk:'home',directory:'intro',menu:'podcast'})[stage];
export const parentStage=stage=>stage==='menu'?'directory':'desk';
