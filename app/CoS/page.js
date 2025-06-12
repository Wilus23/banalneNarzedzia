'use client'
import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'

/************************************
 *  SIMPLE TOWER‑DEFENCE "PUB MENTEZENA" – Next.js (JS)
 *  Patched: overlay store, pub HP & damage, BTC bounty, randomised waves,
 *  two‑lane combat & victory/defeat logic.
 *  Author: ChatGPT (o3) – June 2025
 *************************************/

/*************** CONSTANTS ****************/
const LANES = { ground: 130, air: 50 }
const TICK = 60 // ms
const ARENA_WIDTH = 900
const PLAYER_BASE_X = 50
const ENEMY_BASE_X = ARENA_WIDTH - 50
const DEFAULT_RANGE = 120
const PUB_MAX_HP = 500

const WAVE_DURATION = 30000 // 30s per wave
const BTC_PASSIVE_RATE = 10 // per second
const ENEMY_HP_SCALE = 0.8
const ENEMY_DMG_SCALE = 0.8

const speedToDx = (s) => (s === 'slow' ? 20 : s === 'fast' ? 80 : 40)

/*************** PLAYER UNITS ****************/
const PLAYER_UNITS = {
  mentezenVoter: { id: 'mentez', label: 'Wyborca Mentzena', hp: 10, dmg: 5, speedName: 'normal', cost: 100, lane: 'ground' },
  nawrocki:      { id: 'nawrocki', label: 'Nawrocki', hp: 100, dmg: 20, speedName: 'slow',   cost: 1000, lane: 'ground' },
  stanowski:     { id: 'stano', label: 'Stanowski', hp: 22, dmg: 30, speedName: 'normal', cost: 500,  lane: 'ground' },
  extremists:    { id: 'ekst', label: 'Prawicowi ekstremiści', hp: 20, dmg: 15, speedName: 'fast',   cost: 150,  lane: 'air' }
}

/*************** ENEMIES ****************/
function enemyTemplate(type) {
  const base = (() => {
    switch (type) {
      case 'lewak':
        return { id: 'lewak-' + Math.random(), label: 'Pojedynczy lewak', lane: 'ground', hp: 15, dmg: 2.5, speedName: 'normal', x: ENEMY_BASE_X, range: DEFAULT_RANGE, bounty: 25, color: '#ff3333' };
      case 'zandberg':
        return { id: 'zand-' + Math.random(), label: 'Zandberg', lane: 'ground', hp: 75, dmg: 22, speedName: 'slow', x: ENEMY_BASE_X, range: DEFAULT_RANGE, bounty: 125, color: '#ff6666' };
      case 'trzaskAir':
        return { id: 'trz-' + Math.random(), label: 'Samolot Trzaskowskiego', lane: 'air', hp: 30, dmg: 10, speedName: 'fast', x: ENEMY_BASE_X, range: DEFAULT_RANGE, bounty: 60, color: '#ffcc00' };
      case 'tusk':
        return { id: 'tusk-' + Math.random(), label: 'Niemiecki Batalion Tuska', lane: 'ground', hp: 200, dmg: 2.5, speedName: 'slow', x: ENEMY_BASE_X, range: DEFAULT_RANGE, bounty: 200, color: '#ff0000' };
      case 'senyszynBoss':
      default:
        return { id: 'senyszyn', label: 'Wielka Senyszyn', lane: 'both', hp: 500, dmg: 25, speedName: 'slow', x: ENEMY_BASE_X, range: DEFAULT_RANGE + 40, bounty: 500, color: '#ff8800' };
    }
  })();
  return { ...base, hp: base.hp * ENEMY_HP_SCALE, dmg: base.dmg * ENEMY_DMG_SCALE };
}
function generateWave(count) {
  const types = ['lewak', 'trzaskAir', 'zandberg', 'tusk']
  const arr = []
  for (let i = 0; i < count; i++) {
    const type = types[Math.floor(Math.random() * types.length)]
    const delay = Math.floor((i * WAVE_DURATION) / count)
    arr.push({ ...enemyTemplate(type), spawnDelay: delay })
  }
  return arr
}
const bossWave = () => [enemyTemplate('senyszynBoss')]

const ENEMY_WAVES = [
  () => generateWave(5),
  () => generateWave(7),
  () => generateWave(9),
  () => generateWave(11),
  () => generateWave(12),
  () => generateWave(13),
  () => generateWave(14),
  () => generateWave(15),
  () => generateWave(15),
  bossWave
]

/*************** MAIN COMPONENT ****************/
export default function Home() {
  const [btc, setBtc]               = useState(500)
  const [storeOpen, setStoreOpen]   = useState(false)
  const [selectedKey, setSelectedKey] = useState(null)
  const [waveIdx, setWaveIdx]       = useState(0)
  const [enemies, setEnemies]       = useState([])
  const [players, setPlayers]       = useState([])
  const [pubHp, setPubHp]           = useState(PUB_MAX_HP)
  const [tickTime, setTickTime]     = useState(Date.now())
  const [pendingSpawns, setPendingSpawns] = useState([])
  const intervalRef                 = useRef(null)

  /* ---------- GAME LOOP TIMER ---------- */
  useEffect(() => {
    intervalRef.current = setInterval(() => setTickTime(Date.now()), TICK)
    return () => clearInterval(intervalRef.current)
  }, [])

  // passive BTC gain
  useEffect(() => {
    const id = setInterval(() => setBtc(b => b + BTC_PASSIVE_RATE), 1000)
    return () => clearInterval(id)
  }, [])

  /* ---------- SPAWN NEXT WAVE ---------- */
  useEffect(() => {
    if (enemies.length === 0 && pendingSpawns.length === 0 && waveIdx < ENEMY_WAVES.length) {
      const now = Date.now()
      const wave = ENEMY_WAVES[waveIdx]().map(e => ({ ...e, spawnAt: now + e.spawnDelay }))
      setPendingSpawns(wave)
      setWaveIdx(waveIdx + 1)
    }
  }, [enemies, pendingSpawns, waveIdx])

  // spawn queued enemies
  useEffect(() => {
    if (pendingSpawns.length === 0) return
    const now = Date.now()
    const toSpawn = pendingSpawns.filter(e => e.spawnAt <= now)
    if (toSpawn.length) {
      setEnemies(prev => [...prev, ...toSpawn])
      setPendingSpawns(pendingSpawns.filter(e => e.spawnAt > now))
    }
  }, [tickTime, pendingSpawns])

  /* ---------- MAIN TICK ---------- */
  useEffect(() => {
    if (!tickTime) return

    /* move units */
    setEnemies(prev => prev.map(e => ({ ...e, x: e.x - (speedToDx(e.speedName) * TICK) / 1000 })))
    setPlayers(prev => prev.map(p => ({ ...p, x: p.x + (speedToDx(p.speedName) * TICK) / 1000 })))

    /* resolve combat & pub hits */
    setEnemies(prevEnemies => {
      let earned = 0
      let pubDmg = 0

      const afterCombat = prevEnemies.map(enemy => {
        let hp = enemy.hp
        players.forEach(pl => { if (inRange(pl, enemy)) hp -= pl.dmg * (TICK / 1000) })
        return { ...enemy, hp }
      })

      const survivors = []
      afterCombat.forEach(e => {
        if (e.hp <= 0)              earned += e.bounty
        else if (e.x <= 0)          pubDmg += e.dmg
        else                        survivors.push(e)
      })

      if (earned)  setBtc(b => b + earned)
      if (pubDmg)  setPubHp(hp => Math.max(0, hp - pubDmg))

      return survivors
    })

    /* players take damage */
    setPlayers(prevPlayers => prevPlayers.map(pl => {
      let hp = pl.hp
      enemies.forEach(enemy => { if (inRange(enemy, pl)) hp -= enemy.dmg * (TICK / 1000) })
      return { ...pl, hp }
    }).filter(p => p.hp > 0))

  }, [tickTime])

  /* ---------- WIN / LOSS ---------- */
  useEffect(() => {
    if (pubHp <= 0) {
      alert('PUB MENTEZENA ZNISZCZONY! KONIEC GRY :(')
      window.location.reload()
    }
  }, [pubHp])

  useEffect(() => {
    if (waveIdx >= ENEMY_WAVES.length && enemies.length === 0) {
      alert('Wygrałeś wszystkie fale! 🍻')
      window.location.reload()
    }
  }, [waveIdx, enemies])

  /* ---------- HELPERS ---------- */
  const inRange = (a, b) => (
    (a.lane === 'both' || b.lane === 'both' || a.lane === b.lane) &&
    Math.abs(a.x - b.x) <= (a.range || DEFAULT_RANGE)
  )

  const handleArenaClick = e => {
    if (!selectedKey) return
    const lane  = e.nativeEvent.offsetY < 80 ? 'air' : 'ground'
    const proto = PLAYER_UNITS[selectedKey]

    if (!proto || (proto.lane !== 'air' && proto.lane !== lane)) return
    if (btc < proto.cost) return

    setBtc(b => b - proto.cost)
    setPlayers(prev => [...prev, { ...proto, id: proto.id + '-' + Math.random(), x: PLAYER_BASE_X, lane, range: DEFAULT_RANGE }])
    setSelectedKey(null)
  }

  /* ---------- RENDER ---------- */
  return (
    <div style={{ fontFamily: 'monospace' }}>
      {/* ---- STORE ---- */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          right: storeOpen ? 0 : '-25%',
          width: '25%',
          height: '100vh',
          background: '#222',
          color: '#fff',
          padding: 20,
          transition: 'right 0.3s',
          zIndex: 1000
        }}
      >
        <h3>Sklep (BTC: {btc})</h3>
        {Object.keys(PLAYER_UNITS).map(key => {
          const u = PLAYER_UNITS[key]
          return (
            <div
              key={key}
              style={{
                marginBottom: 10,
                border: selectedKey === key ? '2px solid gold' : '1px solid #555',
                padding: 8,
                cursor: 'pointer'
              }}
              onClick={() => setSelectedKey(key)}
            >
              {u.label} — {u.cost} BTC
            </div>
          )
        })}
      </div>

      {/* store toggle */}
      <button onClick={() => setStoreOpen(!storeOpen)} style={{ position: 'fixed', top: 20, right: 20, zIndex: 1001 }}>
        {storeOpen ? '⨯' : '☰ Sklep'}
      </button>

      {/* ---- ARENA ---- */}
      <div
        onClick={handleArenaClick}
        style={{
          position: 'relative',
          width: ARENA_WIDTH,
          height: 180,
          margin: '100px auto',
          background: '#060',
          border: '4px solid #333',
          overflow: 'hidden'
        }}
      >
        {/* PUB */}
        <div
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            width: 40,
            height: '100%',
            background: '#8B4513',
            color: '#fff',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 14
          }}
        >
          <div>PUB</div>
          <div style={{ fontSize: 12 }}>HP: {pubHp}</div>
        </div>

        {/* UNITS */}
        {[...players, ...enemies].map(u => (
          <motion.div
            key={u.id}
            animate={{ x: u.x }}
            transition={{ ease: 'linear', duration: TICK / 1000 }}
            style={{
              position: 'absolute',
              left: 0,
              top: LANES[u.lane] || 0,
              transform: `translateX(${u.x}px)`,
              background: u.color || (u.label.includes('lewak') ? '#f55' : '#fff'),
              color: '#000',
              padding: '4px 6px',
              fontSize: 14,
              borderRadius: 3
            }}
          >
            {u.label} ({Math.round(u.hp)})
          </motion.div>
        ))}

        {/* Wave counter */}
        <div style={{ position: 'absolute', right: 10, bottom: 5, fontSize: 12, color: '#fff' }}>
          Fala: {Math.min(waveIdx, 10)} / 10
        </div>
      </div>
    </div>
  )
}
