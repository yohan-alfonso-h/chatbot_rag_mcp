import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import cosineSimilarity from "compute-cosine-similarity";

const currentDir = path.dirname(fileURLToPath(import.meta.url));

class ragProvider {
    static fetchDocumentData(filename) {
        const filePath = path.join(currentDir, '..', 'data', filename);
        return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    }

    static loadKnowledgeBase() {
        return this.fetchDocumentData('knowledgeBase.json');
    }

    static loadFaqs() {
        return this.fetchDocumentData('faqs.json');
    }

    static findAnswer(query) {
        const kbData = this.loadFaqs();
        const queryTokens = tokenize(query);

        let bestMatch = null;
        let bestScore = 0;

        for (const item of kbData) {
            const questionTokens = tokenize(item.question);
            const matches = questionTokens.filter((token) =>
                queryTokens.some((queryToken) => areSimilarWords(token, queryToken)),
            );
            const score = matches.length / questionTokens.length;

            if (score > bestScore) {
                bestScore = score;
                bestMatch = item;
            }
        }

        return bestScore >= 0.35 ? bestMatch.answer : null;
    }

    static prepareSimplerRagPrompt(query) {
        const kbData = this.loadKnowledgeBase();
        const context = kbData.map((item) => 'Q: ' + item.question + '\nA: ' + item.answer).join('\n\n');
        const prompt = `You are an AI assistant. You will be given a set of context information and a question. Use the context to answer the question.
        ${context}
        
        Based on the above knowledge, answer the following question.
        
        User: ${query}
        Answer in one short paragraph.
        
        `;

        return prompt;
    }

    static createFaqEmbeddingText(faq) {
        return `Question: ${faq.question}\nAnswer: ${faq.answer}`;
    }

    static rankBySimilarity(queryVector, faqVectors, limit = 2) {
        return faqVectors.map((item) => ({
            ...item,
            score: cosineSimilarity(queryVector, item.vector) ?? 0,
        }))
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);
    }

    static prepareRagPrompt(query, queryVector, faqVectors, options = {}) {
        const {
            limit = 2,
            minScore = 0.2,
        } = options;

        const ranked = this.rankBySimilarity(queryVector, faqVectors, limit)
            .filter((item) => item.score >= minScore);

        const context = ranked
            .map((item, index) => [
                `FAQ ${index + 1}:`,
                `Question: ${item.question}`,
                `Answer: ${item.answer}`,
            ].join('\n'))
            .join('\n\n');

        const prompt = `You are an AI assistant. You will be given FAQ context and a user question.
        If the FAQ context directly answers the question, answer using that context.
        If the FAQ context is empty or does not directly answer the question, say:
        "The information is not available in documentation, but I will try to help you."
        Then answer using your general knowledge.
        Never answer only "I don't know" unless the user asks for unknowable private or real-time information.

        FAQ context:
        ${context || 'No relevant context found.'}

        User question: ${query}
        Answer in one short paragraph.`.trim();
        return prompt;
    }

    static prepareRagPromt(query, queryVector, faqVectors, options) {
        return this.prepareRagPrompt(query, queryVector, faqVectors, options);
    }
}

function tokenize(value) {
    return String(value)
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, ' ')
        .split(/\s+/)
        .filter((token) => token.length > 2 && !['the', 'our', 'can', 'where', 'what'].includes(token));
}

function areSimilarWords(left, right) {
    return left === right || levenshteinDistance(left, right) <= 1;
}

function levenshteinDistance(left, right) {
    if (Math.abs(left.length - right.length) > 1) {
        return 2;
    }

    const distances = Array.from({ length: left.length + 1 }, (_, index) => [index]);

    for (let column = 1; column <= right.length; column++) {
        distances[0][column] = column;
    }

    for (let row = 1; row <= left.length; row++) {
        for (let column = 1; column <= right.length; column++) {
            const cost = left[row - 1] === right[column - 1] ? 0 : 1;
            distances[row][column] = Math.min(
                distances[row - 1][column] + 1,
                distances[row][column - 1] + 1,
                distances[row - 1][column - 1] + cost,
            );
        }
    }

    return distances[left.length][right.length];
}


export default ragProvider;
