"use client";
import { useState } from "react";
import './style.css';
import { motion } from "framer-motion";


export default function Lobby() {
// NASTĘPNA LEKCJA:
// 1. KLASY CSS I JAK JE STOSOWAĆ
// 2. Podstawowe rzeczy z CSS (Wysokość, szerokość, kolorki, border, border radius, font-size, font-family)
    return(
        <>
        <div className="naglowki">
            <h1>Oto strona <span id="podkreslenie">Banalne Narzędzia.</span></h1>
            <p>Zapraszamy do korzystania z naszych narzędzi i innych gier</p>
            
        </div>
        <div className="kontener_przyciski">
            <p className="podpis">Sprawdź nasze narzędzia</p>
            <a href="/bn" className="opakowanie"><button className="btn"><img src="https://ecwt8zyzvrjyva9m.public.blob.vercel-storage.com/images/icons/converter.png" alt="" width={30}/>Narzędzia matematyczne</button></a>
            <a href="/ACTerminal"><button className="btn"><img src="https://ecwt8zyzvrjyva9m.public.blob.vercel-storage.com/images/icons/game.png" alt="" width={30}/>Assassin's Creed</button></a>
            <a href="/clicker"><button className="btn"><img src="https://ecwt8zyzvrjyva9m.public.blob.vercel-storage.com/images/icons/clicker.png" alt="" width={30}/>Clicker</button></a>
        </div>
        <div className="kolko" id="kolko1"> </div>
        <div className="kolko" id="kolko2"></div>
        <div className="kolko" id="kolko3"></div>
        </>
    )
}