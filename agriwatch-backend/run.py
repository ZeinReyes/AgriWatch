from app import create_app
from app.extensions import db
from sqlalchemy import inspect

app = create_app()

# =================================================
# PRINT DATABASE TABLES
# =================================================

with app.app_context():

    print("\n========================================")
    print("AGRIWATCH DATABASE TABLES")
    print("========================================")

    # Tables known by SQLAlchemy
    print("\nSQLAlchemy Models:")

    for table in db.metadata.tables.keys():
        print(f"- {table}")

    # Tables physically existing in database
    print("\nActual Database Tables:")

    inspector = inspect(db.engine)
    actual_tables = inspector.get_table_names()

    for table in actual_tables:
        print(f"- {table}")

    print("========================================\n")


if __name__ == "__main__":
    app.run(
        host="127.0.0.1",
        port=5000,
        debug=True
    )