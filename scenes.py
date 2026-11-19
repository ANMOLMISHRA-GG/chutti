"""Detailed scenic SVG artwork & fallbacks used when a photo file is not present in public/img/."""


def hero_svg() -> str:
    return (
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 640" preserveAspectRatio="xMidYMid slice">'
        '<defs><linearGradient id="hs" x1="0" y1="0" x2="0" y2="1">'
        '<stop offset="0%" stop-color="#1b2a4a"/><stop offset="55%" stop-color="#3a527a"/>'
        '<stop offset="100%" stop-color="#0a0f1d"/></linearGradient></defs>'
        '<rect width="1600" height="640" fill="url(#hs)"/>'
        '<polygon points="0,640 320,270 680,480 1050,170 1420,420 1600,290 1600,640" fill="#1e2f50"/>'
        '<polygon points="0,640 240,390 540,510 920,290 1320,490 1600,380 1600,640" fill="#121e38"/>'
        '<polygon points="1050,170 960,245 1030,235 1065,255 1140,240" fill="#eef4ff" opacity="0.88"/>'
        '<polygon points="320,270 250,340 315,325 350,345 405,330" fill="#eef4ff" opacity="0.72"/>'
        '</svg>'
    )


def _goa_svg() -> str:
    return (
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 260" preserveAspectRatio="xMidYMid slice">'
        '<defs>'
        '<linearGradient id="gsky" x1="0" y1="0" x2="0" y2="1">'
        '<stop offset="0%" stop-color="#0284c7"/><stop offset="65%" stop-color="#7dd3fc"/><stop offset="100%" stop-color="#fef3c7"/></linearGradient>'
        '<linearGradient id="gsea" x1="0" y1="0" x2="0" y2="1">'
        '<stop offset="0%" stop-color="#0369a1"/><stop offset="100%" stop-color="#0ea5e9"/></linearGradient>'
        '</defs>'
        '<rect width="400" height="260" fill="url(#gsky)"/>'
        '<circle cx="295" cy="72" r="28" fill="#fde047" opacity="0.85"/>'
        '<rect y="142" width="400" height="58" fill="url(#gsea)"/>'
        '<path d="M0 190 Q120 175 250 192 T400 185 V260 H0 Z" fill="#f3d19c"/>'
        '<path d="M0 196 Q120 182 240 198 T400 192" stroke="#ffffff" stroke-width="3" fill="none" opacity="0.75"/>'
        '<path d="M52 240 Q72 150 64 78" stroke="#4a2e1b" stroke-width="8" fill="none" stroke-linecap="round"/>'
        '<path d="M64 78 Q22 65 8 92 M64 78 Q35 45 20 55 M64 78 Q88 45 112 64 M64 78 Q106 72 122 100" stroke="#14532d" stroke-width="6" fill="none" stroke-linecap="round"/>'
        '<path d="M335 245 Q318 165 328 96" stroke="#4a2e1b" stroke-width="7" fill="none" stroke-linecap="round"/>'
        '<path d="M328 96 Q292 84 276 108 M328 96 Q304 64 288 70 M328 96 Q356 64 378 82 M328 96 Q368 92 385 116" stroke="#166534" stroke-width="5.5" fill="none" stroke-linecap="round"/>'
        '<rect x="148" y="176" width="38" height="22" rx="2" fill="#9a3412"/><polygon points="142,176 167,158 192,176" fill="#f59e0b"/>'
        '</svg>'
    )


def _jaipur_svg() -> str:
    return (
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 260" preserveAspectRatio="xMidYMid slice">'
        '<defs><linearGradient id="jsky" x1="0" y1="0" x2="0" y2="1">'
        '<stop offset="0%" stop-color="#7c2d12"/><stop offset="55%" stop-color="#ea580c"/><stop offset="100%" stop-color="#fed7aa"/></linearGradient></defs>'
        '<rect width="400" height="260" fill="url(#jsky)"/>'
        '<circle cx="92" cy="70" r="28" fill="#fef08a" opacity="0.8"/>'
        '<path d="M0 175 L80 120 L165 155 L265 115 L400 165 L400 260 L0 260 Z" fill="#78350f" opacity="0.65"/>'
        '<rect x="75" y="128" width="250" height="108" fill="#d97757"/>'
        '<rect x="100" y="92" width="200" height="36" fill="#e08868"/>'
        '<rect x="135" y="62" width="130" height="30" fill="#ea9b7c"/>'
        '<path d="M165 62 Q200 32 235 62 Z" fill="#f59e0b"/>'
        '<path d="M110 92 Q125 72 140 92 Z M260 92 Q275 72 290 92 Z" fill="#f59e0b"/>'
        '<g fill="#431407" opacity="0.78">'
        '<rect x="96" y="148" width="18" height="28" rx="9"/><rect x="132" y="148" width="18" height="28" rx="9"/>'
        '<rect x="168" y="148" width="18" height="28" rx="9"/><rect x="214" y="148" width="18" height="28" rx="9"/>'
        '<rect x="250" y="148" width="18" height="28" rx="9"/><rect x="286" y="148" width="18" height="28" rx="9"/>'
        '<rect x="176" y="192" width="48" height="44" rx="22"/>'
        '</g>'
        '<rect y="236" width="400" height="24" fill="#451a03"/>'
        '</svg>'
    )


def _spiti_svg() -> str:
    return (
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 260" preserveAspectRatio="xMidYMid slice">'
        '<defs>'
        '<linearGradient id="ssky" x1="0" y1="0" x2="0" y2="1">'
        '<stop offset="0%" stop-color="#1d4ed8"/><stop offset="58%" stop-color="#60a5fa"/><stop offset="100%" stop-color="#dbeafe"/></linearGradient>'
        '<linearGradient id="srock" x1="0" y1="0" x2="0" y2="1">'
        '<stop offset="0%" stop-color="#926c4b"/><stop offset="100%" stop-color="#4e3422"/></linearGradient>'
        '</defs>'
        '<rect width="400" height="260" fill="url(#ssky)"/>'
        '<polygon points="0,190 95,88 185,155 290,72 400,148 400,260 0,260" fill="#6b7280" opacity="0.65"/>'
        '<polygon points="95,88 70,118 96,110 120,122" fill="#f8fafc" opacity="0.9"/>'
        '<polygon points="290,72 260,104 290,96 320,108" fill="#f8fafc" opacity="0.92"/>'
        '<polygon points="20,260 155,112 245,112 365,260" fill="url(#srock)"/>'
        '<g fill="#f8fafc" stroke="#7f1d1d" stroke-width="1.5">'
        '<rect x="164" y="96" width="72" height="22" rx="1"/>'
        '<rect x="174" y="80" width="52" height="18" rx="1"/>'
        '<rect x="186" y="68" width="28" height="14" rx="1"/>'
        '</g>'
        '<g fill="#7f1d1d"><rect x="164" y="94" width="72" height="4"/><rect x="174" y="78" width="52" height="4"/><rect x="186" y="66" width="28" height="4"/></g>'
        '<path d="M0 245 Q130 220 260 236 T400 224 V260 H0 Z" fill="#38bdf8" opacity="0.72"/>'
        '</svg>'
    )


def _gangtok_svg() -> str:
    return (
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 260" preserveAspectRatio="xMidYMid slice">'
        '<defs>'
        '<linearGradient id="gtsky" x1="0" y1="0" x2="0" y2="1">'
        '<stop offset="0%" stop-color="#1e3a8a"/><stop offset="52%" stop-color="#7dd3fc"/><stop offset="100%" stop-color="#fde68a"/></linearGradient>'
        '</defs>'
        '<rect width="400" height="260" fill="url(#gtsky)"/>'
        '<polygon points="0,185 88,68 175,135 245,52 330,118 400,82 400,260 0,260" fill="#cbd5e1"/>'
        '<polygon points="245,52 204,104 246,94 282,108" fill="#ffffff"/>'
        '<polygon points="88,68 58,108 92,100 120,112" fill="#ffffff" opacity="0.92"/>'
        '<path d="M0 165 Q110 132 230 162 T400 148 V260 H0 Z" fill="#1e463a"/>'
        '<path d="M0 202 Q130 176 280 202 T400 188 V260 H0 Z" fill="#132e26"/>'
        '<g transform="translate(150,148)">'
        '<rect x="10" y="20" width="84" height="30" fill="#fef3c7" stroke="#7f1d1d" stroke-width="2"/>'
        '<path d="M0 20 Q52 2 104 20 Z" fill="#dc2626"/>'
        '<path d="M16 12 Q52 -4 88 12 Z" fill="#f59e0b"/>'
        '<circle cx="52" cy="-2" r="5" fill="#fde047"/>'
        '</g>'
        '<path d="M12 132 Q120 158 235 126 T395 144" stroke="#ffffff" stroke-width="1.5" fill="none" stroke-dasharray="10 6"/>'
        '</svg>'
    )


def _hampi_svg() -> str:
    return (
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 260" preserveAspectRatio="xMidYMid slice">'
        '<defs>'
        '<linearGradient id="hsky" x1="0" y1="0" x2="0" y2="1">'
        '<stop offset="0%" stop-color="#9a3412"/><stop offset="52%" stop-color="#fb923c"/><stop offset="100%" stop-color="#fef08a"/></linearGradient>'
        '</defs>'
        '<rect width="400" height="260" fill="url(#hsky)"/>'
        '<circle cx="305" cy="74" r="34" fill="#fef9c3" opacity="0.88"/>'
        '<ellipse cx="64" cy="175" rx="58" ry="42" fill="#92400e"/>'
        '<ellipse cx="105" cy="148" rx="34" ry="28" fill="#b45309"/>'
        '<ellipse cx="342" cy="178" rx="64" ry="46" fill="#78350f"/>'
        '<ellipse cx="315" cy="144" rx="32" ry="26" fill="#a16207"/>'
        '<rect y="192" width="400" height="68" fill="#451a03"/>'
        '<g fill="#d6b48a" stroke="#57391d" stroke-width="1.5">'
        '<rect x="148" y="136" width="104" height="58" rx="3"/>'
        '<polygon points="160,136 200,82 240,136"/>'
        '<rect x="172" y="152" width="56" height="42" fill="#78350f" opacity="0.55"/>'
        '<circle cx="168" cy="196" r="17" fill="#c29a6b" stroke="#451a03" stroke-width="3"/>'
        '<circle cx="232" cy="196" r="17" fill="#c29a6b" stroke="#451a03" stroke-width="3"/>'
        '</g>'
        '<path d="M38 228 Q45 190 42 162" stroke="#166534" stroke-width="4" fill="none"/>'
        '<path d="M42 162 Q24 156 16 170 M42 162 Q60 156 68 170" stroke="#15803d" stroke-width="3.5" fill="none"/>'
        '</svg>'
    )


def _pondicherry_svg() -> str:
    return (
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 260" preserveAspectRatio="xMidYMid slice">'
        '<defs>'
        '<linearGradient id="psky" x1="0" y1="0" x2="0" y2="1">'
        '<stop offset="0%" stop-color="#0284c7"/><stop offset="65%" stop-color="#bae6fd"/><stop offset="100%" stop-color="#fef9c3"/></linearGradient>'
        '</defs>'
        '<rect width="400" height="260" fill="url(#psky)"/>'
        '<rect y="162" width="400" height="36" fill="#0ea5e9" opacity="0.6"/>'
        '<rect x="28" y="76" width="166" height="146" rx="4" fill="#facc15"/>'
        '<rect x="194" y="96" width="178" height="126" rx="4" fill="#fde047"/>'
        '<rect x="24" y="70" width="174" height="10" fill="#ffffff"/>'
        '<rect x="190" y="90" width="186" height="10" fill="#ffffff"/>'
        '<g fill="#ffffff" stroke="#b45309" stroke-width="2">'
        '<rect x="52" y="106" width="38" height="58" rx="19"/>'
        '<rect x="118" y="106" width="38" height="58" rx="19"/>'
        '<rect x="224" y="122" width="36" height="54" rx="18"/>'
        '<rect x="292" y="122" width="36" height="54" rx="18"/>'
        '</g>'
        '<g fill="#ec4899" opacity="0.9">'
        '<circle cx="44" cy="96" r="14"/><circle cx="62" cy="84" r="16"/><circle cx="84" cy="94" r="13"/>'
        '<circle cx="192" cy="112" r="16"/><circle cx="212" cy="100" r="14"/><circle cx="176" cy="102" r="13"/>'
        '<circle cx="348" cy="108" r="15"/><circle cx="366" cy="118" r="13"/>'
        '</g>'
        '<rect y="220" width="400" height="40" fill="#64748b"/>'
        '</svg>'
    )


def _nainital_svg() -> str:
    return (
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 260" preserveAspectRatio="xMidYMid slice">'
        '<defs>'
        '<linearGradient id="nsky" x1="0" y1="0" x2="0" y2="1">'
        '<stop offset="0%" stop-color="#2563eb"/><stop offset="65%" stop-color="#93c5fd"/><stop offset="100%" stop-color="#e0f2fe"/></linearGradient>'
        '<linearGradient id="nlake" x1="0" y1="0" x2="0" y2="1">'
        '<stop offset="0%" stop-color="#0f766e"/><stop offset="100%" stop-color="#0d9488"/></linearGradient>'
        '</defs>'
        '<rect width="400" height="260" fill="url(#nsky)"/>'
        '<path d="M0 155 L75 74 L175 135 L278 66 L400 132 L400 190 L0 190 Z" fill="#1e463a"/>'
        '<path d="M0 170 Q110 118 220 154 T400 136 V195 H0 Z" fill="#15803d" opacity="0.72"/>'
        '<ellipse cx="200" cy="212" rx="225" ry="62" fill="url(#nlake)"/>'
        '<path d="M72 204 Q140 198 205 205 M235 224 Q295 218 350 226" stroke="#99f6e4" stroke-width="2" fill="none" opacity="0.65"/>'
        '<g fill="#ffffff">'
        '<path d="M128 205 L162 205 L154 214 L136 214 Z" fill="#f59e0b"/>'
        '<path d="M234 196 L270 196 L262 205 L242 205 Z" fill="#ef4444"/>'
        '<rect x="64" y="138" width="16" height="11" rx="1"/><rect x="86" y="132" width="14" height="10" rx="1"/>'
        '<rect x="296" y="128" width="18" height="11" rx="1"/><rect x="322" y="136" width="15" height="10" rx="1"/>'
        '</g>'
        '</svg>'
    )


def _mussoorie_svg() -> str:
    return (
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 260" preserveAspectRatio="xMidYMid slice">'
        '<defs>'
        '<linearGradient id="msky" x1="0" y1="0" x2="0" y2="1">'
        '<stop offset="0%" stop-color="#312e81"/><stop offset="48%" stop-color="#f97316"/><stop offset="100%" stop-color="#fde68a"/></linearGradient>'
        '</defs>'
        '<rect width="400" height="260" fill="url(#msky)"/>'
        '<circle cx="115" cy="96" r="32" fill="#fef3c7" opacity="0.88"/>'
        '<path d="M0 175 Q95 112 200 152 T400 120 V260 H0 Z" fill="#3b4d6b" opacity="0.72"/>'
        '<path d="M0 198 Q120 144 255 182 T400 162 V260 H0 Z" fill="#1e3a34"/>'
        '<path d="M0 226 Q135 190 270 220 T400 205 V260 H0 Z" fill="#0f241f"/>'
        '<path d="M0 178 Q120 168 240 184 T400 172 V196 H0 Z" fill="#ffffff" opacity="0.22"/>'
        '<g fill="#fef08a" opacity="0.9">'
        '<circle cx="152" cy="188" r="2.5"/><circle cx="168" cy="184" r="2"/><circle cx="184" cy="192" r="2.5"/>'
        '<circle cx="242" cy="180" r="2.5"/><circle cx="262" cy="176" r="2"/><circle cx="280" cy="185" r="2.5"/>'
        '</g>'
        '</svg>'
    )


def _kodaikanal_svg() -> str:
    return (
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 260" preserveAspectRatio="xMidYMid slice">'
        '<defs>'
        '<linearGradient id="ksky" x1="0" y1="0" x2="0" y2="1">'
        '<stop offset="0%" stop-color="#0f766e"/><stop offset="56%" stop-color="#5eead4"/><stop offset="100%" stop-color="#ecfeff"/></linearGradient>'
        '</defs>'
        '<rect width="400" height="260" fill="url(#ksky)"/>'
        '<path d="M0 162 Q105 94 210 142 T400 112 V200 H0 Z" fill="#115e59" opacity="0.8"/>'
        '<ellipse cx="205" cy="214" rx="220" ry="54" fill="#0284c7" opacity="0.78"/>'
        '<path d="M0 168 Q110 156 225 170 T400 158 V186 H0 Z" fill="#ffffff" opacity="0.38"/>'
        '<g fill="#064e3b">'
        '<polygon points="34,215 48,140 62,215"/><polygon points="58,218 74,132 90,218"/>'
        '<polygon points="308,216 326,128 344,216"/><polygon points="340,218 358,142 376,218"/>'
        '</g>'
        '</svg>'
    )


def scene_svg(slug: str = "generic") -> str:
    s = str(slug or "").lower()
    custom = {
        "goa": _goa_svg,
        "jaipur": _jaipur_svg,
        "spiti": _spiti_svg,
        "gangtok": _gangtok_svg,
        "hampi": _hampi_svg,
        "pondicherry": _pondicherry_svg,
        "nainital": _nainital_svg,
        "mussoorie": _mussoorie_svg,
        "kodaikanal": _kodaikanal_svg,
    }
    if s in custom:
        return custom[s]()
    palette = {
        "manali": ("#3a6ea5", "#1c3557", "#eef4ff"),
        "shimla": ("#4b7f8c", "#1b3a3a", "#dcebe8"),
        "ladakh": ("#2b6cb0", "#5f4b32", "#f6e5c3"),
        "mathura": ("#8c4a27", "#361812", "#ffd59a"),
        "kashmir": ("#4a7bb0", "#1b3b4b", "#eaf3ff"),
        "rishikesh": ("#2f855a", "#143d32", "#d8f3dc"),
        "darjeeling": ("#4d7c5b", "#1c3829", "#e6f2ea"),
        "uttarakhand": ("#3b6978", "#1b303f", "#d8e9f0"),
        "udaipur": ("#2b5876", "#4e4376", "#fde68a"),
        "kerala": ("#0f766e", "#134e4a", "#a7f3d0"),
        "varanasi": ("#b45309", "#451a03", "#fde047"),
        "agra": ("#c2410c", "#431407", "#ffedd5"),
        "andaman": ("#0284c7", "#0c4a6e", "#bae6fd"),
        "coorg": ("#166534", "#052e16", "#bbf7d0"),
        "ooty": ("#15803d", "#14532d", "#dcfce7"),
        "munnar": ("#047857", "#064e3b", "#d1fae5"),
        "meghalaya": ("#0d9488", "#134e4a", "#99f6e4"),
        "jaisalmer": ("#d97706", "#78350f", "#fef3c7"),
        "jodhpur": ("#1d4ed8", "#1e3a8a", "#bfdbfe"),
        "amritsar": ("#b45309", "#451a03", "#fef08a"),
        "kedarnath": ("#334155", "#0f172a", "#f1f5f9"),
    }.get(s, ("#36558f", "#14213d", "#e0e7ff"))
    sky, ridge, accent = palette
    return (
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 260" preserveAspectRatio="xMidYMid slice">'
        f'<defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1">'
        f'<stop offset="0%" stop-color="{sky}"/><stop offset="100%" stop-color="{ridge}"/></linearGradient></defs>'
        '<rect width="400" height="260" fill="url(#g)"/>'
        f'<circle cx="315" cy="64" r="28" fill="{accent}" opacity="0.35"/>'
        f'<polygon points="0,260 95,120 195,200 295,95 400,190 400,260" fill="{ridge}" opacity="0.9"/>'
        f'<polygon points="295,95 255,140 295,130 335,142" fill="{accent}" opacity="0.8"/>'
        '</svg>'
    )
