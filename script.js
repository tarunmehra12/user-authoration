import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-auth.js";
import { getDatabase, ref, push, onValue } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-database.js";

// Initialize auth and database
const auth = getAuth(app);
const database = getDatabase(app);

// Check authentication state
onAuthStateChanged(auth, (user) => {
    if (!user) {
        // Redirect to login if not authenticated
        window.location.href = 'login.html';
    }
});

// Add logout functionality
function logout() {
    signOut(auth).then(() => {
        window.location.href = 'login.html';
    }).catch((error) => {
        console.error('Error signing out:', error);
    });
}

// Store chat messages in Firebase
async function storeChatMessage(userMessage, botResponse) {
    const user = auth.currentUser;
    if (user) {
        try {
            await push(ref(database, 'chats/' + user.uid), {
                userMessage: userMessage,
                botResponse: botResponse,
                timestamp: Date.now()
            });
        } catch (error) {
            console.error('Error storing chat:', error);
        }
    }
} 