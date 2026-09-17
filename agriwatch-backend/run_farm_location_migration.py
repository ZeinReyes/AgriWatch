import os
import pymysql
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    raise RuntimeError("DATABASE_URL was not found in your .env file.")


def parse_database_url(url):
    # Expected:
    # mysql+pymysql://USER:PASSWORD@HOST:PORT/DATABASE?...
    from urllib.parse import urlparse

    parsed = urlparse(url)

    return {
        "host": parsed.hostname,
        "port": parsed.port or 3306,
        "user": parsed.username,
        "password": parsed.password,
        "database": parsed.path.lstrip("/"),
    }


def main():
    config = parse_database_url(DATABASE_URL)

    print("=" * 60)
    print("AGRIWATCH DATABASE MIGRATION")
    print("=" * 60)
    print("Connecting to Aiven MySQL...")
    print(f"Host: {config['host']}")
    print(f"Database: {config['database']}")
    print()

    connection = pymysql.connect(
        host=config["host"],
        port=config["port"],
        user=config["user"],
        password=config["password"],
        database=config["database"],
        ssl={},
        cursorclass=pymysql.cursors.DictCursor,
        autocommit=False,
    )

    try:
        with connection.cursor() as cursor:

            # Check whether latitude already exists
            cursor.execute("""
                SELECT COUNT(*) AS count
                FROM INFORMATION_SCHEMA.COLUMNS
                WHERE TABLE_SCHEMA = DATABASE()
                  AND TABLE_NAME = 'farms'
                  AND COLUMN_NAME = 'latitude'
            """)
            latitude_exists = cursor.fetchone()["count"] > 0

            # Check whether longitude already exists
            cursor.execute("""
                SELECT COUNT(*) AS count
                FROM INFORMATION_SCHEMA.COLUMNS
                WHERE TABLE_SCHEMA = DATABASE()
                  AND TABLE_NAME = 'farms'
                  AND COLUMN_NAME = 'longitude'
            """)
            longitude_exists = cursor.fetchone()["count"] > 0

            if latitude_exists and longitude_exists:
                print("latitude and longitude already exist.")
                print("No database changes were needed.")
                connection.rollback()
                return

            if not latitude_exists:
                print("Adding latitude column...")
                cursor.execute("""
                    ALTER TABLE farms
                    ADD COLUMN latitude DECIMAL(10, 7) NULL
                """)

            if not longitude_exists:
                print("Adding longitude column...")
                cursor.execute("""
                    ALTER TABLE farms
                    ADD COLUMN longitude DECIMAL(10, 7) NULL
                """)

        connection.commit()

        print()
        print("Migration completed successfully.")
        print()
        print("The farms table now supports:")
        print("- latitude")
        print("- longitude")
        print()
        print("Existing farms were NOT deleted or changed.")
        print("Their coordinates are currently NULL.")
        print("=" * 60)

    except Exception as error:
        connection.rollback()
        print()
        print("Migration failed.")
        print(f"Error: {error}")
        raise

    finally:
        connection.close()


if __name__ == "__main__":
    main()
