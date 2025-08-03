import { useState, useEffect } from "react";

function getTodayKey(today) {
  return "humor_" + today;
}

function loadResults(today) {
  const key = getTodayKey(today);
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : {};
}


export default function ResultsBox({ today, name, note, desc, setNote, setDesc, emoji }) {
  const [results, setResults] = useState({});

  useEffect(() => {
    Object.keys(localStorage).forEach((key) => {
      if (key.startsWith("humor_") && key !== getTodayKey(today)) {
        localStorage.removeItem(key);
      }
    });
    setResults(loadResults(today));
  }, [today]);

  useEffect(() => {
    setResults(loadResults(today));
  }, [today]);

    function saveResult(today, name, note, desc, emoji) {
      const key = getTodayKey(today);
      const results = loadResults(today);
      const lowerName = name.trim().toLowerCase();
      // Mantém o emoji salvo se já existir, senão usa o emoji da prop
      results[lowerName] = {
        note,
        desc,
        emoji: results[lowerName]?.emoji || emoji
      };
      localStorage.setItem(key, JSON.stringify(results));
    }

  function handleSave() {
    if (!name) return;
    saveResult(today, name, note, desc, emoji);
    setResults(loadResults(today));
  }

  function handleReset() {
    localStorage.removeItem(getTodayKey(today));
    setResults({});
    setNote("");
    setDesc("");
  }

  useEffect(() => {
    const res = results[name.trim().toLowerCase()];
    if (res) {
      setNote(res.note);
      setDesc(res.desc);
    }
  }, [name, results, setNote, setDesc]);

  return (
    <div>
      <div style={{ marginTop: 16 }}>
        <div style={{ marginBottom: 24 }}>
          <button
            onClick={handleSave}
            style={{
              backgroundColor: "#4CAF50",
              color: "white",
              border: "none",
              padding: "8px 16px",
              borderRadius: "4px",
              cursor: "pointer",
              marginRight: "8px"
            }}
          >
            Salvar
          </button>
          <button
            onClick={handleReset}
            style={{
              backgroundColor: "#f44336",
              color: "white",
              border: "none",
              padding: "8px 16px",
              borderRadius: "4px",
              cursor: "pointer"
            }}
          >
            Reset
          </button>
        </div>
        <h3>Resultados de hoje:</h3>
        <ul>
          {Object.entries(results).map(([n, r]) => (
            <li key={n}>
              <b>{n}</b>: {r.note} - <span style={{ fontSize: "1.5em", marginLeft: 4 }}>{r.emoji}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}