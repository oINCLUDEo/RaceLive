"""Слой провайдера данных.

Провайдер прячется за этим интерфейсом (ADR-001). Реализации: JolpicaProvider (MVP,
расписание/результаты), OpenF1Provider (live+телеметрия, Фаза 3), FastF1Provider (бэкфилл).

Ниже — нормализованные типы, общие для всех провайдеров. Роутеры и БД работают только с ними,
а не с сырыми ответами источника.
"""

from dataclasses import dataclass, field
from datetime import datetime
from typing import Protocol, runtime_checkable


@dataclass
class ProviderSession:
    type: str  # practice | qualifying | sprint_qualifying | sprint | race
    name_en: str
    name_ru: str | None
    starts_at: datetime | None
    provider_key: str


@dataclass
class ProviderMeeting:
    round: int
    name_en: str
    name_ru: str | None
    circuit_key: str
    circuit_name_en: str
    circuit_name_ru: str | None
    country: str | None
    starts_at: datetime | None
    ends_at: datetime | None
    sessions: list[ProviderSession] = field(default_factory=list)


@dataclass
class ProviderDriverStanding:
    position: int
    points: float
    wins: int
    code: str
    given: str
    family: str
    constructor_id: str
    constructor_name: str


@dataclass
class ProviderConstructorStanding:
    position: int
    points: float
    wins: int
    constructor_id: str
    constructor_name: str


@dataclass
class ProviderRaceResult:
    position: int
    points: float
    grid: int
    status: str
    time: str | None
    code: str
    given: str
    family: str
    constructor_id: str
    constructor_name: str


@runtime_checkable
class DataProvider(Protocol):
    name: str

    async def race_results(self, season: int, rnd: int | str) -> list[ProviderRaceResult]:
        """Финишный протокол гонки этапа (rnd — номер этапа или 'last')."""
        ...

    async def driver_standings(self, season: int) -> list[ProviderDriverStanding]:
        """Личный зачёт сезона."""
        ...

    async def constructor_standings(
        self, season: int
    ) -> list[ProviderConstructorStanding]:
        """Кубок конструкторов сезона."""
        ...

    async def schedule(self, season: int) -> list[ProviderMeeting]:
        """Календарь сезона: этапы и их сессии.

        Полный целевой интерфейс (results / live_timing / car_data / race_control) описан в
        docs/architecture.md и реализуется по фазам. В MVP обязателен только schedule().
        """
        ...
