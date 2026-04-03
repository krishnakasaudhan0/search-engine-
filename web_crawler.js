const seed_url="https://en.wikipedia.org/wiki/Constitution_of_India";
const cheerio = require("cheerio");
const fs=require('fs').promises
const natural = require("natural");
const stopwords = [
  "i","me","my","myself","we","our","ours","ourselves","you","your","yours",
  "he","him","his","himself","she","her","hers","herself","it","its","itself",
  "they","them","their","theirs","themselves","what","which","who","whom",
  "this","that","these","those","am","is","are","was","were","be","been","being",
  "have","has","had","do","does","did","but","if","or","because","as","until",
  "while","of","at","by","for","with","about","against","between","into","through",
  "during","before","after","above","below","to","from","up","down","in","out",
  "on","off","over","under","again","further","then","once","here","there","when",
  "where","why","how","all","any","both","each","few","more","most","other","some",
  "such","no","nor","not","only","own","same","so","than","too","very","can","will",
  "just","don","should","now"
];
async function fetchWikipediaPage(url,id) {

  try {
    const content = [];

    const res = await fetch(url);
    const html = await res.text();
    const $ = cheerio.load(html);

    // Extract title
    const title = $("#firstHeading").text();

    // Extract main article content
    const contentDiv = $("#mw-content-text .mw-parser-output");
    let articleText = "";
    contentDiv.find("p").each((i, elem) => {
      const paragraph = $(elem).text().trim();
      if (paragraph.length > 0) articleText += paragraph + "\n\n";
    });

    // Extract links from main article
    const links = [];
    contentDiv.find("a").each((i, elem) => {
      const href = $(elem).attr("href");
      const text = $(elem).text().trim();
      if (href) links.push({ text, href });
    });

    // Tokenize + remove stopwords + stem
    const tokenizer = new natural.WordTokenizer();
    const tokens = tokenizer.tokenize(articleText)
      .filter(word => !stopwords.includes(word.toLowerCase()))
      .map(word => natural.PorterStemmer.stem(word));

    // Push data into content array
    const pageData = {id, title, content: articleText, links, tokens };
    return pageData;
   
  } catch (err) {
    console.error(`❌ Error fetching ${url}:`, err);
  }
}
async function web_crawler(seed_url){
  var queue=[];
var vis_link=new Set();
var maxpage=50;
  var id=0;
  queue.push(seed_url);
  vis_link.add(seed_url);
  while(maxpage>0 && queue.length>0){
    maxpage--;

    var relative_link=queue[0];
    if(!queue[0].startsWith('/http')){
      relative_link="https://en.wikipedia.org"+queue[0]

    }
    const pageData= await fetchWikipediaPage(relative_link,id++);
    if(pageData){
    await fs.writeFile(`doc${pageData.id}.txt`, pageData.content, 'utf8');
    var limit=10;
    for(var i =0; i<pageData.links.length;i++){
      limit--;
      if(limit<0){break}
     const link= pageData.links[i].href;
     
     if(link.startsWith('/wiki')&& !link.includes(':') &&!vis_link.has(link)){
      vis_link.add(link);
      queue.push(link)
     }
   }
  queue.shift();
    }
  }
}

(async () => {
  const cont = await web_crawler(seed_url);
  
})();

