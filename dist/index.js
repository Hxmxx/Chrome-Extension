"use strict";
function fetchTextFromWebsite() {
    const body = document.body;
    const walker = document.createTreeWalker(body, NodeFilter.SHOW_TEXT, null);
    let textContent = '';
    while (walker.nextNode()) {
        textContent += walker.currentNode.nodeValue + ' ';
    }
    return textContent.trim();
}
function analyzeTFIDF(text) {
    const documents = text.split('. ').map(sentence => sentence.trim() + '.');
    const tokenizedDocs = documents.map(doc => doc.split(' '));
    const tfValues = tokenizedDocs.map(doc => computeTF(doc));
    const idfValues = computeIDF(tokenizedDocs);
    const tfIdf = tfValues.map(tfDoc => {
        let docTfIdf = {};
        for (const [term, tfVal] of Object.entries(tfDoc)) {
            docTfIdf[term] = tfVal * (idfValues[term] || 0);
        }
        return docTfIdf;
    });
    const tfIdfScores = tfIdf.map((docTfIdf, i) => ({
        index: i,
        score: Object.values(docTfIdf).reduce((a, b) => a + b, 0)
    }));
    const top5Sentences = tfIdfScores
        .sort((a, b) => b.score - a.score)
        .slice(0, 5)
        .map(item => documents[item.index]);
    top5Sentences.forEach(sentence => {
        highlightText(sentence);
    });
}
function computeTF(doc) {
    let tf = {};
    const totalWords = doc.length;
    doc.forEach(word => {
        tf[word] = (tf[word] || 0) + 1;
    });
    for (const word in tf) {
        tf[word] = tf[word] / totalWords;
    }
    return tf;
}
function computeIDF(docs) {
    let idf = {};
    const totalDocs = docs.length;
    docs.forEach(doc => {
        const uniqueWords = new Set(doc);
        uniqueWords.forEach(word => {
            idf[word] = (idf[word] || 0) + 1;
        });
    });
    for (const word in idf) {
        idf[word] = Math.log(totalDocs / (idf[word] || 1));
    }
    return idf;
}
function highlightText(sentence, backgroundColor = '#FFFF00', padding = '4px') {
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null);
    // 특수문자를 이스이프하는 정규식 수정
    const sentenceRegex = new RegExp(`(${sentence.replace(/([.*+?^=!:${}()|$begin:math:display$$end:math:display$\/\\])/g, "\\$1")})`, 'g'); // 특수문자 escaping
    while (walker.nextNode()) {
        const node = walker.currentNode;
        if (node.nodeValue && node.nodeValue.match(sentenceRegex)) {
            const span = document.createElement('span');
            span.style.backgroundColor = backgroundColor;
            span.style.color = 'black';
            span.style.padding = padding;
            const match = node.nodeValue.match(sentenceRegex);
            if (match) {
                const parts = node.nodeValue.split(match[0]);
                const parent = node.parentNode;
                // 기존 텍스트 노드에서 하이라이팅된 텍스트로 변경
                parent.insertBefore(document.createTextNode(parts[0]), node);
                parent.insertBefore(span, node);
                span.textContent = match[0];
                parent.insertBefore(document.createTextNode(parts[1]), node);
                parent.removeChild(node);
            }
        }
    }
}
window.addEventListener('load', function () {
    const text = fetchTextFromWebsite();
    if (text) {
        analyzeTFIDF(text);
    }
});
