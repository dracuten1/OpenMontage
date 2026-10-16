from PIL import Image
im = Image.open("qc_hermes2/mouth_open_mid.png").convert("RGB")
c = im.crop((140, 440, 560, 1000)).resize((840, 1120), Image.Resampling.LANCZOS)
c.save("qc_hermes2/zoom_talk.png")
print("saved", c.size)
