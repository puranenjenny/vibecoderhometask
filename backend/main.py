from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from pathlib import Path
from typing import List
import json
from datetime import datetime, UTC


app = FastAPI(title="On-call Handover Tool API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DATA_FILE = Path(__file__).parent / "handovers.json"


class HandoverCreate(BaseModel):
    onCallPerson: str = Field(..., min_length=1)
    shiftDate: str = Field(..., min_length=1)
    summary: str = Field(..., min_length=1)
    whatHappened: str = Field(..., min_length=1)
    nextSteps: str = Field(..., min_length=1)
    priority: str = Field(..., min_length=1)


class Handover(HandoverCreate):
    id: int
    createdAt: str


def ensure_data_file() -> None:
    if not DATA_FILE.exists():
        DATA_FILE.write_text("[]", encoding="utf-8")


def load_handovers() -> List[dict]:
    ensure_data_file()
    try:
        with open(DATA_FILE, "r", encoding="utf-8") as file:
            return json.load(file)
    except json.JSONDecodeError:
        return []


def save_handovers(handovers: List[dict]) -> None:
    with open(DATA_FILE, "w", encoding="utf-8") as file:
        json.dump(handovers, file, ensure_ascii=False, indent=2)


@app.get("/handovers", response_model=List[Handover])
def get_handovers():
    handovers = load_handovers()
    handovers.sort(key=lambda x: x.get("createdAt", ""), reverse=True)
    return handovers


@app.post("/handovers", response_model=Handover, status_code=201)
def create_handover(handover: HandoverCreate):
    handovers = load_handovers()

    now = datetime.now(UTC)

    new_handover = {
        "id": int(now.timestamp() * 1000),
        "createdAt": now.isoformat(),
        "onCallPerson": handover.onCallPerson.strip(),
        "shiftDate": handover.shiftDate.strip(),
        "summary": handover.summary.strip(),
        "whatHappened": handover.whatHappened.strip(),
        "nextSteps": handover.nextSteps.strip(),
        "priority": handover.priority.strip(),
    }

    handovers.append(new_handover)
    save_handovers(handovers)
    return new_handover


@app.get("/")
def root():
    return {"message": "On-call Handover Tool API is running"}