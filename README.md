# Career-Booklet
# alembic migration run
alembic stamp head/
alembic revision --autogenerate -m "create user table"/
alembic upgrade head

# run server
uvicorn app.main:app --reload

# run all services 
1) auth services - uvicorn app.main:app --host 127.0.0.1 --port 9000 --reload
2) profile management services - uvicorn app.main:app --host 127.0.0.1 --port 9001 --reload
3) api gateway - uvicorn app.main:app --host 127.0.0.1 --port 9002 --reload
4) Institution services- uvicorn app.main:app --host 127.0.0.1 --port 9003 --reload

# start postgresql server
pg_ctl -D "C:\Program Files\PostgreSQL\17\data" start


