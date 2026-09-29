function showSection(sectionId) {

    // HIDE ALL SECTIONS

    let sections =
        document.querySelectorAll(
            ".section"
        );

    sections.forEach(section => {

        section.style.display = "none";
    });

    // SHOW SELECTED SECTION

    document.getElementById(
        sectionId
    ).style.display = "block";

    // LOAD DATA

    if(sectionId === "deleteSection") {

        loadAlumni();
    }

    if(sectionId === "studentsSection") {

        loadStudents();
    }

    if(sectionId === "dashboardSection") {

        loadDashboardStats();
    }
}
function showRegister() {

    document.getElementById(
        "loginForm"
    ).style.display = "none";

    document.getElementById(
        "registerForm"
    ).style.display = "block";
}

function showLogin() {

    document.getElementById(
        "registerForm"
    ).style.display = "none";

    document.getElementById(
        "loginForm"
    ).style.display = "block";
}

/* REGISTER */

async function registerStudent() {

    let name =
        document.getElementById("studentName").value;

    let email =
        document.getElementById("studentEmail").value;

    let password =
        document.getElementById("studentPassword").value;

    let department =
        document.getElementById("studentDepartment").value;

    let response = await fetch(
        "http://127.0.0.1:8000/register",
        {
            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({
                name: name,
                email: email,
                password: password,
                department: department
            })
        }
    );

    let data = await response.json();

    alert(data.message);

    showLogin();
}

/* LOGIN */

async function loginStudent() {

    let email =
        document.getElementById("loginEmail").value;

    let password =
        document.getElementById("loginPassword").value;

    let response = await fetch(
        "http://127.0.0.1:8000/login",
        {
            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({
                email: email,
                password: password
            })
        }
    );

    let data = await response.json();

    if(data.message === "Login Successful") {
        localStorage.setItem("studentEmail",email);
        window.location.href =
            "dashboard.html";
    }

    else {

        alert(data.message);
    }

    localStorage.setItem(
    "studentEmail",
    email
);
}

/* SEARCH */

async function searchAlumni() {

    let keyword =
        document.getElementById(
            "searchInput"
        ).value;

    let response = await fetch(
        `http://127.0.0.1:8000/search/${keyword}`
    );

    let data = await response.json();

    let resultsDiv =
        document.getElementById(
            "results"
        );

    resultsDiv.innerHTML = "";

    if(data.length === 0) {

        resultsDiv.innerHTML =
            "<h3>No Alumni Found</h3>";

        return;
    }

    data.forEach(alumni => {

        resultsDiv.innerHTML += `

            <div class="result-card">

                <h2>${alumni.name}</h2>

                <p>
                    <strong>Company:</strong>
                    ${alumni.company}
                </p>

                <p>
                    <strong>Role:</strong>
                    ${alumni.role}
                </p>

                <p>
                    <strong>Skills:</strong>
                    ${alumni.skills}
                </p>

                <p>
                    <strong>Batch:</strong>
                    ${alumni.batch}
                </p>

                <p>
                    <strong>Contact:</strong>
                    ${alumni.contact}
                </p>

            </div>

        `;
    });
}

async function loadProfile() {

    let email =
        localStorage.getItem(
            "studentEmail"
        );

    let response = await fetch(
        `http://127.0.0.1:8000/profile/${email}`
    );

    let data = await response.json();

    document.getElementById(
        "profileName"
    ).innerText = data.name;

    document.getElementById(
        "profileDepartment"
    ).innerText = data.department;

    document.getElementById(
        "profileEmail"
    ).innerText = data.email;
}

if(window.location.pathname.includes(
    "dashboard.html"
)) {

    loadProfile();
}

async function addAlumni() {

    let response = await fetch(
        "http://127.0.0.1:8000/add-alumni",
        {
            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({

                name:
                document.getElementById(
                    "alumniName"
                ).value,

                company:
                document.getElementById(
                    "alumniCompany"
                ).value,

                role:
                document.getElementById(
                    "alumniRole"
                ).value,

                skills:
                document.getElementById(
                    "alumniSkills"
                ).value,

                batch:
                document.getElementById(
                    "alumniBatch"
                ).value,

                contact:
                document.getElementById(
                    "alumniContact"
                ).value
            })
        }
    );

    let data = await response.json();

    alert(data.message);
}

async function loadStudents() {

    let response = await fetch(
        "http://127.0.0.1:8000/students"
    );

    let data = await response.json();

    let div =
        document.getElementById(
            "studentsList"
        );

    div.innerHTML = "";

    data.forEach(student => {

        div.innerHTML += `

            <div class="result-card">

                <h3>${student.name}</h3>

                <p>${student.email}</p>

                <p>${student.department}</p>

            </div>

        `;
    });
}

if(window.location.pathname.includes(
    "admin.html"
)) {

    loadStudents();
}

async function loadAlumni() {

    let response = await fetch(
        "http://127.0.0.1:8000/alumni"
    );

    let data = await response.json();

    let div =
        document.getElementById(
            "alumniList"
        );

    div.innerHTML = "";

    data.forEach(alumni => {

        div.innerHTML += `

            <div class="result-card">

                <h2>${alumni.name}</h2>

                <p>
                    ${alumni.company}
                </p>

                <p>
                    ${alumni.role}
                </p>

                <button
    class="delete-btn"
    onclick="deleteAlumni(${alumni.id})"
>
    <i class="fa-solid fa-trash"></i>
    Delete
</button>

            </div>

        `;
    });
}
async function deleteAlumni(id) {

    let response = await fetch(
        `http://127.0.0.1:8000/delete-alumni/${id}`,
        {
            method: "DELETE"
        }
    );

    let data = await response.json();

    alert(data.message);

    loadAlumni();
}

if(window.location.pathname.includes(
    "admin.html"
)) {

    loadStudents();

    loadAlumni();
}
async function loadDashboardStats() {

    let response = await fetch(
        "http://127.0.0.1:8000/dashboard-stats"
    );

    let data = await response.json();

    document.getElementById(
        "totalStudents"
    ).innerText =
        data.total_students;

    document.getElementById(
        "totalAlumni"
    ).innerText =
        data.total_alumni;

    document.getElementById(
        "commonRole"
    ).innerText =
        data.most_common_role;

    document.getElementById(
        "totalReminders"
    ).innerText =
        data.total_reminders;
}

if(window.location.pathname.includes(
    "admin.html"
)) {

    loadStudents();

    loadAlumni();

    loadDashboardStats();
}

async function askQuestion() {

    let question =
        document.getElementById(
            "questionInput"
        ).value;

    let response = await fetch(
        `http://127.0.0.1:8000/query-assistant/${question}`
    );

    let data = await response.json();

    document.getElementById(
        "answerBox"
    ).innerHTML = `

        <div class="result-card">

            <p>${data.answer}</p>

        </div>

    `;
}

async function loadReminders() {

    let response = await fetch(
        "http://127.0.0.1:8000/reminders"
    );

    let data = await response.json();

    let div =
        document.getElementById(
            "remindersBox"
        );

    div.innerHTML = "";

    data.forEach(reminder => {

        div.innerHTML += `

            <div class="result-card">

                🔔 ${reminder.message}

            </div>

        `;
    });
}

if(window.location.pathname.includes(
    "dashboard.html"
)) {

    loadProfile();

    loadReminders();
}

function logoutStudent() {

    localStorage.removeItem(
        "studentEmail"
    );

    window.location.href =
        "index.html";
}

async function loadStudents() {

    let response = await fetch(
        "http://127.0.0.1:8000/students"
    );

    let data = await response.json();

    let div =
        document.getElementById(
            "studentsList"
        );

    div.innerHTML = "";

    data.forEach(student => {

        div.innerHTML += `

            <div class="result-card">

                <h3>${student.name}</h3>

                <p>
                    Email:
                    ${student.email}
                </p>

                <p>
                    Department:
                    ${student.department}
                </p>

            </div>

        `;
    });
}