# OpenMontage Orchestration Doctrine

Owner: Tuyên (dracuten1). Viết bởi Hermes từ bằng chứng aivn-20261005/06 (2026-10-05/06).
Ngôn ngữ: Việt — kỹ thuật giữ nguyên thuật ngữ Anh.

Đây là hợp đồng orchestration cho mọi production OpenMontage chạy qua Claude Code.
Nguồn sự thật song song: `~/.hermes/skills/openmontage-video/references/claude-code-orchestration.md` (bản Hermes-side).
Sai doctrine = lỗi lặp lại; sửa doctrine = sửa tại đây rồi sync 2 chiều.

---

## §0. Pattern nền (đã chạy, đã đo)

3 Claude session + Hermes mechanical steps. Một lead đơn không sống nổi: aivn-20261005 lead chết "Prompt is too long" turn 99 context 177k; resume chết max-turns 60 context 157k; subagent 484–507 turns 0 chết. Chia:

| Session | Việc | max-turns | Thực tế |
|---|---|---|---|
| S1 PLAN | research→proposal→script→scene_plan (stage-worker + reviewer) | 40 | ~41 turns, $19.1 |
| S2 ASSETS | asset-worker batch TTS+whisper+images, reviewer gate | 20 | ~10 turns |
| S3 COMPOSE | edit-worker + composer (TSX, probe, render ≤5') | 25 | 26 turns → error_max_turns |
| PUBLISH + fix | **Hermes terminal trực tiếp** (validate, checkpoint, ASR, re-render) | 0 Claude turns | ~6 tool calls |

Nguyên tắc chuyển việc về Hermes: bước cơ học >5 phút hoặc sau render cuối → Hermes terminal, không vào lead.

## §1. Probe gates (BẮT BUỘC, thêm 2026-10-05)

Bài học: S1 PASS schema + reviewer nhưng KHÔNG kiểm artifact chạy được — sửa "VRAM→Vê-ram" xong không replay TTS, đổi "expert→chuyên gia" xong không nghe audio → 4 lần render lại v2→v5. Schema-valid ≠ production-correct.

**Gate A — TTS probe ở cuối S1 (PLAN):** trước khi PASS, lead BẮT BUỘC:
1. Chọn 2–3 từ rủi ro nhất trong lexicon mới (thuật ngữ nước ngoài, số, tên riêng).
2. Sinh audio probe qua vieneu (`tts.infer` từng từ trong context câu ngắn), ASR lại bằng faster-whisper.
3. ASR khớp ý → checkpoint PASS. Sai → sửa lexicon/provider_text TRONG session, probe lại (tối đa +3 turn).

**Gate B — Frame probe ở S3 (COMPOSE):** trước khi render full:
1. `npx remotion still <CompositionId> probe.png --frame=<giữa scene dày chữ nhất>` (~30s).
2. Vision-check probe frame (text đúng, không overflow, đúng thứ tự xuất hiện theo narration).
3. FAIL → fix TSX trong session (+3 turn). PASS → mới render full.

Chi phí: +2 turn S1, +2 turn S3 (~$0.04). Lợi: khỏi 3–4 lần render full (3–4 phút CPU + 1 session fix mỗi lần).

**Gate C — final verify (Hermes, sau render):** ASR toàn track + vision 2–3 frame + ffprobe duration ±0.5s vs script. PASS mới giao.

## §2. Hermes là orchestrator, không phải thợ sửa (thêm 2026-10-05)

Vi phạm có thật: 10-05 Hermes tự viết `rebuild_aivn_20261006_pron.py`, tự re-render thay vì spawn fix-session. Lý do lúc đó (lead chết + 1 thay đổi nhỏ) không hợp lệ về doctrine.

Quy tắc cứng:
- Hermes KHÔNG Edit/Write trong `projects/<id>/artifacts/**`, `remotion-composer/src/**`, `projects/<id>/renders/**`. Chỉ đọc + tạo prompt/state file mới.
- Mỗi lần QA bắt lỗi → ghi `projects/<id>/fix_request_NN.json` (field: `issues[]`, `evidence`, `scope`, `forbidden_rework`) rồi spawn **fix-session ≤10 turns** với prompt "Read fix_request_NN.json, apply, đừng re-do phần đã PASS".
- QA order: Hermes độc lập verify (ASR/vision/ffprobe) → có lỗi → fix_request → fix-session → Hermes verify lại → loop tối đa 2 lần. Lần 2 vẫn fail → dừng, báo owner với checklist cụ thể.
- Lead session chết `error_max_turns`/context: Hermes KHÔNG viết thay. Chạy probe thu thập evidence (1 frame, 1 ASR excerpt), ghi fix_request, spawn session kế tiếp.
- Token budget: PLAN ≤40, ASSETS ≤20, COMPOSE ≤25, FIX ≤10.

## §3. Thuật ngữ nước ngoài trong TTS (display≠narration, định chính sách 2026-10-05)

vieneu v3 Turbo (sea-g2p `lang="vi"`) **tự code-switch sang English engine**: 'expert'→ˈɛkspɜːt, 'VRAM'→vɹˈæm, 'Qwen'→kjˈuːwˈɛn. Không cần ép phiên âm tiếng Việt cho từ đã có trong từ điển Anh.

**`phoneme_dict` KHÔNG hoạt động ở sea-g2p 0.7.x / vieneu 3.8.3** — xác minh 2026-10-05: wrapper `vieneu_utils/phonemize_text.py` nhận kwarg nhưng Rust binding `_rust_engine.phonemize(text, punc_norm)` bỏ qua (test: `phonemize_batch(..., phoneme_dict={"expert": "v i ɛ t"})` → output identical). Chờ upstream wire xong mới dùng; khi nghi ngờ re-verify bằng snippet:
```python
from sea_g2p import G2P
g2p = G2P(lang="vi")
a = g2p.phonemize_batch(["expert giữ năng lực"], punc_norm=True)[0].rstrip(".")
b = g2p.phonemize_batch(["expert giữ năng literacy".replace("literacy","lực")], punc_norm=True, phoneme_dict={"expert": "v i ɛ t"})[0].rstrip(".")
print(a != b)  # False = dict chết
```

**Chính sách chọn đường (khuyến nghị owner đã duyệt 2026-10-05):**
- **(a) Tên Anh nguyên văn** — mặc định cho thuật ngữ quốc tế/brand: `expert`, `token`, `GPU`, `Qwen`. vieneu tự đọc chuẩn. Display = narration.
- **(b) Phiên âm Việt trong tts_lexicon** — chỉ cho viết tắt dễ đọc nhầm hoặc brand cần đọc近似 Việt: `VRAM→Vê-ram`, `Qwen→Quen` (khi context yêu cầu), `Strata→Xtra-ta`. Display nguyên văn, narration dùng bản trong lexicon.
- **(c) Việt hóa hoàn toàn** — chỉ khi khái niệm thuộc về người xem Việt: `expert→chuyên gia` CHỈ khi slide cũng ghi "chuyên gia" (đừng display "Expert" + nói "chuyên gia" — mắt tai lệch, đúng lỗi v3→v4 aivn-20261006).

Rule vàng: **display và narration không được mâu thuẫn**. Khác nhau OK (display "VRAM", nói "Vê-ram"), mâu thuẫn không OK (display "Expert", nói "chuyên gia").

## §4. Bài học đã trả giá (giữ nguyên, tham chiếu)

- **Lead flooding là kẻ thù**: 44–45 Read/lead (240k chars). Read whitelist ≤6 file/session, đọc nguyên vẹn 1 lần, cấm paginated re-read, cấm TodoWrite, cấm post-render verify loop trong lead.
- **Agent Teams = bẫy trên Mac không tmux**: `-p` không spawn teammates, in-process chia context lead. Subagent Task-tool isolation mới là feature thật.
- **Permission denials là tín hiệu**: stop & report, không Bash-redirect vòng guard. Stub 19-byte viết lách qua Write denial là defect thật.
- **Checkpoint vs disk**: session chết có thể bỏ sót checkpoint; resume LUÔN diff checkpoint_*.json vs artifacts thật, backfill bằng payload thật (path-stub fail validator).
- **Kill process đúng cách**: `pkill -f "claude -p"` không khớp pattern khi prompt dài — kill theo PID.
- **max-turns phải khớp scope prompt**: prompt toàn pipeline + max-turns 40 = chết chắc (aivn-20261006 lần 1).
- **Probe-still trước render full** đã tiết kiệm 30' render discovery — giữ làm Gate B.

## §5. Changelog
- 2026-10-05: doctrine đầu tiên (3-session split, Read whitelist, Agent Teams verdict, resume discipline) — từ turn-level autopsy aivn-20261005.
- 2026-10-06: +§1 Probe gates (A/B/C), +§2 Hermes orchestrator rule (fix_request pattern), +§3 phoneme_dict caveat + chính sách 3 đường thuật ngữ, lỗi v2→v5 aivn-20261006 ghi nhận.
