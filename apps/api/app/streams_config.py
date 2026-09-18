"""Курируемый список стримов кастеров (Фаза 6).

Видео НЕ хостим (твёрдое правило, ADR-007): встраиваем официальный iframe-плеер
площадки (VK Video / Rutube) с согласия кастеров. Реальные ссылки подставляет
пользователь — как логотипы команд и фото пилотов. Разрешены только хосты из
ALLOWED_EMBED_HOSTS (проверяется в сервисе), чтобы конфиг не встроил чужой origin.

Как добавить кастера: скопируй запись, впиши `caster`, `platform` (vk|rutube),
`embed_url` (src из «Поделиться → Экспортировать» плеера площадки) и `channel_url`.
Флаг `live` — стартовое значение; в уик-энд флипается тумблером POST /streams/{id}/live.

Формат embed_url:
  VK:     https://vk.com/video_ext.php?oid=<owner>&id=<video>&hd=2
  Rutube: https://rutube.ru/play/embed/<video_id>
"""

ALLOWED_EMBED_HOSTS = ("vk.com", "vkvideo.ru", "rutube.ru")

STREAMS: list[dict] = [
    {
        "id": "example-vk",
        "caster": "Пример · кастер на VK",
        "platform": "vk",
        "embed_url": "https://vk.com/video_ext.php?oid=-22822305&id=456242793&hd=2",
        "channel_url": "https://vk.com/video",
        "round": None,
        "live": False,
        "note": "Замените на реальную трансляцию кастера",
    },
    {
        "id": "example-rutube",
        "caster": "Пример · кастер на Rutube",
        "platform": "rutube",
        "embed_url": "https://rutube.ru/play/embed/b3a9b57f3a4b3f2c1d0e9f8a7b6c5d4e",
        "channel_url": "https://rutube.ru/",
        "round": None,
        "live": False,
        "note": "Замените на реальную трансляцию кастера",
    },
]
