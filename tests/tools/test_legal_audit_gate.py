"""Tests for global vn-legal-counsel scanner & OpenMontage legal_audit_gate adapter."""
from __future__ import annotations

import importlib.util
import json
from pathlib import Path
from types import SimpleNamespace

import pytest
import yaml

from tools.qc import legal_audit_gate, ship_episode

PLUGIN_DIR = Path.home() / ".gemini" / "config" / "plugins" / "vn-legal-counsel"
SKILL_DIR = PLUGIN_DIR / "skills" / "vn-legal-counsel"


def _write_minimal_project(proj: Path, *, script_text: str, channel: str = "ky-chu-phap-luat") -> dict[str, str | None]:
    (proj / "research").mkdir(parents=True, exist_ok=True)
    (proj / "artifacts").mkdir(parents=True, exist_ok=True)
    (proj / "project.json").write_text(json.dumps({"slug": proj.name, "channel": channel}), encoding="utf-8")
    (proj / "research" / "research_brief.md").write_text("# Brief\nKiểm chứng pháp lý.\n", encoding="utf-8")
    (proj / "script.json").write_text(
        json.dumps({"sections": [{"id": "S01", "text": script_text}]}, ensure_ascii=False),
        encoding="utf-8",
    )
    (proj / "artifacts" / "fact_whitelist.json").write_text(
        json.dumps({"facts": [{"id": "F01", "display_string": "282/2025/NĐ-CP"}]}, ensure_ascii=False),
        encoding="utf-8",
    )
    scanner = legal_audit_gate._load_global_scanner()
    return scanner.compute_project_input_hashes(proj)


def _write_valid_audit(proj: Path, hashes: dict[str, str | None], *, verdict: str = "APPROVED") -> None:
    payload = {
        "schema_version": "1.0",
        "project_slug": proj.name,
        "audited_at": "2026-11-25T12:00:00Z",
        "freshness_anchor": "2026-11-25",
        "verdict": verdict,
        "input_hashes": hashes,
        "checks": {
            "temporal_validity": "pass",
            "primary_source_verification": "pass",
            "subject_and_penalty_accuracy": "pass",
            "elements_and_exceptions": "pass",
            "cross_artifact_consistency": "pass",
            "ethics_and_disclaimer": "pass",
            "superseded_law_scan": "pass",
        },
        "findings": [],
        "statutes_verified": [
            {
                "doc_number": "282/2025/NĐ-CP",
                "effective_date": "15/12/2025",
                "validity_status": "in_force",
                "source_url": "https://bocongan.gov.vn/bai-viet/demo",
            }
        ],
        "summary_vi": "Đạt chuẩn thẩm định pháp lý.",
    }
    (proj / "artifacts" / "legal_audit.json").write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")


def test_global_plugin_schemas_and_registry_valid():
    assert (PLUGIN_DIR / "plugin.json").is_file()
    plugin_meta = json.loads((PLUGIN_DIR / "plugin.json").read_text(encoding="utf-8"))
    assert plugin_meta["name"] == "vn-legal-counsel"

    for schema_name in ("legal_dossier.schema.json", "legal_audit.schema.json"):
        schema = json.loads((SKILL_DIR / "schemas" / schema_name).read_text(encoding="utf-8"))
        assert "$schema" in schema and "properties" in schema

    scanner = legal_audit_gate._load_global_scanner()
    reg = scanner.load_superseded_registry()
    assert len(reg.get("entries", [])) >= 10
    assert "thay thế" in reg.get("historical_context_keywords", [])


def test_superseded_law_scan_flags_outdated_laws_and_allows_historical_context(tmp_path):
    proj_bad = tmp_path / "ep_bad"
    hashes_bad = _write_minimal_project(
        proj_bad,
        script_text="Theo Nghị định 144/2021/NĐ-CP hiện nay, người nhận tiền nhầm bị phạt 3 đến 5 triệu đồng.",
    )
    _write_valid_audit(proj_bad, hashes_bad)
    ok_bad, _, failures_bad = legal_audit_gate.verify_project_legal_audit(proj_bad)
    assert ok_bad is False
    assert any("LEG-SUPERSEDED-LAW" in f and "144/2021" in f for f in failures_bad)

    proj_bad2 = tmp_path / "ep_bad_land"
    hashes_bad2 = _write_minimal_project(
        proj_bad2,
        script_text="Theo Luật Đất đai 2013 và Nghị định 100/2019/NĐ-CP đang áp dụng thì bị phạt nặng.",
    )
    _write_valid_audit(proj_bad2, hashes_bad2)
    ok_bad2, _, failures_bad2 = legal_audit_gate.verify_project_legal_audit(proj_bad2)
    assert ok_bad2 is False
    assert len([f for f in failures_bad2 if "LEG-SUPERSEDED-LAW" in f]) >= 2

    proj_good = tmp_path / "ep_good"
    hashes_good = _write_minimal_project(
        proj_good,
        script_text="Nghị định 282/2025/NĐ-CP chính thức thay thế Nghị định 144/2021/NĐ-CP từ ngày 15/12/2025.",
    )
    # banned_strings in fact_whitelist.json intentionally lists outdated phrases to forbid; must not trigger false positive
    wl_path = proj_good / "artifacts" / "fact_whitelist.json"
    wl_obj = json.loads(wl_path.read_text(encoding="utf-8"))
    wl_obj["banned_strings"] = ["theo Nghị định 144/2021 hiện hành"]
    wl_path.write_text(json.dumps(wl_obj, ensure_ascii=False), encoding="utf-8")
    hashes_good = legal_audit_gate._load_global_scanner().compute_project_input_hashes(proj_good)
    _write_valid_audit(proj_good, hashes_good)
    ok_good, _, failures_good = legal_audit_gate.verify_project_legal_audit(proj_good)
    assert ok_good is True
    assert failures_good == []


def test_legal_audit_gate_fail_closed_states(tmp_path):
    # 1. Missing audit artifact
    proj = tmp_path / "ep_states"
    hashes = _write_minimal_project(proj, script_text="Áp dụng Điều 18 Nghị định 282/2025/NĐ-CP.")
    ok, _, failures = legal_audit_gate.verify_project_legal_audit(proj)
    assert ok is False and any("LEG-MISSING-AUDIT" in f for f in failures)

    # 2. Verdict not APPROVED
    _write_valid_audit(proj, hashes, verdict="REVISE_REQUIRED")
    ok, _, failures = legal_audit_gate.verify_project_legal_audit(proj)
    assert ok is False and any("LEG-NOT-APPROVED" in f for f in failures)

    # 3. Open critical finding even if verdict field tampered
    _write_valid_audit(proj, hashes, verdict="APPROVED")
    audit_path = proj / "artifacts" / "legal_audit.json"
    data = json.loads(audit_path.read_text(encoding="utf-8"))
    data["findings"] = [
        {
            "id": "F-CRIT-1",
            "severity": "critical",
            "status": "open",
            "location": "script:S04",
            "claim_found": "Sai mức phạt",
            "legal_issue": "Dẫn sai khung",
            "authoritative_citation": "NĐ 282/2025",
            "required_fix": "Sửa lại",
        }
    ]
    audit_path.write_text(json.dumps(data, ensure_ascii=False), encoding="utf-8")
    ok, _, failures = legal_audit_gate.verify_project_legal_audit(proj)
    assert ok is False and any("LEG-OPEN-CRITICAL" in f for f in failures)

    # 4. Missing .gov.vn citation
    _write_valid_audit(proj, hashes, verdict="APPROVED")
    data = json.loads(audit_path.read_text(encoding="utf-8"))
    data["statutes_verified"][0]["source_url"] = "https://example-blog.com/post"
    audit_path.write_text(json.dumps(data, ensure_ascii=False), encoding="utf-8")
    ok, _, failures = legal_audit_gate.verify_project_legal_audit(proj)
    assert ok is False and any("LEG-MISSING-CITATIONS" in f for f in failures)

    # 5. Stale SHA-256 hash when script.json is edited after audit
    _write_valid_audit(proj, hashes, verdict="APPROVED")
    (proj / "script.json").write_text(
        json.dumps({"sections": [{"id": "S01", "text": "Kịch bản đã bị sửa sau khi duyệt."}]}),
        encoding="utf-8",
    )
    ok, _, failures = legal_audit_gate.verify_project_legal_audit(proj)
    assert ok is False and any("LEG-STALE-AUDIT-HASH" in f for f in failures)


def test_ship_episode_invokes_legal_audit_gate_for_legal_channel(tmp_path):
    legal_proj = tmp_path / "legal_ep"
    legal_proj.mkdir()
    (legal_proj / "project.json").write_text(json.dumps({"channel": "ky-chu-phap-luat"}), encoding="utf-8")
    (legal_proj / "audio_stems").mkdir()
    (legal_proj / "mix_profile.json").write_text("{}", encoding="utf-8")

    cmds_legal: list[list[str]] = []

    def fake_runner(cmd, **kwargs):
        cmds_legal.append(cmd)
        return SimpleNamespace(returncode=0, stdout="ok", stderr="")

    res = ship_episode.ship_episode(
        project_dir=legal_proj,
        comp_id="demo-FINAL",
        skip_tsc=True,
        runner=fake_runner,
    )
    assert "legal_audit_gate" in res["steps_executed"]
    assert any("legal_audit_gate.py" in " ".join(c) for c in cmds_legal)

    # Non-legal channel without legal_audit.json should NOT run legal_audit_gate
    other_proj = tmp_path / "other_ep"
    other_proj.mkdir()
    (other_proj / "project.json").write_text(json.dumps({"channel": "tech-news"}), encoding="utf-8")
    (other_proj / "audio_stems").mkdir()
    (other_proj / "mix_profile.json").write_text("{}", encoding="utf-8")

    cmds_other: list[list[str]] = []

    def fake_runner_other(cmd, **kwargs):
        cmds_other.append(cmd)
        return SimpleNamespace(returncode=0, stdout="ok", stderr="")

    res_other = ship_episode.ship_episode(
        project_dir=other_proj,
        comp_id="other-FINAL",
        skip_tsc=True,
        runner=fake_runner_other,
    )
    assert "legal_audit_gate" not in res_other["steps_executed"]
    assert not any("legal_audit_gate.py" in " ".join(c) for c in cmds_other)


def _load_finalize_mod():
    p = SKILL_DIR / "scripts" / "legal_audit_finalize.py"
    spec = importlib.util.spec_from_file_location("vn_legal_audit_finalize", str(p))
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


def test_legal_audit_finalize_repairs_ax_json_stamps_hashes_and_rejects_ellipsis(tmp_path):
    fin = _load_finalize_mod()
    proj = tmp_path / "ep_ax"
    _write_minimal_project(proj, script_text="Áp dụng Điểm đ Khoản 2 Điều 18 Nghị định 282/2025/NĐ-CP.")

    # Simulate Chromium AX tree line-wrapped output (keys/colons/values on separate lines)
    ax_wrapped = """
Gemini said
JSON
{
"schema_version"
:
"1.0"
,
"project_slug"
:
"ep_ax"
,
"verdict"
:
"APPROVED"
,
"checks"
: {
"temporal_validity"
:
"pass"
,
"primary_source_verification"
:
"pass"
,
"subject_and_penalty_accuracy"
:
"pass"
,
"elements_and_exceptions"
:
"pass"
,
"cross_artifact_consistency"
:
"pass"
,
"ethics_and_disclaimer"
:
"pass"
,
"superseded_law_scan"
:
"pass"
},
"findings"
: [],
"statutes_verified"
: [
{
"doc_number"
:
"282/2025/NĐ-CP"
,
"effective_date"
:
"15/12/2025"
,
"validity_status"
:
"in_force"
,
"source_url"
:
"https://vanban.chinhphu.vn/?pageid=27160&docid=215770"
}
],
"summary_vi"
:
"Đạt chuẩn."
}
"""
    ok, report, failures = fin.finalize_audit_from_text(
        project_dir=proj,
        raw_text=ax_wrapped,
        freshness_anchor="2026-11-25",
        chrome_profile="Default",
    )
    assert ok is True and failures == []
    assert (proj / "artifacts" / "legal_audit.json").is_file()
    assert (proj / "research" / "legal_audit_report.md").is_file()
    saved = json.loads((proj / "artifacts" / "legal_audit.json").read_text(encoding="utf-8"))
    assert saved["chrome_profile"] == "Default"
    assert saved["audit_backend"] == "gemini_web"
    assert saved["input_hashes"]["script_sha256"]

    # Truncated ellipsis URL must be rejected
    bad_md = """```json
    {"verdict": "APPROVED", "checks": {}, "findings": [], "statutes_verified": [{"doc_number": "282/2025", "effective_date": "15/12/2025", "validity_status": "in_force", "source_url": "https://vanban.chinhphu.vn/..."}], "summary_vi": "ok"}
    ```"""
    with pytest.raises(ValueError, match="LEG-TRUNCATED-URL"):
        fin.finalize_audit_from_text(project_dir=proj, raw_text=bad_md, chrome_profile="Profile 2")


def test_ky_chu_phap_luat_channel_config_registers_three_gemini_profiles():
    from lib.channels import load_channel

    repo_root = Path(__file__).resolve().parents[2]
    cfg = load_channel("ky-chu-phap-luat", validate=True)
    assert "legal_audit_gate" in (cfg.get("pipeline") or {}).get("qc_gates", [])

    lc = yaml.safe_load((repo_root / "channels" / "ky-chu-phap-luat" / "legal_counsel.yaml").read_text(encoding="utf-8"))
    assert lc.get("default_backend") == "gemini_web"
    assert lc.get("fallback_backend") == "api_workflow"
    accounts = [p.get("account") for p in lc.get("chrome_profiles", [])]
    assert accounts == [
        "tuyennguyenleminh@gmail.com",
        "nguyenleminhtuyen99@gmail.com",
        "dracuten@gmail.com",
    ]
