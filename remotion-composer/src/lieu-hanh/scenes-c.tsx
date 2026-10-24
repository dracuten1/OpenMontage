import React from "react";
import { Caption, Chip, InkPanel, InkDraw, QuoteSlate, Reveal, SceneTitle, useA } from "./common";
import { C, FONT, SceneProps } from "./theme";

export const Sc017: React.FC<SceneProps> = () => {
  const A = useA();
  return <InkPanel img="img-017">
    <div style={{position:"absolute",left:110,top:130,right:110}}>
      <SceneTitle title="Mỗi bản gọi khác" eyebrow="lớp kiểm chứng" startFrac={A("Ở lớp kiểm")} accent={C.tealLight}/>
      <div style={{display:"flex",gap:36,marginTop:60}}>{[
        ["Yên-thái","Phan Kế Bính"],["An Thái","bản dân gian"],["Tiên Hương","tổng hợp bách khoa"]
      ].map(([name,source])=><Reveal key={name} startFrac={A(name)}><div style={{width:480,padding:32,background:"rgba(26,23,20,.94)",border:`2px solid ${C.teal}`,borderRadius:10}}>
        <div style={{fontFamily:FONT.display,fontSize:58,color:C.cream}}>{name}</div>
        <div style={{fontFamily:FONT.mono,fontSize:28,color:C.tealLight,marginTop:24}}>{source}</div>
      </div></Reveal>)}</div>
      <Reveal startFrac={A("mỗi bản gọi khác")} style={{marginTop:60}}><Chip>Giữ cách gọi theo từng nguồn — không ép thành một tên đúng</Chip></Reveal>
    </div><Caption sceneId="sc017" startFrame={9593}/>
  </InkPanel>;
};

export const Sc018: React.FC<SceneProps> = () => {
  const A=useA();
  return <InkPanel img="img-018" mode="card" x={100} y={80} w={760} h={920}>
    <div style={{position:"absolute",left:930,top:160,width:850}}>
      <SceneTitle title="Lần thứ hai" eyebrow="cấu trúc của cách kể" startFrac={A("Vẫn ở lớp")}/>
      <div style={{marginTop:50,display:"flex",gap:24}}>{["Phố Cát","Đền Sòng"].map(name=><Reveal key={name} startFrac={A(name)}><Chip color={C.tealLight}>{name}</Chip></Reveal>)}</div>
      <Reveal startFrac={A("hai lần")} style={{marginTop:50}}><div style={{padding:34,background:"rgba(20,17,13,.9)",fontFamily:FONT.body,fontSize:36,color:C.cream,lineHeight:1.5}}>Hai lần giáng sinh — nhận định nghiên cứu về cấu trúc văn bản, không phải hai lần được quan sát.</div></Reveal>
    </div><Caption sceneId="sc018" startFrame={10467}/>
  </InkPanel>;
};

export const Sc019: React.FC<SceneProps> = () => {
  const A=useA();
  return <InkPanel img="img-019">
    <div style={{position:"absolute",left:110,top:130,width:800}}>
      <SceneTitle title="Đèo Ngang · Phố Cát" eyebrow="trong lời kể" startFrac={A("Ta trở lại")} titleSize={78}/>
      <Reveal startFrac={A("quán nước")} style={{marginTop:48}}><Chip>Quán nước bên đường — giữ trong khung lời kể</Chip></Reveal>
    </div><Caption sceneId="sc019" startFrame={11355}/>
  </InkPanel>;
};

export const Sc020: React.FC<SceneProps> = () => {
  const A=useA();
  return <InkPanel img="img-020" mode="card" x={1040} y={90} w={760} h={900}>
    <div style={{position:"absolute",left:110,top:170,width:820}}>
      <SceneTitle title="Một quyền lực buộc kẻ vô lễ trả giá" eyebrow="lớp bản kể" startFrac={A("Tiếp đoạn vừa")} titleSize={70}/>
      <Reveal startFrac={A("bán nước")} style={{marginTop:40}}><Chip>Chiếc chén nước — không dựng cảnh hiện hình</Chip></Reveal>
      <Reveal startFrac={A("không cần tả")} style={{marginTop:40}}><div style={{padding:30,background:"rgba(20,17,13,.9)",fontFamily:FONT.body,fontSize:36,color:C.cream,lineHeight:1.5}}>Không tả thân thể. Không lấy đau đớn làm điều gây thích thú.</div></Reveal>
    </div><Caption sceneId="sc020" startFrame={12259}/>
  </InkPanel>;
};

export const Sc021: React.FC<SceneProps> = () => {
  const A=useA();
  return <InkPanel img="img-021" mode="card" x={110} y={80} w={740} h={920}>
    <div style={{position:"absolute",left:930,top:170,width:850}}>
      <SceneTitle title="Cách gọi thay đổi theo phía đang nhìn" eyebrow="xung đột trong truyện" startFrac={A("Bản kể đẩy")} titleSize={68}/>
      <div style={{marginTop:48}}><QuoteSlate text="nghi là yêu quái" source="cách gọi của triều đình trong bản kể" startFrac={A("nghi là yêu quái")} endFrac={A("nghi là yêu quái")+0.08} size={62}/></div>
      <Reveal startFrac={A("tan phá")} style={{marginTop:40}}><Chip color={C.redLight}>Không biến cuộc tiễu trừ thành trận đánh lịch sử</Chip></Reveal>
    </div><Caption sceneId="sc021" startFrame={13102}/>
  </InkPanel>;
};

export const Sc022: React.FC<SceneProps> = () => {
  const A=useA();
  return <InkPanel img="img-022" mode="card" x={1030} y={80} w={760} h={920}>
    <div style={{position:"absolute",left:110,top:140,width:820}}>
      <SceneTitle title="Dân cầu khấn trước — triều đình phong sau" eyebrow="chuỗi kể" startFrac={A("Bản kể tiếp")} titleSize={66}/>
      <Reveal startFrac={A("Mã-vàng")} style={{marginTop:42}}><Chip color={C.redLight}>Mã-vàng công chúa</Chip></Reveal>
      <Reveal startFrac={A("Chế-thắng")} style={{marginTop:30}}><div style={{fontFamily:FONT.display,fontSize:48,color:C.cream,background:"rgba(26,23,20,.94)",padding:28,border:`2px solid ${C.red}`}}>Chế-thắng bảo hòa-diệu đại vương</div></Reveal>
      <Reveal startFrac={A("đến giờ vẫn còn")} style={{marginTop:32}}><div style={{fontFamily:FONT.mono,fontSize:28,color:C.cream}}>«đến giờ vẫn còn» — lời người chép ở thời bản kể</div></Reveal>
    </div><Caption sceneId="sc022" startFrame={13954}/>
  </InkPanel>;
};

export const Sc023: React.FC<SceneProps> = () => {
  const A=useA();
  return <InkPanel img="img-023">
    <div style={{position:"absolute",left:140,top:160,width:1580}}>
      <SceneTitle title="Đi cạnh nhau" eyebrow="từ truyện sang đền thờ" startFrac={A("Ta bước sang")} titleSize={108}/>
      <Reveal startFrac={A("đi cạnh nhau")} style={{marginTop:70}}><div style={{background:"rgba(26,23,20,.92)",borderLeft:`8px solid ${C.teal}`,padding:44,fontFamily:FONT.display,fontSize:66,color:C.cream}}>Không làm chứng thay nhau.</div></Reveal>
    </div><Caption sceneId="sc023" startFrame={14887}/>
  </InkPanel>;
};

export const Sc024: React.FC<SceneProps> = () => {
  const A=useA();
  return <InkPanel img="img-024" mode="card" x={110} y={80} w={760} h={740}>
    <div style={{position:"absolute",left:940,top:140,width:840,maxHeight:660}}>
      <SceneTitle title="Vũ trung tùy bút" eyebrow="ghi chép phong tục · bản dịch hiện đại" startFrac={A("Ở lớp thực")} accent={C.tealLight} titleSize={72}/>
      <svg width={820} height={150} viewBox="0 0 820 240"><path d="M 80 200 H 740 M 150 150 H 670 M 220 100 H 600" fill="none" stroke={C.teal} strokeWidth={5}/></svg>
      <Reveal startFrac={A("Nam Giao")}><Chip color={C.tealLight}>Nam Giao — lịch sử thực hành</Chip></Reveal>
      <Reveal startFrac={A("đền thờ bà")} style={{marginTop:20}}><div style={{fontFamily:FONT.body,fontSize:34,color:C.cream,lineHeight:1.45,background:"rgba(20,17,13,.9)",padding:22}}>Chứng cứ về việc thờ được ghi chép — không chứng minh người trong truyền thuyết từng sống.</div></Reveal>
    </div><Caption sceneId="sc024" startFrame={15692}/>
  </InkPanel>;
};
