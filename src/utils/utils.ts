export function randomColor(): 'red' | 'yellow' | 'green' | 'blue' {
	const rand = Math.random();

	if (rand < 0.25) {
		return 'red';
	} else if (rand < 0.5) {
		return 'yellow';
	} else if (rand < 0.75) {
		return 'green';
	} else {
		return 'blue';
	}
}
