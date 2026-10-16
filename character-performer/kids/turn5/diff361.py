#!/usr/bin/env python3
import numpy as np
from PIL import Image
R = "/Users/tuyennguyen/project/OpenMontage/character-performer/kids/turn5/probe"
a = np.asarray(Image.open(f"{R}/s0361.png").convert("RGB"), dtype=np.float32)
b = np.asarray(Image.open(f"{R}/mouth_f0361.png").convert("RGB"), dtype=np.float32)
print("mean|diff| remotion-still vs mp4-frame f0361:", round(float(np.abs(a - b).mean()), 3))
