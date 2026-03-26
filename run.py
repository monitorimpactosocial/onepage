from app import create_app
from app.seed import seed_database

app = create_app()

if __name__ == "__main__":
    import sys
    if len(sys.argv) > 1 and sys.argv[1] == "seed":
        with app.app_context():
            seed_database(reset=False)
    else:
        app.run(host="0.0.0.0", port=5000, debug=True)
