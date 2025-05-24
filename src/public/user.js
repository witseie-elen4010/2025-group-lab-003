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
      showSuccessNotification('Signup successful! Redirecting to login...', {
        title: '🎉 Welcome!',
        duration: 2500
      });

      // Automatically redirect to login page
      setTimeout(() => {
        window.location.href = '/login.html';
      }, 2500);
    } else {
      const errorData = await res.json();
      showErrorNotification(errorData.error || 'Signup failed', {
        title: '❌ Signup Failed'
      });
    }
  } catch (err) {
    showErrorNotification('Network error, please try again.', {
      title: '🌐 Connection Error'
    });
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

      showSuccessNotification('Login successful! Redirecting to lobby...', {
        title: '🎮 Welcome Back!',
        duration: 2000
      });

      // Automatically redirect to lobby
      setTimeout(() => {
        window.location.href = '/'; // Redirect to your lobby or home page
      }, 2000);
    } else {
      const errorData = await res.json();
      showErrorNotification(errorData.error || 'Login failed', {
        title: '❌ Login Failed'
      });
    }
  } catch (err) {
    showErrorNotification('Network error, please try again.', {
      title: '🌐 Connection Error'
    });
  }
}

// Attach event listeners after DOM loads
document.addEventListener('DOMContentLoaded', () => {
  const signupForm = document.getElementById('signupForm');
  if (signupForm) signupForm.addEventListener('submit', handleSignup);

  const loginForm = document.getElementById('loginForm');
  if (loginForm) loginForm.addEventListener('submit', handleLogin);
});
