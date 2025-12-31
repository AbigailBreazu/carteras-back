export function formatImageUrl(imagenPath: string): string {
  // Si ya es una URL completa, devolverla tal cual
  if (imagenPath.startsWith('http://') || imagenPath.startsWith('https://')) {
    return imagenPath;
  }

  // Si es una ruta relativa, agregar la URL base
  const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
  
  // Asegurarse de que la ruta empiece con /
  const path = imagenPath.startsWith('/') ? imagenPath : `/${imagenPath}`;
  
  return `${baseUrl}${path}`;
}

export function formatImagenesArray(imagenes: string[]): string[] {
  if (!imagenes || !Array.isArray(imagenes)) {
    return [];
  }
  
  // Filtrar valores undefined, null o vacíos antes de formatear
  return imagenes
    .filter(img => img && img !== 'undefined' && img.trim() !== '')
    .map(img => formatImageUrl(img));
}
