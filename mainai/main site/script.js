// Import Firebase
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getDatabase, ref, push, onValue, set, remove } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

// DOM Elements
const chatContent = document.getElementById("chat-content");
const chatForm = document.getElementById("chat-form");
const userInput = document.getElementById("user-input");

// Configuration - Replace with your actual API details
const API_CONFIG = {
    URL: "https://backend.buildpicoapps.com/aero/run/llm-api",
    API_KEY: "v1-Z0FBQUFBQm5IZkJDMlNyYUVUTjIyZVN3UWFNX3BFTU85SWpCM2NUMUk3T2dxejhLSzBhNWNMMXNzZlp3c09BSTR6YW1Sc1BmdGNTVk1GY0liT1RoWDZZX1lNZlZ0Z1dqd3c9PQ=="
};

// Assistant configuration - remove the long welcome message
const ASSISTANT_PROMPT = `I am TechTeach AI, a programming teacher.

I can help with:
• Programming in Python, Java, JavaScript, C++
• Web Development
• Data Structures & Algorithms
• System Design
• Code Review & Debugging

I provide technical responses with code examples and explanations.`;

// Initialize Firebase Auth
const auth = getAuth();

// Initialize Firebase Database
const db = getDatabase();
let currentUser = null;
let currentChatId = null;

// Create auth popup
const authPopup = document.createElement('div');
authPopup.className = 'auth-popup';
authPopup.innerHTML = `
    <div class="popup-content">
        <h3>🔒 Login Required</h3>
        <p>Please login or register to continue using TechTeach AI:</p>
        <div class="popup-buttons">
            <button onclick="window.location.href='../register.html'" class="popup-button register">Register Now</button>
            <button onclick="window.location.href='../login.html?redirect=main'" class="popup-button login">Login</button>
        </div>
    </div>
`;

// Check authentication status
onAuthStateChanged(auth, (user) => {
    if (user) {
        currentUser = user;
        loadChatHistory();
        enableChat();
    } else {
        document.body.appendChild(authPopup);
        disableChat();
    }
});

// Disable chat functionality
function disableChat() {
    userInput.disabled = true;
    userInput.placeholder = "Please login to start chatting...";
    chatForm.querySelector('button[type="submit"]').disabled = true;
}

// Enable chat functionality
function enableChat() {
    userInput.disabled = false;
    userInput.placeholder = "Ask me anything about programming...";
    chatForm.querySelector('button[type="submit"]').disabled = false;
}

/**
 * Fetches AI response for the given user message
 */
async function fetchResponse(userMessage) {
    try {
        const response = await fetch(`${API_CONFIG.URL}?pk=${API_CONFIG.API_KEY}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                prompt: `${ASSISTANT_PROMPT}\nUser: ${userMessage}\nAI Teacher:`
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return data.status === "success" ? data.text : "I apologize, but I'm having trouble processing your request. Please try again.";
    } catch (error) {
        console.error("Error in fetchResponse:", error);
        return "I apologize, but I'm experiencing technical difficulties. Please try again later.";
    }
}

// Load chat history
function loadChatHistory() {
    const messagesRef = ref(db, `messages/${currentUser.uid}`);
    onValue(messagesRef, (snapshot) => {
        chatContent.innerHTML = '';
        const messages = snapshot.val();
        if (messages) {
            Object.values(messages)
                .sort((a, b) => a.timestamp - b.timestamp)
                .forEach(msg => {
                    appendMessage(msg.content, msg.type, false);
                });
            chatContent.scrollTop = chatContent.scrollHeight;
        }
    });
}

// Save message to database
async function saveMessage(content, type) {
    if (!currentUser) return;
    
    const messagesRef = ref(db, `messages/${currentUser.uid}`);
    await push(messagesRef, {
        content,
        type,
        timestamp: Date.now()
    });
}

// Keep empty welcome message
const welcomeMessage = '';

// Keep the simple message formatting
function appendMessage(message, type, save = true) {
    const messageElement = document.createElement("div");
    messageElement.textContent = message;
    messageElement.classList.add(`${type}-message`);
    chatContent.appendChild(messageElement);
    chatContent.scrollTop = chatContent.scrollHeight;

    if (save) {
        saveMessage(message, type);
    }
}

// Event Listeners
chatForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const userMessage = userInput.value.trim();
    if (!userMessage) return;

    // Display and save user message
    appendMessage(userMessage, "user");
    userInput.value = "";

    // Show loading state
    const loadingMessage = "Thinking...";
    const loadingElement = appendMessage(loadingMessage, "bot", false);

    try {
        // Get AI response
        const botResponse = await fetchResponse(userMessage);
        
        // Remove loading message
        chatContent.removeChild(chatContent.lastChild);
        
        // Display and save bot response
        appendMessage(botResponse, "bot");
    } catch (error) {
        console.error("Error getting response:", error);
        chatContent.removeChild(chatContent.lastChild);
        appendMessage("Sorry, I encountered an error. Please try again.", "bot");
    }
});

// Update initialization to not show welcome message
window.addEventListener("load", () => {
    // Empty initialization - no welcome message
});

// Update logout handler to clear chat and redirect
window.handleLogout = async function() {
    try {
        await signOut(auth);
        chatContent.innerHTML = ''; // Clear chat
        window.location.href = '../index.html';
    } catch (error) {
        console.error('Error signing out:', error);
    }
};

// Add auth state listener
onAuthStateChanged(auth, (user) => {
    if (!user) {
        window.location.href = '../login.html';
    }
});

// Add these functions to handle chat history

// Update startNewChat to not show welcome message
function startNewChat() {
    currentChatId = null;  // Reset current chat ID
    chatContent.innerHTML = '';
    document.querySelectorAll('.chat-item').forEach(item => {
        item.classList.remove('active');
    });
}

function formatDate(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === now.toDateString()) {
        return `Today at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } else if (date.toDateString() === yesterday.toDateString()) {
        return `Yesterday at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } else {
        return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
}

function updateChatHistory(chats) {
    const todayChats = document.getElementById('today-chats');
    const yesterdayChats = document.getElementById('yesterday-chats');
    const weekChats = document.getElementById('week-chats');

    todayChats.innerHTML = '';
    yesterdayChats.innerHTML = '';
    weekChats.innerHTML = '';

    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const weekAgo = new Date(now);
    weekAgo.setDate(weekAgo.getDate() - 7);

    Object.entries(chats).reverse().forEach(([chatId, chat]) => {
        const date = new Date(chat.timestamp);
        const chatItem = document.createElement('div');
        chatItem.className = 'chat-item';
        chatItem.dataset.chatId = chatId;
        
        // Add chat preview with timestamp
        chatItem.innerHTML = `
            <div class="chat-preview">
                <span class="chat-text">${chat.preview || 'New Chat'}</span>
                <span class="chat-time">${formatDate(chat.timestamp)}</span>
            </div>
        `;
        
        if (chatId === currentChatId) {
            chatItem.classList.add('active');
        }

        chatItem.onclick = () => loadChat(chatId);

        if (date.toDateString() === now.toDateString()) {
            todayChats.appendChild(chatItem);
        } else if (date.toDateString() === yesterday.toDateString()) {
            yesterdayChats.appendChild(chatItem);
        } else if (date > weekAgo) {
            weekChats.appendChild(chatItem);
        }
    });
}

function loadChat(chatId) {
    currentChatId = chatId;
    
    document.querySelectorAll('.chat-item').forEach(item => item.classList.remove('active'));
    const chatItem = document.querySelector(`[data-chat-id="${chatId}"]`);
    if (chatItem) {
        chatItem.classList.add('active');
    }
    
    const chatRef = ref(db, `chats/${currentUser.uid}/${chatId}/messages`);
    onValue(chatRef, (snapshot) => {
        chatContent.innerHTML = '';
        const messages = snapshot.val();
        if (messages) {
            Object.values(messages)
                .sort((a, b) => a.timestamp - b.timestamp)
                .forEach(msg => {
                    appendMessage(msg.content, msg.type, false);
                });
            chatContent.scrollTop = chatContent.scrollHeight;
        }
    });
}

