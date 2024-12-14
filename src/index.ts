function fetchTextFromWebsite(): string {
    const body: HTMLElement = document.body;
    const walker: TreeWalker = document.createTreeWalker(
        body, 
        NodeFilter.SHOW_TEXT, 
        null
    );

    let textContent: string = '';
    while (walker.nextNode()) {
        textContent += walker.currentNode.nodeValue + ' ';
    }
    return textContent.trim();
}

function analyzeTFIDF(text: string): void {
    const documents: string[] = text.split('. ').map(sentence => sentence.trim() + '.');
    const tokenizedDocs: string[][] = documents.map(doc => doc.split(' '));
    const tfValues: { [key: string]: number }[] = tokenizedDocs.map(doc => computeTF(doc));
    const idfValues: { [key: string]: number } = computeIDF(tokenizedDocs);

    const tfIdf: { [key: string]: number }[] = tfValues.map(tfDoc => {
        let docTfIdf: { [key: string]: number } = {};
        for (const [term, tfVal] of Object.entries(tfDoc)) {
            docTfIdf[term] = tfVal * (idfValues[term] || 0);
        }
        return docTfIdf;
    });

    const tfIdfScores: { index: number; score: number }[] = tfIdf.map((docTfIdf, i) => ({
        index: i,
        score: Object.values(docTfIdf).reduce((a, b) => a + b, 0)
    }));

    const top5Sentences: string[] = tfIdfScores
        .sort((a, b) => b.score - a.score)
        .slice(0, 5)
        .map(item => documents[item.index]);

    top5Sentences.forEach(sentence => {
        highlightText(sentence);
    });
}

function computeTF(doc: string[]): { [key: string]: number } {
    let tf: { [key: string]: number } = {};
    const totalWords: number = doc.length;

    doc.forEach(word => {
        tf[word] = (tf[word] || 0) + 1;
    });

    for (const word in tf) {
        tf[word] = tf[word] / totalWords;
    }

    return tf;
}

function computeIDF(docs: string[][]): { [key: string]: number } {
    let idf: { [key: string]: number } = {};
    const totalDocs: number = docs.length;

    docs.forEach(doc => {
        const uniqueWords: Set<string> = new Set(doc);
        uniqueWords.forEach(word => {
            idf[word] = (idf[word] || 0) + 1;
        });
    });

    for (const word in idf) {
        idf[word] = Math.log(totalDocs / (idf[word] || 1));
    }

    return idf;
}

function highlightText(sentence: string, backgroundColor: string = '#FFFF00', padding: string = '4px'): void {
    const walker: TreeWalker = document.createTreeWalker(
        document.body, 
        NodeFilter.SHOW_TEXT, 
        null
    );

    // 특수문자를 이스이프하는 정규식 수정
    const sentenceRegex: RegExp = new RegExp(`(${sentence.replace(/([.*+?^=!:${}()|$begin:math:display$$end:math:display$\/\\])/g, "\\$1")})`, 'g');  // 특수문자 escaping

    while (walker.nextNode()) {
        const node: Text = walker.currentNode as Text;

        if (node.nodeValue && node.nodeValue.match(sentenceRegex)) {
            const span: HTMLSpanElement = document.createElement('span');
            span.style.backgroundColor = backgroundColor;
            span.style.color = 'black';
            span.style.padding = padding;

            const match: RegExpMatchArray | null = node.nodeValue.match(sentenceRegex);
            if (match) {
                const parts: string[] = node.nodeValue.split(match[0]);
                const parent: Node = node.parentNode as Node;

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

window.addEventListener('load', function() {
    const text: string = fetchTextFromWebsite();
    if (text) {
        analyzeTFIDF(text);
    }
});