// storage.js

// Export the current date, initialized to the current date and time.
// NASA moved APOD to science.nasa.gov in mid-2026, and the API now answers recent
// dates with a generic "NASA Science" placeholder. Open on a known great image and
// treat LATEST_APOD_DATE as the newest day worth browsing.
export const LATEST_APOD_DATE = new Date(2026, 5, 30, 12); // 2026-06-30
export let currentDate = new Date(2024, 11, 17, 12);  // 2024-12-17, Heart Nebula

// Retrieve liked images from localStorage or initialize as an empty array if not present.
let likedImages = JSON.parse(localStorage.getItem('likedImages')) || [];

/**
 * Saves the current list of liked images to localStorage.
 */
export function saveLikedImages() {
  localStorage.setItem('likedImages', JSON.stringify(likedImages));
}

/**
 * Retrieves the list of liked images.
 *
 * @returns {Array} - The array of liked images.
 */
export function getLikedImages() {
  return likedImages;
}

/**
 * Sets the list of liked images and saves it to localStorage.
 *
 * @param {Array} images - The array of images to set as liked.
 */
export function setLikedImages(images) {
  likedImages = images;
  saveLikedImages();
}

/* -----------------------------------------------------------------------------
   Date Helper Functions
----------------------------------------------------------------------------- */

/**
 * Formats a Date object into a string with the format 'YYYY-MM-DD'.
 *
 * @param {Date} date - The date to format.
 * @returns {string} - The formatted date string.
 */
export function formatDate(date) {
  return date.toISOString().split('T')[0];
}

/**
 * Normalizes a Date object by setting its time to midnight (00:00:00).
 *
 * @param {Date} date - The date to normalize.
 * @returns {Date} - The normalized date object.
 */
export function normalizeDate(date) {
  const normalized = new Date(date);
  normalized.setHours(0, 0, 0, 0);
  return normalized;
}

/* -----------------------------------------------------------------------------
   Background Management Functions
----------------------------------------------------------------------------- */

/**
 * Saves a background image associated with a specific level to localStorage.
 *
 * @param {string} level - The level identifier (e.g., 'level1').
 * @param {string} date - The date string associated with the background image.
 */
export function saveBackground(level, date) {
  const backgrounds = JSON.parse(localStorage.getItem('backgrounds')) || {};
  backgrounds[level] = date;
  localStorage.setItem('backgrounds', JSON.stringify(backgrounds));
}

/**
 * Retrieves all saved background images from localStorage.
 *
 * @returns {Object} - An object mapping levels to their respective background dates.
 */
export function getBackgrounds() {
  return JSON.parse(localStorage.getItem('backgrounds')) || {};
}

/**
 * Sets the current date state.
 *
 * @param {Date} date - The date to set as the current date.
 */
export function setCurrentDate(date) {
  currentDate = date;
}
