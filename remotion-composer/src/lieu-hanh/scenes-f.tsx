import React from "react";
import { Caption, Chip, InkPanel, InkDraw, QuoteSlate, Reveal, SceneTitle, useA } from "./common";
import { C, FONT, SceneProps } from "./theme";

export const Sc042: React.FC<SceneProps> = () => {
  const A=useA();
  return <InkPanel img="img-042">
    <div style={{position:"absolute",left:140,top:150,width:1560}}>
      <SceneTitle title="Mỗi trang giữ một bản kể" eyebrow="chuỗi trang qua các thế hệ" startFrac={A("Mỗi trang giữ")} align="center" titleSize={70}/>
      <Reveal startFrac={A("Mỗi trang giữ")+0.2} style={{marginTop:56}}><div style={{textAlign:"center",fontFamily:FONT.body,fontSize:38,color:C.cream,background:"rgba(20,17,13,.88)",display:"inline-block",padding:"28px 44px",borderRadius:10}}>Khoảng cách giữa truyện và lịch sử không bị xóa.</div></Reveal>
    </div><Caption sceneId="sc042" startFrame={24474}/>
  </InkPanel>;
};

export const Sc043: React.FC<SceneProps> = () => {
  const A=useA();
  return <InkPanel img="img-043">
    <div style={{position:"absolute",left:200,top:110,right:200}}>
      <SceneTitle title="Tứ Bất Tử — mục lục bách khoa" eyebrow="quote C08 · danh sách phổ biến đương đại" startFrac={A("Trở lại lớp")} align="center" titleSize={64}/>
      <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:18,marginTop:40}}>{[
        ["Sơn Tinh","Sơn Tinh"],["Chử Đồng Tử","Chử Đồng Tử"],["Thánh Gióng","Thánh Gióng"],["Liễu Hạnh Công Chúa","Liễu Hạnh Công Chúa"]
      ].map(([name,anchor])=><Reveal key={name} startFrac={A(anchor)} dy={12}><div style={{width:820,textAlign:"center",padding:"20px 36px",background:"rgba(36,31,26,.94)",border:`2px solid ${C.amber}88`,borderRadius:8,fontFamily:FONT.display,fontSize:48,color:name.includes("Liễu")?C.amber:C.cream}}>{name}</div></Reveal>)}</div>
    </div><Caption sceneId="sc043" startFrame={24609}/>
  </InkPanel>;
};

export const Sc044: React.FC<SceneProps> = () => {
  const A=useA();
  return <InkPanel img="img-044">
    <Reveal startFrac={A("Trong danh sách")} style={{position:"absolute",bottom:240,left:130,right:130}}><div style={{fontFamily:FONT.display,fontSize:54,color:C.cream,background:"rgba(26,23,20,.9)",padding:36,lineHeight:1.4, textAlign:"center"}}>Bốn dòng tên co lại thành bốn con dấu —<br/>dấu thứ tư: tà áo nữ.</div></Reveal>
    <Caption sceneId="sc044" startFrame={25051}/>
  </InkPanel>;
};

export const Sc045: React.FC<SceneProps> = () => {
  const A=useA();
  return <InkPanel img="img-045" mode="card" x={110} y={100} w={760} h={880}>
    <div style={{position:"absolute",left:940,top:190,width:830}}>
      <SceneTitle title="Sự hiện diện tiếp diễn" eyebrow="một cách đọc" startFrac={A("Có thể đọc")} titleSize={70}/>
      <Reveal startFrac={A("giữ bà ở lại")} style={{marginTop:44}}><div style={  {fontFamily:FONT.display,fontSize:52,color:C.cream,background:"rgba(26,23,20,.92)",borderLeft:`8px solid ${C.amber}`,padding:36,lineHeight:1.4}}>Như cách người đời giữ bà ở lại.</div></Reveal>
      <Reveal startFrac={A("tiếp diễn")+0.1} style={{marginTop:24}}><Chip>Mực loang — dấu vết còn ấm</Chip></Reveal>
    </div><Caption sceneId="sc045" startFrame={25302}/>
  </InkPanel>;
};

export const Sc046: React.FC<SceneProps> = () => {
  const A=useA();
  return <InkPanel img="img-046">
    <div style={{position:"absolute",left:110,top:120,right:110}}>
      <SceneTitle title="Ba lớp — soi đèn lần cuối" eyebrow="tổng kết tập" startFrac={A("Lớp bản kể")} align="center" titleSize={66}/>
      <div style={{display:"flex",gap:34,marginTop:50,justifyContent:"center"}}>{[
        ["Lớp bản kể","chén ngọc · mùng ba tháng Ba · phố Cát",C.amber,"Lớp bản kể"],
        ["Lớp đền thờ","dấu vết thực hành — Nam Giao · Phủ Dầy",C.teal,"Lớp đền thờ"],
        ["Lớp di sản","UNESCO ghi danh thực hành — không ghi danh nhân vật",C.cream,"Lớp di sản"]
      ].map(([name,note,color,anchor])=><Reveal key={name as string} startFrac={A(anchor as string)} dy={16}><div style={{width:500,padding:"32px 30px",background:"rgba(36,31,26,.94)",border:`2px solid ${color}aa`,borderRadius:10}}>
        <div style={{fontFamily:FONT.display,fontSize:46,color,fontWeight:700}}>{name}</div>
        <div style={{fontFamily:FONT.body,fontSize:28,color:C.cream,marginTop:18,lineHeight:1.45}}>{note}</div>
      </div></Reveal>)}</div>
    </div><Caption sceneId="sc046" startFrame={25431}/>
  </InkPanel>;
};

export const Sc047: React.FC<SceneProps> = () => {
  const A=useA();
  return <InkPanel img="img-047" mode="card" x={110} y={110} w={780} h={860}>
    <div style={{position:"absolute",left:950,top:170,width:840}}>
      <SceneTitle title="Có thể đọc là" subtitle="hai dòng ghi danh — dân thờ và triều đình" startFrac={A("Rồi mỗi thế")} titleSize={70}/>
      <div style={{display:"flex",gap:30,marginTop:44}}>{[
        ["dân thờ","trước",C.amber,"dân thờ"],["triều đình","chính danh · sau",C.redLight,"chính danh"]
      ].map(([name,note,color,anchor])=><Reveal key={name as string} startFrac={A(anchor as string)}><div style={{width:380,padding:30,background:"rgba(36,31,26,.94)",border:`2px solid ${color}aa`,borderRadius:10,textAlign:"center"}}>
        <div style={{fontFamily:FONT.display,fontSize:48,color,fontWeight:700}}>{name}</div>
        <div style={{fontFamily:FONT.mono,fontSize:26,color:C.mute,marginTop:16}}>{note}</div>
      </div></Reveal>)}</div>
      <Reveal startFrac={A("một cách đọc")+0.3} style={{marginTop:26}}><Chip>Một cách đọc — không độc quyền</Chip></Reveal>
    </div><Caption sceneId="sc047" startFrame={26027}/>
  </InkPanel>;
};

export const Sc048: React.FC<SceneProps> = () => {
  const A=useA();
  return <InkPanel img="img-048">
    <div style={{position:"absolute",left:150,top:140,width:780}}>
      <Reveal startFrac={A("Tập sau, ta")}><div style={{fontFamily:FONT.mono,fontSize:30,color:C.mute,letterSpacing:3}}>TẬP SAU</div></Reveal>
      <Reveal startFrac={A("Hai Bà Trưng")}><div style={{fontFamily:FONT.display,fontWeight:800,fontSize:96,color:C.white,marginTop:20,lineHeight:1.1}}>Hai Bà Trưng</div></Reveal>
      <Reveal startFrac={A("Sơn Tinh")} style={{marginTop:40}}><div style={{fontFamily:FONT.mono,fontSize:28,color:C.mute,letterSpacing:2,lineHeight:1.8}}>CÁC TẬP ĐÃ CÓ<br/>Sơn Tinh · Chử Đồng Tử · Thánh Gióng</div></Reveal>
    </div><Caption sceneId="sc048" startFrame={26203}/>
  </InkPanel>;
};

export const Sc049: React.FC<SceneProps> = () => {
  const A=useA();
  return <InkPanel img="img-049">
    <div style={{position:"absolute",left:0,right:0,top:190,textAlign:"center"}}>
      <Reveal startFrac={A("Mùa Những vị")}><div style={{fontFamily:FONT.mono,fontSize:32,color:C.tealLight,letterSpacing:5}}>MÙA MỚI</div></Reveal>
      <Reveal startFrac={A("Mùa Những vị")+0.08}><div style={{fontFamily:FONT.display,fontWeight:800,fontSize:110,color:C.white,marginTop:26,lineHeight:1.15}}>Những vị thần ở lại</div></Reveal>
      <Reveal startFrac={A("theo dấu")} style={{marginTop:36}}><div style={{fontFamily:FONT.body,fontSize:36,color:C.cream}}>Theo dấu những câu chuyện tưởng xa xưa mà vẫn sống trong đời thường hôm nay.</div></Reveal>
      <Reveal startFrac={A("theo dõi")} style={{marginTop:30}}><Chip color={C.tealLight}>MỜI THEO DÕI</Chip></Reveal>
    </div><Caption sceneId="sc049" startFrame={26505}/>
  </InkPanel>;
};

export const Sc050: React.FC<SceneProps> = () => {
  const A=useA();
  return <InkPanel img="img-050">
    <div style={{position:"absolute",left:0,right:0,top:230,textAlign:"center"}}>
      <Reveal startFrac={A("Bên ngưỡng cửa")}><div style={{fontFamily:FONT.display,fontWeight:700,fontSize:64,color:C.cream,lineHeight:1.4}}>Bên ngưỡng cửa đền tháng Ba,<br/>lời kể lắng xuống.</div></Reveal>
      <Reveal startFrac={A("khép trang truyện")} style={{marginTop:44}}><div style={{fontFamily:FONT.mono,fontSize:30,color:C.tealLight,letterSpacing:3}}>...MỘT THỰC HÀNH VẪN ĐANG SỐNG</div></Reveal>
    </div><Caption sceneId="sc050" startFrame={26777}/>
  </InkPanel>;
};
