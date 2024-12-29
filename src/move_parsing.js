import { Chess } from 'chess.js'

const chess = new Chess()

const chess_board_table = [["a8", "b8", "c8", "d8", "e8","f8", "g8","h8"],
		     ["a7", "b7", "c7", "d7", "e7","f7", "g7","h7"],
		     ["a6", "b6", "c6", "d6", "e6","f6", "g6","h6"],
		     ["a5", "b5", "c5", "d5", "e5","f5", "g5","h5"],
		     ["a4", "b4", "c4", "d4", "e4","f4", "g4","h4"],
		     ["a3", "b3", "c3", "d3", "e3","f3", "g3","h3"],
		     ["a2", "b2", "c2", "d2", "e2","f2", "g2","h2"],
		     ["a1", "b1", "c1", "d1", "e1","f1", "g1","h1"],]

/** Take a coordinate based (x,y) square and return the algabraic square */
function coordinate_to_SAN(coords)
{
    let x_coord = coords[0]
    let y_coord = coords[1]

    let SAN = chess_board_table[x_coord][y_coord]
    console.log(SAN)
    return SAN
}

function fens_to_SAN(initial_fen, result_fen)
{
    //Load the initial fen
    chess.load(initial_fen)

    let possible_moves = chess.moves()

    for (let i = 0; i < possible_moves.length; i++)
    {
	chess.move(possible_moves[i])

	// find what the move was by brute force
	if (chess.fen() == result_fen){
	    console.log("the move is " + possible_moves[i])
	    return possible_moves[i]
	}
	console.log("the move is not " + possible_moves[i])
	// undo the incorrect move
	chess.undo()
    }
    console.error("No move parsed from initial fen " +
		  initial_fen +
		  " and result fen "
		  + result_fen)
}


let initial_fen = chess.fen()
chess.move("e4")
let result_fen = chess.fen()
let m = fens_to_SAN(initial_fen, result_fen)
console.log(m)

console.log(coordinate_to_SAN([0,0]))
