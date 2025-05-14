document.addEventListener('DOMContentLoaded', () => {
  const registerForm = document.getElementById('register-form');
  const passwordInput = document.getElementById('password');
  const confirmPasswordInput = document.getElementById('confirm-password');
  const passwordStrength = document.getElementById('password-strength');
  const strengthText = document.getElementById('strength-text');
  const registerButton = document.getElementById('register-button');
  
  // Update password strength indicator in real-time
  if (passwordInput && passwordStrength && strengthText) {
    passwordInput.addEventListener('input', () => {
      updatePasswordStrength(passwordInput.value, passwordStrength, strengthText);
    });
  }
  
  // Handle registration form submission
  if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const email = document.getElementById('email').value;
      const password = passwordInput.value;
      const confirmPassword = confirmPasswordInput.value;
      const termsAccepted = document.getElementById('terms').checked;
      
      // Form validation
      if (!email || !password || !confirmPassword) {
        showError('error-message', 'Veuillez remplir tous les champs.');
        return;
      }
      
      if (password !== confirmPassword) {
        showError('error-message', 'Les mots de passe ne correspondent pas.');
        return;
      }
      
      if (password.length < 6) {
        showError('error-message', 'Le mot de passe doit contenir au moins 6 caractères.');
        return;
      }
      
      if (!termsAccepted) {
        showError('error-message', 'Vous devez accepter les conditions d\'utilisation.');
        return;
      }
      
      // Start loading state
      setButtonLoading(registerButton, true);
      
      try {
        // Register user with Supabase
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              name: email.split('@')[0], // Default name from email
              joined: new Date().toISOString()
            }
          }
        });
        
        if (error) {
          console.error('Registration error:', error);
          showError('error-message', error.message || 'Erreur lors de l\'inscription. Veuillez réessayer.');
          setButtonLoading(registerButton, false);
          return;
        }
        
        // Registration successful
        showSuccess('success-message', 'Inscription réussie! Vous allez être redirigé vers la bibliothèque.');
        
        // Redirect to library after a short delay
        setTimeout(() => {
          window.location.href = 'library.html';
        }, 2000);
        
      } catch (error) {
        console.error('Unexpected error during registration:', error);
        showError('error-message', 'Une erreur inattendue s\'est produite. Veuillez réessayer.');
        setButtonLoading(registerButton, false);
      }
    });
  }
});