import {
  DARK_LUMINANCE_THRESHOLD as DLT,
  IMAGE_SAMPLE_SIZE as ISZ,
  PHOTO_VARIANCE_THRESHOLD as PVT
} from '../shared/constants';

type IC = 'dark' | 'photo' | 'ui-light' | 'unknown';

export async function classifyImages(): Promise<void> {
  const imgs = Array.from(document.querySelectorAll(
    'img:not([data-dusk-safe]):not([data-dusk-skip])'
  )) as HTMLImageElement[];

  for (let i = 0; i < imgs.length; i += 10) {
    await Promise.allSettled(imgs.slice(i, i + 10).map(classify));
    await new Promise(r => setTimeout(r, 0)); // yield between batches
  }
}

async function classify(img: HTMLImageElement): Promise<void> {
  if (img.naturalWidth < 8 || img.naturalHeight < 8) {
    img.dataset.duskSkip = '1'; return;
  }
  if (!img.complete) await new Promise(r => { img.onload = r; });
  try {
    const c = sample(img);
    if (c === 'dark' || c === 'photo') img.dataset.duskSafe = '1';
  } catch {
    img.dataset.duskSafe = '1'; // cross-origin: mark safe, don't invert
  }
}

function sample(img: HTMLImageElement): IC {
  const c = document.createElement('canvas');
  c.width = c.height = ISZ;
  const ctx = c.getContext('2d');
  if (!ctx) return 'unknown';
  ctx.drawImage(img, 0, 0, ISZ, ISZ);
  const { data } = ctx.getImageData(0, 0, ISZ, ISZ);
  const lums: number[] = [];
  for (let i = 0; i < data.length; i += 4)
    lums.push(0.2126 * data[i] + 0.7152 * data[i+1] + 0.0722 * data[i+2]);
  const avg = lums.reduce((a,b) => a+b, 0) / lums.length;
  const std = Math.sqrt(lums.reduce((a,l) => a + (l-avg)**2, 0) / lums.length);
  if (avg < DLT) return 'dark';   // already dark — preserve
  if (std > PVT) return 'photo';  // real photo — preserve
  return 'ui-light';
}
