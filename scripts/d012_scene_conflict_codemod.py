#!/usr/bin/env python3
"""d-012B — SCENE CONFLICT RESOLUTION codemod (semantic TSX edits + plan overlay_notes).

Scope (owner assignment): ONLY the four true content conflicts + sc004 exact reveals.
Files owned here: scenes-a.tsx (Sc049 only), scenes-c.tsx, scenes-d.tsx, scenes-e.tsx,
scenes-f.tsx, plus overlay_notes of the changed scenes in scene_plan.json.
Does NOT touch: timing, scripts, checkpoints/decisions/report, scenes-b.

Rules honored:
- every `old` must match EXACTLY ONCE (else abort, no partial write per file);
- idempotent/resumable: already-applied edits are skipped, not re-applied;
- every moved display element gets a real A(phrase) onset retained to sentence end;
- log original/new bodies + plan anchors + exact semantic reasons to
  projects/son-tinh-thuy-tinh/artifacts/d012_scene_semantic_fixes.json.
"""
import json
import sys
import datetime
from pathlib import Path

ROOT = Path("/Users/tuyennguyen/project/OpenMontage")
ST = ROOT / "remotion-composer/src/son-tinh-thuy-tinh"
PLAN_PATH = ROOT / "projects/son-tinh-thuy-tinh/artifacts/scene_plan.json"
LOG_PATH = ROOT / "projects/son-tinh-thuy-tinh/artifacts/d012_scene_semantic_fixes.json"

EDITS = [
    # ---------------------------------------------------------------- sc004 (scenes-d)
    dict(
        file="scenes-d.tsx", scene="sc004",
        reason=("sc004: previous worker collapsed v1..v3 onto A(\"ra điều kiện\") (51.411s) making the VOI row "
                "early. Split into real per-row onsets: voi chín ngà 53.568 / gà chín cựa 54.381 / "
                "ngựa chín hồng mao 55.248; keep cond A(\"đến trước thì được cưới\") 57.560-58.525."),
        old='''  const A = useA();
  const v1 = A("ra điều kiện");
  const v2 = v1 + 0.15;
  const v3 = v1 + 0.3;
  const cond = A("đến trước thì được cưới");''',
        new='''  const A = useA();
  // d-012B: tách onset panel khỏi từng dòng — panel+header bật tại «ra điều kiện» 51.411s (f1542),
  // mỗi vế sính lễ có A riêng đúng nhịp đọc thực.
  const onset = A("ra điều kiện");
  const v1 = A("voi chín ngà");
  const v2 = A("gà chín cựa");
  const v3 = A("ngựa chín hồng mao");
  const cond = A("đến trước thì được cưới");''',
    ),
    dict(
        file="scenes-d.tsx", scene="sc004",
        reason=("sc004: gate the whole condition panel (header VUA RA ĐIỀU KIỆN + rows + quote) behind "
                "Reveal(onset) so nothing shows before «ra điều kiện» 51.411s — at old early time the "
                "narration was 'hai vị thần cùng đến cầu hôn'."),
        old='''          </div>
          <div
            style={{
              position: "absolute",
              right: 88,
              top: 176,''',
        new='''          </div>
          <Reveal startFrac={onset} dy={20}>
          <div
            style={{
              position: "absolute",
              right: 88,
              top: 176,''',
    ),
    dict(
        file="scenes-d.tsx", scene="sc004",
        reason="sc004: close the Reveal wrapper opened around the condition panel; rows retained (no endFrac) through sentence end 58.525s.",
        old='''            </Reveal>
          </div>
          <SourceTag text="Truyện Sơn Tinh, Thủy Tinh — kể từ ghế nhà trường" right />''',
        new='''            </Reveal>
          </div>
          </Reveal>
          <SourceTag text="Truyện Sơn Tinh, Thủy Tinh — kể từ ghế nhà trường" right />''',
    ),
    # ---------------------------------------------------------------- sc045 (scenes-c)
    dict(
        file="scenes-c.tsx", scene="sc045",
        reason=("sc045: fDoi=A(\"đời này tiếp đời trước\") 657.848s is a duplicate early cue spoken inside "
                "sc044's span. Replace with the actual Hồi Ba intro «Và nếu ai hỏi thần núi ở đâu» "
                "666.312-667.617s; silhouettes emerge at intro (staggered), header/description retimed."),
        old='''  const fDoi = A("đời này tiếp đời trước");''',
        new='''  // d-012B: «đời này tiếp đời trước» (657.8s) nói ở sc044 — đổi cue mở sang intro thực của hồi ba.
  const fIntro = A("Và nếu ai hỏi thần núi ở đâu");''',
    ),
    dict(
        file="scenes-c.tsx", scene="sc045",
        reason="sc045: re-drive the four generation silhouettes from the intro cue (keep stagger 26/52/78 frames).",
        old='''  const shadows = [
    { name: "nông dân", x: 540, y: 640, at: fDoi },
    { name: "lính", x: 830, y: 566, at: fDoi + 26 / dur },
    { name: "dân phu", x: 1120, y: 566, at: fDoi + 52 / dur },
    { name: "kỹ sư", x: 1410, y: 640, at: fDoi + 78 / dur },
  ];''',
        new='''  const shadows = [
    { name: "nông dân", x: 540, y: 640, at: fIntro },
    { name: "lính", x: 830, y: 566, at: fIntro + 26 / dur },
    { name: "dân phu", x: 1120, y: 566, at: fIntro + 52 / dur },
    { name: "kỹ sư", x: 1410, y: 640, at: fIntro + 78 / dur },
  ];''',
    ),
    dict(
        file="scenes-c.tsx", scene="sc045",
        reason="sc045: SceneTitle leads the intro cue by the original 170-frame lead-in (clamped at scene start), no earlier duplicate header.",
        old='''          startFrac={Math.max(0.02, fDoi - 170 / dur)}''',
        new='''          startFrac={Math.max(0.02, fIntro - 170 / dur)}''',
    ),
    # ---------------------------------------------------------------- sc046 (scenes-d)
    dict(
        file="scenes-d.tsx", scene="sc046",
        reason=("sc046: final display «hai lớp của một trang giấy» 707.757s is spoken AFTER sc047 starts "
                "('đổi chủ thể' 700.514). Remove aHai + closing SpringPop here; pages now converge right "
                "after «Đê nối liền» 697.723s (visual comparison stays)."),
        old='''  const aDe = A("Đê nối liền");
  const aHai = A("hai lớp của một trang giấy");
  const t = p(aHai - 0.005, aHai + 0.06);''',
        new='''  const aDe = A("Đê nối liền");
  // d-012B: «hai lớp của một trang giấy» (707.757s) chuyển sang sc047 — hai trang khớp nhau sau «Đê nối liền».
  const t = p(aDe, aDe + 0.09);''',
    ),
    dict(
        file="scenes-d.tsx", scene="sc046",
        reason="sc046: remove the closing strip «Chúng là hai lớp của một trang giấy.» (moved to sc047).",
        old='''        <div style={{ position: "absolute", left: 0, right: 0, top: 972, textAlign: "center" }}>
          <SpringPop startFrac={aHai + 0.06} from={0.9}>
            <div style={{ fontFamily: FONT.display, fontSize: 34, color: C.amber, whiteSpace: "nowrap" }}>
              «Chúng là hai lớp của một trang giấy.»
            </div>
          </SpringPop>
        </div>
        <SourceTag text="Truyện kể và chính sử — hai lớp một trang giấy" right />''',
        new='''        <SourceTag text="Truyện kể và chính sử — hai lớp một trang giấy" right />''',
    ),
    # ---------------------------------------------------------------- sc058 (scenes-d)
    dict(
        file="scenes-d.tsx", scene="sc058",
        reason=("sc058→sc059: sc059's two opening lines are spoken BEFORE sc058's montage cues "
                "(881.015/883.556 < 887.868). Move them here as a temporary opening overlay at exact A "
                "cues, hidden at A(\"Một kẻ thù bị xóa\") 885.424s (after their sentence ends 884.929s, "
                "before the icon circle region is used)."),
        old='''export const Sc058: React.FC<SceneProps> = () => {
  const A = useA();
  const aHN = A("hằng năm vẫn đến");
  const aGiu = A("giữ Thủy Tinh ở lại");''',
        new='''export const Sc058: React.FC<SceneProps> = () => {
  const A = useA();
  // d-012B: hai dòng khép mở chuyển TỪ sc059 sang sc058 — đúng nhịp đọc thực 881.015s/883.556s,
  // ẩn trước khi vòng icon chiếm vùng giữa; sc059 chỉ giữ câu khép cuối.
  const t1 = A("không bao giờ thắng");
  const t2 = A("không bao giờ cho hắn biến mất");
  const tHide = A("Một kẻ thù bị xóa");
  const aHN = A("hằng năm vẫn đến");
  const aGiu = A("giữ Thủy Tinh ở lại");''',
    ),
    dict(
        file="scenes-d.tsx", scene="sc058",
        reason="sc058: opening overlay block — both lines reveal at their spoken onsets, fade only after the sentence ends (tHide), no collision with the later icon montage (icons start at aHN 887.868s).",
        old='''        <Reveal startFrac={0.03} style={{ position: "absolute", left: 0, right: 0, top: 84, textAlign: "center" }}>
          <div style={{ fontFamily: FONT.mono, fontSize: 34, letterSpacing: 5, color: C.cream }}>
            VÒNG TRÒN KHÉP CỦA CẢ TẬP
          </div>
        </Reveal>''',
        new='''        <Reveal startFrac={0.03} style={{ position: "absolute", left: 0, right: 0, top: 84, textAlign: "center" }}>
          <div style={{ fontFamily: FONT.mono, fontSize: 34, letterSpacing: 5, color: C.cream }}>
            VÒNG TRÒN KHÉP CỦA CẢ TẬP
          </div>
        </Reveal>
        {/* d-012B: overlay mở tạm — hai dòng khép sớm, đúng nhịp đọc, ẩn trước vòng icon */}
        <div style={{ position: "absolute", left: 160, top: 240, width: 1600, textAlign: "center" }}>
          <Reveal startFrac={t1} endFrac={tHide} dy={16}>
            <div style={{ fontFamily: FONT.display, fontWeight: 700, fontSize: 54, color: C.cream }}>
              Trong truyện, Thủy Tinh <span style={{ color: C.amber }}>không bao giờ thắng</span>.
            </div>
          </Reveal>
          <Reveal startFrac={t2} endFrac={tHide} dy={16}>
            <div
              style={{
                fontFamily: FONT.body,
                fontWeight: 500,
                fontSize: 40,
                color: C.cream,
                opacity: 0.92,
                marginTop: 18,
              }}
            >
              và có lẽ chính vì thế, người ta không bao giờ cho hắn biến mất.
            </div>
          </Reveal>
        </div>''',
    ),
    # ---------------------------------------------------------------- sc047 (scenes-e)
    dict(
        file="scenes-e.tsx", scene="sc047",
        reason=("sc047 inherits the s20 closing sentence from sc046 (ownership explicit): add "
                "aHai=A(\"hai lớp của một trang giấy\") 707.757s — the real spoken time, inside sc047."),
        old='''  const dc = A("đổi chủ thể");
  const nc = A("người cùng sống với nước");''',
        new='''  const dc = A("đổi chủ thể");
  const nc = A("người cùng sống với nước");
  // d-012B: câu kết «hai lớp của một trang giấy» kế thừa TỪ sc046 — nhịp đọc thật 707.757s, giữ tới hết câu.
  const aHai = A("hai lớp của một trang giấy");''',
    ),
    dict(
        file="scenes-e.tsx", scene="sc047",
        reason=("sc047: closing strip «Chung là hai lớp của một trang giấy.» below 'Hai câu ấy không trái "
                "nhau.' (ends 707.22s) at top:884 — same lower region, no overlap, no SourceTag in sc047; "
                "no endFrac so it is retained to scene/sentence end."),
        old='''      <div style={{ position: "absolute", left: 160, top: 816, width: 1600, textAlign: "center" }}>
        <Reveal startFrac={nc + f(110)} endFrac={nc + f(130)}>
          <div style={{ fontFamily: FONT.body, fontSize: 34, color: C.mute }}>
            Hai câu ấy không trái nhau.
          </div>
        </Reveal>
      </div>''',
        new='''      <div style={{ position: "absolute", left: 160, top: 816, width: 1600, textAlign: "center" }}>
        <Reveal startFrac={nc + f(110)} endFrac={nc + f(130)}>
          <div style={{ fontFamily: FONT.body, fontSize: 34, color: C.mute }}>
            Hai câu ấy không trái nhau.
          </div>
        </Reveal>
      </div>
      <div style={{ position: "absolute", left: 160, top: 884, width: 1600, textAlign: "center" }}>
        <Reveal startFrac={aHai}>
          <div style={{ fontFamily: FONT.display, fontSize: 34, color: C.amber }}>
            «Chúng là hai lớp của một trang giấy.»
          </div>
        </Reveal>
      </div>''',
    ),
    # ---------------------------------------------------------------- sc059 (scenes-e)
    dict(
        file="scenes-e.tsx", scene="sc059",
        reason=("sc059: t1/t2 (881.015/883.556s) are spoken before sc058's cues — moved to sc058. sc059 "
                "opens at the actual late closing phrases: qk «quá khứ không nằm phía sau lưng» 899.644s, "
                "nc «Nó nằm ngay dưới chân» 901.610s; t3 «trong từng mùa nước lên» 902.431-903.430 kept."),
        old='''  const t1 = A("không bao giờ thắng");
  const t2 = A("không bao giờ cho hắn biến mất");
  const t3 = A("trong từng mùa nước lên");''',
        new='''  // d-012B: hai dòng «không bao giờ…» đã chuyển sang sc058 (881.0s/883.6s); sc059 mở bằng câu
  // khép cuối đúng nhịp thực 899.644s+; fade-to-black giữ nguyên, chỉ sau hết câu 903.430s.
  const qk = A("quá khứ không nằm phía sau lưng");
  const nc = A("Nó nằm ngay dưới chân");
  const t3 = A("trong từng mùa nước lên");''',
    ),
    dict(
        file="scenes-e.tsx", scene="sc059",
        reason=("sc059: remove the two early text blocks (old t1/t2 lines already read+shown in sc058 — "
                "must not be displayed again here)."),
        old='''      <div style={{ position: "absolute", left: 160, top: 340, width: 1600, textAlign: "center" }}>
        <Reveal startFrac={t1} endFrac={t1 + f(20)}>
          <div style={{ fontFamily: FONT.display, fontWeight: 700, fontSize: 58, color: C.white }}>
            Trong truyện, Thủy Tinh <span style={{ color: C.amber }}>không bao giờ thắng</span>.
          </div>
        </Reveal>
      </div>
      <div style={{ position: "absolute", left: 160, top: 474, width: 1600, textAlign: "center" }}>
        <Reveal startFrac={t2} endFrac={t2 + f(22)}>
          <div style={{ fontFamily: FONT.body, fontWeight: 500, fontSize: 44, color: C.cream, opacity: 0.92 }}>
            và có lẽ chính vì thế, người ta không bao giờ cho hắn biến mất.
          </div>
        </Reveal>
      </div>
      <div style={{ position: "absolute", left: 260, top: 716, width: 1400, textAlign: "center" }}>''',
        new='''      <div style={{ position: "absolute", left: 260, top: 716, width: 1400, textAlign: "center" }}>''',
    ),
    dict(
        file="scenes-e.tsx", scene="sc059",
        reason=("sc059: final lower lines driven by their real individual spoken phrases (qk 899.644s, "
                "nc 901.610s) instead of the early t3-f(40); t3 kept driving the fade boundary + amber "
                "highlight of «trong từng mùa nước lên»; retained (no endFrac) to sentence end 903.430s."),
        old='''        <Reveal startFrac={t3 - f(40)} endFrac={t3 - f(20)}>
          <div style={{ fontFamily: FONT.body, fontSize: 36, color: C.cream, opacity: 0.82 }}>
            quá khứ không nằm phía sau lưng.
          </div>
        </Reveal>
        <Reveal startFrac={t3} endFrac={t3 + f(24)}>
          <div style={{ fontFamily: FONT.body, fontSize: 36, color: C.mute, marginTop: 14 }}>
            Nó nằm ngay dưới chân, trong từng mùa nước lên.
          </div>
        </Reveal>''',
        new='''        <Reveal startFrac={qk} endFrac={t3 - f(20)}>
          <div style={{ fontFamily: FONT.body, fontSize: 36, color: C.cream, opacity: 0.82 }}>
            quá khứ không nằm phía sau lưng.
          </div>
        </Reveal>
        <Reveal startFrac={nc}>
          <div style={{ fontFamily: FONT.body, fontSize: 36, color: C.mute, marginTop: 14 }}>
            Nó nằm ngay dưới chân, <span style={{ color: C.amber }}>trong từng mùa nước lên</span>.
          </div>
        </Reveal>''',
    ),
    # ---------------------------------------------------------------- sc048 (scenes-f)
    dict(
        file="scenes-f.tsx", scene="sc048",
        reason=("sc048: fLui 725.169s / fLen 726.535s occur AFTER sc049's three negatives "
                "(719.702/721.204/722.726) — the two label anchors move to sc049; remove them here."),
        old='''  const fQ = A("vì sao Thủy Tinh vẫn quay lại");
  const fLui = A("tạm lùi về biển");
  const fLen = A("lại lên theo mùa");''',
        new='''  const fQ = A("vì sao Thủy Tinh vẫn quay lại");
  // d-012B: hai nhãn «tạm lùi về biển»/«lại lên theo mùa» (725.169s/726.535s) nói SAU ba vế phủ định
  // của sc049 — text chuyển sang sc049; vòng nước ở đây chạy theo nhịp câu hỏi (không phải text).''',
    ),
    dict(
        file="scenes-f.tsx", scene="sc048",
        reason=("sc048: water arc (non-text animation) now driven by the question cue — recede then rise "
                "symbolically after the question, all fractions in-window (max fQ+0.8)."),
        old='''  // cung nước phía đông: rút khi «tạm lùi về biển», dâng khi «lại lên theo mùa»
  const recede = ease(p(fp(fLui, -30), fLui));
  const rise = ease(p(fLen, fp(fLen, 35)));''',
        new='''  // cung nước phía đông: rút rồi dâng theo mùa — chạy theo nhịp câu hỏi (animation, không phải text)
  const recede = ease(p(fQ + 0.3, fQ + 0.5));
  const rise = ease(p(fQ + 0.55, fQ + 0.8));''',
    ),
    dict(
        file="scenes-f.tsx", scene="sc048",
        reason="sc048: delete the two late text Reveal blocks («tạm lùi về biển», «lại lên theo mùa») — moved to sc049 at their exact phrases.",
        old='''        <Reveal startFrac={fp(fLui, 10)} dy={8}>
          <div
            style={{
              position: "absolute",
              left: 1270,
              top: 790,
              fontFamily: FONT.body,
              fontStyle: "italic",
              fontSize: 27,
              color: C.teal,
              textShadow: "0 2px 8px rgba(0,0,0,0.8)",
            }}
          >
            tạm lùi về biển
          </div>
        </Reveal>
        <Reveal startFrac={fp(fLen, 10)} dy={8}>
          <div
            style={{
              position: "absolute",
              left: 1270,
              top: 330,
              fontFamily: FONT.body,
              fontStyle: "italic",
              fontSize: 27,
              color: C.teal,
              textShadow: "0 2px 8px rgba(0,0,0,0.8)",
            }}
          >
            lại lên theo mùa
          </div>
        </Reveal>
      </div>
    </InkImageScene>''',
        new='''      </div>
    </InkImageScene>''',
    ),
    # ---------------------------------------------------------------- sc049 (scenes-a — scoped exception)
    dict(
        file="scenes-a.tsx", scene="sc049",
        reason=("sc049 inherits the two water clauses from sc048 (ownership explicit): they are spoken at "
                "725.169s/726.535s, after the three negatives, inside sc049's span."),
        old='''  const a3 = A("không có cái chết để biến mất");''',
        new='''  const a3 = A("không có cái chết để biến mất");
  // d-012B: hai vế «tạm lùi về biển»/«lại lên theo mùa» (725.169s/726.535s) kế thừa TỪ sc048 —
  // hiện sau ba vế phủ định đúng thứ tự narration, giữ tới hết câu.
  const aLui = A("tạm lùi về biển");
  const aLen = A("lại lên theo mùa");''',
    ),
    dict(
        file="scenes-a.tsx", scene="sc049",
        reason=("sc049: show the two inherited water clauses between the negatives and the existing "
                "closings (DOM order = narration order: 725.169 < 726.535 < a3+0.26/0.4 closings); "
                "flex column stacks them, no overlap; original list + closings unchanged."),
        old='''        {dong(a1, "triều đại để sụp đổ")}
        {dong(a2, "đạo quân để giải tán")}
        {dong(a3, "cái chết để biến mất")}''',
        new='''        {dong(a1, "triều đại để sụp đổ")}
        {dong(a2, "đạo quân để giải tán")}
        {dong(a3, "cái chết để biến mất")}
        <Reveal startFrac={aLui} dy={14}>
          <div
            style={{
              fontFamily: FONT.body,
              fontStyle: "italic",
              fontSize: 34,
              color: C.teal,
              textAlign: "center",
            }}
          >
            Mỗi năm, nó chỉ tạm lùi về biển,
          </div>
        </Reveal>
        <Reveal startFrac={aLen} dy={14}>
          <div
            style={{
              fontFamily: FONT.body,
              fontStyle: "italic",
              fontSize: 34,
              color: C.teal,
              textAlign: "center",
            }}
          >
            để rồi lại lên theo mùa.
          </div>
        </Reveal>''',
    ),
]

PLAN_NOTES = {
    "sc004": ("anchors: «ra điều kiện»51.411 (panel + header VUA RA ĐIỀU KIỆN bật) · «voi chín ngà»53.568 · "
              "«gà chín cựa»54.381 · «ngựa chín hồng mao»55.248 · «đến trước thì được cưới»57.560 — từng vế "
              "sính lễ bật đúng nhịp đọc riêng (d-012B: bỏ reveal sớm ở f1269 khi narration vẫn là 'hai vị "
              "thần cùng đến cầu hôn'); cả panel + các dòng giữ trọn tới hết câu '…được cưới' 58.525s."),
    "sc045": ("anchors: «Và nếu ai hỏi thần núi ở đâu»666.312 (intro hồi ba — title dẫn trước 170f, bốn bóng "
              "nông dân/lính/dân phu/kỹ sư bắt đầu in, stagger 26/52/78f) · «mỗi lớp đất được nện chặt»672.510 · "
              "«một ngày Sơn Tinh đi làm»673.753 — bóng giữ tới hết câu; dòng chốt giữ trọn tới cuối scene. "
              "d-012B: bỏ cue cũ «đời này tiếp đời trước» (657.848s — thuộc sc044, hiển thị trùng lặp sớm)."),
    "sc046": ("anchors: «Sử chép đê»681.069 · «Núi nâng lên»696.318 · «Đê nối liền»697.723 — ba dòng 'Sử "
              "chep' đúng nhịp; trang trái/phải theo hai vế đối; hai trang khớp nhau (converge) ngay sau "
              "«Đê nối liền» và giữ tới hết scene. d-012B: câu «hai lớp của một trang giấy» (707.757s) KHÔNG "
              "còn ở sc046 — chuyển sang sc047 theo nhịp đọc."),
    "sc047": ("anchors: «đổi chủ thể»700.514 · «người cùng sống với nước»704.802 · «hai lớp của một trang "
              "giấy»707.757 — sc047 KẾ THỪA câu khép «Chúng là hai lớp của một trang giấy.» TỪ sc046 (d-012B, "
              "ownership: sc047): hiện đúng nhịp đọc thật 707.757s ở vùng dưới sau dòng 'Hai câu ấy không "
              "trái nhau.' (hết 707.22s), giữ tới hết câu/scene, không đè gì (sc047 không SourceTag)."),
    "sc048": ("anchors: «vì sao Thủy Tinh vẫn quay lại»711.531 — câu hỏi hiện đúng nhịp mở đầu; vòng nước "
              "dâng/rút (animation, không phải text) chạy theo nhịp câu hỏi; nhịp quay chậm dần về cuối. "
              "d-012B: hai nhãn «tạm lùi về biển»/«lại lên theo mùa» (725.169s/726.535s) KHÔNG còn ở sc048 — "
              "chuyển sang sc049 vì xảy ra sau ba vế phủ định của sc049."),
    "sc049": ("anchors: «không có triều đại để sụp đổ»719.702 · «không có đạo quân để giải tán»721.204 · "
              "«không có cái chết để biến mất»722.726 · «tạm lùi về biển»725.169 · «lại lên theo mùa»726.535 — "
              "ba dòng phủ định đúng nhịp; sc049 KẾ THỪA hai vế nước TỪ sc048 (d-012B, ownership: sc049): "
              "hiện sau ba vế đúng nhịp + đúng thứ tự, giữ tới hết câu; closings 'không dám bịa một hồi "
              "kết'/'vẫn chưa xong' giữ nguyên."),
    "sc058": ("anchors: «không bao giờ thắng»881.015 · «không bao giờ cho hắn biến mất»883.556 · «Một kẻ thù "
              "bị xóa»885.424 (mốc ẩn overlay mở) · «hằng năm vẫn đến»887.868 · «giữ Thủy Tinh ở lại»891.434 · "
              "«Mùa một đi tìm tổ tiên»895.283 — sc058 KẾ THỪA hai dòng khép mở TỪ sc059 (d-012B, ownership: "
              "sc058): overlay tạm giữa màn đúng nhịp đọc thực, ẩn sau hết câu 884.929s trước khi vòng icon "
              "chiếm vùng; bốn hình + vòng khép + hai dòng mùa giữ cues cũ."),
    "sc059": ("anchors: «quá khứ không nằm phía sau lưng»899.644 · «Nó nằm ngay dưới chân»901.610 · «trong "
              "từng mùa nước lên»902.431 — hai dòng «không bao giờ…» KHÔNG còn ở sc059 (đã chuyển sang sc058, "
              "d-012B); câu khép cuối hiện đúng nhịp 899.644s+, từng dòng theo phrase riêng, giữ tới hết câu "
              "903.430s; fade-to-black giữ nguyên, chỉ hoàn tất sau hết câu."),
}


def apply_edits() -> list:
    results = []
    cache = {}
    for e in EDITS:
        path = ST / e["file"]
        if e["file"] not in cache:
            cache[e["file"]] = path.read_text(encoding="utf-8")
        text = cache[e["file"]]
        n_old, n_new = text.count(e["old"]), text.count(e["new"])
        if e["old"] in e["new"]:
            # append-style edit (old survives inside new): applied iff new already present exactly once
            if n_new == 1 and n_old == 1:
                status = "skipped_already_applied"
            elif n_old == 1 and n_new == 0:
                cache[e["file"]] = text.replace(e["old"], e["new"], 1)
                status = "applied"
            else:
                raise SystemExit(f"ABORT {e['file']} {e['scene']}: append-style old={n_old} new={n_new}")
        else:
            if n_old == 1 and n_new == 0:
                cache[e["file"]] = text.replace(e["old"], e["new"], 1)
                status = "applied"
            elif n_old == 0 and n_new >= 1:
                status = "skipped_already_applied"
            else:
                raise SystemExit(f"ABORT {e['file']} {e['scene']}: old matched {n_old} times (need exactly 1); new={n_new}")
        results.append(dict(file=str(path.relative_to(ROOT)), scene=e["scene"], reason=e["reason"],
                            old=e["old"], new=e["new"], status=status))
    for fname, text in cache.items():
        (ST / fname).write_text(text, encoding="utf-8")
    return results


def apply_plan() -> list:
    plan = json.loads(PLAN_PATH.read_text(encoding="utf-8"))
    out = []
    for s in plan["scenes"]:
        sid = s.get("id")
        if sid not in PLAN_NOTES:
            continue
        old = s.get("overlay_notes", "")
        new = PLAN_NOTES[sid]
        if old == new:
            out.append(dict(scene=sid, old=old, new=new, status="skipped_already_applied"))
        else:
            s["overlay_notes"] = new
            out.append(dict(scene=sid, old=old, new=new, status="applied"))
    missing = set(PLAN_NOTES) - {o["scene"] for o in out}
    if missing:
        raise SystemExit(f"ABORT plan: scene ids not found: {sorted(missing)}")
    PLAN_PATH.write_text(json.dumps(plan, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    return out


def main():
    log = {
        "task": "d-012B scene conflict resolution — semantic TSX edits + plan overlay_notes",
        "generated_at": datetime.datetime.now().isoformat(timespec="seconds"),
        "constraints": [
            "61 scene ids/sections/palette/geometry preserved; only conflicting words/reveals moved",
            "narration/audio unchanged; every moved reveal = real A(phrase) onset, retained to sentence end",
            "inherited panels have explicit ownership in plan (sc047, sc049, sc058)",
            "no clamp; timing regeneration/audit owned by the scripts worker",
        ],
        "anchor_map": {
            "sc004": [["ra điều kiện", 51.411], ["voi chín ngà", 53.568], ["gà chín cựa", 54.381],
                      ["ngựa chín hồng mao", 55.248], ["đến trước thì được cưới", 57.560]],
            "sc045": [["Và nếu ai hỏi thần núi ở đâu", 666.312], ["mỗi lớp đất được nện chặt", 672.510],
                      ["một ngày Sơn Tinh đi làm", 673.753]],
            "sc046": [["Sử chép đê", 681.069], ["Núi nâng lên", 696.318], ["Đê nối liền", 697.723]],
            "sc047": [["đổi chủ thể", 700.514], ["người cùng sống với nước", 704.802],
                      ["hai lớp của một trang giấy", 707.757]],
            "sc048": [["vì sao Thủy Tinh vẫn quay lại", 711.531]],
            "sc049": [["không có triều đại để sụp đổ", 719.702], ["không có đạo quân để giải tán", 721.204],
                      ["không có cái chết để biến mất", 722.726], ["tạm lùi về biển", 725.169],
                      ["lại lên theo mùa", 726.535]],
            "sc058": [["không bao giờ thắng", 881.015], ["không bao giờ cho hắn biến mất", 883.556],
                      ["Một kẻ thù bị xóa", 885.424], ["hằng năm vẫn đến", 887.868],
                      ["giữ Thủy Tinh ở lại", 891.434], ["Mùa một đi tìm tổ tiên", 895.283]],
            "sc059": [["quá khứ không nằm phía sau lưng", 899.644], ["Nó nằm ngay dưới chân", 901.610],
                      ["trong từng mùa nước lên", 902.431]],
        },
        "anchors_removed": ["sc046: hai lớp của một trang giấy", "sc048: tạm lùi về biển / lại lên theo mùa",
                            "sc059: không bao giờ thắng / không bao giờ cho hắn biến mất",
                            "sc045: đời này tiếp đời trước"],
        "tsx_edits": apply_edits(),
        "plan_overlay_notes": apply_plan(),
    }
    LOG_PATH.write_text(json.dumps(log, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    applied = sum(1 for r in log["tsx_edits"] if r["status"] == "applied")
    skipped = len(log["tsx_edits"]) - applied
    papplied = sum(1 for r in log["plan_overlay_notes"] if r["status"] == "applied")
    print(f"OK tsx edits applied={applied} skipped={skipped}; plan notes applied={papplied}/{len(log['plan_overlay_notes'])}")
    print(f"log -> {LOG_PATH.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
