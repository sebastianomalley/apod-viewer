// main.js

// Import necessary functions and state variables from other modules.
import { currentDate, normalizeDate, getLikedImages, setCurrentDate, LATEST_APOD_DATE } from './storage.js?v=5';
import { updateLikedImagesList } from './eventHandlers.js?v=5'; // Move the UI update logic there.
import { fetchAndDisplayAPOD } from './api.js?v=5';

/**
 * Initializes the application once the window has fully loaded.
 */
window.onload = async () => {
  // Normalize today's date to ensure consistency in date formatting.
  const today = normalizeDate(new Date(Math.min(Date.now(), LATEST_APOD_DATE.getTime())));
  
  // Check if the currentDate is set to a future date.
  if (currentDate.getTime() > today.getTime()) {
    setCurrentDate(today); // Reset currentDate to today if it's in the future.
  }

  // Fetch and display the Astronomy Picture of the Day (APOD) for the current date.
  let success = await fetchAndDisplayAPOD(currentDate);

  // Some days are interactive pages rather than pictures; step back to the
  // closest day that has one instead of greeting people with an error.
  for (let i = 0; !success && i < 14; i++) {
    const prev = normalizeDate(new Date(currentDate));
    prev.setDate(prev.getDate() - 1);
    setCurrentDate(prev);
    success = await fetchAndDisplayAPOD(prev);
  }
  
  // If fetching the APOD was unsuccessful, alert the user.
  if (!success) {
    alert("Today's content is not available yet. Try exploring earlier dates.");
  }

  // Update the list of liked images in the UI.
  updateLikedImagesList();
};
