"""Compose-only V2 data builder. Reads existing alignment; never modifies input media/text."""
from pathlib import Path
import json, math, re, hashlib, wave
ROOT=Path('/Users/tuyennguyen/project/OpenMontage')
PUB=ROOT/'remotion-composer/public/france-riots-20261023/v2'
ART=ROOT/'projects/france-riots-20261023/artifacts'
def load(p): return json.loads(p.read_text())
def dump(p,v): p.write_text(json.dumps(v,ensure_ascii=False,indent=2)+'\n')
def norm(s): return re.sub(r'[^\w]+',' ',s.lower()).split()
# Every title/card has its own canonical spoken phrase. No scene-start proxy.
# (display, anchor phrase, kind); structural labels and credits are explicit references.
SPECS=[
 [('Cách Điện tổng thống Pháp','Cách Điện tổng thống Pháp','title'),('200m','200m','hero'),('Đám đông đã dựng barricade.','đám đông đã dựng barricade','card'),('Đây là chuyện đã xảy ra.','Đây là chuyện đã xảy ra','card'),('Đêm 17/10 · Paris','Đêm 17/10','card')],
 [('Thiệt hại bảo hiểm','ngành bảo hiểm Pháp','title'),('Hơn 1 tỷ € · ƯỚC TÍNH','hơn 1 tỷ euro','hero'),('Có thể tới 1,2 tỷ €','1,2 tỷ','card'),('FT · Trong nhóm tốn kém nhất với ngành bảo hiểm Pháp','Theo báo Financial Times','card'),('Ba lớp nguyên nhân','ba lớp nguyên nhân','card')],
 [('Lớp một · Ngòi nổ','Lớp một ngòi nổ','title'),('VIDEO MẠNG XÃ HỘI · v2.95','tài khoản ẩn danh v2.95','social'),('1,60 €/lít','1,60 euro một lít','card'),('→ 2,25 €/lít','2,25 euro','card'),('Hàng triệu lượt xem','hàng triệu lượt xem','card'),('Không tìm thấy dấu hiệu tổ chức điều phối · Viginum / phân tích độc lập','không tìm thấy dấu hiệu điều phối','card')],
 [('Lớp hai · Bất mãn nền','Lớp hai bất mãn nền','title'),('Créteil · Phong trào học sinh','một trường ở Créteil','card'),('Thiếu giáo viên','thiếu giáo viên','card'),('YÊU SÁCH · Bỏ Parcoursup','đòi bỏ nền tảng','card'),('YÊU SÁCH · 10 tỷ € cho lycée','kế hoạch 10 tỷ euro','card'),('6/10 · 800 lycée đóng cửa · Bộ Giáo dục','800 trường lycée','card')],
 [('Ngân sách 2027','Ngân sách 2027','title'),('+1,2 tỷ €\nNgân sách giáo dục','tăng 1,2 tỷ euro','contrast'),('−1.588\nVị trí giáo viên','cắt 1.588 vị trí','contrast'),('−180.000 học sinh · Bối cảnh nhân khẩu','học sinh giảm 180 nghìn','card'),('Giá sinh hoạt · Giá xăng','giá sinh hoạt và giá xăng','card'),('Bất mãn từ thời áo vàng 2018','áo vàng 2018','card')],
 [('Lớp ba · Cơ chế leo thang','Lớp ba cơ chế leo thang','title'),('Học sinh · Người lao động · Áo vàng cũ · Công đoàn','học sinh người lao động','card'),('Bản đồ điểm tập kết trên toàn nước','bản đồ liệt kê','card'),('Nhóm quá khích ở rìa đoàn tuần hành','các nhóm quá khích trà trộn','card'),('Theo nhà chức trách: cực tả, tội phạm, cả cực hữu\nKhông phải kết luận tư pháp','Theo nhà chức trách','card'),('Bộ trưởng Nội vụ thừa nhận: mất kiểm soát đêm đó','mất kiểm soát đêm đó','card'),('CẢNH TUẦN HÀNH ÔN HÒA — AIX-EN-PROVENCE 17/10','các đoàn tuần hành','broll')],
 [('Hiện trường · Paris','hiện trường thật','title'),('Xe cháy · Lính cứu hỏa dập lửa','một xe ô tô cháy','photo1'),('Quảng trường Cộng Hòa · Đám đông trong khói','đám đông trước quảng trường','photo2')],
 [('Quy mô 17/10','Thứ Bảy 17/10','title'),('550.000\nBộ Nội vụ','550.000','stat'),('800.000\nBan tổ chức','800.000','stat'),('110 cuộc tuần hành · Toàn nước','110 cuộc tuần hành','card'),('110.000 · Riêng Paris','110.000 người','card')],
 [('Paris · Điểm đối đầu','Tại Paris','title'),('Élysée ↔ Điểm đối đầu · 200 m','Điện Élysée 200 mét','schematic'),('Khu vực đã cấm biểu tình từ trước','bị cấm biểu tình từ trước','card'),('Barricade bằng rào chắn công trình · Champs-Élysées','Barricade dựng bằng rào chắn','card'),('Sau khi đoàn tan · Cướp phá lan dọc phố','Khi các đoàn tan','card')],
 [('Limoges','Limoges','title'),('Tòa thị chính · Khánh thành 1883','tòa thị chính khánh thành năm 1883','building'),('Phóng hỏa','rồi phóng hỏa','card'),('Tháp chuông sụp trước 21 giờ','Tháp chuông sụp trước 21 giờ','card'),('Tỉnh trưởng: tòa nhà mất phần lớn','tòa nhà mất phần lớn','card'),('Giới chức: thảm họa di sản','thảm họa di sản','card')],
 [('Lyon','Lyon','title'),('200–300 cửa hàng bị đập phá và cướp','200 đến 300 cửa hàng','card'),('Văn phòng du lịch bị đốt','văn phòng du lịch bị đốt','card'),('Theo The Guardian','theo The Guardian','card'),('Marseille · Cửa tòa thị chính bị đập mở','cửa tòa thị chính bị đập mở','card'),('Theo Tổng thống Macron · Bài phát biểu 18/10','theo bài phát biểu của Tổng thống Macron ngày 18/10','card')],
 [('Paris không phải nơi duy nhất','Paris không phải nơi duy nhất','title'),('Paris','Paris','mapParis'),('Bordeaux · Nơi nữ tỉnh trưởng ở bị tấn công','Bordeaux công trình','mapBordeaux'),('Lille · Cửa tòa thị chính bị đập mở','Lille','mapLille'),('Marseille · Cửa tòa thị chính bị đập mở','Marseille','mapMarseille'),('Macron điểm tên · Bài phát biểu 18/10','Tổng thống Macron điểm tên','card')],
 [('Bắt giữ · Riêng đêm 17/10','Riêng đêm 17/10','title'),('2.397\nRiêng đêm 17/10 · CNews / Bộ Nội vụ','2.397','hero'),('855 ở Paris','855 ở Paris','card'),('≈2.500\nLũy kế đến 22/10','khoảng 2.500','card'),('174 tạm giam\nTheo Bộ trưởng Tư pháp','174 người bị tạm giam','card')],
 [('Lực lượng bị thương','Về phía lực lượng','title'),('997\nTrong ngày 17/10 · Bộ Nội vụ','997','hero'),('Cảnh sát · Hiến binh · Lính cứu hỏa','cảnh sát hiến binh và lính cứu hỏa','card'),('7 ca nghiêm trọng','7 ca nghiêm trọng','card')],
 [('Thương mại · Thiệt hại','Khu vực thương mại gánh nặng','title'),('1.500 cửa hàng · Liên đoàn phân phối','1.500 cửa hàng','shop'),('3.000 · Tạm thời, Bộ trưởng Thương mại','3.000','shop'),('2018–19\n≈220\nMorningstar','khoảng 220 triệu','bar2018'),('2023\n730–798\nFrance Assureurs · Morningstar','730 đến 798 triệu','bar2023'),('2026\n>1.000–1.200\nƯỚC TÍNH · FT · Morningstar','1,2 tỷ','bar2026')],
 [('Phản ứng chính phủ · 18/10','Chủ nhật 18/10','title'),('Macron: giận và thẹn','giận và thẹn','card'),('Không đồng hóa biểu tình ôn hòa với thiểu số bạo lực','không được đồng hóa','card'),('Nuñez xin từ chức\nTheo Euronews','Nuñez nộp đơn từ chức','card'),('Paris · Giới nghiêm từng khu vực','Paris áp đặt giới nghiêm từng khu vực','card')],
 [('Thứ Năm 22/10','Thứ Năm 22/10','title'),('Macron: cấm các cuộc biểu tình không chính danh','cấm các cuộc biểu tình không chính danh','card'),('Tòa hành chính PARIS hủy lệnh cấm tuần hành SINH VIÊN','toà hành chính Paris hủy lệnh cấm tuần hành của sinh viên','card'),('Hàng nghìn người vẫn ra đường','hàng nghìn người vẫn ra đường','card'),('Lyon cấm mọi biểu tình thứ Bảy','Lyon cấm mọi biểu tình Thứ Bảy','card'),('Marseille · Nice · Toulon cũng cấm tương tự','Marseille Nice Toulon','card')],
 [('24/10 · Hồi hai','Thứ Bảy 24/10 sẽ là hồi hai','title'),('24/10\nLời gọi mới · KẾ HOẠCH','Thứ Bảy 24/10','timeline24'),('Trạm xăng · Nhà máy lọc dầu','trạm xăng và nhà máy lọc dầu','card'),('An ninh tăng cường cuối tuần · Theo báo chí Pháp','Lực lượng an ninh được tăng cường','card')],
 [('Góc người Việt','Người Việt ở Pháp','title'),('Du học sinh ở Nice · Trường đóng cửa, sinh hoạt đảo lộn','Du học sinh ở Nice','card'),('Người Việt lâu năm · Không ngạc nhiên','Người Việt lâu năm','card'),('Người mới đến · Sốc trước cảnh đốt phá','người mới đến thì sốc','card')],
 [('NHẬN ĐỊNH','Nhận định','title'),('Sáu tháng trước bầu cử','sáu tháng trước bầu cử','card'),('Giá sinh hoạt → Khủng hoảng chính trị','cái giá sinh hoạt','card'),('Không quy người biểu tình là bạo loạn','đừng quy cả trăm nghìn người biểu tình','card'),('Bạo lực là của thiểu số · Đang điều tra','Bạo lực là của thiểu số','card'),('Người đi làm · Đệm chi phí cá nhân trước cú sốc','đệm chi phí cá nhân','card')],
 [('Thứ Bảy 24/10','Thứ Bảy 24/10','title'),('Chuyện gì sẽ xảy ra?','chuyện gì sẽ xảy ra','hero'),('THEO DÕI ĐỂ CẬP NHẬT','Theo dõi để cập nhật','card')]
]
SOURCES=['TF1 LCI','FT · Morningstar','TF1 VÉRIF · La Croix','The Guardian · La Croix · Bộ Giáo dục','Café pédagogique · La Croix','Nhà chức trách · Bộ Nội vụ','Wikimedia Commons','franceinfo','TF1 LCI','Le Parisien · France 3 · TV5Monde/AFP','The Guardian · Élysée','Élysée · TF1 LCI','CNews · Bộ trưởng Tư pháp','Bộ Nội vụ · CNews','FT · Morningstar · France Assureurs','Élysée · Euronews','The Guardian · RFI','Báo chí Pháp · Site điều phối áo vàng','Thanh Niên · VnExpress','Bình luận biên tập','Cập nhật tại 23/10/2026']
scenes=[]; elements=[]; captions={}; cursor=0; total_audio=0; input_hashes={}
for n,spec in enumerate(SPECS,1):
 sid=f's{n:02}'; wj=load(PUB/f'words_{sid}.json'); tj=load(PUB/f'timing_{sid}.json'); cj=load(PUB/f'captions_{sid}.json'); words=wj['words']; duration=tj['duration_seconds']
 with wave.open(str(PUB/f'voice_{sid}.wav')) as w: measured=w.getnframes()/w.getframerate()
 assert abs(measured-duration)<.000002
 frames=math.ceil((duration+.8)*30); sc=dict(scene_id=sid,section_id=f'S{n}',voice_seconds=duration,scene_frames=frames,duration_seconds=frames/30,start_frame=cursor,end_frame=cursor+frames-1,start_seconds=cursor/30,end_seconds=(cursor+frames)/30,source=SOURCES[n-1]); scenes.append(sc); total_audio+=duration
 flat=[]; owner=[]
 for i,w in enumerate(words):
  for tok in norm(w['word']): flat.append(tok); owner.append(i)
 for k,(display,phrase,kind) in enumerate(spec):
  needle=norm(phrase); hits=[i for i in range(len(flat)-len(needle)+1) if flat[i:i+len(needle)]==needle]
  if not hits: raise ValueError((sid,phrase,'UNMATCHED'))
  a=owner[hits[0]]; b=owner[hits[0]+len(needle)-1]; start=words[a]['start']; end=words[b]['end']; reveal=max(0,math.ceil((start-.32)*30))
  elements.append(dict(scene=sid,id=f'e{k}',display=display,kind=kind,anchor=phrase,anchor_start_word=a,anchor_end_word=b,anchor_start_seconds=start,anchor_end_seconds=end,start=reveal/30,end=frames/30,start_frame=cursor+reveal,start_frame_local=reveal,global_anchor_start=cursor/30+start,global_anchor_end=cursor/30+end,retrospective_reference=False))
 # Supplied canonical chunk boundaries + word timestamps; never proportional pagination.
 pages=[]
 for chunk in cj['chunks']:
  indices=list(range(chunk['anchor_start_word'],chunk['anchor_end_word']+1))
  group=[]
  for i in indices:
   if group and (len(' '.join(words[j]['word'] for j in group+[i]))>72 or i!=group[-1]+1):
    pages.append(dict(text=' '.join(words[j]['word'] for j in group),startMs=words[group[0]]['start']*1000,endMs=words[group[-1]]['end']*1000,timestampMs=None,confidence=None)); group=[]
   group.append(i)
  if group: pages.append(dict(text=' '.join(words[j]['word'] for j in group),startMs=words[group[0]]['start']*1000,endMs=words[group[-1]]['end']*1000,timestampMs=None,confidence=None))
 captions[sid]=pages
 for name in [f'voice_{sid}.wav',f'timing_{sid}.json',f'words_{sid}.json',f'captions_{sid}.json']:
  input_hashes[name]=hashlib.sha256((PUB/name).read_bytes()).hexdigest()
 cursor+=frames
# Three-point timeline follows narration SSOT; only genuinely narrated prior dates recur.
for sid,kind,display,ref in [('s18','timeline17','17/10\nBạo loạn','s07'),('s18','timeline22','22/10\nLệnh cấm','s17')]:
 elements.append(dict(scene=sid,id=kind,display=display,kind=kind,anchor='',retrospective_reference=True,reference=ref,start_frame_local=0,start_frame=scenes[17]['start_frame'],start=0,end=scenes[17]['scene_frames']/30))
for n,sc in enumerate(scenes,1):
 elements.append(dict(scene=sc['scene_id'],id='source',display='Nguồn: '+sc['source'],kind='source',anchor='',retrospective_reference=True,reference='approved scene sources',start_frame_local=0,start_frame=sc['start_frame'],start=0,end=sc['scene_frames']/30))
photo_credit='Tư liệu Wikimedia Commons · Jorge Jaramillo (JJxFile) · CC BY-SA 4.0 · khai báo 17/10/2026, Paris'
elements.append(dict(scene='s07',id='credit',display=photo_credit,kind='credit',anchor='',retrospective_reference=True,reference='decision_log media_selection / credits_v2.txt',start_frame_local=0,start_frame=scenes[6]['start_frame'],start=0,end=scenes[6]['scene_frames']/30))
timing=dict(version='2',fps=30,tail_frames=30,total_audio_seconds=round(total_audio,6),total_frames=cursor+30,duration_seconds=(cursor+30)/30,frame_rule='SUM ceil((voice_seconds+0.8)*30) + 30',scenes=scenes)
dump(PUB/'scene_timing.json',timing);dump(PUB/'scene_elements.json',dict(version='2',unmatched=0,scenes=elements));dump(PUB/'captions_display.json',captions);dump(PUB/'input_hashes.json',input_hashes)
# V2 artifacts are namespaced, leaving the V1 canonical artifacts intact.
(ART/'v2').mkdir(exist_ok=True)
for name,data in [('scene_timing.json',timing),('scene_elements.json',dict(version='2',unmatched=0,scenes=elements))]: dump(ART/'v2'/name,data)
music=load(PUB.parent/'music_metadata.json'); music.update(duration_seconds=timing['duration_seconds'],composition_volume=.7,loop=True,audio_modified=False,rms_v2_measured=False,mix_note='Reuse approved V1 bed/gain; V2 mix loudness must be measured after lead render.',credit_on_screen='Mesmerize · Kevin MacLeod · CC BY 4.0',license_url='https://creativecommons.org/licenses/by/4.0/')
dump(PUB/'music_metadata.json',music)
rows=['| Scene | Start | Frames | Anchors |','|---|---:|---:|---|']
for sc in scenes:
 es=[e for e in elements if e['scene']==sc['scene_id'] and not e['retrospective_reference']]
 rows.append('| '+sc['scene_id']+' | '+str(sc['start_frame'])+' | '+str(sc['scene_frames'])+' | '+'; '.join(f"{e['id']}={e['anchor']} @{e['start_frame_local']}" for e in es)+' |')
(ART/'scene_index_v2.md').write_text('# V2 scene index\n\n'+ '\n'.join(rows)+'\n')
print(json.dumps(dict(scenes=len(scenes),elements=len(elements),audio_seconds=round(total_audio,6),total_frames=cursor+30,unmatched=0)))
