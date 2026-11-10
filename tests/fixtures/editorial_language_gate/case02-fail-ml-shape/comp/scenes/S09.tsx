// case02 scene shell 09 — references its manifest-claimed tokens so
// single-token name binding resolves to the real declaration bodies
import React from "react";
import { BadgeRibbon, VerdictCardStack } from "../lib/SceneShell";

export const Scene09: React.FC = () => <div><BadgeRibbon />, <VerdictCardStack /></div>;
