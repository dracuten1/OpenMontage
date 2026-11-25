import json
from pathlib import Path

from tools.qc.fact_whitelist_gate import (
    FWG_BANNED_STRING,
    FWG_SCENE_COUNT_MISMATCH,
    FWG_UNWHITELISTED_NUMBER,
    main as fwg_main,
    validate_fact_whitelist,
)


def _setup_project(tmp_path: Path, slug: str = "demo-news") -> tuple[Path, Path]:
    proj = tmp_path / "projects" / slug
    scenes = tmp_path / "scenes"
    (proj / "artifacts").mkdir(parents=True)
    (proj / "research").mkdir(parents=True)
    scenes.mkdir(parents=True)
    return proj, scenes


def test_skips_when_no_v2_whitelist(tmp_path: Path) -> None:
    proj, scenes = _setup_project(tmp_path)
    (scenes / "S01.tsx").write_text('export default function S01() { return <div>999</div>; }')
    rep = validate_fact_whitelist(proj, scenes_dir=scenes, write_report=False)
    assert rep["skipped"] is True
    assert rep["pass"] is True
    assert fwg_main(["--project", str(proj), "--scenes-dir", str(scenes)]) == 0


def test_passes_with_json_whitelist_and_ignores_css_props(tmp_path: Path) -> None:
    proj, scenes = _setup_project(tmp_path)
    wl = {
        "scene_count_exact": 2,
        "facts": [
            {
                "fact_id": "EV-1#f01",
                "display_string": "136,2",
                "verification": "CORROBORATED",
                "allowed_scenes": ["S1"],
            },
            {
                "fact_id": "EV-1#f02",
                "display_string": "55,1 triệu",
                "verification": "CALCULATED",
                "allowed_scenes": ["S01", "S02"],
            },
        ],
        "banned_strings": ["18.670"],
    }
    (proj / "artifacts" / "fact_whitelist.json").write_text(json.dumps(wl), encoding="utf-8")
    (scenes / "S01.tsx").write_text(
        """
        import { COLORS } from "../../components/news";
        export default function S01() {
          return (
            <SceneShell sceneId="scene-1" kicker="KÝ CHỦ ĐIỂM TIN · TIN 1">
              <div style={{ width: 850, height: 1070, fontSize: 42, border: "2px solid #C8281E" }}>
                <HeroTitle text="VÀNG SJC 136,2 TRIỆU" highlight="136,2" />
                <div>Lỗ 55,1 triệu mỗi lượng</div>
                <EditorialLineChart data={[{ label: "20/11", value: 136.2 }]} enterFrames={[0]} />
              </div>
            </SceneShell>
          );
        }
        """,
        encoding="utf-8",
    )
    (scenes / "S02.tsx").write_text(
        'export default function S02() { return <div>Chênh lệch 55,1 triệu đồng</div>; }',
        encoding="utf-8",
    )
    rep = validate_fact_whitelist(proj, scenes_dir=scenes, write_report=True)
    assert rep["pass"] is True, rep["errors"]
    assert (proj / "qc" / "fact_whitelist.json").is_file()


def test_blocks_unwhitelisted_number_leak_and_wrong_scene(tmp_path: Path) -> None:
    proj, scenes = _setup_project(tmp_path)
    wl = {
        "facts": [
            {
                "fact_id": "EV-1#f01",
                "display_string": "136,2",
                "verification": "CORROBORATED",
                "allowed_scenes": ["S01"],
            }
        ],
        "banned_strings": ["25.940"],
    }
    (proj / "artifacts" / "fact_whitelist.json").write_text(json.dumps(wl), encoding="utf-8")
    (scenes / "S01.tsx").write_text(
        'export default function S01() { return <div>SJC 136,2 nhưng cao hơn thế giới 21 triệu</div>; }',
        encoding="utf-8",
    )
    (scenes / "S02.tsx").write_text(
        'export default function S02() { return <div>Tỷ giá 25.940 và SJC 136,2</div>; }',
        encoding="utf-8",
    )
    rep = validate_fact_whitelist(proj, scenes_dir=scenes, write_report=False)
    assert rep["pass"] is False
    codes = {e["code"] for e in rep["errors"]}
    assert FWG_UNWHITELISTED_NUMBER in codes
    assert FWG_BANNED_STRING in codes
    # S01 leaked "21", S02 printed banned "25.940" AND used "136,2" outside allowed_scenes=["S01"]
    tokens = {e.get("token") for e in rep["errors"]}
    assert "21" in tokens
    assert "25.940" in tokens
    assert "136,2" in tokens
    assert fwg_main(["--project", str(proj), "--scenes-dir", str(scenes)]) == 1


def test_parses_markdown_v2_brief_and_checks_scene_count(tmp_path: Path) -> None:
    proj, scenes = _setup_project(tmp_path)
    (proj / "research" / "research_brief.md").write_text(
        """---
packet_version: 2
scene_count_exact: 2
banned_strings: ["18.670"]
---
## EV-1
| fact_id | display_string | type | source | verification | allowed_scenes | narration_form |
|---|---|---|---|---|---|---|
| EV-1#f01 | `110` | source | ev01 | CORROBORATED | S1 | "một trăm mười" |
| EV-1#f02 | `18.670` | source | ev02 | DISCREPANCY-EXCLUDED | S1 | — |
""",
        encoding="utf-8",
    )
    (scenes / "S01.tsx").write_text(
        'export default function S01() { return <div>Hơn 110 tên lửa và 18.670</div>; }',
        encoding="utf-8",
    )
    rep = validate_fact_whitelist(proj, scenes_dir=scenes, write_report=False)
    assert rep["pass"] is False
    codes = {e["code"] for e in rep["errors"]}
    assert FWG_SCENE_COUNT_MISMATCH in codes
    assert FWG_BANNED_STRING in codes


def test_blocks_countup_and_template_numbers_and_no_scenes(tmp_path: Path) -> None:
    from tools.qc.fact_whitelist_gate import FWG_NO_SCENES_FOUND
    proj, scenes = _setup_project(tmp_path)
    wl = {
        "facts": [
            {"fact_id": "EV-1#f01", "display_string": "100", "verification": "CORROBORATED", "allowed_scenes": ["*"]}
        ],
    }
    (proj / "artifacts" / "fact_whitelist.json").write_text(json.dumps(wl), encoding="utf-8")

    # 0 scenes -> fail-closed
    empty_rep = validate_fact_whitelist(proj, scenes_dir=scenes, write_report=False)
    assert empty_rep["pass"] is False
    assert any(e["code"] == FWG_NO_SCENES_FOUND for e in empty_rep["errors"])

    # CountUp to={777} and template literal ${888} -> blocked
    (scenes / "S01.tsx").write_text(
        'export default function S01() { return <div><CountUp to={777} startFrame={0} />{`Mất ${888} tỷ`}</div>; }',
        encoding="utf-8",
    )
    rep = validate_fact_whitelist(proj, scenes_dir=scenes, write_report=False)
    assert rep["pass"] is False
    tokens = {e.get("token") for e in rep["errors"]}
    assert "777" in tokens
    assert "888" in tokens
