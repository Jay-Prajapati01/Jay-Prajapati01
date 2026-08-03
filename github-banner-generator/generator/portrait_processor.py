from PIL import Image, ImageOps, ImageFilter


class PortraitProcessor:
    def __init__(self, path: str):
        self.path = path

    def process(self, output_path: str) -> None:
        image = Image.open(self.path).convert('RGBA')
        image = image.crop((0, 0, image.width, int(image.height * 0.88)))
        image = ImageOps.autocontrast(image, cutoff=1)
        image = image.filter(ImageFilter.UnsharpMask(radius=2, percent=150, threshold=3))
        image.save(output_path, format='PNG')
