export async function fetchPapers(query, limit = 3) {
  const url =
    "https://api.openalex.org/works?search=" +
    encodeURIComponent(query) +
    "&per_page=" +
    limit +
    "&mailto=courserocket@example.com";

  const res = await fetch(url);
  if (!res.ok) return [];

  const data = await res.json();
  if (!data.results || data.results.length === 0) return [];

  return data.results.map((w) => ({
    title: w.display_name || "Untitled",
    authors: (w.authorships || [])
      .slice(0, 2)
      .map((a) => a.author?.display_name || "")
      .filter(Boolean)
      .join(", "),
    year: w.publication_year || null,
    abstract: w.abstract_inverted_index
      ? reconstructAbstract(w.abstract_inverted_index).slice(0, 200) + "..."
      : "",
    url: w.doi ? "https://doi.org/" + w.doi.replace("https://doi.org/", "") : w.id || "#",
  }));
}

function reconstructAbstract(invertedIndex) {
  const words = [];
  for (const [word, positions] of Object.entries(invertedIndex)) {
    for (const pos of positions) {
      words[pos] = word;
    }
  }
  return words.join(" ");
}
