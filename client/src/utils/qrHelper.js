export function getQRCodeStylingOptions(qrData, textOverride) {
  const opts = qrData.options;
  
  // Resolve content data
  const dataText = textOverride || qrData.text || 'ProQR Studio';
  
  // Resolve dots options
  const dotsOptions = {
    type: opts.dotsOptions?.type || 'rounded',
  };
  
  const grad = opts.dotsOptions?.gradient;
  if (grad && grad.type !== 'none') {
    dotsOptions.gradient = {
      type: grad.type,
      rotation: (parseFloat(grad.rotation || 0) * Math.PI) / 180,
      colorStops: [
        { offset: 0, color: grad.color1 || '#6366f1' },
        { offset: 1, color: grad.color2 || '#ec4899' }
      ]
    };
  } else {
    dotsOptions.color = opts.dotsOptions?.color || '#6366f1';
  }
  
  // Resolve logo image
  let image = opts.logo?.url || '';
  
  return {
    width: opts.width || 350,
    height: opts.width || 350,
    data: dataText,
    margin: opts.margin ?? 4,
    qrOptions: {
      typeNumber: 0,
      mode: 'Byte',
      errorCorrectionLevel: opts.errorCorrectionLevel || 'Q'
    },
    dotsOptions,
    backgroundOptions: {
      color: opts.backgroundOptions?.color || '#ffffff',
    },
    cornersSquareOptions: {
      color: opts.cornersSquareOptions?.color || '#6366f1',
      type: opts.cornersSquareOptions?.type || 'extra-rounded',
    },
    cornersDotOptions: {
      color: opts.cornersDotOptions?.color || '#6366f1',
      type: opts.cornersDotOptions?.type || 'dot',
    },
    image: image || undefined,
    imageOptions: {
      hideBackgroundDots: opts.logo?.hideBackgroundDots ?? true,
      imageSize: opts.logo?.size ?? 0.3,
      margin: opts.logo?.margin ?? 5,
      crossOrigin: 'anonymous'
    }
  };
}
