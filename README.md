# Career-Booklet
# alembic migration run
alembic revision --autogenerate -m "create user table"\
alembic upgrade head

# run server
uvicorn app.main:app --reload


