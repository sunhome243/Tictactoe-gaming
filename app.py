from flask import Flask, render_template, request, jsonify, session
import random
import os

static_path = os.getenv('FRONTEND_STATIC_PATH', 'frontend/static')
templates_path = os.getenv('FRONTEND_TEMPLATES_PATH', 'frontend/templates')

app = Flask(__name__, static_folder=static_path, template_folder=templates_path)
app.secret_key = 'your_secret_key_here'

def init_game_data():
    return {
        'player1': {
            'name': " ",
            'wins': 0,
            'win_streak': 0,
            'best_win_streak': 0
        },
        'player2': {
            'name': " ",
            'wins': 0,
            'win_streak': 0,
            'best_win_streak': 0
        },
        'game_state': [' ' for _ in range(9)],
        'current_player': None,
        'game_over': False,
        'winner': None,
        'starting_player': None,
        'difficulty': None
    }

def load_game_data():
    return session.get('game_data', init_game_data())

def save_game_data(game_data):
    session['game_data'] = game_data

def reset_game(keep_stats=True):
    game_data = load_game_data()
    if not keep_stats:
        game_data['player1']['wins'] = 0
        game_data['player1']['win_streak'] = 0
        game_data['player1']['best_win_streak'] = 0
        game_data['player2']['wins'] = 0
        game_data['player2']['win_streak'] = 0
        game_data['player2']['best_win_streak'] = 0
    game_data['game_state'] = [' ' for _ in range(9)]
    game_data['current_player'] = random.choice(['X', 'O'])
    game_data['game_over'] = False
    game_data['winner'] = None
    game_data['starting_player'] = game_data['current_player']
    return game_data

@app.route('/config', methods=['GET'])
def config():
    backend_url = request.host_url.rstrip('/')
    return jsonify({'backend_url': backend_url})

@app.route('/')
def index():
    if 'game_data' not in session:
        game_data = init_game_data()
        save_game_data(game_data)
    else:
        game_data = load_game_data()

    return render_template('index.html', game_data=game_data)


@app.route('/game', methods=['GET', 'POST'])
def game():
    game_data = load_game_data()

    if request.method == 'POST':
        if 'num_players' in request.json:
            num_players = request.json.get('num_players')
            player1_name = request.json.get('player1_name')
            # Change player 2 name
            player2_name = request.json.get('player2_name') if num_players == '2' else  request.json.get('difficulty') + ' AI'
            difficulty = request.json.get('difficulty')

            game_data['player1']['name'] = player1_name
            game_data['player2']['name'] = player2_name
            game_data['difficulty'] = difficulty

            game_data = reset_game(keep_stats=False)
            if num_players == '1':
                game_data['current_player'] = 'X'
            else:
                game_data['current_player'] = random.choice(['X', 'O'])

            if game_data['player2']['name'].endswith(' AI') and game_data['current_player'] == 'O':
                available_moves = [i for i in range(9) if game_data['game_state'][i] == ' ']
                ai_cell_index = random.choice(available_moves)
                game_data['game_state'][ai_cell_index] = 'O'
                game_data['current_player'] = switch_player(game_data['current_player'])

            save_game_data(game_data)
            return jsonify({'redirect': '/game'})

        elif request.json.get('action') == 'move':
            if not game_data['game_over']:
                cell_index = int(request.json.get('cell'))
                if cell_index != -1:
                    if game_data['game_state'][cell_index] == ' ':
                        game_data['game_state'][cell_index] = game_data['current_player']
                        winner = check_winner(game_data['game_state'])
                        if winner:
                            game_data['game_over'] = True
                            game_data['winner'] = winner
                            update_data(winner)
                        else:
                            game_data['current_player'] = switch_player(game_data['current_player'])

                elif game_data['player2']['name'].endswith(' AI') and game_data['current_player'] == 'O': # Check if player2 is AI
                    ai_cell_index = minimax(game_data['game_state'], 'O', game_data['difficulty'])['index']
                    if ai_cell_index is not None:
                        game_data['game_state'][ai_cell_index] = 'O'
                        winner = check_winner(game_data['game_state'])
                        if winner:
                            game_data['game_over'] = True
                            game_data['winner'] = winner
                            update_data(winner)
                        else:
                            game_data['current_player'] = switch_player(game_data['current_player'])

                save_game_data(game_data)
                return jsonify(game_data)

        elif request.json.get('action') == 'restart':
            game_data = reset_game()
            save_game_data(game_data)
            if game_data['player2']['name'].endswith(' AI') and game_data['current_player'] == 'O':
                available_moves = [i for i in range(9) if game_data['game_state'][i] == ' ']
                ai_cell_index = random.choice(available_moves)
                game_data['game_state'][ai_cell_index] = 'O'
                game_data['current_player'] = switch_player(game_data['current_player'])
            return jsonify(game_data)
        
    game_data = load_game_data()
    return render_template('game.html', game_data=game_data)

def check_winner(game_state):
    win_conditions = [
        [0, 1, 2], [3, 4, 5], [6, 7, 8],
        [0, 3, 6], [1, 4, 7], [2, 5, 8],
        [0, 4, 8], [2, 4, 6]
    ]
    for condition in win_conditions:
        if game_state[condition[0]] == game_state[condition[1]] == game_state[condition[2]] != ' ':
            return game_state[condition[0]]
    if ' ' not in game_state:
        return 'draw'
    return None

def minimax(state, player, difficulty):
    if difficulty == 'Easy':
        random_number = random.randint(1, 5)
    elif difficulty == 'Fair':
        random_number = random.randint(1, 4)
    elif difficulty == 'Hard':
        random_number = random.randint(1, 3)
    else:
        random_number = random.randint(1, 2)

    if random_number == 1 or 2:
        available_moves = [i for i in range(9) if state[i] == ' ']
        if check_winner(state) == 'X':
            return {'score': -10, 'index': None}
        elif check_winner(state) == 'O':
            return {'score': 10, 'index': None}
        elif len(available_moves) == 0:
            return {'score': 0, 'index': None}

        best_move = {'score': float('-inf') if player == 'O' else float('inf'), 'index': None}
        for i in available_moves:
            new_state = state[:]
            new_state[i] = player
            score = minimax(new_state, switch_player(player), difficulty)['score']
            if player == 'O':
                if score > best_move['score']:
                    best_move['score'] = score
                    best_move['index'] = i
            else:
                if score < best_move['score']:
                    best_move['score'] = score
                    best_move['index'] = i

        return best_move
    else:
        available_moves = [i for i in range(9) if state[i] == ' ']
        if available_moves:
            chosen_index = random.choice(available_moves)
            return {'score': 0, 'index': chosen_index}
        return {'score': 0, 'index': None}

def update_data(winner):
    game_data = load_game_data()
    if winner == 'X':
        game_data['player1']['wins'] += 1
        game_data['player1']['win_streak'] += 1
        if game_data['player1']['win_streak'] > game_data['player1']['best_win_streak']:
            game_data['player1']['best_win_streak'] = game_data['player1']['win_streak']
        game_data['player2']['win_streak'] = 0
    elif winner == 'O':
        game_data['player2']['wins'] += 1
        game_data['player2']['win_streak'] += 1
        if game_data['player2']['win_streak'] > game_data['player2']['best_win_streak']:
            game_data['player2']['best_win_streak'] = game_data['player2']['win_streak']
        game_data['player1']['win_streak'] = 0
    game_data['game_over'] = True

    save_game_data(game_data)

def switch_player(current_player):
    return 'X' if current_player == 'O' else 'O'

if __name__ == '__main__':
    app.run(debug=True)