import { useEffect, useState } from 'react';
import { getNews } from '../sources/GoogleNewsRSS';

export function useCategoryItems(categories, refreshTime, itemsPerCategory, weightingMode) {
  const [items, setItems] = useState([]);

  useEffect(() => {
    let cancelled = false;

    async function fetchAll() {
      const allItems = [];

      for (const category of categories) {
        try {
          const res = await getNews({ category });
          const weighted = res.articles.map(a => ({
            ...a,
            category,
            weight: getWeight(a, weightingMode),
          }));
          allItems.push({
            id: category,
            key: category,
            name: category,
            articles: weighted.slice(0, itemsPerCategory),
            weight: weighted.reduce((a, b) => a + b.weight, 0),
          });
        } catch (err) {
          console.error(`Failed to fetch category ${category}:`, err);
        }
      }

      if (!cancelled) {
        setItems(allItems);
      }
    }

    fetchAll();

    const interval = setInterval(fetchAll, refreshTime);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [categories, refreshTime, itemsPerCategory, weightingMode]);

  return items;
}

function getWeight(article, mode) {
  switch (mode) {
    case "time":
      return new Date(article.publishedAt).getTime();
    case "sources":
      return article.sources.length;
    case "position":
    default:
      return 1;
  }
}
