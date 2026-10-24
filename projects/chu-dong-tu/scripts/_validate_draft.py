import json, sys
sys.path.insert(0, ".")
from schemas.artifacts import validate_artifact
d = json.load(open("projects/chu-dong-tu/drafts/script_draft.json"))
validate_artifact("script", d)
print("VALID")
