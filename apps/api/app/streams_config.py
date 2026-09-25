"""Курируемый список стримов кастеров (Фаза 6).

Видео НЕ хостим (твёрдое правило, ADR-007): встраиваем официальный iframe-плеер
площадки (VK Видео / Rutube) с согласия кастеров. Только хосты из ALLOWED_EMBED_HOSTS.

Запись задаёт источник одним из двух способов:
  • "auto": {...} — авто-подхват эфира по каналу/сообществу (резолвер в фоне):
        Rutube → {"channel": "<id из URL rutube.ru/channel/<id>/>"} (без ключа)
        VK     → {"screen_name": "<короткое имя>"} (нужен VK_SERVICE_TOKEN)
  • "embed_url": "<src плеера>" — ручной режим (конкретная трансляция).

Если кастер стримит сразу на несколько площадок — вместо platform/channel_url/auto
задаём "sources": [{platform, channel_url, auto}, ...]. Первый — основной; на сайте
появится переключатель площадки (Rutube режет зарубежных зрителей/VPN — VK выручает).

Флаг «в эфире»: в auto — из резолвера; в ручном — стартовый "live" + тумблер
POST /streams/{id}/live (за X-Admin-Token).
"""

ALLOWED_EMBED_HOSTS = ("vk.com", "vk.ru", "vkvideo.ru", "rutube.ru")

STREAMS: list[dict] = [
    {
        "id": "stanislavskiy",
        "caster": "Станиславский",
        "round": None,
        "note": None,
        "sources": [
            {
                "platform": "rutube",
                "channel_url": "https://rutube.ru/channel/35504962/",
                "auto": {"channel": "35504962"},
            },
            {
                "platform": "vk",
                "channel_url": "https://vk.ru/stanizlavskylive",
                "auto": {"screen_name": "stanizlavskylive"},
            },
        ],
    },
    {
        "id": "vershina-avtosporta",
        "caster": "Вершина Автоспорта",
        "platform": "rutube",
        "channel_url": "https://rutube.ru/channel/34418531/",
        "round": None,
        "note": None,
        "auto": {"channel": "34418531"},
    },
    {
        "id": "f1memes",
        "caster": "F1 Memes",
        "platform": "vk",
        "channel_url": "https://vk.com/f1memestv",
        "round": None,
        "note": None,
        "auto": {"screen_name": "f1memestv"},
    },
]
