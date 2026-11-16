import type { Area } from 'react-easy-crop';

const loadImage = (src: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('تعذر فتح الصورة للقص.'));
    image.src = src;
  });

export async function getCroppedImageFile(
  imageSrc: string,
  crop: Area,
  fileName = 'post-image.jpg'
): Promise<File> {
  const image = await loadImage(imageSrc);
  const canvas = document.createElement('canvas');
  canvas.width = crop.width;
  canvas.height = crop.height;

  const context = canvas.getContext('2d');
  if (!context) throw new Error('تعذر تجهيز الصورة للقص.');

  context.drawImage(
    image,
    crop.x,
    crop.y,
    crop.width,
    crop.height,
    0,
    0,
    crop.width,
    crop.height
  );

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, 'image/jpeg', 0.9)
  );
  if (!blob) throw new Error('تعذر إنشاء الصورة المقصوصة.');

  return new File([blob], fileName.replace(/\.[^/.]+$/, '') + '.jpg', {
    type: 'image/jpeg',
  });
}
