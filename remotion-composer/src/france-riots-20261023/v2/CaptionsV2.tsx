import React from 'react';
import {useCurrentFrame} from 'remotion';
import {CAPTIONS,FPS} from './timingV2';
import {C} from '../theme';
export const CaptionsV2:React.FC<{scene:string}>=({scene})=>{
 const ms=useCurrentFrame()/FPS*1000;
 const c=CAPTIONS[scene]?.find(c=>ms>=c.startMs&&ms<c.endMs);
 if(!c)return null;
 return <div style={{position:'absolute',left:70,top:1250,width:860,height:210,display:'flex',alignItems:'center',justifyContent:'center',textAlign:'center',fontSize:c.text.length>60?36:42,lineHeight:1.3,fontWeight:700,color:C.white,background:'#0F172AEE',padding:'12px 24px',boxSizing:'border-box',borderRadius:12}}>{c.text}</div>;
};
