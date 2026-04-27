export async function fetchYouTubeVideos(query, maxResults = 5) {
  const key = import.meta.env.VITE_YOUTUBE_API_KEY;

  const url = "https://www.googleapis.com/youtube/v3/search"
    + "?part=snippet"
    + "&type=video"
    + "&maxResults=" + maxResults
    + "&videoDuration=medium"
    + "&relevanceLanguage=en"
    + "&q=" + encodeURIComponent(query)
    + "&key=" + key;

  const res = await fetch(url);
  const data = await res.json();

  if (!data.items || data.items.length === 0) return [];

  return data.items.map((item) => ({
    videoId: item.id.videoId,
    title: item.snippet.title,
    channel: item.snippet.channelTitle,
    thumbnail: item.snippet.thumbnails.medium.url,
    description: item.snippet.description
      ? item.snippet.description.slice(0, 120) + "..."
      : "",
  }));
}