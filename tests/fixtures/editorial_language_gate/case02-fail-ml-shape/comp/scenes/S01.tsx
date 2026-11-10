// case02 scene shell 01 — references its manifest-claimed tokens so
// single-token name binding resolves to the real declaration bodies
import React from "react";
import { KickerPill, HeroTitle, StatChipRow } from "../lib/SceneShell";

export const Scene01: React.FC = () => <div><KickerPill />, <HeroTitle />, <StatChipRow /></div>;
