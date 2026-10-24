"""Synthetic QC1 regression diagnostics: no production timing, assets, or renders."""
import importlib
import json
import math
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest

PROJECT = Path(__file__).resolve().parents[1]
ROOT = PROJECT.parents[1]
sys.path.insert(0, str(PROJECT / "scripts"))
import phrase_lock as lock


def words(text, step=0.2, start=0):
    return [{"word": w, "start": start + i * step, "end": start + i * step + step / 2}
            for i, w in enumerate(text.split())]


class EngineTests(unittest.TestCase):
    def test_live_context_raw_fractions_and_text_envelopes(self):
        js = r'''
const fs = require('fs'), vm = require('vm'), assert = require('assert');
const ts = require('./remotion-composer/node_modules/typescript');
const contexts = []; let frame = 0;
const React = {createContext(value) {const c = {value}; contexts.push(c); return c;},
  useContext(c) {return c.value;}, createElement(type, props, ...children) {return {type, props: {...props, children}};}};
React.default = React;
const remotion = {useCurrentFrame: () => frame, useVideoConfig: () => ({durationInFrames: 9000, fps: 30}),
  staticFile: x => x, random: () => 0.5, spring: () => 1};
const source = fs.readFileSync('remotion-composer/src/thanh-giong/common.tsx', 'utf8');
const compiled = ts.transpileModule(source, {compilerOptions: {jsx: ts.JsxEmit.React, module: ts.ModuleKind.CommonJS}}).outputText;
const exp = {};
vm.runInNewContext(compiled, {exports: exp, require: name => {
  if (name === 'react') return React;
  if (name === 'remotion') return remotion;
  if (name.startsWith('@remotion/google-fonts/')) return {loadFont() {}};
  if (name === './anchors') return {wordStart: (_section, word) => ({early: 1, late: 30, now: 10}[word])};
  if (name === './theme') return {C: {}, FONT: {}, FPS: 30,
    at: (f, d, a, b = a + .1) => Math.max(0, Math.min(1, (f / d - a) / (b - a))), ease: x => x};
  throw new Error(name);
}});
const failures = [];
function check(name, fn) {try {fn();} catch (e) {failures.push(name + ': ' + e.message);}}
contexts[0].value = 600;
check('useFrac context priority', () => assert.equal(exp.useFrac(300).dur, 600));
contexts[1].value = {sectionId: 's01', startFrame: 300};
check('useA context priority', () => assert.equal(exp.useA(300)('late'), 1));
check('raw early fraction', () => assert.equal(exp.useA()('early'), -.45));
check('raw late fraction', () => assert.equal(exp.useA()('late'), 1));
contexts[1].value = null;
check('missing context throws', () => assert.throws(() => exp.useA()('now'), /AnchorProvider|anchor context/i));
contexts[0].value = 3000; frame = 308;
check('Reveal settles in 8 frames', () => assert.ok(exp.Reveal({startFrac: .1}).props.style.opacity >= .999));
const title = exp.SceneTitle({title: 'T', subtitle: 'S', eyebrow: 'E', startFrac: .1});
const reveals = title.props.children.flat().filter(x => x && x.type === exp.Reveal);
check('SceneTitle no fractional text delays', () => assert.ok(reveals.every(x => x.props.startFrac === .1 && x.props.endFrac === undefined)));
const plate = exp.InkImageScene({src: 'test.png', label: 'L', sublabel: 'S', labelStartFrac: .2, sublabelStartFrac: .7});
function walk(n, out = []) {if (Array.isArray(n)) n.forEach(x => walk(x, out)); else if(n && typeof n === 'object') {out.push(n); walk(n.props?.children, out);} return out;}
const plateReveals = walk(plate).filter(x => x.type === exp.Reveal);
check('image text independent cues', () => assert.deepEqual(plateReveals.map(x => x.props.startFrac), [.2, .7]));
if (failures.length) {console.error(failures.join('\n')); process.exitCode = 1;}
'''
        result = subprocess.run(["node", "-e", js], cwd=ROOT, text=True, capture_output=True)
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)


class TimingTests(unittest.TestCase):
    def helper(self):
        try:
            return importlib.import_module("timing_audit")
        except ImportError:
            self.fail("QC1 deterministic timing helper is missing")

    def test_exact_matching_overlap_and_internal_punctuation(self):
        self.assertEqual([s.start_word for s in lock.find_occurrences(words("a a a"), "a a")], [0, 1])
        self.assertEqual(len(lock.find_occurrences(words("H'Mông !"), "h mông")), 1)
        self.assertEqual(lock.find_occurrences(words("H'Mông !"), "h"), [])
        self.assertEqual(lock.js_round(2.5), 3)

    def test_mapping_has_all_seventy_scenes(self):
        data = json.loads((PROJECT / "artifacts/scene_start_phrases.json").read_text())
        self.assertEqual(list(data), [f"sc{i:03d}" for i in range(1, 71)])
        self.assertEqual(data["sc001"], "Người cứu nước")
        self.assertEqual(data["sc070"], "Nếu bạn thích")

    def test_boundary_retains_previous_sentence_and_uses_mapping(self):
        h = self.helper()
        w = words("Mở đầu. Câu trước hết. Tối nay. Lặp lại. Tối nay.")
        scenes = [{"id": f"sc{i:03d}", "script_section_id": "s01"} for i in range(1, 4)]
        mapping = {"sc001": "Mở đầu", "sc002": "Tối nay", "sc003": "Tối nay"}
        rows, conflicts = h.build_boundaries(scenes, {"s01": w}, mapping, 300)
        self.assertEqual(rows[0]["startFrame"], 0)
        self.assertEqual(rows[1]["startFrame"], 29)  # sentence end .9 + .05, ceil
        self.assertEqual(rows[1]["sentenceEnd"], w[4]["end"])
        self.assertEqual(rows[2]["startPhraseOcc"], 2)
        self.assertFalse(conflicts)
        self.assertEqual(rows[-1]["startFrame"] + rows[-1]["durationInFrames"], 300)

    def test_no_gap_caps_at_phrase_and_reports_overlap(self):
        h = self.helper()
        w = [{"word": "Đầu.", "start": 0, "end": 1.4}, {"word": "Sau.", "start": 1, "end": 1.6}]
        scenes = [{"id": "sc001", "script_section_id": "s01"}, {"id": "sc002", "script_section_id": "s01"}]
        rows, conflicts = h.build_boundaries(scenes, {"s01": w}, {"sc001": "Đầu", "sc002": "Sau"}, 100)
        self.assertEqual(rows[1]["startFrame"], 30)
        self.assertTrue(any(x["type"] == "sentence_overlap" for x in conflicts))
        with self.assertRaises(lock.ResolutionError):
            h.build_boundaries(scenes, {"s01": w}, {"sc001": "missing", "sc002": "Sau"}, 100)

    def test_ledger_raw_effective_completion_and_early_semantics(self):
        h = self.helper()
        timing = {"startFrame": 30, "durationInFrames": 90}
        w = [{"word": "Ý.", "start": 2, "end": 2.2}]
        cue = {"scene": "sc001", "element": "title", "phrase": "Ý", "occ": 1, "kind": "text"}
        row = h.audit_cue(cue, w, timing)
        self.assertEqual(row["rawFraction"], 1 / 3)
        self.assertEqual(row["effectiveOnsetFrame"], 60)
        self.assertEqual(row["effectiveCompletionFrame"], 68)
        self.assertTrue(row["pass"])
        self.assertFalse(h.audit_cue({**cue, "offsetFrames": -1}, w, timing)["pass"])
        self.assertFalse(h.audit_cue({**cue, "durationFrames": 10}, w, timing)["pass"])
        self.assertFalse(h.audit_cue({**cue, "durationFrames": 80}, w, timing)["pass"])
        self.assertTrue(h.audit_cue({**cue, "durationFrames": 15, "kind": "drawing"}, w, timing)["pass"])
        self.assertFalse(h.audit_cue({**cue, "kind": "quote", "durationFrames": 15}, w, timing)["pass"])

    def test_missing_provenance_and_ledger_are_pending_not_pass(self):
        h = self.helper()
        with tempfile.TemporaryDirectory() as d:
            self.assertEqual(h.load_ledgers(Path(d), ["sc001"])["status"], "pending")
            self.assertEqual(h.check_provenance(Path(d), {"s01": words("Một.")})["status"], "pending")


if __name__ == "__main__":
    unittest.main(verbosity=2)
