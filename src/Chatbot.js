import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenerativeAI } from '@google/generative-ai';

const Chatbot = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const chatContainerRef = useRef(null);

    // Replace with your actual Gemini API Key
    const GEMINI_API_KEY = 
'AIzaSyAeXeomhUFhQoVAwF6sLHiV2F5yd-WO-Rg'; 

    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

    // Scroll to the bottom of the chat on new messages
    useEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = 
chatContainerRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (input.trim() === '') return;

        const newMessages = [...messages, { sender: 'user', 
text: input }];
        setMessages(newMessages);
        setInput('');

        try {
            const model = genAI.getGenerativeModel({ model: 
'gemini-pro' });
            const chat = model.startChat({
                history: newMessages.map(msg => ({
                    role: msg.sender === 'user' ? 'user' : 
'model',
                    parts: [{ text: msg.text }]
                })),
                generationConfig: {
                    maxOutputTokens: 100, // Limit response 
length
                },
            });

            const result = await chat.sendMessage(input);
            const response = await result.response;
            const text = response.text();

            setMessages(prevMessages => [...prevMessages, { 
sender: 'bot', text }]);
        } catch (error) {
            console.error("Error communicating with Gemini 
API:", error);
            setMessages(prevMessages => [...prevMessages, { 
sender: 'bot', text: "Sorry, I'm having trouble connecting right 
now. Please try again later." }]);
        }
    };

    return (
        <>
            {/* Chatbot Toggle Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="fixed bottom-6 right-6 bg-indigo-600 
hover:bg-indigo-700 text-white p-4 rounded-full shadow-lg z-50 
transition-all duration-300 transform hover:scale-110"
                aria-label="Open Chatbot"
            >
                {isOpen ? (
                    <svg xmlns="http://www.w3.org/2000/svg" 
className="h-7 w-7" fill="none" viewBox="0 0 24 24" 
stroke="currentColor">
                        <path strokeLinecap="round" 
strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" 
/>
                    </svg>
                ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" 
className="h-7 w-7" fill="none" viewBox="0 0 24 24" 
stroke="currentColor">
                        <path strokeLinecap="round" 
strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 
10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 
01-2 2h-5l-5 5v-5z" />
                    </svg>
                )}
            </button>

            {/* Chatbot Window */}
            {isOpen && (
                <div className="fixed bottom-20 right-6 w-80 
h-96 bg-gray-800 rounded-lg shadow-xl flex flex-col z-40 border 
border-gray-700">
                    <div className="bg-indigo-600 text-white p-3 
rounded-t-lg flex items-center justify-between">
                        <h3 className="font-bold text-lg">AI 
Assistant</h3>
                        <button onClick={() => setIsOpen(false)} 
className="text-white hover:text-gray-200">
                            <svg 
xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" 
fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" 
strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" 
/>
                            </svg>
                        </button>
                    </div>
                    <div ref={chatContainerRef} 
className="flex-1 p-4 overflow-y-auto custom-scrollbar">
                        {messages.length === 0 && (
                            <p className="text-gray-400 
text-center italic">Type a message to start chatting!</p>
                        )}
                        {messages.map((msg, index) => (
                            <div
                                key={index}
                                className={`mb-2 p-2 rounded-lg 
max-w-[80%] ${
                                    msg.sender === 'user' ? 
'bg-indigo-700 text-white ml-auto' : 'bg-gray-700 text-gray-200 
mr-auto'
                                }`}
                            >
                                {msg.text}
                            </div>
                        ))}
                    </div>
                    <form onSubmit={handleSendMessage} 
className="p-3 border-t border-gray-700 flex">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => 
setInput(e.target.value)}
                            placeholder="Type your message..."
                            className="flex-1 bg-gray-900 
text-white rounded-l-md p-2 outline-none focus:ring-2 
focus:ring-indigo-500"
                        />
                        <button
                            type="submit"
                            className="bg-indigo-600 
hover:bg-indigo-700 text-white p-2 rounded-r-md transition 
duration-200"
                        >
                            Send
                        </button>
                    </form>
                </div>
            )}
        </>
    );
};

export default Chatbot;
