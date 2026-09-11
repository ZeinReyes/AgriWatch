from app import create_app
from app.extensions import db
from app.models.user import User


EMAIL = "zbcreyes@gmail.com"


app = create_app()

with app.app_context():
    user = User.query.filter_by(email=EMAIL).first()

    if user is None:
        print(f"ERROR: No user found with email: {EMAIL}")

    else:
        print("User found:")
        print(f"  ID:       {user.id}")
        print(f"  Name:     {user.full_name}")
        print(f"  Email:    {user.email}")
        print(f"  Old role: {user.role}")

        if user.role == "admin":
            print("\nThis user is already an admin.")

        else:
            user.role = "admin"
            db.session.commit()

            print("\nSUCCESS!")
            print(f"{user.email} is now an admin.")
            print(f"New role: {user.role}")