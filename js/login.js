import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'
// Initialize Supabase client
const SUPABASE_URL = 'https://glyipynsnsrnhcypgffv.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdseWlweW5zbnNybmhjeXBnZmZ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDcxNjI3MTksImV4cCI6MjA2MjczODcxOX0.eSdeDnzJmilfQqA0SWSpe-1wXBu8Hp4QlORKfgFb5bU';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('login-form');
  const loginButton = document.getElementById('login-button');
  
  // Handle login form submission
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const email = document.getElementById('email').value;
      const password = document.getElementById('password').value;
      const rememberMe = document.getElementById('remember').checked;
      
      // Form validation
      if (!email || !password) {
        showError('error-message', 'Veuillez entrer votre email et votre mot de passe.');
        return;
      }
      
      // Start loading state
      setButtonLoading(loginButton, true);
      
      try {
        // Set session persistence based on "Remember me" checkbox
        const persistenceType = rememberMe ? 'local' : 'session';
        
        // Sign in with Supabase
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
          options: {
            persistSession: true,
            sessionPersistence: persistenceType
          }
        });
        
        if (error) {
          console.error('Login error:', error);
          showError('error-message', 'Email ou mot de passe incorrect.');
          setButtonLoading(loginButton, false);
          return;
        }
        
        // Login successful
        showSuccess('success-message', 'Connexion réussie! Redirection en cours...');
        
        // Redirect to library
        setTimeout(() => {
          window.location.href = 'library.html';
        }, 1000);
        
      } catch (error) {
        console.error('Unexpected error during login:', error);
        showError('error-message', 'Une erreur inattendue s\'est produite. Veuillez réessayer.');
        setButtonLoading(loginButton, false);
      }
    });
  }
  
  // Handle "Forgot password" flow
  const forgotPasswordLink = document.querySelector('.forgot-password');
  if (forgotPasswordLink) {
    forgotPasswordLink.addEventListener('click', async (e) => {
      e.preventDefault();
      
      const email = document.getElementById('email').value;
      
      if (!email) {
        showError('error-message', 'Veuillez entrer votre email pour réinitialiser votre mot de passe.');
        return;
      }
      
      try {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password.html`,
        });
        
        if (error) {
          console.error('Reset password error:', error);
          showError('error-message', error.message || 'Erreur lors de l\'envoi du lien de réinitialisation.');
          return;
        }
        
        showSuccess('success-message', 'Un lien de réinitialisation a été envoyé à votre adresse email.');
        
      } catch (error) {
        console.error('Unexpected error during password reset:', error);
        showError('error-message', 'Une erreur inattendue s\'est produite. Veuillez réessayer.');
      }
    });
  }
});
