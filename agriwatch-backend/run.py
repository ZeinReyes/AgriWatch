from app import create_app

app = create_app()

print()
print("===== EMAIL CONFIG CHECK =====")
print("MAIL_HOST:", app.config.get("MAIL_HOST"))
print("MAIL_PORT:", app.config.get("MAIL_PORT"))
print("MAIL_USERNAME:", app.config.get("MAIL_USERNAME"))
print("MAIL_PASSWORD SET:", bool(app.config.get("MAIL_PASSWORD")))
print("MAIL_PASSWORD LENGTH:", len(app.config.get("MAIL_PASSWORD") or ""))
print("MAIL_FROM:", app.config.get("MAIL_FROM"))
print("==============================")
print()

if __name__ == "__main__":
    app.run(
        host="127.0.0.1",
        port=5000,
        debug=True
    )