from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import ProjectMilestone

MILESTONE_NAMES = (
    "Site Preparation",
    "Traffic Control Installation",
    "Final Site Check",
)

MILESTONE_STATUSES = ("pending", "in_progress", "completed")


def ensure_project_milestones(db: Session, project_id: int) -> list[ProjectMilestone]:
    """Create the fixed three milestones if they do not already exist."""
    rows = db.scalars(
        select(ProjectMilestone)
        .where(ProjectMilestone.project_id == project_id)
        .order_by(ProjectMilestone.milestone_id)
    ).all()
    existing = {row.name for row in rows}

    for name in MILESTONE_NAMES:
        if name not in existing:
            db.add(
                ProjectMilestone(
                    project_id=project_id,
                    name=name,
                    status="pending",
                )
            )

    if len(existing) != len(MILESTONE_NAMES):
        db.flush()
        rows = db.scalars(
            select(ProjectMilestone)
            .where(ProjectMilestone.project_id == project_id)
            .order_by(ProjectMilestone.milestone_id)
        ).all()

    return rows


def serialize_milestones(db: Session, project_id: int) -> list[dict]:
    return [
        row.to_dict()
        for row in ensure_project_milestones(db, project_id)
    ]


def milestones_complete(db: Session, project_id: int) -> bool:
    rows = ensure_project_milestones(db, project_id)
    return (
        len(rows) == len(MILESTONE_NAMES)
        and all(row.status == "completed" for row in rows)
    )