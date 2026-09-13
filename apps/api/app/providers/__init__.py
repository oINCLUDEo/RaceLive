from ..config import get_settings
from .base import DataProvider
from .jolpica import JolpicaProvider

_providers: dict[str, DataProvider] = {}


def get_provider() -> DataProvider:
    name = get_settings().data_provider
    if name not in _providers:
        if name == "jolpica":
            _providers[name] = JolpicaProvider()
        else:
            # OpenF1Provider / FastF1Provider подключаются в Фазах 3–4
            raise ValueError(f"Неизвестный провайдер данных: {name}")
    return _providers[name]
