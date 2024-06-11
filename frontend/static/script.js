document.addEventListener('DOMContentLoaded', () => {
    const startButton = document.getElementById('start-button');
    const player1NameInput = document.getElementById('player1_name');
    const player2NameInput = document.getElementById('player2_name');
    const onePlayerButton = document.getElementById('onePlayerButton');
    const twoPlayersButton = document.getElementById('twoPlayersButton');
    const player1InputSection = document.getElementById('player1-input');
    const player2InputSection = document.getElementById('player2-input');
    const difficultySection = document.querySelector('.difficulty-section');
    const errorMessage = document.getElementById('error-message');

    let numPlayers = null; // Variable to store the number of players

    player1InputSection.style.display = 'none';
    player2InputSection.style.display = 'none';
    difficultySection.style.display = 'none';

    // Event listener for difficulty level selection
    document.querySelectorAll('.difficulty-button').forEach(button => {
        button.addEventListener('click', () => {
            document.querySelectorAll('.difficulty-button').forEach(btn => btn.classList.remove('selected'));
            button.classList.add('selected');

            // Check if all inputs are filled and make start button blink
            updateStartButtonState();
        });
    });

    onePlayerButton.addEventListener('click', () => {
        numPlayers = '1';
        onePlayerButton.classList.add('selected');
        twoPlayersButton.classList.remove('selected');
        player1InputSection.style.display = 'block';
        player2InputSection.style.display = 'block';
        player2NameInput.value = 'AI';
        player2NameInput.disabled = true;
        difficultySection.style.display = 'block';

        // Check if all inputs are filled and make start button blink
        updateStartButtonState();
    });

    twoPlayersButton.addEventListener('click', () => {
        numPlayers = '2';
        twoPlayersButton.classList.add('selected');
        onePlayerButton.classList.remove('selected');
        player1InputSection.style.display = 'block';
        player2InputSection.style.display = 'block';
        player2NameInput.value = '';
        player2NameInput.disabled = false;
        difficultySection.style.display = 'none';

        // Check if all inputs are filled and make start button blink
        updateStartButtonState();
    });

    function updateStartButtonState() {
        if (checkAllInputsFilled()) {
            startButton.classList.add('blink');
            startButton.classList.add('ready'); // Add 'ready' class
        } else {
            startButton.classList.remove('blink');
            startButton.classList.remove('ready'); // Remove 'ready' class
            errorMessage.style.display = 'none'; // Hide error message when conditions are not met
        }
    }

    function checkAllInputsFilled() {
        const isPlayer1NameFilled = player1NameInput.value.trim() !== '';
        const isPlayer2NameFilled = (numPlayers === '2' && player2NameInput.value.trim() !== '') || (numPlayers === '1' && player2NameInput.disabled);
        const isDifficultySelected = numPlayers === '2' || document.querySelector('.difficulty-button.selected') !== null;

        return isPlayer1NameFilled && isPlayer2NameFilled && isDifficultySelected;
    }

    // Event listeners for input fields
    player1NameInput.addEventListener('input', () => {
        updateStartButtonState();
        errorMessage.style.display = 'none'; // Clear error message when input is detected
    });
    player2NameInput.addEventListener('input', () => {
        updateStartButtonState();
        errorMessage.style.display = 'none'; // Clear error message when input is detected
    });

    startButton.addEventListener('click', (event) => {
        event.preventDefault();

        if (numPlayers === null) { // Check if number of players is selected
            errorMessage.textContent = "Select the number of players.";
            errorMessage.style.display = 'block';
            return;
        }

        const player1Name = player1NameInput.value.trim();
        const player2Name = player2NameInput.value.trim();

        // Validate player names
        if (player1Name === "" || (player2Name === "" && !player2NameInput.disabled)) {
            errorMessage.textContent = "Enter player names.";
            errorMessage.style.display = 'block';
            return;
        } else if (numPlayers === '2' && (player1Name.toLowerCase() === 'ai' || player2Name.toLowerCase() === 'ai')) {
            errorMessage.textContent = "Please use names other than 'AI'";
            errorMessage.style.display = 'block';
            return;
        } else if (player1Name.toLowerCase() === player2Name.toLowerCase()) {
            errorMessage.textContent = "Player names cannot be the same.";
            errorMessage.style.display = 'block';
            return;
        }

        const difficulty = document.querySelector('.difficulty-button.selected')?.textContent;

        const postData = {
            num_players: numPlayers,
            player1_name: player1Name,
            player2_name: player2Name,
            difficulty: difficulty
        };

        fetch('/config')
            .then(response => response.json())
            .then(data => {
                const backendUrl = data.backend_url;
                fetch(`${backendUrl}/game`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(postData)
                })
                .then(response => response.json())
                .then(data => {
                    if (data.redirect) {
                        window.location.href = data.redirect;
                    } else {
                        console.error("Unexpected response data:", data);
            }
        })
        .catch(error => {
            console.error('Error:', error);
        });
    });
});
});
