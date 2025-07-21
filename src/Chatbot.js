import React, { useState, useRef, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Main App component that wraps the Chatbot
const App = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const chatContainerRef = useRef(null);
    const [userId, setUserId] = useState(null); // State to store the user ID
    const [isAuthReady, setIsAuthReady] = useState(false); // State to track auth readiness

    // Initialize Firebase and handle authentication
    useEffect(() => {
        const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
        const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : {};

        // Initialize Firebase app if not already initialized
        let app;
        try {
            app = initializeApp(firebaseConfig);
        } catch (error) {
            console.error("Firebase initialization error:", error);
            return;
        }

        const auth = getAuth(app);
        const db = getFirestore(app); // Get Firestore instance

        // Listen for authentication state changes
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                // User is signed in
                setUserId(user.uid);
            } else {
                // User is signed out, sign in anonymously
                try {
                    if (typeof __initial_auth_token !== 'undefined') {
                        await signInWithCustomToken(auth, __initial_auth_token);
                    } else {
                        await signInAnonymously(auth);
                    }
                } catch (error) {
                    console.error("Firebase anonymous sign-in error:", error);
                }
            }
            setIsAuthReady(true); // Mark authentication as ready
        });

        // Cleanup subscription on unmount
        return () => unsubscribe();
    }, []);

    // Scroll to the bottom of the chat on new messages
    useEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (input.trim() === '') return;

        const newMessages = [...messages, { sender: 'user', text: input }];
        setMessages(newMessages);
        setInput('');

        // API Key for Gemini API (left empty for Canvas environment to provide)
        const GEMINI_API_KEY = "";
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;

        try {
            // Prepare chat history for the API request
            const chatHistory = newMessages.map(msg => ({
                role: msg.sender === 'user' ? 'user' : 'model',
                parts: [{ text: msg.text }]
            }));

            const payload = {
                contents: chatHistory,
                generationConfig: {
                    maxOutputTokens: 100, // Limit response length
                },
            };

            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const result = await response.json();

            let botResponseText = "Sorry, I'm having trouble connecting right now. Please try again later.";
            if (result.candidates && result.candidates.length > 0 &&
                result.candidates[0].content && result.candidates[0].content.parts &&
                result.candidates[0].content.parts.length > 0) {
                botResponseText = result.candidates[0].content.parts[0].text;
            } else {
                console.error("Unexpected API response structure:", result);
            }

            setMessages(prevMessages => [...prevMessages, { sender: 'bot', text: botResponseText }]);
        } catch (error) {
            console.error("Error communicating with Gemini API:", error);
            setMessages(prevMessages => [...prevMessages, { sender: 'bot', text: "Sorry, I'm having trouble connecting right now. Please try again later." }]);
        }
    };

    return (
        <>
            {/* Tailwind CSS CDN */}
            <script src="https://cdn.tailwindcss.com"></script>
            {/* Inter Font */}
            <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
            <style>
                {`
                body {
                    font-family: 'Inter', sans-serif;
                }
                .custom-scrollbar::-webkit-scrollbar {
                    width: 8px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: #374151; /* gray-700 */
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #4f46e5; /* indigo-600 */
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: #4338ca; /* indigo-700 */
                }
                `}
            </style>

            {/* Chatbot Toggle Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="fixed bottom-6 right-6 bg-indigo-600 hover:bg-indigo-700 text-white p-4 rounded-full shadow-lg z-50 transition-all duration-300 transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-gray-900"
                aria-label="Open Chatbot"
            >
                {isOpen ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                    </svg>
                )}
            </button>

            {/* Chatbot Window */}
            {isOpen && (
                <div className="fixed bottom-20 right-6 w-80 h-96 bg-gray-800 rounded-lg shadow-xl flex flex-col z-40 border border-gray-700 overflow-hidden sm:w-96 sm:h-[450px] md:w-[400px] md:h-[500px]">
                    <div className="bg-indigo-600 text-white p-3 rounded-t-lg flex items-center justify-between">
                        <h3 className="font-bold text-lg">AI Assistant</h3>
                        {userId && <span className="text-sm text-gray-200">User ID: {userId.substring(0, 8)}...</span>} {/* Display truncated user ID */}
                        <button onClick={() => setIsOpen(false)} className="text-white hover:text-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-indigo-600 rounded-full p-1">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                    <div ref={chatContainerRef} className="flex-1 p-4 overflow-y-auto custom-scrollbar">
                        {messages.length === 0 && (
                            <p className="text-gray-400 text-center italic">Type a message to start chatting!</p>
                        )}
                        {messages.map((msg, index) => (
                            <div
                                key={index}
                                className={`mb-2 p-2 rounded-lg max-w-[80%] break-words ${
                                    msg.sender === 'user' ? 'bg-indigo-700 text-white ml-auto' : 'bg-gray-700 text-gray-200 mr-auto'
                                }`}
                            >
                                {msg.text}
                            </div>
                        ))}
                    </div>
                    <form onSubmit={handleSendMessage} className="p-3 border-t border-gray-700 flex">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Type your message..."
                            className="flex-1 bg-gray-900 text-white rounded-l-md p-2 outline-none focus:ring-2 focus:ring-indigo-500 placeholder-gray-500"
                            aria-label="Type your message"
                        />
                        <button
                            type="submit"
                            className="bg-indigo-600 hover:bg-indigo-700 text-white p-2 rounded-r-md transition duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-gray-900"
                        >
                            Send
                        </button>
                    </form>
                </div>
            )}
        </>
    );
};

export default App;
