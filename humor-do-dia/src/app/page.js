"use client";
import { useState } from "react";
import styles from "./page.module.css";
import Confetti from "react-confetti";
import { emojiMap, coworkers } from "./appData";


function isCoworker(name) {
  return coworkers.includes(name.trim().toLowerCase());
}

function getRandomEmoji(note) {
  const emojis = emojiMap[note] || [];
  return emojis.length > 0 ? emojis[Math.floor(Math.random() * emojis.length)] : "";
}

export default function Home() {
  const [name, setName] = useState("");
  const [note, setNote] = useState(5);
  const [desc, setDesc] = useState("");
  const [emoji, setEmoji] = useState(getRandomEmoji(5));
  const today = new Date().toLocaleDateString("pt-BR");

  function handleNoteChange(e) {
    const value = Number(e.target.value);
    setNote(value);
    setEmoji(getRandomEmoji(value));
  }

  const isSpecial = isCoworker(name);

  return (
    <div className={styles.page} style={isSpecial ? { background: "#e0f7fa" } : {}}>
      {note === 10 && <Confetti />}
      <main className={styles.main}>
        <h1>Humor do Dia</h1>
        {isSpecial && (
          <div style={{ color: "#00796b", fontWeight: "bold", marginBottom: 10 }}>
            Olá, {name}! Que bom te ver por aqui! 🎉
          </div>
        )}
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
        <div className={styles.box}>
          <label>Descrição:</label>
          <input
            type="text"
            value={desc}
            onChange={e => setDesc(e.target.value)}
            placeholder="Digite uma descrição"
          />
        </div>
      </main>
    </div>
  );
}