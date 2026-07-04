from pydantic import BaseModel, ConfigDict


class ResumeUploadResponse(BaseModel):
    filename: str

    model_config = ConfigDict(extra="forbid")


class ResumePageText(BaseModel):
    page_number: int
    text: str

    model_config = ConfigDict(extra="forbid")


class ParsedResumeText(BaseModel):
    filename: str
    page_count: int
    text: str
    pages: list[ResumePageText]

    model_config = ConfigDict(extra="forbid")
