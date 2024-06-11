document.addEventListener('DOMContentLoaded', () => {
    const cells = document.querySelectorAll('.cell');
    const currentPlayerDisplay = document.getElementById('current-player');
    const gameOverDisplay = document.getElementById('game-over');
    const restartButton = document.getElementById('restart-button');
    let gameData = {};

    fetch('/config')
        .then(response => response.json())
        .then(data => {
            const backendUrl = data.backend_url;
            fetch(`${backendUrl}/game`)
                .then(response => response.json())
                .then(data => {
                    gameData = data;
                    updateGameState(gameData);

                    if (gameData.player2.name.endsWith('AI') && gameData.current_player === 'O') { 
                        setTimeout(makeAiMove, 500);
                    }
                })
                .catch(error => {
                    console.error('Error fetching game data:', error);
                });
        })
        .catch(error => {
            console.error('Error fetching backend URL:', error);
        });

    const updateGameState = (gameData) => {
        const startingPlayerSpan = document.getElementById('starting-player');
        if (gameData.starting_player === 'X') {
            startingPlayerSpan.textContent = 'X starts the game.';
        } else if (gameData.starting_player === 'O') {
            startingPlayerSpan.textContent = 'O starts the game.';
        }

        cells.forEach((cell, index) => {
            cell.textContent = gameData.game_state[index];
            cell.disabled = gameData.game_state[index] !== ' ';

            if (gameData.game_state[index] === 'X') {
                cell.style.backgroundColor = 'blue';
            } else if (gameData.game_state[index] === 'O') {
                cell.style.backgroundColor = 'red';
            } else {
                cell.style.backgroundColor = 'white'; 
            }
        });

        currentPlayerDisplay.textContent = `Current Player: ${gameData.current_player}`;

        if (gameData.game_over) {
            gameOverDisplay.style.display = 'block';

            if (gameData.winner === 'draw') { 
                gameOverDisplay.textContent = 'Game Over! It\'s a draw!';
                document.body.style.backgroundColor = 'lavender'; 
            } else if (gameData.winner) {
                const winnerName = gameData.winner === 'X' ? gameData.player1.name : gameData.player2.name;
                gameOverDisplay.textContent = `Game Over! ${winnerName} won!`;
                if (gameData.winner === 'X') {
                    document.body.style.backgroundColor = 'lightblue';
                } else {
                    document.body.style.backgroundColor = 'Salmon';
                }
            }
        } else {
            gameOverDisplay.style.display = 'none';
            document.body.style.backgroundColor = '#f0f0f0';
        }

        // Update Player Statistics
        document.getElementById('player1-name').textContent = gameData.player1.name;
        document.getElementById('player1-wins').textContent = gameData.player1.wins;
        document.getElementById('player1-streak').textContent = gameData.player1.win_streak;
        document.getElementById('player1-best-streak').textContent = gameData.player1.best_win_streak;

        document.getElementById('player2-name').textContent = gameData.player2.name; // Update name based on difficulty
        document.getElementById('player2-wins').textContent = gameData.player2.wins;
        document.getElementById('player2-streak').textContent = gameData.player2.win_streak;
        document.getElementById('player2-best-streak').textContent = gameData.player2.best_win_streak;
    };

    cells.forEach(cell => {
        cell.addEventListener('click', async () => {
            const cellIndex = cell.dataset.index;

            try {
                fetch('/config')
                    .then(response => response.json())
                    .then(data => {
                        const backendUrl = data.backend_url;
                        fetch(`${backendUrl}/game`, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({
                                action: 'move',
                                cell: cellIndex,
                            }),
                        })
                        .then(response => {
                            if (response.ok) {
                                return response.json();
                            } else {
                                throw new Error('Error sending move to server.');
                            }
                        })
                        .then(gameData => {
                            updateGameState(gameData);

                            if (!gameData.game_over && gameData.player2.name.endsWith('AI') && gameData.current_player === 'O') { 
                                setTimeout(makeAiMove, 100);
                            }
                        })
                        .catch(error => {
                            console.error('Error during move:', error);
                        });
                    })
                    .catch(error => {
                        console.error('Error fetching backend URL:', error);
                    });
            } catch (error) {
                console.error('Error during move:', error);
            }
        });
    });

    async function makeAiMove() {
        try {
            fetch('/config')
                .then(response => response.json())
                .then(data => {
                    const backendUrl = data.backend_url;
                    fetch(`${backendUrl}/game`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ action: 'move', cell: -1 })
                    })
                    .then(response => {
                        if (response.ok) {
                            return response.json();
                        } else {
                            throw new Error('Error in AI move request');
                        }
                    })
                    .then(gameData => {
                        updateGameState(gameData);
                    })
                    .catch(error => {
                        console.error('Error in AI move request:', error);
                    });
                })
                .catch(error => {
                    console.error('Error fetching backend URL:', error);
                });
        } catch (error) {
            console.error('Error during AI move:', error);
        }
    }

    restartButton.addEventListener('click', async () => {
        try {
            fetch('/config')
                .then(response => response.json())
                .then(data => {
                    const backendUrl = data.backend_url;
                    fetch(`${backendUrl}/game`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            action: 'restart',
                        }),
                    })
                    .then(response => {
                        if (response.ok) {
                            return response.json();
                        } else {
                            throw new Error('Error restarting the game.');
                        }
                    })
                    .then(gameData => {
                        updateGameState(gameData);
                    })
                    .catch(error => {
                        console.error('Error restarting the game:', error);
                    });
                })
                .catch(error => {
                    console.error('Error fetching backend URL:', error);
                });
        } catch (error) {
            console.error('Error during restart:', error);
        }
    });
});