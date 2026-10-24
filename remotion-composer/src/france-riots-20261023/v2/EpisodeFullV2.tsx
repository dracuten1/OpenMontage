import React from 'react';
import {AbsoluteFill,Audio,Img,OffthreadVideo,Sequence,interpolate,staticFile,useCurrentFrame} from 'remotion';
import {C,FONT} from '../theme';
import {SCENES,TOTAL_FRAMES,FPS,Scene,Element,sceneElements,getElement} from './timingV2';
import {CaptionsV2} from './CaptionsV2';
import music from '../../../public/france-riots-20261023/v2/music_metadata.json';
const BASE='france-riots-20261023/';
const box=(x:number,y:number,w:number):React.CSSProperties=>({position:'absolute',left:x,top:y,width:w});
// No camera/container movement. Only element-local fade and <=8px translation.
const Reveal:React.FC<{e:Element;style?:React.CSSProperties;children?:React.ReactNode}>=({e,style,children})=>{
 const f=useCurrentFrame();const p=interpolate(f-e.start_frame_local,[0,6],[0,1],{extrapolateLeft:'clamp',extrapolateRight:'clamp'});
 return <div data-element={`${e.scene}/${e.id}`} style={{...style,opacity:p,transform:`translateY(${8*(1-p)}px)`}}>{children??e.display}</div>;
};
const Card:React.FC<{e:Element;x?:number;y:number;w?:number;h?:number;size?:number}>=({e,x=70,y,w=860,h=116,size=35})=><Reveal e={e} style={{...box(x,y,w),minHeight:h,boxSizing:'border-box',padding:'20px 24px',background:C.panel,borderLeft:`5px solid ${C.coral}`,borderRadius:12,fontSize:size,lineHeight:1.22,fontWeight:700,whiteSpace:'pre-line'}}/>;
const Title:React.FC<{s:string}>=({s})=><Reveal e={getElement(s,'e0')} style={{...box(70,330,860),fontSize:51,lineHeight:1.15,fontWeight:800,color:s==='s20'?C.coral:C.white}}/>;
const Generic:React.FC<{sc:Scene}>=({sc})=>{
 const es=sceneElements(sc.scene_id).filter(e=>!e.retrospective_reference&&e.kind!=='title');
 const step=es.length>4?136:165;
 const hasHero=es[0]?.kind==='hero';
 return <>{es.map((e,i)=><Card key={e.id} e={e} y={hasHero?(i===0?505:800+(i-1)*125):505+i*step} h={hasHero&&i===0?250:step-18} size={e.kind==='hero'?55:es.length>4?32:36}/>)}</>;
};
const Contrast:React.FC<{s:string}>=({s})=><><Card e={getElement(s,'e1')} x={70} y={525} w={418} h={235} size={47}/><Card e={getElement(s,'e2')} x={512} y={525} w={418} h={235} size={47}/>{['e3','e4','e5'].map((id,i)=><Card key={id} e={getElement(s,id)} y={810+i*124} h={106} size={32}/>)}</>;
const Stats:React.FC<{s:string}>=({s})=><><Card e={getElement(s,'e1')} x={70} y={520} w={418} h={285} size={51}/><Card e={getElement(s,'e2')} x={512} y={520} w={418} h={285} size={51}/><Card e={getElement(s,'e3')} y={865} size={38}/><Card e={getElement(s,'e4')} y={1035} size={38}/></>;
const Social:React.FC<{s:string}>=({s})=><><Reveal e={getElement(s,'e1')} style={{...box(70,485,860),height:170,border:`3px solid ${C.border}`,borderRadius:22,background:C.panel,display:'flex',alignItems:'center',justifyContent:'center',fontSize:39,fontWeight:800}}><span style={{color:C.coral,marginRight:22}}>▷</span>{getElement(s,'e1').display}</Reveal>{['e2','e3','e4','e5'].map((id,i)=><Card key={id} e={getElement(s,id)} y={690+i*125} size={id==='e5'?29:35} h={110}/>)}</>;
const Broll:React.FC<{sc:Scene}>=({sc})=>{
 const s=sc.scene_id,e=getElement(s,'e6');
 return <>{['e1','e2','e3','e4','e5'].map((id,i)=><Card key={id} e={getElement(s,id)} y={480+i*96} size={id==='e4'?27:29} h={82}/>)}<Reveal e={e} style={{...box(480,1000,450),height:220,background:C.panel,overflow:'hidden',borderRadius:10}}><OffthreadVideo muted src={staticFile(BASE+'media/aix_gare_routiere_manifestation_17102026_gabrielfrom92.webm')} style={{width:450,height:130,objectFit:'cover'}}/><div style={{padding:'7px 12px',fontSize:21,lineHeight:1.15,fontWeight:800,color:C.coral}}>{e.display}</div><div style={{padding:'0 12px',fontSize:17,color:C.blue}}>gabrielfrom92 · Wikimedia Commons · CC0 1.0</div></Reveal></>;
};
const Photos:React.FC<{s:string}>=({s})=>{
 const f=useCurrentFrame(),first=getElement(s,'e1'),second=getElement(s,'e2'),isSecond=f>=second.start_frame_local;
 const e=isSecond?second:first;
 return <><Reveal key={e.id} e={e} style={{...box(70,495,860),height:710,background:C.panel,borderRadius:12,overflow:'hidden'}}><Img src={staticFile(BASE+'media/'+(isSecond?'paris_crowd_republique_teargas_17102026_JJxFile_0012.jpg':'paris_firefighters_burning_car_17102026_JJxFile_0048.jpg'))} style={{width:860,height:600,objectFit:'contain'}}/><div style={{padding:'20px',fontSize:32,fontWeight:700}}>{e.display}</div></Reveal><div style={{...box(70,1490,860),fontSize:23,lineHeight:1.3,color:C.blue}}>{getElement(s,'credit').display}</div></>;
};
const Schematic:React.FC<{s:string}>=({s})=><><Reveal e={getElement(s,'e1')} style={box(70,500,860)}><svg width="860" height="250" viewBox="0 0 860 250"><text x="0" y="28" fill={C.blue} fontSize="25">MINH HỌA — không phải bản đồ thật</text><circle cx="110" cy="140" r="12" fill={C.white}/><circle cx="730" cy="140" r="12" fill={C.coral}/><path d="M135 140H705M135 125V155M705 125V155" stroke={C.coral} strokeWidth="4"/><text x="330" y="110" fill={C.coral} fontSize="55">200 m</text><text x="62" y="205" fill={C.white} fontSize="32">Élysée</text><text x="595" y="205" fill={C.white} fontSize="30">Điểm đối đầu</text></svg></Reveal>{['e2','e3','e4'].map((id,i)=><Card key={id} e={getElement(s,id)} y={795+i*130} size={33}/>)}</>;
const Building:React.FC<{s:string}>=({s})=><><Reveal e={getElement(s,'e1')} style={box(70,480,860)}><svg width="860" height="250"><text x="0" y="28" fill={C.blue} fontSize="24">MINH HỌA · không phải ảnh tòa nhà thật</text><path d="M150 210V110H370V70L430 40L490 70V110H710V210ZM120 210H740M370 110V210M490 110V210M185 140V185M245 140V185M305 140V185M550 140V185M610 140V185M670 140V185" fill="none" stroke={C.blue} strokeWidth="5"/></svg><div style={{fontSize:34,textAlign:'center'}}>{getElement(s,'e1').display}</div></Reveal>{['e2','e3','e4','e5'].map((id,i)=><Card key={id} e={getElement(s,id)} y={800+i*98} h={82} size={31}/>)}</>;
const Map:React.FC<{s:string}>=({s})=>{
 const f=useCurrentFrame();const cities=[{id:'e1',name:'Paris',x:240,y:125},{id:'e2',name:'Bordeaux',x:130,y:350},{id:'e3',name:'Lille',x:270,y:65},{id:'e4',name:'Marseille',x:335,y:430}];
 return <><div style={box(70,500,440)}><svg width="440" height="565"><text x="0" y="28" fill={C.blue} fontSize="24">MINH HỌA · FRANCE</text><path d="M160 70L290 50L400 170L415 355L325 490L155 455L45 250Z" fill={C.panel} stroke={C.blue} strokeWidth="3"/>{cities.map(c=>{const e=getElement(s,c.id),op=interpolate(f-e.start_frame_local,[0,6],[0,1],{extrapolateLeft:'clamp',extrapolateRight:'clamp'});return <g key={c.id} opacity={op}><circle cx={c.x} cy={c.y} r="8" fill={C.coral}/><text x={c.x-45} y={c.y+30} fill={C.white} fontSize="25">{c.name}</text></g>;})}</svg></div>{['e2','e3','e4'].map((id,i)=><Card key={id} e={getElement(s,id)} x={530} y={520+i*175} w={400} h={150} size={30}/>)}<Card e={getElement(s,'e5')} y={1090} h={100} size={31}/></>;
};
const Insurance:React.FC<{s:string}>=({s})=>{
 // Axis in real million EUR; solid lower bound + hatched range, no fake point estimate.
 const bars=[{id:'e3',low:220,high:220,x:160},{id:'e4',low:730,high:798,x:425},{id:'e5',low:1000,high:1200,x:690}];const scale=.29,baseline=1045;
 return <><Card e={getElement(s,'e1')} y={480} h={85} size={30}/><Card e={getElement(s,'e2')} y={580} h={85} size={30}/><div style={{...box(70,700,860),fontSize:25,color:C.blue}}>Thiệt hại bảo hiểm · triệu € · Plages chiffrées</div><div style={{...box(110,baseline,820),borderTop:`3px solid ${C.blue}`}}/><div style={{...box(70,baseline-17,40),fontSize:27}}>0</div>{bars.map(b=><Reveal key={b.id} e={getElement(s,b.id)} style={{...box(b.x,baseline-b.high*scale,210),height:b.high*scale}}><div style={{position:'absolute',bottom:0,left:25,width:145,height:b.low*scale,background:b.id==='e5'?C.coral:C.blue}}/>{b.high>b.low&&<div style={{position:'absolute',bottom:b.low*scale,left:25,width:145,height:(b.high-b.low)*scale,background:`repeating-linear-gradient(135deg,${C.coral}88 0,${C.coral}88 5px,transparent 5px,transparent 10px)`,border:`2px solid ${C.coral}`,boxSizing:'border-box'}}/>}<div style={{position:'absolute',top:b.high*scale+18,left:-12,width:235,textAlign:'center',fontSize:24,lineHeight:1.23,fontWeight:700,whiteSpace:'pre-line',color:b.id==='e5'?C.coral:C.white}}>{getElement(s,b.id).display}</div></Reveal>)}</>;
};
const Timeline:React.FC<{s:string}>=({s})=>{
 const ids=['timeline17','timeline22','e1'];return <><div style={{...box(177.5,685,655),height:3,background:C.border}}/>{ids.map((id,i)=>{const e=getElement(s,id);return <Reveal key={id} e={e} style={{...box(75+i*327.5,610,205),textAlign:'center',fontSize:29,lineHeight:1.3,whiteSpace:'pre-line',color:i===2?C.coral:C.white,fontWeight:800}}><div style={{height:15,width:15,borderRadius:'50%',background:i===2?C.coral:C.blue,margin:'65px auto 30px'}}/>{e.display}</Reveal>;})}<Card e={getElement(s,'e2')} y={925} size={38}/><Card e={getElement(s,'e3')} y={1090} size={33}/></>;
};
const Body:React.FC<{sc:Scene}>=({sc})=>{switch(sc.scene_id){case 's03':return <Social s={sc.scene_id}/>;case 's05':return <Contrast s={sc.scene_id}/>;case 's06':return <Broll sc={sc}/>;case 's07':return <Photos s={sc.scene_id}/>;case 's08':return <Stats s={sc.scene_id}/>;case 's09':return <Schematic s={sc.scene_id}/>;case 's10':return <Building s={sc.scene_id}/>;case 's12':return <Map s={sc.scene_id}/>;case 's15':return <Insurance s={sc.scene_id}/>;case 's18':return <Timeline s={sc.scene_id}/>;default:return <Generic sc={sc}/>;}};
type ViewProps={debug?:boolean;showCaptions?:boolean};
const SceneView:React.FC<{sc:Scene}&ViewProps>=({sc,debug=true,showCaptions=true})=>{
 const f=useCurrentFrame();return <AbsoluteFill><Title s={sc.scene_id}/><Body sc={sc}/>{showCaptions&&<CaptionsV2 scene={sc.scene_id}/>}{sc.scene_id!=='s07'&&<div style={{...box(70,1490,860),fontSize:24,lineHeight:1.3,color:C.blue}}>{getElement(sc.scene_id,'source').display}</div>}{debug&&<div style={{...box(70,1615,860),fontFamily:'monospace',fontSize:25,color:C.coral}}>V2 · {sc.scene_id} · frame {sc.start_frame+f} · {((sc.start_frame+f)/FPS).toFixed(2)}s · local {f}</div>}<div style={{...box(70,1690,860),fontSize:19,color:C.blue}}>Musique: Mesmerize · Kevin MacLeod (incompetech.com) · CC BY 4.0<br/>creativecommons.org/licenses/by/4.0/ · bed édité / mixé</div></AbsoluteFill>;
};
export const FranceRiotsFullV2:React.FC<ViewProps>=({debug=true,showCaptions=true})=>{
 const f=useCurrentFrame(),last=SCENES[SCENES.length-1];
 return <AbsoluteFill style={{background:C.bg,color:C.white,fontFamily:FONT}}><Audio src={staticFile(BASE+music.public_bed_filename)} loop volume={f=>.7*music.gain_linear*Math.min(1,f/24,Math.max(0,(TOTAL_FRAMES-f)/45))}/>{SCENES.map(sc=><Sequence key={sc.scene_id} from={sc.start_frame} durationInFrames={sc.scene_frames+(sc===last?30:0)}><Sequence durationInFrames={Math.ceil(sc.voice_seconds*FPS)}><Audio src={staticFile(BASE+`v2/voice_${sc.scene_id}.wav`)}/></Sequence><SceneView sc={sc} debug={debug} showCaptions={showCaptions}/></Sequence>)}</AbsoluteFill>;
};
