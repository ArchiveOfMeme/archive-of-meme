/**
 * Utilidades para generar y parsear slugs de memes
 * Formato: nombre-en-kebab-case-ID (ej: wen-arch-12)
 */

/**
 * Genera un slug SEO-friendly a partir del nombre y ID del meme
 * @param {string} name - Nombre del meme
 * @param {string|number} id - ID del meme
 * @returns {string} Slug en formato "nombre-kebab-id"
 */
export function generateMemeSlug(name, id) {
  if (!name || !id) return String(id || '');

  const kebabName = name
    .toLowerCase()
    .trim()
    // Reemplazar caracteres especiales y espacios por guiones
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    // Eliminar guiones múltiples
    .replace(/-+/g, '-')
    // Eliminar guiones al inicio y final
    .replace(/^-|-$/g, '');

  // Si el nombre quedó vacío, usar solo el ID
  if (!kebabName) return String(id);

  return `${kebabName}-${id}`;
}

/**
 * Extrae el ID del meme desde un slug
 * @param {string} slug - Slug en formato "nombre-kebab-id" o solo "id"
 * @returns {string} ID del meme
 */
export function getMemeIdFromSlug(slug) {
  if (!slug) return '';

  // Si es solo un número, retornarlo directamente
  if (/^\d+$/.test(slug)) return slug;

  // El ID es el último segmento después del último guión
  const parts = slug.split('-');
  const lastPart = parts[parts.length - 1];

  // Verificar que el último segmento sea un número
  if (/^\d+$/.test(lastPart)) {
    return lastPart;
  }

  // Si no hay ID numérico al final, retornar el slug completo
  // (por si acaso alguien usa la URL antigua)
  return slug;
}
