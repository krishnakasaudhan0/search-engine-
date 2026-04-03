const document = require("./ranking");

const inverted_index = new Map();

for (let i = 0; i < 32; i++) {

    const map = document[i][`doc${i}`];

    for (let [word, freq] of map) {

        if (inverted_index.has(word)) {

            const docs = inverted_index.get(word);

            docs.push({ [`doc${i}`]: freq });

        } else {

            inverted_index.set(word, [{ [`doc${i}`]: freq }]);

        }
    }
}

console.log(inverted_index);