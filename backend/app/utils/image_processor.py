"""
Image Processing Utility using Pillow
"""
from PIL import Image
import io


def resize_image(image_bytes: bytes, max_width: int = 1200, max_height: int = 1200) -> bytes:
    """Resizes an image to fit within the given max dimensions while preserving aspect ratio."""
    img = Image.open(io.BytesIO(image_bytes))

    # Convert RGBA to RGB if needed (e.g., PNGs with transparency)
    if img.mode in ("RGBA", "P"):
        img = img.convert("RGB")

    img.thumbnail((max_width, max_height), Image.LANCZOS)

    output = io.BytesIO()
    img.save(output, format="JPEG", quality=85)
    output.seek(0)
    return output.read()
