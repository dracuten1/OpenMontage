# COMPOSER_FACTS — KidsStoryMultiScene v2

**Probe bụng:** 2 vòng. Vòng 1: pixel-scan thấy dải nền cỏ ~10px local giữa đáy cổ và viền bụng tại lx=390 (chỉ khi proud, f1050). Fix: neck ry 56→64 (nudge neck, đúng mọi frame — phần dưới bị dome/rim/belly che khi không proud). Vòng 2 PASS: neck olive → viền nâu → rim cam → bụng be liền mạch, không sọc nền; chân mọc từ bụng. Dome/rim/spots/belly path áp đúng spec lead, không đổi gì khác.

**Frames extract (mid-cue A gần giữa line, i0→f45, i1→f191, i2→f332, i3→f488, i4→f641, i5→f742, i6→f872, i7→f1067):** f45, f191, f283, f332, f488, f550, f641, f660, f742, f807, f828, f836, f872, f972, f1067, f1110, f1182. Đủ: nói, crossfade, ngủ zZz, đi, thức giật mình, proud, clap, confetti, frame cuối — không black frame; title hiện đúng ở f45.

**Crops 380×380:** v2_f191 / v2_f488 / v2_f742 / v2_f1067_crop_turtle.png.
**Montage:** belly_before_after_walk.png, belly_before_after_proud.png (v1 vs v2).

**ffprobe** (ffprobe_v2.txt): h264 1080×1080 30fps, duration 39.6s, aac 48kHz stereo, 65,720,758 bytes (~62.7 MB).

**tsc:** sạch. Lỗi gặp: không.

Video: `character-performer/renders/kids_story_multiscene_v2.mp4`
