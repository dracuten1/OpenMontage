import React from "react";
import { Caption, Chip, InkPanel, InkDraw, QuoteSlate, Reveal, SceneTitle, useA } from "./common";
import { C, FONT, SceneProps } from "./theme";

export const Sc033: React.FC<SceneProps> = () => {
  const A=useA();
  return <InkPanel img="img-033">
    <div style={{position:"absolute",left:110,top:120,right:110}}>
      <SceneTitle title="Ba tờ — không lớp nào mượn danh lớp khác" eyebrow="tổng kết các lớp" startFrac={A("Đền thờ giữ")} align="center" titleSize={64}/>
      <div style={{display:"flex",gap:34,marginTop:56,justifyContent:"center"}}>{[
        ["Bản kể","giữ một câu chuyện",C.amber,"bản kể"],["Đền thờ","giữ dấu vết việc thờ",C.teal,"đền thờ"],["Ghi danh di sản","giữ sự ghi nhận của hôm nay",C.cream,"ghi danh di sản"]
      ].map(([name,note,color,anchor])=><Reveal key={name as string} startFrac={A(anchor as string)} dy={18}><div style={{width:470,padding:"34px 32px",background:"rgba(36,31,26,.94)",border:`2px solid ${color}aa`,borderRadius:10}}>
        <div style={{fontFamily:FONT.display,fontSize:50,color,fontWeight:700}}>{name}</div>
        <div style={{fontFamily:FONT.body,fontSize:30,color:C.cream,marginTop:20}}>{note}</div>
      </div></Reveal>)}</div>
    </div><Caption sceneId="sc033" startFrame={21662}/>
  </InkPanel>;
};

export const Sc034: React.FC<SceneProps> = () => {
  const A=useA();
  return <InkPanel img="img-034">
    <Reveal startFrac={A("Từ lớp hồ")} style={{position:"absolute",top:130,left:130}}><Chip color={C.tealLight}>TỪ LỚP HỒ SƠ — TRỞ LẠI NGƯỠNG CỬA ĐỀN</Chip></Reveal>
    <Caption sceneId="sc034" startFrame={21932}/>
  </InkPanel>;
};

export const Sc035: React.FC<SceneProps> = () => {
  const A=useA();
  return <InkPanel img="img-035" mode="card" x={110} y={110} w={780} h={860}>
    <div style={{position:"absolute",left:950,top:140,width:840}}>
      <SceneTitle title="Mùng ba tháng Ba" eyebrow="hai tờ giấy — một dòng giữa" startFrac={A("Trong bản kể,")} titleSize={66}/>
      <div style={{marginTop:40,display:"flex",gap:28}}>{[["Bản kể","ngày tiên chúa mất",C.amber,"ngày tiên chúa mất"],["Ghi chép lễ hội","ngày hội Phủ Dầy",C.teal,"ngày hội Phủ Dầy"]].map(([name,note,color,anchor])=><Reveal key={name as string} startFrac={A(anchor as string)}><div style={{width:390,padding:30,background:"rgba(36,31,26,.94)",border:`2px solid ${color}aa`,borderRadius:10}}>
        <div style={{fontFamily:FONT.mono,fontSize:26,color,letterSpacing:2}}>{String(name).toUpperCase()}</div>
        <div style={{fontFamily:FONT.display,fontSize:42,color:C.cream,marginTop:20}}>{note}</div>
      </div></Reveal>)}</div>
    </div><Caption sceneId="sc035" startFrame={22129}/>
  </InkPanel>;
};

export const Sc036: React.FC<SceneProps> = () => {
  const A=useA();
  return <InkPanel img="img-036">
    <Reveal startFrac={A("Một bên ghi")} style={{position:"absolute",bottom:230,left:130,right:130}}><div style={{fontFamily:FONT.display,fontSize:52,color:C.cream,background:"rgba(26,23,20,.9)",padding:36,lineHeight:1.4}}>Một bên ghi chuyện kể — một bên ghi lễ hội; cùng một ngày, hai lớp tài liệu.</div></Reveal>
    <Caption sceneId="sc036" startFrame={22435}/>
  </InkPanel>;
};

export const Sc037: React.FC<SceneProps> = () => {
  const A=useA();
  return <InkPanel img="img-037" mode="card" x={110} y={90} w={760} h={900}>
    <div style={{position:"absolute",left:930,top:140,width:850}}>
      <SceneTitle title="Ngày tháng rất cụ thể" eyebrow="theo cách kể / bách khoa" startFrac={A("Ở lớp tổng")} titleSize={64}/>
      <Reveal startFrac={A("ngày sinh")} style={{marginTop:38}}><div style={{fontFamily:FONT.mono,fontSize:30,color:C.cream,background:"rgba(20,17,13,.9)",padding:26,lineHeight:1.6}}>SINH 07/09/1557 (15/8 · Đinh Tỵ)<br/>MẤT 21/03/1577 (3/3 · Đinh Sửu)</div></Reveal>
      <Reveal startFrac={A("bách khoa")} style={{marginTop:26}}><Chip color={C.mute}>BÁCH KHOA TỔNG HỢP — KHÔNG PHẢI VĂN BẢN GỐC</Chip></Reveal>
    </div><Caption sceneId="sc037" startFrame={22675}/>
  </InkPanel>;
};

export const Sc038: React.FC<SceneProps> = () => {
  const A=useA();
  return <InkPanel img="img-038">
    <div style={{position:"absolute",left:140,top:160,width:1560}}>
      <SceneTitle title="Ngày tháng rất cụ thể" eyebrow="lớp tổng hợp — theo cách kể / bách khoa" startFrac={A("Đó là cách")} align="center" titleSize={66}/>
      <Reveal startFrac={A("không phải chứng cứ")} style={{marginTop:60}}><div style={{textAlign:"center",fontFamily:FONT.display,fontSize:64,color:C.cream,background:"rgba(26,23,20,.92)",display:"inline-block",padding:"30px 60px",borderRadius:10}}>Không phải chứng cứ.</div></Reveal>
    </div><Caption sceneId="sc038" startFrame={23143}/>
  </InkPanel>;
};

export const Sc039: React.FC<SceneProps> = () => {
  const A = useA();
  return (
    <InkPanel img="img-039" mode="card" x={110} y={100} w={760} h={880}>
      <div style={{ position: "absolute", left: 940, top: 170, width: 830 }}>
        <SceneTitle
          title="1557 - cánh cửa mở truyện"
          eyebrow="Phan Kế Bính - thời vua Anh-tôn"
          startFrac={A("Một ngày được")}
          titleSize={70}
        />
        <Reveal startFrac={A("theo bách khoa")} style={{ marginTop: 44 }}>
          <Chip>mốc mở truyện bản kể - không phải niên đại lịch sử của nhân vật</Chip>
        </Reveal>
      </div>
      <Caption sceneId="sc039" startFrame={23479} />
    </InkPanel>
  );
};

export const Sc040: React.FC<SceneProps> = () => {
  const A=useA();
  return <InkPanel img="img-040" mode="card" x={110} y={80} w={800} h={920}>
    <div style={{position:"absolute",left:970,top:150,width:820}}>
      <SceneTitle title="Lớp tư liệu văn bản" eyebrow="đọc chậm" startFrac={A("Ở lớp tư")} titleSize={70}/>
      <div style={{marginTop:40}}><QuoteSlate text="Quảng Cung linh từ phả ký của Vũ Huy Trác, 1781" source="Nghiên cứu Tôn giáo 10/2010" startFrac={A("Quảng Cung linh từ phả ký")} endFrac={A("Quảng Cung linh từ phả ký")+0.3} size={46}/></div>
      <Reveal startFrac={A("đọc chậm")} style={{marginTop:30}}><Chip color={C.tealLight}>Niên đại gần với «Vân Cát thần nữ» của Đoàn Thị Điểm</Chip></Reveal>
    </div><Caption sceneId="sc040" startFrame={23717}/>
  </InkPanel>;
};

export const Sc041: React.FC<SceneProps> = () => {
  const A=useA();
  return <InkPanel img="img-041" mode="card" x={1030} y={90} w={760} h={900}>
    <div style={{position:"absolute",left:110,top:160,width:820}}>
      <SceneTitle title="1781" eyebrow="mốc tách đôi" startFrac={A("Đó là trang")} titleSize={150}/>
      <Reveal startFrac={A("Đó là trang viết")} style={{marginTop:20}}><div style={{fontFamily:FONT.body,fontSize:38,color:C.cream,background:"rgba(20,17,13,.9)",padding:30,lineHeight:1.5}}>Niên đại <span style={{color:C.amber,fontWeight:700}}>văn bản</span> — không phải niên đại <span style={{color:C.tealLight,fontWeight:700}}>nhân vật</span>.</div></Reveal>
      <Reveal startFrac={A("ghi chép và kể lại")} style={{marginTop:24}}><div style={{fontFamily:FONT.mono,fontSize:28,color:C.mute}}>trang viết thuộc thế kỷ mười tám</div></Reveal>
    </div><Caption sceneId="sc041" startFrame={24194}/>
  </InkPanel>;
};
