"""Русская локализация справочников (этапы, трассы, страны) + коды стран для флагов.

Провайдеры отдают английские названия; RU-названия живут здесь и попадают в БД
(`name_ru`) при кэшировании, а также применяются как fallback в сериализаторах —
чтобы уже закэшированные английские записи всё равно отдавались по-русски.

Ключ — circuitId из Ergast/Jolpica. Значение: (гран-при, трасса, страна, ISO2-код страны).
ISO2 в нижнем регистре — для флагов (flagcdn).
"""

CIRCUITS: dict[str, tuple[str, str, str, str]] = {
    "bahrain": ("Гран-при Бахрейна", "Международный автодром Бахрейна", "Бахрейн", "bh"),
    "jeddah": ("Гран-при Саудовской Аравии", "Трасса Джидда-Корниш", "Саудовская Аравия", "sa"),
    "albert_park": ("Гран-при Австралии", "Альберт-Парк", "Австралия", "au"),
    "suzuka": ("Гран-при Японии", "Сузука", "Япония", "jp"),
    "shanghai": ("Гран-при Китая", "Шанхайский автодром", "Китай", "cn"),
    "miami": ("Гран-при Майами", "Международный автодром Майами", "США", "us"),
    "imola": ("Гран-при Эмилии-Романьи", "Имола", "Италия", "it"),
    "monaco": ("Гран-при Монако", "Монте-Карло", "Монако", "mc"),
    "villeneuve": ("Гран-при Канады", "Трасса имени Жиля Вильнёва", "Канада", "ca"),
    "catalunya": ("Гран-при Испании", "Каталунья-Барселона", "Испания", "es"),
    "red_bull_ring": ("Гран-при Австрии", "Ред Булл Ринг", "Австрия", "at"),
    "silverstone": ("Гран-при Великобритании", "Сильверстоун", "Великобритания", "gb"),
    "hungaroring": ("Гран-при Венгрии", "Хунгароринг", "Венгрия", "hu"),
    "spa": ("Гран-при Бельгии", "Спа-Франкоршам", "Бельгия", "be"),
    "zandvoort": ("Гран-при Нидерландов", "Зандворт", "Нидерланды", "nl"),
    "monza": ("Гран-при Италии", "Монца", "Италия", "it"),
    "baku": ("Гран-при Азербайджана", "Городская трасса Баку", "Азербайджан", "az"),
    "marina_bay": ("Гран-при Сингапура", "Марина-Бей", "Сингапур", "sg"),
    "americas": ("Гран-при США", "Трасса Америк", "США", "us"),
    "rodriguez": ("Гран-при Мексики", "Автодром имени братьев Родригес", "Мексика", "mx"),
    "interlagos": ("Гран-при Сан-Паулу", "Интерлагос", "Бразилия", "br"),
    "vegas": ("Гран-при Лас-Вегаса", "Городская трасса Лас-Вегаса", "США", "us"),
    "las_vegas": ("Гран-при Лас-Вегаса", "Городская трасса Лас-Вегаса", "США", "us"),
    "losail": ("Гран-при Катара", "Международный автодром Лусаил", "Катар", "qa"),
    "yas_marina": ("Гран-при Абу-Даби", "Яс-Марина", "ОАЭ", "ae"),
    "portimao": ("Гран-при Португалии", "Алгарве", "Португалия", "pt"),
    "mugello": ("Гран-при Тосканы", "Муджелло", "Италия", "it"),
    "sepang": ("Гран-при Малайзии", "Сепанг", "Малайзия", "my"),
    "madring": ("Гран-при Мадрида", "Мадринг", "Испания", "es"),
    "madrid": ("Гран-при Мадрида", "Мадринг", "Испания", "es"),
}

# Страна EN -> (RU, ISO2) — fallback, когда трасса неизвестна, но страна известна.
COUNTRIES: dict[str, tuple[str, str]] = {
    "Bahrain": ("Бахрейн", "bh"), "Saudi Arabia": ("Саудовская Аравия", "sa"),
    "Australia": ("Австралия", "au"), "Japan": ("Япония", "jp"), "China": ("Китай", "cn"),
    "USA": ("США", "us"), "United States": ("США", "us"), "Italy": ("Италия", "it"),
    "Monaco": ("Монако", "mc"), "Canada": ("Канада", "ca"), "Spain": ("Испания", "es"),
    "Austria": ("Австрия", "at"), "UK": ("Великобритания", "gb"),
    "United Kingdom": ("Великобритания", "gb"), "Hungary": ("Венгрия", "hu"),
    "Belgium": ("Бельгия", "be"), "Netherlands": ("Нидерланды", "nl"),
    "Azerbaijan": ("Азербайджан", "az"), "Singapore": ("Сингапур", "sg"),
    "Mexico": ("Мексика", "mx"), "Brazil": ("Бразилия", "br"), "Qatar": ("Катар", "qa"),
    "UAE": ("ОАЭ", "ae"), "United Arab Emirates": ("ОАЭ", "ae"),
    "Portugal": ("Португалия", "pt"),
}


def meeting_name_ru(circuit_key: str | None, name_en: str) -> str | None:
    if circuit_key and circuit_key in CIRCUITS:
        return CIRCUITS[circuit_key][0]
    return None


def circuit_name_ru(circuit_key: str | None, name_en: str) -> str | None:
    if circuit_key and circuit_key in CIRCUITS:
        return CIRCUITS[circuit_key][1]
    return None


def country_ru(circuit_key: str | None, country_en: str | None) -> str | None:
    if circuit_key and circuit_key in CIRCUITS:
        return CIRCUITS[circuit_key][2]
    if country_en and country_en in COUNTRIES:
        return COUNTRIES[country_en][0]
    return None


def country_code(circuit_key: str | None, country_en: str | None) -> str | None:
    if circuit_key and circuit_key in CIRCUITS:
        return CIRCUITS[circuit_key][3]
    if country_en and country_en in COUNTRIES:
        return COUNTRIES[country_en][1]
    return None


# RU-имена пилотов по 3-буквенному коду (текущий/недавний грид).
DRIVERS: dict[str, str] = {
    "VER": "Макс Ферстаппен", "NOR": "Ландо Норрис", "PIA": "Оскар Пиастри",
    "LEC": "Шарль Леклер", "HAM": "Льюис Хэмилтон", "RUS": "Джордж Расселл",
    "SAI": "Карлос Сайнс", "ALO": "Фернандо Алонсо", "STR": "Лэнс Стролл",
    "GAS": "Пьер Гасли", "OCO": "Эстебан Окон", "ALB": "Александер Албон",
    "HUL": "Нико Хюлькенберг", "TSU": "Юки Цунода", "LAW": "Лиам Лоусон",
    "HAD": "Исак Хаджар", "ANT": "Кими Антонелли", "BOR": "Габриэл Бортолето",
    "BEA": "Оливер Бирман", "COL": "Франко Колапинто", "DOO": "Джек Дулан",
    "LIN": "Арвид Линдблад",
    "PER": "Серхио Перес", "BOT": "Валттери Боттас", "ZHO": "Гуанью Чжоу",
    "RIC": "Даниэль Риккардо", "MAG": "Кевин Магнуссен", "SAR": "Логан Сарджент",
}

# constructorId (Jolpica) -> наш slug команды (для логотипа/цвета).
CONSTRUCTORS: dict[str, str] = {
    "red_bull": "redbull", "mclaren": "mclaren", "ferrari": "ferrari",
    "mercedes": "mercedes", "aston_martin": "astonmartin", "williams": "williams",
    "rb": "rb", "racing_bulls": "rb", "alphatauri": "rb",
    "haas": "haas", "sauber": "sauber", "kick_sauber": "sauber",
    "audi": "audi", "alpine": "alpine", "cadillac": "cadillac",
}


def driver_name_ru(code: str, en_fallback: str) -> str | None:
    return DRIVERS.get(code) or (en_fallback.strip() or None)


def team_slug_for(constructor_id: str) -> str | None:
    return CONSTRUCTORS.get(constructor_id)
