class Trie {
	constructor() {
		this.root = { children: {}, isEnd: false };
	}

	insert(word) {
		word = word.toLowerCase();
		let node = this.root;
		for (let i = 0; i < word.length; i++) {
			let char = word[i];
			const nodeIsEnd = i === word.length - 1;
			if (!node.children[char]) {
				node.children[char] = { children: {}, isEnd: nodeIsEnd };
			}
			node.children[char].isEnd = node.children[char].isEnd || nodeIsEnd;
			node = node.children[char];
		}
	}

	collect(node, word, results) {
		if (node.isEnd) results.push(word);
		for (const char in node.children) {
			this.collect(node.children[char], word + char, results);
		}
	}

	search(prefix) {
		prefix = prefix.toLowerCase();
		let node = this.root;
		for (const char of prefix) {
			node = node?.children[char];
			if (!node) return [];
		}

		const results = [];
		this.collect(node, prefix, results);
		return results;
	}
}

export const trie = new Trie();