import timing from '../../../public/france-riots-20261023/v2/scene_timing.json';
import elements from '../../../public/france-riots-20261023/v2/scene_elements.json';
import captions from '../../../public/france-riots-20261023/v2/captions_display.json';
import type {Caption} from '@remotion/captions';
export const FPS=30;
// Runtime duration remains derived from supplied per-scene WAV measurements.
let cursor=0;
export const SCENES=timing.scenes.map(s=>{const scene_frames=Math.ceil((s.voice_seconds+0.8)*FPS); const out={...s,start_frame:cursor,scene_frames}; cursor+=scene_frames;return out;});
export const TOTAL_FRAMES=cursor+30;
if(TOTAL_FRAMES!==timing.total_frames) throw new Error('Stale V2 scene_timing; run buildV2.py');
export type Scene=(typeof SCENES)[number];
export type Element={scene:string;id:string;display:string;kind:string;anchor:string;start_frame_local:number;retrospective_reference:boolean;anchor_start_seconds?:number;anchor_end_seconds?:number};
export const ELEMENTS=elements.scenes as Element[];
export const sceneElements=(s:string)=>ELEMENTS.filter(e=>e.scene===s);
export const getElement=(s:string,id:string)=>{const e=ELEMENTS.find(e=>e.scene===s&&e.id===id);if(!e)throw new Error(`Missing ${s}/${id}`);return e;};
export const CAPTIONS=captions as Record<string,Caption[]>;
