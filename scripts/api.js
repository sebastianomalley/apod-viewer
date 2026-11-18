// api.js

// Import necessary functions and elements from other modules.
import { showNoImageState, showLoadingState, clearVideoContainer, apodImage, apodTitle, apodDate, apodDescription, currentMediaType } from './ui.js?v=3';
import { currentDate, normalizeDate, formatDate, LATEST_APOD_DATE } from './storage.js?v=3'; // Put date helpers in storage.js.



/**
 * Fetch and display Astronomy Picture of the Day (APOD) for a given date.
 *
 * @param {Date} utcdate - The date for which to fetch the APOD.
 * @param {boolean} isSearch - Indicates if the fetch is part of a search operation.
 * @returns {Promise<boolean>} - Returns true if the fetch and display are successful, otherwise false.
 */

export async function fetchNasaKey() {
  return 'YqggPbVWuluTgrNrJdcuO7bqsTJCNAZfPk2AHbgL';
}


// ---------------------------------------------------------------------------
// Local APOD archive (2007-01-01 to 2025-12-23), one JSON file per year in /data.
// NASA moved APOD to science.nasa.gov in 2026 and the API now hands back a NASA
// logo instead of the day's image, so the gallery reads from this archive first.
// ---------------------------------------------------------------------------
const archiveCache = {};
async function fromArchive(dateStr) {
  const year = dateStr.slice(0, 4);
  if (!(year in archiveCache)) {
    archiveCache[year] = fetch(`data/apod-${year}.json`).then(r => (r.ok ? r.json() : {})).catch(() => ({}));
  }
  const entry = (await archiveCache[year])[dateStr];
  if (!entry) return null;
  return { title: entry.t, explanation: entry.e, url: entry.u, hdurl: entry.h, media_type: entry.m, copyright: entry.c, date: dateStr };
}

// apod.nasa.gov image links can fail now; try the Internet Archive's copy, then a proxy.
export function imageSources(url) {
  const bare = url.replace(/^https?:\/\//, '');
  return [url, 'https://web.archive.org/web/2025id_/https://' + bare, 'https://images.weserv.nl/?w=1600&url=' + encodeURIComponent('ssl:' + bare)];
}

export async function fetchAndDisplayAPOD(utcdate, isSearch = false) {
  // Format the provided date to 'YYYY-MM-DD'.
  const formattedDate = utcdate.toISOString().split('T')[0];
  
  // Construct the APOD API URL with the formatted date and API key.
  const key = await fetchNasaKey();
  const APOD_URL = `https://api.nasa.gov/planetary/apod?api_key=${key}&date=${formattedDate}`;
  
  console.log("Fetching APOD data for date:", formattedDate);

  // Show the loading state in the UI.
  showLoadingState();

  try {
    // Use the local archive first; only ask NASA's API for dates outside it.
    let data = await fromArchive(formattedDate);
    if (!data) {
      const response = await fetch(APOD_URL);
      if (!response.ok) {
        throw new Error('Media not available for this date.');
      }
      data = await response.json();
    }

    // Skip NASA's post-migration placeholder entries.
    if (!data || data.title === 'NASA Science' || /nasa-logo|nasa_logo/i.test(data.url || '')) {
      throw new Error('Placeholder entry, no APOD for this date.');
    }

    console.log("Fetched APOD data for date:", formattedDate, data);

    // Clear any existing video containers in the UI.
    clearVideoContainer();
    
    // Hide the APOD image element, initially.
    apodImage.style.display = 'none';

    // Check the media type of the APOD.
    if (data.media_type === 'image') {
      // Set the current media type to image.
      currentMediaType.type = 'image';
      
      // Set the source and alt text for the APOD image. NASA's old apod.nasa.gov
      // image server stopped answering reliably after the 2026 move to
      // science.nasa.gov, so fall back to the Internet Archive, then an image proxy.
      const sources = imageSources(data.url);
      let attempt = 0;
      apodImage.onerror = () => {
        attempt++;
        if (attempt < sources.length) apodImage.src = sources[attempt];
      };
      apodImage.src = sources[0];
      apodImage.alt = data.title;
      
      // Display the image in the UI.
      apodImage.style.display = 'block';
    } else if (data.media_type === 'video') {
      // Set the current media type to video.
      currentMediaType.type = 'video';
      
      // Create and display the video container with the provided URL.
      createVideoContainer(data.url);
    } else {
      // Throw error if the media type is neither image nor video.
      throw new Error('No valid media for this date.');
    }

    // Update the APOD title, date, and description in the UI.
    apodTitle.textContent = data.title;
    apodDate.textContent = formattedDate;
    apodDescription.textContent = data.explanation;

    return true; // Indicate a successful fetch and display.
  } catch (error) {
    // Log any errors encountered during the fetch.
    console.error("Error fetching APOD data:", error);
    
    // If the fetch was part of a search, show the "No Image" state.
    if (isSearch) showNoImageState(utcdate);
    
    return false; // Indicate a failed fetch or display.
  }
}

/**
 * Creates a video container with an embedded iframe for displaying videos.
 *
 * @param {string} url - The URL of the video to embed.
 */
function createVideoContainer(url) {
  // Create a div element to contain the video.
  const videoContainer = document.createElement('div');
  videoContainer.id = 'video-container';
  videoContainer.className = 'video-container';

  // Create an iframe element for the video.
  const videoElement = document.createElement('iframe');
  videoElement.src = url;
  videoElement.width = '100%'; // Set the iframe width to 100% of its container.
  videoElement.height = '100%'; // Set the iframe height to 100% of its container.
  videoElement.style.minWidth = '800px';   // Set the minimum width to prevent collapsing.
  videoElement.style.minHeight = '400px';  // Set the minimum height to prevent collapsing.
  videoElement.style.border = 'none';       // Remove the default border from the iframe.

  // Append the iframe to the video container.
  videoContainer.appendChild(videoElement);
  
  // Insert the video container into the DOM before the APOD image element.
  apodImage.parentNode.insertBefore(videoContainer, apodImage);
}

/**
 * Changes the current date for which the APOD is displayed and fetches the new APOD.
 *
 * @param {number} days - The number of days to change the current date by.
 * @param {Date} currentDateState - The current date state.
 * @param {Function} setCurrentDate - Function to update the current date state.
 * @param {Function} fetchAndDisplayFunc - Function to fetch and display the APOD.
 */
export async function changeDate(days, currentDateState, setCurrentDate, fetchAndDisplayFunc) {
  // Normalize today's date.
  const today = normalizeDate(new Date(Math.min(Date.now(), LATEST_APOD_DATE.getTime())));
  
  // Normalize the new date based on the current date state.
  const newDate = normalizeDate(new Date(currentDateState));
  newDate.setDate(newDate.getDate() + days);

  // Stop at the start of the local archive so we never loop through empty days.
  if (days < 0 && newDate.getTime() < new Date(2007, 0, 1).getTime()) {
    alert("That's the start of the archive. Try heading forward!");
    return;
  }

  // Prevent the user from selecting a future date.
  if (days > 0 && newDate.getTime() > today.getTime()) {
    alert("Our telescopes can't look into the future!!  Try looking back!");
    return;
  }

  // Fetch and display the APOD for the new date.
  const success = await fetchAndDisplayFunc(newDate);
  
  // If the fetch is successful, update the current date state.
  if (success) {
    setCurrentDate(newDate);
  } else {
    // If the fetch fails, recursively attempt to change the date.
    changeDate(days, newDate, setCurrentDate, fetchAndDisplayFunc);
  }
}
