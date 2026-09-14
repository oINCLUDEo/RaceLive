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
    driver_id: str = ""


@dataclass
class ProviderQualifyingResult:
    position: int
    code: str
    given: str
    family: str
    constructor_id: str
    constructor_name: str
    q1: str | None
    q2: str | None
    q3: str | None
    driver_id: str = ""


@dataclass
class ProviderDriverInfo:
    driver_id: str
    code: str
    given: str
    family: str
    number: str | None
    nationality: str | None
    dob: str | None


@dataclass
class ProviderDriverSeasonResult:
    round: int
    race_name: str
    circuit_id: str
    position: int
    points: float
    grid: int
    status: str


@dataclass
class ProviderConstructorStanding:
    position: int
    points: float
    wins: int
    constructor_id: str
    constructor_name: str


@dataclass
class ProviderConstructorInfo:
    constructor_id: str
    name: str
    nationality: str | None


@dataclass
class ProviderResultEntry:
    code: str
    given: str
    family: str
    driver_id: str
    position: int
    status: str
    points: float


@dataclass
class ProviderConstructorRound:
    round: int
    race_name: str
    circuit_id: str
    entries: list[ProviderResultEntry]


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
    driver_id: str = ""


@runtime_checkable
class DataProvider(Protocol):
    name: str

    async def race_results(self, season: int, rnd: int | str) -> list[ProviderRaceResult]:
        """Финишный протокол гонки этапа (rnd — номер этапа или 'last')."""
        ...

    async def qualifying_results(
        self, season: int, rnd: int | str
    ) -> list[ProviderQualifyingResult]:
        """Результаты квалификации этапа."""
        ...

    async def driver_info(self, season: int, driver_id: str) -> ProviderDriverInfo | None:
        """Профиль пилота."""
        ...

    async def driver_results(
        self, season: int, driver_id: str
    ) -> list[ProviderDriverSeasonResult]:
        """Результаты пилота по этапам сезона."""
        ...

    async def driver_standings(self, season: int) -> list[ProviderDriverStanding]:
        """Личный зачёт сезона."""
        ...

    async def constructor_standings(
        self, season: int
    ) -> list[ProviderConstructorStanding]:
        """Кубок конструкторов сезона."""
        ...

    async def constructor_info(
        self, season: int, constructor_id: str
    ) -> ProviderConstructorInfo | None:
        """Профиль команды (название, национальность)."""
        ...

    async def constructor_results(
        self, season: int, constructor_id: str
    ) -> list[ProviderConstructorRound]:
        """Результаты команды по этапам сезона (обе машины)."""
        ...

    async def schedule(self, season: int) -> list[ProviderMeeting]:
        """Календарь сезона: этапы и их сессии.

        Полный целевой интерфейс (results / live_timing / car_data / race_control) описан в
        docs/architecture.md и реализуется по фазам. В MVP обязателен только schedule().
        """
        ...
