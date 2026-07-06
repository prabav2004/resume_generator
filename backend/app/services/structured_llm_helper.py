import json
import logging
import re
from typing import TypeVar

from pydantic import BaseModel, ValidationError

from app.services.llm_utils import is_schema_error

logger = logging.getLogger(__name__)
T = TypeVar("T", bound=BaseModel)


def _message_content(response) -> str:
    content = getattr(response, "content", response)
    if isinstance(content, str):
        return content
    if isinstance(content, list):
        parts: list[str] = []
        for item in content:
            if isinstance(item, str):
                parts.append(item)
            elif isinstance(item, dict) and isinstance(item.get("text"), str):
                parts.append(item["text"])
        return "".join(parts)
    return str(content)


def _strip_code_fence(text: str) -> str:
    text = text.strip()
    match = re.fullmatch(r"```(?:json)?\s*(.*?)\s*```", text, flags=re.IGNORECASE | re.DOTALL)
    return match.group(1).strip() if match else text


def parse_and_validate_json(text: str, model_cls: type[T]) -> T:
    cleaned = _strip_code_fence(text)
    data = json.loads(cleaned)
    if isinstance(data, list) and len(data) == 1 and isinstance(data[0], dict):
        data = data[0]
    if not isinstance(data, dict):
        raise ValueError("LLM output must be one JSON object.")
    return model_cls.model_validate(data)


def invoke_structured_with_json_recovery(
    *,
    llm,
    messages,
    model_cls: type[T],
    provider: str,
    stage: str,
    analysis_id: str,
) -> T:
    """Try native structured output, then one plain-JSON recovery for schema failures."""
    try:
        logger.info(
            "analysis_id=%s stage=%s provider=%s mode=native_structured attempt=1",
            analysis_id, stage, provider,
        )
        result = llm.with_structured_output(model_cls).invoke(messages)
        if isinstance(result, model_cls):
            return result
        return model_cls.model_validate(result)
    except Exception as native_exc:
        if not is_schema_error(native_exc):
            raise
        logger.warning(
            "analysis_id=%s stage=%s provider=%s native_structured_failed type=%s",
            analysis_id, stage, provider, type(native_exc).__name__,
        )

    schema = json.dumps(model_cls.model_json_schema(), separators=(",", ":"))
    recovery_instruction = (
        "Return exactly ONE valid JSON object matching the JSON schema below. "
        "The first non-whitespace character must be { and the last must be }. "
        "Never return a top-level array or wrap the object in an array. "
        "Do not use markdown fences. Do not include commentary before or after the JSON. "
        "Do not add fields outside the schema. Ensure every property uses valid JSON syntax.\n"
        f"JSON SCHEMA:\n{schema}"
    )
    recovery_messages = [*messages, ("user", recovery_instruction)]
    logger.info(
        "analysis_id=%s stage=%s provider=%s mode=plain_json_retry attempt=2",
        analysis_id, stage, provider,
    )
    response = llm.invoke(recovery_messages)
    try:
        result = parse_and_validate_json(_message_content(response), model_cls)
    except (json.JSONDecodeError, ValidationError, ValueError, TypeError) as exc:
        logger.warning(
            "analysis_id=%s stage=%s provider=%s plain_json_retry_failed type=%s",
            analysis_id, stage, provider, type(exc).__name__,
        )
        raise ValueError("Provider returned invalid structured JSON after recovery retry.") from exc
    logger.info(
        "analysis_id=%s stage=%s provider=%s plain_json_retry_success=true",
        analysis_id, stage, provider,
    )
    return result
