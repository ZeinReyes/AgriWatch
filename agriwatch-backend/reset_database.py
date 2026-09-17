from app import create_app
from app.extensions import db


def reset_database():
    app = create_app()

    with app.app_context():
        print("\nWARNING: This will permanently delete ALL AgriWatch data.")
        print("This includes users, farms, crops, monitoring records, alerts, OTPs, etc.")
        print()

        confirmation = input(
            'Type "RESET" to continue: '
        ).strip()

        if confirmation != "RESET":
            print("\nDatabase reset cancelled.")
            return

        print("\nDropping all tables...")
        db.drop_all()

        print("Recreating all tables...")
        db.create_all()

        print("\nDatabase reset completed successfully.")
        print("AgriWatch is now starting with a completely empty database.")


if __name__ == "__main__":
    reset_database()