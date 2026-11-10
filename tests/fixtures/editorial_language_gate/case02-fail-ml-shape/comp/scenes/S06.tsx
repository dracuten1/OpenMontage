// case02 scene shell 06 — references its manifest-claimed tokens so
// single-token name binding resolves to the real declaration bodies
import React from "react";
import { TimeChip, SceneTitle, DetailRowStack, VersusBadge } from "../lib/SceneShell";

export const Scene06: React.FC = () => <div><TimeChip />, <SceneTitle />, <DetailRowStack />, <VersusBadge /></div>;
