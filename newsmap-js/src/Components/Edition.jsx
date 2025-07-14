import React, { useEffect, useState } from 'react';
import GridMap from './GridMap.jsx';
import TreeMap from './TreeMap.jsx';
import TreeMapMixed from './TreeMapMixed.jsx';
import Article from './Article.jsx';

import { useCategoryItems } from './useCategoryItems.js';


/**
 * @param {object} props
 * @param {string[]} props.categories
 * @param {"tree"|"grid"|"tree_mixed"} props.mode
 * @param {"time"|"sourceCount"|"sources"|"position"} props.weightingMode
 * @param {{[category: string]: string}} props.colours
 * @param {boolean} props.showImages
 * @param {boolean} props.showGradient
 * @param {number} props.itemsPerCategory
 * @param {number} props.refreshTime
 * @param {boolean} props.newTab
 * @param {(article: Article, e: import('react').MouseEvent) => void} props.onArticleClick
 */
function Edition({
  categories,
  mode,
  weightingMode,
  showImages,
  showGradient,
  colours,
  itemsPerCategory,
  newTab,
  refreshTime,
  onArticleClick,
}) {
  // ✅ Assign the result to a variable
  const items = useCategoryItems(
    categories,
    refreshTime,
    itemsPerCategory,
    weightingMode
  );

  if (!items || items.length === 0) {
    return null;
  }

  useFastVisualRefresh(weightingMode === "time", 60 * 1000);

  const Map = {
    tree: TreeMap,
    grid: GridMap,
    tree_mixed: TreeMapMixed,
  }[mode] || TreeMap;

  return (
    <Map
      items={items}
      itemRender={(props) => (
        <Article
          showImage={showImages}
          showGradient={showGradient}
          colours={colours}
          newTab={newTab}
          onClick={(e) => onArticleClick(props.item, e)}
          {...props}
        />
      )}
    />
  );
}

export default Edition;

/**
 * Forces re-render every `timeout` milliseconds
 * @param {boolean} enable
 */
function useFastVisualRefresh(enable, timeout = 10 * 1000) {
  const [, setCounter] = useState(0);

  useEffect(() => {
    if (enable) {
      const interval = setInterval(() => {
        setCounter(counter => counter + 1);
      }, timeout);
      return () => clearInterval(interval);
    }
  }, [enable, timeout]);
}
