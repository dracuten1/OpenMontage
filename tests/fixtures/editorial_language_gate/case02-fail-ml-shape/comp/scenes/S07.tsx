// case02 scene shell 07 — references its manifest-claimed tokens so
// single-token name binding resolves to the real declaration bodies
import React from "react";
import { SceneTitle, DetailRowStack } from "../lib/SceneShell";

export const Scene07: React.FC = () => <div><SceneTitle />, <DetailRowStack /></div>;
