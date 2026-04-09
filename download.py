import urllib.request
import os

print("Downloading the Kokoro Brain (kokoro-v1.0.onnx)... This is ~300MB.")
urllib.request.urlretrieve(
    "https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/kokoro-v1.0.onnx", 
    "kokoro-v1.0.onnx"
)

print("Downloading the Voices (voices.bin)... This is ~100MB.")
urllib.request.urlretrieve(
    "https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/voices-v1.0.bin", 
    "voices.bin"
)

print("✅ Done! Look in your VS Code sidebar. You should now see both files.")
