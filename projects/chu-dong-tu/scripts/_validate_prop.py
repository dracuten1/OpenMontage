import json, sys
sys.path.insert(0, ".")
from schemas.artifacts import validate_artifact
d = json.load(open("projects/chu-dong-tu/artifacts/proposal_packet.json"))
validate_artifact("proposal_packet", d)
print("VALID")
