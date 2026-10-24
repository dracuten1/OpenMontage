import React from "react";
import { Caption, Chip, InkPanel, InkDraw, QuoteSlate, Reveal, SceneTitle, useA } from "./common";
import { C, FONT, SceneProps } from "./theme";

export const Sc025: React.FC<SceneProps> = () => {
  const A=useA();
  return <InkPanel img="img-025" mode="card" x={110} y={120} w={780} h={840}>
    <div style={{position:"absolute",left:950,top:130,width:840}}>
      <SceneTitle title="Một hay hai chuyện?" eyebrow="câu hỏi biên tập" startFrac={A("Vẫn ở lớp")} titleSize={68}/>
      <Reveal startFrac={A("một hệ Mẫu")} style={{marginTop:40}}><Chip color={C.tealLight}>Một hệ Mẫu — nhiều vị; bà không thay cho tất cả</Chip></Reveal>
      <Reveal startFrac={A("thần chủ")} style={{marginTop:30}}><div style={{fontFamily:FONT.body,fontSize:34,color:C.cream,background:"rgba(20,17,13,.9)",padding:28,lineHeight:1.5}}>Thờ Mẫu Tam phủ và truyền thuyết Liễu Hạnh — hai chuyện hay một?</div></Reveal>
    </div><Caption sceneId="sc025" startFrame={16535}/>
  </InkPanel>;
};

export const Sc026: React.FC<SceneProps> = () => {
  const A=useA();
  return <InkPanel img="img-026">
    <div style={{position:"absolute",left:200,top:110,right:200}}>
      <SceneTitle title="Ba nghi thức của hội Phủ Dầy" eyebrow="quote C12b · vi.wiki Phủ Dầy" startFrac={A("Từ trang ghi")} accent={C.tealLight} titleSize={70} align="center"/>
      <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:22,marginTop:44}}>{[
        ["Lễ Rước Mẫu Thỉnh Kinh","rước kinh"],["Lễ Rước Đuốc tại Phủ Chính","rước đuốc"],["Lễ kéo chữ Hoa Trượng Hội","kéo chữ"]
      ].map(([name,anchor])=><Reveal key={name} startFrac={A(anchor)} dy={16}><div style={{width:940,textAlign:"center",padding:"28px 40px",background:"rgba(36,31,26,.94)",border:`2px solid ${C.teal}`,borderRadius:10,fontFamily:FONT.display,fontSize:54,color:C.cream}}>{name}</div></Reveal>)}</div>
    </div><Caption sceneId="sc026" startFrame={17345}/>
  </InkPanel>;
};

export const Sc027: React.FC<SceneProps> = () => {
  const A=useA();
  return <InkPanel img="img-027">
    <Reveal startFrac={A("Chỉ riêng những")} style={{position:"absolute",bottom:240,left:130,right:130}}><div style={{fontFamily:FONT.display,fontSize:58,color:C.cream,background:"rgba(26,23,20,.9)",padding:40,lineHeight:1.4}}>Tên gọi thôi đã đưa câu chuyện trở về với việc người đời cùng thực hành nghi lễ.</div></Reveal>
    <Caption sceneId="sc027" startFrame={17858}/>
  </InkPanel>;
};

export const Sc028: React.FC<SceneProps> = () => {
  const A=useA();
  return <InkPanel img="img-028" mode="card" x={110} y={80} w={760} h={920}>
    <div style={{position:"absolute",left:940,top:130,width:840}}>
      <SceneTitle title="Hai chiều của danh xưng" eyebrow="lớp đền thờ nhìn lại" startFrac={A("Từ lớp đền")} titleSize={68}/>
      <div style={{marginTop:40}}><QuoteSlate text="Mẫu nghi thiên ha" source="Nghiên cứu Tôn giáo 10/2010 · C15" startFrac={A("Mẫu nghi thiên hạ")} endFrac={A("Mẫu nghi thiên hạ")+0.08} size={58}/></div>
      <Reveal startFrac={A("tôn phong")} style={{marginTop:30}}><Chip color={C.redLight}>Triều đình tôn phong · thượng đẳng thần</Chip></Reveal>
      <Reveal startFrac={A("đền và hội")} style={{marginTop:30}}><div style={{fontFamily:FONT.body,fontSize:36,color:C.cream,background:"rgba(20,17,13,.9)",padding:28,lineHeight:1.5}}>Không thu tiếng Mẫu về một văn kiện duy nhất.</div></Reveal>
    </div><Caption sceneId="sc028" startFrame={18257}/>
  </InkPanel>;
};

export const Sc029: React.FC<SceneProps> = () => {
  const A=useA();
  return <InkPanel img="img-029">
    <div style={{position:"absolute",left:130,top:140,width:820}}>
      <SceneTitle title="Có thể đọc là" eyebrow="cách đọc biên tập · không kết luận duy nhất" startFrac={A("Trở lại lớp")} titleSize={76}/>
      <Reveal startFrac={A("giữ lại")} style={{marginTop:44}}><div style={{background:"rgba(26,23,20,.92)",borderLeft:`8px solid ${C.amber}`,padding:36,fontFamily:FONT.display,fontSize:52,color:C.cream,lineHeight:1.4}}>Câu chuyện cộng đồng muốn giữ lại một người phụ nữ.</div></Reveal>
      <Reveal startFrac={A("Đền và danh xưng")} style={{marginTop:26}}><Chip>Đền và danh xưng — cách người đời trả lời</Chip></Reveal>
    </div><Caption sceneId="sc029" startFrame={19136}/>
  </InkPanel>;
};

export const Sc030: React.FC<SceneProps> = () => {
  const A=useA();
  return <InkPanel img="img-030" mode="card" x={110} y={80} w={820} h={920}>
    <div style={{position:"absolute",left:990,top:120,width:800}}>
      <SceneTitle title="1 · 12 · 2016" eyebrow="lớp ghi danh di sản" startFrac={A("Bây giờ là")} titleSize={92}/>
      <Reveal startFrac={A("thực hành")}><div style={{marginTop:30,padding:30,background:"rgba(20,17,13,.9)",fontFamily:FONT.display,fontSize:42,color:C.cream,lineHeight:1.4}}><span style={{color:C.tealLight}}>Thực hành Tín ngưỡng thờ Mẫu Tam phủ của người Việt</span> — ghi danh UNESCO, lần thứ 11.</div></Reveal>
      <Reveal startFrac={A("mười bốn tỉnh")} style={{marginTop:26}}><Chip color={C.tealLight}>14 TỈNH THÀNH</Chip></Reveal>
      <Reveal startFrac={A("Addis Ababa")} style={{marginTop:20}}><div style={{fontFamily:FONT.mono,fontSize:28,color:C.mute}}>Addis Ababa · Ethiopia</div></Reveal>
    </div><Caption sceneId="sc030" startFrame={19981}/>
  </InkPanel>;
};

export const Sc031: React.FC<SceneProps> = () => {
  const A=useA();
  return <InkPanel img="img-031" mode="card" x={110} y={120} w={800} h={840}>
    <div style={{position:"absolute",left:970,top:180,width:820}}>
      <SceneTitle title="Điều hồ sơ ghi danh" eyebrow="đối tượng được ghi danh" startFrac={A("Ở lớp hồ")} accent={C.tealLight} titleSize={66}/>
      <Reveal startFrac={A("thực hành tín ngưỡng")} style={{marginTop:44}}><div style={{fontFamily:FONT.display,fontSize:62,color:C.cream,borderBottom:`4px solid ${C.teal}`,display:"inline-block",paddingBottom:14}}>Thực hành tín ngưỡng</div></Reveal>
      <Reveal startFrac={A("truyện Liễu Hạnh")} style={{marginTop:36}}><div style={{fontFamily:FONT.mono,fontSize:32,color:C.mute,lineHeight:1.6}}>KHÔNG ghi danh truyện Liễu Hạnh.<br/>KHÔNG chứng thực nhân vật.</div></Reveal>
    </div><Caption sceneId="sc031" startFrame={21066}/>
  </InkPanel>;
};

export const Sc032: React.FC<SceneProps> = () => {
  const A=useA();
  return <InkPanel img="img-032">
    <div style={{position:"absolute",left:140,top:170,width:1600}}>
      <SceneTitle title="Sự tách bạch" eyebrow="lớp hồ sơ — ghi chép lễ hội" startFrac={A("Sự tách bạch")} align="center" titleSize={104}/>
      <Reveal startFrac={A("Sự tách bạch") + 0.2} style={{ marginTop: 60 }}>
        <div style={{ textAlign: "center", fontFamily: FONT.body, fontSize: 40, color: C.cream, background: "rgba(20,17,13,0.88)", padding: "30px 44px", borderRadius: 10, display: "inline-block" }}>
          Danh hiệu thuộc về lớp thực hành — không mượn danh lớp kể.
        </div>
      </Reveal>
    </div><Caption sceneId="sc032" startFrame={21458}/>
  </InkPanel>;
};
