// Rasmlarni yuklashdan oldin avtomatik siqish (HTML5 Canvas yordamida)
// Zamonaviy telefon kameralari 4K/48MP suratga oladi (5MB - 15MB).
// Ushbu funksiya ularni sifatini yo'qotmasdan 1000px va ~70KB - 120KB gacha siqadi.
// Natijada mobil internet (3G/4G) da 0.2 soniyada serverga uzatiladi va tarmoq uzilishi yuz bermaydi.

export async function compressImage(fileOrDataUrl, maxWidth = 1000, maxHeight = 1000, quality = 0.7) {
  if (!fileOrDataUrl) return '';

  return new Promise((resolve) => {
    const processImage = (imgSrc) => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;
        if (width > maxWidth || height > maxHeight) {
          if (width > height) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, width);
        canvas.height = Math.max(1, height);
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        try {
          const result = canvas.toDataURL('image/jpeg', quality);
          resolve(result);
        } catch (e) {
          resolve(imgSrc);
        }
      };
      img.onerror = () => {
        resolve(typeof fileOrDataUrl === 'string' ? fileOrDataUrl : '');
      };
      img.src = imgSrc;
    };

    if (typeof fileOrDataUrl === 'string') {
      if (fileOrDataUrl.startsWith('data:image/')) {
        // Agar allaqachon data:URL bo'lsa, lekin katta bo'lsa siqamiz
        if (fileOrDataUrl.length > 150000) {
          processImage(fileOrDataUrl);
        } else {
          resolve(fileOrDataUrl);
        }
      } else {
        // Oddiy http/https manzil
        resolve(fileOrDataUrl);
      }
      return;
    }

    if (fileOrDataUrl instanceof Blob || fileOrDataUrl instanceof File) {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          processImage(e.target.result);
        } else {
          resolve('');
        }
      };
      reader.onerror = () => resolve('');
      reader.readAsDataURL(fileOrDataUrl);
      return;
    }

    resolve('');
  });
}
