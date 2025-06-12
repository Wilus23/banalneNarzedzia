'use client';
import { useState, useEffect, useRef } from 'react';

export default function HomePage() {
  const audioRef = useRef(null);

  const handlePlayMusic = () => {
    if (audioRef.current) {
      audioRef.current.muted = false;
      audioRef.current.play();
    }
  };

  const handleStopMusic = () => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
  };

  // Flagi i stany gry
  const [assassinateUsed, setAssassinateUsed] = useState(false);
  const [assassinationMode, setAssassinationMode] = useState(false);
  const [edwardAlive, setEdwardAlive] = useState(true);
  const [gameFinished, setGameFinished] = useState(false);
  const [victoryBanner, setVictoryBanner] = useState(null);

  // Blokada kolejki
  const [turnInProgress, setTurnInProgress] = useState(false);

  // Klasy postaci
  class Assasin {
    constructor(imie, hp, dmg, maxHp) {
      this.imie = imie;
      this.hp = hp;
      this.maxHp = maxHp;
      this.dmg = dmg;
      this.side = 'assasin';
    }

    atak(przeciwnik) {
      if (this.hp <= 0) return przeciwnik.hp;
      if (przeciwnik.hp <= 0) {
        logToTerminal(`${this.imie} próbuje zaatakować ${przeciwnik.imie}, ale ten już nie żyje!`);
        return przeciwnik.hp;
      }
      logToTerminal(`${this.imie} atakuje ${przeciwnik.imie}. Obecne HP ${przeciwnik.imie}: ${przeciwnik.hp}`);
      const newHp = Math.max(przeciwnik.hp - this.dmg, 0);
      logToTerminal(`${this.imie} zadaje ${this.dmg} dmg ${przeciwnik.imie}. Nowe HP: ${newHp}`);
      animateAttack(this.imie, 'attack');
      return newHp;
    }

    assasinate(przeciwnik) {
      if (this.hp <= 0) return przeciwnik.hp;
      if (przeciwnik.hp <= 0) {
        logToTerminal(`${this.imie} próbuje wykonać assassinate na ${przeciwnik.imie}, który już nie żyje!`);
        return przeciwnik.hp;
      }
      logToTerminal(`${this.imie} wykonuje Assassinate na ${przeciwnik.imie}. ${przeciwnik.imie} ginie! 💀`);
      animateAttack(this.imie, 'assassinate');
      return 0;
    }

    regeneracja() {
      if (this.hp <= 0) return this.hp;
      const regenAmount = 100;
      const newHp = Math.min(this.hp + regenAmount, this.maxHp);
      logToTerminal(`${this.imie} regeneruje ${newHp - this.hp} HP. Teraz: ${newHp} / ${this.maxHp}`);
      animateAttack(this.imie, 'regenerate');
      return newHp;
    }
  }

  class Templar {
    constructor(imie, hp, dmg, maxHp) {
      this.imie = imie;
      this.hp = hp;
      this.maxHp = maxHp;
      this.dmg = dmg;
      this.side = 'templar';
    }

    szybkiAtak(przeciwnik) {
      if (this.hp <= 0) return przeciwnik.hp;
      if (przeciwnik.hp <= 0) {
        logToTerminal(`${this.imie} próbuje wykonać szybki atak na ${przeciwnik.imie}, który już nie żyje!`);
        return przeciwnik.hp;
      }
      logToTerminal(`${this.imie} wykonuje szybki atak na ${przeciwnik.imie}. Obecne HP ${przeciwnik.imie}: ${przeciwnik.hp}`);
      const newHp = Math.max(przeciwnik.hp - this.dmg, 0);
      logToTerminal(`${this.imie} zadaje ${this.dmg} dmg ${przeciwnik.imie}. Nowe HP: ${newHp}`);
      animateAttack(this.imie, 'attack');
      return newHp;
    }

    ciezkiAtak(przeciwnik) {
      if (this.hp <= 0) return przeciwnik.hp;
      if (przeciwnik.hp <= 0) {
        logToTerminal(`${this.imie} próbuje wykonać ciężki atak na ${przeciwnik.imie}, który już nie żyje!`);
        return przeciwnik.hp;
      }
      logToTerminal(`${this.imie} wykonuje ciężki atak na ${przeciwnik.imie}. Obecne HP ${przeciwnik.imie}: ${przeciwnik.hp}`);
      const dmg2 = this.dmg * 2;
      const newHp = Math.max(przeciwnik.hp - dmg2, 0);
      logToTerminal(`${this.imie} zadaje ${dmg2} dmg ${przeciwnik.imie} (ciężki atak). Nowe HP: ${newHp}`);
      animateAttack(this.imie, 'heavy-attack');
      return newHp;
    }
  }

  // Początkowy stan Edwarda
  const [edwardHP, setEdwardHP] = useState(400);
  // Logi
  const [logs, setLogs] = useState([]);

  // Postacie startowe
  const initialCharacters = [
    { id: 'ezio', instance: new Assasin('Ezio', 450, 90, 450) },
    { id: 'altair', instance: new Assasin('Altair', 350, 80, 350) },
    { id: 'haytam', instance: new Templar('Haytam', 500, 100, 500) },
    { id: 'rodrigo', instance: new Templar('Rodrigo', 550, 95, 550) },
    { id: 'cesare', instance: new Templar('Cesare', 600, 110, 600) },
  ];
  const [characters, setCharacters] = useState(initialCharacters);

  // Edward zaktualizowany pod kątem HP
  const Edward = new Assasin('Edward', edwardHP, 80, 400);
  // Logowanie
  function logToTerminal(msg) {
    setLogs((prev) => [...prev, msg]);
    console.log(msg);
    setTimeout(() => {
      const terminalEl = document.getElementById('terminal');
      if (terminalEl) {
        terminalEl.scrollTop = terminalEl.scrollHeight;
      }
    }, 100);
  }

  // Animacja
  function animateAttack(characterName, animationClass) {
    let elId = '';
    if (characterName === 'Edward') elId = 'edward';
    if (characterName === 'Ezio') elId = 'ezio';
    if (characterName === 'Altair') elId = 'altair';
    if (characterName === 'Haytam') elId = 'haytam';
    if (characterName === 'Rodrigo') elId = 'rodrigo';
    if (characterName === 'Cesare') elId = 'cesare';

    if (!elId) return;
    const el = document.getElementById(elId);
    if (!el) return;
    el.classList.remove('attack', 'heavy-attack', 'assassinate', 'regenerate');
    void el.offsetWidth;
    el.classList.add(animationClass);
    setTimeout(() => {
      el.classList.remove(animationClass);
    }, 500);
  }

  //
  // --- SEKWENCJA ATAKÓW WROGÓW ---
  //

  // Rekurencyjnie: każdy żywy wróg atakuje po kolei z odstępem czasowym
  function enemiesAttackInTurns(livingEnemies, index, updatedEdwardHp, updatedChars) {
    // jeśli wszyscy zaatakowali – koniec
    if (index >= livingEnemies.length) {
      // Aktualizujemy stany
      setEdwardHP(updatedEdwardHp);
      setCharacters(updatedChars);

      // Sprawdzamy, czy Edward padł
      if (updatedEdwardHp <= 0 && edwardAlive) {
        setEdwardAlive(false);
        logToTerminal(`<span style="color:red;">DESYNCHRONIZED! Edward zginął.</span>`);
        setVictoryBanner(
          <div className="banner lose">
            <h2>DESYNCHRONIZED!</h2>
          </div>
        );
        setGameFinished(true);
      }

      // Sprawdzamy zwycięstwo
      checkVictory();

      // Odblokowujemy turę
      setTurnInProgress(false);
      return;
    }

    const attacker = livingEnemies[index].instance;
    // Jeśli wróg żyje
    if (attacker.hp > 0) {
      let newEdwardHp = updatedEdwardHp;

      // Wybierz cele – inni żywi + Edward (jeśli żyje)
      let potentialTargets = livingEnemies.filter((c) => c.id !== livingEnemies[index].id);
      if (newEdwardHp > 0) {
        // Umowny tymczasowy "Edward" do atakowania
        potentialTargets.push({ id: 'edward', instance: new Assasin('Edward', newEdwardHp, 65, 400) });
      }
      if (potentialTargets.length > 0) {
        const targetIdx = Math.floor(Math.random() * potentialTargets.length);
        const target = potentialTargets[targetIdx];

        // Atak
        let newHp;
        if (attacker.side === 'templar') {
          newHp = attacker.szybkiAtak(target.instance);
        } else {
          newHp = attacker.atak(target.instance);
        }

        // Jeśli celem był Edward:
        if (target.id === 'edward') {
          newEdwardHp = newHp;
        } else {
          // w innym przypadku – aktualizujemy HP w updatedChars
          updatedChars = updatedChars.map((ch) => {
            if (ch.id === target.id) {
              ch.instance.hp = newHp;
            }
            return ch;
          });
        }
        updatedEdwardHp = newEdwardHp;
      }
    }

    // 1s przerwy i kolejny wróg atakuje
    setTimeout(() => {
      enemiesAttackInTurns(livingEnemies, index + 1, updatedEdwardHp, updatedChars);
    }, 1000);
  }

  // Koniec tury Edwarda => wrogowie atakują w sekwencji
  function endTurn() {
    // krótkie opóźnienie (dla efektu ataku Edwarda)
    setTimeout(() => {
      // Zbieramy żywych wrogów
      const livingEnemies = characters.filter((c) => c.instance.hp > 0);

      // start sekwencji
      enemiesAttackInTurns(livingEnemies, 0, edwardHP, [...characters]);
    }, 1000);
  }

  //
  // --- AKCJE EDWARDA ---
  //

  function handleClickEnemy(charId) {
    if (!edwardAlive || gameFinished || turnInProgress) return;

    setTurnInProgress(true);

    setCharacters((prev) => {
      const updated = prev.map((c) => {
        if (c.id === charId) {
          const newHp = Edward.atak(c.instance);
          c.instance.hp = newHp;
        }
        return c;
      });
      return updated;
    });

    endTurn();
  }

  function handleAssassinate(charId) {
    if (!edwardAlive || gameFinished || turnInProgress) return;
    if (assassinateUsed) {
      logToTerminal(`Assassinate już użyte!`);
      return;
    }
    setTurnInProgress(true);

    setCharacters((prev) => {
      const updated = prev.map((c) => {
        if (c.id === charId) {
          const newHp = Edward.assasinate(c.instance);
          c.instance.hp = newHp;
        }
        return c;
      });
      return updated;
    });

    setAssassinateUsed(true);
    setAssassinationMode(false);

    endTurn();
  }

  function handleRegenerate() {
    if (!edwardAlive || gameFinished || turnInProgress) return;
    setTurnInProgress(true);

    const newHp = Edward.regeneracja();
    setEdwardHP(newHp);

    endTurn();
  }

  //
  // --- SPRAWDZANIE WYGRANEJ / PRZEGRANEJ ---
  //
  function checkVictory() {
    const aliveEnemies = characters.filter((c) => c.instance.hp > 0);
    if (aliveEnemies.length === 0 && edwardAlive) {
      logToTerminal(`<span style="color:gold;">ZWYCIĘSTWO!</span>`);
      setGameFinished(true);
      setVictoryBanner(
        <div className="banner win">
          <h2>ZWYCIĘSTWO!</h2>
        </div>
      );
    }
  }

  //
  // --- RESTART ---
  //
  function restartGame() {
    setEdwardHP(400);
    setEdwardAlive(true);
    setGameFinished(false);
    setAssassinateUsed(false);
    setAssassinationMode(false);
    setLogs([]);
    setVictoryBanner(null);
    setTurnInProgress(false);

    setCharacters(
      initialCharacters.map((item) => {
        const { imie, maxHp, dmg } = item.instance;
        if (item.instance.side === 'assasin') {
          return { id: item.id, instance: new Assasin(imie, maxHp, dmg, maxHp) };
        } else {
          return { id: item.id, instance: new Templar(imie, maxHp, dmg, maxHp) };
        }
      })
    );
  }

  // Pierwsze logi
  useEffect(() => {
    logToTerminal("<hr />--- Rozpoczynamy Rozgrywkę ---");
    logToTerminal("Kliknij w przeciwnika, aby zaatakować (Edward).");
    logToTerminal("Użyj 'Assassinate', aby aktywować tryb assassinacji (1x).");
    logToTerminal("Przycisk 'Regenerate' leczy Edwarda (max HP: 400).");
  }, []);

  return (
    <>
      {/* Audio */}
      <audio id="intro-music" src="/https://ecwt8zyzvrjyva9m.public.blob.vercel-storage.com/intro2-cyetmnR0SXVxBOF5GDKJwD3GGe0JJB.mp3" autoPlay loop hidden />

      <h1>Assassin&apos;s Creed</h1>

      <div style={{ marginBottom: '10px', color: '#ffaaaa' }}>
        <strong>HP Edwarda:</strong> {edwardHP} / 400
        {!edwardAlive && (
          <span style={{ marginLeft: 10, color: 'red' }}>DESYNCHRONIZED</span>
        )}
      </div>

      {/* Przyciski z nową klasą .ac-btn */}
      <div style={{ marginBottom: '10px' }}>
        <button
          className="ac-btn"
          onClick={handleRegenerate}
          disabled={!edwardAlive || gameFinished || turnInProgress}
        >
          Regenerate
        </button>

        <button
          className="ac-btn"
          onClick={() => {
            if (!assassinateUsed && edwardAlive && !gameFinished && !turnInProgress) {
              setAssassinationMode(true);
              logToTerminal(`Tryb assassinate aktywowany! Kliknij wybranego przeciwnika.`);
            }
          }}
          disabled={!edwardAlive || assassinateUsed || gameFinished || turnInProgress}
        >
          Assassinate (1x)
        </button>
      </div>

      <div id="game-container">
        {/* Edward */}
        <div className="character" id="edward">
          <div className="char-name">{Edward.imie}</div>
          <div className="hp-bar">
            <div
              className="hp-bar-inner"
              style={{ width: (edwardHP / 400) * 100 + '%' }}
            />
          </div>
          <div className="hp-text">{edwardHP} / 400</div>
        </div>

        {/* Przeciwnicy */}
        {characters.map((char) => {
          const c = char.instance;
          const hpPercent = c.hp > 0 ? (c.hp / c.maxHp) * 100 : 0;
          return (
            <div
              key={char.id}
              className="character"
              id={char.id}
              onClick={() => {
                if (assassinationMode) {
                  handleAssassinate(char.id);
                } else {
                  handleClickEnemy(char.id);
                }
              }}
            >
              <div className="char-name">{c.imie}</div>
              <div className="hp-bar">
                <div
                  className="hp-bar-inner"
                  style={{ width: hpPercent + '%' }}
                />
              </div>
              <div className="hp-text">
                {c.hp} / {c.maxHp}
              </div>
            </div>
          );
        })}
      </div>

      <div id="terminal">
        {logs.map((line, idx) => (
          <div key={idx} className="log-line" dangerouslySetInnerHTML={{ __html: line }} />
        ))}
      </div>

      <div id="audio-container" style={{ marginTop: '10px' }}>
        <audio id="intro-music" ref={audioRef} src="/intro2.mp3" autoPlay loop muted />
        <button onClick={handlePlayMusic} style={{ marginRight: 5 }}>
          Włącz muzykę
        </button>
        <button onClick={handleStopMusic}>Stop</button>
      </div>

      {gameFinished && (
        <div style={{ marginTop: '20px' }}>
          <button className="ac-btn" onClick={restartGame}>
            Zagraj jeszcze raz
          </button>
        </div>
      )}

      {victoryBanner}

      {/* STYLES */}
      <style jsx global>{`
        @font-face {
          font-family: 'Assassin';
          src: url('/fonts/Assassin.ttf') format('truetype');
          font-weight: normal;
          font-style: normal;
        }
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
          font-family: monospace;
        }
        body {
          background-image: url('https://ecwt8zyzvrjyva9m.public.blob.vercel-storage.com/images/background.jpg');
          font-family: 'Assassin', sans-serif;
          color: #eee;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: flex-start;
          min-height: 100vh;
          padding: 20px;
        }
        h1 {
          margin-bottom: 10px;
          color: #e2e2e2;
          font-size: 24px;
          text-align: center;
        }

        /* Nowy styl przycisków AC */
        .ac-btn {
          font-family: 'Assassin', sans-serif;
          font-size: 22px;
          background-color: #222;
          color: #ffdc9f;
          padding: 10px 25px;
          border: 2px solid #888;
          border-radius: 8px;
          margin: 0 8px;
          cursor: pointer;
          transition: background-color 0.3s ease, transform 0.3s ease;
        }
        .ac-btn:hover {
          background-color: #444;
          transform: scale(1.05);
        }
        .ac-btn:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }

        #game-container {
          width: 1000px;
          height: 250px;
          border: 4px solid #444;
          background: #333;
          display: flex;
          justify-content: space-around;
          align-items: center;
          margin-bottom: 20px;
        }
        .character {
          width: 150px;
          height: 150px;
          position: relative;
          background-size: contain;
          background-repeat: no-repeat;
          transition: transform 0.4s ease;
          cursor: pointer;
        }
        .char-name {
          position: absolute;
          top: -35px;
          left: 0;
          width: 100%;
          text-align: center;
          font-size: 18px;
          font-weight: bold;
          color: #ffdc9f;
          text-shadow: 1px 1px 2px #000;
        }
        .hp-bar {
          position: absolute;
          bottom: -25px;
          left: 0;
          width: 100%;
          height: 12px;
          background: #555;
          border: 1px solid #000;
        }
        .hp-bar-inner {
          height: 100%;
          background: #0f0;
          transition: width 0.2s ease;
        }
        .hp-text {
          position: absolute;
          bottom: -45px;
          left: 0;
          width: 100%;
          text-align: center;
          font-size: 14px;
          color: #fff;
          text-shadow: 1px 1px 2px #000;
        }
        #edward {
          background-image: url('https://ecwt8zyzvrjyva9m.public.blob.vercel-storage.com/images/edward.webp');
          cursor: default;
        }
        #ezio {
          background-image: url('https://ecwt8zyzvrjyva9m.public.blob.vercel-storage.com/images/ezio.webp');
        }
        #altair {
          background-image: url('https://ecwt8zyzvrjyva9m.public.blob.vercel-storage.com/images/altair.webp');
        }
        #haytam {
          background-image: url('https://ecwt8zyzvrjyva9m.public.blob.vercel-storage.com/images/haytam.webp');
        }
        #rodrigo {
          background-image: url('https://ecwt8zyzvrjyva9m.public.blob.vercel-storage.com/images/rodrigo.webp');
        }
        #cesare {
          background-image: url('https://ecwt8zyzvrjyva9m.public.blob.vercel-storage.com/images/cesare.webp');
        }
        .attack {
          animation: attackAnim 0.4s forwards;
        }
        .heavy-attack {
          animation: heavyAttackAnim 0.4s forwards;
        }
        .assassinate {
          animation: assassinateAnim 0.6s forwards;
        }
        .regenerate {
          animation: regenerateAnim 0.4s forwards;
        }
        @keyframes attackAnim {
          0% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(30px, -20px) scale(1.1); }
          100% { transform: translate(0, 0) scale(1); }
        }
        @keyframes heavyAttackAnim {
          0% { transform: translate(0, 0) rotate(0deg); }
          30% { transform: translate(-20px, -20px) rotate(-10deg); }
          60% { transform: translate(40px, -40px) rotate(10deg); }
          100% { transform: translate(0, 0) rotate(0deg); }
        }
        @keyframes assassinateAnim {
          0% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(0, -20px) scale(1.2); }
          100% { transform: translate(0, 0) scale(1); }
        }
        @keyframes regenerateAnim {
          0% { filter: brightness(1); }
          50% { filter: brightness(3); }
          100% { filter: brightness(1); }
        }
        #terminal {
          width: 1000px;
          background: #111;
          border: 2px solid #333;
          min-height: 150px;
          padding: 10px;
          font-size: 14px;
          overflow-y: auto;
          max-height: 250px;
        }
        .log-line {
          margin: 2px 0;
          line-height: 1.4;
        }
        .banner {
          margin-top: 20px;
          padding: 20px;
          text-align: center;
          border: 2px solid #fff;
          animation: bannerAnim 2s ease-in-out infinite alternate;
        }
        .banner.win {
          background: linear-gradient(45deg, #00c853, #64dd17);
          color: #222;
          font-size: 32px;
          font-weight: bold;
        }
        .banner.lose {
          background: linear-gradient(45deg, #d50000, #ff1744);
          color: #222;
          font-size: 32px;
          font-weight: bold;
        }
        @keyframes bannerAnim {
          from { transform: scale(1); }
          to { transform: scale(1.05); }
        }
      `}</style>
    </>
  );
}