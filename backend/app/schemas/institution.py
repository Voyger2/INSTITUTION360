from pydantic import BaseModel, ConfigDict


class InstitutionOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    aicte_permanent_id: str
    name: str
    region_code: str
    state: str
    district: str
    type: str
    established_year: int
    address: str
    website: str | None
    contact_email: str | None
    contact_phone: str | None
    is_demo_data: bool
