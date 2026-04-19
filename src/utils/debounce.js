export const debounce = (fn, delay) => {
	let timer;
	return (...args) =>
		new Promise((resolve) => {
			clearTimeout(timer);
			timer = setTimeout(() => resolve(fn(...args)), delay);
		});
};
