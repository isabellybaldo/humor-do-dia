"use client";
import { useState, useEffect } from "react";
import styles from "./page.module.css";
import Confetti from "react-confetti";
import { emojiMap, coworkers, coworkerGifs } from "./appData";
import ResultsBox from "./resultsBox";



// Functions for handling coworker logic and emojis
function isCoworker(name) {
  return coworkers.includes(name.trim().toLowerCase());
}

function getRandomEmoji(note) {
  const emojis = emojiMap[note] || [];
  return emojis.length > 0 ? emojis[Math.floor(Math.random() * emojis.length)] : "";
}

// Actual main component
export default function Home() {
  const [name, setName] = useState("");
  const [note, setNote] = useState(5);
  const [desc, setDesc] = useState("");
  const [emoji, setEmoji] = useState("");
  const [today, setToday] = useState("");

  // Effect to initialize emoji and today's date
  useEffect(() => {
    setEmoji(getRandomEmoji(5));
    setToday(new Date().toLocaleDateString("pt-BR"));
  }, []);

  // Handler of change to the note input
  function handleNoteChange(e) {
    const value = Number(e.target.value);
    setNote(value);
    setEmoji(getRandomEmoji(value));
  }

  // Coworker logic
  const isSpecial = isCoworker(name);
  const lowerName = name.trim().toLowerCase();
  const gif = coworkerGifs[lowerName];

  return (
      <div
        className={styles.page}
        style={{
          background: "#181c25", // sempre dark
          color: "#f4f6f8"
        }}
      >
      {note === 10 && <Confetti />}
      <main className={styles.main}>
        <h1>Humor do Dia</h1>
        <div className={styles.box}>
          <label>Data de hoje:</label>
          <div>{today}</div>
        </div>
        <div className={styles.box}>
          <label>Seu nome:</label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Digite seu nome"
          />
          {isSpecial && gif && (
            <div className={styles.specialMessage} style={{ marginTop: 8 }}>
              <img
                src={gif}
                alt="Celebrando"
                style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: 8 }}
              />
            </div>
          )}
        </div>
        <div className={styles.box}>
          <label>Como está seu humor hoje?:</label>
          <input
            type="number"
            min={1}
            max={10}
            value={note}
            onChange={handleNoteChange}
          />
          <div style={{ fontSize: "2rem" }}>{emoji}</div>
        </div>
        <ResultsBox
          today={today}
          name={name}
          note={note}
          desc={desc}
          setNote={setNote}
          setDesc={setDesc}
          emoji={emoji}
        />
      </main>
    </div>
  );
}