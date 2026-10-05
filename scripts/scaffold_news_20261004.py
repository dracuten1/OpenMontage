"""One-off scaffold: scene stubs + Root.tsx registration for news-20261004 (idempotent)."""
from pathlib import Path

RC = Path(__file__).resolve().parent.parent / "remotion-composer"
d = RC / "src" / "news-20261004" / "scenes"
d.mkdir(parents=True, exist_ok=True)

for i in range(1, 15):
    n = "S%02d" % i
    s = "s%02d" % i
    extra = ""
    if i == 9:
        extra = (
            '      <div style={{ fontSize: 56, fontWeight: 600, color: C.amber, marginTop: 24 }}>\n'
            "        Tăng trưởng GDP 9,95% — Đà Nẵng, Việt Nam\n"
            "      </div>\n"
        )
    body = (
        "// TODO scene author -- overwrite this stub. Read ../SCENE_AUTHOR_GUIDE.md first.\n"
        'import React from "react";\n'
        'import { SceneFrame } from "../components";\n'
        'import { C, FONT } from "../theme";\n\n'
        f"const {n}: React.FC = () => (\n"
        f'  <SceneFrame sceneId="{s}">\n'
        "    <div style={{ fontFamily: FONT, fontSize: 72, fontWeight: 800, color: C.text }}>\n"
        f"      {n} placeholder\n"
        f"{extra}"
        "    </div>\n"
        "  </SceneFrame>\n"
        ");\n\n"
        f"export default {n};\n"
    )
    (d / f"{n}.tsx").write_text(body)

root = RC / "src" / "Root.tsx"
t = root.read_text()
if "News20261004" not in t:
    t = t.replace(
        'import { VNMythEpisode } from "./con-rong-chau-tien/Episode";\n',
        'import { VNMythEpisode } from "./con-rong-chau-tien/Episode";\n'
        'import { News20261004, NEWS_TOTAL_FRAMES } from "./news-20261004";\n',
        1,
    )
    t = t.replace(
        "    </>\n  );\n};",
        '      <Composition\n        id="News20261004"\n        component={News20261004}\n'
        "        durationInFrames={NEWS_TOTAL_FRAMES}\n        fps={30}\n        width={1920}\n        height={1080}\n      />\n"
        "    </>\n  );\n};",
        1,
    )
    root.write_text(t)
print("ok")
