const query ="Truth Alone Triumphs) is inscribed below the abacus in Devanagari. The use of the emblem is governed by the State Emblem of India (Prohibition of Improper Use) Act, 2005 and the State Emblem of India (Regulation of Use) Rules, 2007.The State Emblem of India is used by the Government of India and its agencies, as well as by all state governments and union territory administrations in India. It is also used by private citizens in India on letterheads, business cards and other personal uses, but with certain restrictions. The emblem is protected under the Indian Emblem Act and its use without proper authority is punishable under the law.Following the end of British rule on 15-August-1947, the newly independent Dominion of India adopted an official state emblem on 30-December-1947. The emblem consisted of a representation of the Lion Capital of Ashoka at Sarnath enclosed within a rectangular frame.[1] The task of beautifying the original manuscript of the Constitution of India was given to Nandalal Bose (then the Principal of Kala Bhavan, Santiniketan) by the Indian National Congress.[2][3] Bose set out to complete this task with the help of his students, one of whom was Dinanath Bhargava, then 21 years old.[4] Bose was keen to include the Lion Capital of Ashoka into the opening pages of the constitution. Wanting the lions to be depicted realistically, he chose Bhargava who studied the behaviour of the lions at the Kolkata Zoo.[5]On 26-January-1950, a representation of the Lion";

const fs = require("fs");
const path = require("path");
const natural = require("natural");
const tokenizer = new natural.WordTokenizer();
const stopwords = [
  "i",
  "me",
  "my",
  "myself",
  "we",
  "our",
  "ours",
  "ourselves",
  "you",
  "your",
  "yours",
  "he",
  "him",
  "his",
  "himself",
  "she",
  "her",
  "hers",
  "herself",
  "it",
  "its",
  "itself",
  "they",
  "them",
  "their",
  "theirs",
  "themselves",
  "what",
  "which",
  "who",
  "whom",
  "this",
  "that",
  "these",
  "those",
  "am",
  "is",
  "are",
  "was",
  "were",
  "be",
  "been",
  "being",
  "have",
  "has",
  "had",
  "do",
  "does",
  "did",
  "but",
  "if",
  "or",
  "because",
  "as",
  "until",
  "while",
  "of",
  "at",
  "by",
  "for",
  "with",
  "about",
  "against",
  "between",
  "into",
  "through",
  "during",
  "before",
  "after",
  "above",
  "below",
  "to",
  "from",
  "up",
  "down",
  "in",
  "out",
  "on",
  "off",
  "over",
  "under",
  "again",
  "further",
  "then",
  "once",
  "here",
  "there",
  "when",
  "where",
  "why",
  "how",
  "all",
  "any",
  "both",
  "each",
  "few",
  "more",
  "most",
  "other",
  "some",
  "such",
  "no",
  "nor",
  "not",
  "only",
  "own",
  "same",
  "so",
  "than",
  "too",
  "very",
  "can",
  "will",
  "just",
  "don",
  "should",
  "now",
];

const docLength = {};

const vocabulary = new Set();

function getfreq(filepath, docId) {

  const data = fs.readFileSync(filepath, "utf8");

  const token = tokenizer
    .tokenize(data)
    .filter((word) => {
      if (!stopwords.includes(word)) {
        vocabulary.add(natural.PorterStemmer.stem(word));
      }
      return !stopwords.includes(word);
    })
    .map((finalword) => {
      return natural.PorterStemmer.stem(finalword);
    });

  docLength[docId] = token.length;

  const map = new Map();

  for (var i = 0; i < token.length; i++) {

    if (map.has(token[i])) {
      map.set(token[i], map.get(token[i]) + 1);
    } else {
      map.set(token[i], 1);
    }

  }

  return map;
}


const document = [];

for (var i = 0; i < 32; i++) {

  const filePath = path.join(__dirname, `./data/doc${i}.txt`);
  document.push({ [`doc${i}`]: getfreq(filePath, `doc${i}`) });

}


const documentfreq = new Map();

for (var i = 0; i < document.length; i++) {

  for (let [word, freq] of document[i][`doc${i}`]) {

    if (documentfreq.has(word)) {
      documentfreq.set(word, documentfreq.get(word) + 1);
    } else {
      documentfreq.set(word, 1);
    }

  }

}


/* FIX 1: correct average document length */

let totalLength = 0;

for (let docId in docLength) {
  totalLength += docLength[docId];
}

const avgDocLength = totalLength / document.length;


const totalDocs = document.length;
const docVectors = [];

const k1 = 1.5;
const b = 0.75;


/* FIX 2: define docId */

for (let i = 0; i < document.length; i++) {

  const docId = `doc${i}`;
  const map = document[i][docId];

  const vector = new Map();

  for (let [word, tf] of map) {

    const df = documentfreq.get(word);
    const N = totalDocs;

    const idf = Math.log((N - df + 0.5) / (df + 0.5) + 1);

    const numerator = tf * (k1 + 1);

    const denominator =
      tf + k1 * (1 - b + b * (docLength[docId] / avgDocLength));

    const score = idf * (numerator / denominator);

    vector.set(word, score);

  }

  docVectors.push({ [docId]: vector });

}



/* INVERTED INDEX */

const inverted_index = new Map();

for (let i = 0; i < 32; i++) {

  const map = document[i][`doc${i}`];

  for (let [word, freq] of map) {

    if (!inverted_index.has(word)) {
      inverted_index.set(word, []);
    }

    inverted_index.get(word).push({
      docId: `doc${i}`,
      tf: freq
    });

  }

}



/* QUERY PROCESSING */

const query_token = tokenizer
  .tokenize(query)
  .filter((word) => !stopwords.includes(word))
  .map((word) => natural.PorterStemmer.stem(word));


/* FIX 3: prevent undefined df */

const q_freq_map = new Map();

for (var i = 0; i < query_token.length; i++) {

  if (q_freq_map.has(query_token[i])) {
    q_freq_map.set(query_token[i], q_freq_map.get(query_token[i]) + 1);
  } else {
    q_freq_map.set(query_token[i], 1);
  }

}



function bm25(tf, docLen, avgDocLen, df) {

  const N = totalDocs;

  const idf = Math.log((N - df + 0.5) / (df + 0.5) + 1);

  const numerator = tf * (k1 + 1);

  const denominator =
    tf + k1 * (1 - b + b * (docLen / avgDocLen));

  return idf * (numerator / denominator);

}



function search(queryTokens) {

  const scores = {};

  for (let word of queryTokens) {

    const postings = inverted_index.get(word);
    if (!postings) continue;

    const df = documentfreq.get(word);
    if (!df) continue;

    for (let entry of postings) {

      const docId = entry.docId;
      const tf = entry.tf;
      const docLen = docLength[docId];

      const score = bm25(tf, docLen, avgDocLength, df);

      if (!scores[docId]) scores[docId] = 0;

      scores[docId] += score;

    }

  }

  return Object.entries(scores)
    .sort((a, b) => b[1] - a[1]);

}


const new_score = search(query_token);


// for(var i =0;i<5;i++){
//   console.log(new_score[i][0])
// }


const new_index = new Map();

for (var i = 0; i < 32; i++) {

  const filePath = path.join(__dirname, `./data/doc${i}.txt`);
  const data = fs.readFileSync(filePath, "utf8");

  const token = tokenizer
    .tokenize(data)
    .filter(word => !stopwords.includes(word))
    .map(word => natural.PorterStemmer.stem(word));

  for (var j = 0; j < token.length; j++) {

    const word = token[j];
    const docId = `doc${i}`;

    if (!new_index.has(word)) {
      new_index.set(word, {});
    }

    const postings = new_index.get(word);

    if (!postings[docId]) {
      postings[docId] = [];
    }

    postings[docId].push(j);

  }

}

console.log(new_index['suprem'])

module.exports = document;