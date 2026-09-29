from sqlalchemy import create_engine

DATABASE_URL = "mysql+pymysql://root:Vijay1*SM@localhost/alumni_db"

engine = create_engine(DATABASE_URL)