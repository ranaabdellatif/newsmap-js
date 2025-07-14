import { ucfirst, urlize } from '../util';

const topicMap = {
  CYBERSECURITY: 'CAAqIQgKIhtDQkFTRGdvSUwyMHZNREl5ZUY4U0FtVnVLQUFQAQ',
  SECURITY: 'CAAqIQgKIhtDQkFTRGdvSUwyMHZNR0puTW5BU0FtVnVLQUFQAQ',
  TECHNOLOGY: 'CAAqJggKIiBDQkFTRWdvSUwyMHZNRGRqTVhZU0FtVnVHZ0pWVXlnQVAB',
};

const searchMap = {
  HACKING: 'hacking',
  "SOUTHERN COMPANY": 'southern+company',
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
        url = `/api/rss/topics/${topicMap[category]}?hl=en-US&gl=US&ceid=US:en`;
    } else if (searchMap[category]) {
        const encodedQuery = encodeURIComponent(searchMap[category]);
        url = `/api/rss/search?q=${encodedQuery}&hl=en-US&gl=US&ceid=US:en`;
    } else {
        throw new Error(`Unknown category: ${category}`);
    }



  return xmlFetch(url).then((data) => {
    console.log('Fetched XML:', data);
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

      let sources;
      const descEl = itemEl.getElementsByTagName("description")[0];

      if (descEl) {
        const desc = decodeHtml(descEl.textContent || descEl.innerHTML);
        const descDoc = (new DOMParser()).parseFromString(desc, "text/html");

        sources = Array.from(descDoc.getElementsByTagName("li"))
          .map(liEl => {
            const nameEl = liEl.getElementsByTagName("font")[0];
            const name = nameEl ? nameEl.textContent || nameEl.innerText : "";

            const id = urlize(name);

            const aEl = liEl.getElementsByTagName("a")[0];
            let title = aEl ? aEl.textContent || aEl.innerText : "";
            const url = aEl ? aEl.attributes.getNamedItem("href")?.textContent : "";

            const sourceTail = ` - ${name}`;
            if (title.endsWith(sourceTail)) {
              title = title.substring(0, title.length - sourceTail.length);
            }

            return {
              id,
              name,
              title,
              url,
            };
          }).filter(s => s.name);
      }

      if (!sources || sources.length === 0) {
        sources = [{
          id: urlize(sourceName),
          name: sourceName,
          title,
          url,
        }];
      }

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
    console.log('Parsed items:', items);

    return {
      title,
      category,
      articles: items,
    };
  });
}

function xmlFetch(url) {
  if (typeof DOMParser !== "undefined") {
    const headers = new Headers({ "Accept-Language": "" });
    return fetch(url, { headers })
      .then(r => r.text())
      .then(t => (new DOMParser()).parseFromString(t, "text/xml"));
  }

    //  * Does not handle redirect gracefully
    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();

        xhr.open("GET", url, true);

        xhr.responseType = "document";

        xhr.onreadystatechange = () => {
            if (xhr.readyState === xhr.DONE) {
                if (xhr.status === 200) {
                    resolve(xhr.responseXML);
                } else if (xhr.status === 0) {
                    reject("CORS Error");
                } else {
                    reject(xhr.statusText);
                }
            }
        }

        xhr.onerror = reject;

        xhr.send(null);
    });
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