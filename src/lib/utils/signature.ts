export async function trimSignatureDataUrl(dataUrl: string) {
  return new Promise<string>((resolve) => {
    const image = new window.Image();

    image.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = image.width;
      canvas.height = image.height;

      const context = canvas.getContext("2d", { willReadFrequently: true });

      if (!context) {
        resolve(dataUrl);
        return;
      }

      context.drawImage(image, 0, 0);
      const { data, width, height } = context.getImageData(0, 0, image.width, image.height);

      let minX = width;
      let minY = height;
      let maxX = -1;
      let maxY = -1;

      for (let y = 0; y < height; y += 1) {
        for (let x = 0; x < width; x += 1) {
          const offset = (y * width + x) * 4;
          const red = data[offset];
          const green = data[offset + 1];
          const blue = data[offset + 2];
          const alpha = data[offset + 3];
          const isInkPixel =
            alpha > 8 &&
            (red < 245 || green < 245 || blue < 245) &&
            Math.max(red, green, blue) - Math.min(red, green, blue) > 6;

          if (isInkPixel || (alpha > 8 && red < 210 && green < 210 && blue < 210)) {
            minX = Math.min(minX, x);
            minY = Math.min(minY, y);
            maxX = Math.max(maxX, x);
            maxY = Math.max(maxY, y);
          }
        }
      }

      if (maxX < minX || maxY < minY) {
        resolve(dataUrl);
        return;
      }

      const paddingX = 36;
      const paddingY = 28;
      const cropX = Math.max(0, minX - paddingX);
      const cropY = Math.max(0, minY - paddingY);
      const cropWidth = Math.min(width - cropX, maxX - minX + 1 + paddingX * 2);
      const cropHeight = Math.min(height - cropY, maxY - minY + 1 + paddingY * 2);

      const trimmedCanvas = document.createElement("canvas");
      trimmedCanvas.width = cropWidth;
      trimmedCanvas.height = cropHeight;

      const trimmedContext = trimmedCanvas.getContext("2d");

      if (!trimmedContext) {
        resolve(dataUrl);
        return;
      }

      trimmedContext.drawImage(
        canvas,
        cropX,
        cropY,
        cropWidth,
        cropHeight,
        0,
        0,
        cropWidth,
        cropHeight,
      );

      resolve(trimmedCanvas.toDataURL("image/png"));
    };

    image.onerror = () => resolve(dataUrl);
    image.src = dataUrl;
  });
}
