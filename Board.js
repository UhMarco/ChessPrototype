const startFEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

class Board {
    constructor() {
        this.frozen = false;
        this.turn = true; // true = white
        this.whitePieces = [];
        this.blackPieces = [];
        this.moves = [];
        this.drawnLastMove = 0;
        this.enPassant = null;
        this.lastEnPassant = null;
        this.selected = null;
        this.setupPieces()
    }

    setupPieces() {
        this.readFEN(startFEN);
    }

    readFEN(FEN) {
        this.whitePieces.length = 0
        this.blackPieces.length = 0
        const splitFEN = FEN.split(' ');
        const dashes = ['-', '–'];

        const boardFEN = splitFEN[0];

        // Logic for boardFEN reading borrowed from Sebastian Lague's Coding Adventure video.
        let file = 0, rank = 0;

        for (let i = 0; i < boardFEN.length; i++) {
            const char = boardFEN.charAt(i);
            if (char == '/') {
                file = 0;
                rank++;
            } else {
                if (char >= '0' && char <= '9') {
                    file += parseInt(char);
                } else {
                    const colour = char == char.toUpperCase() ? 'w' : 'b';
                    const type = char.toLowerCase();
                    this.addPiece(type, colour, file, rank);
                    file++;
                }
            }
        }

        const moveFEN = splitFEN[1];
        this.turn = moveFEN == 'w' ? true : false;

        const castlingFEN = splitFEN[2];
        if (!dashes.includes(castlingFEN)) {
            for (let i = 0; i < castlingFEN.length; i++) {
                const char = castlingFEN.charAt(i);
                const x = char == char.toUpperCase() ? 7 : 0;
                const y = char.toLowerCase() == 'k' ? 7 : 0;
                const rook = this.getPieceAt(x, y);
                const king = this.getPieceAt(4, y);
                if (rook && king) {
                    rook.hasMoved = false;
                    king.hasMoved = false;
                } else {
                    console.log('Invalid castling in FEN string.');
                }
            }
        }

        const enPassantFEN = splitFEN[3];
        if (!dashes.includes(enPassantFEN)) {
            let [cx, cy] = enPassantFEN.split('');
            let [x, y] = this.convertNotation(cx, cy);
            const piece = this.getPieceAt(x, y);
            if (piece && piece.type == 'pawn') {
                this.enPassant = piece;
            } else {
                console.log('Invalid en passant square in FEN string.');
            }
        }
    }

    getPieceAt(x, y) {
        for (let i = 0; i < this.whitePieces.length; i++) {
            const piece = this.whitePieces[i];
            if (!piece.taken && piece.matrixposition.x == x && piece.matrixposition.y == y) {
                return piece;
            }
        }
        for (let i = 0; i < this.blackPieces.length; i++) {
            const piece = this.blackPieces[i];
            if (!piece.taken && piece.matrixposition.x == x && piece.matrixposition.y == y) {
                return piece;
            }
        }
        return null;
    }

    select(piece) {
        if (!this.frozen && piece.isWhite == this.turn) {
            this.selected = piece;
            piece.select();
            main.fill(0, 0, 0, 80);
            main.ellipse(piece.pixelposition.x, piece.pixelposition.y, tilesize * 1.5);
        }
    }

    deselect(piece) {
        this.selected = null;
        piece.deselect();

        // Remove highlighting.
        main.clear(); // The base highlight is on the main layer.
        highlights.clear();
        drawBoard();
        if (this.drawnLastMove) this.drawnLastMove -= 1; // Keep last move indication when changing selection.
        this.showCheck();
    }

    move(x, y) {
        this.lastEnPassant = this.enPassant;
        this.enPassant = null;
        let castle = false;
        if (this.selected.type == 'king' && abs(x - this.selected.matrixposition.x) == 2) castle = true;
        this.moves.push(new Move(this.selected, this.selected.matrixposition, createVector(x, y), this.getPieceAt(x, y), castle));
        this.selected.move(x, y);
        this.turn = !this.turn; // Swap turns
    }

    show() {
        const moves = this.moves;
        if (this.drawnLastMove < moves.length) {
            this.drawnLastMove = moves.length;

            const { startSquare, targetSquare } = moves[moves.length - 1];
            // main.fill(255, 0, 0, 50);
            main.fill(202, 158, 94, 115);
            main.rect(startSquare.x * tilesize, startSquare.y * tilesize, tilesize, tilesize);
            main.rect(targetSquare.x * tilesize, targetSquare.y * tilesize, tilesize, tilesize);

        }

        for (let i = 0; i < this.whitePieces.length; i++) {
            this.whitePieces[i].show();
        }
        for (let i = 0; i < this.blackPieces.length; i++) {
            this.blackPieces[i].show();
        }
    }

    showCheck() {
        for (let i = 0; i < 2; i++) {
            const pieces = i == 0 ? board.whitePieces : board.blackPieces;
            const king = pieces.find(element => element.type == 'king');
            if (king.inCheck()) {
                const { x, y } = king.pixelposition;
                main.fill(255, 0, 0, 100);
                main.rect(x - tilesize / 2, y - tilesize / 2, tilesize, tilesize);
            }
        }
    }

    convertNotation(cx, cy) {
        const alphabet = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
        let x = alphabet.indexOf(cx);
        let y = 8 - cy;
        return [x, y];
    }

    addPiece(type, colour, file, rank) {
        switch (type) {
            case 'k':
                if (colour == 'w') {
                    this.whitePieces.push(new King(file, rank, true));
                } else {
                    this.blackPieces.push(new King(file, rank, false));
                }
                break;

            case 'q':
                if (colour == 'w') {
                    this.whitePieces.push(new Queen(file, rank, true));
                } else {
                    this.blackPieces.push(new Queen(file, rank, false));
                }
                break;

            case 'b':
                if (colour == 'w') {
                    this.whitePieces.push(new Bishop(file, rank, true));
                } else {
                    this.blackPieces.push(new Bishop(file, rank, false));
                }
                break;

            case 'n':
                if (colour == 'w') {
                    this.whitePieces.push(new Knight(file, rank, true));
                } else {
                    this.blackPieces.push(new Knight(file, rank, false));
                }
                break;

            case 'r':
                if (colour == 'w') {
                    this.whitePieces.push(new Rook(file, rank, true));
                } else {
                    this.blackPieces.push(new Rook(file, rank, false));
                }
                break;

            case 'p':
                if (colour == 'w') {
                    const hasMoved = rank == 6 ? false : true;
                    this.whitePieces.push(new Pawn(file, rank, true, hasMoved));
                } else {
                    const hasMoved = rank == 1 ? false : true;
                    this.blackPieces.push(new Pawn(file, rank, false, hasMoved));
                }
                break;
        }
    }
}