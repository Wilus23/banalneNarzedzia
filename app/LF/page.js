'use client'
import Head from 'next/head'
import { useState, useEffect, useRef } from 'react'
import './style.css'

/**
 * ###############
 * Poprawiona wersja komponentu „LF”
 *  – losowość liczona po realnej sumie `chance`, więc brak "pustych" losów
 *  – dokładne obliczenie dystansu na podstawie DOM zamiast wzoru „na oko”
 *  – gwarancja że slot widoczny w żółtej ramce == wygrany przedmiot
 * ###############
 */

const cases = [
  { id: 1, boxImg: 'https://ecwt8zyzvrjyva9m.public.blob.vercel-storage.com/images/skrzynka1-uubbKLng1DpYAoW6wM3WmxkAPwB8jw.png', label: 'Common Case', price: 50, items: [
      { id: '1.1', img: 'https://ecwt8zyzvrjyva9m.public.blob.vercel-storage.com/images/bron1.1-r4doxsGZ8qwRU8vCi2oergpS75jLUo.png', chance: 50 },
      { id: '1.2', img: 'https://ecwt8zyzvrjyva9m.public.blob.vercel-storage.com/images/bron1.2-KjMkk8zWWBVicI6U5tKvHEijDnv3uC.png', chance: 25 },
      { id: '1.3', img: 'https://ecwt8zyzvrjyva9m.public.blob.vercel-storage.com/images/bron1.3-qP1avGerT3ewOH2vvdwbH1Qxh6nCQU.png', chance: 15 },
      { id: '1.4', img: 'https://ecwt8zyzvrjyva9m.public.blob.vercel-storage.com/images/bron1.4-UHaSFVLkb6DnLq2Wrp0jfvQ4QB7NNj.pngg', chance: 10 },
    ],
  },
  { id: 2, boxImg: 'https://ecwt8zyzvrjyva9m.public.blob.vercel-storage.com/images/skrzynka2-Vtxu67bMzMM9kLRcHzOiv5ULyW9ejb.png', label: 'Special Case', price: 75, items: [
      { id: '2.1', img: 'https://ecwt8zyzvrjyva9m.public.blob.vercel-storage.com/images/bron2.1-cI1okKL5GQbIE2gnmWOrmDbGqVBG0g.png', chance: 50 },
      { id: '2.2', img: 'https://ecwt8zyzvrjyva9m.public.blob.vercel-storage.com/images/bron2.2-hGw6mFPjGBBI4IbEPFxg1aa3AjK8tj.png', chance: 25 },
      { id: '2.3', img: 'https://ecwt8zyzvrjyva9m.public.blob.vercel-storage.com/images/bron2.3-mRipk9vndQrzm1R0kJ5mLv8yjPnoUT.png', chance: 15 },
      { id: '2.4', img: 'https://ecwt8zyzvrjyva9m.public.blob.vercel-storage.com/images/bron2.4-FJbfIGdsyShKPlI1bfyPkIsnOwzUiP.png', chance: 10 },
    ],
  },
  { id: 3, boxImg: 'https://ecwt8zyzvrjyva9m.public.blob.vercel-storage.com/images/skrzynka3-YIOJfkw55JlPHnZvuoUwi9z80ilkHz.png', label: 'Obsidian Case', price: 100, items: [
      { id: '3.1', img: 'https://ecwt8zyzvrjyva9m.public.blob.vercel-storage.com/images/bron3.1-5gHNmNfnCNX5mH4Itj7CVXPhGpc90V.png', chance: 50 },
      { id: '3.2', img: 'https://ecwt8zyzvrjyva9m.public.blob.vercel-storage.com/images/bron3.2-qNxAH229FKam8EdmzgU4ZpLLwa043q.png', chance: 25 },
      { id: '3.3', img: 'https://ecwt8zyzvrjyva9m.public.blob.vercel-storage.com/images/bron3.3-lxa9dL2K3IJMNBXzi3JtGwM0MmOx4n.png', chance: 15 },
      { id: '3.4', img: 'https://ecwt8zyzvrjyva9m.public.blob.vercel-storage.com/images/bron3.4-euFUglAOGNUKqXvQRdeVQdxZcuaDYZ.png', chance: 10 },
    ],
  },
  { id: 4, boxImg: 'https://ecwt8zyzvrjyva9m.public.blob.vercel-storage.com/images/skrzynka4-RXyPvmf9uzhATHaLXhWpKcDUsPtk3l.png', label: 'Legendary Case', price: 150, items: [
      { id: '4.1', img: 'https://ecwt8zyzvrjyva9m.public.blob.vercel-storage.com/images/bron4.1-xsKEvZYEqnliAaqt6daUHz3Bl8J5vZ.png', chance: 50 },
      { id: '4.2', img: 'https://ecwt8zyzvrjyva9m.public.blob.vercel-storage.com/images/bron4.2-4sAZxTKRnAwFMSa6GApNpgAn4iSXye.png', chance: 15 },
      { id: '4.3', img: 'https://ecwt8zyzvrjyva9m.public.blob.vercel-storage.com/images/bron4.3-tF7kb2SJpQXXRrY5sRDMBeNjOhJMyY.png', chance: 25 },
      { id: '4.4', img: 'https://ecwt8zyzvrjyva9m.public.blob.vercel-storage.com/images/bron4.4-IOaeaKCz05t0hOvXuPBMQC4yh181Db.png', chance: 10 }, // było 1% – ustrukturyzowane do 10, by łącznie =100
    ],
  },
]

const SLOT_WIDTH = 168 // 160px szerokości + 2*4px marginesu

/**
 * Zwraca cenę sprzedaży na podstawie ceny skrzynki i szansy dropu.
 */
const getSalePrice = (item, casePrice) => Math.floor(casePrice * (100 / item.chance) * 0.1)

export default function LF() {
  const [balance, setBalance] = useState(1000)
  const [inventory, setInventory] = useState([])
  const [selectedCase, setSelectedCase] = useState(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [wonItem, setWonItem] = useState(null)
  const [reveal, setReveal] = useState(false)

  // --- roll control ---
  const [rollItems, setRollItems] = useState([])
  const [scrollDist, setScrollDist] = useState(0)
  const [animate, setAnimate] = useState(false)
  const [targetIdx, setTargetIdx] = useState(null)

  // Refs – potrzebne by wyliczyć realny offset slotu
  const carouselRef = useRef(null)

  /**
   * Losujemy przedmiot z wykorzystaniem sumy szans.
   * Dzięki temu nie ma ryzyka, że "rand" wypadnie poza zakres i dostaniemy undefined.
   */
  const pickRandomItem = (items) => {
    const total = items.reduce((sum, it) => sum + it.chance, 0)
    const r = Math.random() * total
    let acc = 0
    for (const it of items) {
      acc += it.chance
      if (r <= acc) return it
    }
    // awaryjnie ostatni element (nie powinno się zdarzyć)
    return items[items.length - 1]
  }

  /**
   * Przygotowuje sekwencję slotów do karuzeli oraz indeks wygranego.
   */
  const generateRoll = (c, item) => {
    const pre = Array.from({ length: 15 }, () => c.items[Math.floor(Math.random() * c.items.length)])
    const post = Array.from({ length: 15 }, () => c.items[Math.floor(Math.random() * c.items.length)])
    const seq = [...pre, item, ...post]
    return { seq, targetIdx: pre.length }
  }

  /**
   * Start otwierania skrzynki.
   */
  const openCase = (c) => {
    if (balance < c.price) return alert('Brak środków')

    setBalance((prev) => prev - c.price)
    setSelectedCase(c)
    setReveal(false)

    const item = pickRandomItem(c.items)
    setWonItem(item)

    // przygotuj sekwencję na karuzelę
    const { seq, targetIdx } = generateRoll(c, item)
    setRollItems(seq)
    setTargetIdx(targetIdx)

    // odpal modal – animacja zostanie puszczona po wyliczeniu dystansu (patrz useEffect poniżej)
    setModalOpen(true)
  }

  /**
   * Po wyrenderowaniu karuzeli dokładnie obliczamy dystans, żeby wyrównać slot do ramki.
   */
  useEffect(() => {
    if (!modalOpen || targetIdx === null) return

    const slotEl = carouselRef.current?.children?.[targetIdx]
    if (!slotEl) return

    // offsetLeft slotu wewnątrz karuzeli
    const slotLeft = slotEl.offsetLeft
    // środek viewportu, od którego zaczyna się ramka (minus połowa SLOT_WIDTH)
    const viewportCenter = window.innerWidth / 2 - SLOT_WIDTH / 2

    setScrollDist(slotLeft - viewportCenter)
    setAnimate(false) // reset animacji (jeśli to kolejne otwarcie)

    // puszczamy animację klatkę później
    requestAnimationFrame(() => setAnimate(true))

    // Po 4 sekundach pokazujemy ekran wyników (czas = duration transition)
    const timer = setTimeout(() => setReveal(true), 4000)
    return () => clearTimeout(timer)
  }, [modalOpen, targetIdx])

  /**
   * Akcje po wynikach
   */
  const keepItem = () => {
    setInventory((prev) => [...prev, { ...wonItem, casePrice: selectedCase.price }])
    closeModal()
  }

  const sellItem = (item, fromInv = false) => {
    const basePrice = fromInv ? item.casePrice : selectedCase.price
    setBalance((prev) => prev + getSalePrice(item, basePrice))
    if (fromInv) {
      setInventory((prev) => prev.filter((i) => i !== item))
    } else {
      closeModal()
    }
  }

  const closeModal = () => {
    setModalOpen(false)
    setSelectedCase(null)
    setWonItem(null)
    setReveal(false)
    setRollItems([])
    setAnimate(false)
    setTargetIdx(null)
  }

  return (
    <>
      <Head>
        <title>LegalFake – CSGO Cases</title>
      </Head>
      <main className="page">
        <header className="top-bar">
          <span className="logo">LegalFake</span>
          <span className="balance">{balance} vzł</span>
          <button className="inv-btn" onClick={() => setModalOpen('inventory')}>
            Inventory ({inventory.length})
          </button>
        </header>

        {cases.map((c) => (
          <section key={c.id} className="case-section" onClick={() => openCase(c)}>
            <div className="case-header">
              <img className="case-img" src={c.boxImg} alt={c.label} />
              <div className="case-info">
                <h2>{c.label}</h2>
                <span className="price">{c.price} vzł</span>
              </div>
            </div>
            <div className="items-row">
              {c.items.map((item) => (
                <div className="item" key={item.id}>
                  <img src={item.img} alt={item.id} />
                  <span className="chance">{item.chance}%</span>
                </div>
              ))}
            </div>
          </section>
        ))}

        {/* --- MODAL: otwieranie skrzynki --- */}
        {modalOpen === true && selectedCase && (
          <div className="modal full-screen">
            <div className="modal-content roll">
              {/* ramka wskazująca */}
              <div className="indicator" />

              {/* Karuzela albo wynik */}
              {!reveal ? (
                <div
                  ref={carouselRef}
                  className="carousel"
                  style={{
                    transform: animate ? `translateX(-${scrollDist}px)` : 'translateX(0)',
                    transition: animate ? 'transform 4s cubic-bezier(0.23,1,0.32,1)' : 'none',
                  }}
                >
                  {rollItems.map((it, i) => (
                    <div className="roll-slot" key={i}>
                      <img src={it.img} className="roll-img" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="result">
                  <h1>Gratulacje!</h1>
                  <div className="loot-box">
                    <img src={wonItem.img} alt={wonItem.id} />
                  </div>
                  <div className="actions">
                    <button onClick={keepItem}>Keep</button>
                    <button onClick={() => sellItem(wonItem)}>Sell for {getSalePrice(wonItem, selectedCase.price)} vzł</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* --- MODAL: inventory --- */}
        {modalOpen === 'inventory' && (
          <div className="modal full-screen">
            <div className="modal-content inventory">
              <h1>Inventory</h1>
              {inventory.length === 0 ? (
                <p>Brak przedmiotów</p>
              ) : (
                inventory.map((it, idx) => (
                  <div key={idx} className="inv-item">
                    <img src={it.img} alt={it.id} />
                    <span>Sell for {getSalePrice(it, it.casePrice)} vzł</span>
                    <button onClick={() => sellItem(it, true)}>Sell</button>
                  </div>
                ))
              )}
              <button onClick={closeModal}>Close</button>
            </div>
          </div>
        )}
      </main>

      {/* Globalny CSS – pozostawiony bez zmian poza drobnymi poprawkami */}
      <style jsx global>{`
      /* style.css */

/* zerujemy marginesy */
html, body {
  margin: 0;
  padding: 0;
}

/* czarne tło + przygotowanie przestrzeni pod trójkąty */
body {
  background-color: #0b0b0b;
  position: relative;
  min-height: 100vh;
  overflow-x: hidden;
  color: #cbea20; /* zachowaj żółty tekst */
}

/* duży ciemnoszary trójkąt w lewym górnym rogu */
body::before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  width: 60vw;
  height: 60vh;
  background-color: #1f1f1f;
  clip-path: polygon(0 0, 100% 0, 0 100%);
  z-index: -1;
}

/* większy, jaśniejszy szary trójkąt w prawym dolnym rogu */
body::after {
  content: "";
  position: absolute;
  bottom: 0;
  right: 0;
  width: 70vw;
  height: 70vh;
  background-color: #282828;
  clip-path: polygon(100% 100%, 0 100%, 100% 0);
  z-index: -1;
}
        button {
          padding: 0.75rem 2rem;
          font-size: 1.2rem;
          border-radius: 12px;
          background: linear-gradient(135deg, #ff9800, #ff5722);
          color: #fff;
          border: none;
          cursor: pointer;
          transition: transform 0.2s, box-shadow 0.2s;
        }
        button:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 10px rgba(0, 0, 0, 0.3);
        }
        .case-img {
          transition: transform 0.2s;
          cursor: pointer;
        }
        .case-img:hover {
          transform: scale(1.1);
        }
        .items-row {
          display: flex;
          gap: 1rem;
          padding: 0.5rem 0;
        }
        .item img {
          width: 60px;
          transition: transform 0.2s;
          cursor: pointer;
        }
        .item img:hover {
          transform: scale(1.2);
        }
        .chance {
          display: block;
          text-align: center;
          margin-top: 0.25rem;
        }
        .top-bar {
          display: flex;
          gap: 1rem;
          align-items: center;
        }
        .inv-btn {
          margin-left: auto;
        }
        .modal.full-screen {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.8);
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .modal-content {
          position: relative;
          background: #111;
          color: #fff;
          border-radius: 8px;
          padding: 2rem;
          text-align: center;
          width: 100vw;
          height: 100vh;
          display: flex;
          flex-direction: column;
          justify-content: center;
          overflow: hidden;
        }
        .indicator {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 160px;
          height: 200px;
          border: 3px solid #ffeb3b;
          border-radius: 12px;
          pointer-events: none;
          box-shadow: 0 0 8px #ffeb3b;
        }
        .carousel {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: flex-start;
        }
        .roll-slot {
          width: 160px;
          height: 200px;
          margin: 0 4px;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .roll-img {
          width: 140px;
        }
        .result img {
          width: 260px;
          margin: 2rem 0;
        }
        .loot-box {
          display: inline-block;
          padding: 1rem;
          background: rgba(255, 255, 255, 0.06);
          border-radius: 10px;
        }
        .actions {
          display: flex;
          gap: 2rem;
          justify-content: center;
        }
        .inventory .inv-item {
          display: flex;
          gap: 1rem;
          align-items: center;
          margin: 1rem 0;
        }
        .inventory .inv-item img {
          width: 60px;
        }
      `}</style>
    </>
  )
}
