// case02 file-per-scene entry with SCENE_COMPONENTS registry
import React from "react";
import { Scene01 } from "./scenes/S01";
import { Scene02 } from "./scenes/S02";
import { Scene03 } from "./scenes/S03";
import { Scene04 } from "./scenes/S04";
import { Scene05 } from "./scenes/S05";
import { Scene06 } from "./scenes/S06";
import { Scene07 } from "./scenes/S07";
import { Scene08 } from "./scenes/S08";
import { Scene09 } from "./scenes/S09";
import { Scene10 } from "./scenes/S10";

const SCENE_COMPONENTS: Record<string, React.FC> = {
  "scene-1": Scene01,
  "scene-2": Scene02,
  "scene-3": Scene03,
  "scene-4": Scene04,
  "scene-5": Scene05,
  "scene-6": Scene06,
  "scene-7": Scene07,
  "scene-8": Scene08,
  "scene-9": Scene09,
  "scene-10": Scene10,
};
