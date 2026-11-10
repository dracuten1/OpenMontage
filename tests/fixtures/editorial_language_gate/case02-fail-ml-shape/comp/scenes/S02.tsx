// case02 scene shell 02 — references its manifest-claimed tokens so
// single-token name binding resolves to the real declaration bodies
import React from "react";
import { SceneTitle, MechRowStack, StatChip } from "../lib/SceneShell";

export const Scene02: React.FC = () => <div><SceneTitle />, <MechRowStack />, <StatChip /></div>;
