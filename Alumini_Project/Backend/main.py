from fastapi import FastAPI, Request
from sqlalchemy import text
from database import engine
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/search/{keyword}")
def search_alumni(keyword: str):

    with engine.connect() as conn:

        query = text("""

            SELECT * FROM alumni

            WHERE

            name LIKE :keyword

            OR company LIKE :keyword

            OR role LIKE :keyword

            OR skills LIKE :keyword

        """)

        result = conn.execute(
            query,
            {
                "keyword": f"%{keyword}%"
            }
        )

        data = []

        for row in result:

            data.append({

                "id": row[0],

                "name": row[1],

                "company": row[2],

                "role": row[3],

                "skills": row[4],

                "batch": row[5],

                "contact": row[6]
            })

    return data

@app.post("/register")
async def register(request: Request):

    data = await request.json()

    name = data["name"]
    email = data["email"]
    password = data["password"]
    department = data["department"]

    with engine.connect() as conn:

        query = text("""

            INSERT INTO students
            (name, email, password, department)

            VALUES
            (:name, :email, :password, :department)

        """)

        conn.execute(
            query,
            {
                "name": name,
                "email": email,
                "password": password,
                "department": department
            }
        )

        conn.commit()

    return {
        "message": "Student Registered Successfully"
    }

@app.post("/login")
async def login(request: Request):

    data = await request.json()

    email = data["email"]
    password = data["password"]

    with engine.connect() as conn:

        query = text("""

            SELECT * FROM students

            WHERE
            email = :email
            AND password = :password

        """)

        result = conn.execute(
            query,
            {
                "email": email,
                "password": password
            }
        )

        user = result.fetchone()

    if user:

        return {
            "message": "Login Successful"
        }

    else:

        return {
            "message": "Invalid Email or Password"
        }

@app.get("/profile/{email}")
def get_profile(email: str):

    with engine.connect() as conn:

        query = text("""

            SELECT
            name,
            department,
            email

            FROM students

            WHERE email = :email

        """)

        result = conn.execute(
            query,
            {
                "email": email
            }
        )

        user = result.fetchone()

    if user:

        return {

            "name": user[0],

            "department": user[1],

            "email": user[2]
        }

    return {
        "message": "User Not Found"
    }

@app.post("/add-alumni")
async def add_alumni(request: Request):

    data = await request.json()

    with engine.connect() as conn:

        query = text("""

            INSERT INTO alumni
            (name, company, role, skills,
             batch_year, contact)

            VALUES
            (:name, :company, :role,
             :skills, :batch, :contact)

        """)

        conn.execute(
            query,
            {
                "name": data["name"],
                "company": data["company"],
                "role": data["role"],
                "skills": data["skills"],
                "batch": data["batch"],
                "contact": data["contact"]
            }
        )

        conn.commit()

    return {
        "message": "Alumni Added Successfully"
    }
@app.delete("/delete-alumni/{id}")
def delete_alumni(id: int):

    with engine.connect() as conn:

        query = text("""

            DELETE FROM alumni

            WHERE id = :id

        """)

        conn.execute(
            query,
            {
                "id": id
            }
        )

        conn.commit()

    return {
        "message": "Alumni Deleted Successfully"
    }

@app.get("/alumni")
def get_alumni():

    with engine.connect() as conn:

        result = conn.execute(
            text("SELECT * FROM alumni")
        )

        data = []

        for row in result:

            data.append({

                "id": row[0],

                "name": row[1],

                "company": row[2],

                "role": row[3],

                "skills": row[4],

                "batch": row[5],

                "contact": row[6]
            })

    return data
@app.get("/students")
def get_students():

    with engine.connect() as conn:

        result = conn.execute(
            text("SELECT * FROM students")
        )

        data = []

        for row in result:

            data.append({

                "id": row[0],

                "name": row[1],

                "email": row[2],

                "department": row[4]
            })

    return data

@app.get("/dashboard-stats")
def dashboard_stats():

    with engine.connect() as conn:

        # TOTAL STUDENTS

        students_query = text("""
            SELECT COUNT(*) FROM students
        """)

        total_students = conn.execute(
                students_query
            ).scalar()

        # TOTAL ALUMNI

        alumni_query = text("""
            SELECT COUNT(*) FROM alumni
        """)

        total_alumni = conn.execute(
                alumni_query
            ).scalar()

        # MOST COMMON ROLE

        role_query = text("""

            SELECT role, COUNT(*) as total

            FROM alumni

            GROUP BY role

            ORDER BY total DESC

            LIMIT 1

        """)

        role_result = conn.execute(role_query).fetchone()

        most_common_role = role_result[0] if role_result else "No Data"

        # TOTAL REMINDERS

        reminders_query = text("""
            SELECT COUNT(*) FROM reminders
        """)

        total_reminders = conn.execute(
                reminders_query
            ).scalar()

    return {

        "total_students": total_students,

        "total_alumni": total_alumni,

        "most_common_role": most_common_role,

        "total_reminders": total_reminders
    }

@app.get("/query-assistant/{question}")
def query_assistant(question: str):

    question = question.lower()

    if "internship" in question:

        answer = """

        Build projects,
        improve coding skills,
        create LinkedIn profile,
        and apply through company portals.

        """

    elif "software" in question:

        answer = """

        Learn Python,
        SQL,
        DSA,
        projects,
        and communication skills.

        """

    elif "placement" in question:

        answer = """

        Practice aptitude,
        coding problems,
        mock interviews,
        and resume building.

        """

    else:

        answer = """

        Please ask career related questions.

        """

    return {
        "answer": answer
    }

@app.get("/reminders")
def get_reminders():

    with engine.connect() as conn:

        result = conn.execute(
            text("SELECT * FROM reminders")
        )

        data = []

        for row in result:

            data.append({

                "id": row[0],

                "message": row[1]
            })

    return data