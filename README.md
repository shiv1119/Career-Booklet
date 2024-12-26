# Career-Booklet
# alembic migration run
alembic revision --autogenerate -m "create user table"
alembic upgrade head

# docker compose build
docker-compose up --build

# run server
uvicorn app.main:app --reload


