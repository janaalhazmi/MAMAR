from sqlalchemy.orm import Session

from app.models import Activity


def log_activity(db: Session, user, action: str, detail: str, project_id: int | None = None) -> None:
    # Adds one line to the audit log. It is saved with the action's own commit.
    db.add(Activity(
        user_id=getattr(user, "user_id", None),
        action=action,
        detail=detail[:300],
        project_id=project_id,
    ))
