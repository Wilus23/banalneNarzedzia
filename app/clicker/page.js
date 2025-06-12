"use client";
import { useState, useEffect } from "react";
import './style.css';

export default function Clicker() {
  const baseClick = 1;

  // Liczniki i bank
  const [licznik, setLicznik] = useState(0);
  const [bank, setBank] = useState(0);

  // Ulepszenie + Click
  const [plusLevel, setPlusLevel] = useState(0);
  const [plusCost, setPlusCost] = useState(40);
  const [plusBonus, setPlusBonus] = useState(0);

  // Ulepszenie ×2 Click
  const [multiplierLevel, setMultiplierLevel] = useState(0);
  const [multiplierCost, setMultiplierCost] = useState(2000);
  const [multiplier, setMultiplier] = useState(1);

  // Ulepszenie Auto Click
  const [autoClickLevel, setAutoClickLevel] = useState(0);
  const [autoClickCost, setAutoClickCost] = useState(500);

  // Sidebar
  const [shopOpen, setShopOpen] = useState(false);

  // Obliczenie efektywnej wartości kliknięcia
  const effectiveClick = (baseClick + plusBonus) * multiplier;

  function klik() {
    setLicznik(licznik + effectiveClick);
  }

  function przelew() {
    setBank(bank + licznik);
    setLicznik(0);
  }

  function toggleShop() {
    setShopOpen(!shopOpen);
  }

  function buyPlusUpgrade() {
    if (bank >= plusCost) {
      setBank(bank - plusCost);
      // Dodaj bonus: pierwszy zakup dodaje 9, kolejny 90, potem 900, ...
      const bonusAddition = 9 * Math.pow(10, plusLevel);
      setPlusBonus(plusBonus + bonusAddition);
      setPlusLevel(plusLevel + 1);
      setPlusCost(plusCost * 25);
    }
  }

  function buyMultiplierUpgrade() {
    if (bank >= multiplierCost) {
      setBank(bank - multiplierCost);
      setMultiplier(multiplier * 2);
      setMultiplierLevel(multiplierLevel + 1);
      setMultiplierCost(multiplierCost * 2);
    }
  }

  function buyAutoClickUpgrade() {
    if (bank >= autoClickCost) {
      setBank(bank - autoClickCost);
      setAutoClickLevel(autoClickLevel + 1);
      setAutoClickCost(autoClickCost * 3);
    }
  }

  // Auto Click: dodaje kliknięcia co 1 sekundę
  useEffect(() => {
    const interval = setInterval(() => {
      if (autoClickLevel > 0) {
        setLicznik(prev => prev + effectiveClick * autoClickLevel);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [autoClickLevel, effectiveClick]);

  return (
    <>
      <button onClick={toggleShop} className="shop-toggle">
        {shopOpen ? "Zamknij Sklep" : "Otwórz Sklep"}
      </button>
      <div className={`shop ${shopOpen ? "open" : ""}`}>
        <h2>Sklep</h2>
        <div className="shop-item">
          <p>Ulepszenie: + Click</p>
          <p>Koszt: {plusCost}$</p>
          <button onClick={buyPlusUpgrade}>
            Kup (Poziom {plusLevel})
          </button>
        </div>
        <div className="shop-item">
          <p>Ulepszenie: ×2 Click</p>
          <p>Koszt: {multiplierCost}$</p>
          <button onClick={buyMultiplierUpgrade}>
            Kup (Poziom {multiplierLevel})
          </button>
        </div>
        <div className="shop-item">
          <p>Ulepszenie: Auto Click</p>
          <p>Koszt: {autoClickCost}$</p>
          <button onClick={buyAutoClickUpgrade}>
            Kup (Poziom {autoClickLevel})
          </button>
        </div>
      </div>
      <div className="bank">
        <p>BANK: {bank}$</p>
      </div>
      <div className="kontener">
        <button onClick={klik} className="przycisk">
          <div className="kliker">
            <p>portfel: {licznik}$</p>
            <p>Click Value: {effectiveClick}</p>
          </div>
        </button>
        <button onClick={przelew} className="wyczysc">Wypłać</button>
      </div>
    </>
  );
}