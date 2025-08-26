document.addEventListener('DOMContentLoaded', function () {
  // DOM tables
  const homeSection = document.getElementById('home-section');
  const loginSection = document.getElementById('login-section');
  const registerSection = document.getElementById('register-section');
  const studentSection = document.getElementById('student-section');
  const teacherSection = document.getElementById('teacher-section');
  const courseEnrollmentsSection = document.getElementById('course-enrollments-section');

  const authLinks = document.getElementById('auth-links');
  const userLinks = document.getElementById('user-links');
  const usernameDisplay = document.getElementById('username-display');

  const loginForm = document.getElementById('login-form');
  const registerForm = document.getElementById('register-form');
  const createCourseForm = document.getElementById('create-course-form');

  const availableCourses = document.getElementById('available-courses');
  const studentEnrollments = document.getElementById('student-enrollments');
  const teacherCourses = document.getElementById('teacher-courses');
  const courseEnrollments = document.getElementById('course-enrollments');
  const selectedCourseName = document.getElementById('selected-course-name');

  document.getElementById('home-link').addEventListener('click', showHome);
  document.getElementById('login-link').addEventListener('click', showLogin);
  document.getElementById('register-link').addEventListener('click', showRegister);
  document.getElementById('logout-link').addEventListener('click', logout);


  const API_URL = 'http://localhost:3000/api';


  let currentUser = null;
  let token = localStorage.getItem('token');

  loginForm.addEventListener('submit', handleLogin);
  registerForm.addEventListener('submit', handleRegister);
  createCourseForm.addEventListener('submit', handleCreateCourse);
  checkAuthStatus();

  function showHome() {
    hideAllSections();
    homeSection.classList.remove('hidden');
  }

  function showLogin() {
    hideAllSections();
    loginSection.classList.remove('hidden');
  }

  function showRegister() {
    hideAllSections();
    registerSection.classList.remove('hidden');
  }

  function hideAllSections() {
    homeSection.classList.add('hidden');
    loginSection.classList.add('hidden');
    registerSection.classList.add('hidden');
    studentSection.classList.add('hidden');
    teacherSection.classList.add('hidden');
    courseEnrollmentsSection.classList.add('hidden');
  }

  function checkAuthStatus() {
    if (token) {
      fetch(`${API_URL}/user`, {
        headers: {
          'Authorization': token
        }
      })
        .then(response => {
          if (!response.ok) {
            throw new Error('Authentication failed');
          }
          return response.json();
        })
        .then(user => {
          currentUser = user;
          updateUI();
        })
        .catch(error => {
          console.error('Error checking auth status:', error);
          logout();
        });
    } else {
      showHome();
    }
  }

  function updateUI() {
    authLinks.classList.add('hidden');
    userLinks.classList.remove('hidden');
    usernameDisplay.textContent = currentUser.username;
    hideAllSections();
    if (currentUser.role === 'student') {
      studentSection.classList.remove('hidden');
      loadStudentData();
    } else if (currentUser.role === 'teacher') {
      teacherSection.classList.remove('hidden');
      loadTeacherData();
    }
  }

  function handleLogin(event) {
    event.preventDefault();

    const username = document.getElementById('login-username').value;
    const password = document.getElementById('login-password').value;

    fetch(`${API_URL}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ username, password })
    })
      .then(response => {
        if (!response.ok) {
          throw new Error('Login failed');
        }
        return response.json();
      })
      .then(data => {
        token = `Bearer ${data.accessToken}`;
        localStorage.setItem('token', token);
        currentUser = {
          id: data.id,
          username: data.username,
          role: data.role
        };
        updateUI();
        loginForm.reset();
      })
      .catch(error => {
        console.error('Error during login:', error);
        alert('Login failed. Please check your credentials.');
      });
  }

  function handleRegister(event) {
    event.preventDefault();

    const username = document.getElementById('register-username').value;
    const password = document.getElementById('register-password').value;
    const email = document.getElementById('register-email').value;
    const role = document.getElementById('register-role').value;

    fetch(`${API_URL}/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ username, password, email, role })
    })
      .then(response => {
        if (!response.ok) {
          throw new Error('Registration failed');
        }
        return response.json();
      })
      .then(data => {
        alert('Registration successful! Please login.');
        showLogin();
        registerForm.reset();
      })
      .catch(error => {
        console.error('Error during registration:', error);
        alert('Registration failed. Please try again.');
      });
  }

  function logout() {
    localStorage.removeItem('token');
    currentUser = null;
    token = null;
    authLinks.classList.remove('hidden');
    userLinks.classList.add('hidden');
    showHome();
  }

  function loadStudentData() {
    fetch(`${API_URL}/courses`, {
      headers: {
        'Authorization': token
      }
    })
      .then(response => response.json())
      .then(courses => {
        availableCourses.innerHTML = '';
        courses.forEach(course => {
          const courseCard = document.createElement('div');
          courseCard.className = 'course-card';
          courseCard.innerHTML = `
          <h3>${course.name}</h3>
          <p><strong>Teacher:</strong> ${course.teacher_name}</p>
          <p>${course.description || 'No description available.'}</p>
          <button class="enroll-btn" data-course-id="${course.id}">Enroll</button>
        `;
          availableCourses.appendChild(courseCard);
        });

        document.querySelectorAll('.enroll-btn').forEach(button => {
          button.addEventListener('click', function () {
            const courseId = this.getAttribute('data-course-id');
            enrollCourse(courseId);
          });
        });
      })
      .catch(error => console.error('Error loading courses:', error));

    loadEnrollments();
  }

  function loadTeacherData() {
    fetch(`${API_URL}/courses`, {
      headers: {
        'Authorization': token
      }
    })
      .then(response => response.json())
      .then(courses => {
        teacherCourses.innerHTML = '';
        courses.forEach(course => {
          const courseCard = document.createElement('div');
          courseCard.className = 'course-card';
          courseCard.innerHTML = `
          <h3>${course.name}</h3>
          <p>${course.description || 'No description available.'}</p>
          <button class="view-enrollments-btn" data-course-id="${course.id}" data-course-name="${course.name}">View Enrollments</button>
        `;
          teacherCourses.appendChild(courseCard);
        });

        document.querySelectorAll('.view-enrollments-btn').forEach(button => {
          button.addEventListener('click', function () {
            const courseId = this.getAttribute('data-course-id');
            const courseName = this.getAttribute('data-course-name');
            loadCourseEnrollments(courseId, courseName);
          });
        });
      })
      .catch(error => console.error('Error loading courses:', error));
  }

  function handleCreateCourse(event) {
    event.preventDefault();

    const name = document.getElementById('course-name').value;
    const description = document.getElementById('course-description').value;

    fetch(`${API_URL}/courses`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token
      },
      body: JSON.stringify({ name, description })
    })
      .then(response => {
        if (!response.ok) {
          throw new Error('Course creation failed');
        }
        return response.json();
      })
      .then(data => {
        alert('Course created successfully!');
        createCourseForm.reset();
        loadTeacherData();
      })
      .catch(error => {
        console.error('Error creating course:', error);
        alert('Failed to create course. Please try again.');
      });
  }

  function enrollCourse(courseId) {
    fetch(`${API_URL}/enroll`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token
      },
      body: JSON.stringify({ courseId })
    })
      .then(response => {
        if (!response.ok) {
          return response.json().then(err => { throw new Error(err.message || 'Enrollment failed'); });
        }
        return response.json();
      })
      .then(data => {
        alert('Enrolled successfully!');
        loadEnrollments();
      })
      .catch(error => {
        console.error('Error during enrollment:', error);
        alert(error.message || 'Failed to enroll. Please try again.');
      });
  }

  function loadEnrollments() {
    fetch(`${API_URL}/enrollments`, {
      headers: {
        'Authorization': token
      }
    })
      .then(response => response.json())
      .then(enrollments => {
        studentEnrollments.innerHTML = '';
        enrollments.forEach(enrollment => {
          const row = document.createElement('tr');
          row.innerHTML = `
          <td>${enrollment.course_name}</td>
          <td>${enrollment.teacher_name}</td>
          <td class="status-${enrollment.status}">${enrollment.status.charAt(0).toUpperCase() + enrollment.status.slice(1)}</td>
        `;
          studentEnrollments.appendChild(row);
        });
      })
      .catch(error => console.error('Error loading enrollments:', error));
  }

  function loadCourseEnrollments(courseId, courseName) {
    courseEnrollmentsSection.classList.remove('hidden');
    selectedCourseName.textContent = courseName;

    fetch(`${API_URL}/enrollments?courseId=${courseId}`, {
      headers: {
        'Authorization': token
      }
    })
      .then(response => response.json())
      .then(enrollments => {
        courseEnrollments.innerHTML = '';
        enrollments.forEach(enrollment => {
          const row = document.createElement('tr');
          row.innerHTML = `
          <td>${enrollment.student_name}</td>
          <td class="status-${enrollment.status}">${enrollment.status.charAt(0).toUpperCase() + enrollment.status.slice(1)}</td>
          <td>
            <button class="grade-btn" data-enrollment-id="${enrollment.id}" data-status="passed">Pass</button>
            <button class="grade-btn" data-enrollment-id="${enrollment.id}" data-status="failed">Fail</button>
          </td>
        `;
          courseEnrollments.appendChild(row);
        });

        document.querySelectorAll('.grade-btn').forEach(button => {
          button.addEventListener('click', function () {
            const enrollmentId = this.getAttribute('data-enrollment-id');
            const status = this.getAttribute('data-status');
            updateEnrollmentStatus(enrollmentId, status);
          });
        });
      })
      .catch(error => console.error('Error loading course enrollments:', error));
  }

  function updateEnrollmentStatus(enrollmentId, status) {
    fetch(`${API_URL}/grade/${enrollmentId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token
      },
      body: JSON.stringify({ status })
    })
      .then(response => {
        if (!response.ok) {
          throw new Error('Failed to update enrollment status');
        }
        return response.json();
      })
      .then(data => {
        alert('Status updated successfully!');
        const courseId = document.querySelector('.view-enrollments-btn[data-course-name="' + selectedCourseName.textContent + '"]').getAttribute('data-course-id');
        loadCourseEnrollments(courseId, selectedCourseName.textContent);
      })
      .catch(error => {
        console.error('Error updating enrollment status:', error);
        alert('Failed to update status. Please try again.');
      });
  }
});