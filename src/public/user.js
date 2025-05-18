async function handleSignup(event) {
  event.preventDefault();

  const name = document.getElementById('name').value.trim();
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;
  const confirmPassword = document.getElementById('confirmPassword').value;

  const errorDiv = document.getElementById('signupError');
  errorDiv.classList.add('d-none');
  errorDiv.textContent = '';

  try {
    const res = await fetch('/api/user/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password, confirmPassword }),
    });

    if (res.ok) {
      alert('Signup successful! You can now log in.');
      window.location.href = '/login.html';
    } else {
      const errorData = await res.json();
      errorDiv.textContent = errorData.error || 'Signup failed';
      errorDiv.classList.remove('d-none');
    }
  } catch (err) {
    errorDiv.textContent = 'Network error, please try again.';
    errorDiv.classList.remove('d-none');
  }
}

async function handleLogin(event) {
  event.preventDefault();

  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;

  const errorDiv = document.getElementById('loginError');
  errorDiv.classList.add('d-none');
  errorDiv.textContent = '';

  try {
    const res = await fetch('/api/user/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    if (res.ok) {
      const data = await res.json();
      // Save token and user info for session
      sessionStorage.setItem('token', data.token);
      sessionStorage.setItem('user', JSON.stringify(data.user));

      alert('Login successful! Redirecting to lobby...');
      window.location.href = '/'; // Redirect to your lobby or home page
    } else {
      const errorData = await res.json();
      errorDiv.textContent = errorData.error || 'Login failed';
      errorDiv.classList.remove('d-none');
    }
  } catch (err) {
    errorDiv.textContent = 'Network error, please try again.';
    errorDiv.classList.remove('d-none');
  }
}

// Attach event listeners after DOM loads
document.addEventListener('DOMContentLoaded', () => {
  const signupForm = document.getElementById('signupForm');
  if (signupForm) signupForm.addEventListener('submit', handleSignup);

  const loginForm = document.getElementById('loginForm');
  if (loginForm) loginForm.addEventListener('submit', handleLogin);
});
