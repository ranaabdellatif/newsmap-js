import { ucfirst, urlize } from '../util';

const topicMap = {
  CYBERSECURITY: 'CAAqIQgKIhtDQkFTRGdvSUwyMHZNREl5ZUY4U0FtVnVLQUFQAQ',
  SECURITY: 'CAAqIQgKIhtDQkFTRGdvSUwyMHZNR0puTW5BU0FtVnVLQUFQAQ',
  TECHNOLOGY: 'CAAqJggKIiBDQkFTRWdvSUwyMHZNRGRqTVhZU0FtVnVHZ0pWVXlnQVAB',
  "SOUTHERN COMPANY": 'CCAAqIggKIhxDQkFTRHdvSkwyMHZNREZqTkRocUVnSmxiaWdBUAE',
};

const searchMap = {
  HACKING: 'hacking',
  "CYBER ATTACK": 'cyber+attack',
  "CYBER THREAT": 'cyber+threat',
};

export const categories = [
  ...Object.keys(topicMap),
  ...Object.keys(searchMap),
];

export async function getNews({ category }) {
    let url;

    if (topicMap[category]) {
    url = `https://news.google.com/rss/topics/${topicMap[category]}?hl=en-US&gl=US&ceid=US:en`;
    } else if (searchMap[category]) {
    const encodedQuery = encodeURIComponent(searchMap[category]);
    url = `https://news.google.com/rss/search?q=${encodedQuery}&hl=en-US&gl=US&ceid=US:en`;
    } else {
    throw new Error(`Unknown category: ${category}`);
    }



  return xmlFetch(url).then((data) => {
    let title = ucfirst(category);
    const titleEl = data.getElementsByTagName("title")[0];
    if (titleEl && titleEl.textContent) {
    title = titleEl.textContent.split(" - ")[0];
    }

    const items = Array.from(data.getElementsByTagName("item")).map(itemEl => {
      const titleEl = itemEl.getElementsByTagName("title")[0];
      let title = titleEl ? decodeHtml(titleEl.textContent || titleEl.innerHTML) : "";

      const linkEl = itemEl.getElementsByTagName("link")[0];
      const url = linkEl ? linkEl.textContent || linkEl.innerHTML : "";

      const idEl = itemEl.getElementsByTagName("guid")[0];
      const id = idEl ? idEl.textContent || idEl.innerHTML : "";

      const sourceNameEl = itemEl.getElementsByTagName("source")[0];
      const sourceName = sourceNameEl ? sourceNameEl.textContent || sourceNameEl.innerHTML : "";

      const sourceTail = ` - ${sourceName}`;
      if (title.endsWith(sourceTail)) {
        title = title.substring(0, title.length - sourceTail.length);
      }

      const dateEl = itemEl.getElementsByTagName("pubDate")[0];
      const publishedAt = dateEl ? new Date(dateEl.textContent || dateEl.innerHTML).toISOString() : "";

      const imageEl = itemEl.getElementsByTagName("media:content")[0];
      let imageURL = imageEl ? imageEl.attributes.getNamedItem("url")?.textContent : "";

      return {
        id,
        title,
        url,
        publishedAt,
        sources: [{
          id: urlize(sourceName),
          name: sourceName,
          title,
          url,
        }],
        imageURL,
      };
    });

    return {
      title,
      category,
      articles: items,
    };
  });
}

function xmlFetch(url) {
  const headers = new Headers({ "Accept-Language": "" });
  return fetch(url, { headers })
    .then(r => r.text())
    .then(t => (new DOMParser()).parseFromString(t, "text/xml"));
}

function decodeHtml(str) {
  const map = {
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&#039;': "'"
  };
  return str.replace(/&amp;|&lt;|&gt;|&quot;|&#039;/g, m => map[m]);
}
