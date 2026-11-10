// case02 scene shell 04 — references its manifest-claimed tokens so
// single-token name binding resolves to the real declaration bodies
import React from "react";
import { SceneTitle, FloodRowStack } from "../lib/SceneShell";

export const Scene04: React.FC = () => <div><SceneTitle />, <FloodRowStack /></div>;
