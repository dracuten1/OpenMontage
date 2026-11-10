// case02 scene shell 05 — references its manifest-claimed tokens so
// single-token name binding resolves to the real declaration bodies
import React from "react";
import { TimeChip, SceneTitle, DetailRowStack } from "../lib/SceneShell";

export const Scene05: React.FC = () => <div><TimeChip />, <SceneTitle />, <DetailRowStack /></div>;
