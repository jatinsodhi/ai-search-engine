import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import "./SearchEngine.css"; // Import external styles

const START_SOUND = "data:audio/mp3;base64,..."; // shortened for brevity
const END_SOUND = "data:audio/mp3;base64,...";

function Toast({ message, onClose, type = 'info' }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={`toast toast-${type}`}>
      {message}
    </div>
  );
}

function SearchEngine() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ message: "", type: "info" });
  const [isListening, setIsListening] = useState(false);
  const [recognition, setRecognition] = useState(null);
  const [searchDelay, setSearchDelay] = useState(null);

  const startSound = useRef(new Audio(START_SOUND));
  const endSound = useRef(new Audio(END_SOUND));
  const inputRef = useRef(null);

  const performSearch = async (searchQuery) => {
    if (!searchQuery.trim()) return;
    setLoading(true);
    try {
      const response = await axios.get(`http://localhost:5000/api/search?q=${encodeURIComponent(searchQuery)}`);
      setResults(response.data.organic_results || []);
      setToast({ message: "Search completed!", type: "success" });
    } catch {
      setToast({ message: "Error fetching results", type: "error" });
    }
    setLoading(false);
  };

  useEffect(() => {
    if (window.webkitSpeechRecognition) {
      const recognition = new window.webkitSpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
        startSound.current.play().catch(() => {});
        setToast({ message: "Listening...", type: "info" });
      };

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setQuery(transcript);
        setIsListening(false);
        endSound.current.play().catch(() => {});
        if (searchDelay) clearTimeout(searchDelay);
        const delay = setTimeout(() => performSearch(transcript), 2000);
        setSearchDelay(delay);
        setToast({ message: "Click search or wait 2 seconds", type: "info" });
        inputRef.current?.focus();
      };

      recognition.onerror = () => {
        setToast({ message: "Speech recognition error.", type: "error" });
        setIsListening(false);
      };

      recognition.onend = () => setIsListening(false);

      setRecognition(recognition);
    } else {
      setToast({ message: "Speech recognition unsupported.", type: "error" });
    }

    return () => {
      if (searchDelay) clearTimeout(searchDelay);
    };
  }, [window.webkitSpeechRecognition]);

  const handleVoiceSearch = () => {
    if (searchDelay) clearTimeout(searchDelay);
    if (recognition && !isListening) recognition.start();
    else if (recognition) recognition.stop();
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (searchDelay) clearTimeout(searchDelay);
    await performSearch(query);
  };

  const handleInputChange = (e) => {
    setQuery(e.target.value);
    if (searchDelay) clearTimeout(searchDelay);
  };

  return (
    <div className="search-container">
      {toast.message && <Toast message={toast.message} type={toast.type} onClose={() => setToast({ message: "", type: "info" })} />}
        {<h2><i>A descent Search engine. Search anything...</i></h2>}
      <form className="search-form" onSubmit={handleSearch}>
        <button className={`search-icon ${loading ? 'loading' : ''}`} type="submit">
          🔍
        </button>
        <input
          ref={inputRef}
          type="text"
          className="search-input"
          value={query}
          onChange={handleInputChange}
          placeholder={isListening ? "Listening..." : "Search..."}
          autoFocus
        />
        <button type="button" className={`mic-button ${isListening ? 'listening' : ''}`} onClick={handleVoiceSearch}>
          🎤
        </button>
      </form>

      {loading && <div className="loading-dots"><span></span><span></span><span></span></div>}

      <ul className="results-list">
        {results.map((result) => (
          <li key={result.position} className="result-item">
            <a href={result.link} target="_blank" rel="noopener noreferrer" className="result-title">
              {result.title}
            </a>
            <p className="result-snippet">{result.snippet}</p>
            <small className="result-link">{result.displayed_link}</small>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default SearchEngine;
