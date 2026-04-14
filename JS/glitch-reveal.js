import { auth, onAuthStateChanged } from "./firebase.js"; // Import Firebase authentication
// Glitch reveal
const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789 ";

function decryptText(element, finalText, speed = 50) {
    let iterations = 0;
    const interval = setInterval(() => {
        element.innerText = finalText
            .split("")
            .map((letter, index) => {
                if (index < iterations) {
                    return finalText[index];
                }
                return letters[Math.floor(Math.random() * letters.length)];
            })
            .join("");

        if (iterations >= finalText.length) {
            clearInterval(interval);
        }

        iterations += 1 / 20; // Adjust speed of fixing characters
    }, speed);
}

const playgroundHeader = document.getElementById("glitch");

// Welcome line according to login state
onAuthStateChanged(auth, (user) => {
    if (user) {
        decryptText(playgroundHeader, `MEMORY VOID`);
    } else {
        decryptText(playgroundHeader, "MEMORY VOID");
    }
});