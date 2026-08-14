/** Demo PNG (32×32 CIFAR-style airplane silhouette) for vision inference UI. */
const imageBase64 =
  'iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAIAAAD8GO2jAAAATElEQVR42mOImnaHpohh1IJRC0YtGLVgxFmwZec+IFq1fgsygghiRZgqL126DkEkWHDixFlcaLBaQAkiYMFoMh21YNSCUQtGLSATAQAh4FlGCqd+JQAAAABJRU5ErkJggg==';

const cifarDemoSample = {
  mime: 'image/png',
  width: 32,
  height: 32,
  classHint: 'airplane',
  cifarClassIndex: 0,
  imageBase64,
  dataUrl: `data:image/png;base64,${imageBase64}`,
};

export default cifarDemoSample;
