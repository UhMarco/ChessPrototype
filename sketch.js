let canvas, board, tilesize, main, highlights, ui, bot;

const images = {};
const piece_type = ['king', 'queen', 'bishop', 'knight', 'rook', 'pawn'];

function setup() {
	console.log('Hello :)');

	const wd = Math.min(windowWidth * 0.8, windowHeight * 0.8);
	tilesize = wd / 8;
	canvas = createCanvas(wd, wd);

	main = createGraphics(width, height);
	highlights = createGraphics(width, height);
	ui = createGraphics(width, height);

	for (let i = 0; i < piece_type.length; i++) {
		const type = piece_type[i];
		const arr = [];
		arr.push(loadImage(`assets/images/${type}_w.png`));
		arr.push(loadImage(`assets/images/${type}_b.png`));
		images[type] = arr;
	}

	board = new Board();
	bot = new RandomBot();
	drawBoard();
}

function draw() {
	board.show();
	image(main, 0, 0);
	image(highlights, 0, 0);
	image(ui, 0, 0);
}

function drawBoard() {
	for (let x = 0; x < 8; x++) {
		for (let y = 0; y < 8; y++) {
			if ((x + y) % 2 === 0) { // white
				main.fill('#EBEDF1');
			} else { // black
				main.fill('#7A8191');
			}
			main.noStroke();
			main.rect(x * tilesize, y * tilesize, tilesize, tilesize);
		}
	}
}

function windowResized() {
	const wd = Math.min(windowWidth * 0.8, windowHeight * 0.8);
	tilesize = wd / 8;
	resizeCanvas(wd, wd);
	// main.clear();
	drawBoard();
	board.pieces.forEach((piece) => piece.updateGraphics());
	board.show();
}

function hasMove(moves, x, y) {
	for (let i = 0; i < moves.length; i++) {
		let [compareX, compareY] = moves[i];
		if (compareX == x && compareY == y) {
			return true;
		}
	}
	return false;
}

function mousePressed() {
	const x = floor(mouseX / tilesize);
	const y = floor(mouseY / tilesize);
	if (!board.frozen && board.turn == board.player) {
		const piece = board.getPieceAt(x, y);

		if (board.selected && hasMove(board.selected.moves, x, y)) {
			board.move(x, y);
			board.deselect(board.selected);
		} else if (piece) {
			if (piece == board.selected) {
				board.deselect(piece);
			} else {
				if (board.selected) {
					board.deselect(board.selected);
				}
				board.select(piece);
			}
		} else if (board.selected !== null) {
			board.deselect(board.selected);
		}
	} else if (board.pawnToPromote) {
		const pawn = board.pawnToPromote;
		const { x: pawnX, y: pawnY } = pawn.matrixposition;
		const direction = pawn.isWhite ? 1 : -1;
		const selections = [];
		for (let i = 1; i < 5; i++) {
			selections.push([pawnX, pawnY + i * direction]);
		}
		selections.forEach(([cx, cy]) => {
			if (x == cx && y == cy) {
				const offset = pawn.isWhite ? -1 : -3;
				const types = ['queen', 'rook', 'knight', 'bishop'];
				return board.promote(pawn, true, types[y + offset]);
			}
		});
	}
}