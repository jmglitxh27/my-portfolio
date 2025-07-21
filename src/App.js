import React, { useState, useRef, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';


// Main App Component - This now contains everything
const App = () => {
    // Ref for the video element to ensure it plays inline
    const videoRef = useRef(null);

    // Chatbot specific states and refs
    const [isChatbotOpen, setIsChatbotOpen] = useState(false); // Renamed to avoid conflict with App's isOpen
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const chatContainerRef = useRef(null);
    const [userId, setUserId] = useState(null); // State to store the user ID
    const [isAuthReady, setIsAuthReady] = useState(false); // State to track auth readiness

    // Initialize Firebase and handle authentication for the chatbot
    useEffect(() => {
        const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
        const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : {};

        let app;
        try {
            app = initializeApp(firebaseConfig);
        } catch (error) {
            console.error("Firebase initialization error:", error);
            return;
        }

        const auth = getAuth(app);
        const db = getFirestore(app); // Get Firestore instance

        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                setUserId(user.uid);
            } else {
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
            setIsAuthReady(true);
        });

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

        const GEMINI_API_KEY = ""; // Canvas environment will provide this
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;

        try {
            const chatHistory = newMessages.map(msg => ({
                role: msg.sender === 'user' ? 'user' : 'model',
                parts: [{ text: msg.text }]
            }));

            const payload = {
                contents: chatHistory,
                generationConfig: {
                    maxOutputTokens: 100,
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


    // General App useEffect for video and smooth scrolling
    useEffect(() => {
        // Smooth scrolling for navigation links
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function (e) {
                e.preventDefault();
                const targetId = this.getAttribute('href');
                const targetElement = document.querySelector(targetId);
                if (targetElement) {
                    targetElement.scrollIntoView({
                        behavior: 'smooth'
                    });
                }
            });
        });

        // Ensure video plays inline on iOS
        if (videoRef.current) {
            videoRef.current.play().catch(error => {
                console.error("Video autoplay failed:", error);
            });
        }
    }, []);

    return (
        <div className="antialiased">
            {/* Tailwind CSS CDN and Font */}
            <script src="https://cdn.tailwindcss.com"></script>
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

            {/* Video Background */}
            <video autoPlay loop muted playsInline id="videoBackground" ref={videoRef} className="fixed top-0 left-0 w-full h-full object-cover z-[-1] blur-[1px] opacity-[0.9]">
                {/* IMPORTANT: Ensure 'rubix_bg.mp4' is in your public folder */}
                <source src="/rubix_bg.mp4" type="video/mp4" />
                Your browser does not support the video tag.
            </video>

            {/* Header Section */}
            <Header />

            {/* Hero Section - About Me Introduction with Video Background */}
            <Hero />

            {/* About Section */}
            <About />

            {/* Skills Section */}
            <Skills />

            {/* Projects Section */}
            <Projects />

            {/* Contact Section */}
            <Contact />

            {/* Footer Section */}
            <Footer />

            {/* Chatbot Toggle Button */}
            <button
                onClick={() => setIsChatbotOpen(!isChatbotOpen)}
                className="fixed bottom-6 right-6 bg-indigo-600 hover:bg-indigo-700 text-white p-4 rounded-full shadow-lg z-50 transition-all duration-300 transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-gray-900"
                aria-label="Open Chatbot"
            >
                {isChatbotOpen ? (
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
            {isChatbotOpen && (
                <div className="fixed bottom-20 right-6 w-80 h-96 bg-gray-800 rounded-lg shadow-xl flex flex-col z-40 border border-gray-700 overflow-hidden sm:w-96 sm:h-[450px] md:w-[400px] md:h-[500px]">
                    <div className="bg-indigo-600 text-white p-3 rounded-t-lg flex items-center justify-between">
                        <h3 className="font-bold text-lg">AI Assistant</h3>
                        {userId && <span className="text-sm text-gray-200">User ID: {userId.substring(0, 8)}...</span>}
                        <button onClick={() => setIsChatbotOpen(false)} className="text-white hover:text-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-indigo-600 rounded-full p-1">
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
        </div>
    );
};

// Header Component
const Header = () => {
    return (
        <header className="bg-black text-white p-4 shadow-lg sticky top-0 z-50">
            <nav className="container mx-auto flex justify-between items-center px-4">
                <a href="#" className="text-2xl font-bold text-indigo-400 hover:text-indigo-300 transition duration-300 ease-in-out">
                    Alejandro Chavez-Mayoral
                </a>
                <ul className="flex space-x-6">
                    <li><a href="#about" className="hover:text-indigo-400 transition duration-300 ease-in-out">About</a></li>
                    <li><a href="#skills" className="hover:text-indigo-400 transition duration-300 ease-in-out">Skills</a></li>
                    <li><a href="#projects" className="hover:text-indigo-400 transition duration-300 ease-in-out">Projects</a></li>
                    <li><a href="#contact" className="hover:text-indigo-400 transition duration-300 ease-in-out">Contact</a></li>
                </ul>
            </nav>
        </header>
    );
};

// Hero Component
const Hero = () => {
    return (
        <section id="hero" className="relative h-[70vh] flex items-center justify-center text-center p-4 overflow-hidden">
            <div className="hero-content max-w-4xl mx-auto bg-black bg-opacity-20 p-8 rounded-lg backdrop-blur-sm">
                <h1 className="text-5xl md:text-6xl font-extrabold text-white leading-tight mb-4 animate-fade-in-down">
                    Hi, I'm <span className="text-indigo-400">Alejandro</span>
                </h1>
                <p className="text-xl md:text-2xl text-gray-300 mb-8 animate-fade-in-up">
                    A passionate <span className="font-semibold text-indigo-300">comp sci researcher</span> crafting engaging digital experiences.
                </p>
                <a href="#projects" className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-8 rounded-full shadow-lg transform hover:scale-105 transition duration-300 ease-in-out">
                    View My Work
                </a>
            </div>
        </section>
    );
};

// About Component
const About = () => {
    return (
        <section id="about" className="py-16 md:py-24 bg-gray-900 px-4">
            <div className="container mx-auto max-w-4xl">
                <h2 className="text-4xl font-bold text-center text-indigo-400 mb-12">About Me</h2>
                <div className="flex flex-col md:flex-row items-center md:space-x-12">
                    <div className="md:w-1/3 mb-8 md:mb-0">
                        <img src="profile_picture.PNG" alt="Your Photo" className="rounded-full shadow-2xl border-4 border-indigo-500 w-48 h-48 mx-auto md:w-full md:h-auto object-cover" />
                    </div>
                    <div className="md:w-3/4 text-lg text-gray-300 leading-relaxed">
                        <p className="mb-4">
                            Hello! I'm Alejandro Chavez-Mayoral, a research-oriented senior pursuing a B.S. in Computer Science, and currently advancing my expertise as an M.S. in Computer Information Systems student at Kean University.
                        </p>
                        <p className="mb-4">
                            With two years of dedicated experience in image processing, computer vision, and AI research at Kean University, complemented by a summer REU at the University of Rochester, I am passionate about leveraging technology to solve complex problems. I have extensive experience coding in Python for various research projects and have also tutored Java fundamentals for two-and-a-half years.
                        </p>
                        <p>
                            My work has involved training AI models, programming GUIs for data visualization, and working in Linux environments. I am actively seeking full-time employment in AI/tech-related roles where I can apply my skills and continue to grow. I am also bilingual in English and Spanish.
                        </p>
                    </div>
                </div>
            </div>
        </section>
    );
};

// Skills Component
const Skills = () => {
    const skillsList = [
        { name: 'Java', icon: '☕', imageUrl: 'Java.png' },
        { name: 'Python', icon: '🐍', imageUrl: 'Python.png' },
        { name: 'PHP', icon: '🐘', imageUrl: 'PHP.png' },
        { name: 'MySQL', icon: '🐬', imageUrl: 'MySQL.png' },
        { name: 'HTML', icon: '📄', imageUrl: 'HTML.png' },
        { name: 'Microsoft Office', icon: '📊', imageUrl: 'Office.png' },
        { name: 'Linux Fedora', icon: '🐧', imageUrl: 'Fedora.png' },
        { name: 'MATLAB', icon: '📈', imageUrl: 'MATLAB.png' }
    ];

    return (
        <section id="skills" className="py-16 md:py-24 bg-black px-4">
            <div className="container mx-auto max-w-4xl">
                <h2 className="text-4xl font-bold text-center text-indigo-400 mb-12">My Skills</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
                    {skillsList.map((skill, index) => (
                        <div key={index} className="bg-gray-800 p-6 rounded-lg shadow-xl text-center transform hover:scale-105 transition duration-300 ease-in-out border border-gray-700">
                            {skill.imageUrl ? (
                                <img
                                    src={skill.imageUrl}
                                    alt={`${skill.name} Icon`}
                                    className="mx-auto mb-4 w-16 h-16 rounded-full bg-indigo-600 p-2 object-contain"
                                    onError={(e) => {
                                        e.target.style.display = 'none';
                                        const parentDiv = e.target.closest('div');
                                        if (parentDiv) {
                                            const emojiDiv = document.createElement('div');
                                            emojiDiv.className = 'mx-auto mb-4 w-16 h-16 rounded-full bg-indigo-600 p-2 flex items-center justify-center text-4xl';
                                            emojiDiv.textContent = skill.icon;
                                            parentDiv.insertBefore(emojiDiv, e.target);
                                        }
                                        console.error(`Failed to load image: ${skill.imageUrl}. Displaying emoji fallback.`);
                                    }}
                                />
                            ) : (
                                <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-indigo-600 p-2 flex items-center justify-center text-4xl">
                                    {skill.icon}
                                </div>
                            )}
                            <h3 className="text-xl font-semibold text-white">{skill.name}</h3>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

// Projects Component
const Projects = () => {
    const projectsList = [
        {
            title: 'Deep Learning-Based Classification of Pain Responses in Mice',
            date: 'Apr 2024',
            description: 'Developed a deep learning model for binary classification of mice pain using CNN architecture with a fully connected layer and sigmoid activation. Model developed using Python.',
            imageUrl: 'MousePain.jpg',
            liveLink: '#',
            githubLink: '#'
        },
        {
            title: 'Machine Learning Analysis of Olfactory-Guided Food Seeking Behavior',
            date: 'Jul 2023',
            description: 'Researched classifying videos of mice displaying anoxia from anoxia related behavior by training a mammalian tracking model and using motion sequencing software. Primarily used Python.',
            imageUrl: 'DeepLearning.jpg',
            liveLink: '#',
            githubLink: '#'
        },
        {
            title: 'Banking System and Database Using MySQL and PHP',
            date: 'May 2023',
            description: 'Programmed a mini banking system with HTML front-end and PHP/MySQL backend. Users could deposit, withdraw, view transaction history, and log in to a specific account.',
            imageUrl: 'Banking.jpg',
            liveLink: '#',
            githubLink: '#'
        },
        {
            title: 'Pre-Screening Vitals in Telehealth Using Remote Photoplethysmography',
            date: 'Sep 2022',
            description: 'Research tested measuring heart rate using image processing/computer vision methods on a diverse dataset of faces in different lightings. Discussed accuracy and practicality. Primarily used Python.',
            imageUrl: 'Telehealth.PNG',
            liveLink: 'https://docs.google.com/presentation/d/1PsCYDHTr3hrXptPEoMQ7KMT_ej3YyEQA/edit?usp=sharing&ouid=117950792585934078015&rtpof=true&sd=true',
            githubLink: '#'
        },
    ];

    return (
        <section id="projects" className="py-16 md:py-24 bg-gray-900 px-4">
            <div className="container mx-auto max-w-6xl w-full">
                <h2 className="text-4xl font-bold text-center text-indigo-400 mb-12">My Projects</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {projectsList.map((project, index) => (
                        <div key={index} className="bg-gray-700 rounded-lg shadow-xl overflow-hidden transform hover:scale-105 transition duration-300 ease-in-out border border-gray-700">
                            <img src={project.imageUrl} alt={`${project.title} Image`} className="w-full h-48 object-cover" onError={(e) => { e.target.src = 'https://placehold.co/600x400/444444/e0e0e0?text=Image+Not+Found'; }} />
                            <div className="p-6">
                                <h3 className="text-2xl font-semibold text-white mb-2">{project.title}</h3>
                                {project.date && <p className="text-sm text-gray-500 mb-2">{project.date}</p>}
                                <p className="text-gray-300 mb-4">{project.description}</p>
                                <div className="flex justify-between items-center">
                                    <a href={project.liveLink} target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:text-indigo-300 font-semibold transition duration-300 ease-in-out">View Live</a>
                                    <a href={project.githubLink} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition duration-300 ease-in-out">GitHub</a>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

// Contact Component
const Contact = () => {
    return (
        <section id="contact" className="py-16 md:py-24 bg-gray-900 px-4">
            <div className="container mx-auto max-w-4xl text-center">
                <h2 className="text-4xl font-bold text-indigo-400 mb-8">Get In Touch</h2>
                <p className="text-lg text-gray-300 mb-8">
                    I'm always open to new opportunities and collaborations. Feel free to reach out!
                </p>
                <div className="flex flex-col items-center space-y-4 mb-8">
                    <a href="mailto:your.email@example.com" className="text-indigo-300 hover:text-indigo-400 text-xl flex items-center space-x-2 transition duration-300 ease-in-out">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8m-2 4v7a2 2 0 01-2 2H5a2 2 0 01-2-2v-7m3 4l4-4m-4 4l-4-4m12 0l4 4m-4-4l4-4"/>
                        </svg>
                        <span>your.email@example.com</span>
                    </a>
                    <div className="flex space-x-6 mt-4">
                        <a href="https://linkedin.com/in/yourprofile" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition duration-300 ease-in-out">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M4.98 3.5c0 1.381-1.11 2.5-2.48 2.5s-2.48-1.119-2.48-2.5c0-1.38 1.11-2.5 2.48-2.5s2.48 1.12 2.48 2.5zm.02 4.5h-5v16h5v-16zm7.982 0h-4.98v16h4.98v-8.798c0-2.668 1.452-3.89 3.337-3.89 1.951 0 2.767 1.125 2.767 3.218v9.47h5v-10.13c0-4.636-2.883-7.13-6.635-7.13-3.154 0-4.66 1.714-5.465 2.998h-.04v-2.108h-4.98z"/>
                            </svg>
                        </a>
                        <a href="https://github.com/yourprofile" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition duration-300 ease-in-out">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.08-.731.084-.716.084-.716 1.192.085 1.815 1.229 1.815 1.229 1.064 1.816 2.809 1.299 3.49.993.108-.775.418-1.299.762-1.599-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.118-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.046.138 3.003.404 2.292-1.552 3.3-.928 3.3-.928.654 1.652.243 2.873.12 3.176.766.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.197-6.091 8.197-11.387 0-6.627-5.373-12-12-12z"/>
                            </svg>
                        </a>
                    </div>
                </div>
            </div>
        </section>
    );
};

// Footer Component
const Footer = () => {
    return (
        <footer className="bg-black text-gray-500 py-6 text-center text-sm border-t border-gray-800 px-4">
            <p>&copy; 2025 Alejandro Chavez-Mayoral. All rights reserved.</p>
        </footer>
    );
};

export default App;
