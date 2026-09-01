from app.models import Base


def test_phase_3a_foundation_tables_registered():
    """Verify that all 5 Phase 3A foundation tables are registered in SQLAlchemy metadata."""
    tables = Base.metadata.tables.keys()
    
    assert "users" in tables
    assert "user_roles" in tables
    assert "junctions" in tables
    assert "traffic_telemetry" in tables
    assert "system_audit_logs" in tables


def test_users_table_schema():
    """Verify users table columns."""
    table = Base.metadata.tables["users"]
    column_names = [c.name for c in table.columns]
    
    assert "id" in column_names
    assert "name" in column_names
    assert "email" in column_names
    assert "password_hash" in column_names
    assert "phone_number" in column_names
    assert "is_active" in column_names
    assert "created_at" in column_names


def test_junctions_table_schema():
    """Verify junctions table columns."""
    table = Base.metadata.tables["junctions"]
    column_names = [c.name for c in table.columns]
    
    assert "id" in column_names
    assert "code" in column_names
    assert "name" in column_names
    assert "sector" in column_names
    assert "status" in column_names
    assert "current_green_time" in column_names
