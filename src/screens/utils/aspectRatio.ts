// This function decides the best shape for the image
export const getSmartAspectRatio = (width?: number, height?: number): number => {
  // If dimensions are missing, default to Square (1:1)
  if (!width || !height) return 1; 

  const actualRatio = width / height;

  // 1. Portrait (4:5) -> Ratio 0.8
  if (actualRatio <= 0.9) {
    return 4 / 5;
  } 
  // 2. Landscape (1.91:1) -> Ratio 1.91
  else if (actualRatio > 1.4) {
    return 1.91; 
  } 
  // 3. Square (1:1) -> Ratio 1
  else {
    return 1;
  }
};